import { CatalogGrid } from "@/components/catalog-grid";
import type { CatalogItem } from "@/lib/types";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function fetchTrending(): Promise<CatalogItem[]> {
  const analyticsResponse = await fetch(`${apiBaseUrl}/api/analytics/trending`, {
    next: { revalidate: 30 }
  });
  if (!analyticsResponse.ok) {
    return [];
  }
  const analyticsPayload = await analyticsResponse.json();
  const ids: string[] = analyticsPayload.data.map(
    (entry: { contentId: string; playCount: number }) => entry.contentId
  );
  if (ids.length === 0) {
    return [];
  }

  const bulkResponse = await fetch(`${apiBaseUrl}/api/content/bulk?ids=${encodeURIComponent(ids.join(","))}`, {
    next: { revalidate: 30 }
  });
  if (!bulkResponse.ok) {
    return [];
  }
  const bulkPayload = await bulkResponse.json();
  return bulkPayload.data as CatalogItem[];
}

export const revalidate = 30;

export default async function TrendingPage() {
  const items = await fetchTrending();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Trending Now</h1>
      <CatalogGrid items={items} />
    </main>
  );
}

