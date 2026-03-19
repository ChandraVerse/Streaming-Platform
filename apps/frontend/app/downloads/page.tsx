"use client";

import { FormEvent, useEffect, useState } from "react";
import type { DownloadLicense } from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function DownloadsPage() {
  const [licenses, setLicenses] = useState<DownloadLicense[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [contentId, setContentId] = useState("");
  const [deviceId, setDeviceId] = useState("web");
  const [downloadUrl, setDownloadUrl] = useState("");

  async function load() {
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setStatus("Please sign in first.");
      return;
    }
    const meRes = await fetch(`${apiBaseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!meRes.ok) {
      setStatus("Session invalid. Please sign in again.");
      return;
    }
    const mePayload = await meRes.json();
    const userId = mePayload.data.userId as string;
    const licensesRes = await fetch(`${apiBaseUrl}/api/downloads/list?userId=${encodeURIComponent(userId)}`);
    if (!licensesRes.ok) {
      setStatus("Unable to load downloads.");
      return;
    }
    const licensesPayload = await licensesRes.json();
    setLicenses(licensesPayload.data as DownloadLicense[]);
    setStatus("Ready");
  }

  useEffect(() => {
    load().catch(() => setStatus("Unable to load downloads."));
  }, []);

  async function requestDownload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.localStorage.getItem("accessToken");
    if (!token) {
      setStatus("Please sign in first.");
      return;
    }
    const meRes = await fetch(`${apiBaseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!meRes.ok) {
      setStatus("Session invalid. Please sign in again.");
      return;
    }
    const mePayload = await meRes.json();
    const userId = mePayload.data.userId as string;
    const response = await fetch(`${apiBaseUrl}/api/downloads/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, contentId, deviceId, expiresInHours: 48 })
    });
    if (!response.ok) {
      setStatus("Unable to request download.");
      return;
    }
    const payload = await response.json();
    setDownloadUrl(payload.data.downloadUrl as string);
    await load();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Offline Downloads</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <form className="rounded-xl border border-gray-800 p-5" onSubmit={requestDownload}>
        <h2 className="text-lg font-semibold">Request download</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Content ID
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={contentId}
              onChange={(event) => setContentId(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Device ID
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-500" type="submit">
          Generate link
        </button>
        {downloadUrl ? (
          <p className="mt-3 text-xs text-gray-400">
            Download URL: <span className="break-all font-mono">{downloadUrl}</span>
          </p>
        ) : null}
      </form>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Your downloads</h2>
        {licenses.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No active downloads.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {licenses.map((license) => (
              <li className="rounded-md border border-gray-800 bg-gray-900 p-3" key={license.id}>
                <p className="font-medium">{license.contentId}</p>
                <p className="text-xs text-gray-400">Expires {new Date(license.expiresAt).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Device {license.deviceId}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
