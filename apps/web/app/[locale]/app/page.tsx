import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LOCALE_BCP47, LOCALES, getDictionary, isLocale } from "@pastescribe/i18n";
import { Alert } from "@pastescribe/ui";

import { signOutAction } from "../../actions/auth";
import { SiteHeader } from "../../_components/SiteHeader";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const dict = getDictionary(locale);
  return {
    title: `${dict.app.heading} — ${dict.footer.brand}`,
    robots: { index: false, follow: false },
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_BCP47[l], `/${l}/app`])),
    },
  };
}

/**
 * Área autenticada mínima: prova real de que login, sessão e RLS estão
 * conectados (busca o workspace pessoal do usuário sob RLS de verdade)
 * — sem dado fake do mockup do Stitch, já que a funcionalidade real de
 * transcrição ainda não existe (docs/HANDOFF.md).
 */
export default async function AppHomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);

  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) {
    redirect(`/${locale}/login`);
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("created_by", user.id)
    .eq("is_personal", true)
    .maybeSingle();

  return (
    <>
      <SiteHeader locale={locale} dict={dict} currentPath="/app" />
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-12">
        <h1 className="mb-1 text-3xl font-bold text-on-surface">{dict.app.heading}</h1>
        <p className="mb-8 text-on-surface-variant">{user.email}</p>

        <div className="mb-6 rounded-xl border border-outline-variant bg-surface p-6">
          <p className="text-sm font-semibold text-on-surface-variant">{dict.app.workspaceLabel}</p>
          <p className="mt-1 text-lg font-semibold text-on-surface">
            {workspace?.name ?? dict.app.workspaceFallback}
          </p>
        </div>

        <Alert variant="info" title={dict.app.inDevelopmentTitle}>
          {dict.app.inDevelopmentBody}
        </Alert>

        <form action={signOutAction} className="mt-8">
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="text-sm font-semibold text-primary hover:underline">
            {dict.nav.signOut}
          </button>
        </form>
      </main>
    </>
  );
}
