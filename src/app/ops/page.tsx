import type { Metadata } from "next";
import { fetchDeployments } from "@/lib/ops/vercel";
import { fetchCommits, fetchIssues } from "@/lib/ops/github";
import { fetchTraffic } from "@/lib/ops/posthog";
import { timeAgo, type Panel } from "@/lib/ops/types";
import { siteConfig } from "@/lib/site.config";
import { catalog } from "@/lib/catalog";

/**
 * Single operations view: deploys, code, traffic and the affiliate funnel.
 *
 * Everything is fetched server-side so the API tokens never reach the browser,
 * and always fresh — a cached ops page is worse than no ops page.
 *
 * Amazon commission data is absent on purpose: Associates exposes no earnings
 * API (PA-API covers product data only), so that number has to be read from
 * their dashboard and paired with the click counts here by hand.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ops",
  robots: { index: false, follow: false },
};

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const secret = process.env.OPS_SECRET;
  const { key } = await searchParams;

  if (!secret) return <Locked reason="no-secret" />;
  if (key !== secret) return <Locked reason="bad-key" />;

  const [deployments, commits, issues, traffic] = await Promise.all([
    fetchDeployments(),
    fetchCommits(),
    fetchIssues(),
    fetchTraffic(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Ops</h1>
          <p className="mt-1 text-sm text-ink-500">
            {siteConfig.name} · {catalog.length} products ·{" "}
            <a
              href={siteConfig.url}
              className="underline hover:text-ink-800"
              target="_blank"
              rel="noopener"
            >
              {siteConfig.url.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </div>
        <p className="text-xs text-ink-400">
          Live at {new Date().toLocaleString()}
        </p>
      </header>

      <Section title="Traffic & funnel" subtitle="PostHog · last 7 days">
        <Resolved panel={traffic}>
          {(t) => (
            <>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Visitors" value={t.visitors} />
                <Stat label="Pageviews" value={t.pageviews} />
                <Stat label="Plans started" value={t.plansStarted} />
                <Stat label="Carts viewed" value={t.cartsViewed} />
                <Stat
                  label="Affiliate clicks"
                  value={t.affiliateClicks}
                  emphasis
                />
                <Stat label="Emails" value={t.emailsCaptured} />
              </div>

              <p className="mt-3 text-xs text-ink-500">
                Click-through rate{" "}
                <strong className="text-ink-800">
                  {t.visitors > 0
                    ? `${((t.affiliateClicks / t.visitors) * 100).toFixed(1)}%`
                    : "—"}
                </strong>{" "}
                of visitors reached Amazon. Pair this with your Associates
                dashboard to get the conversion rate — Amazon has no earnings
                API, so that half is a manual read.
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Ranked title="Top pages" rows={t.topPages.map((p) => [p.path, p.views])} />
                <Ranked
                  title="Most clicked products"
                  rows={t.topProducts.map((p) => [p.id, p.clicks])}
                />
                <Ranked
                  title="Where they came from"
                  rows={t.referrers.map((r) => [r.source, r.visits])}
                />
              </div>
            </>
          )}
        </Resolved>
      </Section>

      <Section title="Deployments" subtitle="Vercel">
        <Resolved panel={deployments}>
          {(list) => (
            <ul className="divide-y divide-line rounded-xl border border-line bg-paper-50">
              {list.map((d) => (
                <li key={d.uid} className="flex items-center gap-3 px-4 py-2.5">
                  <StateDot state={d.state} />
                  <span className="w-20 shrink-0 text-xs font-semibold uppercase text-ink-600">
                    {d.state}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {d.commitMessage ?? d.url}
                  </span>
                  {d.target === "production" && (
                    <span className="chip shrink-0">prod</span>
                  )}
                  <span className="shrink-0 text-xs text-ink-400">
                    {timeAgo(d.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Resolved>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Recent commits" subtitle="GitHub">
          <Resolved panel={commits}>
            {(list) => (
              <ul className="divide-y divide-line rounded-xl border border-line bg-paper-50">
                {list.map((c) => (
                  <li key={c.sha} className="px-4 py-2.5">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener"
                      className="block truncate text-sm hover:text-accent"
                    >
                      {c.message}
                    </a>
                    <p className="text-xs text-ink-400">
                      <code>{c.sha}</code> · {c.author} · {timeAgo(c.date)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Resolved>
        </Section>

        <Section title="Open issues" subtitle="GitHub">
          <Resolved panel={issues}>
            {(list) =>
              list.length === 0 ? (
                <p className="rounded-xl border border-line bg-paper-50 p-4 text-sm text-ink-500">
                  Nothing open.
                </p>
              ) : (
                <ul className="divide-y divide-line rounded-xl border border-line bg-paper-50">
                  {list.map((i) => (
                    <li key={i.number} className="px-4 py-2.5 text-sm">
                      <a
                        href={i.url}
                        target="_blank"
                        rel="noopener"
                        className="hover:text-accent"
                      >
                        <span className="text-ink-400">#{i.number}</span>{" "}
                        {i.title}
                      </a>
                    </li>
                  ))}
                </ul>
              )
            }
          </Resolved>
        </Section>
      </div>

      <Section title="Earnings" subtitle="Amazon Associates — manual">
        <div className="rounded-xl border border-line bg-paper-50 p-4">
          <p className="text-sm text-ink-600">
            Amazon publishes no API for commission or order reports, so this is
            the one number that cannot be pulled in here.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="https://affiliate-program.amazon.com/home/reports"
              target="_blank"
              rel="noopener"
              className="btn-ghost text-xs"
            >
              Associates reports
            </a>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener"
              className="btn-ghost text-xs"
            >
              Vercel
            </a>
            <a
              href="https://us.posthog.com"
              target="_blank"
              rel="noopener"
              className="btn-ghost text-xs"
            >
              PostHog
            </a>
          </div>
        </div>
      </Section>
    </main>
  );
}

/* ------------------------------------------------------------------ parts */

function Resolved<T>({
  panel,
  children,
}: {
  panel: Panel<T>;
  children: (data: T) => React.ReactNode;
}) {
  if (panel.state === "ok") return <>{children(panel.data)}</>;

  if (panel.state === "unconfigured") {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-paper-50 p-4">
        <p className="text-sm font-semibold text-ink-700">Not connected yet</p>
        <p className="mt-1 text-xs text-ink-500">
          Add {panel.missing.map((m) => <code key={m}>{m}</code>).reduce((a, b) => (
            <>
              {a}, {b}
            </>
          ))}{" "}
          in Vercel → Settings → Environment Variables, then redeploy.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-danger/30 bg-dangerBg p-4">
      <p className="text-sm font-semibold text-danger">Could not load</p>
      <p className="mt-1 font-mono text-xs text-danger">{panel.message}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-xs text-ink-400">{subtitle}</span>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-paper-50 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p
        className={`mt-0.5 text-2xl font-black tabular-nums ${
          emphasis ? "text-accent" : "text-ink-900"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Ranked({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper-50 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-ink-400">No data yet.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map(([label, n]) => (
            <li key={label} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-ink-700">{label}</span>
              <span className="shrink-0 tabular-nums text-ink-500">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StateDot({ state }: { state: string }) {
  const colour =
    state === "READY"
      ? "bg-ok"
      : state === "ERROR" || state === "CANCELED"
        ? "bg-danger"
        : "bg-warn";
  return <span className={`h-2 w-2 shrink-0 rounded-full ${colour}`} />;
}

function Locked({ reason }: { reason: "no-secret" | "bad-key" }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-black">Ops</h1>
      {reason === "no-secret" ? (
        <p className="mt-3 text-sm text-ink-600">
          Set <code>OPS_SECRET</code> in Vercel → Settings → Environment
          Variables, redeploy, then open{" "}
          <code>/ops?key=your-secret</code>.
        </p>
      ) : (
        <p className="mt-3 text-sm text-ink-600">
          Wrong or missing key. Open <code>/ops?key=…</code> with the value of{" "}
          <code>OPS_SECRET</code>.
        </p>
      )}
    </main>
  );
}
