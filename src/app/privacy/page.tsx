import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { siteConfig } from "@/lib/site.config";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    `What ${siteConfig.name} collects, what stays on your device, and who we share data with.`,
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-black tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-sm text-ink-500">
          Last updated {new Date().toISOString().slice(0, 10)}
        </p>

        <div className="mt-8 space-y-6 text-ink-700">
          <Section title="The short version">
            <p>
              You can use the entire planner without an account and without
              giving us anything. Your room measurements, your layout and any
              photo you upload never leave your browser. The only personal
              information we ever store is an email address, and only if you
              type one in.
            </p>
          </Section>

          <Section title="Your plan stays on your device">
            <p>
              Room dimensions, equipment placement and your cart live in your
              browser&apos;s memory and in the page URL. When you press
              <strong> Save / share</strong>, the whole plan is encoded into the
              link itself — that is why sharing works without an account. We do
              not receive or store a copy.
            </p>
          </Section>

          <Section title="Room photos are never uploaded">
            <p>
              The optional reference photo is read directly by your browser and
              used only to draw on screen. It is never sent to our servers or to
              anyone else, and it disappears when you close the tab.
            </p>
          </Section>

          <Section title="Email addresses">
            <p>
              If you sign up for deal alerts we store the address you gave us
              and which page you signed up from, so we can email you about
              equipment sales. We do not sell or rent it. Every email includes
              an unsubscribe link, and you can ask us to delete your address at
              any time by replying to one.
            </p>
          </Section>

          <Section title="Analytics">
            <p>
              We measure aggregate usage — pages viewed, which buttons get
              clicked, roughly where visitors come from — so we know which parts
              of the planner are worth improving. This is counted in aggregate
              and is not used to build a profile of you.
            </p>
          </Section>

          <Section title="When you click through to a retailer">
            <p>
              Our buy links take you to Amazon and other retailers, who then
              apply their own privacy policies and cookies. Amazon uses a
              referral cookie so we get credit for the sale. What you do on
              their site is between you and them — we can see totals of clicks
              and orders, never who you are or what else you bought.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              {siteConfig.name} does not set advertising cookies of its own.
              Retailers you click through to will set theirs.
            </p>
          </Section>

          <Section title="Children">
            <p>
              This site is meant for adults buying gym equipment and is not
              directed at children under 13. We do not knowingly collect their
              information.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions, or want your email deleted? Reach us at{" "}
              <span className="font-semibold">hello@{siteConfig.domain}</span>.
            </p>
          </Section>
        </div>

        <div className="card mt-10 p-6">
          <p className="text-sm text-ink-600">
            See also our{" "}
            <Link href="/disclosure" className="font-semibold text-accent hover:underline">
              affiliate disclosure
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
