import type { Database as BaseDatabase, Json } from "./types";

export type TranscriptSource = "ai" | "native_captions";

type BasePublic = BaseDatabase["public"];
type BaseTables = BasePublic["Tables"];
type BaseFunctions = BasePublic["Functions"];

/**
 * Extensão incremental do schema manual enquanto `supabase gen types`
 * continua indisponível neste ambiente. Mantém o cliente existente e
 * adiciona somente as migrations 0013–0015, sem duplicar as tabelas
 * anteriores.
 */
export type Database = Omit<BaseDatabase, "public"> & {
  public: Omit<BasePublic, "Tables" | "Functions"> & {
    Tables: BaseTables & {
      transcripts: {
        Row: {
          id: string;
          job_id: string;
          workspace_id: string;
          language: string;
          source: TranscriptSource;
          model: string | null;
          text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          workspace_id: string;
          language: string;
          source: TranscriptSource;
          model?: string | null;
          text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          workspace_id?: string;
          language?: string;
          source?: TranscriptSource;
          model?: string | null;
          text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transcripts_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: true;
            referencedRelation: "transcription_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transcripts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      transcript_segments: {
        Row: {
          id: string;
          transcript_id: string;
          position: number;
          start_ms: number;
          end_ms: number;
          text: string;
          speaker_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          transcript_id: string;
          position: number;
          start_ms: number;
          end_ms: number;
          text: string;
          speaker_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          transcript_id?: string;
          position?: number;
          start_ms?: number;
          end_ms?: number;
          text?: string;
          speaker_label?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transcript_segments_transcript_id_fkey";
            columns: ["transcript_id"];
            isOneToOne: false;
            referencedRelation: "transcripts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: BaseFunctions & {
      persist_transcript_result: {
        Args: {
          p_job_id: string;
          p_worker_id: string;
          p_language: string;
          p_source: TranscriptSource;
          p_model: string;
          p_text: string;
          p_segments: Json;
        };
        Returns: Database["public"]["Tables"]["transcripts"]["Row"];
      };
      complete_transcription_job: {
        Args: {
          p_job_id: string;
          p_worker_id: string;
          p_language: string;
          p_source: TranscriptSource;
          p_model: string;
          p_text: string;
          p_segments: Json;
          p_seconds_processed: number;
          p_actual_cost_cents_brl: number;
          p_estimated_cost_micros_usd: number;
          p_actual_cost_micros_usd: number;
        };
        Returns: Database["public"]["Tables"]["transcription_jobs"]["Row"];
      };
      request_job_cancel: {
        Args: {
          p_job_id: string;
          p_detail?: string | null;
        };
        Returns: Database["public"]["Tables"]["transcription_jobs"]["Row"];
      };
      cancel_job: {
        Args: {
          p_job_id: string;
          p_worker_id: string;
          p_detail?: string | null;
        };
        Returns: Database["public"]["Tables"]["transcription_jobs"]["Row"];
      };
    };
  };
};
