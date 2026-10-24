// Server-only. Works out who is calling an API route from their Firebase login token.
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, readUserPlan } from '@/lib/plan-server'

export class ApiError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

/** Returns the signed-in user's id, or throws a 401. */
export async function requireUser(req: NextRequest): Promise<string> {
  const header = req.headers.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!token) throw new ApiError('Please sign in.', 401)
  try {
    return await verifyIdToken(token)
  } catch {
    throw new ApiError('Please sign in again.', 401)
  }
}

/** Returns the admin's user id, or throws a 401/403. */
export async function requireAdmin(req: NextRequest): Promise<string> {
  const uid = await requireUser(req)
  const user = await readUserPlan(uid)
  if (user.role !== 'admin') throw new ApiError('Not allowed.', 403)
  return uid
}

export function errorResponse(e: any) {
  if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error('[AFFILIATE]', e?.message || e)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
