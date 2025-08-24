export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "";

async function getJson<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

export async function listDays(): Promise<string[]> {
  try {
    const r = await getJson<{ days: string[] }>("/days");
    return r.days;
  } catch {
    const r = await getJson<{ days: string[] }>("/");
    return r.days;
  }
}

export async function getAggregates(date: string) {
  return getJson<{
    date: string;
    topline: { average_viewers: number; peak_viewers: number; points_minutes: number; shr_pct?: number };
    program_line: Array<{
      title: string; slug: string; start?: string; end?: string; duration_min?: number;
      amr?: number; shr_pct?: number; rank_amr?: number;
    }>;
  }>(`/aggregates?date=${date}`);
}

export async function getMetrics(date: string) {
  return getJson<{ points: Array<{ t: string; amr: number }> }>(`/metrics?date=${date}`);
}
