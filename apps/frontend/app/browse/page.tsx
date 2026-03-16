import { CatalogGrid } from "@/components/catalog-grid";
import type { CatalogItem } from "@/lib/types";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function fetchCatalog(): Promise<CatalogItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/content`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as CatalogItem[];
}

export const revalidate = 60;

export default async function BrowsePage() {
  const items = await fetchCatalog();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Browse</h1>
      <CatalogGrid items={items} />
    </main>
  );
}

