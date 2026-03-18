import { CatalogGrid } from "@/components/catalog-grid";
import { AnalyticsVideoPlayer } from "@/components/analytics-video-player";
import { RatingsSection } from "@/components/ratings-section";
import type { CatalogItem, ContentDetail } from "@/lib/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function fetchContent(id: string): Promise<ContentDetail | null> {
  const response = await fetch(`${apiBaseUrl}/api/content/${id}`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return null;
  }
  const payload = await response.json();
  return payload.data as ContentDetail;
}

async function fetchRecommendations(id: string): Promise<CatalogItem[]> {
  const response = await fetch(`${apiBaseUrl}/api/content/${id}/recommendations`, {
    next: { revalidate: 60 }
  });
  if (!response.ok) {
    return [];
  }
  const payload = await response.json();
  return payload.data as CatalogItem[];
}

export default async function TitlePage(props: Props) {
  const params = await props.params;
  const [content, recommendations] = await Promise.all([fetchContent(params.id), fetchRecommendations(params.id)]);

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">Title not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">{content.title}</h1>
      {content.isLive ? (
        <p className="text-sm font-semibold text-red-400">
          {content.liveStartTime && new Date(content.liveStartTime) > new Date()
            ? "Live starting soon"
            : "Live now"}
        </p>
      ) : null}
      <p className="text-sm text-gray-300">{content.description}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <a
          className="rounded-md bg-green-600 px-3 py-1 font-medium hover:bg-green-500"
          href={`https://wa.me/?text=${encodeURIComponent(
            `Check this title on Unified OTT: ${content.title} - /title/${content.id}`
          )}`}
          rel="noreferrer"
          target="_blank"
        >
          Share on WhatsApp
        </a>
      </div>
      {content.muxPlaybackId ? (
        <div className="mt-2 aspect-video w-full overflow-hidden rounded-lg bg-black">
          <AnalyticsVideoPlayer contentId={content.id} muxPlaybackId={content.muxPlaybackId} />
        </div>
      ) : null}
      <RatingsSection contentId={content.id} />
      {recommendations.length > 0 ? (
        <section className="mt-4 space-y-3">
          <h2 className="text-xl font-semibold">Because you watched this</h2>
          <CatalogGrid items={recommendations} />
        </section>
      ) : null}
    </main>
  );
}
