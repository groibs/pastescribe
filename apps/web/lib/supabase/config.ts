/**
 * URL + anon key não são segredo (protegidos por RLS) — por isso o
 * prefixo NEXT_PUBLIC_ e o mesmo par de valores no browser e no servidor.
 * Sem eles, os clients Supabase retornam `null` em vez de lançar: telas
 * que dependem de auth precisam de um estado explícito de
 * "não configurado", nunca uma falha silenciosa ou sucesso fake.
 */
export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
