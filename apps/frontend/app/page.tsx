import Link from "next/link";

export const revalidate = 60;

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-black to-[#020617] text-gray-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#e50914_0,_transparent_45%),radial-gradient(circle_at_bottom,_#1f2937_0,_transparent_55%)] opacity-70" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-16 pt-10 md:pt-16">
        <header className="flex items-center justify-between">
          <div className="text-2xl font-black tracking-tight text-red-600">Unified OTT</div>
          <Link
            href={{ pathname: "/signin" }}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Sign In
          </Link>
        </header>

        <section className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              Unlimited movies, shows{" "}
              <span className="block text-red-500">and live sports.</span>
            </h1>
            <p className="max-w-xl text-lg text-gray-200">
              Starts at ₹149. Cancel anytime. Stream originals, live channels and curated recommendations across all your
              devices.
            </p>
            <p className="text-sm text-gray-300">
              Ready to watch? Enter your email to create or restart your membership.
            </p>
            <form className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Email address"
                className="min-w-0 flex-1 rounded-md border border-gray-700 bg-black/60 px-4 py-3 text-sm text-gray-100 shadow-sm outline-none ring-0 placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Get Started
              </button>
            </form>
            <div className="flex flex-wrap gap-2 pt-2 text-xs font-medium text-gray-300">
              <span className="rounded-full bg-white/5 px-3 py-1">HD</span>
              <span className="rounded-full bg-white/5 px-3 py-1">4K</span>
              <span className="rounded-full bg-white/5 px-3 py-1">Watch on any device</span>
              <span className="rounded-full bg-white/5 px-3 py-1">Cancel anytime</span>
            </div>
          </div>

          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-900/60 via-black to-indigo-900/60 shadow-2xl shadow-black/60 md:h-80">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,250,252,0.18)_0,_transparent_60%)]" />
            <div className="relative flex h-full items-end gap-3 px-6 pb-6">
              <div className="flex gap-2">
                <div className="h-32 w-24 rounded-md bg-gradient-to-t from-red-800 via-red-500 to-yellow-300 shadow-lg shadow-black/60" />
                <div className="h-32 w-24 rounded-md bg-gradient-to-t from-purple-900 via-purple-500 to-pink-300 shadow-lg shadow-black/60" />
                <div className="h-32 w-24 rounded-md bg-gradient-to-t from-blue-900 via-sky-500 to-emerald-300 shadow-lg shadow-black/60" />
              </div>
              <div className="ml-auto flex flex-col gap-1 text-right text-xs text-gray-100">
                <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-400">
                  Trending Now
                </span>
                <span className="text-sm font-semibold">Top 10 in your country</span>
                <span className="text-[11px] text-gray-300">New episodes added every week.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border-t border-gray-800 bg-gradient-to-b from-black/40 via-black/20 to-transparent px-1 pt-8">
          <h2 className="text-2xl font-bold">More reasons to join</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-gradient-to-b from-slate-900 to-black/80 p-4 shadow-lg shadow-black/40">
              <h3 className="text-sm font-semibold">Enjoy on your TV</h3>
              <p className="mt-2 text-xs text-gray-300">Watch on smart TVs, consoles, Chromecast and more.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-slate-900 to-black/80 p-4 shadow-lg shadow-black/40">
              <h3 className="text-sm font-semibold">Download shows</h3>
              <p className="mt-2 text-xs text-gray-300">Save titles to watch offline on mobile and tablets.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-slate-900 to-black/80 p-4 shadow-lg shadow-black/40">
              <h3 className="text-sm font-semibold">Watch everywhere</h3>
              <p className="mt-2 text-xs text-gray-300">Stream on phone, laptop, tablet and TV.</p>
            </div>
            <div className="rounded-xl bg-gradient-to-b from-slate-900 to-black/80 p-4 shadow-lg shadow-black/40">
              <h3 className="text-sm font-semibold">Profiles for kids</h3>
              <p className="mt-2 text-xs text-gray-300">Kids-safe profiles with their own recommendations.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
