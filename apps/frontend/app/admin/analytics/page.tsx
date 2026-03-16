const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function fetchSummary() {
  const response = await fetch(`${apiBaseUrl}/api/analytics/summary`, {
    next: { revalidate: 30 }
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as {
    data: {
      eventsLast24h: number;
      byKind: { kind: string; count: number }[];
    };
  };
}

export const revalidate = 30;

export default async function AnalyticsPage() {
  const summary = await fetchSummary();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Admin Analytics</h1>
      {summary ? (
        <>
          <p className="text-sm text-gray-300">Events in last 24 hours: {summary.data.eventsLast24h}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {summary.data.byKind.map((entry) => (
              <div className="rounded-md border border-gray-800 bg-gray-900 p-4" key={entry.kind}>
                <p className="text-sm font-semibold">{entry.kind}</p>
                <p className="mt-1 text-xl font-bold">{entry.count}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-300">Unable to load analytics.</p>
      )}
    </main>
  );
}

