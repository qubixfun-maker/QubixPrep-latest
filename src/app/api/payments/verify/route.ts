import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || ''
  return NextResponse.json({
    length: rawKey.length,
    first10: rawKey.slice(0, 10),
    last10: rawKey.slice(-10),
    startsWithQuote: rawKey.startsWith('"'),
    endsWithQuote: rawKey.endsWith('"'),
    containsEscapedNewline: rawKey.includes('\\n'),
    containsRealNewline: rawKey.includes('\n')
  })
}
