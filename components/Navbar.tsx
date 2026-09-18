"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/chat", label: "GovGuide" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#cities", label: "Cities" },
  { href: "/#faq", label: "FAQ" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-mark.png"
            alt="GovServ logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg"
            priority
          />
          <span className="font-display text-xl font-bold tracking-tight text-navy-950">
            GovServ
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              className={`text-sm font-medium transition-colors hover:text-navy-800 ${
                pathname === l.href ? "text-navy-950" : "text-slate-600"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/services"
            className="rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-sm transition hover:bg-gold-400"
          >
            Find my benefits
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-navy-950 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-gold-500 px-3 py-2.5 text-center text-sm font-semibold text-navy-950"
            >
              Find my benefits
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
