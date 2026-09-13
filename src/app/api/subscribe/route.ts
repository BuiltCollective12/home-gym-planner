import { NextResponse } from "next/server";

/**
 * Email capture stub.
 *
 * Phase 1 has no database, so this validates and logs. Point it at the ESP
 * (or a Supabase table) in Phase 2 without touching the form component.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, placement } = (body ?? {}) as {
    email?: unknown;
    placement?: unknown;
  };

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // TODO(phase-2): persist to Supabase and sync to the ESP.
  console.info("[subscribe]", { email, placement });

  return NextResponse.json({ ok: true });
}
