import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStoragePort } from "@/lib/storage/config";
import {
  ALLOWED_MEDIA_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  PRESIGNED_UPLOAD_TTL_SECONDS,
  sanitizeFilename,
} from "@/lib/uploads/constants";

type CreateUploadBody = {
  workspaceId: string;
  filename: string;
  declaredContentType: string;
  declaredSizeBytes: number;
};

function parseBody(body: unknown): CreateUploadBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const { workspaceId, filename, declaredContentType, declaredSizeBytes } = body as Record<string, unknown>;
  if (typeof workspaceId !== "string" || workspaceId.length === 0) {
    return null;
  }
  if (typeof filename !== "string") {
    return null;
  }
  if (typeof declaredContentType !== "string" || declaredContentType.length === 0) {
    return null;
  }
  if (typeof declaredSizeBytes !== "number" || !Number.isFinite(declaredSizeBytes) || declaredSizeBytes <= 0) {
    return null;
  }
  return { workspaceId, filename, declaredContentType, declaredSizeBytes };
}

/**
 * Cria um media_asset ('pending_upload') e devolve uma URL assinada de
 * upload direto pro storage — os bytes nunca passam por esta função
 * (Vercel serverless não aguenta corpo de request grande). Quem
 * decide se o usuário pode mesmo criar isso é a RLS de
 * media_assets_insert_editor, não um check manual aqui.
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseBody(rawBody);
  if (!parsed) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (parsed.declaredSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }
  if (!ALLOWED_MEDIA_MIME_TYPES.has(parsed.declaredContentType)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }

  const storage = getStoragePort();
  if (!storage) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  const storageKey = `uploads/${parsed.workspaceId}/${randomUUID()}`;
  const expiresAt = new Date(Date.now() + PRESIGNED_UPLOAD_TTL_SECONDS * 1000);

  const { data: asset, error } = await supabase
    .from("media_assets")
    .insert({
      workspace_id: parsed.workspaceId,
      created_by: userData.user.id,
      storage_key: storageKey,
      original_filename: sanitizeFilename(parsed.filename),
      declared_content_type: parsed.declaredContentType,
      declared_size_bytes: parsed.declaredSizeBytes,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !asset) {
    // RLS barrou (não é editor+ do workspace) ou workspace_id não existe.
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const presigned = await storage.createPresignedPut({
    key: storageKey,
    contentType: parsed.declaredContentType,
    expiresInSeconds: PRESIGNED_UPLOAD_TTL_SECONDS,
  });

  return NextResponse.json({
    mediaAssetId: asset.id,
    uploadUrl: presigned.url,
    expiresAt: presigned.expiresAt.toISOString(),
  });
}
