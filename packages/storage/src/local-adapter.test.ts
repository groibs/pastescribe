import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createLocalStorageAdapter, writeLocalObjectForTests } from "./local-adapter";

describe("createLocalStorageAdapter", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "pastescribe-storage-test-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("headObject retorna null para uma chave que não existe", async () => {
    const storage = createLocalStorageAdapter(root);
    await expect(storage.headObject("nope")).resolves.toBeNull();
  });

  it("headObject reflete o tamanho real do objeto gravado", async () => {
    const body = new TextEncoder().encode("conteúdo de teste");
    await writeLocalObjectForTests(root, "uploads/a.bin", body);

    const storage = createLocalStorageAdapter(root);
    const metadata = await storage.headObject("uploads/a.bin");
    expect(metadata?.sizeBytes).toBe(body.byteLength);
  });

  it("getObjectRange devolve exatamente o range pedido", async () => {
    const body = new TextEncoder().encode("0123456789");
    await writeLocalObjectForTests(root, "uploads/b.bin", body);

    const storage = createLocalStorageAdapter(root);
    const range = await storage.getObjectRange("uploads/b.bin", 2, 5);
    expect(new TextDecoder().decode(range)).toBe("2345");
  });

  it("deleteObject remove o objeto — headObject volta a dar null", async () => {
    await writeLocalObjectForTests(root, "uploads/c.bin", new Uint8Array([1, 2, 3]));

    const storage = createLocalStorageAdapter(root);
    await storage.deleteObject("uploads/c.bin");
    await expect(storage.headObject("uploads/c.bin")).resolves.toBeNull();
  });

  it("rejeita chave que tenta escapar do diretório raiz (path traversal)", async () => {
    const storage = createLocalStorageAdapter(root);
    await expect(storage.headObject("../../etc/passwd")).rejects.toThrow(
      /fora do diretório raiz/
    );
  });

  it("createPresignedPut devolve uma URL e uma data de expiração no futuro", async () => {
    const storage = createLocalStorageAdapter(root);
    const before = Date.now();
    const result = await storage.createPresignedPut({
      key: "uploads/d.bin",
      contentType: "audio/mpeg",
    });
    expect(result.url).toContain("uploads%2Fd.bin");
    expect(result.expiresAt.getTime()).toBeGreaterThan(before);
  });
});
