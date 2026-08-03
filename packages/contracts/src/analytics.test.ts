import { describe, expect, it } from "vitest";

import {
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_EVENT_SCHEMAS,
  parseAnalyticsEvent,
} from "./analytics";

describe("catálogo fechado de analytics", () => {
  it("valida evento com props corretas", () => {
    const parsed = parseAnalyticsEvent("source_detected", {
      platform: "youtube",
      has_native_captions: true,
      duration_bucket: "5-15m",
    });
    expect(parsed.platform).toBe("youtube");
  });

  it("rejeita props extras (proteção contra vazamento de PII)", () => {
    expect(() =>
      parseAnalyticsEvent("source_detected", {
        platform: "youtube",
        has_native_captions: true,
        duration_bucket: "5-15m",
        url: "https://example.com/private-video",
      })
    ).toThrow();
  });

  it("rejeita props faltantes", () => {
    expect(() => parseAnalyticsEvent("signup_completed", {})).toThrow();
  });

  it("nenhum schema aceita campos com nomes proibidos", () => {
    const forbidden = ["email", "name", "url", "transcript", "token", "api_key", "ip"];
    for (const eventName of ANALYTICS_EVENT_NAMES) {
      const schema = ANALYTICS_EVENT_SCHEMAS[eventName];
      const shape = schema.shape as Record<string, unknown>;
      for (const key of Object.keys(shape)) {
        expect(forbidden).not.toContain(key);
      }
    }
  });
});
