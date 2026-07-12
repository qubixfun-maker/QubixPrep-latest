export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const affs = await sql`SELECT id, user_id, email, name, plan, code, status, upi_id as "upiId", total_earned as "totalEarned", pending_amount as "pendingAmount", paid_out as "paidOut" FROM affiliates WHERE user_id = ${userId}`;

    if (affs.length === 0) return NextResponse.json({ affiliate: null });

    const refs = await sql`SELECT id, referred_user_email as "referredUserEmail", referred_user_name as "referredUserName", plan, amount, status, charge_count as "chargeCount", charge_history as "chargeHistory", created_at as "createdAt" FROM referrals WHERE affiliate_id = ${affs[0].id} ORDER BY created_at DESC`;
    const payouts = await sql`SELECT id, amount, upi_id as "upiId", status, created_at as "createdAt" FROM payouts WHERE affiliate_id = ${affs[0].id} ORDER BY created_at DESC`;

    return NextResponse.json({ affiliate: affs[0], referrals: refs, payouts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, upiId } = await req.json();
    if (!userId || !upiId) return NextResponse.json({ error: "userId and upiId required" }, { status: 400 });
    const sql = neon(process.env.NEON_DATABASE_URL || "");
    await sql`UPDATE affiliates SET upi_id = ${upiId} WHERE user_id = ${userId}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
