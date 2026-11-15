export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore, getAdminStorageBucket } from '@/lib/firebase-admin'
import { requireAdmin, errorResponse, ApiError } from '@/lib/api-auth'
import { slugify } from '@/lib/top100-docs-server'

/**
 * Admin only. Manages the Top 100 sheets (self-contained HTML files).
 *  action "upload" -> { id?, fileName, subject, subjectKey, html }  saves the file to Storage and the list entry to Firestore
 *                     (same id again = replaces that sheet). Title and chapter are read from the file itself.
 *  action "status" -> { id, status: "published" | "hidden" }
 *  action "delete" -> { id }
 */
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/<[^>]+>/g, '').trim()

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req)
    const body = await req.json()
    const db = getAdminFirestore()
    const col = db.collection('top100Docs')
    const { action } = body

    if (action === 'upload') {
      const { fileName, subject, subjectKey, html } = body
      if (typeof html !== 'string' || html.length < 500 || !/<html[\s>]/i.test(html)) throw new ApiError('That does not look like an HTML file.', 400)
      if (html.length > 8_000_000) throw new ApiError('File is too large (over 8 MB).', 413)
      if (/<script[\s>]/i.test(html)) throw new ApiError('This file contains a script, which is not allowed.', 400)
      if (!subject || !subjectKey) throw new ApiError('Missing subject.', 400)
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const sub = html.match(/<div class="sub">([\s\S]*?)<\/div>/i)
      const title = decode(h1?.[1] || '') || decode((html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/–\s*QubixPrep.*$/i, '')) || String(fileName || '').replace(/\.html?$/i, '').replace(/_/g, ' ')
      const chapter = Number((decode(sub?.[1] || '').match(/Ch\s*(\d+)/i) || [])[1]) || 0
      const id = slugify(`${subjectKey}-${body.id || fileName || title}`)
      const storagePath = `top100/${subjectKey}/${id}.html`
      const buf = Buffer.from(html, 'utf8')
      await getAdminStorageBucket().file(storagePath).save(buf, { contentType: 'text/html; charset=utf-8', resumable: false, metadata: { cacheControl: 'private, max-age=3600' } })
      const prev = await col.doc(id).get()
      await col.doc(id).set({ title, subject, subjectKey, chapter, storagePath, sizeBytes: buf.length, status: prev.exists ? (prev.data() as any).status || 'published' : 'published', updatedAt: Date.now() }, { merge: true })
      return NextResponse.json({ ok: true, id, title, chapter })
    }

    if (action === 'status') {
      if (!body.id || (body.status !== 'published' && body.status !== 'hidden')) throw new ApiError('Bad request.', 400)
      await col.doc(body.id).update({ status: body.status })
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete') {
      if (!body.id) throw new ApiError('Missing id.', 400)
      const snap = await col.doc(body.id).get()
      const path = (snap.data() as any)?.storagePath
      if (path) await getAdminStorageBucket().file(path).delete({ ignoreNotFound: true })
      await col.doc(body.id).delete()
      return NextResponse.json({ ok: true })
    }

    throw new ApiError('Unknown action.', 400)
  } catch (e: any) {
    return errorResponse(e)
  }
}
