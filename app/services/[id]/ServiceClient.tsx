"use client";

import { useState } from "react";
import type { GovService } from "@/lib/types";
import { uid, useLocalStorage } from "@/lib/store";
import type { DashboardState } from "@/lib/types";

const EMPTY: DashboardState = { applications: [], customDeadlines: [], saved: [], tasks: {} };

export function ServiceActions({ service }: { service: GovService }) {
  const { value, set } = useLocalStorage<DashboardState>("govserv:v1", EMPTY);
  const [done, setDone] = useState<string | null>(null);

  const saved = value.saved.some((s) => s.serviceId === service.id);
  const tracked = value.applications.some((a) => a.serviceId === service.id);

  const toggleSave = () => {
    set((prev) =>
      saved
        ? { ...prev, saved: prev.saved.filter((s) => s.serviceId !== service.id) }
        : { ...prev, saved: [...prev.saved, { id: uid(), serviceId: service.id, savedAt: new Date().toISOString() }] }
    );
  };

  const track = () => {
    if (tracked) return;
    const now = new Date().toISOString();
    set((prev) => ({
      ...prev,
      applications: [
        ...prev.applications,
        { id: uid(), serviceId: service.id, status: "to-start", notes: "", createdAt: now, updatedAt: now },
      ],
    }));
    setDone("Added to your dashboard — track it under Applications.");
    setTimeout(() => setDone(null), 3500);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={toggleSave}
          className={`flex-1 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition ${
            saved
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "border border-slate-300 bg-white text-navy-950 hover:border-navy-950"
          }`}
        >
          {saved ? "Saved ✓" : "Save service"}
        </button>
        <button
          onClick={track}
          disabled={tracked}
          className={`flex-1 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition ${
            tracked
              ? "cursor-default bg-slate-200 text-slate-500"
              : "bg-gold-500 text-navy-950 hover:bg-gold-400"
          }`}
        >
          {tracked ? "Already tracked" : "Track application"}
        </button>
        <a
          href={`/chat?service=${encodeURIComponent(service.id)}`}
          className="flex-1 rounded-xl bg-navy-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800"
        >
          Ask the agent
        </a>
      </div>
      {done && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 fade-up">
          {done}
        </p>
      )}
    </div>
  );
}

export function WhatToBring({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));
  const done = checked.filter(Boolean).length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">
          {done} of {items.length} gathered
        </p>
        <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gold-500 transition-all"
            style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                checked[i] ? "border-emerald-200 bg-emerald-50 text-slate-500" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => setChecked((c) => c.map((v, j) => (j === i ? !v : v)))}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span className={checked[i] ? "line-through" : ""}>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
