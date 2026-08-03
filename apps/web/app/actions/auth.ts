"use server";

import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, isLocale } from "@pastescribe/i18n";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sign out real (Server Action) — usada tanto pelo header (client
 * component) quanto pela página /app, ambos via `<form action={...}>`.
 * `locale` chega por campo hidden porque Server Actions não têm acesso
 * direto à URL atual.
 */
export async function signOutAction(formData: FormData): Promise<void> {
  const localeValue = formData.get("locale");
  const locale = typeof localeValue === "string" && isLocale(localeValue) ? localeValue : DEFAULT_LOCALE;

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect(`/${locale}`);
}
