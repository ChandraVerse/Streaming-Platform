import { CatalogGrid } from "@/components/catalog-grid";
import type { CatalogItem } from "@/lib/types";

type Props = {
  searchParams: {
    q?: string;
  };
};

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function fetchSearch(q: string): Promise<CatalogItem[]> {
  if (!q) {
    return [];
  }
  const response = await fetch(`${apiBaseUrl}/api/search?q=${encodeURIComponent(q)}`, {
    next: { revalidate: 10 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as CatalogItem[];
}

export const revalidate = 0;

export default async function SearchPage(props: Props) {
  const query = (props.searchParams.q ?? "").trim();
  const items = await fetchSearch(query);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Search</h1>
      <form className="flex gap-2" action="/search">
        <input
          className="flex-1 rounded-md border border-gray-700 bg-gray-900 p-3 text-sm outline-none focus:border-red-500"
          defaultValue={query}
          name="q"
          placeholder="Search for movies, series, sports..."
        />
        <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500" type="submit">
          Search
        </button>
      </form>
      <CatalogGrid items={items} />
    </main>
  );
}

