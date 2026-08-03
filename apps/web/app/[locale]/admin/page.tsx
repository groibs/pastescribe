import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getDictionary, isLocale } from "@pastescribe/i18n";
import { Badge, Button, Input } from "@pastescribe/ui";

import { createBudgetPeriodAction, toggleFeatureFlagAction } from "../../actions/admin";
import { SiteHeader } from "../../_components/SiteHeader";
import { requirePlatformAdmin } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return {};
  }
  const dict = getDictionary(locale);
  return {
    title: `${dict.admin.heading} — ${dict.footer.brand}`,
    robots: { index: false, follow: false },
  };
}

/**
 * Painel operacional mínimo: kill switches (feature_flags) e criação
 * de budget_periods. "Admin" aqui é `platform_admins` (allowlist
 * global), não papel de workspace — docs/DATABASE.md regra 6: admin é
 * verificado server-side por papel em banco, nunca só pela UI.
 */
export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  const dict = getDictionary(locale);

  const guard = await requirePlatformAdmin();
  if (guard.status === "unauthenticated" || guard.status === "not_configured") {
    redirect(`/${locale}/login`);
  }
  if (guard.status === "forbidden") {
    notFound();
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    redirect(`/${locale}/login`);
  }

  const [{ data: flags }, { data: periods }] = await Promise.all([
    admin.from("feature_flags").select("key, enabled, description").order("key"),
    admin.from("budget_periods").select("*").order("period_start", { ascending: false }),
  ]);

  const a = dict.admin;
  const envelopeLabels: Record<string, string> = {
    free_ai: a.envelopeFreeAi,
    ingestion: a.envelopeIngestion,
    infra: a.envelopeInfra,
    reserve: a.envelopeReserve,
  };

  return (
    <>
      <SiteHeader locale={locale} dict={dict} currentPath="/admin" />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-12">
        <h1 className="mb-8 text-3xl font-bold text-on-surface">{a.heading}</h1>

        <section className="mb-12">
          <h2 className="mb-1 text-xl font-semibold text-on-surface">{a.killSwitchesHeading}</h2>
          <p className="mb-4 text-sm text-on-surface-variant">{a.killSwitchesLead}</p>
          <div className="flex flex-col gap-3">
            {(flags ?? []).map((flag) => (
              <div
                key={flag.key}
                className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-on-surface">{flag.key}</span>
                    <Badge variant={flag.enabled ? "success" : "neutral"}>
                      {flag.enabled ? a.enableButton : a.disableButton}
                    </Badge>
                  </div>
                  {flag.description ? (
                    <p className="mt-1 text-sm text-on-surface-variant">{flag.description}</p>
                  ) : null}
                </div>
                <form action={toggleFeatureFlagAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="key" value={flag.key} />
                  <input type="hidden" name="enabled" value={(!flag.enabled).toString()} />
                  <Button type="submit" variant={flag.enabled ? "secondary" : "primary"} size="sm">
                    {flag.enabled ? a.disableButton : a.enableButton}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-xl font-semibold text-on-surface">{a.budgetHeading}</h2>
          <p className="mb-4 text-sm text-on-surface-variant">{a.budgetLead}</p>

          {periods && periods.length > 0 ? (
            <div className="mb-6 overflow-x-auto rounded-xl border border-outline-variant">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-2 font-semibold">{a.tableEnvelope}</th>
                    <th className="px-4 py-2 font-semibold">{a.tablePeriod}</th>
                    <th className="px-4 py-2 font-semibold">{a.tableCap}</th>
                    <th className="px-4 py-2 font-semibold">{a.tableReserved}</th>
                    <th className="px-4 py-2 font-semibold">{a.tableConsumed}</th>
                    <th className="px-4 py-2 font-semibold">{a.tableStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period.id} className="border-t border-outline-variant">
                      <td className="px-4 py-2 text-on-surface">
                        {envelopeLabels[period.envelope] ?? period.envelope}
                      </td>
                      <td className="px-4 py-2 text-on-surface-variant">
                        {period.period_start} → {period.period_end}
                      </td>
                      <td className="px-4 py-2 text-on-surface-variant">
                        R$ {(period.cap_cents_brl / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-on-surface-variant">
                        R$ {(period.reserved_cents_brl / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-on-surface-variant">
                        R$ {(period.consumed_cents_brl / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={period.status === "open" ? "success" : "neutral"}>{period.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mb-6 text-sm text-on-surface-variant">{a.noBudgetPeriods}</p>
          )}

          <form
            action={createBudgetPeriodAction}
            className="grid grid-cols-1 gap-4 rounded-xl border border-outline-variant bg-surface p-6 sm:grid-cols-2"
          >
            <input type="hidden" name="locale" value={locale} />
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
              {a.budgetEnvelopeLabel}
              <select
                name="envelope"
                required
                defaultValue="free_ai"
                className="h-11 rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 text-base text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <option value="free_ai">{a.envelopeFreeAi}</option>
                <option value="ingestion">{a.envelopeIngestion}</option>
                <option value="infra">{a.envelopeInfra}</option>
                <option value="reserve">{a.envelopeReserve}</option>
              </select>
            </label>
            <Input type="number" name="cap_reais" label={a.budgetCapLabel} min="1" step="0.01" required />
            <Input type="date" name="period_start" label={a.budgetPeriodStartLabel} required />
            <Input type="date" name="period_end" label={a.budgetPeriodEndLabel} required />
            <div className="sm:col-span-2">
              <Button type="submit">{a.createBudgetButton}</Button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
