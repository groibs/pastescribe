import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

/**
 * Alert — docs/DESIGN_SYSTEM.md. `error` usa role="alert" (assertivo);
 * as demais usam role="status" (polite) — não interrompe o usuário à
 * toa.
 */
export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: AlertVariant;
  title: string;
  icon?: ReactNode;
}

const VARIANT_STYLE: Record<AlertVariant, { container: string; role: "status" | "alert" }> = {
  info: {
    container: "border-outline-variant bg-surface-container-lowest text-on-surface",
    role: "status",
  },
  success: {
    container: "border-success bg-success-container text-on-success-container",
    role: "status",
  },
  warning: {
    container: "border-warning bg-warning-container text-on-warning-container",
    role: "status",
  },
  error: {
    container: "border-error bg-error-container text-on-error-container",
    role: "alert",
  },
};

export function Alert({ variant = "info", title, icon, className, children, ...props }: AlertProps) {
  const { container, role } = VARIANT_STYLE[variant];
  return (
    <div role={role} className={cx("flex gap-3 rounded-xl border p-4", container, className)} {...props}>
      {icon ? (
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{title}</p>
        {children ? <div className="text-sm leading-5">{children}</div> : null}
      </div>
    </div>
  );
}
