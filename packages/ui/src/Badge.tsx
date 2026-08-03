import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

/**
 * Badge — chip de status/plano. docs/DESIGN_SYSTEM.md: pill só é
 * permitido aqui. `children` é obrigatório de propósito: status nunca
 * pode depender só de cor (docs/DESIGN_SYSTEM.md §Acessibilidade).
 */
export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "error";

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  primary: "bg-primary-fixed text-primary",
  success: "bg-success-container text-on-success-container",
  warning: "bg-warning-container text-on-warning-container",
  error: "bg-error-container text-on-error-container",
};

export function Badge({ variant = "neutral", icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
