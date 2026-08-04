export type {
  Database,
  Json,
  WorkspaceRole,
  CreditLedgerKind,
  BudgetEnvelope,
  BudgetPeriodStatus,
  BudgetReservationStatus,
  UsageOrigin,
  BillingInterval,
  MediaAssetStatus,
} from "./types";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type TypedSupabaseClient = SupabaseClient<Database>;
