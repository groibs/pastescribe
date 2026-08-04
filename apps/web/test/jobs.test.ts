import { describe, expect, it } from "vitest";

import { jobEnqueueQuotaBucket, jobEnqueueQuotaWindow } from "@/lib/jobs/constants";
import {
  canCancelJob,
  isJobId,
  jobStateToProgressStage,
  shouldPollJob,
  snapshotToProgressStage,
} from "@/lib/jobs/status";
import type { JobStatusSnapshot } from "@/lib/jobs/status";

describe("jobEnqueueQuotaBucket", () => {
  it("deriva um bucket opaco a partir do userId", () => {
    expect(jobEnqueueQuotaBucket("a1111111-1111-1111-1111-111111111111")).toBe(
      "enqueue:user:a1111111-1111-1111-1111-111111111111"
    );
  });

  it("usuários diferentes geram buckets diferentes", () => {
    expect(jobEnqueueQuotaBucket("user-a")).not.toBe(jobEnqueueQuotaBucket("user-b"));
  });
});

describe("jobEnqueueQuotaWindow", () => {
  it("usa o dia em UTC no formato YYYY-MM-DD", () => {
    expect(jobEnqueueQuotaWindow(new Date("2026-08-04T23:59:00Z"))).toBe("2026-08-04");
  });

  it("dias diferentes geram janelas diferentes", () => {
    const day1 = jobEnqueueQuotaWindow(new Date("2026-08-04T12:00:00Z"));
    const day2 = jobEnqueueQuotaWindow(new Date("2026-08-05T12:00:00Z"));
    expect(day1).not.toBe(day2);
  });
});

describe("job status helpers", () => {
  it("valida UUID de job e rejeita identificador arbitrário", () => {
    expect(isJobId("a1111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isJobId("../../outro-workspace")).toBe(false);
  });

  it("agrupa estados internos em cinco etapas compreensíveis", () => {
    expect(jobStateToProgressStage("queued")).toBe("received");
    expect(jobStateToProgressStage("normalizing_audio")).toBe("preparing");
    expect(jobStateToProgressStage("transcribing")).toBe("transcribing");
    expect(jobStateToProgressStage("postprocessing")).toBe("finalizing");
    expect(jobStateToProgressStage("completed")).toBe("completed");
  });

  it("para polling em estados estáveis e não permite cancelamento duplicado", () => {
    expect(shouldPollJob("queued")).toBe(true);
    expect(shouldPollJob("cancel_requested")).toBe(true);
    expect(shouldPollJob("awaiting_user_confirmation")).toBe(false);
    expect(shouldPollJob("completed")).toBe(false);
    expect(canCancelJob("transcribing")).toBe(true);
    expect(canCancelJob("cancel_requested")).toBe(false);
    expect(canCancelJob("failed")).toBe(false);
  });

  it("usa o último step útil para mostrar onde uma falha ocorreu", () => {
    const snapshot: JobStatusSnapshot = {
      job: {
        id: "a1111111-1111-4111-8111-111111111111",
        state: "failed",
        durationSeconds: 60,
        errorCode: "provider_failed",
        retryCount: 3,
        maxRetries: 3,
        createdAt: "2026-08-04T12:00:00Z",
        updatedAt: "2026-08-04T12:01:00Z",
      },
      steps: [
        { id: "1", fromState: null, toState: "queued", createdAt: "2026-08-04T12:00:00Z" },
        {
          id: "2",
          fromState: "queued",
          toState: "transcribing",
          createdAt: "2026-08-04T12:00:30Z",
        },
        {
          id: "3",
          fromState: "transcribing",
          toState: "failed",
          createdAt: "2026-08-04T12:01:00Z",
        },
      ],
      transcript: null,
    };

    expect(snapshotToProgressStage(snapshot)).toBe("transcribing");
  });
});
