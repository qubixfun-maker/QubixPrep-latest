import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const { userId, upiId, amount } = await req.json();
    const sql = neon(process.env.NEON_DATABASE_URL || "");
    
    const affs = await sql`SELECT id, pending_amount FROM affiliates WHERE user_id = ${userId}`;
    if (affs.length === 0) throw new Error("Affiliate not found");
    if (Number(affs[0].pending_amount) < amount) throw new Error("Insufficient balance");
    
    await sql`INSERT INTO payouts (affiliate_id, amount, upi_id) VALUES (${affs[0].id}, ${amount}, ${upiId})`;
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
