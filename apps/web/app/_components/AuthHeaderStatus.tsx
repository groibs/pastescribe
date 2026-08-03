"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import type { Dictionary, Locale } from "@pastescribe/i18n";

import { signOutAction } from "@/app/actions/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const CTA_LINK_CLASSES =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary-container px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-9";

/**
 * Estado de auth no header — lido no client (não no `SiteHeader`,
 * server component) de propósito: `cookies()` no server forçaria
 * `/{locale}` e `/{locale}/pricing` a saírem de SSG. Custo aceito: um
 * instante de estado "deslogado" antes do primeiro efeito rodar
 * (`user === undefined`).
 */
export function AuthHeaderStatus({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setUser(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (user === undefined) {
    return <span className="h-9 w-24" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <>
        <Link
          href={`/${locale}/login`}
          className="hidden text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary sm:inline"
        >
          {dict.nav.signIn}
        </Link>
        <Link href={`/${locale}/login`} className={CTA_LINK_CLASSES}>
          {dict.nav.getStarted}
        </Link>
      </>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary"
      >
        {(user.email ?? "?").charAt(0).toUpperCase()}
      </span>
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          {dict.nav.signOut}
        </button>
      </form>
    </div>
  );
}
