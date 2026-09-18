import { NextResponse } from "next/server";
import { filterServicesFrom } from "@/lib/data";
import { readRegistry } from "@/lib/server-data";
import type { ServiceLevel } from "@/lib/types";

/**
 * GET /api/services?q=&category=&level=&state= → filtered services JSON
 * Reads the registry fresh from disk so CMS edits in dev show up immediately.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const registry = await readRegistry();
  const results = filterServicesFrom(registry, {
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    level: (level as ServiceLevel) || undefined,
    state: searchParams.get("state") ?? undefined,
  });
  return NextResponse.json({ count: results.length, services: results });
}
