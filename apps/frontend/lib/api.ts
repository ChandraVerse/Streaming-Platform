const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

type ApiOptions = {
  method?: "GET" | "POST";
  token?: string;
  body?: Record<string, unknown>;
  nextRevalidate?: number;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    next: options.nextRevalidate ? { revalidate: options.nextRevalidate } : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  return (await response.json()) as T;
}
