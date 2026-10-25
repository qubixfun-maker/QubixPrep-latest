export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, errorResponse, ApiError } from "@/lib/api-auth"
import { grantFree, listGrants, revokeGrant, type GrantPlan } from "@/lib/grant-server"

// Admin only: list free grants.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
    return NextResponse.json({ grants: await listGrants() })
  } catch (e: any) {
    return errorResponse(e)
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Admin only: give a plan for free, or take a free grant back.
export async function POST(req: NextRequest) {
  try {
    const adminUid = await requireAdmin(req)
    const body = await req.json().catch(() => ({}))

    if (body.action === "revoke") {
      const id = String(body.id || "")
      if (!/^[A-Za-z0-9]{10,40}$/.test(id)) throw new ApiError("Invalid grant.")
      return NextResponse.json({ message: await revokeGrant(id) })
    }

    const plan: GrantPlan = body.plan === "pro" ? "pro" : body.plan === "basic" ? "basic" : (null as any)
    if (!plan) throw new ApiError("Choose Scholar or Clinician.")
    const days = Math.floor(Number(body.days))
    if (!Number.isFinite(days) || days < 1 || days > 730) throw new ApiError("Days must be between 1 and 730.")
    const note = String(body.note || "").trim().slice(0, 80)
    const emails: string[] = Array.from(new Set<string>((Array.isArray(body.emails) ? body.emails : []).map((e: any) => String(e).trim()).filter(Boolean)))
    if (emails.length === 0) throw new ApiError("Enter at least one email.")
    if (emails.length > 50) throw new ApiError("Please grant at most 50 emails at a time.")

    const results = []
    for (const email of emails) {
      if (!EMAIL.test(email)) { results.push({ email, ok: false, message: "This is not a valid email." }); continue }
      try { results.push(await grantFree(email, plan, days, note, adminUid)) }
      catch (e: any) { console.error("[FREE-ACCESS]", e?.message); results.push({ email, ok: false, message: "Something went wrong for this email." }) }
    }
    return NextResponse.json({ results })
  } catch (e: any) {
    return errorResponse(e)
  }
}
