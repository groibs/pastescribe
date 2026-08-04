import type { JobState, TypedSupabaseClient } from "@pastescribe/database";

export type JobProgressStage =
  | "received"
  | "preparing"
  | "transcribing"
  | "finalizing"
  | "completed";

export type JobStatusSnapshot = {
  job: {
    id: string;
    state: JobState;
    durationSeconds: number | null;
    errorCode: string | null;
    retryCount: number;
    maxRetries: number;
    createdAt: string;
    updatedAt: string;
  };
  steps: Array<{
    id: string;
    fromState: string | null;
    toState: string;
    createdAt: string;
  }>;
  transcript: null | {
    id: string;
    language: string;
    source: "ai" | "native_captions";
    model: string | null;
    text: string;
    createdAt: string;
    segments: Array<{
      id: string;
      position: number;
      startMs: number;
      endMs: number;
      text: string;
      speakerLabel: string | null;
    }>;
  };
};

export class JobStatusReadError extends Error {
  constructor(
    public readonly code: "not_found" | "read_failed",
    options?: ErrorOptions
  ) {
    super(code, options);
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isJobId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function jobStateToProgressStage(state: JobState): JobProgressStage {
  if (["created", "validating", "queued"].includes(state)) {
    return "received";
  }
  if (
    [
      "awaiting_user_confirmation",
      "resolving_metadata",
      "fetching_captions",
      "acquiring_media",
      "extracting_audio",
      "normalizing_audio",
    ].includes(state)
  ) {
    return "preparing";
  }
  if (["transcribing", "diarizing"].includes(state)) {
    return "transcribing";
  }
  if (["postprocessing", "indexing"].includes(state)) {
    return "finalizing";
  }
  return "completed";
}

export function shouldPollJob(state: JobState): boolean {
  return ![
    "awaiting_user_confirmation",
    "completed",
    "failed",
    "cancelled",
    "expired",
  ].includes(state);
}

export function canCancelJob(state: JobState): boolean {
  return ![
    "awaiting_user_confirmation",
    "completed",
    "failed",
    "cancel_requested",
    "cancelled",
    "expired",
  ].includes(state);
}

export async function readJobStatus(
  supabase: TypedSupabaseClient,
  jobId: string
): Promise<JobStatusSnapshot> {
  const { data: job, error: jobError } = await supabase
    .from("transcription_jobs")
    .select(
      "id,state,duration_seconds,error_code,retry_count,max_retries,created_at,updated_at"
    )
    .eq("id", jobId)
    .maybeSingle();

  if (jobError) {
    throw new JobStatusReadError("read_failed", { cause: jobError });
  }
  if (!job) {
    throw new JobStatusReadError("not_found");
  }

  const [{ data: steps, error: stepsError }, { data: transcript, error: transcriptError }] =
    await Promise.all([
      supabase
        .from("job_steps")
        .select("id,from_state,to_state,created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true }),
      supabase
        .from("transcripts")
        .select("id,language,source,model,text,created_at")
        .eq("job_id", jobId)
        .maybeSingle(),
    ]);

  if (stepsError || transcriptError) {
    throw new JobStatusReadError("read_failed", {
      cause: stepsError ?? transcriptError,
    });
  }

  let transcriptSnapshot: JobStatusSnapshot["transcript"] = null;
  if (transcript) {
    const { data: segments, error: segmentsError } = await supabase
      .from("transcript_segments")
      .select("id,position,start_ms,end_ms,text,speaker_label")
      .eq("transcript_id", transcript.id)
      .order("position", { ascending: true });

    if (segmentsError) {
      throw new JobStatusReadError("read_failed", { cause: segmentsError });
    }

    transcriptSnapshot = {
      id: transcript.id,
      language: transcript.language,
      source: transcript.source,
      model: transcript.model,
      text: transcript.text,
      createdAt: transcript.created_at,
      segments: (segments ?? []).map((segment) => ({
        id: segment.id,
        position: segment.position,
        startMs: segment.start_ms,
        endMs: segment.end_ms,
        text: segment.text,
        speakerLabel: segment.speaker_label,
      })),
    };
  }

  return {
    job: {
      id: job.id,
      state: job.state,
      durationSeconds: job.duration_seconds,
      errorCode: job.error_code,
      retryCount: job.retry_count,
      maxRetries: job.max_retries,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    },
    steps: (steps ?? []).map((step) => ({
      id: step.id,
      fromState: step.from_state,
      toState: step.to_state,
      createdAt: step.created_at,
    })),
    transcript: transcriptSnapshot,
  };
}
