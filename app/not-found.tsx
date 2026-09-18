import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-20">
        <div className="text-center">
          <p className="font-display text-6xl font-bold text-navy-950">404</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-navy-950">Page not found</h1>
          <p className="mt-2 text-slate-600">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-navy-950 px-6 py-3 text-sm font-semibold text-white"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
