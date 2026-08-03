import type { Dictionary } from "@pastescribe/i18n";

/**
 * Footer público — fiel ao Stitch. As páginas linkadas (Tools,
 * Platforms, Privacy, Terms, API Docs) ainda não existem (Onda 10/11),
 * então aparecem como texto inerte em vez de link morto.
 */
export interface SiteFooterProps {
  dict: Dictionary;
}

function InertLink({ children }: { children: string }) {
  return (
    <span className="cursor-default text-sm text-on-secondary-fixed-variant" title={children}>
      {children}
    </span>
  );
}

export function SiteFooter({ dict }: SiteFooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-outline-variant bg-surface-bright">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-4 py-8 sm:px-12 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-on-surface">{dict.footer.brand}</span>
          <p className="mt-2 text-xs text-on-secondary-fixed-variant">
            {dict.footer.copyright.replace("{year}", String(year))}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <InertLink>{dict.footer.tools}</InertLink>
          <InertLink>{dict.footer.platforms}</InertLink>
        </div>
        <div className="flex flex-col gap-2">
          <InertLink>{dict.footer.privacy}</InertLink>
          <InertLink>{dict.footer.terms}</InertLink>
        </div>
        <div className="flex flex-col gap-2">
          <InertLink>{dict.footer.apiDocs}</InertLink>
        </div>
      </div>
      <p className="mx-auto max-w-[1280px] border-t border-outline-variant px-4 py-4 text-xs leading-5 text-on-surface-variant sm:px-12">
        {dict.footer.honesty}
      </p>
    </footer>
  );
}
