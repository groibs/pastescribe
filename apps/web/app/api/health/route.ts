import { NextResponse } from "next/server";

/**
 * Healthcheck — sem autenticação, sem dado sensível, sem efeito colateral.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "pastescribe-web",
  });
}
