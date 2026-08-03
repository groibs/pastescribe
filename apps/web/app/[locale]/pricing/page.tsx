import { ChevronDown, Coins, Info } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LOCALE_BCP47, LOCALES, getDictionary, isLocale } from "@pastescribe/i18n";
import { Alert, Button } from "@pastescribe/ui";

import { SiteFooter } from "../../_components/SiteFooter";
import { SiteHeader } from "../../_components/SiteHeader";
import { PricingToggle } from "./PricingToggle";

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
    title: `${dict.pricing.heading} — ${dict.footer.brand}`,
    description: dict.pricing.lead,
    robots: { index: false, follow: false },
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_BCP47[l], `/${l}/pricing`])),
    },
  };
}

export default async function PricingPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);
  const p = dict.pricing;

  return (
    <>
      <SiteHeader locale={locale} dict={dict} activeNavItem="pricing" currentPath="/pricing" />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-12">
        <div className="mb-12 flex flex-col items-center text-center">
          <h1 className="mb-2 text-4xl font-bold text-on-surface sm:text-5xl">{p.heading}</h1>
          <p className="mb-6 max-w-2xl text-lg text-on-surface-variant">{p.lead}</p>
          <div className="mb-8 max-w-xl">
            <Alert variant="warning" title={p.draftNotice} />
          </div>
          <PricingToggle dict={dict} />
        </div>

        {/* Credits pack */}
        <div className="mb-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-8 md:flex-row">
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-surface-container-high p-3 text-primary">
              <Coins className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">{p.creditsHeading}</h2>
              <p className="text-on-surface-variant">{p.creditsBody}</p>
            </div>
          </div>
          <Button variant="secondary" disabled title={dict.nav.comingSoon} className="whitespace-nowrap">
            {p.creditsCta}
          </Button>
        </div>

        {/* FAQ — <details>/<summary> nativos: acessível e funcional sem JS. */}
        <div className="mx-auto mb-12 max-w-3xl">
          <h2 className="mb-6 text-center text-2xl font-bold text-on-surface">{p.faqHeading}</h2>
          <div className="space-y-2">
            {p.faq.map((item) => (
              <details
                key={item.question}
                className="group rounded-lg border border-outline-variant bg-surface p-2"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-2 text-lg font-semibold text-on-surface marker:content-none">
                  <span>{item.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-5 shrink-0 text-on-surface-variant transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-2 pb-2 text-on-surface-variant">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2">
            <Info className="size-4 text-on-surface-variant" aria-hidden="true" />
            <span className="text-xs font-semibold text-on-surface-variant">
              {p.payAsYouGoNotice}
            </span>
          </div>
        </div>
      </main>
      <SiteFooter dict={dict} />
    </>
  );
}
