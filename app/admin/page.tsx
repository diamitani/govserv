"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LevelBadge } from "@/components/ServiceCard";
import type { GovService, ServiceLevel } from "@/lib/types";

interface KbPayload {
  services: GovService[];
  readonly: boolean;
  kbFiles: string[];
}

const LEVELS: ServiceLevel[] = ["city", "county", "state", "federal"];
const KINDS = ["phone", "web", "email", "in-person"] as const;

function lines(v: string): string[] {
  return v.split("\n").map((s) => s.trim()).filter(Boolean);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  id: "", name: "", agency: "", category: "", description: "", cost: "Free",
  level: "state" as ServiceLevel, city: "", county: "", state: "Illinois",
  eligibility: "", prerequisites: "", whatToBring: "", languages: "English\nSpanish",
  sources: "", deadlines: "", contacts: "", applyLinks: "",
};

function formFromService(s: GovService) {
  return {
    id: s.id, name: s.name, agency: s.agency, category: s.category,
    description: s.description, cost: s.cost,
    level: s.scope.level, city: s.scope.city ?? "", county: s.scope.county ?? "", state: s.scope.state ?? "",
    eligibility: s.eligibility.join("\n"),
    prerequisites: s.prerequisites.join("\n"),
    whatToBring: s.whatToBring.join("\n"),
    languages: s.languages.join("\n"),
    sources: s.sources.join("\n"),
    deadlines: s.deadlines.map((d) => [d.label, d.date ?? "", d.note ?? ""].join(" | ")).join("\n"),
    contacts: s.contacts.map((c) => [c.kind, c.label, c.value].join(" | ")).join("\n"),
    applyLinks: s.applyLinks.map((l) => [l.label, l.url].join(" | ")).join("\n"),
  };
}

function serviceFromForm(f: typeof EMPTY_FORM, editingId: string | null): GovService {
  const id = editingId ?? f.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return {
    id,
    name: f.name.trim(),
    agency: f.agency.trim(),
    category: f.category.trim(),
    description: f.description.trim(),
    scope: {
      level: f.level,
      ...(f.city.trim() ? { city: f.city.trim() } : {}),
      ...(f.county.trim() ? { county: f.county.trim() } : {}),
      ...(f.state.trim() ? { state: f.state.trim() } : {}),
    },
    eligibility: lines(f.eligibility),
    deadlines: lines(f.deadlines).map((ln) => {
      const [label, date, ...note] = ln.split("|").map((p) => p.trim());
      return { label: label ?? ln, date: date || null, note: note.join(" | ") || undefined };
    }),
    prerequisites: lines(f.prerequisites),
    whatToBring: lines(f.whatToBring),
    contacts: lines(f.contacts).map((ln) => {
      const [kind, label, ...value] = ln.split("|").map((p) => p.trim());
      return { kind: (KINDS as readonly string[]).includes(kind) ? kind : "web", label: label ?? "", value: value.join(" | ") };
    }) as GovService["contacts"],
    applyLinks: lines(f.applyLinks).map((ln) => {
      const [label, ...url] = ln.split("|").map((p) => p.trim());
      return { label: label ?? "", url: url.join(" | ") };
    }),
    languages: lines(f.languages),
    cost: f.cost.trim() || "Free",
    verifiedAt: today(),
    sources: lines(f.sources),
  };
}

export default function AdminPage() {
  const [data, setData] = useState<KbPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const readonly = process.env.NEXT_PUBLIC_READONLY === "true" || (data?.readonly ?? false);

  const load = async () => {
    try {
      const res = await fetch("/api/kb");
      if (!res.ok) throw new Error(`KB API returned ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load knowledge base");
    }
  };

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const services = data.services;
    const cats = new Set(services.map((s) => s.category)).size;
    const verified = services.map((s) => s.verifiedAt).sort();
    const last = verified[verified.length - 1] ?? "—";
    const stale = services.filter((s) => {
      const days = (Date.now() - new Date(s.verifiedAt).getTime()) / 86400000;
      return days > 30;
    }).length;
    return { count: services.length, cats, last, stale };
  }, [data]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (s: GovService) => {
    setForm(formFromService(s));
    setEditingId(s.id);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readonly || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const service = serviceFromForm(form, editingId);
      if (!service.id || !service.name) throw new Error("ID and name are required.");
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: editingId ? "update" : "create", service }),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error ?? `Save failed (${res.status})`);
      setNotice(`Saved "${service.id}".`);
      setModalOpen(false);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-navy-950 sm:text-4xl">Knowledge base</h1>
              <p className="mt-2 text-slate-600">The CMS behind GovServ — every service entry lives here.</p>
            </div>
            <button
              onClick={openAdd}
              disabled={readonly}
              className="rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 shadow transition hover:bg-gold-400 disabled:opacity-40"
            >
              Add service
            </button>
          </div>

          {readonly && (
            <div className="mt-6 rounded-2xl border border-gold-500/50 bg-gold-50 p-5">
              <p className="font-semibold text-navy-950">Read-only deployment</p>
              <p className="mt-1 text-sm text-slate-600">
                Editing is disabled on this deployment. Connect Supabase for production editing —
                see the README&apos;s Supabase roadmap.
              </p>
            </div>
          )}

          {notice && (
            <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 fade-up" role="status">
              {notice}
            </div>
          )}

          {error ? (
            <p className="mt-6 text-red-700">Error: {error}</p>
          ) : !data ? (
            <p className="mt-6 text-slate-500">Loading knowledge base…</p>
          ) : (
            <>
              {/* Stats */}
              {stats && (
                <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    { label: "Services", value: String(stats.count) },
                    { label: "Categories", value: String(stats.cats) },
                    { label: "Last verified", value: stats.last },
                    { label: "Stale (>30 days)", value: String(stats.stale) },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</dt>
                      <dd className="mt-1 font-display text-2xl font-bold text-navy-950">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {/* Table */}
              <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Service</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Level</th>
                      <th className="px-5 py-3">Verified</th>
                      <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.services.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-navy-950">{s.name}</p>
                          <p className="text-xs text-slate-500">{s.id}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{s.category}</td>
                        <td className="px-5 py-3.5"><LevelBadge level={s.scope.level} /></td>
                        <td className="px-5 py-3.5 text-slate-600">{s.verifiedAt}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => openEdit(s)}
                            disabled={readonly}
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 disabled:opacity-40"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* KB files */}
              <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="font-display text-xl font-bold text-navy-950">State knowledge-base files</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Compressed markdown notes the GovGuide engine and weekly loop read. One file per state under <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">data/kb/</code>.
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {data.kbFiles.map((f) => (
                    <li key={f} className="rounded-xl bg-slate-50 px-4 py-3 font-mono text-sm text-navy-950 ring-1 ring-slate-200">
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4" role="dialog" aria-modal="true" aria-label={editingId ? "Edit service" : "Add service"}>
          <form onSubmit={save} className="thin-scroll my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="font-display text-2xl font-bold text-navy-950">
              {editingId ? `Edit: ${editingId}` : "Add service"}
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="ID (slug)" required={!editingId} disabled={!!editingId}>
                <input value={form.id} onChange={(e) => set("id", e.target.value)} disabled={!!editingId}
                  placeholder="auto-generated from name if blank" className={inp} />
              </Field>
              <Field label="Name" required>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} required className={inp} />
              </Field>
              <Field label="Agency" required>
                <input value={form.agency} onChange={(e) => set("agency", e.target.value)} required className={inp} />
              </Field>
              <Field label="Category" required>
                <input value={form.category} onChange={(e) => set("category", e.target.value)} required placeholder="Food, Housing, Health…" className={inp} />
              </Field>
              <Field label="Level">
                <select value={form.level} onChange={(e) => set("level", e.target.value)} className={inp}>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Cost">
                <input value={form.cost} onChange={(e) => set("cost", e.target.value)} className={inp} />
              </Field>
              <Field label="City"><input value={form.city} onChange={(e) => set("city", e.target.value)} className={inp} /></Field>
              <Field label="County"><input value={form.county} onChange={(e) => set("county", e.target.value)} className={inp} /></Field>
              <Field label="State"><input value={form.state} onChange={(e) => set("state", e.target.value)} className={inp} /></Field>
            </div>

            <Field label="Description" className="mt-4">
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inp} />
            </Field>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Eligibility (one per line)"><textarea value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} rows={4} className={inp} /></Field>
              <Field label="Prerequisites (one per line)"><textarea value={form.prerequisites} onChange={(e) => set("prerequisites", e.target.value)} rows={4} className={inp} /></Field>
              <Field label="What to bring (one per line)"><textarea value={form.whatToBring} onChange={(e) => set("whatToBring", e.target.value)} rows={4} className={inp} /></Field>
              <Field label="Languages (one per line)"><textarea value={form.languages} onChange={(e) => set("languages", e.target.value)} rows={4} className={inp} /></Field>
            </div>
            <Field label="Deadlines — one per line: label | YYYY-MM-DD (blank if rolling) | note" className="mt-4">
              <textarea value={form.deadlines} onChange={(e) => set("deadlines", e.target.value)} rows={3} className={inp} placeholder="Program year opens | 2026-09-01 | Priority groups first" />
            </Field>
            <Field label="Contacts — one per line: phone|web|email|in-person | label | value" className="mt-4">
              <textarea value={form.contacts} onChange={(e) => set("contacts", e.target.value)} rows={3} className={inp} placeholder="phone | LIHEAP Hotline | 1-877-411-9276" />
            </Field>
            <Field label="Application links — one per line: label | url" className="mt-4">
              <textarea value={form.applyLinks} onChange={(e) => set("applyLinks", e.target.value)} rows={2} className={inp} />
            </Field>
            <Field label="Sources (one URL per line)" className="mt-4">
              <textarea value={form.sources} onChange={(e) => set("sources", e.target.value)} rows={2} className={inp} />
            </Field>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={saving || readonly} className="rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                {saving ? "Saving…" : editingId ? "Save changes" : "Add service"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inp = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-100 disabled:bg-slate-100";

function Field({ label, children, className = "", required, disabled }: {
  label: string; children: React.ReactNode; className?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}{required && !disabled ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
