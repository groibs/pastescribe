import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressSteps } from "./ProgressSteps";
import { expectNoA11yViolations } from "./test/a11y";

const STEPS = [
  { id: "queued", label: "Queued" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
] as const;

describe("ProgressSteps", () => {
  it("marks the active step semantically and has no axe violations", async () => {
    const { container } = render(
      <ProgressSteps
        label="Transcription progress"
        steps={STEPS}
        currentStepId="processing"
      />
    );
    expect(screen.getByText("Processing").closest("li")).toHaveAttribute("aria-current", "step");
    await expectNoA11yViolations(container);
  });

  it("announces terminal error with text, not color alone", () => {
    render(
      <ProgressSteps
        label="Transcription progress"
        steps={STEPS}
        currentStepId="processing"
        status="error"
      />
    );
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });
});
