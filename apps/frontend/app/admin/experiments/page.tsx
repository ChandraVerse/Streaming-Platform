"use client";

import { FormEvent, useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function AdminExperimentsPage() {
  const [status, setStatus] = useState("Loading...");
  const [experiments, setExperiments] = useState<
    { id: string; name: string; variants: string[]; trafficSplit: number[]; isActive: boolean }[]
  >([]);
  const [name, setName] = useState("");
  const [variants, setVariants] = useState("control,variant");
  const [splits, setSplits] = useState("50,50");

  async function load() {
    const response = await fetch(`${apiBaseUrl}/api/analytics/experiments`);
    if (!response.ok) {
      setStatus("Unable to load experiments.");
      return;
    }
    const payload = await response.json();
    setExperiments(payload.data);
    setStatus("Ready");
  }

  useEffect(() => {
    load().catch(() => setStatus("Unable to load experiments."));
  }, []);

  async function createExperiment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiBaseUrl}/api/analytics/experiments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        variants: variants.split(",").map((value) => value.trim()).filter(Boolean),
        trafficSplit: splits.split(",").map((value) => Number(value.trim()))
      })
    });
    if (!response.ok) {
      setStatus("Unable to create experiment.");
      return;
    }
    setName("");
    await load();
  }

  async function toggleExperiment(id: string, isActive: boolean) {
    const response = await fetch(`${apiBaseUrl}/api/analytics/experiments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive })
    });
    if (!response.ok) {
      setStatus("Unable to update experiment.");
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-bold">Admin Experiments</h1>
      <p className="text-sm text-gray-300">{status}</p>
      <form className="rounded-xl border border-gray-800 p-5" onSubmit={createExperiment}>
        <h2 className="text-lg font-semibold">Create experiment</h2>
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
            Variants (comma separated)
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={variants}
              onChange={(event) => setVariants(event.target.value)}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Traffic split (comma separated)
            <input
              className="mt-1 w-full rounded-md border border-gray-700 bg-gray-950 p-2 text-sm"
              value={splits}
              onChange={(event) => setSplits(event.target.value)}
            />
          </label>
        </div>
        <button className="mt-3 rounded-md bg-red-600 px-3 py-1 text-sm font-medium hover:bg-red-500" type="submit">
          Create experiment
        </button>
      </form>
      <section className="rounded-xl border border-gray-800 p-5">
        <h2 className="text-lg font-semibold">Existing experiments</h2>
        {experiments.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No experiments.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {experiments.map((experiment) => (
              <li className="flex items-center justify-between rounded-md border border-gray-800 bg-gray-900 p-3" key={experiment.id}>
                <div>
                  <p className="font-medium">{experiment.name}</p>
                  <p className="text-xs text-gray-400">{experiment.variants.join(", ")}</p>
                </div>
                <button
                  className="rounded-md border border-gray-700 px-3 py-1 text-xs font-medium hover:border-gray-500"
                  type="button"
                  onClick={() => toggleExperiment(experiment.id, experiment.isActive)}
                >
                  {experiment.isActive ? "Disable" : "Enable"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
