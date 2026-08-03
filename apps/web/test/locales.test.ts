import { describe, expect, it } from "vitest";

import { LOCALES, getDictionary } from "@pastescribe/i18n";

describe("rotas por locale", () => {
  it("os três locales do lançamento existem", () => {
    expect([...LOCALES]).toEqual(["en", "pt-br", "es"]);
  });

  it("cada locale tem metadata própria localizada", () => {
    const titles = LOCALES.map((locale) => getDictionary(locale).meta.title);
    expect(new Set(titles).size).toBe(LOCALES.length);
    for (const title of titles) {
      expect(title).toContain("PasteScribe");
      expect(title.length).toBeLessThanOrEqual(70);
    }
  });

  it("descriptions dentro do limite de SEO", () => {
    for (const locale of LOCALES) {
      expect(getDictionary(locale).meta.description.length).toBeLessThanOrEqual(160);
    }
  });
});
