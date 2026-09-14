import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { siteConfig } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description:
    "How RackSpace makes money, what our links do, and what we will not do with your data.",
};

export default function DisclosurePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-black tracking-tight">
          Affiliate disclosure
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Last updated {new Date().toISOString().slice(0, 10)}
        </p>

        <div className="prose mt-8 space-y-6 text-ink-700">
          <Section title="The short version">
            <p>
              {siteConfig.name} is free to use. We make money when you buy
              equipment through our links — the retailer pays us a commission
              and you pay exactly the same price you would have paid anyway.
              We never add a markup and we never handle your payment.
            </p>
          </Section>

          <Section title="Amazon Associates">
            <p>
              {siteConfig.name} is a participant in the Amazon Services LLC
              Associates Program, an affiliate advertising program designed to
              provide a means for sites to earn advertising fees by advertising
              and linking to Amazon.com. As an Amazon Associate we earn from
              qualifying purchases.
            </p>
            <p>
              Amazon typically pays around 3% on sports, outdoors and home
              categories, which is where nearly everything in our catalog sits.
            </p>
          </Section>

          <Section title="About the prices you see">
            <p>
              Where we show a figure it is <strong>our own planning
              estimate</strong>, so the planner can total up a build. It is not
              Amazon&apos;s price and it is not live. Prices move constantly and
              the real price is whatever the retailer shows at the moment you
              check out — always look before you buy.
            </p>
          </Section>

          <Section title="How we choose what to list">
            <p>
              Nobody pays us to be in the catalog. We pick equipment that is
              widely available and that we can measure accurately, because the
              planner is only useful if the dimensions are right.
            </p>
            <p>
              If a brand ever does pay for placement, that item will be labelled
              <strong> Sponsored</strong> wherever it appears. Nothing in the
              catalog is sponsored today.
            </p>
          </Section>

          <Section title="What this means for you">
            <p>
              Using our links costs you nothing and it is what keeps the planner
              free. If you would rather not use them, search for the product
              yourself — we would still rather you got the right gear.
            </p>
          </Section>
        </div>

        <div className="card mt-10 p-6">
          <p className="text-sm text-ink-600">
            Questions about any of this? See our{" "}
            <Link href="/privacy" className="font-semibold text-accent hover:underline">
              privacy policy
            </Link>{" "}
            or head back to the{" "}
            <Link href="/planner" className="font-semibold text-accent hover:underline">
              planner
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-ink-900">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}
