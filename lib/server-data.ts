import { promises as fs } from "fs";
import path from "path";
import type { GovService } from "./types";

/**
 * Server-only: read the registry fresh from disk on every request.
 * Used by API routes so CMS edits in dev are visible immediately,
 * without waiting for a rebuild/redeploy.
 */
export async function readRegistry(): Promise<GovService[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "services.json"), "utf8");
    return JSON.parse(raw) as GovService[];
  } catch {
    return [];
  }
}
