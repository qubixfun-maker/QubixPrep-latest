export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireAdmin, errorResponse, ApiError } from "@/lib/api-auth";

// Admin only: everything about every affiliate.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const affiliates = await sql`SELECT id, user_id as "userId", email, name, code, status, upi_id as "upiId", total_earned as "totalEarned", pending_amount as "pendingAmount", paid_out as "paidOut", created_at as "createdAt" FROM affiliates ORDER BY created_at DESC`;
    const referrals = await sql`SELECT id, affiliate_id as "affiliateId", referred_user_email as "email", referred_user_name as "name", plan, amount, status, order_id as "orderId", created_at as "createdAt", credited_at as "creditedAt" FROM referrals ORDER BY created_at DESC LIMIT 2000`;
    const payouts = await sql`SELECT id, affiliate_id as "affiliateId", amount, upi_id as "upiId", status, created_at as "createdAt" FROM payouts ORDER BY created_at DESC LIMIT 1000`;

    const num = (v: any) => Number(v || 0);
    return NextResponse.json({
      affiliates: affiliates.map((a: any) => ({ ...a, totalEarned: num(a.totalEarned), pendingAmount: num(a.pendingAmount), paidOut: num(a.paidOut) })),
      referrals: referrals.map((r: any) => ({ ...r, amount: num(r.amount) })),
      payouts: payouts.map((p: any) => ({ ...p, amount: num(p.amount) })),
    });
  } catch (e: any) {
    return errorResponse(e);
  }
}

// Admin only: approve or reject a withdrawal, or cancel a commission (for example after a refund).
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { payoutId, referralId, action } = await req.json().catch(() => ({}));
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    if (action === "approved") {
      // Marks it paid and moves the money from "pending" to "paid out" in one statement.
      const rows = await sql`
        WITH p AS (UPDATE payouts SET status = 'approved' WHERE id = ${payoutId} AND status = 'processing' RETURNING affiliate_id, amount)
        UPDATE affiliates a SET pending_amount = a.pending_amount - p.amount, paid_out = a.paid_out + p.amount
          FROM p WHERE a.id = p.affiliate_id RETURNING a.id`;
      if (rows.length === 0) throw new ApiError("That payout was already handled.");
      return NextResponse.json({ success: true });
    }

    if (action === "rejected") {
      const rows = await sql`UPDATE payouts SET status = 'rejected' WHERE id = ${payoutId} AND status = 'processing' RETURNING id`;
      if (rows.length === 0) throw new ApiError("That payout was already handled.");
      return NextResponse.json({ success: true });
    }

    if (action === "cancel") {
      // Takes the commission back (balance can go below zero if it was already paid out; it is then set off against the next sales).
      const rows = await sql`
        WITH r AS (UPDATE referrals SET status = 'cancelled' WHERE id = ${referralId} AND status = 'completed' RETURNING affiliate_id, amount)
        UPDATE affiliates a SET pending_amount = a.pending_amount - r.amount, total_earned = a.total_earned - r.amount
          FROM r WHERE a.id = r.affiliate_id RETURNING a.id`;
      if (rows.length === 0) throw new ApiError("That sale cannot be cancelled.");
      return NextResponse.json({ success: true });
    }

    throw new ApiError("Unknown action.");
  } catch (e: any) {
    return errorResponse(e);
  }
}
