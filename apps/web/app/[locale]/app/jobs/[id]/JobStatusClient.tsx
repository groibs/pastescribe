"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { jobStateSchema } from "@pastescribe/contracts";
import { LOCALE_BCP47 } from "@pastescribe/i18n";
import type { Locale, ProcessingCopy } from "@pastescribe/i18n";
import { Alert, Badge, Button, ProgressSteps } from "@pastescribe/ui";
import type { BadgeVariant, ProgressStepsStatus } from "@pastescribe/ui";

import type { JobStatusSnapshot } from "@/lib/jobs/status";
import {
  canCancelJob,
  shouldPollJob,
  snapshotToProgressStage,
} from "@/lib/jobs/status";

const POLL_INTERVAL_MS = 2_000;

function isSnapshot(value: unknown): value is JobStatusSnapshot {
  if (!value || typeof value !== "object" || !("job" in value)) {
    return false;
  }
  const job = (value as { job?: unknown }).job;
  if (!job || typeof job !== "object" || !("id" in job) || !("state" in job)) {
    return false;
  }
  const candidate = job as { id?: unknown; state?: unknown };
  return typeof candidate.id === "string" && jobStateSchema.safeParse(candidate.state).success;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) {
    return "—";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    : `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatSegmentTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function badgeVariant(state: JobStatusSnapshot["job"]["state"]): BadgeVariant {
  if (state === "completed") return "success";
  if (state === "failed") return "error";
  if (state === "awaiting_user_confirmation" || state === "cancel_requested") return "warning";
  if (state === "cancelled" || state === "expired") return "neutral";
  return "primary";
}

function progressStatus(state: JobStatusSnapshot["job"]["state"]): ProgressStepsStatus {
  if (state === "completed") return "completed";
  if (state === "failed") return "error";
  if (state === "cancelled" || state === "expired") return "cancelled";
  return "active";
}

function terminalAlert(snapshot: JobStatusSnapshot, copy: ProcessingCopy) {
  switch (snapshot.job.state) {
    case "awaiting_user_confirmation":
      return <Alert variant="warning" title={copy.awaitingTitle}>{copy.awaitingBody}</Alert>;
    case "failed":
      return <Alert variant="error" title={copy.failedTitle}>{copy.failedBody}</Alert>;
    case "cancelled":
      return <Alert variant="info" title={copy.cancelledTitle}>{copy.cancelledBody}</Alert>;
    case "expired":
      return <Alert variant="warning" title={copy.expiredTitle}>{copy.expiredBody}</Alert>;
    default:
      return null;
  }
}

export function JobStatusClient({
  initialSnapshot,
  locale,
  copy,
}: {
  initialSnapshot: JobStatusSnapshot;
  locale: Locale;
  copy: ProcessingCopy;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelFailed, setCancelFailed] = useState(false);

  useEffect(() => {
    if (!shouldPollJob(snapshot.job.state)) {
      return;
    }

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const response = await fetch(`/api/jobs/${snapshot.job.id}`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("status request failed");
        }
        const value: unknown = await response.json();
        if (!isSnapshot(value)) {
          throw new Error("invalid status response");
        }
        setSnapshot(value);
        setRefreshFailed(false);
        if (shouldPollJob(value.job.state)) {
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setRefreshFailed(true);
        timer = setTimeout(poll, POLL_INTERVAL_MS * 2);
      }
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [snapshot.job.id, snapshot.job.state]);

  const stages = useMemo(
    () => [
      { id: "received", label: copy.stages.received },
      { id: "preparing", label: copy.stages.preparing },
      { id: "transcribing", label: copy.stages.transcribing },
      { id: "finalizing", label: copy.stages.finalizing },
      { id: "completed", label: copy.stages.completed },
    ],
    [copy]
  );

  async function requestCancellation() {
    setIsCancelling(true);
    setCancelFailed(false);
    setCancelMessage(null);
    try {
      const response = await fetch(`/api/jobs/${snapshot.job.id}/cancel`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error("cancel request failed");
      }
      const value: unknown = await response.json();
      if (!value || typeof value !== "object" || !("state" in value)) {
        throw new Error("invalid cancel response");
      }
      const parsedState = jobStateSchema.safeParse((value as { state: unknown }).state);
      if (!parsedState.success) {
        throw new Error("invalid cancel state");
      }
      setSnapshot((current) => ({
        ...current,
        job: { ...current.job, state: parsedState.data },
      }));
      setCancelMessage(copy.cancelRequested);
    } catch {
      setCancelFailed(true);
    } finally {
      setIsCancelling(false);
    }
  }

  const stateLabel = copy.states[snapshot.job.state] ?? snapshot.job.state;
  const dateFormatter = new Intl.DateTimeFormat(LOCALE_BCP47[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 lg:px-12">
      <Link href={`/${locale}/app`} className="text-sm font-semibold text-primary hover:underline">
        ← {copy.backToDashboard}
      </Link>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">{copy.pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">{copy.pageLead}</p>
        </div>
        <Badge variant={badgeVariant(snapshot.job.state)}>{stateLabel}</Badge>
      </div>

      <p className="sr-only" aria-live="polite">
        {copy.statusLabel}: {stateLabel}. {copy.updatedLabel}: {dateFormatter.format(new Date(snapshot.job.updatedAt))}.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-outline-variant bg-surface p-5">
          <ProgressSteps
            label={copy.progressLabel}
            steps={stages}
            currentStepId={snapshotToProgressStage(snapshot)}
            status={progressStatus(snapshot.job.state)}
          />
        </aside>

        <section className="space-y-6">
          <div className="grid gap-3 rounded-xl border border-outline-variant bg-surface p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{copy.durationLabel}</p>
              <p className="mt-1 font-mono text-sm font-semibold text-on-surface">{formatDuration(snapshot.job.durationSeconds)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{copy.attemptsLabel}</p>
              <p className="mt-1 font-mono text-sm font-semibold text-on-surface">{snapshot.job.retryCount}/{snapshot.job.maxRetries}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{copy.updatedLabel}</p>
              <time dateTime={snapshot.job.updatedAt} className="mt-1 block text-sm font-semibold text-on-surface">
                {dateFormatter.format(new Date(snapshot.job.updatedAt))}
              </time>
            </div>
          </div>

          {refreshFailed ? <Alert variant="warning">{copy.refreshError}</Alert> : null}
          {terminalAlert(snapshot, copy)}
          {cancelMessage ? <Alert variant="info">{cancelMessage}</Alert> : null}
          {cancelFailed ? <Alert variant="error">{copy.cancelError}</Alert> : null}

          {canCancelJob(snapshot.job.state) ? (
            <Button
              variant="secondary"
              onClick={requestCancellation}
              isLoading={isCancelling}
              loadingLabel={copy.cancellingButton}
            >
              {isCancelling ? copy.cancellingButton : copy.cancelButton}
            </Button>
          ) : null}

          <div className="rounded-xl border border-outline-variant bg-surface p-5 sm:p-7">
            <h2 className="text-xl font-semibold text-on-surface">{copy.transcriptHeading}</h2>
            {snapshot.transcript ? (
              <div className="mt-5 space-y-2">
                {snapshot.transcript.segments.length > 0 ? (
                  snapshot.transcript.segments.map((segment) => (
                    <article key={segment.id} className="grid gap-2 border-b border-outline-variant py-4 sm:grid-cols-[72px_1fr]">
                      <time className="font-mono text-sm font-semibold text-primary">
                        {formatSegmentTime(segment.startMs)}
                      </time>
                      <div>
                        {segment.speakerLabel ? (
                          <p className="mb-1 text-sm font-semibold text-on-surface-variant">{segment.speakerLabel}</p>
                        ) : null}
                        <p className="whitespace-pre-wrap text-on-surface">{segment.text}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="mt-4 whitespace-pre-wrap text-on-surface">{snapshot.transcript.text}</p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-on-surface-variant">{copy.transcriptEmpty}</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
