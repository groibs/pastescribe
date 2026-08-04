/**
 * Sem "server-only" de propósito — usado pelo client (dropzone) pra
 * validar tamanho/tipo antes de subir, e pelo servidor (constants.ts)
 * como fonte real de verdade. Validação client-side aqui é só UX
 * (evita subir um arquivo enorme só pra ser rejeitado); o servidor
 * sempre revalida via headObject + MIME sniffing real
 * (skill pastescribe-upload-url-security §2) — nada aqui é fronteira
 * de segurança.
 *
 * Provisório — sem teto por plano ainda (isso é decisão de negócio da
 * Onda 9). 512MB cobre a maioria dos casos de áudio/vídeo pra
 * transcrição sem exigir upload em partes.
 */
export const MAX_UPLOAD_SIZE_BYTES = 512 * 1024 * 1024;

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

export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export const MAX_UPLOAD_SIZE_LABEL = formatMegabytes(MAX_UPLOAD_SIZE_BYTES);

export type FileValidationError = "too_large" | "unsupported_type";

/**
 * Só UX (evita subir um arquivo que o servidor certamente vai
 * rejeitar) — nunca a fronteira de segurança real, que é sempre
 * server-side (headObject + MIME sniffing).
 */
export function validateSelectedFile(file: { size: number; type: string }): FileValidationError | null {
  if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return "too_large";
  }
  if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type)) {
    return "unsupported_type";
  }
  return null;
}
