import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

/**
 * Botão — docs/DESIGN_SYSTEM.md.
 * primary: ação principal (azul cobalto sólido). secondary: ação
 * alternativa. Nunca pill — raio padrão de 8px (rounded-md).
 * Touch target ≥44px (h-11) mesmo no tamanho "sm".
 */
export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-container text-on-primary hover:bg-primary active:bg-primary disabled:bg-outline-variant disabled:text-surface-container-lowest",
  secondary:
    "border border-outline-variant bg-surface-container text-primary hover:bg-surface-container-high active:bg-surface-container-highest disabled:border-transparent disabled:bg-surface-container-low disabled:text-outline",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-base",
  sm: "h-11 px-4 text-sm sm:h-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingLabel = "Loading",
    leadingIcon,
    disabled,
    className,
    children,
    type = "button",
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {isLoading ? <span className="sr-only">{loadingLabel}</span> : null}
    </button>
  );
});
