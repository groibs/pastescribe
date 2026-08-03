import { describe, expect, it } from "vitest";

import { EnvValidationError, parseServerEnv } from "./env";
import { allFlags, isFlagEnabled, parseFlagValue } from "./flags";

describe("parseServerEnv", () => {
  it("roda com ambiente vazio (defaults seguros, providers fake)", () => {
    const env = parseServerEnv({});
    expect(env.AI_PROVIDER).toBe("fake");
    expect(env.BILLING_PROVIDER).toBe("fake");
    expect(env.STORAGE_PROVIDER).toBe("local");
    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("rejeita URL inválida com erro agregado", () => {
    expect(() => parseServerEnv({ APP_URL: "not-a-url" })).toThrow(
      EnvValidationError
    );
  });

  it("rejeita provider openai sem credencial (erro de config, não fallback)", () => {
    expect(() => parseServerEnv({ AI_PROVIDER: "openai" })).toThrow(
      /OPENAI_FREE_API_KEY/
    );
  });

  it("aceita provider openai com credencial", () => {
    const env = parseServerEnv({
      AI_PROVIDER: "openai",
      OPENAI_FREE_API_KEY: "test-key-not-real",
    });
    expect(env.AI_PROVIDER).toBe("openai");
  });
});

describe("feature flags", () => {
  it("fallback seguro: ausente, vazia ou inválida = desligada", () => {
    expect(parseFlagValue(undefined)).toBe(false);
    expect(parseFlagValue("")).toBe(false);
    expect(parseFlagValue("yes")).toBe(false);
    expect(parseFlagValue("TRUE")).toBe(false);
    expect(parseFlagValue("on")).toBe(false);
  });

  it("opt-in estrito: só true/1 ligam", () => {
    expect(parseFlagValue("true")).toBe(true);
    expect(parseFlagValue("1")).toBe(true);
  });

  it("lê a env correspondente à flag", () => {
    expect(
      isFlagEnabled("openai_enabled", { FLAG_OPENAI_ENABLED: "true" })
    ).toBe(true);
    expect(isFlagEnabled("openai_enabled", {})).toBe(false);
  });

  it("todas as flags nascem desligadas em ambiente vazio", () => {
    const flags = allFlags({});
    for (const enabled of Object.values(flags)) {
      expect(enabled).toBe(false);
    }
  });
});
