import { failed, getJson, ok, unconfigured, type Panel } from "./types";

/**
 * Recent commits and open issues.
 *
 * A token is optional: public repositories are readable unauthenticated, just
 * rate limited to 60 requests an hour per IP. Set GITHUB_TOKEN for a private
 * repo or to lift that ceiling.
 */

export type Commit = {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
};

export type Issue = { number: number; title: string; url: string };

function headers() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCommits(): Promise<Panel<Commit[]>> {
  const repo = process.env.GITHUB_REPO;
  if (!repo) return unconfigured<Commit[]>("GITHUB_REPO");

  try {
    const json = await getJson<
      Array<{
        sha: string;
        html_url: string;
        commit: { message: string; author: { name: string; date: string } };
      }>
    >(`https://api.github.com/repos/${repo}/commits?per_page=8`, headers());

    return ok(
      json.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        author: c.commit.author.name,
        date: c.commit.author.date,
        url: c.html_url,
      })),
    );
  } catch (e) {
    return failed<Commit[]>(e);
  }
}

export async function fetchIssues(): Promise<Panel<Issue[]>> {
  const repo = process.env.GITHUB_REPO;
  if (!repo) return unconfigured<Issue[]>("GITHUB_REPO");

  try {
    const json = await getJson<
      Array<{ number: number; title: string; html_url: string; pull_request?: object }>
    >(`https://api.github.com/repos/${repo}/issues?state=open&per_page=10`, headers());

    // The issues endpoint includes pull requests; the dashboard wants problems.
    return ok(
      json
        .filter((i) => !i.pull_request)
        .map((i) => ({ number: i.number, title: i.title, url: i.html_url })),
    );
  } catch (e) {
    return failed<Issue[]>(e);
  }
}
