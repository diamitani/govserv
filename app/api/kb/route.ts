import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { GovService } from "@/lib/types";

/**
 * GET  /api/kb → { services, readonly, kbFiles }
 * POST /api/kb → dev-only create/update of data/services.json
 *   body: { action: "create" | "update", service: GovService }
 *
 * On read-only deployments (READONLY=true or NEXT_PUBLIC_READONLY=true),
 * POST returns 403 with { readonly: true }. The /admin CMS then shows the
 * "Connect Supabase for production editing" notice.
 */

function dataPath() {
  return path.join(process.cwd(), "data", "services.json");
}

function kbDir() {
  return path.join(process.cwd(), "data", "kb");
}

export function isReadOnly(): boolean {
  return process.env.READONLY === "true" || process.env.NEXT_PUBLIC_READONLY === "true";
}

export async function GET() {
  const [raw, files] = await Promise.all([
    fs.readFile(dataPath(), "utf8").catch(() => "[]"),
    fs.readdir(kbDir()).catch(() => [] as string[]),
  ]);
  let services: GovService[] = [];
  try {
    services = JSON.parse(raw) as GovService[];
  } catch {
    services = [];
  }
  return NextResponse.json({
    services,
    readonly: isReadOnly(),
    kbFiles: files.filter((f) => f.endsWith(".md")).sort(),
  });
}

export async function POST(req: Request) {
  if (isReadOnly()) {
    return NextResponse.json(
      { ok: false, readonly: true, error: "Read-only deployment — connect Supabase for production editing." },
      { status: 403 }
    );
  }

  let body: { action?: string; service?: GovService };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, service } = body;
  if ((action !== "create" && action !== "update") || !service?.id || !service?.name) {
    return NextResponse.json(
      { ok: false, error: "Body must include action ('create'|'update') and a service with id + name." },
      { status: 400 }
    );
  }

  try {
    const raw = await fs.readFile(dataPath(), "utf8");
    const services = JSON.parse(raw) as GovService[];
    const idx = services.findIndex((s) => s.id === service.id);
    if (action === "create") {
      if (idx >= 0) return NextResponse.json({ ok: false, error: `Service '${service.id}' already exists.` }, { status: 409 });
      services.push(service);
    } else {
      if (idx < 0) return NextResponse.json({ ok: false, error: `Service '${service.id}' not found.` }, { status: 404 });
      services[idx] = service;
    }
    await fs.writeFile(dataPath(), JSON.stringify(services, null, 2) + "\n", "utf8");
    return NextResponse.json({ ok: true, id: service.id });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Write failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
