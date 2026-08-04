import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

import { createS3StorageAdapter } from "./s3-adapter";
import type { StoragePort } from "./types";

/**
 * Integração real contra um bucket S3-compatible (R2) — só roda quando
 * as 5 variáveis S3_* estão no ambiente. Sem elas, marca os testes
 * como skipped em vez de falhar: CI não tem (nem deve ter) credenciais
 * reais de storage neste estágio do projeto (mesmo padrão de
 * "OpenAI integration opcional e marcada" do prompt-mestre §21.2).
 *
 * Roda manualmente com: node --env-file=.env.local ./node_modules/.bin/vitest run src/s3-adapter.test.ts
 */
const hasS3Credentials =
  Boolean(process.env.S3_ENDPOINT) &&
  Boolean(process.env.S3_BUCKET) &&
  Boolean(process.env.S3_REGION) &&
  Boolean(process.env.S3_ACCESS_KEY_ID) &&
  Boolean(process.env.S3_SECRET_ACCESS_KEY);

describe.skipIf(!hasS3Credentials)("createS3StorageAdapter (integração real)", () => {
  // Construído em beforeAll (não no corpo do describe): describe.skipIf
  // ainda executa o corpo síncrono do describe pra coletar os testes,
  // mas pula os hooks — construir o client aqui evitaria o skip
  // funcionar de verdade quando as env vars faltam.
  let adapter: StoragePort;

  beforeAll(() => {
    adapter = createS3StorageAdapter({
      endpoint: process.env.S3_ENDPOINT ?? "",
      bucket: process.env.S3_BUCKET ?? "",
      region: process.env.S3_REGION ?? "",
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    });
  });

  it("presigned put + head + range read + delete — ciclo completo contra o bucket real", async () => {
    const key = `test/vitest-${randomUUID()}.bin`;
    const body = new TextEncoder().encode("PasteScribe storage adapter — teste real de integração");

    try {
      const presigned = await adapter.createPresignedPut({
        key,
        contentType: "application/octet-stream",
        expiresInSeconds: 60,
      });
      expect(presigned.url).toContain(key.split("/")[1]);

      const putResponse = await fetch(presigned.url, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body,
      });
      expect(putResponse.ok).toBe(true);

      const metadata = await adapter.headObject(key);
      expect(metadata?.sizeBytes).toBe(body.byteLength);

      // Range HTTP é inclusivo nas duas pontas — bytes 0..10 são 11 bytes.
      const range = await adapter.getObjectRange(key, 0, 10);
      expect(new TextDecoder().decode(range)).toBe("PasteScribe");

      await adapter.deleteObject(key);
      await expect(adapter.headObject(key)).resolves.toBeNull();
    } finally {
      // Rede de segurança: se alguma asserção falhar no meio, ainda
      // tenta limpar o objeto de teste do bucket real do dono.
      await adapter.deleteObject(key).catch(() => undefined);
    }
  });

  it("headObject retorna null para uma chave que nunca existiu", async () => {
    await expect(adapter.headObject(`test/never-existed-${randomUUID()}.bin`)).resolves.toBeNull();
  });
});
