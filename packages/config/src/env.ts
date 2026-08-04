import { z } from "zod";

/**
 * Validação tipada de ambiente — docs/ARCHITECTURE.md §Ambientes.
 *
 * Regras:
 * - nada aqui é obrigatório para rodar local sem credenciais (providers
 *   fake são o default);
 * - segredo NUNCA usa prefixo público (NEXT_PUBLIC_*);
 * - todo grupo novo de variáveis entra neste schema e no .env.example
 *   no mesmo PR.
 */

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // APP
  APP_URL: z.string().url().default("http://localhost:3000"),

  // SUPABASE (obrigatórias apenas a partir da Onda 2; validadas quando presentes)
  // URL + anon key não são segredo (protegidos por RLS) — por isso levam
  // NEXT_PUBLIC_ e são lidas tanto no browser quanto no servidor com o
  // mesmo valor. service_role é segredo e NUNCA leva esse prefixo.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // AI — provider fake é o default absoluto (docs/AI_CALL_MATRIX.md)
  AI_PROVIDER: z.enum(["fake", "openai"]).default("fake"),
  OPENAI_FREE_API_KEY: z.string().min(1).optional(),
  OPENAI_PAID_API_KEY: z.string().min(1).optional(),

  // STORAGE — s3 aqui é qualquer backend S3-compatible (R2 em produção),
  // nunca hardcoded pro provider específico.
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().min(1).optional(),
  S3_REGION: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),

  // BILLING
  BILLING_PROVIDER: z.enum(["fake", "stripe_test"]).default("fake"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

/**
 * Valida o ambiente do servidor. Chamar no boot (instrumentation/entrada
 * do worker). Falha alto com mensagem agregada — nunca segue com env
 * inválida silenciosamente.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new EnvValidationError(`Variáveis de ambiente inválidas — ${issues}`);
  }

  // Coerência entre provider e credenciais: ligar um provider real sem a
  // credencial correspondente é erro de configuração, não fallback.
  const env = result.data;
  if (env.AI_PROVIDER === "openai" && !env.OPENAI_FREE_API_KEY && !env.OPENAI_PAID_API_KEY) {
    throw new EnvValidationError(
      "AI_PROVIDER=openai exige OPENAI_FREE_API_KEY e/ou OPENAI_PAID_API_KEY"
    );
  }
  if (
    env.STORAGE_PROVIDER === "s3" &&
    (!env.S3_ENDPOINT || !env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)
  ) {
    throw new EnvValidationError(
      "STORAGE_PROVIDER=s3 exige S3_ENDPOINT, S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID e S3_SECRET_ACCESS_KEY"
    );
  }
  return env;
}
