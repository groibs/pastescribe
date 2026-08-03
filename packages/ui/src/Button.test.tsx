import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";
import { expectNoA11yViolations } from "./test/a11y";

describe("Button", () => {
  it("renderiza sem violações de acessibilidade (primary e secondary)", async () => {
    const { container } = render(
      <>
        <Button variant="primary">Transcrever</Button>
        <Button variant="secondary">Cancelar</Button>
      </>
    );
    await expectNoA11yViolations(container);
  });

  it("dispara onClick ao clicar", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Enviar</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("estado disabled bloqueia clique e usa cursor not-allowed", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Indisponível
      </Button>
    );
    const button = screen.getByRole("button", { name: "Indisponível" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("estado loading desabilita o botão, marca aria-busy e anuncia rótulo", () => {
    render(
      <Button isLoading loadingLabel="Enviando...">
        Enviar
      </Button>
    );
    const button = screen.getByRole("button", { name: /Enviar/ });
    expect(button).toHaveAccessibleName(/Enviando/);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("touch target tem altura mínima de 44px (h-11) em todos os tamanhos", () => {
    render(
      <>
        <Button size="md">Médio</Button>
        <Button size="sm">Pequeno</Button>
      </>
    );
    expect(screen.getByRole("button", { name: "Médio" }).className).toContain("h-11");
    expect(screen.getByRole("button", { name: "Pequeno" }).className).toContain("h-11");
  });

  it("recebe foco visível via focus-visible:outline", () => {
    render(<Button>Focar</Button>);
    const button = screen.getByRole("button", { name: "Focar" });
    expect(button.className).toContain("focus-visible:outline");
  });

  it("type default é button (não submete formulário por acidente)", () => {
    render(<Button>Ação</Button>);
    expect(screen.getByRole("button", { name: "Ação" })).toHaveAttribute("type", "button");
  });
});
