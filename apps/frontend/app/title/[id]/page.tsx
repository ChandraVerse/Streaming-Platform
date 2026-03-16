import type { ContentDetail } from "@/lib/types";

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

export default async function TitlePage(props: Props) {
  const params = await props.params;
  const content = await fetchContent(params.id);

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
        <h1 className="text-2xl font-bold">Title not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-10">
      <h1 className="text-3xl font-bold">{content.title}</h1>
      <p className="text-sm text-gray-300">{content.description}</p>
      {content.muxPlaybackId ? (
        <div className="mt-4 aspect-video w-full rounded-lg bg-black">
          <p className="p-4 text-sm text-gray-300">
            Playback via Mux playback id {content.muxPlaybackId}. Integrate your player here.
          </p>
        </div>
      ) : null}
    </main>
  );
}

