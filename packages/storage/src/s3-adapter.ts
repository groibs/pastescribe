import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { ObjectMetadata, StoragePort } from "./types";

export type S3AdapterConfig = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

/**
 * Adapter real contra qualquer storage S3-compatible (R2 em produção).
 * `createPresignedPut` não trava o tamanho na assinatura (SigV4
 * presigned URL não sinaliza Content-Length de forma confiável entre
 * providers) — o limite de tamanho é reforçado depois, checando o
 * objeto real via `headObject` antes de qualquer coisa confiar nele
 * (padrão "quarentena, valida, libera ou apaga" da skill de segurança).
 */
export function createS3StorageAdapter(config: S3AdapterConfig): StoragePort {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });

  return {
    async createPresignedPut({ key, contentType, expiresInSeconds = 900 }) {
      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType,
      });
      const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
      return { url, expiresAt: new Date(Date.now() + expiresInSeconds * 1000) };
    },

    async headObject(key): Promise<ObjectMetadata | null> {
      try {
        const result = await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
        return {
          sizeBytes: result.ContentLength ?? 0,
          contentType: result.ContentType ?? null,
          lastModified: result.LastModified ?? null,
        };
      } catch (error) {
        if (isNotFoundError(error)) {
          return null;
        }
        throw error;
      }
    },

    async getObjectRange(key, startByte, endByte) {
      const result = await client.send(
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Range: `bytes=${startByte}-${endByte}`,
        })
      );
      if (!result.Body) {
        throw new Error(`objeto ${key} sem corpo na resposta`);
      }
      return await result.Body.transformToByteArray();
    },

    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  };
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "NotFound" || error.name === "NoSuchKey")
  );
}
