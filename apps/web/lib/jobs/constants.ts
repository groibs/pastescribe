import "server-only";

/**
 * Provisório — sem política por plano ainda (Onda 9). Protege o passo
 * de enfileirar (determinístico e sem custo de IA, mas ainda assim CPU
 * e banda reais do worker — docs/DECISIONS.md) contra abuso. Não tem
 * relação com o teto de orçamento de IA free — esse é outro gate,
 * dentro de reserve_job_budget, só quando o worker souber a duração
 * real.
 */
export const MAX_JOBS_ENQUEUED_PER_DAY = 20;

export function jobEnqueueQuotaBucket(userId: string): string {
  return `enqueue:user:${userId}`;
}

export function jobEnqueueQuotaWindow(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
