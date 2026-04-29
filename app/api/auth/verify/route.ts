import { NextResponse } from "next/server";

// Auth is now handled directly via Supabase signInWithPassword on the client.
export async function POST() {
  return NextResponse.json({ error: "Use Supabase auth" }, { status: 410 });
}
