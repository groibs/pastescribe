import { describe, expect, it } from "vitest";

import {
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_LABEL,
  formatMegabytes,
  validateSelectedFile,
} from "@/lib/uploads/limits";

describe("formatMegabytes", () => {
  it("arredonda bytes pro MB mais próximo", () => {
    expect(formatMegabytes(512 * 1024 * 1024)).toBe("512MB");
    expect(formatMegabytes(1024 * 1024)).toBe("1MB");
  });

  it("MAX_UPLOAD_SIZE_LABEL bate com o limite real configurado", () => {
    expect(MAX_UPLOAD_SIZE_LABEL).toBe(formatMegabytes(MAX_UPLOAD_SIZE_BYTES));
  });
});

describe("validateSelectedFile", () => {
  it("aceita um arquivo de áudio dentro do limite", () => {
    expect(validateSelectedFile({ size: 1024, type: "audio/mpeg" })).toBeNull();
  });

  it("rejeita arquivo maior que o limite", () => {
    expect(
      validateSelectedFile({ size: MAX_UPLOAD_SIZE_BYTES + 1, type: "audio/mpeg" })
    ).toBe("too_large");
  });

  it("rejeita arquivo vazio (tamanho zero)", () => {
    expect(validateSelectedFile({ size: 0, type: "audio/mpeg" })).toBe("too_large");
  });

  it("rejeita MIME fora da allowlist", () => {
    expect(validateSelectedFile({ size: 1024, type: "application/pdf" })).toBe(
      "unsupported_type"
    );
  });

  it("tamanho vence sobre tipo quando os dois estão errados", () => {
    expect(
      validateSelectedFile({ size: MAX_UPLOAD_SIZE_BYTES + 1, type: "application/pdf" })
    ).toBe("too_large");
  });
});
