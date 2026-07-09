import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    
    const sql = neon(process.env.NEON_DATABASE_URL || "");
    
    const affs = await sql`SELECT id, user_id, email, code, status, total_earned as "totalEarned", pending_amount as "pendingAmount" FROM affiliates WHERE user_id = ${userId}`;
    
    if (affs.length === 0) return NextResponse.json({ affiliate: null });
    
    const refs = await sql`SELECT * FROM referrals WHERE affiliate_id = ${affs[0].id}`;
    const payouts = await sql`SELECT * FROM payouts WHERE affiliate_id = ${affs[0].id}`;
    
    return NextResponse.json({ affiliate: affs[0], referrals: refs, payouts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
