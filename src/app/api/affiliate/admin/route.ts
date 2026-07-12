export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const affiliates = await sql`SELECT id, user_id as "userId", email, name, plan, code, status, upi_id as "upiId", total_earned as "totalEarned", pending_amount as "pendingAmount", paid_out as "paidOut", created_at as "createdAt" FROM affiliates ORDER BY created_at DESC`;
    const referrals = await sql`SELECT id, affiliate_id as "affiliateId", referred_user_email as "referredUserEmail", referred_user_name as "referredUserName", plan, amount, status, charge_count as "chargeCount", charge_history as "chargeHistory", created_at as "createdAt" FROM referrals ORDER BY created_at DESC`;
    const payouts = await sql`SELECT id, affiliate_id as "affiliateId", amount, upi_id as "upiId", status, created_at as "createdAt" FROM payouts ORDER BY created_at DESC`;

    const referralsByAffiliate: Record<number, any[]> = {};
    referrals.forEach((r: any) => {
      if (!referralsByAffiliate[r.affiliateId]) referralsByAffiliate[r.affiliateId] = [];
      referralsByAffiliate[r.affiliateId].push(r);
    });
    const payoutsByAffiliate: Record<number, any[]> = {};
    payouts.forEach((p: any) => {
      if (!payoutsByAffiliate[p.affiliateId]) payoutsByAffiliate[p.affiliateId] = [];
      payoutsByAffiliate[p.affiliateId].push(p);
    });

    const enriched = affiliates.map((a: any) => ({
      ...a,
      referrals: referralsByAffiliate[a.id] || [],
      payouts: payoutsByAffiliate[a.id] || [],
    }));

    return NextResponse.json({ affiliates: enriched, allPayouts: payouts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { payoutId, action } = await req.json();
    if (!payoutId || !["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "payoutId and valid action required" }, { status: 400 });
    }
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const rows = await sql`SELECT id, affiliate_id, amount, status FROM payouts WHERE id = ${payoutId}`;
    if (rows.length === 0) throw new Error("Payout not found");
    if (rows[0].status !== "processing") throw new Error("Payout already actioned");

    await sql`UPDATE payouts SET status = ${action} WHERE id = ${payoutId}`;

    if (action === "approved") {
      await sql`UPDATE affiliates SET pending_amount = pending_amount - ${rows[0].amount}, paid_out = paid_out + ${rows[0].amount} WHERE id = ${rows[0].affiliate_id}`;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
