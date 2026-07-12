export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const MIN_PAYOUT = 500;

export async function POST(req: NextRequest) {
  try {
    const { userId, upiId, amount } = await req.json();
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    if (!upiId) throw new Error("UPI ID required");
    if (Number(amount) < MIN_PAYOUT) throw new Error(`Minimum payout is ₹${MIN_PAYOUT}`);

    const affs = await sql`SELECT id, pending_amount FROM affiliates WHERE user_id = ${userId}`;
    if (affs.length === 0) throw new Error("Affiliate not found");

    const pendingRequests = await sql`SELECT COALESCE(SUM(amount), 0) as total FROM payouts WHERE affiliate_id = ${affs[0].id} AND status = 'processing'`;
    const alreadyRequested = Number(pendingRequests[0]?.total || 0);
    const trueAvailable = Number(affs[0].pending_amount) - alreadyRequested;

    if (trueAvailable < amount) throw new Error("Insufficient balance");

    await sql`UPDATE affiliates SET upi_id = ${upiId} WHERE id = ${affs[0].id}`;
    await sql`INSERT INTO payouts (affiliate_id, amount, upi_id, status) VALUES (${affs[0].id}, ${amount}, ${upiId}, 'processing')`;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
