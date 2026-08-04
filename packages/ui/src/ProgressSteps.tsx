import type { HTMLAttributes } from "react";

import { cx } from "./cx";

export type ProgressStep = {
  id: string;
  label: string;
};

export type ProgressStepsStatus = "active" | "completed" | "error" | "cancelled";

export interface ProgressStepsProps extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
  steps: readonly ProgressStep[];
  currentStepId: string;
  status?: ProgressStepsStatus;
  label: string;
}

/**
 * Progresso de processo longo. O estado é comunicado por texto,
 * aria-current e ícone — nunca apenas por cor.
 */
export function ProgressSteps({
  steps,
  currentStepId,
  status = "active",
  label,
  className,
  ...props
}: ProgressStepsProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStepId)
  );

  return (
    <ol aria-label={label} className={cx("space-y-0", className)} {...props}>
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isComplete = status === "completed" || index < currentIndex;
        const isError = isCurrent && status === "error";
        const isCancelled = isCurrent && status === "cancelled";
        const stateLabel = isComplete
          ? "Complete"
          : isError
            ? "Error"
            : isCancelled
              ? "Cancelled"
              : isCurrent
                ? "Current"
                : "Pending";

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? "step" : undefined}
            className="relative flex min-h-14 gap-3"
          >
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={cx(
                  "absolute left-[17px] top-9 h-[calc(100%-20px)] w-px",
                  isComplete ? "bg-success" : "bg-outline-variant"
                )}
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cx(
                "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                isComplete && "border-success bg-success-container text-on-success-container",
                isCurrent && status === "active" && "border-primary bg-primary-fixed text-primary",
                isError && "border-error bg-error-container text-error",
                isCancelled && "border-outline bg-surface-container text-on-surface-variant",
                !isComplete && !isCurrent && "border-outline-variant bg-surface text-on-surface-variant"
              )}
            >
              {isComplete ? "✓" : isError ? "!" : isCancelled ? "×" : index + 1}
            </span>
            <span className="pt-1.5">
              <span className={cx("block text-sm font-semibold", isCurrent ? "text-on-surface" : "text-on-surface-variant")}>
                {step.label}
              </span>
              <span className="sr-only"> — {stateLabel}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
