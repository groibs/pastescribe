import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./lib/supabase/config";

/**
 * Refresh de sessão Supabase (padrão oficial `@supabase/ssr`, convenção
 * `proxy.ts` do Next.js 16). Sem isso, Server Components não conseguem
 * renovar um access token expirado porque não têm permissão de escrita
 * em cookies.
 *
 * Não configurado (sem env vars) → passa direto, sem tocar em auth.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabaseConfig();
  if (!config) {
    return response;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Não remover: renova o access token quando expirado. Não inserir
  // lógica entre esta chamada e o `return response` (padrão oficial).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
