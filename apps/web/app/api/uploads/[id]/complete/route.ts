import { fileTypeFromBuffer } from "file-type";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { noopAntivirusScanner } from "@pastescribe/storage";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStoragePort } from "@/lib/storage/config";
import { ALLOWED_MEDIA_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES, MIME_SNIFF_BYTE_COUNT } from "@/lib/uploads/constants";

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
    .select("id, storage_key, status")
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

  return NextResponse.json({ status: "validated", contentType: detected.mime, sizeBytes: metadata.sizeBytes });
}
