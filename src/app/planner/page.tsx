import type { Metadata } from "next";
import { PlannerShell } from "@/components/PlannerShell";
import { SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Planner" };

export default function PlannerPage() {
  return (
    <>
      <SiteHeader compact />
      <PlannerShell />
    </>
  );
}
