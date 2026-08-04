import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getDictionary, getProcessingCopy, isLocale } from "@pastescribe/i18n";

import { SiteHeader } from "../../../../_components/SiteHeader";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  JobStatusReadError,
  isJobId,
  readJobStatus,
} from "@/lib/jobs/status";

import { JobStatusClient } from "./JobStatusClient";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const copy = getProcessingCopy(locale);
  return {
    title: `${copy.pageTitle} — PasteScribe`,
    robots: { index: false, follow: false },
  };
}

export default async function JobStatusPage({ params }: PageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !isJobId(id)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) {
    redirect(`/${locale}/login`);
  }

  const snapshot = await readJobStatus(supabase, id).catch((error: unknown) => {
    if (error instanceof JobStatusReadError && error.code === "not_found") {
      notFound();
    }
    throw error;
  });

  return (
    <>
      <SiteHeader locale={locale} dict={getDictionary(locale)} currentPath="/app" />
      <JobStatusClient
        initialSnapshot={snapshot}
        locale={locale}
        copy={getProcessingCopy(locale)}
      />
    </>
  );
}
