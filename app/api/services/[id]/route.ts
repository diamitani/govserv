import { NextResponse } from "next/server";
import { readRegistry } from "@/lib/server-data";

/** GET /api/services/[id] → one service or 404 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const registry = await readRegistry();
  const service = registry.find((s) => s.id === id);
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  return NextResponse.json({ service });
}
