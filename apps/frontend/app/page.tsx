import Link from "next/link";

export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      {/* ── Cinematic Background ── */}
      <div className="cin-bg" aria-hidden="true">
        <div className="cin-bg__stars" />
        <div className="cin-bg__orb cin-bg__orb--red" />
        <div className="cin-bg__orb cin-bg__orb--blue" />
        <div className="cin-bg__orb cin-bg__orb--purple" />
        <div className="cin-bg__orb cin-bg__orb--gold" />
        <div className="cin-bg__cards">
          <div className="cin-card cin-card--1" />
          <div className="cin-card cin-card--2" />
          <div className="cin-card cin-card--3" />
          <div className="cin-card cin-card--4" />
          <div className="cin-card cin-card--5" />
          <div className="cin-card cin-card--6" />
        </div>
        <div className="cin-bg__scanline" />
        <div className="cin-bg__noise" />
        <div className="cin-bg__vignette" />
        <div className="cin-bg__fade" />
      </div>

      {/* ── Page Content ── */}
      <main className="relative z-10 min-h-screen text-gray-50">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-16 pt-10 md:pt-16">

          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="text-2xl font-black tracking-tight text-red-500 drop-shadow-[0_0_12px_rgba(229,9,20,0.8)]">
              Unified OTT
            </div>
            <Link
              href={{ pathname: "/signin" }}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-900/50 transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Sign In
            </Link>
          </header>

          {/* Hero */}
          <section className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-black leading-tight md:text-5xl lg:text-6xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.8)]">
                Unlimited movies, shows{" "}
                <span className="block text-red-500 drop-shadow-[0_0_20px_rgba(229,9,20,0.6)]">
                  and live sports.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-gray-200 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
                Starts at ₹149. Cancel anytime. Stream originals, live channels and curated
                recommendations across all your devices.
              </p>
              <p className="text-sm text-gray-300">
                Ready to watch? Enter your email to create or restart your membership.
              </p>
              <form className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Email address"
                  className="min-w-0 flex-1 rounded-md border border-gray-700 bg-black/70 px-4 py-3 text-sm text-gray-100 shadow-sm outline-none ring-0 backdrop-blur-sm placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/50 transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Get Started &rsaquo;
                </button>
              </form>
              <div className="flex flex-wrap gap-2 pt-2 text-xs font-medium text-gray-300">
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">HD</span>
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">4K</span>
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">Watch on any device</span>
                <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">Cancel anytime</span>
              </div>
            </div>

            {/* Preview card */}
            <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-900/40 via-black/80 to-indigo-900/40 shadow-2xl shadow-black/80 backdrop-blur-md md:h-80">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(229,9,20,0.15)_0,_transparent_60%)]" />
              <div className="relative flex h-full items-end gap-3 px-6 pb-6">
                <div className="flex gap-2">
                  <div className="h-32 w-24 rounded-md bg-gradient-to-t from-red-800 via-red-500 to-yellow-300 shadow-lg shadow-black/60 transition-transform hover:-translate-y-1" />
                  <div className="h-32 w-24 rounded-md bg-gradient-to-t from-purple-900 via-purple-500 to-pink-300 shadow-lg shadow-black/60 transition-transform hover:-translate-y-1" />
                  <div className="h-32 w-24 rounded-md bg-gradient-to-t from-blue-900 via-sky-500 to-emerald-300 shadow-lg shadow-black/60 transition-transform hover:-translate-y-1" />
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

          {/* Features */}
          <section className="space-y-6 rounded-2xl border-t border-white/10 bg-black/30 px-1 pt-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">More reasons to join</h2>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { title: "Enjoy on your TV", desc: "Watch on smart TVs, consoles, Chromecast and more." },
                { title: "Download shows", desc: "Save titles to watch offline on mobile and tablets." },
                { title: "Watch everywhere", desc: "Stream on phone, laptop, tablet and TV." },
                { title: "Profiles for kids", desc: "Kids-safe profiles with their own recommendations." },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-white/5 bg-white/5 p-4 shadow-lg shadow-black/40 backdrop-blur-sm transition hover:bg-white/8 hover:border-white/10"
                >
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-2 text-xs text-gray-300">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
