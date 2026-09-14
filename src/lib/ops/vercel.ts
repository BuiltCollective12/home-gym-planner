import { failed, getJson, ok, unconfigured, type Panel } from "./types";

/** Deployments and build health, so a failed deploy is visible immediately. */

export type Deployment = {
  uid: string;
  state: string;
  target: string | null;
  createdAt: number;
  url: string;
  commitMessage?: string;
};

type VercelResponse = {
  deployments: Array<{
    uid: string;
    readyState?: string;
    state?: string;
    target?: string | null;
    createdAt: number;
    url: string;
    meta?: { githubCommitMessage?: string };
  }>;
};

export async function fetchDeployments(): Promise<Panel<Deployment[]>> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  const missing: string[] = [];
  if (!token) missing.push("VERCEL_TOKEN");
  if (!projectId) missing.push("VERCEL_PROJECT_ID");
  if (missing.length) return unconfigured<Deployment[]>(...missing);

  try {
    const teamId = process.env.VERCEL_TEAM_ID;
    const params = new URLSearchParams({ projectId: projectId!, limit: "8" });
    if (teamId) params.set("teamId", teamId);

    const json = await getJson<VercelResponse>(
      `https://api.vercel.com/v6/deployments?${params}`,
      { Authorization: `Bearer ${token}` },
    );

    return ok(
      json.deployments.map((d) => ({
        uid: d.uid,
        state: d.readyState ?? d.state ?? "UNKNOWN",
        target: d.target ?? null,
        createdAt: d.createdAt,
        url: d.url,
        commitMessage: d.meta?.githubCommitMessage,
      })),
    );
  } catch (e) {
    return failed<Deployment[]>(e);
  }
}
