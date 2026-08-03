import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

import { cx } from "./cx";

/**
 * Input — docs/DESIGN_SYSTEM.md.
 * Label sempre visível (nunca placeholder-only). Erro associado via
 * aria-describedby + role="alert"; hint e erro nunca aparecem juntos.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  errorMessage?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, errorMessage, hint, id, className, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = errorMessage ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-on-surface">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(errorMessage) || undefined}
        aria-describedby={describedBy}
        className={cx(
          "h-11 rounded-md border bg-surface-container-lowest px-3.5 text-base text-on-surface",
          "placeholder:text-on-surface-variant",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-outline",
          errorMessage ? "border-error" : "border-outline-variant",
          className
        )}
        {...props}
      />
      {hint && !errorMessage ? (
        <p id={hintId} className="text-sm text-on-surface-variant">
          {hint}
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} role="alert" className="text-sm text-error">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
