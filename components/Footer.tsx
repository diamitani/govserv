import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo-mark.png"
                alt="GovServ logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg"
              />
              <span className="font-display text-xl font-bold text-white">GovServ</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Your portal to government services. The largest database of agencies
              and services in the US — verified weekly, free forever.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              GovServ is not a government agency and is not affiliated with any
              government. Program details change; always confirm with the agency.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Product</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/services" className="hover:text-gold-400">Services directory</Link></li>
              <li><Link href="/chat" className="hover:text-gold-400">GovGuide agent</Link></li>
              <li><Link href="/dashboard" className="hover:text-gold-400">Application dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-gold-400">Knowledge base</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/#how-it-works" className="hover:text-gold-400">How it works</Link></li>
              <li><Link href="/#cities" className="hover:text-gold-400">Cities</Link></li>
              <li><Link href="/#faq" className="hover:text-gold-400">FAQ</Link></li>
              <li><Link href="/#partners" className="hover:text-gold-400">Partner with us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <span>© 2026 GovServ. Built for the public good.</span>
          <span>Chicago, Illinois — first city live</span>
        </div>
      </div>
    </footer>
  );
}
