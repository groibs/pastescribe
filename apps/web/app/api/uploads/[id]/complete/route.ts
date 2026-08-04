import { fileTypeFromBuffer } from "file-type";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { noopAntivirusScanner } from "@pastescribe/storage";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStoragePort } from "@/lib/storage/config";
import { ALLOWED_MEDIA_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES, MIME_SNIFF_BYTE_COUNT } from "@/lib/uploads/constants";
import { MAX_JOBS_ENQUEUED_PER_DAY, jobEnqueueQuotaBucket, jobEnqueueQuotaWindow } from "@/lib/jobs/constants";
import type { TypedSupabaseClient } from "@pastescribe/database";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Validação real pós-upload — padrão "quarentena, valida, libera ou
 * apaga" (skill pastescribe-upload-url-security §2). O cliente já
 * subiu os bytes direto pro storage; aqui o servidor confere o objeto
 * de VERDADE (tamanho via headObject, MIME via sniffing dos bytes
 * reais) antes de marcar utilizável. Qualquer falha apaga o objeto —
 * nunca fica "meio válido".
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // RLS: só devolve a linha se o usuário for membro do workspace dela.
  const { data: asset } = await supabase
    .from("media_assets")
    .select("id, workspace_id, storage_key, status")
    .eq("id", id)
    .maybeSingle();

  if (!asset) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (asset.status !== "pending_upload") {
    return NextResponse.json({ error: "already_processed", status: asset.status }, { status: 409 });
  }

  const storage = getStoragePort();
  const admin = getSupabaseAdminClient();
  if (!storage || !admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const metadata = await storage.headObject(asset.storage_key);
  if (!metadata) {
    await admin
      .from("media_assets")
      .update({ status: "rejected", rejection_reason: "upload_not_found" })
      .eq("id", id);
    return NextResponse.json({ error: "upload_not_found" }, { status: 422 });
  }

  if (metadata.sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    await storage.deleteObject(asset.storage_key);
    await admin
      .from("media_assets")
      .update({ status: "rejected", rejection_reason: "size_exceeded", actual_size_bytes: metadata.sizeBytes })
      .eq("id", id);
    return NextResponse.json({ error: "size_exceeded" }, { status: 422 });
  }

  const sniffEndByte = Math.max(Math.min(MIME_SNIFF_BYTE_COUNT, metadata.sizeBytes) - 1, 0);
  const head = await storage.getObjectRange(asset.storage_key, 0, sniffEndByte);
  const detected = await fileTypeFromBuffer(head);

  if (!detected || !ALLOWED_MEDIA_MIME_TYPES.has(detected.mime)) {
    await storage.deleteObject(asset.storage_key);
    await admin
      .from("media_assets")
      .update({
        status: "rejected",
        rejection_reason: "unsupported_type",
        actual_content_type: detected?.mime ?? null,
        actual_size_bytes: metadata.sizeBytes,
      })
      .eq("id", id);
    return NextResponse.json({ error: "unsupported_type" }, { status: 422 });
  }

  const scan = await noopAntivirusScanner.scan(head);
  if (!scan.clean) {
    await storage.deleteObject(asset.storage_key);
    await admin
      .from("media_assets")
      .update({ status: "rejected", rejection_reason: scan.reason ?? "antivirus_rejected" })
      .eq("id", id);
    return NextResponse.json({ error: "rejected_by_scan" }, { status: 422 });
  }

  await admin
    .from("media_assets")
    .update({
      status: "validated",
      actual_content_type: detected.mime,
      actual_size_bytes: metadata.sizeBytes,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id);

  const enqueueResult = await enqueueUploadJob(admin, {
    workspaceId: asset.workspace_id,
    createdBy: userData.user.id,
    mediaAssetId: asset.id,
  });

  return NextResponse.json({
    status: "validated",
    contentType: detected.mime,
    sizeBytes: metadata.sizeBytes,
    job: enqueueResult.job ? { id: enqueueResult.job.id, state: enqueueResult.job.state } : null,
    jobError: enqueueResult.error,
  });
}

type EnqueueUploadJobParams = {
  workspaceId: string;
  createdBy: string;
  mediaAssetId: string;
};

/**
 * Primeiro consumidor real de enqueue_job (Onda 4 fatia 4.2b). Só
 * enfileira — nunca reserva orçamento aqui (isso é reserve_job_budget,
 * chamada pelo worker só depois que a duração real da mídia for
 * conhecida, docs/DECISIONS.md). consume_quota protege o passo de
 * enfileirar contra abuso (não é o gate de orçamento de IA — é sobre
 * CPU/banda do worker). Falha em qualquer um dos dois não derruba a
 * resposta 200 da validação do upload — o asset já está validado de
 * verdade; só o job não nasce, e o client sabe disso via `jobError`.
 */
async function enqueueUploadJob(
  admin: TypedSupabaseClient,
  { workspaceId, createdBy, mediaAssetId }: EnqueueUploadJobParams
): Promise<{ job: { id: string; state: string } | null; error: string | null }> {
  const quotaIdempotencyKey = `enqueue-quota:${mediaAssetId}`;
  const { error: quotaError } = await admin.rpc("consume_quota", {
    p_bucket: jobEnqueueQuotaBucket(createdBy),
    p_window: jobEnqueueQuotaWindow(),
    p_units: 1,
    p_limit: MAX_JOBS_ENQUEUED_PER_DAY,
    p_idempotency_key: quotaIdempotencyKey,
    p_reference_type: "media_asset",
    p_reference_id: mediaAssetId,
  });

  if (quotaError) {
    return { job: null, error: "quota_exceeded" };
  }

  const jobIdempotencyKey = `upload:${mediaAssetId}`;
  const { data: job, error: enqueueError } = await admin.rpc("enqueue_job", {
    p_workspace_id: workspaceId,
    p_created_by: createdBy,
    p_source_kind: "upload",
    p_idempotency_key: jobIdempotencyKey,
    p_media_asset_id: mediaAssetId,
  });

  if (enqueueError || !job) {
    return { job: null, error: "enqueue_failed" };
  }

  return { job: { id: job.id, state: job.state }, error: null };
}
