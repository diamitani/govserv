"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DeadlineBadge, LevelBadge } from "@/components/ServiceCard";
import { getServiceById } from "@/lib/data";
import { uid, useLocalStorage } from "@/lib/store";
import type {
  ApplicationStatus,
  DashboardState,
  TrackedApplication,
} from "@/lib/types";

const EMPTY: DashboardState = { applications: [], customDeadlines: [], saved: [], tasks: {} };

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "to-start", label: "To start" },
  { value: "gathering-docs", label: "Gathering docs" },
  { value: "submitted", label: "Submitted" },
  { value: "waiting", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  "to-start": "bg-slate-100 text-slate-700",
  "gathering-docs": "bg-gold-100 text-navy-950",
  submitted: "bg-navy-100 text-navy-800",
  waiting: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-800",
  denied: "bg-red-100 text-red-800",
};

type Tab = "applications" | "deadlines" | "saved" | "tasks";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const { value, set, hydrated } = useLocalStorage<DashboardState>("govserv:v1", EMPTY);
  const [tab, setTab] = useState<Tab>("applications");

  const setStatus = (id: string, status: ApplicationStatus) =>
    set((p) => ({
      ...p,
      applications: p.applications.map((a) =>
        a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
      ),
    }));

  const setNotes = (id: string, notes: string) =>
    set((p) => ({
      ...p,
      applications: p.applications.map((a) =>
        a.id === id ? { ...a, notes, updatedAt: new Date().toISOString() } : a
      ),
    }));

  const removeApp = (id: string) =>
    set((p) => ({ ...p, applications: p.applications.filter((a) => a.id !== id) }));

  const unsave = (serviceId: string) =>
    set((p) => ({ ...p, saved: p.saved.filter((s) => s.serviceId !== serviceId) }));

  const addCustomDeadline = (label: string, date: string, note?: string) =>
    set((p) => ({
      ...p,
      customDeadlines: [...p.customDeadlines, { id: uid(), label, date, note }],
    }));

  const removeDeadline = (id: string) =>
    set((p) => ({ ...p, customDeadlines: p.customDeadlines.filter((d) => d.id !== id) }));

  const toggleTask = (serviceId: string, idx: number) =>
    set((p) => ({
      ...p,
      tasks: {
        ...p.tasks,
        [serviceId]: { ...(p.tasks[serviceId] ?? {}), [idx]: !(p.tasks[serviceId]?.[idx] ?? false) },
      },
    }));

  // Merged deadlines: service deadlines from tracked apps + custom
  const deadlines = useMemo(() => {
    const list: { id: string; label: string; date: string | null; note?: string; source: string; removeId?: string }[] =
      [];
    for (const app of value.applications) {
      const s = getServiceById(app.serviceId);
      if (!s) continue;
      for (const d of s.deadlines) {
        list.push({
          id: `${app.id}-${d.label}`,
          label: `${s.name}: ${d.label}`,
          date: d.date,
          note: d.note,
          source: "service",
        });
      }
    }
    for (const d of value.customDeadlines) {
      list.push({ id: d.id, label: d.label, date: d.date, note: d.note, source: "custom", removeId: d.id });
    }
    list.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
    return list;
  }, [value.applications, value.customDeadlines]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "applications", label: "Applications", count: value.applications.length },
    { id: "deadlines", label: "Deadlines", count: deadlines.filter((d) => d.date).length },
    { id: "saved", label: "Saved", count: value.saved.length },
    { id: "tasks", label: "Tasks" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-navy-950 sm:text-4xl">My dashboard</h1>
          <p className="mt-2 text-slate-600">Your applications, deadlines, and checklists — stored only in this browser.</p>

          <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 ring-1 ring-slate-200" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  tab === t.id ? "bg-navy-950 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${tab === t.id ? "bg-white/20" : "bg-slate-200"}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {!hydrated ? (
              <p className="text-slate-500">Loading your dashboard…</p>
            ) : tab === "applications" ? (
              <ApplicationsTab
                apps={value.applications}
                setStatus={setStatus}
                setNotes={setNotes}
                removeApp={removeApp}
              />
            ) : tab === "deadlines" ? (
              <DeadlinesTab deadlines={deadlines} onAdd={addCustomDeadline} onRemove={removeDeadline} />
            ) : tab === "saved" ? (
              <SavedTab saved={value.saved} onUnsave={unsave} />
            ) : (
              <TasksTab apps={value.applications} tasks={value.tasks} onToggle={toggleTask} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

/* ── Applications ─────────────────────────────────────────────── */

function ApplicationsTab({
  apps, setStatus, setNotes, removeApp,
}: {
  apps: TrackedApplication[];
  setStatus: (id: string, s: ApplicationStatus) => void;
  setNotes: (id: string, n: string) => void;
  removeApp: (id: string) => void;
}) {
  if (apps.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        body="Track a service to follow it through the pipeline — gathering docs, submitted, waiting, approved."
        cta={{ label: "Browse services", href: "/services" }}
      />
    );
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {apps.map((app) => {
        const s = getServiceById(app.serviceId);
        if (!s) return null;
        return (
          <article key={app.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/services/${s.id}`} className="font-display text-lg font-bold text-navy-950 hover:underline">
                  {s.name}
                </Link>
                <p className="mt-0.5 text-sm text-slate-500">{s.agency}</p>
              </div>
              <button
                onClick={() => removeApp(app.id)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-700"
                aria-label={`Remove ${s.name} from dashboard`}
              >
                Remove
              </button>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STATUSES.map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setStatus(app.id, st.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      app.status === st.value ? STATUS_COLORS[st.value] + " ring-2 ring-navy-950/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                    aria-pressed={app.status === st.value}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor={`notes-${app.id}`} className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Notes
              </label>
              <textarea
                id={`notes-${app.id}`}
                value={app.notes}
                onChange={(e) => setNotes(app.id, e.target.value)}
                placeholder="Case number, contact name, next step…"
                rows={2}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-100"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <DeadlineBadge service={s} />
              <Link href={`/chat?service=${s.id}`} className="text-sm font-semibold text-navy-700 hover:underline">
                Ask GovGuide →
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* ── Deadlines ────────────────────────────────────────────────── */

function DeadlinesTab({
  deadlines, onAdd, onRemove,
}: {
  deadlines: { id: string; label: string; date: string | null; note?: string; source: string; removeId?: string }[];
  onAdd: (label: string, date: string, note?: string) => void;
  onRemove: (id: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !date) return;
    onAdd(label.trim(), date, note.trim() || undefined);
    setLabel(""); setDate(""); setNote("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {deadlines.length === 0 ? (
          <EmptyState
            title="No deadlines"
            body="Deadlines from your tracked applications appear here. You can also add your own — court dates, renewal windows, appointments."
          />
        ) : (
          <ul className="space-y-3">
            {deadlines.map((d) => {
              const days = d.date ? Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000) : null;
              const urgent = days != null && days <= 45 && days >= 0;
              return (
                <li key={d.id} className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div>
                    <p className="font-semibold text-navy-950">{d.label}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {d.date ? fmtDate(d.date) : "No fixed date"}
                      {days != null && days >= 0 ? ` · in ${days} days` : days != null ? " · passed" : ""}
                      {d.note ? ` — ${d.note}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {urgent && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">Soon</span>
                    )}
                    {d.removeId && (
                      <button onClick={() => onRemove(d.removeId!)} className="text-xs font-medium text-slate-400 hover:text-red-700" aria-label={`Remove ${d.label}`}>
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <form onSubmit={submit} className="h-fit rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-display text-lg font-bold text-navy-950">Add a deadline</h2>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="dl-label">
          Label
        </label>
        <input id="dl-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Renewal appointment"
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-navy-700 focus:outline-none" required />
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="dl-date">
          Date
        </label>
        <input id="dl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-navy-700 focus:outline-none" required />
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-slate-500" htmlFor="dl-note">
          Note (optional)
        </label>
        <input id="dl-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bring ID and lease"
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-navy-700 focus:outline-none" />
        <button type="submit" className="mt-5 w-full rounded-xl bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
          Add deadline
        </button>
      </form>
    </div>
  );
}

/* ── Saved ────────────────────────────────────────────────────── */

function SavedTab({
  saved, onUnsave,
}: {
  saved: { id: string; serviceId: string }[];
  onUnsave: (serviceId: string) => void;
}) {
  if (saved.length === 0) {
    return (
      <EmptyState
        title="Nothing saved yet"
        body="Save services to build a shortlist you can come back to — from any service page."
        cta={{ label: "Browse services", href: "/services" }}
      />
    );
  }
  return (
    <div className="space-y-3">
      {saved.map((sv) => {
        const s = getServiceById(sv.serviceId);
        if (!s) return null;
        return (
          <article key={sv.id} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/services/${s.id}`} className="font-display text-lg font-bold text-navy-950 hover:underline">
                {s.name}
              </Link>
              <LevelBadge level={s.scope.level} />
              <DeadlineBadge service={s} />
            </div>
            <button onClick={() => onUnsave(s.id)} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-700">
              Remove
            </button>
          </article>
        );
      })}
    </div>
  );
}

/* ── Tasks ────────────────────────────────────────────────────── */

function TasksTab({
  apps, tasks, onToggle,
}: {
  apps: TrackedApplication[];
  tasks: DashboardState["tasks"];
  onToggle: (serviceId: string, idx: number) => void;
}) {
  if (apps.length === 0) {
    return (
      <EmptyState
        title="No checklists yet"
        body="When you track an application, its what-to-bring list becomes a checklist here."
        cta={{ label: "Browse services", href: "/services" }}
      />
    );
  }
  return (
    <div className="space-y-6">
      {apps.map((app) => {
        const s = getServiceById(app.serviceId);
        if (!s) return null;
        const done = s.whatToBring.filter((_, i) => tasks[app.serviceId]?.[i]).length;
        return (
          <section key={app.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/services/${s.id}`} className="font-display text-lg font-bold text-navy-950 hover:underline">
                {s.name}
              </Link>
              <span className="text-sm font-medium text-slate-500">{done}/{s.whatToBring.length} done</span>
            </div>
            <ul className="mt-4 space-y-2">
              {s.whatToBring.map((item, i) => {
                const checked = tasks[app.serviceId]?.[i] ?? false;
                return (
                  <li key={i}>
                    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      checked ? "border-emerald-200 bg-emerald-50 text-slate-500" : "border-slate-200 hover:border-slate-300"
                    }`}>
                      <input type="checkbox" checked={checked} onChange={() => onToggle(app.serviceId, i)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
                      <span className={checked ? "line-through" : ""}>{item}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────── */

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: { label: string; href: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="font-display text-xl font-bold text-navy-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p>
      {cta && (
        <Link href={cta.href} className="mt-5 inline-block rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

