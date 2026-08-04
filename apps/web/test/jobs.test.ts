import { describe, expect, it } from "vitest";

import { jobEnqueueQuotaBucket, jobEnqueueQuotaWindow } from "@/lib/jobs/constants";

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
