import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EquipmentThumb } from "@/components/EquipmentThumb";
import { AffiliateDisclosure, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getEquipment } from "@/lib/catalog";
import { layouts, getLayout } from "@/lib/layouts";
import { buildItemUrl, buyLabel, sourceMetaLine } from "@/lib/affiliate";
import { computeTotals, toCartLines } from "@/lib/planner/totals";
import { encodePlan } from "@/lib/planner/plan-url";
import { siteConfig } from "@/lib/site.config";

/**
 * A single room-size landing page.
 *
 * Statically generated at build time — these are the pages we want crawled, so
 * they must not depend on a request. Everything shown is derived from the same
 * `Plan` the planner uses, so a page can never drift from the layout it links
 * to.
 */

export function generateStaticParams() {
  return layouts.map((layout) => ({ slug: layout.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const layout = getLayout(slug);
  if (!layout) return {};
  const url = `${siteConfig.url}/layouts/${layout.slug}`;
  return {
    title: layout.title,
    description: layout.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: layout.title,
      description: layout.metaDescription,
      url,
      type: "article",
    },
  };
}

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function LayoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const layout = getLayout(slug);
  if (!layout) notFound();

  const { plan } = layout;
  const totals = computeTotals(plan.items, plan.room, getEquipment);
  const lines = toCartLines(plan.items, getEquipment);
  const plannerHref = `/planner#p=${encodePlan(plan)}`;
  const others = layouts.filter((l) => l.slug !== layout.slug);

  const stats = [
    { label: "Room", value: layout.roomLabel },
    { label: "Floor area", value: `${layout.sqft} sq ft` },
    {
      label: "Ceiling",
      value: `${Math.round(plan.room.ceilingHeightIn / 12)} ft`,
    },
    { label: "Pieces", value: `${totals.itemCount}` },
    { label: "Est. cost", value: money(totals.estCostUsd) },
    { label: "Total weight", value: `${totals.totalWeightLbs.toLocaleString()} lb` },
  ];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <nav className="text-sm text-ink-500">
          <Link href="/layouts" className="hover:text-ink-900">
            Layouts
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink-700">{layout.roomLabel}</span>
        </nav>

        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          {layout.h1}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-600">
          {layout.intro}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={plannerHref} className="btn-accent">
            Open this layout in the planner
          </Link>
          <Link href="/planner" className="btn-quiet">
            Start from my own measurements
          </Link>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-paper p-4">
              <dt className="text-xs uppercase tracking-wide text-ink-500">
                {stat.label}
              </dt>
              <dd className="mt-1 text-lg font-bold">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {/* ------------------------------------------------------- notes -- */}
        <section className="mt-14">
          <h2 className="text-2xl font-black tracking-tight">
            What to know about this room
          </h2>
          <div className="mt-6 space-y-6">
            {layout.notes.map((note) => (
              <div key={note.heading} className="card p-6">
                <h3 className="text-lg font-bold">{note.heading}</h3>
                <p className="mt-2 leading-relaxed text-ink-600">{note.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------- equipment -- */}
        <section className="mt-14">
          <h2 className="text-2xl font-black tracking-tight">
            The equipment in this layout
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            {totals.uniqueItemCount} products, about {money(totals.estCostUsd)}{" "}
            all in. Our own planning estimate, not the retailer&apos;s price —
            check each listing before you buy.
          </p>

          <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line">
            {lines.map(({ equipment, quantity }) => (
              <li
                key={equipment.id}
                className="flex items-center gap-4 bg-paper p-4"
              >
                <EquipmentThumb equipment={equipment} size={64} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {equipment.name}
                    {quantity > 1 && (
                      <span className="ml-2 text-ink-500">× {quantity}</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-500">
                    {sourceMetaLine(equipment)} · {equipment.widthIn}&quot; ×{" "}
                    {equipment.depthIn}&quot;
                  </p>
                </div>
                <a
                  href={buildItemUrl(equipment)}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="btn-quiet shrink-0"
                >
                  {buyLabel(equipment)}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <AffiliateDisclosure variant="inline" />
          </div>

          <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-lg font-bold">Want the whole thing at once?</h3>
              <p className="mt-1 text-sm text-ink-600">
                Load the layout, then send every item to your Amazon cart in one
                click.
              </p>
            </div>
            <Link href={plannerHref} className="btn-accent">
              Open the layout
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------- others -- */}
        <section className="mt-14">
          <h2 className="text-2xl font-black tracking-tight">Other room sizes</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/layouts/${other.slug}`}
                  className="card flex items-center justify-between gap-4 p-4 hover:border-ink-300"
                >
                  <span className="font-semibold">{other.h1}</span>
                  <span className="shrink-0 text-sm text-ink-500">
                    {other.roomLabel}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
