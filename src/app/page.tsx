import Link from "next/link";
import { AffiliateDisclosure, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { layouts } from "@/lib/layouts";
import { EmailCapture } from "@/components/EmailCapture";
import { EquipmentThumb } from "@/components/EquipmentThumb";
import { bundles } from "@/lib/bundles";
import { catalog, getEquipment } from "@/lib/catalog";
import { computeTotals } from "@/lib/planner/totals";
import { encodePlan } from "@/lib/planner/plan-url";
import { formatUsd } from "@/lib/units";
import { siteConfig } from "@/lib/site.config";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/types";

const STEPS = [
  {
    n: "01",
    title: "Measure your room",
    body: "Width, depth, ceiling height. Mark the door and the window so nothing ends up in front of them. Feet, inches or centimetres — type it however you think about it.",
  },
  {
    n: "02",
    title: "Drag in the gear",
    body: "Real footprints from real products. We warn you when a rack won't clear your ceiling, when two things overlap, and when there's no room left to actually use a bench.",
  },
  {
    n: "03",
    title: "Buy the whole thing",
    body: "One link drops every item into your Amazon cart at the right quantity. No checkout here, no markup — you pay Amazon's price.",
  },
];

export default function HomePage() {
  const featured = bundles.map((bundle) => ({
    bundle,
    totals: computeTotals(bundle.plan.items, bundle.plan.room, getEquipment),
    href: `/planner#p=${encodePlan(bundle.plan)}`,
  }));

  const popular = [
    "titan-t3-power-rack",
    "concept2-rowerg",
    "bowflex-selecttech-552",
    "finer-form-fid-bench",
    "cap-bumper-set-260",
    "valor-bd-62-functional-trainer",
  ]
    .map(getEquipment)
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  return (
    <>
      <SiteHeader />

      {/* ------------------------------------------------------------ hero */}
      <section className="border-b border-line bg-paper-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <div>
            <span className="chip">Free · no account needed</span>
            <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Plan your home gym.
              <span className="block text-accent">Buy it in one click.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
              Put in your room size, drag in the racks and benches you want, and
              see whether it actually fits — in 2D and in 3D — before you spend
              a penny. Then send the whole build to your Amazon cart.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/planner" className="btn-accent px-6 py-3 text-base">
                Start planning — it&apos;s free
              </Link>
              <Link href="/bundles" className="btn-ghost px-6 py-3 text-base">
                Or start from a bundle
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
              {[
                [`${catalog.length}`, "real products"],
                ["2D + 3D", "same plan, both views"],
                ["1 click", "to your Amazon cart"],
              ].map(([big, small]) => (
                <div key={small}>
                  <dt className="text-2xl font-black tracking-tight">{big}</dt>
                  <dd className="text-xs text-ink-500">{small}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* A plain, honest preview of what the planner catches. */}
          <div className="card overflow-hidden">
            <div className="border-b border-line bg-paper-200 px-4 py-2 text-xs font-semibold text-ink-600">
              12 × 20 ft garage · 8 ft ceiling
            </div>
            <div className="space-y-3 p-4">
              <WarnRow
                tone="error"
                text="X-3 Flat Foot Power Rack overlaps Adjustable Bench"
              />
              <WarnRow
                tone="warn"
                text={`Rack needs 99" of headroom for pull-ups — you have 96"`}
              />
              <WarnRow
                tone="warn"
                text="Bench sits in the working space around the rack"
              />
              <p className="pt-1 text-sm text-ink-600">
                The kind of thing you only find out after the pallet arrives.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-line bg-line">
              {[
                ["Items", "9"],
                ["Est. cost", "$2,447"],
                ["Floor used", "34%"],
              ].map(([k, v]) => (
                <div key={k} className="bg-paper-50 p-3">
                  <p className="text-xs text-ink-500">{k}</p>
                  <p className="text-lg font-bold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- how it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-black tracking-tight">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="card p-6">
              <span className="text-sm font-black tabular-nums text-accent">
                {step.n}
              </span>
              <h3 className="mt-2 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- bundles */}
      <section className="border-y border-line bg-paper-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                Or take one that&apos;s already built
              </h2>
              <p className="mt-2 max-w-xl text-ink-600">
                Four complete gyms, laid out and checked. Load one into the
                planner and change whatever you like.
              </p>
            </div>
            <Link href="/bundles" className="btn-ghost">
              See all four
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map(({ bundle, totals, href }) => (
              <Link
                key={bundle.id}
                href={href}
                className="card group flex flex-col p-5 transition-colors hover:border-accent"
              >
                <h3 className="text-xl font-black tracking-tight">
                  {bundle.name}
                </h3>
                <p className="mt-1 flex-1 text-sm text-ink-600">
                  {bundle.tagline}
                </p>
                <p className="mt-4 text-2xl font-bold tabular-nums">
                  {formatUsd(totals.estCostUsd)}
                </p>
                <p className="text-xs text-ink-500">
                  est. · {bundle.roomLabel}
                </p>
                <span className="mt-3 text-sm font-semibold text-accent group-hover:underline">
                  Load into planner →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- catalog */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-black tracking-tight">
          {catalog.length} products, measured properly
        </h2>
        <p className="mt-2 max-w-2xl text-ink-600">
          Every item carries its real footprint, height, weight and the headroom
          it needs to use — which is why the planner can tell you a rack won&apos;t
          work in your basement before you order it.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span key={c} className="chip">
              {CATEGORY_LABELS[c]}
              <span className="ml-1.5 text-ink-400">
                {catalog.filter((i) => i.category === c).length}
              </span>
            </span>
          ))}
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((item) => (
            <li key={item.id} className="card flex items-center gap-4 p-4">
              <EquipmentThumb equipment={item} size={64} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.name}</p>
                <p className="text-xs text-ink-500">{item.brand}</p>
                <p className="mt-1 text-sm text-ink-600">
                  {siteConfig.showItemPrices
                    ? `est. ${formatUsd(item.estPriceUsd ?? 0)}`
                    : "Check price on Amazon"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* --------------------------------------------------------- layouts */}
      {/*
        Internal links to the room-size pages. These are the pages built to be
        found by search, and an orphaned page is a page Google crawls last —
        so the homepage links every one of them by name.
      */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-black tracking-tight">
          Start from a room like yours
        </h2>
        <p className="mt-2 max-w-2xl text-ink-600">
          Worked layouts for the spaces people actually have, each checked for
          walkways and ceiling clearance. Open one and change anything.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {layouts.map((layout) => (
            <li key={layout.slug}>
              <Link
                href={`/layouts/${layout.slug}`}
                className="card flex items-center justify-between gap-3 p-4 hover:border-ink-300"
              >
                <span className="font-semibold">{layout.h1}</span>
                <span className="shrink-0 text-sm text-ink-500">
                  {layout.roomLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ----------------------------------------------------------- email */}
      <section className="border-t border-line bg-paper-50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-black tracking-tight">
            Equipment goes on sale twice a year
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-600">
            January and Black Friday, and the good racks sell out in days. Leave
            your email and we&apos;ll tell you when the gear in your plan drops.
          </p>
          <div className="mx-auto mt-6 max-w-lg text-left">
            <EmailCapture placement="landing" label="Notify me" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
          Your gym, before you buy it
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-600">
          Takes about two minutes. No account, no email required — the plan
          lives in the link, so you can save it or send it to someone.
        </p>
        <Link
          href="/planner"
          className="btn-accent mt-8 px-8 py-3.5 text-base"
        >
          Start planning
        </Link>
        <div className="mx-auto mt-8 max-w-2xl">
          <AffiliateDisclosure />
        </div>
        <p className="mt-4 text-xs text-ink-400">
          We never take payment for equipment. {siteConfig.name} sends you to
          Amazon and you pay their price.
        </p>
      </section>

      <SiteFooter />
    </>
  );
}

function WarnRow({ tone, text }: { tone: "error" | "warn"; text: string }) {
  return (
    <p
      className={`flex gap-2 rounded-md border p-2.5 text-xs ${
        tone === "error"
          ? "border-danger/30 bg-dangerBg text-danger"
          : "border-warn/30 bg-warnBg text-warn"
      }`}
    >
      <span aria-hidden>{tone === "error" ? "⛔" : "⚠"}</span>
      <span>{text}</span>
    </p>
  );
}
