/**
 * Abstração de storage de mídia temporária — docs/DECISIONS.md: local
 * filesystem só serve dev/test (Vercel não tem disco persistente entre
 * requests); produção usa um backend S3-compatible (R2).
 *
 * Fluxo de upload real (docs/THREAT_MODEL.md T2, skill
 * pastescribe-upload-url-security §2): o cliente nunca manda bytes pro
 * nosso servidor — pede uma `createPresignedPut`, sobe direto pro
 * storage, e só DEPOIS o servidor valida (tamanho real via
 * `headObject`, MIME real via `getObjectRange` + sniffing) antes de
 * marcar o objeto como utilizável. Se a validação falhar, o objeto é
 * apagado — nunca fica "meio validado".
 */
export type ObjectMetadata = {
  sizeBytes: number;
  contentType: string | null;
  lastModified: Date | null;
};

export type PresignedPutResult = {
  url: string;
  expiresAt: Date;
};

export interface StoragePort {
  /** URL de upload de uso único, expira em `expiresInSeconds` (default 15min). */
  createPresignedPut(params: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<PresignedPutResult>;

  /** `null` se o objeto não existe — nunca lança por "não encontrado". */
  headObject(key: string): Promise<ObjectMetadata | null>;

  /** Range de bytes (inclusive) — usado para sniffing de MIME sem baixar o arquivo inteiro. */
  getObjectRange(key: string, startByte: number, endByte: number): Promise<Uint8Array>;

  deleteObject(key: string): Promise<void>;
}
