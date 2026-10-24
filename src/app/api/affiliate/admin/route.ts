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
    const referrals = await sql`SELECT id, affiliate_id as "affiliateId", referred_user_email as "email", referred_user_name as "name", plan, amount, status, order_id as "orderId", created_at as "createdAt", credited_at as "creditedAt" FROM referrals ORDER BY created_at DESC LIMIT 5000`;
    const payouts = await sql`SELECT id, affiliate_id as "affiliateId", amount, upi_id as "upiId", status, created_at as "createdAt" FROM payouts ORDER BY created_at DESC LIMIT 2000`;
    let audit: any[] = [];
    try {
      audit = await sql`SELECT id, admin_uid as "adminUid", action, detail, created_at as "createdAt" FROM affiliate_audit ORDER BY created_at DESC LIMIT 300`;
    } catch { /* table not created yet: run migrate-affiliate.js */ }

    const num = (v: any) => Number(v || 0);
    return NextResponse.json({
      affiliates: affiliates.map((a: any) => ({ ...a, totalEarned: num(a.totalEarned), pendingAmount: num(a.pendingAmount), paidOut: num(a.paidOut) })),
      referrals: referrals.map((r: any) => ({ ...r, amount: num(r.amount) })),
      payouts: payouts.map((p: any) => ({ ...p, amount: num(p.amount) })),
      audit,
    });
  } catch (e: any) {
    return errorResponse(e);
  }
}

// Admin only: approve or reject a withdrawal, cancel a commission (for example after a refund), or put an affiliate on hold.
export async function POST(req: NextRequest) {
  try {
    const adminUid = await requireAdmin(req);
    const { payoutId, referralId, affiliateId, action } = await req.json().catch(() => ({}));
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const log = async (detail: string) => {
      try { await sql`INSERT INTO affiliate_audit (admin_uid, action, detail) VALUES (${adminUid}, ${String(action)}, ${detail})`; }
      catch (e: any) { console.error("[AFFILIATE] audit log failed:", e?.message); }
    };

    if (action === "approved" || action === "rejected") {
      const info = await sql`SELECT p.amount, p.upi_id, a.name, a.code FROM payouts p JOIN affiliates a ON a.id = p.affiliate_id WHERE p.id = ${payoutId}`;
      let rows: any[];
      if (action === "approved") {
        // Marks it paid and moves the money from "pending" to "paid out" in one statement.
        rows = await sql`
          WITH p AS (UPDATE payouts SET status = 'approved' WHERE id = ${payoutId} AND status = 'processing' RETURNING affiliate_id, amount)
          UPDATE affiliates a SET pending_amount = a.pending_amount - p.amount, paid_out = a.paid_out + p.amount
            FROM p WHERE a.id = p.affiliate_id RETURNING a.id`;
      } else {
        rows = await sql`UPDATE payouts SET status = 'rejected' WHERE id = ${payoutId} AND status = 'processing' RETURNING id`;
      }
      if (rows.length === 0) throw new ApiError("That payout was already handled.");
      const i = info[0];
      await log(`${action === "approved" ? "Marked paid" : "Rejected"} ₹${Number(i?.amount || 0)} to ${i?.upi_id || "?"} (${i?.name || i?.code || "affiliate"})`);
      return NextResponse.json({ success: true });
    }

    if (action === "cancel") {
      // Takes the commission back (balance can go below zero if it was already paid out; it is then set off against the next sales).
      const info = await sql`SELECT r.referred_user_email, r.amount, a.name, a.code FROM referrals r JOIN affiliates a ON a.id = r.affiliate_id WHERE r.id = ${referralId}`;
      const rows = await sql`
        WITH r AS (UPDATE referrals SET status = 'cancelled' WHERE id = ${referralId} AND status = 'completed' RETURNING affiliate_id, amount)
        UPDATE affiliates a SET pending_amount = a.pending_amount - r.amount, total_earned = a.total_earned - r.amount
          FROM r WHERE a.id = r.affiliate_id RETURNING a.id`;
      if (rows.length === 0) throw new ApiError("That sale cannot be cancelled.");
      const i = info[0];
      await log(`Cancelled ₹${Number(i?.amount || 0)} commission for ${i?.referred_user_email || "a student"} (${i?.name || i?.code || "affiliate"})`);
      return NextResponse.json({ success: true });
    }

    if (action === "suspend" || action === "reactivate") {
      const next = action === "suspend" ? "suspended" : "active";
      const rows = await sql`UPDATE affiliates SET status = ${next} WHERE id = ${affiliateId} RETURNING name, code`;
      if (rows.length === 0) throw new ApiError("Affiliate not found.");
      await log(`${action === "suspend" ? "Put on hold" : "Reactivated"}: ${rows[0].name || rows[0].code}`);
      return NextResponse.json({ success: true });
    }

    throw new ApiError("Unknown action.");
  } catch (e: any) {
    return errorResponse(e);
  }
}
