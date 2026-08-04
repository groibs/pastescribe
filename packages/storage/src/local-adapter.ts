import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import type { ObjectMetadata, StoragePort } from "./types";

/**
 * Adapter de filesystem local — **só para dev/test neste sandbox ou
 * numa máquina com disco persistente**. Nunca funciona em produção no
 * Vercel: funções serverless rodam em containers efêmeros sem disco
 * compartilhado entre requests (docs/DECISIONS.md). Produção sempre
 * usa `createS3StorageAdapter` (R2).
 *
 * `createPresignedPut` aqui NÃO é uma URL real de upload HTTP — não
 * existe uma rota que aceite PUT nela. Serve só para o contrato
 * tipar/rodar sem quebrar quando `STORAGE_PROVIDER=local`; testes que
 * precisam de um objeto "já subido" usam `writeLocalObjectForTests`.
 */
export function createLocalStorageAdapter(rootDir: string): StoragePort {
  const root = resolve(rootDir);

  return {
    async createPresignedPut({ key, expiresInSeconds = 900 }) {
      return {
        url: `local-storage-unsupported://${encodeURIComponent(key)}`,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      };
    },

    async headObject(key): Promise<ObjectMetadata | null> {
      const path = resolveKeyPath(root, key);
      try {
        const info = await stat(path);
        return { sizeBytes: info.size, contentType: null, lastModified: info.mtime };
      } catch {
        return null;
      }
    },

    async getObjectRange(key, startByte, endByte) {
      const path = resolveKeyPath(root, key);
      const buffer = await readFile(path);
      return buffer.subarray(startByte, endByte + 1);
    },

    async deleteObject(key) {
      const path = resolveKeyPath(root, key);
      await rm(path, { force: true });
    },
  };
}

/** Só para testes — grava bytes direto, sem passar por um upload HTTP real. */
export async function writeLocalObjectForTests(
  rootDir: string,
  key: string,
  body: Uint8Array
): Promise<void> {
  const path = resolveKeyPath(resolve(rootDir), key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

function resolveKeyPath(root: string, key: string): string {
  const path = resolve(root, key);
  if (path !== root && !path.startsWith(root + sep)) {
    throw new Error(`chave de storage fora do diretório raiz: ${key}`);
  }
  return join(path);
}
