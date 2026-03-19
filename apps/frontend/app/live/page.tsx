import type { CatalogItem, Channel, ScheduleItem } from "@/lib/types";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function fetchLiveNow(): Promise<CatalogItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/content?liveNow=true&pageSize=24`, {
    next: { revalidate: 30 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as CatalogItem[];
}

async function fetchAllLive(): Promise<CatalogItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/content?live=true&pageSize=48`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as CatalogItem[];
}

async function fetchChannels(): Promise<Channel[]> {
  const response = await fetch(`${apiBaseUrl}/api/live/channels`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as Channel[];
}

async function fetchSchedule(channelId: string): Promise<ScheduleItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/live/channels/${channelId}/schedule`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as ScheduleItem[];
}

export const revalidate = 30;

function splitSports(items: CatalogItem[]) {
  const sports: CatalogItem[] = [];
  const others: CatalogItem[] = [];
  for (const item of items) {
    const combined = item.genres.join(" ").toLowerCase();
    if (combined.includes("sport")) {
      sports.push(item);
    } else {
      others.push(item);
    }
  }
  return { sports, others };
}

export default async function LivePage() {
  const [liveNow, allLive, channels] = await Promise.all([fetchLiveNow(), fetchAllLive(), fetchChannels()]);
  const schedules = await Promise.all(
    channels.map(async (channel) => ({
      channel,
      schedule: await fetchSchedule(channel.id)
    }))
  );
  const { sports, others } = splitSports(allLive);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Live TV and Sports</h1>
        <p className="text-sm text-gray-300">
          Watch matches, events and live shows as they happen.
        </p>
      </header>
      {liveNow.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Live Now</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {liveNow.map((item) => (
              <a
                className="group overflow-hidden rounded-xl border border-red-600/60 bg-gray-900"
                href={`/title/${item.id}`}
                key={item.id}
              >
                <div className="relative aspect-video bg-black">
                  {item.posterImageUrl ? (
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.posterImageUrl}
                    />
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold">
                    LIVE
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {schedules.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Channel Schedule</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {schedules.map(({ channel, schedule }) => (
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4" key={channel.id}>
                <div className="flex items-center gap-3">
                  {channel.logoUrl ? (
                    <img alt={channel.name} className="h-10 w-10 rounded-md object-cover" src={channel.logoUrl} />
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold">{channel.name}</p>
                    <p className="text-xs text-gray-400">{channel.timezone}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {schedule.slice(0, 6).map((entry) => (
                    <li className="flex items-center justify-between gap-2 text-xs" key={entry.id}>
                      <span className="font-medium">{entry.title}</span>
                      <span className="text-gray-400">
                        {new Date(entry.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {sports.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Live Sports</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {sports.map((item) => (
              <a
                className="group overflow-hidden rounded-xl border border-emerald-500/70 bg-gray-900"
                href={`/title/${item.id}`}
                key={item.id}
              >
                <div className="relative aspect-video bg-black">
                  {item.posterImageUrl ? (
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.posterImageUrl}
                    />
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-black">
                    LIVE SPORTS
                  </span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {others.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">All Live Channels</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {others.map((item) => (
              <a
                className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900"
                href={`/title/${item.id}`}
                key={item.id}
              >
                <div className="relative aspect-video bg-black">
                  {item.posterImageUrl ? (
                    <img
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      src={item.posterImageUrl}
                    />
                  ) : null}
                  {item.isLive ? (
                    <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold">
                      LIVE
                    </span>
                  ) : null}
                </div>
                <div className="p-3">
                  <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
