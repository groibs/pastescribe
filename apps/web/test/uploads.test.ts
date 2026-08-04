import { describe, expect, it } from "vitest";

import { sanitizeFilename } from "@/lib/uploads/constants";

describe("sanitizeFilename", () => {
  it("remove espaços nas pontas", () => {
    expect(sanitizeFilename("  entrevista.mp3  ")).toBe("entrevista.mp3");
  });

  it("trunca para 255 caracteres", () => {
    const longName = "a".repeat(300);
    expect(sanitizeFilename(longName)).toHaveLength(255);
  });

  it("substitui separadores de caminho por _", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe(".._.._etc_passwd");
    expect(sanitizeFilename("C:\\Users\\a\\audio.wav")).toBe("C:_Users_a_audio.wav");
  });

  it("remove caracteres de controle", () => {
    expect(sanitizeFilename("audio\u0000\u0007.mp3")).toBe("audio.mp3");
    expect(sanitizeFilename("linha1\nlinha2.mp3")).toBe("linha1linha2.mp3");
  });

  it("retorna null para string vazia ou só controle", () => {
    expect(sanitizeFilename("")).toBeNull();
    expect(sanitizeFilename("   ")).toBeNull();
    expect(sanitizeFilename("\u0000\u0001\u0002")).toBeNull();
  });

  it("preserva nomes com acentos e unicode válidos", () => {
    expect(sanitizeFilename("reunião de equipe.mp4")).toBe("reunião de equipe.mp4");
  });
});
