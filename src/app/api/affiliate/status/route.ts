export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { requireUser, errorResponse, ApiError } from "@/lib/api-auth";

const UPI_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z]{2,32}$/;

function maskEmail(email?: string | null) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return "";
  return name.slice(0, 2) + "***@" + domain;
}

// The signed-in affiliate's own dashboard data.
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const sql = neon(process.env.NEON_DATABASE_URL || "");

    const affs = await sql`SELECT id, code, status, upi_id as "upiId", total_earned as "totalEarned", pending_amount as "pendingAmount", paid_out as "paidOut" FROM affiliates WHERE user_id = ${userId}`;
    if (affs.length === 0) return NextResponse.json({ affiliate: null });
    const a = affs[0];

    const refs = await sql`SELECT id, referred_user_email as "email", referred_user_name as "name", plan, amount, status, created_at as "createdAt", credited_at as "creditedAt" FROM referrals WHERE affiliate_id = ${a.id} ORDER BY created_at DESC LIMIT 500`;
    const payouts = await sql`SELECT id, amount, upi_id as "upiId", status, created_at as "createdAt" FROM payouts WHERE affiliate_id = ${a.id} ORDER BY created_at DESC LIMIT 100`;

    const requested = payouts.filter((p: any) => p.status === "processing").reduce((s: number, p: any) => s + Number(p.amount), 0);
    const available = Math.max(0, Number(a.pendingAmount) - requested);

    return NextResponse.json({
      affiliate: { code: a.code, status: a.status, upiId: a.upiId, totalEarned: Number(a.totalEarned), paidOut: Number(a.paidOut), available },
      referrals: refs.map((r: any) => ({
        id: r.id,
        email: maskEmail(r.email),
        name: r.name ? String(r.name).split(" ")[0] : "",
        plan: r.plan,
        amount: Number(r.amount),
        status: r.status,
        createdAt: r.createdAt,
        creditedAt: r.creditedAt,
      })),
      payouts: payouts.map((p: any) => ({ ...p, amount: Number(p.amount) })),
    });
  } catch (e: any) {
    return errorResponse(e);
  }
}

// Save the affiliate's UPI id.
export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const { upiId } = await req.json().catch(() => ({}));
    const upi = String(upiId || "").trim();
    if (!UPI_RE.test(upi)) throw new ApiError("Enter a valid UPI id, for example name@okhdfcbank");
    const sql = neon(process.env.NEON_DATABASE_URL || "");
    await sql`UPDATE affiliates SET upi_id = ${upi} WHERE user_id = ${userId}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return errorResponse(e);
  }
}
