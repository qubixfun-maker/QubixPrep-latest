export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireUser, errorResponse, ApiError } from "@/lib/api-auth";
import { MIN_PAYOUT } from "@/lib/affiliate";

const UPI_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/;

// Affiliate asks to withdraw. The balance check and the request are one statement, so two quick clicks cannot over-withdraw.
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const upi = String(body.upiId || "").trim();
    const amount = Math.floor(Number(body.amount));

    if (!UPI_RE.test(upi)) throw new ApiError("Enter a valid UPI id, for example name@okhdfcbank");
    if (!Number.isFinite(amount) || amount < MIN_PAYOUT) throw new ApiError(`Minimum payout is ₹${MIN_PAYOUT}`);

    const sql = neon(process.env.NEON_DATABASE_URL || "");

    // The lock makes a second request from the same person wait until the first has finished,
    // so two quick clicks can never withdraw more than the balance.
    const lock = sql`SELECT pg_advisory_xact_lock(hashtext(${"payout:" + userId}))`;
    const insert = sql`
      INSERT INTO payouts (affiliate_id, amount, upi_id, status)
      SELECT a.id, ${amount}, ${upi}, 'processing'
        FROM affiliates a
       WHERE a.user_id = ${userId}
         AND a.pending_amount - COALESCE((SELECT SUM(p.amount) FROM payouts p WHERE p.affiliate_id = a.id AND p.status = 'processing'), 0) >= ${amount}
   RETURNING id`;
    const results: any[] = await (sql as any).transaction([lock, insert]);
    const rows: any[] = results[1] || [];

    if (rows.length === 0) throw new ApiError("Not enough available balance.");

    await sql`UPDATE affiliates SET upi_id = ${upi} WHERE user_id = ${userId}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return errorResponse(e);
  }
}
