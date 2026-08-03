import type { HTMLAttributes } from "react";

import { cx } from "./cx";

/**
 * Skeleton — placeholder de carregamento. Respeita
 * `prefers-reduced-motion` (motion-reduce:animate-none) e anuncia o
 * carregamento a leitores de tela sem depender de cor/animação.
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Skeleton({ label = "Loading", className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        "animate-pulse rounded-md bg-surface-container-high motion-reduce:animate-none",
        className
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}
