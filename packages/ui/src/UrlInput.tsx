import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { Input } from "./Input";

/**
 * URL input do herói — docs/DESIGN_SYSTEM.md / pastescribe-accessibility-review.
 * "checking"/"valid" são anunciados por região aria-live="polite" própria;
 * "invalid" usa o role="alert" embutido no Input (mais urgente, sem
 * duplicar anúncio). Nunca chama nada sozinho — quem decide o status é
 * o chamador (sem custo de IA em montagem, docs/AI_CALL_MATRIX.md).
 */
export type UrlInputStatus = "idle" | "checking" | "valid" | "invalid";

export interface UrlInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  status?: UrlInputStatus;
  statusMessage?: string;
  hint?: string;
}

const LIVE_STATUS_TEXT_CLASS: Record<"checking" | "valid", string> = {
  checking: "text-on-surface-variant",
  valid: "text-success",
};

export const UrlInput = forwardRef<HTMLInputElement, UrlInputProps>(
  function UrlInput({ label, status = "idle", statusMessage, hint, id, ...props }, ref) {
    const isLiveStatus = status === "checking" || status === "valid";
    return (
      <div className="flex flex-col gap-1.5">
        <Input
          ref={ref}
          id={id}
          type="url"
          inputMode="url"
          label={label}
          hint={status === "idle" ? hint : undefined}
          errorMessage={status === "invalid" ? statusMessage : undefined}
          {...props}
        />
        <p
          aria-live="polite"
          className={
            isLiveStatus && statusMessage
              ? `text-sm ${LIVE_STATUS_TEXT_CLASS[status]}`
              : "sr-only"
          }
        >
          {isLiveStatus ? statusMessage : null}
        </p>
      </div>
    );
  }
);
