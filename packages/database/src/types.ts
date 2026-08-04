/**
 * Tipos do banco — espelham exatamente as migrations em
 * `supabase/migrations/`. Escritos à mão (não gerados via `supabase gen
 * types`) porque o gerador depende de um container Docker que o pull do
 * Docker Hub bloqueia neste ambiente — ver docs/DECISIONS.md. Formato
 * idêntico ao que o gerador oficial produz, então trocar por geração
 * real no futuro não muda quem consome isto.
 *
 * Toda mudança de schema precisa atualizar este arquivo no mesmo PR.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
export type CreditLedgerKind = "purchase" | "grant" | "reserve" | "capture" | "release" | "refund" | "adjust";
export type BudgetEnvelope = "free_ai" | "ingestion" | "infra" | "reserve";
export type BudgetPeriodStatus = "open" | "closed";
export type BudgetReservationStatus = "reserved" | "captured" | "released" | "expired";
export type UsageOrigin = "free" | "paid";
export type MediaAssetStatus = "pending_upload" | "validated" | "rejected" | "deleted";
export type BillingInterval = "monthly" | "yearly";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          name: string;
          is_personal: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_personal?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_personal?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_invites: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: WorkspaceRole;
          token_hash: string;
          status: "pending" | "accepted" | "revoked" | "expired";
          invited_by: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: WorkspaceRole;
          token_hash: string;
          status?: "pending" | "accepted" | "revoked" | "expired";
          invited_by: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: WorkspaceRole;
          token_hash?: string;
          status?: "pending" | "accepted" | "revoked" | "expired";
          invited_by?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          enabled?: boolean;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_purchasable: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          is_purchasable?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_purchasable?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prices: {
        Row: {
          id: string;
          plan_id: string;
          billing_interval: BillingInterval;
          currency: string;
          amount_cents: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          billing_interval: BillingInterval;
          currency: string;
          amount_cents: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          billing_interval?: BillingInterval;
          currency?: string;
          amount_cents?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prices_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_accounts: {
        Row: {
          id: string;
          workspace_id: string;
          balance_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          balance_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          balance_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_accounts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: true;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      credit_ledger_entries: {
        Row: {
          id: string;
          credit_account_id: string;
          kind: CreditLedgerKind;
          amount_seconds: number;
          balance_after_seconds: number;
          reference_type: string | null;
          reference_id: string | null;
          idempotency_key: string;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          credit_account_id: string;
          kind: CreditLedgerKind;
          amount_seconds: number;
          balance_after_seconds: number;
          reference_type?: string | null;
          reference_id?: string | null;
          idempotency_key: string;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          credit_account_id?: string;
          kind?: CreditLedgerKind;
          amount_seconds?: number;
          balance_after_seconds?: number;
          reference_type?: string | null;
          reference_id?: string | null;
          idempotency_key?: string;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_ledger_entries_credit_account_id_fkey";
            columns: ["credit_account_id"];
            isOneToOne: false;
            referencedRelation: "credit_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_ledger_entries: {
        Row: {
          id: string;
          budget_reservation_id: string | null;
          workspace_id: string | null;
          origin: UsageOrigin;
          model: string;
          seconds_processed: number;
          estimated_cost_micros_usd: number;
          actual_cost_micros_usd: number;
          estimated_cost_cents_brl: number;
          actual_cost_cents_brl: number;
          idempotency_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_reservation_id?: string | null;
          workspace_id?: string | null;
          origin: UsageOrigin;
          model: string;
          seconds_processed: number;
          estimated_cost_micros_usd: number;
          actual_cost_micros_usd: number;
          estimated_cost_cents_brl: number;
          actual_cost_cents_brl: number;
          idempotency_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_reservation_id?: string | null;
          workspace_id?: string | null;
          origin?: UsageOrigin;
          model?: string;
          seconds_processed?: number;
          estimated_cost_micros_usd?: number;
          actual_cost_micros_usd?: number;
          estimated_cost_cents_brl?: number;
          actual_cost_cents_brl?: number;
          idempotency_key?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_ledger_entries_budget_reservation_id_fkey";
            columns: ["budget_reservation_id"];
            isOneToOne: false;
            referencedRelation: "budget_reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_ledger_entries_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_periods: {
        Row: {
          id: string;
          envelope: BudgetEnvelope;
          period_start: string;
          period_end: string;
          cap_cents_brl: number;
          reserved_cents_brl: number;
          consumed_cents_brl: number;
          status: BudgetPeriodStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          envelope: BudgetEnvelope;
          period_start: string;
          period_end: string;
          cap_cents_brl: number;
          reserved_cents_brl?: number;
          consumed_cents_brl?: number;
          status?: BudgetPeriodStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          envelope?: BudgetEnvelope;
          period_start?: string;
          period_end?: string;
          cap_cents_brl?: number;
          reserved_cents_brl?: number;
          consumed_cents_brl?: number;
          status?: BudgetPeriodStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budget_reservations: {
        Row: {
          id: string;
          budget_period_id: string;
          identity_key: string;
          estimated_cost_cents_brl: number;
          captured_cost_cents_brl: number | null;
          status: BudgetReservationStatus;
          idempotency_key: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          budget_period_id: string;
          identity_key: string;
          estimated_cost_cents_brl: number;
          captured_cost_cents_brl?: number | null;
          status?: BudgetReservationStatus;
          idempotency_key: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          budget_period_id?: string;
          identity_key?: string;
          estimated_cost_cents_brl?: number;
          captured_cost_cents_brl?: number | null;
          status?: BudgetReservationStatus;
          idempotency_key?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_reservations_budget_period_id_fkey";
            columns: ["budget_period_id"];
            isOneToOne: false;
            referencedRelation: "budget_periods";
            referencedColumns: ["id"];
          },
        ];
      };
      free_tier_configs: {
        Row: {
          id: string;
          max_seconds_total: number;
          renewable: boolean;
          is_active: boolean;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          max_seconds_total: number;
          renewable?: boolean;
          is_active?: boolean;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          max_seconds_total?: number;
          renewable?: boolean;
          is_active?: boolean;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      quota_counters: {
        Row: {
          id: string;
          bucket: string;
          window_key: string;
          consumed_units: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bucket: string;
          window_key: string;
          consumed_units?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bucket?: string;
          window_key?: string;
          consumed_units?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quota_consumption_entries: {
        Row: {
          id: string;
          quota_counter_id: string;
          units: number;
          idempotency_key: string;
          reference_type: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quota_counter_id: string;
          units: number;
          idempotency_key: string;
          reference_type?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quota_counter_id?: string;
          units?: number;
          idempotency_key?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quota_consumption_entries_quota_counter_id_fkey";
            columns: ["quota_counter_id"];
            isOneToOne: false;
            referencedRelation: "quota_counters";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_admins: {
        Row: {
          user_id: string;
          granted_by: string | null;
          granted_at: string;
        };
        Insert: {
          user_id: string;
          granted_by?: string | null;
          granted_at?: string;
        };
        Update: {
          user_id?: string;
          granted_by?: string | null;
          granted_at?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          workspace_id: string;
          created_by: string;
          storage_key: string;
          original_filename: string | null;
          status: MediaAssetStatus;
          declared_content_type: string;
          declared_size_bytes: number;
          actual_content_type: string | null;
          actual_size_bytes: number | null;
          rejection_reason: string | null;
          expires_at: string;
          validated_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          created_by: string;
          storage_key: string;
          original_filename?: string | null;
          status?: MediaAssetStatus;
          declared_content_type: string;
          declared_size_bytes: number;
          actual_content_type?: string | null;
          actual_size_bytes?: number | null;
          rejection_reason?: string | null;
          expires_at: string;
          validated_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          created_by?: string;
          storage_key?: string;
          original_filename?: string | null;
          status?: MediaAssetStatus;
          declared_content_type?: string;
          declared_size_bytes?: number;
          actual_content_type?: string | null;
          actual_size_bytes?: number | null;
          rejection_reason?: string | null;
          expires_at?: string;
          validated_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_workspace_member: {
        Args: {
          p_workspace_id: string;
          p_min_role?: WorkspaceRole;
        };
        Returns: boolean;
      };
      workspace_role_rank: {
        Args: {
          p_role: WorkspaceRole;
        };
        Returns: number;
      };
      consume_quota: {
        Args: {
          p_bucket: string;
          p_window: string;
          p_units: number;
          p_limit: number;
          p_idempotency_key: string;
          p_reference_type?: string | null;
          p_reference_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["quota_counters"]["Row"];
      };
      ledger_append: {
        Args: {
          p_credit_account_id: string;
          p_kind: CreditLedgerKind;
          p_amount_seconds: number;
          p_idempotency_key: string;
          p_reference_type?: string | null;
          p_reference_id?: string | null;
          p_metadata?: Json;
          p_created_by?: string | null;
        };
        Returns: Database["public"]["Tables"]["credit_ledger_entries"]["Row"];
      };
      reserve_free_budget: {
        Args: {
          p_envelope: BudgetEnvelope;
          p_period_start: string;
          p_period_end: string;
          p_identity_key: string;
          p_estimated_cost_cents_brl: number;
          p_idempotency_key: string;
          p_expires_in_seconds?: number;
        };
        Returns: Database["public"]["Tables"]["budget_reservations"]["Row"];
      };
      capture_budget_reservation: {
        Args: {
          p_reservation_id: string;
          p_actual_cost_cents_brl: number;
          p_model: string;
          p_seconds_processed: number;
          p_estimated_cost_micros_usd: number;
          p_actual_cost_micros_usd: number;
          p_workspace_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["usage_ledger_entries"]["Row"];
      };
      release_budget_reservation: {
        Args: {
          p_reservation_id: string;
          p_reason?: string;
        };
        Returns: Database["public"]["Tables"]["budget_reservations"]["Row"];
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
