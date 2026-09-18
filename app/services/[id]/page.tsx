import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DeadlineBadge, LevelBadge } from "@/components/ServiceCard";
import { getServiceById, getServices } from "@/lib/data";
import { ServiceActions, WhatToBring } from "./ServiceClient";

export function generateStaticParams() {
  return getServices().map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getServiceById(id);
  return { title: s ? `${s.name} | GovServ` : "Service not found | GovServ" };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Rolling";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = getServiceById(id);
  if (!service) notFound();

  const scope =
    service.scope.city ?? service.scope.county ?? service.scope.state ?? "Nationwide";

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link href="/services" className="text-sm font-semibold text-navy-700 hover:underline">
            ← Back to directory
          </Link>

          <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-navy-700">
                {service.category}
              </span>
              <LevelBadge level={service.scope.level} />
              <DeadlineBadge service={service} />
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-navy-950 sm:text-4xl">
              {service.name}
            </h1>
            <p className="mt-2 text-slate-600">
              {service.agency} · {scope}
            </p>
            <p className="mt-5 leading-relaxed text-slate-700">{service.description}</p>
            <p className="mt-4 text-sm text-slate-500">
              Cost: <span className="font-medium text-slate-700">{service.cost}</span>
              {" · "}Languages: {service.languages.join(", ")}
              {" · "}Verified {fmtDate(service.verifiedAt)}
            </p>

            <div className="mt-6">
              <ServiceActions service={service} />
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-display text-xl font-bold text-navy-950">Who is eligible</h2>
              <ul className="mt-3 space-y-2">
                {service.eligibility.map((e, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden />
                    {e}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-display text-xl font-bold text-navy-950">Deadlines</h2>
              <ul className="mt-3 space-y-3">
                {service.deadlines.map((d, i) => (
                  <li key={i} className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
                    <p className="text-sm font-semibold text-navy-950">{d.label}</p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {d.date ? fmtDate(d.date) : "No fixed date"}
                      {d.note ? ` — ${d.note}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-display text-xl font-bold text-navy-950">Before you apply</h2>
              <ul className="mt-3 space-y-2">
                {service.prerequisites.map((p, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-700" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-display text-xl font-bold text-navy-950">Contacts</h2>
              <ul className="mt-3 space-y-2.5">
                {service.contacts.map((c, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-navy-950">{c.label}</span>
                    <span className="text-slate-500"> ({c.kind})</span>
                    <br />
                    {c.kind === "phone" ? (
                      <a href={`tel:${c.value.replace(/[^0-9+]/g, "")}`} className="text-navy-700 underline">
                        {c.value}
                      </a>
                    ) : c.kind === "web" ? (
                      <a href={c.value.startsWith("http") ? c.value : `https://${c.value}`} target="_blank" rel="noopener noreferrer" className="break-all text-navy-700 underline">
                        {c.value}
                      </a>
                    ) : (
                      <span className="text-slate-700">{c.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            <h2 className="font-display text-xl font-bold text-navy-950">What to bring</h2>
            <p className="mt-1 text-sm text-slate-500">
              Check items off as you gather them — your progress syncs to the dashboard Tasks tab when you track this application.
            </p>
            <div className="mt-4">
              <WhatToBring items={service.whatToBring} />
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-navy-950 p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-bold text-white">Ready to apply?</h2>
            <div className="mt-4 flex flex-col gap-3">
              {service.applyLinks.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {l.label}
                  <span aria-hidden>↗</span>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              These links go to official agency websites. GovServ never collects your application information.
            </p>
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-display text-xl font-bold text-navy-950">Sources</h2>
            <ul className="mt-3 space-y-1.5">
              {service.sources.map((src, i) => (
                <li key={i}>
                  <a href={src} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-navy-700 underline">
                    {src}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
