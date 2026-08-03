import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";
import { expectNoA11yViolations } from "./test/a11y";

describe("Badge", () => {
  it("renderiza sem violações de acessibilidade em todas as variantes", async () => {
    const { container } = render(
      <>
        <Badge variant="neutral">Rascunho</Badge>
        <Badge variant="primary">Pro</Badge>
        <Badge variant="success">Concluído</Badge>
        <Badge variant="warning">Quase sem créditos</Badge>
        <Badge variant="error">Falhou</Badge>
      </>
    );
    await expectNoA11yViolations(container);
  });

  it("sempre exibe texto (status nunca depende só de cor)", () => {
    render(<Badge variant="error">Falhou</Badge>);
    expect(screen.getByText("Falhou")).toBeInTheDocument();
  });
});
