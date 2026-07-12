export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, userEmail, plan } = await req.json();
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const existing = await sql`SELECT code FROM affiliates WHERE user_id = ${userId}`;
    if (existing.length > 0) {
      return NextResponse.json({ success: true, code: existing[0].code });
    }

    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = (userName || "USER").replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
      const clash = await sql`SELECT id FROM affiliates WHERE code = ${candidate}`;
      if (clash.length === 0) { code = candidate; break; }
    }
    if (!code) throw new Error("Could not generate a unique code, please try again");

    await sql`INSERT INTO affiliates (user_id, email, name, plan, code) VALUES (${userId}, ${userEmail}, ${userName || null}, ${plan || null}, ${code}) ON CONFLICT (user_id) DO NOTHING`;

    const stored = await sql`SELECT code FROM affiliates WHERE user_id = ${userId}`;
    return NextResponse.json({ success: true, code: stored[0]?.code || code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
