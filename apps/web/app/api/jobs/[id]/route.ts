import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  JobStatusReadError,
  isJobId,
  readJobStatus,
} from "@/lib/jobs/status";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: RouteParams) {
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

  try {
    const snapshot = await readJobStatus(supabase, id);
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Vary: "Cookie",
      },
    });
  } catch (error) {
    if (error instanceof JobStatusReadError && error.code === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "read_failed" }, { status: 500 });
  }
}
