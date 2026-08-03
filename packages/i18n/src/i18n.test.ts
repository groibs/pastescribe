import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_BCP47,
  LOCALE_LABELS,
  getDictionary,
  isLocale,
} from "./index";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe("i18n", () => {
  it("todos os locales têm exatamente as mesmas chaves do en", () => {
    const reference = keyPaths(getDictionary("en")).sort();
    for (const locale of LOCALES) {
      expect(keyPaths(getDictionary(locale)).sort()).toEqual(reference);
    }
  });

  it("nenhuma tradução vazia", () => {
    for (const locale of LOCALES) {
      const flatten = (value: unknown): string[] =>
        typeof value === "string"
          ? [value]
          : Array.isArray(value)
            ? value.flatMap(flatten)
            : typeof value === "object" && value !== null
              ? Object.values(value).flatMap(flatten)
              : [];
      for (const text of flatten(getDictionary(locale))) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("labels e BCP47 cobrem todos os locales", () => {
    for (const locale of LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
      expect(LOCALE_BCP47[locale]).toBeTruthy();
    }
  });

  it("isLocale valida corretamente", () => {
    expect(isLocale("pt-br")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("default é en (x-default do SEO)", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("promessa responsável presente em todos os locales (sem 'qualquer site')", () => {
    for (const locale of LOCALES) {
      const dict = getDictionary(locale);
      expect(dict.footer.honesty.length).toBeGreaterThan(20);
    }
  });
});
