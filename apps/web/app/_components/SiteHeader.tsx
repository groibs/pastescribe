import Link from "next/link";

import { LOCALES, LOCALE_SHORT_CODES } from "@pastescribe/i18n";
import type { Dictionary, Locale } from "@pastescribe/i18n";
import { Button, Logomark } from "@pastescribe/ui";

/**
 * Header público — fiel ao Stitch (stitch-reference). Itens de nav sem
 * destino real ainda (API, Resources, Sign In, Get Started) aparecem
 * visualmente idênticos, mas como texto inerte (não são link nem
 * botão clicável) — nunca uma promessa que não cumprimos ainda
 * (docs/PASTESCRIBE_BRIEFING.md, pastescribe-product-simulation).
 */
export interface SiteHeaderProps {
  locale: Locale;
  dict: Dictionary;
  activeNavItem?: "pricing";
  /** Caminho após o segmento de locale (ex.: "" para home, "/pricing"). */
  currentPath?: string;
}

export function SiteHeader({ locale, dict, activeNavItem, currentPath = "" }: SiteHeaderProps) {
  return (
    <header className="w-full border-b border-outline-variant bg-surface">
      <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-4 sm:px-12">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Logomark className="size-8 text-primary" />
          <span className="text-2xl font-bold text-primary">{dict.footer.brand}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}#features`}
            className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            {dict.nav.features}
          </Link>
          <Link
            href={`/${locale}/pricing`}
            aria-current={activeNavItem === "pricing" ? "page" : undefined}
            className={
              activeNavItem === "pricing"
                ? "border-b-2 border-primary pb-1 text-sm font-semibold text-primary"
                : "text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
            }
          >
            {dict.nav.pricing}
          </Link>
          <span
            className="cursor-default text-sm font-semibold text-outline"
            title={dict.nav.comingSoon}
          >
            {dict.nav.api}
          </span>
          <span
            className="cursor-default text-sm font-semibold text-outline"
            title={dict.nav.comingSoon}
          >
            {dict.nav.resources}
          </span>
        </nav>

        <div className="flex items-center gap-4">
          <nav aria-label={dict.nav.languageLabel} className="hidden items-center gap-2 lg:flex">
            {LOCALES.map((l) => (
              <Link
                key={l}
                href={`/${l}${currentPath}`}
                aria-current={l === locale ? "true" : undefined}
                className={
                  l === locale
                    ? "text-xs font-bold text-primary"
                    : "text-xs font-semibold text-outline transition-colors hover:text-primary"
                }
              >
                {LOCALE_SHORT_CODES[l]}
              </Link>
            ))}
          </nav>
          <span
            className="hidden cursor-default text-sm font-semibold text-outline sm:inline"
            title={dict.nav.comingSoon}
          >
            {dict.nav.signIn}
          </span>
          <Button size="sm" disabled title={dict.nav.comingSoon}>
            {dict.nav.getStarted}
          </Button>
        </div>
      </div>
    </header>
  );
}
