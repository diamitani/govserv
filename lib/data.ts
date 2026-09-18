import services from "@/data/services.json";
import type { GovService, ServiceLevel } from "./types";

const all = services as GovService[];

export function getServices(): GovService[] {
  return all;
}

export function getServiceById(id: string): GovService | undefined {
  return all.find((s) => s.id === id);
}

export interface ServiceFilters {
  q?: string;
  category?: string;
  level?: ServiceLevel;
  state?: string;
}

/** Generic filter — works on any registry list (client bundle or fresh disk read). */
export function filterServicesFrom(list: GovService[], filters: ServiceFilters): GovService[] {
  const q = (filters.q ?? "").trim().toLowerCase();
  return list.filter((s) => {
    if (filters.category && s.category.toLowerCase() !== filters.category.toLowerCase()) return false;
    if (filters.level && s.scope.level !== filters.level) return false;
    if (filters.state && (s.scope.state ?? "").toLowerCase() !== filters.state.toLowerCase()) return false;
    if (q) {
      const hay = [
        s.name, s.agency, s.category, s.description,
        s.scope.city ?? "", s.scope.county ?? "", s.scope.state ?? "",
        ...s.eligibility, ...s.prerequisites, ...s.whatToBring,
      ].join(" ").toLowerCase();
      const tokens = q.split(/\s+/);
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export function filterServices(filters: ServiceFilters): GovService[] {
  return filterServicesFrom(all, filters);
}

export function getCategories(): string[] {
  const set = new Set(all.map((s) => s.category));
  return [...set].sort();
}

export const LEVELS: ServiceLevel[] = ["city", "county", "state", "federal"];

export function servicesCount(): number {
  return all.length;
}
