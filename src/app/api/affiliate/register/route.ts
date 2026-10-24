export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireUser, errorResponse } from "@/lib/api-auth";

// Signed-in student joins the affiliate programme and gets a code.
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const { userName, userEmail } = await req.json().catch(() => ({}));
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const existing = await sql`SELECT code FROM affiliates WHERE user_id = ${userId}`;
    if (existing.length > 0) return NextResponse.json({ success: true, code: existing[0].code });

    let code = "";
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = String(userName || "USER").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase().padEnd(4, "X") + Math.floor(1000 + Math.random() * 9000);
      const clash = await sql`SELECT id FROM affiliates WHERE code = ${candidate}`;
      if (clash.length === 0) { code = candidate; break; }
    }
    if (!code) return NextResponse.json({ error: "Could not generate a unique code, please try again" }, { status: 500 });

    await sql`INSERT INTO affiliates (user_id, email, name, code) VALUES (${userId}, ${userEmail || null}, ${userName || null}, ${code}) ON CONFLICT (user_id) DO NOTHING`;

    const stored = await sql`SELECT code FROM affiliates WHERE user_id = ${userId}`;
    return NextResponse.json({ success: true, code: stored[0]?.code || code });
  } catch (e: any) {
    return errorResponse(e);
  }
}
