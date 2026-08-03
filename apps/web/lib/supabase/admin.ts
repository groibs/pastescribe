import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database, TypedSupabaseClient } from "@pastescribe/database";

import { getSupabaseConfig } from "./config";

/**
 * Client com service_role — bypassa RLS. `import "server-only"` faz o
 * build falhar se este módulo for puxado por código de client
 * component, defesa extra além de `SUPABASE_SERVICE_ROLE_KEY` nunca
 * ter o prefixo NEXT_PUBLIC_ (CLAUDE.md: nunca expor service role no
 * client).
 *
 * Uso restrito: rotas /admin, depois de já ter confirmado a sessão do
 * usuário via getSupabaseServerClient() — nunca para decidir
 * autorização sozinho (docs/DATABASE.md regra 6: "admin não é RLS
 * bypass no client — rotas admin usam service role no servidor após
 * verificação de papel").
 */
export function getSupabaseAdminClient(): TypedSupabaseClient | null {
  const config = getSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceRoleKey) {
    return null;
  }
  return createClient<Database>(config.url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
