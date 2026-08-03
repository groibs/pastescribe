import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LOCALE_BCP47, LOCALES, getDictionary, isLocale } from "@pastescribe/i18n";
import { Logomark } from "@pastescribe/ui";

import { LoginForm } from "./LoginForm";

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
    title: `${dict.auth.heading} — ${dict.footer.brand}`,
    description: dict.auth.lead,
    robots: { index: false, follow: false },
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_BCP47[l], `/${l}/login`])),
    },
  };
}

export default async function LoginPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-container-low px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-8 shadow-sm">
        <Link href={`/${locale}`} className="mb-8 flex items-center justify-center gap-2">
          <Logomark className="size-8 text-primary" />
          <span className="text-2xl font-bold text-primary">{dict.footer.brand}</span>
        </Link>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-on-surface">{dict.auth.heading}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{dict.auth.lead}</p>
        </div>

        <LoginForm locale={locale} dict={dict} />

        <Link
          href={`/${locale}`}
          className="mt-8 block text-center text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          {dict.auth.backToHome}
        </Link>
      </div>
    </main>
  );
}
