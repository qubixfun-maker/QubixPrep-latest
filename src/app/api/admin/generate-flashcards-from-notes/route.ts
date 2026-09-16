export const dynamic = "force-dynamic"
export const maxDuration = 280

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin'
import { generateFlashcardDecksFromNotes } from '@/ai/notes-to-flashcards'

/**
 * Generates flashcard decks (one per topic) by reading a chapter's already-generated
 * NOTES directly - unlike master-generate-flashcards, this does NOT require
 * chapterKnowledge to exist, so it works for AI Notes Generator chapters (which have
 * no source textbook / chapterKnowledge at all).
 *
 * Usage: POST { idToken, subjectId, textbookId, chapterId, chapterTitle }
 */
export async function POST(req: NextRequest) {
  try {
    const { idToken, subjectId, textbookId, chapterId, chapterTitle } = await req.json()

    if (!idToken || !subjectId || !textbookId || !chapterId) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, or chapterId.' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const docKey = `${textbookId}__${chapterId}`
    const notesDoc = await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).get()
    if (!notesDoc.exists) {
      return NextResponse.json({ error: 'No notes found for this chapter. Generate its notes first.' }, { status: 404 })
    }
    const notes = notesDoc.data() as any

    const result = await generateFlashcardDecksFromNotes(notes.topics || [])
    if (result.error || !result.decks) {
      return NextResponse.json({ error: result.error || 'Flashcard generation failed' }, { status: 500 })
    }

    let totalCards = 0
    for (const deck of result.decks) {
      const deckSlug = `${docKey}-${deck.topicName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      const cardsWithIds = deck.cards.map((c, i) => ({ id: `c${i}`, front: c.front, back: c.back }))

      await db.collection('subjects').doc(subjectId).collection('flashcardDecks').doc(deckSlug).set({
        unitName: null,
        chapterName: chapterTitle || notes.chapterTitle,
        topicName: deck.topicName,
        title: deck.topicName,
        cards: cardsWithIds,
        cardCount: cardsWithIds.length,
        textbookId,
        chapterId,
        createdAt: new Date().toISOString(),
      })
      totalCards += cardsWithIds.length
    }

    return NextResponse.json({ success: true, deckCount: result.decks.length, totalCards })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Flashcard generation failed', stack: e.stack }, { status: 500 })
  }
}
