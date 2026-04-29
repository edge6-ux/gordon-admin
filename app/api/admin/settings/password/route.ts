import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { currentPassword, newPassword } = (await req.json()) as {
    currentPassword: string;
    newPassword: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (currentPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    note: "Update ADMIN_PASSWORD in Vercel env vars to complete the change",
  });
}
