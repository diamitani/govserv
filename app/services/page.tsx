"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCard from "@/components/ServiceCard";
import { filterServices, getCategories, getServices } from "@/lib/data";
import type { ServiceLevel } from "@/lib/types";

const LEVEL_LABELS: { value: ServiceLevel | ""; label: string }[] = [
  { value: "", label: "All levels" },
  { value: "city", label: "City" },
  { value: "county", label: "County" },
  { value: "state", label: "State" },
  { value: "federal", label: "Federal" },
];

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Loading services…</div>}>
      <ServicesDirectory />
    </Suspense>
  );
}

function ServicesDirectory() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<ServiceLevel | "">("");
  const categories = useMemo(() => getCategories(), []);

  const results = useMemo(
    () => filterServices({ q, category: category || undefined, level: level || undefined }),
    [q, category, level]
  );

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-navy-950 sm:text-4xl">
            Services directory
          </h1>
          <p className="mt-2 text-slate-600">
            {getServices().length} programs indexed · Chicago first, Illinois statewide
          </p>

          {/* Search */}
          <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <label htmlFor="dir-search" className="sr-only">Search services</label>
            <input
              id="dir-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by keyword, agency, or need — e.g. rent, SNAP, utilities"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-100"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCategory("")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  category === "" ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? "" : c)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    category === c ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {c}
                </button>
              ))}
              <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
              <label htmlFor="level-filter" className="sr-only">Filter by government level</label>
              <select
                id="level-filter"
                value={level}
                onChange={(e) => setLevel(e.target.value as ServiceLevel | "")}
                className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-100"
              >
                {LEVEL_LABELS.map((l) => (
                  <option key={l.label} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results */}
          <p className="mt-6 text-sm text-slate-500" role="status">
            {results.length} {results.length === 1 ? "result" : "results"}
            {q ? <> for &ldquo;{q}&rdquo;</> : null}
          </p>
          {results.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="font-display text-xl font-bold text-navy-950">No matches yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Try a broader keyword, or ask GovGuide to match your situation to programs.
              </p>
              <a
                href="/chat"
                className="mt-5 inline-block rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Ask GovGuide
              </a>
            </div>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
