/**
 * Shared shapes for the ops dashboard.
 *
 * Every source returns `Panel<T>` rather than throwing, so one dead API or one
 * missing token degrades a single card instead of blanking the page. The
 * dashboard is most useful exactly when something is broken, so it must not
 * break along with it.
 */

export type Panel<T> =
  | { state: "ok"; data: T }
  | { state: "unconfigured"; missing: string[] }
  | { state: "error"; message: string };

export function unconfigured<T>(...missing: string[]): Panel<T> {
  return { state: "unconfigured", missing };
}

export function ok<T>(data: T): Panel<T> {
  return { state: "ok", data };
}

export function failed<T>(e: unknown): Panel<T> {
  return {
    state: "error",
    message: e instanceof Error ? e.message : String(e),
  };
}

/** Fetch with a hard timeout — a hanging API must not hang the dashboard. */
export async function getJson<T>(
  url: string,
  headers: Record<string, string>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${url.split("?")[0]}`);
  }
  return res.json() as Promise<T>;
}

export function timeAgo(iso: string | number): string {
  const then = typeof iso === "number" ? iso : Date.parse(iso);
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
