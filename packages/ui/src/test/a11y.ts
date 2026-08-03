import axe from "axe-core";
import { expect } from "vitest";

/**
 * Helper de acessibilidade — pastescribe-accessibility-review.
 *
 * Usa axe-core diretamente (ativamente mantido pela Deque) em vez de um
 * wrapper de terceiros, cujo estado de manutenção era incerto na
 * pesquisa da Onda 0 (docs/RESEARCH_REPORT.md). `color-contrast` é
 * desligado porque o jsdom não computa layout/cor real — contraste é
 * verificado nos tokens do design system, não por elemento em teste
 * unitário.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });
  if (results.violations.length > 0) {
    const details = results.violations
      .map((v) => `${v.id}: ${v.help} (${v.nodes.length} nó(s))`)
      .join("\n");
    expect.fail(`Violações de acessibilidade encontradas:\n${details}`);
  }
}
