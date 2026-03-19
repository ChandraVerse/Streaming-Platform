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

async function fetchCohorts() {
  const response = await fetch(`${apiBaseUrl}/api/analytics/cohorts`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as { cohort: string; signups: number }[];
}

async function fetchContentPerformance() {
  const response = await fetch(`${apiBaseUrl}/api/analytics/content-performance`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as { contentId: string; plays: number; completes: number; completionRate: number }[];
}

async function fetchExperiments() {
  const response = await fetch(`${apiBaseUrl}/api/analytics/experiments`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as { name: string }[];
}

async function fetchExperimentResults(name: string) {
  const response = await fetch(`${apiBaseUrl}/api/analytics/experiments/results?name=${encodeURIComponent(name)}`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as { variant: string; count: number }[];
}

export const revalidate = 30;

export default async function AnalyticsPage() {
  const summary = await fetchSummary();
  const [cohorts, performance, experiments] = await Promise.all([
    fetchCohorts(),
    fetchContentPerformance(),
    fetchExperiments()
  ]);
  const experimentResults =
    experiments.length > 0 ? await fetchExperimentResults(experiments[0].name) : [];

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
      <section className="rounded-xl border border-gray-800 p-4">
        <h2 className="text-lg font-semibold">Cohort signups</h2>
        {cohorts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No cohort data.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {cohorts.map((entry) => (
              <li key={entry.cohort}>
                {entry.cohort}: {entry.signups}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-gray-800 p-4">
        <h2 className="text-lg font-semibold">Content performance</h2>
        {performance.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No performance data.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {performance.map((entry) => (
              <li key={entry.contentId}>
                {entry.contentId}: {Math.round(entry.completionRate * 100)}% completion
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-gray-800 p-4">
        <h2 className="text-lg font-semibold">Experiment results</h2>
        {experimentResults.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No experiment results.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            {experimentResults.map((entry) => (
              <li key={entry.variant}>
                {entry.variant}: {entry.count}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
