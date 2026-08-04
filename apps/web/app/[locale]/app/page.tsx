import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  LOCALE_BCP47,
  LOCALES,
  getDictionary,
  getProcessingCopy,
  isLocale,
} from "@pastescribe/i18n";
import { Badge } from "@pastescribe/ui";

import { signOutAction } from "../../actions/auth";
import { SiteHeader } from "../../_components/SiteHeader";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

export default async function AppHomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  const processingCopy = getProcessingCopy(locale);

  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) {
    redirect(`/${locale}/login`);
  }

  const [{ data: workspace }, { data: jobs }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("name")
      .eq("created_by", user.id)
      .eq("is_personal", true)
      .maybeSingle(),
    supabase
      .from("transcription_jobs")
      .select("id,state,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(LOCALE_BCP47[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      <SiteHeader locale={locale} dict={dict} currentPath="/app" />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-12">
        <h1 className="mb-1 text-3xl font-bold text-on-surface">{dict.app.heading}</h1>
        <p className="mb-8 text-on-surface-variant">{user.email}</p>

        <div className="rounded-xl border border-outline-variant bg-surface p-6">
          <p className="text-sm font-semibold text-on-surface-variant">{dict.app.workspaceLabel}</p>
          <p className="mt-1 text-lg font-semibold text-on-surface">
            {workspace?.name ?? dict.app.workspaceFallback}
          </p>
        </div>

        <section className="mt-8" aria-labelledby="recent-jobs-heading">
          <h2 id="recent-jobs-heading" className="text-xl font-semibold text-on-surface">
            {processingCopy.recentJobsHeading}
          </h2>

          {jobs && jobs.length > 0 ? (
            <div className="mt-4 divide-y divide-outline-variant overflow-hidden rounded-xl border border-outline-variant bg-surface">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={job.state === "completed" ? "success" : "primary"}>
                        {processingCopy.states[job.state] ?? job.state}
                      </Badge>
                      <span className="font-mono text-xs text-on-surface-variant">
                        {job.id.slice(0, 8)}
                      </span>
                    </div>
                    <time
                      dateTime={job.updated_at}
                      className="mt-2 block text-sm text-on-surface-variant"
                    >
                      {dateFormatter.format(new Date(job.updated_at))}
                    </time>
                  </div>
                  <Link
                    href={`/${locale}/app/jobs/${job.id}`}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline sm:min-h-0"
                  >
                    {processingCopy.openJob} →
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-outline-variant bg-surface p-6 text-on-surface-variant">
              {processingCopy.recentJobsEmpty}
            </p>
          )}
        </section>

        <form action={signOutAction} className="mt-10">
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="text-sm font-semibold text-primary hover:underline">
            {dict.nav.signOut}
          </button>
        </form>
      </main>
    </>
  );
}
