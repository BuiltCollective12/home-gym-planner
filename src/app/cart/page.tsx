import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Your gym" };

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          Your gym
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          We never take payment for equipment — every button here hands you off
          to the retailer.
        </p>
        <div className="mt-8">
          <CartView />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
