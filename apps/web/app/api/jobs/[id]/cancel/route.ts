import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isJobId } from "@/lib/jobs/status";

type RouteParams = { params: Promise<{ id: string }> };

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const { id } = await params;
  if (!isJobId(id)) {
    return NextResponse.json({ error: "invalid_job_id" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // A query usa o client do usuário e RLS: confirmar ownership antes de
  // elevar para service_role é obrigatório.
  const { data: visibleJob, error: visibleJobError } = await supabase
    .from("transcription_jobs")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (visibleJobError) {
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }
  if (!visibleJob) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: job, error: cancelError } = await admin.rpc("request_job_cancel", {
    p_job_id: id,
    p_detail: "requested_by_workspace_member",
  });

  if (cancelError || !job) {
    return NextResponse.json({ error: "cancel_failed" }, { status: 500 });
  }

  return NextResponse.json(
    { id: job.id, state: job.state },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
