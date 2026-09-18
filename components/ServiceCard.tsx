import Link from "next/link";
import type { GovService } from "@/lib/types";

const LEVEL_STYLES: Record<string, string> = {
  city: "bg-gold-100 text-navy-950",
  county: "bg-navy-100 text-navy-800",
  state: "bg-indigo-100 text-indigo-900",
  federal: "bg-emerald-100 text-emerald-900",
};

export function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${LEVEL_STYLES[level] ?? "bg-slate-100 text-slate-700"}`}
    >
      {level}
    </span>
  );
}

export function DeadlineBadge({ service }: { service: GovService }) {
  const dated = service.deadlines.filter((d) => d.date).sort((a, b) => a.date!.localeCompare(b.date!));
  if (dated.length === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        Rolling intake
      </span>
    );
  }
  const next = dated[0];
  const days = Math.ceil((new Date(next.date!).getTime() - Date.now()) / 86400000);
  const urgent = days <= 45;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        urgent ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"
      }`}
      title={`${next.label}: ${next.date}${next.note ? ` — ${next.note}` : ""}`}
    >
      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {urgent ? `Due ${next.date}` : next.date}
    </span>
  );
}

export default function ServiceCard({ service }: { service: GovService }) {
  const scope =
    service.scope.city ?? service.scope.county ?? service.scope.state ?? "Nationwide";
  return (
    <Link
      href={`/services/${service.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-navy-100 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">
          {service.category}
        </span>
        <LevelBadge level={service.scope.level} />
      </div>
      <h3 className="mt-2 font-display text-xl font-bold text-navy-950 group-hover:text-navy-700">
        {service.name}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {service.agency} · {scope}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
        {service.description}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DeadlineBadge service={service} />
        {service.cost === "Free" || service.cost.startsWith("Free") ? (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Free
          </span>
        ) : null}
      </div>
      <span className="mt-4 text-sm font-semibold text-navy-700 group-hover:underline">
        View details →
      </span>
    </Link>
  );
}
