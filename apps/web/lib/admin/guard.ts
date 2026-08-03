import "server-only";

import type { User } from "@supabase/supabase-js";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminGuardResult =
  | { status: "not_configured" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "ok"; user: User };

/**
 * Único ponto de verdade sobre "esse usuário pode usar o /admin" —
 * chamado tanto pela página quanto por CADA Server Action de admin.
 * Nunca confiar que a página já filtrou: uma Server Action é um
 * endpoint chamável direto, então revalida do zero sempre
 * (docs/DATABASE.md regra 6: admin é verificado server-side por
 * papel em banco, nunca só pela UI ter renderizado o botão).
 */
export async function requirePlatformAdmin(): Promise<AdminGuardResult> {
  const userClient = await getSupabaseServerClient();
  if (!userClient) {
    return { status: "not_configured" };
  }

  const { data } = await userClient.auth.getUser();
  const user = data.user;
  if (!user) {
    return { status: "unauthenticated" };
  }

  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return { status: "not_configured" };
  }

  const { data: adminRow } = await adminClient
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    return { status: "forbidden" };
  }

  return { status: "ok", user };
}
