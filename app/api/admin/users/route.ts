import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (profile?.role === "master_admin" || profile?.role === "admin") ? user : null;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profiles } = await supabaseAdmin
    .from("user_profiles")
    .select("id, name, role");

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p: { id: string; name: string | null; role: string }) => [p.id, p])
  );

  const users = data.users.map((u) => ({
    id:           u.id,
    email:        u.email,
    name:         profileMap[u.id]?.name ?? null,
    role:         profileMap[u.id]?.role ?? "crew_member",
    created_at:   u.created_at,
    last_sign_in: u.last_sign_in_at ?? null,
  }));

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, password, name, role } = await req.json() as {
    email: string;
    password: string;
    name?: string;
    role: string;
  };

  if (!email || !password || !role) {
    return NextResponse.json({ error: "email, password, and role are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name ?? "" },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from("user_profiles")
    .update({ name: name ?? null, role })
    .eq("id", data.user.id);

  return NextResponse.json({ success: true, id: data.user.id });
}
