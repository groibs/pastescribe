import { z } from "zod";

/**
 * Catálogo FECHADO de eventos de analytics — docs/ANALYTICS_EVENTS.md.
 * Evento fora desta lista não compila; props fora do schema são
 * rejeitadas em runtime (strict). Nenhuma prop pode carregar PII ou
 * conteúdo — ver a regra de ouro no documento canônico.
 */

export const DURATION_BUCKETS = ["<1m", "1-5m", "5-15m", "15-60m", ">60m"] as const;
export const LATENCY_BUCKETS = ["<30s", "30s-2m", "2-10m", ">10m"] as const;

const durationBucket = z.enum(DURATION_BUCKETS);
const latencyBucket = z.enum(LATENCY_BUCKETS);
const platform = z.string().max(32); // identificador genérico ("youtube"), nunca URL
const locale = z.string().max(8);

export const ANALYTICS_EVENT_SCHEMAS = {
  landing_tool_started: z
    .object({ platform: platform.optional(), locale, page_kind: z.string().max(32) })
    .strict(),
  source_detected: z
    .object({
      platform,
      has_native_captions: z.boolean(),
      duration_bucket: durationBucket,
    })
    .strict(),
  signup_completed: z
    .object({ locale, method: z.enum(["magic_link", "google", "password"]) })
    .strict(),
  email_verified_for_preview: z.object({ locale }).strict(),
  onboarding_completed: z
    .object({ answers_count: z.number().int().min(0).max(20), skipped: z.boolean() })
    .strict(),
  free_preview_started: z
    .object({ platform: platform.optional(), preview_kind: z.enum(["anonymous", "verified"]) })
    .strict(),
  free_preview_completed: z
    .object({
      platform: platform.optional(),
      duration_bucket: durationBucket,
      latency_bucket: latencyBucket,
    })
    .strict(),
  paywall_viewed: z
    .object({
      trigger: z.enum(["preview_end", "quota_end", "feature_gate"]),
      plan_context: z.string().max(32).optional(),
    })
    .strict(),
  single_job_purchased: z
    .object({ duration_bucket: durationBucket, currency: z.string().length(3) })
    .strict(),
  credit_pack_purchased: z
    .object({ pack_id: z.string().max(64), currency: z.string().length(3) })
    .strict(),
  subscription_started: z
    .object({
      plan_id: z.string().max(64),
      interval: z.enum(["month", "year"]),
      currency: z.string().length(3),
    })
    .strict(),
  subscription_cancelled: z
    .object({ plan_id: z.string().max(64), reason_category: z.string().max(32).optional() })
    .strict(),
  transcription_job_created: z
    .object({
      source_kind: z.enum(["url", "upload"]),
      platform: platform.optional(),
      origin: z.enum(["free", "paid"]),
      duration_bucket: durationBucket,
    })
    .strict(),
  transcription_completed: z
    .object({
      source_kind: z.enum(["url", "upload"]),
      platform: platform.optional(),
      origin: z.enum(["free", "paid"]),
      duration_bucket: durationBucket,
      latency_bucket: latencyBucket,
      used_native_captions: z.boolean(),
    })
    .strict(),
  transcription_failed: z
    .object({
      error_code: z.string().max(64),
      platform: platform.optional(),
      step: z.string().max(32),
    })
    .strict(),
  editor_opened: z.object({ duration_bucket: durationBucket }).strict(),
  artifact_generated: z
    .object({ artifact_kind: z.string().max(32), origin: z.enum(["free", "paid"]) })
    .strict(),
  export_completed: z
    .object({
      format: z.enum(["txt", "md", "docx", "pdf", "srt", "vtt", "json"]),
      options_count: z.number().int().min(0).max(20),
    })
    .strict(),
  share_created: z
    .object({ scope: z.enum(["read", "edit"]), has_expiry: z.boolean() })
    .strict(),
  api_job_created: z
    .object({ source_kind: z.enum(["url", "upload"]), scope: z.string().max(32) })
    .strict(),
  free_state_changed: z
    .object({
      from: z.enum(["normal", "economy", "restricted", "blocked"]),
      to: z.enum(["normal", "economy", "restricted", "blocked"]),
      trigger: z.enum(["budget", "manual", "abuse"]),
    })
    .strict(),
  budget_threshold_reached: z
    .object({ envelope: z.string().max(32), threshold: z.enum(["50", "80", "95", "100"]) })
    .strict(),
  kill_switch_toggled: z
    .object({ switch: z.string().max(64), to: z.boolean(), actor_role: z.string().max(32) })
    .strict(),
  abuse_action_taken: z
    .object({ signal_kind: z.string().max(32), action: z.string().max(32) })
    .strict(),
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENT_SCHEMAS;

export const ANALYTICS_EVENT_NAMES = Object.keys(
  ANALYTICS_EVENT_SCHEMAS
) as AnalyticsEventName[];

export type AnalyticsEventProps<E extends AnalyticsEventName> = z.infer<
  (typeof ANALYTICS_EVENT_SCHEMAS)[E]
>;

/** Valida nome + props contra o catálogo fechado. */
export function parseAnalyticsEvent<E extends AnalyticsEventName>(
  event: E,
  props: unknown
): AnalyticsEventProps<E> {
  const schema = ANALYTICS_EVENT_SCHEMAS[event];
  if (!schema) {
    throw new Error(`Evento fora do catálogo: ${String(event)}`);
  }
  return schema.parse(props) as AnalyticsEventProps<E>;
}
