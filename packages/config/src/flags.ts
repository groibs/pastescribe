/**
 * Feature flags centralizadas — docs/FEATURE_FLAGS.md.
 *
 * Regras:
 * - nenhum código lê env de flag diretamente; tudo passa por aqui;
 * - flags de risco/custo são opt-in estrito: só `true`/`1` liga;
 *   ausente, vazia ou inválida = desligada (fallback seguro);
 * - a partir da Onda 2 as flags dinâmicas passam a ser resolvidas da
 *   tabela `feature_flags` por esta MESMA interface — call sites não mudam.
 */

export const FLAG_NAMES = [
  "openai_enabled",
  "free_ai_enabled",
  "free_native_captions_enabled",
  "link_ingestion_enabled",
  "upload_enabled",
  "diarization_enabled",
  "batch_enabled",
  "public_transcripts_enabled",
  "teams_enabled",
  "api_enabled",
  "seo_cms_enabled",
  "auto_free_budget_growth_enabled",
  "maintenance_mode",
] as const;

export type FlagName = (typeof FLAG_NAMES)[number];

function envVarFor(flag: FlagName): string {
  return `FLAG_${flag.toUpperCase()}`;
}

/** Opt-in estrito: apenas os valores exatos "true" ou "1" ligam a flag. */
export function parseFlagValue(raw: string | undefined): boolean {
  return raw === "true" || raw === "1";
}

export function isFlagEnabled(
  flag: FlagName,
  source: Record<string, string | undefined> = process.env
): boolean {
  return parseFlagValue(source[envVarFor(flag)]);
}

export function allFlags(
  source: Record<string, string | undefined> = process.env
): Record<FlagName, boolean> {
  return Object.fromEntries(
    FLAG_NAMES.map((flag) => [flag, isFlagEnabled(flag, source)])
  ) as Record<FlagName, boolean>;
}
