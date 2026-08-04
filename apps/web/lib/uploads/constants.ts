import "server-only";

export { MAX_UPLOAD_SIZE_BYTES, ALLOWED_MEDIA_MIME_TYPES } from "./limits";

export const PRESIGNED_UPLOAD_TTL_SECONDS = 900;

/** Bytes suficientes para os detectores de magic byte mais comuns. */
export const MIME_SNIFF_BYTE_COUNT = 4100;

/**
 * Só metadado de exibição — nunca vira parte da chave de storage (essa
 * é sempre UUID). Remove separador de caminho e caracteres de
 * controle; trunca em 255 chars (limite da coluna).
 */
export function sanitizeFilename(filename: string): string | null {
  const withoutPathSeparators = filename.trim().slice(0, 255).replace(/[/\\]/g, "_");
  const withoutControlChars = Array.from(withoutPathSeparators)
    .filter((char) => (char.codePointAt(0) ?? 0) >= 0x20)
    .join("");
  return withoutControlChars.length > 0 ? withoutControlChars : null;
}
