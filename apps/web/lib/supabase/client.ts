"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { TypedSupabaseClient } from "@pastescribe/database";
import { getSupabaseConfig } from "./config";

let browserClient: TypedSupabaseClient | null = null;

/**
 * Client Supabase para Client Components. `null` quando as env vars não
 * estão configuradas (ver getSupabaseConfig) — o chamador decide como
 * mostrar isso, nunca finge que a sessão existe.
 */
export function getSupabaseBrowserClient(): TypedSupabaseClient | null {
  if (browserClient) {
    return browserClient;
  }
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }
  browserClient = createBrowserClient(config.url, config.anonKey);
  return browserClient;
}
