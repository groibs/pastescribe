"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import type { Dictionary } from "@pastescribe/i18n";
import { Badge, Button, cx } from "@pastescribe/ui";

/**
 * Alternância Monthly/Yearly + cards de plano — única parte interativa
 * da pricing (o resto da página é server-rendered). Preços são draft
 * (docs/PASTESCRIBE_MONETIZATION.md); nunca cobra nada — CTAs ficam
 * desabilitados até o billing real existir (Onda 9).
 */
export function PricingToggle({ dict }: { dict: Dictionary }) {
  const [yearly, setYearly] = useState(false);
  const p = dict.pricing;

  return (
    <>
      <div className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setYearly(false)}
          aria-pressed={!yearly}
          className={cx(
            "rounded-full px-6 py-2 text-sm font-semibold transition-colors",
            !yearly
              ? "border border-outline-variant bg-surface text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-primary"
          )}
        >
          {p.billingMonthly}
        </button>
        <button
          type="button"
          onClick={() => setYearly(true)}
          aria-pressed={yearly}
          className={cx(
            "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold transition-colors",
            yearly
              ? "border border-outline-variant bg-surface text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-primary"
          )}
        >
          {p.billingYearly}
          <Badge variant="primary">{p.billingSave}</Badge>
        </button>
      </div>

      <div className="mt-8 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        {p.plans.map((plan) => {
          const isPopular = Boolean(plan.badge);
          return (
            <div
              key={plan.name}
              className={cx(
                "relative flex flex-col rounded-xl border bg-surface p-8",
                isPopular ? "border-2 border-primary shadow-md" : "border-outline-variant"
              )}
            >
              {plan.badge ? (
                <span className="absolute right-0 top-0 rounded-bl-xl rounded-tr-xl bg-primary px-3 py-1 text-xs font-semibold text-on-primary">
                  {plan.badge}
                </span>
              ) : null}
              <div className="mb-4">
                <h2
                  className={cx(
                    "mb-1 text-xl font-semibold",
                    isPopular ? "text-primary" : "text-on-surface"
                  )}
                >
                  {plan.name}
                </h2>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-on-surface">
                    {yearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  <span className="text-base text-on-surface-variant">{plan.period}</span>
                </div>
                <p className="mt-1 text-sm text-on-surface-variant">{plan.description}</p>
              </div>
              <ul
                className={cx(
                  "mb-8 flex-grow space-y-2",
                  isPopular ? "text-on-surface" : "text-on-surface-variant"
                )}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                variant={isPopular ? "primary" : "secondary"}
                disabled
                title={dict.nav.comingSoon}
                className="mt-auto w-full justify-center"
              >
                {plan.cta}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}
