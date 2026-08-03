import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Logomark } from "./Logomark";
import { expectNoA11yViolations } from "./test/a11y";

describe("Logomark", () => {
  it("renderiza sem violações de acessibilidade (decorativo, aria-hidden)", async () => {
    const { container } = render(<Logomark className="size-8 text-primary" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expectNoA11yViolations(container);
  });
});
