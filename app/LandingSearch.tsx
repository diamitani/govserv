"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      aria-label="Find government services"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/services?q=${encodeURIComponent(q.trim())}`);
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <label htmlFor="hero-search" className="sr-only">
        Search services by keyword or ZIP
      </label>
      <input
        id="hero-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Try &quot;I need help with rent&quot; or a ZIP like 60640"
        className="w-full flex-1 rounded-xl border-0 bg-white px-5 py-4 text-base text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
      />
      <button
        type="submit"
        className="rounded-xl bg-gold-500 px-8 py-4 text-base font-semibold text-navy-950 shadow-lg transition hover:bg-gold-400"
      >
        Search
      </button>
    </form>
  );
}
