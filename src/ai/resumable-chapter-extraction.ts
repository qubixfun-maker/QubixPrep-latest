import { runExtraction, type BuildKnowledgeInput, type ChapterKnowledge } from '@/ai/chapter-knowledge';
import { splitIntoChunks, buildSourcesBlock, buildPrompt, SAFE_CHUNK_SIZE } from '@/ai/chapter-knowledge-utils';
import { allTemplatesForPrompt } from '@/ai/subject-templates';

/**
 * Same extraction logic as getChapterKnowledge(), but with progress persisted after
 * EVERY chunk rather than only at the very end. A very long chapter can need several
 * chunks processed sequentially in one request, and a timeout partway through used to
 * mean losing all of that chapter's progress - a retry restarted from chunk 1, risking
 * hitting the same timeout again if the chapter is genuinely near the time budget's edge.
 *
 * Progress lives in a subcollection (one small document per chunk, not one growing
 * array field) to stay well under Firestore's 1MB document size limit even for a
 * chapter that needs many chunks.
 *
 * This does NOT replace getChapterKnowledge() - that function is still used elsewhere
 * and is unaffected. This is specifically for the Master Knowledge Extraction flow,
 * where large chapters have been hitting this exact timeout pattern.
 */

type ChunkProgressDoc = {
  chunks: Record<number, { centralTopic: string; overview: string; topics: any[] }>;
  totalChunks: number;
};

export type ResumableExtractionResult = {
  knowledge?: ChapterKnowledge;
  error?: string;
  chunksCompleted?: number;
  totalChunks?: number;
};

/**
 * progressRef: a Firestore document reference used to store/read per-chunk progress.
 * Caller owns creating this ref (e.g. chapterKnowledgeProgress/{docKey}) and should
 * delete it once extraction succeeds, so a future re-run of an already-done chapter
 * doesn't need to check stale progress.
 */
export async function extractChapterKnowledgeResumable(
  input: BuildKnowledgeInput,
  progressRef: FirebaseFirestore.DocumentReference
): Promise<ResumableExtractionResult> {
  if (!input.sources.length) return { error: 'No chapter source excerpts provided.' };

  const chapterTitle = input.sources[0].chapterTitle;
  const templates = allTemplatesForPrompt(input.subjectName);
  const fullText = input.sources[0].text;
  const chunks = splitIntoChunks(fullText, SAFE_CHUNK_SIZE);

  const progressSnap = await progressRef.get();
  const existing: ChunkProgressDoc = progressSnap.exists
    ? (progressSnap.data() as ChunkProgressDoc)
    : { chunks: {}, totalChunks: chunks.length };

  for (let i = 0; i < chunks.length; i++) {
    if (existing.chunks[i]) continue; // already extracted in a previous attempt - skip

    const partInfo = chunks.length > 1 ? `part ${i + 1} of ${chunks.length}` : undefined;
    const sourcesBlock = buildSourcesBlock(input.sources, chunks[i], partInfo);
    const prompt = buildPrompt(input, sourcesBlock, templates, partInfo);
    const chunkResult = await runExtraction(prompt, input.forceVertex, input.useClaude, input.useGeminiNative);

    if ('error' in chunkResult) {
      const completedCount = Object.keys(existing.chunks).length;
      if (completedCount === 0) return { error: `Chunk ${i + 1}/${chunks.length} failed: ${chunkResult.error}` };
      // Some chunks already succeeded (this attempt or an earlier one) - save what we
      // have and report partial progress rather than losing it. A retry picks up here.
      return { error: `Chunk ${i + 1}/${chunks.length} failed: ${chunkResult.error}`, chunksCompleted: completedCount, totalChunks: chunks.length };
    }

    existing.chunks[i] = { centralTopic: chunkResult.centralTopic, overview: chunkResult.overview, topics: chunkResult.topics };
    // Persisted immediately after this chunk succeeds - if the NEXT chunk times out
    // the whole request, this chunk's work is not lost.
    await progressRef.set(existing);
  }

  const allTopics: any[] = [];
  let centralTopic = '';
  const overviewParts: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = existing.chunks[i];
    if (!centralTopic) centralTopic = chunk.centralTopic;
    if (chunk.overview) overviewParts.push(chunk.overview);
    allTopics.push(...chunk.topics);
  }

  if (allTopics.length === 0) return { error: 'No topics extracted from any chunk.' };

  return {
    knowledge: {
      chapterTitle,
      subjectName: input.subjectName,
      centralTopic: centralTopic || chapterTitle,
      overview: overviewParts.join(' '),
      topics: allTopics,
      extractedAt: new Date().toISOString(),
      schemaVersion: 2,
      chunkCount: chunks.length,
    },
  };
}
