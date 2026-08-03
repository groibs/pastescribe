import Link from "next/link";
import { notFound } from "next/navigation";

import {
  LOCALES,
  LOCALE_LABELS,
  getDictionary,
  isLocale,
} from "@pastescribe/i18n";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-12 sm:px-6">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-on-surface">
          PasteScribe
        </span>
        <nav aria-label={dict.home.languageLabel}>
          <ul className="flex gap-3 text-sm">
            {LOCALES.map((l) => (
              <li key={l}>
                {l === locale ? (
                  <span
                    aria-current="page"
                    className="font-semibold text-primary"
                  >
                    {LOCALE_LABELS[l]}
                  </span>
                ) : (
                  <Link
                    href={`/${l}`}
                    className="text-on-surface-variant underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {LOCALE_LABELS[l]}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <section className="mt-16">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-on-surface sm:text-5xl">
          {dict.home.tagline}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-7 text-on-surface-variant">
          {dict.home.lead}
        </p>
      </section>

      <section className="mt-12 rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="text-xl font-semibold text-on-surface">
          {dict.home.statusHeading}
        </h2>
        <p className="mt-2 text-base leading-6 text-on-surface-variant">
          {dict.home.statusBody}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-on-surface">
          {dict.home.valuesHeading}
        </h2>
        <ul className="mt-4 space-y-2">
          {dict.home.values.map((value) => (
            <li key={value} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
              />
              <span className="text-base leading-6 text-on-surface">
                {value}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto pt-16">
        <p className="border-t border-outline-variant pt-6 text-sm leading-5 text-on-surface-variant">
          {dict.footer.honesty}
        </p>
      </footer>
    </main>
  );
}
