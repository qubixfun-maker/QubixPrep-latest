export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { verifyIdToken } from "@/lib/plan-server";

// Called right after a student signs up with a referral code.
// The student's own login token proves who they are, so nobody can attach someone else's account.
export async function POST(req: NextRequest) {
  try {
    const { code, idToken, referredUserEmail, referredUserName } = await req.json();
    if (!code || !idToken) return NextResponse.json({ error: "code and idToken required" }, { status: 400 });

    let referredUserId: string;
    try { referredUserId = await verifyIdToken(String(idToken)); }
    catch { return NextResponse.json({ error: "Please sign in again." }, { status: 401 }); }

    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const affs = await sql`SELECT id, user_id FROM affiliates WHERE code = ${String(code).trim().toUpperCase()}`;
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
    console.error("[AFFILIATE] track-referral failed:", e?.message);
    return NextResponse.json({ error: "Could not record the referral." }, { status: 500 });
  }
}
