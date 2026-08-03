import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UrlInput } from "./UrlInput";
import { expectNoA11yViolations } from "./test/a11y";

describe("UrlInput", () => {
  it("renderiza sem violações de acessibilidade em todos os status", async () => {
    const { container } = render(
      <>
        <UrlInput label="Link do vídeo" status="idle" hint="Cole um link público" />
        <UrlInput label="Link do vídeo" status="checking" statusMessage="Verificando..." />
        <UrlInput label="Link do vídeo" status="valid" statusMessage="YouTube · 12:34" />
        <UrlInput label="Link do vídeo" status="invalid" statusMessage="Não conseguimos ler este link" />
      </>
    );
    await expectNoA11yViolations(container);
  });

  it("status checking/valid usa região aria-live polite", () => {
    render(<UrlInput label="Link" status="checking" statusMessage="Verificando..." />);
    const live = screen.getByText("Verificando...");
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("status invalid não duplica anúncio: aparece só no role=alert do Input", () => {
    render(<UrlInput label="Link" status="invalid" statusMessage="Link inválido" />);
    const alerts = screen.getAllByText("Link inválido");
    expect(alerts).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Link inválido");
  });

  it("hint só aparece no estado idle", () => {
    const { rerender } = render(<UrlInput label="Link" status="idle" hint="Cole o link" />);
    expect(screen.getByText("Cole o link")).toBeInTheDocument();

    rerender(<UrlInput label="Link" status="checking" hint="Cole o link" statusMessage="Verificando..." />);
    expect(screen.queryByText("Cole o link")).not.toBeInTheDocument();
  });

  it("usa type=url e inputMode=url", () => {
    render(<UrlInput label="Link" />);
    const input = screen.getByLabelText("Link");
    expect(input).toHaveAttribute("type", "url");
    expect(input).toHaveAttribute("inputMode", "url");
  });
});
