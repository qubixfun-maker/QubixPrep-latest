import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, userEmail } = await req.json();
    const sql = neon(process.env.NEON_DATABASE_URL || "");
    
    const code = (userName || "USER").slice(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    
    await sql`INSERT INTO affiliates (user_id, email, code) VALUES (${userId}, ${userEmail}, ${code}) ON CONFLICT (user_id) DO NOTHING`;
    
    return NextResponse.json({ success: true, code });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
