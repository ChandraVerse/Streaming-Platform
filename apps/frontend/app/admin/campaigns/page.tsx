"use client";

import { FormEvent, useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function AdminCampaignsPage() {
  const [status, setStatus] = useState("Loading...");
  const [campaigns, setCampaigns] = useState<
    { id: string; name: string; placement: string; contentIds: string[]; isActive: boolean }[]
  >([]);
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [placement, setPlacement] = useState("hero");
  const [contentIds, setContentIds] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [scheduleChannelId, setScheduleChannelId] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");

  async function load() {
    const [campaignRes, channelsRes] = await Promise.all([
      fetch(`${apiBaseUrl}/api/campaigns`),
      fetch(`${apiBaseUrl}/api/live/channels`)
    ]);
    if (!campaignRes.ok) {
      setStatus("Unable to load campaigns.");
      return;
    }
    const campaignPayload = await campaignRes.json();
    setCampaigns(campaignPayload.data);
    if (channelsRes.ok) {
      const channelsPayload = await channelsRes.json();
      setChannels(channelsPayload.data as { id: string; name: string }[]);
      if (!scheduleChannelId && channelsPayload.data.length > 0) {
        setScheduleChannelId(channelsPayload.data[0].id);
      }
    }
    setStatus("Ready");
  }

  useEffect(() => {
    load().catch(() => setStatus("Unable to load campaigns."));
  }, []);

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        placement,
        contentIds: contentIds.split(",").map((value) => value.trim()).filter(Boolean),
        startsAt,
        endsAt
      })
    });
    if (!response.ok) {
      setStatus("Unable to create campaign.");
      return;
    }
    setName("");
    setContentIds("");
    setStartsAt("");
    setEndsAt("");
    await load();
  }

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleChannelId) {
      setStatus("Select a channel.");
      return;
    }
    const response = await fetch(`${apiBaseUrl}/api/live/channels/${scheduleChannelId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: scheduleTitle,
        startTime: scheduleStart,
        endTime: scheduleEnd,
        timezone: "UTC"
      })
    });
    if (!response.ok) {
      setStatus("Unable to create schedule.");
      return;
    }
    setScheduleTitle("");
    setScheduleStart("");
    setScheduleEnd("");
    setStatus("Schedule created.");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Admin Campaigns</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <form className="rounded-xl border border-gray-800 p-5" onSubmit={createCampaign}>
        <h2 className="text-lg font-semibold">Create campaign</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Name
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Placement
            <select
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={placement}
              onChange={(event) => setPlacement(event.target.value)}
            >
              <option value="hero">Hero</option>
              <option value="row">Row</option>
              <option value="banner">Banner</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            Content IDs (comma separated)
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={contentIds}
              onChange={(event) => setContentIds(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Starts at
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Ends at
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-500" type="submit">
          Create campaign
        </button>
      </form>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Existing campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No campaigns.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {campaigns.map((campaign) => (
              <li className="rounded-md border border-gray-800 bg-gray-900 p-3" key={campaign.id}>
                <p className="font-medium">{campaign.name}</p>
                <p className="text-xs text-gray-400">{campaign.placement}</p>
                <p className="text-xs text-gray-400">{campaign.contentIds.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Schedule live events</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={createSchedule}>
          <label className="text-sm">
            Channel
            <select
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={scheduleChannelId}
              onChange={(event) => setScheduleChannelId(event.target.value)}
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Title
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={scheduleTitle}
              onChange={(event) => setScheduleTitle(event.target.value)}
            />
          </label>
          <label className="text-sm">
            Start time
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              type="datetime-local"
              value={scheduleStart}
              onChange={(event) => setScheduleStart(event.target.value)}
            />
          </label>
          <label className="text-sm">
            End time
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              type="datetime-local"
              value={scheduleEnd}
              onChange={(event) => setScheduleEnd(event.target.value)}
            />
          </label>
          <div className="md:col-span-2">
            <button className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-500" type="submit">
              Create schedule
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
