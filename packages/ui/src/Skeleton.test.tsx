import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Skeleton } from "./Skeleton";
import { expectNoA11yViolations } from "./test/a11y";

describe("Skeleton", () => {
  it("renderiza sem violações de acessibilidade", async () => {
    const { container } = render(<Skeleton label="Carregando transcrição" />);
    await expectNoA11yViolations(container);
  });

  it("anuncia o carregamento via role=status + aria-live", () => {
    render(<Skeleton label="Carregando transcrição" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Carregando transcrição");
  });

  it("respeita prefers-reduced-motion (motion-reduce:animate-none)", () => {
    render(<Skeleton />);
    expect(screen.getByRole("status").className).toContain("motion-reduce:animate-none");
  });
});
