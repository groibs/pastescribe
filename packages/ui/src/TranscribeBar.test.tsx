import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TranscribeBar } from "./TranscribeBar";
import { expectNoA11yViolations } from "./test/a11y";

describe("TranscribeBar", () => {
  it("renderiza sem violações de acessibilidade (label visível e oculta)", async () => {
    const { container } = render(
      <>
        <TranscribeBar label="Link do vídeo" buttonLabel="Transcrever" />
        <TranscribeBar label="Link do vídeo" hideLabel buttonLabel="Transcrever" disabled />
      </>
    );
    await expectNoA11yViolations(container);
  });

  it("label visualmente oculta ainda existe para leitor de tela", () => {
    render(<TranscribeBar label="Cole o link" hideLabel buttonLabel="Transcrever" />);
    expect(screen.getByLabelText("Cole o link")).toBeInTheDocument();
  });

  it("botão de ação dispara onSubmitClick", async () => {
    const onSubmitClick = vi.fn();
    render(<TranscribeBar label="Link" buttonLabel="Transcrever" onSubmitClick={onSubmitClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Transcrever" }));
    expect(onSubmitClick).toHaveBeenCalledTimes(1);
  });

  it("disabled desativa input e botão juntos", () => {
    render(<TranscribeBar label="Link" buttonLabel="Transcrever" disabled />);
    expect(screen.getByLabelText("Link")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Transcrever" })).toBeDisabled();
  });

  it("isSubmitting desativa input e botão sem exigir a prop disabled", () => {
    render(<TranscribeBar label="Link" buttonLabel="Transcrever" isSubmitting />);
    expect(screen.getByLabelText("Link")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Transcrever" })).toBeDisabled();
  });

  it("usa type=url e inputMode=url", () => {
    render(<TranscribeBar label="Link" buttonLabel="Transcrever" />);
    const input = screen.getByLabelText("Link");
    expect(input).toHaveAttribute("type", "url");
    expect(input).toHaveAttribute("inputMode", "url");
  });
});
