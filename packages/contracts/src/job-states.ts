import { z } from "zod";

/**
 * Máquina de estados canônica do job de transcrição.
 * Fonte única para web e worker — ver docs/ARCHITECTURE.md.
 * Toda transição fora de JOB_TRANSITIONS é inválida e deve ser
 * rejeitada no servidor.
 */
export const JOB_STATES = [
  "created",
  "validating",
  "awaiting_user_confirmation",
  "queued",
  "resolving_metadata",
  "fetching_captions",
  "acquiring_media",
  "extracting_audio",
  "normalizing_audio",
  "transcribing",
  "diarizing",
  "postprocessing",
  "indexing",
  "completed",
  "failed",
  "cancel_requested",
  "cancelled",
  "expired",
] as const;

export const jobStateSchema = z.enum(JOB_STATES);
export type JobState = z.infer<typeof jobStateSchema>;

export const TERMINAL_JOB_STATES = [
  "completed",
  "failed",
  "cancelled",
  "expired",
] as const satisfies readonly JobState[];

export type TerminalJobState = (typeof TERMINAL_JOB_STATES)[number];

const PIPELINE_ORDER = [
  "queued",
  "resolving_metadata",
  "fetching_captions",
  "acquiring_media",
  "extracting_audio",
  "normalizing_audio",
  "transcribing",
  "diarizing",
  "postprocessing",
  "indexing",
] as const satisfies readonly JobState[];

function pipelineSuccessors(state: JobState): JobState[] {
  const index = PIPELINE_ORDER.indexOf(
    state as (typeof PIPELINE_ORDER)[number]
  );
  if (index === -1) {
    return [];
  }
  // Etapas do pipeline são puláveis (ex.: upload não tem
  // resolving_metadata/fetching_captions; diarizing é opcional),
  // então qualquer etapa posterior é uma sucessora válida.
  const rest = PIPELINE_ORDER.slice(index + 1);
  return [...rest, "completed"];
}

/** Transições válidas por estado de origem. */
export const JOB_TRANSITIONS: Readonly<Record<JobState, readonly JobState[]>> =
  {
    created: ["validating", "cancel_requested", "expired"],
    validating: [
      "awaiting_user_confirmation",
      "queued",
      "failed",
      "cancel_requested",
    ],
    awaiting_user_confirmation: ["queued", "cancel_requested", "expired"],
    queued: [...pipelineSuccessors("queued"), "failed", "cancel_requested", "expired"],
    resolving_metadata: [
      ...pipelineSuccessors("resolving_metadata"),
      "failed",
      "cancel_requested",
    ],
    fetching_captions: [
      ...pipelineSuccessors("fetching_captions"),
      "failed",
      "cancel_requested",
    ],
    acquiring_media: [
      ...pipelineSuccessors("acquiring_media"),
      "failed",
      "cancel_requested",
    ],
    extracting_audio: [
      ...pipelineSuccessors("extracting_audio"),
      "failed",
      "cancel_requested",
    ],
    normalizing_audio: [
      ...pipelineSuccessors("normalizing_audio"),
      "failed",
      "cancel_requested",
    ],
    transcribing: [
      ...pipelineSuccessors("transcribing"),
      "failed",
      "cancel_requested",
    ],
    diarizing: [
      ...pipelineSuccessors("diarizing"),
      "failed",
      "cancel_requested",
    ],
    postprocessing: [
      ...pipelineSuccessors("postprocessing"),
      "failed",
      "cancel_requested",
    ],
    indexing: ["completed", "failed", "cancel_requested"],
    completed: [],
    failed: ["queued"], // retry controlado re-enfileira
    cancel_requested: ["cancelled", "failed"],
    cancelled: [],
    expired: [],
  };

export function isValidJobTransition(from: JobState, to: JobState): boolean {
  return JOB_TRANSITIONS[from].includes(to);
}

export function isTerminalJobState(state: JobState): boolean {
  return (TERMINAL_JOB_STATES as readonly JobState[]).includes(state);
}
