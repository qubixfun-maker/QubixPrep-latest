export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const { code, referredUserId, referredUserEmail, referredUserName } = await req.json();
    if (!code || !referredUserId) return NextResponse.json({ error: "code and referredUserId required" }, { status: 400 });

    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const affs = await sql`SELECT id, user_id FROM affiliates WHERE code = ${code.trim().toUpperCase()}`;
    if (affs.length === 0) return NextResponse.json({ tracked: false, reason: "invalid code" });

    if (affs[0].user_id === referredUserId) {
      return NextResponse.json({ tracked: false, reason: "self-referral" });
    }

    const already = await sql`SELECT id FROM referrals WHERE referred_user_id = ${referredUserId}`;
    if (already.length > 0) return NextResponse.json({ tracked: false, reason: "already tracked" });

    await sql`INSERT INTO referrals (affiliate_id, referred_user_id, referred_user_email, referred_user_name, status, amount)
      VALUES (${affs[0].id}, ${referredUserId}, ${referredUserEmail || null}, ${referredUserName || null}, 'pending', 0)`;

    return NextResponse.json({ tracked: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
