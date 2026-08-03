import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { DEFAULT_LOCALE, isLocale } from "@pastescribe/i18n";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Troca o `code` do magic link/OAuth por uma sessão (padrão oficial
 * `@supabase/ssr`). `next` só é aceito se for um caminho relativo — nunca
 * uma URL absoluta, para não virar open redirect.
 */
function resolveNext(nextParam: string | null): string {
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    return nextParam;
  }
  return `/${DEFAULT_LOCALE}`;
}

function loginPathFor(next: string): string {
  const segment = next.split("/")[1] ?? "";
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  return `/${locale}/login`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = resolveNext(searchParams.get("next"));

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=auth_callback_failed`);
}
