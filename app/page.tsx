import { getCategories, getServices } from "@/lib/data";
import LandingSearch from "./LandingSearch";
import FaqAccordion from "@/components/FaqAccordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata = {
  title: "GovServ — Your portal to government services",
};

const CATEGORY_CHIPS = [
  { label: "Food", query: "food" },
  { label: "Housing", query: "rent housing" },
  { label: "Utilities", query: "utility energy" },
  { label: "Health", query: "health medicaid" },
  { label: "Employment", query: "unemployment jobs" },
  { label: "Legal", query: "legal aid" },
];

const STEPS = [
  {
    n: "01",
    title: "Search",
    body: "Tell us your situation in plain language or browse the directory by category and level — city, county, state, or federal.",
  },
  {
    n: "02",
    title: "Understand",
    body: "See exactly what you're eligible for, what to bring, and every deadline — pulled from verified agency sources.",
  },
  {
    n: "03",
    title: "Apply with the agent",
    body: "GovGuide builds your action plan and your dashboard tracks every application, document, and deadline in one place.",
  },
];

const FEATURES = [
  { title: "Service database", body: "The largest database of agencies and services in the US — eligibility, deadlines, contacts, and application links for every program." },
  { title: "GovGuide AI agent", body: "Ask in plain language. GovGuide matches your situation to real programs and cites the exact services, never guesses." },
  { title: "Application dashboard", body: "Track every application through a clear pipeline: to start, gathering docs, submitted, waiting, approved." },
  { title: "Deadline tracking", body: "Enrollment windows, renewal dates, and court deadlines — surfaced before they slip, with custom reminders." },
  { title: "Weekly-verified data", body: "Our knowledge-base loop re-verifies programs every week against official agency sources." },
  { title: "Open knowledge base", body: "Every program's compressed source notes are published for review — correct us, and everyone benefits." },
];

const FAQS = [
  {
    q: "Is GovServ free to use?",
    a: "Yes — GovServ is completely free for residents. Applying to government programs is always free, and we will never charge you to search, chat, or track applications.",
  },
  {
    q: "Is GovServ a government agency?",
    a: "No. GovServ is an independent civic-tech platform. We are not affiliated with any government agency. We compile program information from official sources and always link you to the agency itself to apply.",
  },
  {
    q: "Which cities do you cover?",
    a: "Chicago is our first live city, with Cook County and Illinois statewide programs fully indexed. Illinois is next on the roadmap, followed by all 50 states.",
  },
  {
    q: "How accurate is the information?",
    a: "Every service entry carries a verifiedAt date and links to its official sources. Our weekly knowledge-base loop re-checks programs against agency websites, and any entry older than 30 days is flagged for review.",
  },
  {
    q: "Can GovGuide apply for benefits on my behalf?",
    a: "No — benefits applications must be submitted by you through the official agency channels. GovGuide prepares everything: eligibility checks, document checklists, contacts, and deadlines, then hands you off to the right application link.",
  },
  {
    q: "What happens to my personal data?",
    a: "Your dashboard and chats are stored in your own browser (localStorage) — we never see your applications, notes, or conversations. If you contact an agency through a link we provide, their privacy policy applies.",
  },
  {
    q: "I'm an agency — how do I get our programs listed or corrected?",
    a: "Partner with us below. Agencies can submit program updates, deadline changes, and new services through our knowledge-base intake, and corrections go live after verification.",
  },
];

const ROADMAP = [
  { label: "Chicago", status: "live", note: "City + Cook County programs indexed" },
  { label: "Illinois", status: "next", note: "Statewide agencies and county programs" },
  { label: "California", status: "live", note: "41 services indexed" },
  { label: "Texas", status: "live", note: "50 services indexed" },
  { label: "Florida", status: "live", note: "42 services indexed" },
  { label: "New York", status: "live", note: "45 services indexed" },
  { label: "Pennsylvania", status: "live", note: "47 services indexed" },
  { label: "Ohio", status: "live", note: "40 services indexed" },
  { label: "Georgia", status: "live", note: "32 services indexed" },
  { label: "North Carolina", status: "live", note: "31 services indexed" },
  { label: "Michigan", status: "live", note: "50 services indexed" },
  { label: "New Jersey", status: "live", note: "47 services indexed" },
  { label: "Virginia", status: "live", note: "30 services indexed" },
  { label: "Washington", status: "live", note: "40 services indexed" },
  { label: "Arizona", status: "live", note: "30 services indexed" },
  { label: "Tennessee", status: "live", note: "34 services indexed" },
  { label: "Indiana", status: "live", note: "38 services indexed" },
  { label: "Maryland", status: "live", note: "32 services indexed" },
  { label: "Missouri", status: "live", note: "36 services indexed" },
  { label: "Wisconsin", status: "live", note: "39 services indexed" },
  { label: "Minnesota", status: "live", note: "42 services indexed" },
  { label: "Massachusetts", status: "live", note: "44 services indexed" },
  { label: "Colorado", status: "live", note: "38 services indexed" },
  { label: "South Carolina", status: "live", note: "33 services indexed" },
  { label: "Alabama", status: "live", note: "40 services indexed" },
  { label: "Louisiana", status: "live", note: "40 services indexed" },
  { label: "Kentucky", status: "live", note: "41 services indexed" },
  { label: "Oregon", status: "live", note: "36 services indexed" },
  { label: "Oklahoma", status: "live", note: "41 services indexed" },
  { label: "Nevada", status: "live", note: "29 services indexed" },
  { label: "50 states", status: "later", note: "Federal programs first, then every state" },
];

export default function Home() {
  const services = getServices();
  const categories = getCategories();

  return (
    <div>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #1b5088 0, transparent 40%), radial-gradient(circle at 80% 70%, #c9a227 0, transparent 35%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold-400">
            Now live in Chicago
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
            Your portal to government services.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
            The largest database of agencies and services in the US. Find the
            benefits you&apos;re eligible for, understand what to bring, and never
            miss a deadline.
          </p>

          <div className="mt-8 max-w-2xl">
            <LandingSearch />
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORY_CHIPS.map((c) => (
                <Link
                  key={c.label}
                  href={`/services?q=${encodeURIComponent(c.query)}`}
                  className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white transition hover:border-gold-400 hover:text-gold-400"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats strip */}
          <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Services indexed</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-white">{services.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cities live</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-white">1</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categories</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-white">{categories.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">Roadmap</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-gold-400">50 states</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">How it works</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold text-navy-950 sm:text-4xl">
            From confusion to applied in three steps.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <span className="font-display text-4xl font-bold text-gold-500">{s.n}</span>
                <h3 className="mt-4 font-display text-xl font-bold text-navy-950">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/chat"
              className="inline-block rounded-lg bg-navy-950 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-navy-800"
            >
              Try GovGuide now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">What you get</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold text-navy-950 sm:text-4xl">
            Everything you need to get the help you qualify for.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
                <h3 className="font-display text-lg font-bold text-navy-950">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chicago first / roadmap ──────────────────────── */}
      <section id="cities" className="bg-navy-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-400">Chicago first</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold text-white sm:text-4xl">
            One city done right, then every state.
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">
            We&apos;re launching deep, not wide. Chicago&apos;s city, Cook County, and
            Illinois statewide programs are fully indexed and verified — then we
            scale the same playbook nationwide.
          </p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {ROADMAP.map((r, i) => (
              <li key={r.label} className="relative rounded-2xl border border-white/15 bg-white/5 p-6">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    r.status === "live"
                      ? "bg-emerald-400/20 text-emerald-300"
                      : r.status === "next"
                        ? "bg-gold-500/20 text-gold-400"
                        : "bg-white/10 text-slate-400"
                  }`}
                >
                  {r.status === "live" ? "Live now" : r.status === "next" ? "Up next" : "On the roadmap"}
                </span>
                <p className="mt-4 font-display text-2xl font-bold text-white">
                  {i + 1}. {r.label}
                </p>
                <p className="mt-1 text-sm text-slate-400">{r.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Partner CTA ──────────────────────────────────── */}
      <section id="partners" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-gold-50 ring-1 ring-gold-500/30">
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-gold-600">For agencies &amp; nonprofits</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-navy-950">
                  Keep your programs accurate for the people who need them.
                </h2>
                <p className="mt-4 leading-relaxed text-slate-600">
                  Submit new services, deadline changes, and eligibility updates
                  through our knowledge-base intake. Every submission is verified
                  against official sources and published with a verification date.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/admin"
                    className="rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-navy-800"
                  >
                    View the knowledge base
                  </Link>
                  <Link
                    href="/chat"
                    className="rounded-lg border border-navy-950/20 bg-white px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:border-navy-950"
                  >
                    Ask about partnering
                  </Link>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-navy-950">Submit a program</p>
                  <p className="mt-1 text-sm text-slate-600">Add or update a service in the CMS — it enters the weekly verification queue.</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-navy-950">Correct an entry</p>
                  <p className="mt-1 text-sm text-slate-600">Spotted an error? Corrections are reviewed and published with a new verified date.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-gold-600">FAQ</p>
          <h2 className="mt-2 text-center font-display text-3xl font-bold text-navy-950 sm:text-4xl">
            Questions, answered.
          </h2>
          <div className="mt-10">
            <FaqAccordion items={FAQS} />
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-navy-950 sm:text-4xl">
            You might already qualify. Find out in 60 seconds.
          </h2>
          <p className="mt-4 text-slate-600">
            Search the directory or ask GovGuide — no account, no cost, no catch.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 shadow transition hover:bg-gold-400"
            >
              Find my benefits
            </Link>
            <Link
              href="/chat"
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-navy-950 transition hover:border-navy-950"
            >
              Chat with GovGuide
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
