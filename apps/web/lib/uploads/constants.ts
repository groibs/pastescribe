import "server-only";

/**
 * Provisório — sem teto por plano ainda (isso é decisão de negócio da
 * Onda 9). 512MB cobre a maioria dos casos de áudio/vídeo pra
 * transcrição sem exigir upload em partes.
 */
export const MAX_UPLOAD_SIZE_BYTES = 512 * 1024 * 1024;

export const PRESIGNED_UPLOAD_TTL_SECONDS = 900;

/** Bytes suficientes para os detectores de magic byte mais comuns. */
export const MIME_SNIFF_BYTE_COUNT = 4100;

/**
 * MIME real (via sniffing) precisa estar aqui — nunca confiar no que o
 * client declarou (skill pastescribe-upload-url-security §2).
 */
export const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/vnd.wave",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/webm",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/mpeg",
]);

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
