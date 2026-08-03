import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  LOCALES,
  LOCALE_BCP47,
  getDictionary,
  isLocale,
} from "@pastescribe/i18n";

import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type LayoutProps = {
  children: ReactNode;
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
    title: dict.meta.title,
    description: dict.meta.description,
    // noindex até o lançamento público — flip registrado em docs/SEO.md.
    robots: { index: false, follow: false },
    alternates: {
      languages: Object.fromEntries(
        LOCALES.map((l) => [LOCALE_BCP47[l], `/${l}`])
      ),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  return (
    <html lang={LOCALE_BCP47[locale]}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
