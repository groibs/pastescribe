import "server-only";

import { createLocalStorageAdapter, createS3StorageAdapter } from "@pastescribe/storage";
import type { StoragePort } from "@pastescribe/storage";

/**
 * `null` = upload indisponível — o caller mostra "não configurado",
 * nunca finge que vai funcionar (mesmo padrão de getSupabaseConfig()).
 *
 * `STORAGE_PROVIDER=local` nunca é válido rodando no Vercel: funções
 * serverless não têm disco persistente entre requests
 * (docs/DECISIONS.md) — `process.env.VERCEL` é setado automaticamente
 * pela plataforma em todo deploy, então isso pega o caso real de
 * alguém esquecer de configurar S3_* em produção, em vez de "funcionar"
 * de um jeito quebrado sem avisar.
 */
export function getStoragePort(): StoragePort | null {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "local") {
    if (process.env.VERCEL === "1") {
      return null;
    }
    return createLocalStorageAdapter(process.env.LOCAL_STORAGE_DIR ?? ".local-storage");
  }

  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return createS3StorageAdapter({ endpoint, bucket, region, accessKeyId, secretAccessKey });
}
