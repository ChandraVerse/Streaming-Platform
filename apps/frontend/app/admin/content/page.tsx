 "use client";

import { FormEvent, useEffect, useState } from "react";
import type { ContentDetail } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ContentListItem = {
  id: string;
  title: string;
  slug: string;
  kind: string;
};

type ContentFormState = {
  id?: string;
  title: string;
  slug: string;
  kind: string;
  description: string;
  releaseYear: string;
  durationMinutes: string;
  languages: string;
  genres: string;
  ageRating: string;
  cast: string;
  crew: string;
  posterImageUrl: string;
  bannerImageUrl: string;
  muxPlaybackId: string;
  isPremium: boolean;
  isKids: boolean;
  isLive: boolean;
  liveStartTime: string;
};

const emptyForm: ContentFormState = {
  title: "",
  slug: "",
  kind: "movie",
  description: "",
  releaseYear: "",
  durationMinutes: "",
  languages: "",
  genres: "",
  ageRating: "",
  cast: "",
  crew: "",
  posterImageUrl: "",
  bannerImageUrl: "",
  muxPlaybackId: "",
  isPremium: true,
  isKids: false,
  isLive: false,
  liveStartTime: ""
};

export default function AdminContentPage() {
  const [items, setItems] = useState<ContentListItem[]>([]);
  const [form, setForm] = useState<ContentFormState>(emptyForm);
  const [status, setStatus] = useState("Loading catalog...");
  const [saving, setSaving] = useState(false);
  const [attachAssetContentId, setAttachAssetContentId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [playbackId, setPlaybackId] = useState("");
  const [assetStatus, setAssetStatus] = useState("");
  const [csvText, setCsvText] = useState("");
  const [bulkIds, setBulkIds] = useState("");
  const [bulkIsPremium, setBulkIsPremium] = useState("keep");
  const [bulkIsKids, setBulkIsKids] = useState("keep");
  const [bulkIsLive, setBulkIsLive] = useState("keep");
  const [bulkGenres, setBulkGenres] = useState("");
  const [bulkLanguages, setBulkLanguages] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/content?page=1&pageSize=50`);
        if (!response.ok) {
          setStatus("Unable to load content catalog.");
          return;
        }
        const payload = await response.json();
        const list = (payload.data as ContentDetail[]).map((entry) => ({
          id: entry.id,
          title: entry.title,
          slug: entry.slug,
          kind: entry.kind
        }));
        setItems(list);
        setStatus(`Loaded ${list.length} titles.`);
      } catch {
        setStatus("Unable to load content catalog.");
      }
    }
    load().catch(() => {
      setStatus("Unable to load content catalog.");
    });
  }, []);

  async function loadForEdit(id: string) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/content/${id}`);
      if (!response.ok) {
        setStatus("Unable to load content for editing.");
        return;
      }
      const payload = await response.json();
      const data = payload.data as ContentDetail;
      const liveStart = data.liveStartTime
        ? new Date(data.liveStartTime).toISOString().slice(0, 16)
        : "";
      setForm({
        id: data.id,
        title: data.title,
        slug: data.slug,
        kind: data.kind,
        description: data.description,
        releaseYear: data.releaseYear ? String(data.releaseYear) : "",
        durationMinutes: data.durationMinutes ? String(data.durationMinutes) : "",
        languages: data.languages.join(", "),
        genres: data.genres.join(", "),
        ageRating: data.ageRating ?? "",
        cast: data.cast.join(", "),
        crew: data.crew.join(", "),
        posterImageUrl: data.posterImageUrl ?? "",
        bannerImageUrl: data.bannerImageUrl ?? "",
        muxPlaybackId: data.muxPlaybackId ?? "",
        isPremium: data.isPremium,
        isKids: data.isKids,
        isLive: data.isLive,
        liveStartTime: liveStart
      });
      setStatus(`Editing "${data.title}".`);
    } catch {
      setStatus("Unable to load content for editing.");
    }
  }

  function updateField<K extends keyof ContentFormState>(key: K, value: ContentFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("Saving content...");
    try {
      const body = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        kind: form.kind,
        description: form.description.trim(),
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        languages: form.languages
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
        genres: form.genres
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
        ageRating: form.ageRating.trim() || undefined,
        cast: form.cast
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
        crew: form.crew
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0),
        posterImageUrl: form.posterImageUrl.trim() || undefined,
        bannerImageUrl: form.bannerImageUrl.trim() || undefined,
        muxPlaybackId: form.muxPlaybackId.trim() || undefined,
        isPremium: form.isPremium,
        isKids: form.isKids,
        isLive: form.isLive,
        liveStartTime: form.liveStartTime ? new Date(form.liveStartTime).toISOString() : undefined
      };

      const isEditing = Boolean(form.id);
      const url = isEditing
        ? `${apiBaseUrl}/api/content/${form.id}`
        : `${apiBaseUrl}/api/content`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!response.ok) {
        setStatus(payload.message ?? "Unable to save content.");
        return;
      }

      const savedId = (payload.data?.id as string | undefined) ?? form.id ?? "";
      const listItem: ContentListItem = {
        id: savedId,
        title: form.title,
        slug: form.slug,
        kind: form.kind
      };
      setItems((current) => {
        const others = current.filter((item) => item.id !== savedId);
        return [listItem, ...others];
      });
      setForm((current) => ({ ...current, id: savedId }));
      setStatus("Content saved.");
    } catch {
      setStatus("Unable to save content.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAttachAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAssetStatus("Attaching asset...");
    try {
      const contentId = attachAssetContentId || form.id || "";
      if (!contentId) {
        setAssetStatus("Select a content item first.");
        return;
      }
      if (!assetId.trim() || !playbackId.trim()) {
        setAssetStatus("Provide both asset id and playback id.");
        return;
      }
      const response = await fetch(`${apiBaseUrl}/api/mux/attach-asset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contentId,
          assetId: assetId.trim(),
          playbackId: playbackId.trim()
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setAssetStatus(payload.message ?? "Unable to attach asset.");
        return;
      }
      setAssetStatus("Mux asset attached.");
      if (form.id === contentId) {
        setForm((current) => ({ ...current, muxPlaybackId: payload.data?.muxPlaybackId ?? current.muxPlaybackId }));
      }
    } catch {
      setAssetStatus("Unable to attach asset.");
    }
  }

  async function handleBulkImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/content/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText })
      });
      if (!response.ok) {
        setStatus("Bulk import failed.");
        return;
      }
      setCsvText("");
      await load();
      setStatus("Bulk import completed.");
    } catch {
      setStatus("Bulk import failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const ids = bulkIds
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const fields: Record<string, unknown> = {};
    if (bulkIsPremium !== "keep") fields.isPremium = bulkIsPremium === "true";
    if (bulkIsKids !== "keep") fields.isKids = bulkIsKids === "true";
    if (bulkIsLive !== "keep") fields.isLive = bulkIsLive === "true";
    if (bulkGenres.trim()) fields.genres = bulkGenres.split("|").map((value) => value.trim());
    if (bulkLanguages.trim()) fields.languages = bulkLanguages.split("|").map((value) => value.trim());
    try {
      const response = await fetch(`${apiBaseUrl}/api/content/bulk-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, fields })
      });
      if (!response.ok) {
        setStatus("Bulk update failed.");
        return;
      }
      await load();
      setStatus("Bulk update completed.");
    } catch {
      setStatus("Bulk update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Admin Content Management</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <div className="grid gap-6 md:grid-cols-[1.5fr,2fr]">
        <section className="space-y-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Catalog</h2>
            <button
              className="rounded-md border border-gray-700 px-3 py-1 text-sm font-medium hover:border-gray-500"
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setStatus("Creating new title.");
              }}
            >
              New title
            </button>
          </div>
          <div className="mt-2 max-h-80 space-y-1 overflow-auto border border-gray-800 bg-gray-950 p-2 text-sm">
            {items.length === 0 ? (
              <p className="text-gray-400">No titles loaded.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left hover:bg-gray-800 ${
                    form.id === item.id ? "bg-gray-800" : ""
                  }`}
                  onClick={() => loadForEdit(item.id)}
                >
                  <span className="truncate text-xs font-medium">
                    {item.title}{" "}
                    <span className="text-gray-400">({item.kind})</span>
                  </span>
                  <span className="ml-2 truncate text-[10px] text-gray-500">{item.slug}</span>
                </button>
              ))
            )}
          </div>
        </section>
        <section className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="text-lg font-semibold">
            {form.id ? "Edit title" : "Create title"}
          </h2>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Title</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Slug</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Kind</span>
                <select
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.kind}
                  onChange={(event) => updateField("kind", event.target.value)}
                >
                  <option value="movie">Movie</option>
                  <option value="series">Series</option>
                  <option value="live">Live</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Release year</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.releaseYear}
                  onChange={(event) => updateField("releaseYear", event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Duration (minutes)</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.durationMinutes}
                  onChange={(event) => updateField("durationMinutes", event.target.value)}
                />
              </label>
            </div>
            <label className="space-y-1 text-sm">
              <span className="text-gray-200">Description</span>
              <textarea
                className="h-24 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Languages (comma separated)</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.languages}
                  onChange={(event) => updateField("languages", event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Genres (comma separated)</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.genres}
                  onChange={(event) => updateField("genres", event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Age rating</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.ageRating}
                  onChange={(event) => updateField("ageRating", event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Poster image URL</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.posterImageUrl}
                  onChange={(event) => updateField("posterImageUrl", event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Banner image URL</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.bannerImageUrl}
                  onChange={(event) => updateField("bannerImageUrl", event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Cast (comma separated)</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.cast}
                  onChange={(event) => updateField("cast", event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Crew (comma separated)</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.crew}
                  onChange={(event) => updateField("crew", event.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPremium}
                  onChange={(event) => updateField("isPremium", event.target.checked)}
                />
                <span className="text-gray-200">Premium</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isKids}
                  onChange={(event) => updateField("isKids", event.target.checked)}
                />
                <span className="text-gray-200">Kids</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isLive}
                  onChange={(event) => updateField("isLive", event.target.checked)}
                />
                <span className="text-gray-200">Live</span>
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Live start time</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.liveStartTime}
                  onChange={(event) => updateField("liveStartTime", event.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-gray-200">Mux playback id</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm outline-none focus:border-red-500"
                  value={form.muxPlaybackId}
                  onChange={(event) => updateField("muxPlaybackId", event.target.value)}
                />
              </label>
            </div>
            <button
              className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : form.id ? "Save changes" : "Create title"}
            </button>
          </form>
          <section className="mt-6 space-y-3 rounded-md border border-gray-800 bg-gray-950 p-3">
            <h3 className="text-sm font-semibold">Attach Mux asset</h3>
            <form className="space-y-2" onSubmit={handleAttachAsset}>
              <div className="grid gap-2 md:grid-cols-3">
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Content id</span>
                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    placeholder="Defaults to current form id"
                    value={attachAssetContentId}
                    onChange={(event) => setAttachAssetContentId(event.target.value)}
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Asset id</span>
                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    value={assetId}
                    onChange={(event) => setAssetId(event.target.value)}
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Playback id</span>
                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    value={playbackId}
                    onChange={(event) => setPlaybackId(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="rounded-md bg-gray-800 px-3 py-1 text-xs font-medium hover:bg-gray-700"
                type="submit"
              >
                Attach asset
              </button>
            </form>
            {assetStatus ? <p className="text-xs text-gray-300">{assetStatus}</p> : null}
          </section>
          <section className="mt-6 space-y-3 rounded-md border border-gray-800 bg-gray-950 p-3">
            <h3 className="text-sm font-semibold">Bulk import (CSV)</h3>
            <form className="space-y-2" onSubmit={handleBulkImport}>
              <textarea
                className="h-32 w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                placeholder="title,slug,kind,description,genres,languages,isPremium,isKids,isLive,liveStartTime"
                value={csvText}
                onChange={(event) => setCsvText(event.target.value)}
              />
              <button
                className="rounded-md bg-gray-800 px-3 py-1 text-xs font-medium hover:bg-gray-700"
                type="submit"
                disabled={saving}
              >
                Import CSV
              </button>
            </form>
          </section>
          <section className="mt-6 space-y-3 rounded-md border border-gray-800 bg-gray-950 p-3">
            <h3 className="text-sm font-semibold">Batch edit</h3>
            <form className="space-y-2" onSubmit={handleBulkUpdate}>
              <label className="space-y-1 text-xs">
                <span className="text-gray-200">Content ids (comma separated)</span>
                <input
                  className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                  value={bulkIds}
                  onChange={(event) => setBulkIds(event.target.value)}
                />
              </label>
              <div className="grid gap-2 md:grid-cols-3">
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Premium</span>
                  <select
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    value={bulkIsPremium}
                    onChange={(event) => setBulkIsPremium(event.target.value)}
                  >
                    <option value="keep">Keep</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Kids</span>
                  <select
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    value={bulkIsKids}
                    onChange={(event) => setBulkIsKids(event.target.value)}
                  >
                    <option value="keep">Keep</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Live</span>
                  <select
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    value={bulkIsLive}
                    onChange={(event) => setBulkIsLive(event.target.value)}
                  >
                    <option value="keep">Keep</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Genres (pipe separated)</span>
                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    value={bulkGenres}
                    onChange={(event) => setBulkGenres(event.target.value)}
                  />
                </label>
                <label className="space-y-1 text-xs">
                  <span className="text-gray-200">Languages (pipe separated)</span>
                  <input
                    className="w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-xs outline-none focus:border-red-500"
                    value={bulkLanguages}
                    onChange={(event) => setBulkLanguages(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="rounded-md bg-gray-800 px-3 py-1 text-xs font-medium hover:bg-gray-700"
                type="submit"
                disabled={saving}
              >
                Apply updates
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

