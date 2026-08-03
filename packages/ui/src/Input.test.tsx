import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Input } from "./Input";
import { expectNoA11yViolations } from "./test/a11y";

describe("Input", () => {
  it("renderiza sem violações de acessibilidade (default, hint, erro)", async () => {
    const { container } = render(
      <>
        <Input label="Nome" />
        <Input label="E-mail" hint="Usamos só para o login" />
        <Input label="URL" errorMessage="Link inválido" />
      </>
    );
    await expectNoA11yViolations(container);
  });

  it("label é associada ao input (acessível por getByLabelText)", async () => {
    render(<Input label="URL do vídeo" />);
    const input = screen.getByLabelText("URL do vídeo");
    await userEvent.type(input, "https://example.com");
    expect(input).toHaveValue("https://example.com");
  });

  it("hint some quando há erro (nunca aparecem juntos)", () => {
    render(<Input label="URL" hint="Cole o link aqui" errorMessage="Link inválido" />);
    expect(screen.queryByText("Cole o link aqui")).not.toBeInTheDocument();
    expect(screen.getByText("Link inválido")).toBeInTheDocument();
  });

  it("erro é associado via aria-describedby e role=alert", () => {
    render(<Input label="URL" errorMessage="Link inválido" />);
    const input = screen.getByLabelText("URL");
    const errorEl = screen.getByRole("alert");
    expect(errorEl).toHaveTextContent("Link inválido");
    expect(input).toHaveAttribute("aria-describedby", errorEl.id);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("disabled impede digitação", async () => {
    render(<Input label="Bloqueado" disabled />);
    const input = screen.getByLabelText("Bloqueado");
    expect(input).toBeDisabled();
  });
});
