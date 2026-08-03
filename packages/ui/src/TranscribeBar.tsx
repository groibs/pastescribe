import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

/**
 * Barra de transcrição — pílula com ícone + input + botão de ação, num
 * único container. docs/DESIGN_SYSTEM.md (fiel ao hero e ao
 * "Start Transcribing" do Stitch). Reaproveitada entre a home
 * (marketing, sem label visível) e o dashboard (Onda 2.3, com label
 * visível) — por isso `hideLabel` é opcional, não o padrão.
 *
 * Nunca chama nada sozinho: quem decide o que acontece no submit é o
 * chamador (sem custo de IA em montagem, docs/AI_CALL_MATRIX.md).
 */
export interface TranscribeBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label: string;
  hideLabel?: boolean;
  leadingIcon?: ReactNode;
  buttonLabel: string;
  buttonIcon?: ReactNode;
  isSubmitting?: boolean;
  onSubmitClick?: () => void;
}

export const TranscribeBar = forwardRef<HTMLInputElement, TranscribeBarProps>(
  function TranscribeBar(
    {
      label,
      hideLabel = false,
      leadingIcon,
      buttonLabel,
      buttonIcon,
      isSubmitting = false,
      onSubmitClick,
      id,
      className,
      disabled,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isDisabled = disabled || isSubmitting;

    return (
      <div className="flex w-full flex-col gap-1.5">
        <label htmlFor={inputId} className={hideLabel ? "sr-only" : "text-sm font-semibold text-on-surface"}>
          {label}
        </label>
        <div
          className={cx(
            "flex w-full items-center gap-2 rounded-xl border border-outline-variant bg-surface p-1.5 shadow-sm transition-colors",
            "focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-container/10",
            isDisabled && "opacity-60",
            className
          )}
        >
          {leadingIcon ? (
            <span aria-hidden="true" className="ml-2 shrink-0 text-outline">
              {leadingIcon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={inputId}
            type="url"
            inputMode="url"
            disabled={isDisabled}
            className="min-w-0 flex-grow border-none bg-transparent text-base text-on-surface outline-none placeholder:text-outline disabled:cursor-not-allowed"
            {...props}
          />
          <button
            type="button"
            disabled={isDisabled}
            onClick={onSubmitClick}
            className={cx(
              "inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary-container px-5 py-3 text-sm font-bold text-on-primary shadow-sm transition-colors",
              "hover:bg-primary disabled:cursor-not-allowed disabled:bg-outline-variant disabled:text-surface-container-lowest",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            )}
          >
            {buttonIcon ? (
              <span aria-hidden="true">{buttonIcon}</span>
            ) : null}
            {buttonLabel}
          </button>
        </div>
      </div>
    );
  }
);
