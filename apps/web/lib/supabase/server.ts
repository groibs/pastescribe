import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { TypedSupabaseClient } from "@pastescribe/database";
import { getSupabaseConfig } from "./config";

/**
 * Client Supabase para Server Components, Route Handlers e Server
 * Actions. `null` quando não configurado (ver getSupabaseConfig).
 *
 * `setAll` pode lançar quando chamado a partir de um Server Component
 * puro (não pode escrever cookies) — o middleware é quem garante o
 * refresh da sessão nesse caso, então o erro é intencionalmente
 * ignorado aqui.
 */
export async function getSupabaseServerClient(): Promise<TypedSupabaseClient | null> {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component sem acesso de escrita a cookies — ok.
        }
      },
    },
  });
}
