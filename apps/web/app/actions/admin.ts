"use server";

import type { BudgetEnvelope } from "@pastescribe/database";
import { revalidatePath } from "next/cache";

import { DEFAULT_LOCALE, isLocale } from "@pastescribe/i18n";

import { requirePlatformAdmin } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const BUDGET_ENVELOPES: readonly BudgetEnvelope[] = ["free_ai", "ingestion", "infra", "reserve"];

function adminPathFor(formData: FormData): string {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && isLocale(localeValue) ? localeValue : DEFAULT_LOCALE;
  return `/${locale}/admin`;
}

/**
 * Liga/desliga um kill switch (docs/AI_CALL_MATRIX.md regra 5). O
 * estado alvo vem explícito do form (botão "Enable" ou "Disable"
 * separados) — nunca um "toggle" que dependeria do que a página viu
 * por último renderizar.
 */
export async function toggleFeatureFlagAction(formData: FormData): Promise<void> {
  const guard = await requirePlatformAdmin();
  if (guard.status !== "ok") {
    throw new Error(`not authorized: ${guard.status}`);
  }

  const key = formData.get("key");
  const enabled = formData.get("enabled") === "true";
  if (typeof key !== "string" || key.length === 0) {
    throw new Error("invalid key");
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error("supabase not configured");
  }

  const { error } = await admin.from("feature_flags").update({ enabled }).eq("key", key);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(adminPathFor(formData));
}

/**
 * Cria um budget_period real (docs/DATABASE.md). Sem isso, todo
 * envelope fica sem período configurado e reserve_free_budget nega
 * tudo em fail-closed — é o passo manual que destrava o gratuito.
 */
export async function createBudgetPeriodAction(formData: FormData): Promise<void> {
  const guard = await requirePlatformAdmin();
  if (guard.status !== "ok") {
    throw new Error(`not authorized: ${guard.status}`);
  }

  const envelope = formData.get("envelope");
  const periodStart = formData.get("period_start");
  const periodEnd = formData.get("period_end");
  const capReaisRaw = formData.get("cap_reais");

  if (
    typeof envelope !== "string" ||
    !BUDGET_ENVELOPES.includes(envelope as BudgetEnvelope) ||
    typeof periodStart !== "string" ||
    typeof periodEnd !== "string" ||
    typeof capReaisRaw !== "string"
  ) {
    throw new Error("invalid form");
  }

  const capReais = Number(capReaisRaw);
  if (!Number.isFinite(capReais) || capReais <= 0) {
    throw new Error("invalid cap");
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    throw new Error("supabase not configured");
  }

  const { error } = await admin.from("budget_periods").insert({
    envelope: envelope as BudgetEnvelope,
    period_start: periodStart,
    period_end: periodEnd,
    cap_cents_brl: Math.round(capReais * 100),
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(adminPathFor(formData));
}
