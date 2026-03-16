import Link from "next/link";
import { Hero } from "@/components/hero";

export const revalidate = 60;

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <Hero />
      <section className="grid gap-4 rounded-xl border border-gray-800 p-6 md:grid-cols-3">
        <div className="rounded-lg bg-gray-900 p-4">
          <h2 className="font-semibold">Multi Profile</h2>
          <p className="mt-2 text-sm text-gray-300">Create up to 5 profiles with kids-safe mode and watch history.</p>
        </div>
        <div className="rounded-lg bg-gray-900 p-4">
          <h2 className="font-semibold">Adaptive Streaming</h2>
          <p className="mt-2 text-sm text-gray-300">Mux-ready playback pipeline with resumable sessions.</p>
        </div>
        <div className="rounded-lg bg-gray-900 p-4">
          <h2 className="font-semibold">Smart Monetization</h2>
          <p className="mt-2 text-sm text-gray-300">Subscriptions, referrals and hybrid ad-supported plans.</p>
        </div>
      </section>
      <section className="flex flex-wrap gap-3">
        <Link className="rounded-md bg-red-600 px-4 py-2 font-medium hover:bg-red-500" href={{ pathname: "/signup" }}>
          Get Started
        </Link>
        <Link
          className="rounded-md border border-gray-700 px-4 py-2 font-medium hover:border-gray-500"
          href={{ pathname: "/signin" }}
        >
          Sign In
        </Link>
        <Link
          className="rounded-md border border-gray-700 px-4 py-2 font-medium hover:border-gray-500"
          href={{ pathname: "/dashboard" }}
        >
          Open Dashboard
        </Link>
        <Link
          className="rounded-md border border-gray-700 px-4 py-2 font-medium hover:border-gray-500"
          href={{ pathname: "/browse" }}
        >
          Browse Catalog
        </Link>
        <Link
          className="rounded-md border border-gray-700 px-4 py-2 font-medium hover:border-gray-500"
          href={{ pathname: "/search" }}
        >
          Search
        </Link>
        <Link
          className="rounded-md border border-gray-700 px-4 py-2 font-medium hover:border-gray-500"
          href={{ pathname: "/trending" }}
        >
          Trending
        </Link>
      </section>
    </main>
  );
}
