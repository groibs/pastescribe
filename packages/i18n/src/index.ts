import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { ptBr } from "./dictionaries/pt-br";
import type { Dictionary } from "./dictionaries/en";

/**
 * i18n do PasteScribe — docs/SEO.md.
 * URLs por prefixo de locale (/en, /pt-br, /es); en é o x-default.
 * Adicionar um locale = adicionar dicionário + entrada em LOCALES.
 */

export const LOCALES = ["en", "pt-br", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Etiquetas nativas para o seletor de idioma. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "pt-br": "Português (Brasil)",
  es: "Español",
};

/** Código BCP 47 para <html lang> e hreflang. */
export const LOCALE_BCP47: Record<Locale, string> = {
  en: "en",
  "pt-br": "pt-BR",
  es: "es",
};

const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  "pt-br": ptBr,
  es,
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
