import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert } from "./Alert";
import { expectNoA11yViolations } from "./test/a11y";

describe("Alert", () => {
  it("renderiza sem violações de acessibilidade em todas as variantes", async () => {
    const { container } = render(
      <>
        <Alert variant="info" title="Processando">
          Isso pode levar alguns minutos.
        </Alert>
        <Alert variant="success" title="Concluído" />
        <Alert variant="warning" title="Créditos acabando" />
        <Alert variant="error" title="Falha ao transcrever" />
      </>
    );
    await expectNoA11yViolations(container);
  });

  it("error usa role=alert (assertivo)", () => {
    render(<Alert variant="error" title="Falha ao transcrever" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao transcrever");
  });

  it("info/success/warning usam role=status (polite, não interrompe)", () => {
    render(<Alert variant="info" title="Processando" />);
    expect(screen.getByRole("status")).toHaveTextContent("Processando");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
