import { NextResponse } from "next/server";

/**
 * GET /api/cron/kb-update — weekly knowledge-base update loop stub.
 * Wired in vercel.json on schedule "0 9 * * 1" (Mondays 09:00 UTC).
 * See docs/KB-LOOP.md for the full loop design.
 *
 * Guard: if CRON_SECRET is set, the request must carry it as
 * `Authorization: Bearer <CRON_SECRET>` (Vercel cron sends it automatically).
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ status: "unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json({
    status: "scheduled",
    note:
      "Weekly KB loop placeholder: re-scrape agency sources, diff against data/services.json, " +
      "regenerate data/kb/<state>.md, open a PR for review. Full design in docs/KB-LOOP.md.",
    runAt: new Date().toISOString(),
  });
}
