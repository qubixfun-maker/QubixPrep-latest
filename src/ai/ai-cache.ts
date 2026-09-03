'use server';
import { createHash } from 'crypto';
import { getAdminFirestore } from '@/lib/firebase-admin';

/**
 * Cache for expensive AI generation results.
 *
 * The point is to never pay twice for the same work. Bulk runs fail partway,
 * get retried, and different features (mindmaps, notes, QBank, flashcards) each
 * want the same underlying understanding of the same chapter. Without a cache,
 * every one of those re-sends the chapter text and re-pays for it.
 *
 * Keys are (task + scope + promptVersion + input fingerprint). Changing a prompt
 * means bumping its version constant below, which cleanly invalidates only that
 * task's cached results rather than wiping everything.
 */

// Bump a task's version when its prompt or output shape changes, so stale results
// aren't silently reused. Leave alone otherwise.
export const PROMPT_VERSIONS = {
  mindmapBranchList: 'v1',
  mindmapBranchDetail: 'v1',
  notesPagePlan: 'v1',
  notesPageContent: 'v1',
  longAnswerQuestions: 'v1',
  longAnswerModelAnswer: 'v1',
} as const;

export type CacheTask = keyof typeof PROMPT_VERSIONS;

const COLLECTION = 'aiCache';

// Firestore document IDs cannot exceed 1500 bytes and cannot contain '/'. Hashing
// the composite key keeps IDs short, safe, and collision-resistant regardless of
// how long the chapter title or branch name is.
function buildCacheId(task: CacheTask, scope: string, inputFingerprint: string): string {
  const version = PROMPT_VERSIONS[task];
  const composite = `${task}::${version}::${scope}::${inputFingerprint}`;
  return createHash('sha256').update(composite).digest('hex');
}

// Fingerprints the actual input content so that if a chapter's source text changes
// (re-ingested, corrected, OCR'd), its cached results are naturally bypassed rather
// than serving output derived from text that no longer exists.
export async function fingerprintInput(...parts: (string | undefined | null)[]): Promise<string> {
  const joined = parts.map((p) => p || '').join('\u0000');
  return createHash('sha256').update(joined).digest('hex').slice(0, 32);
}

export type CacheLookupResult<T> = {
  hit: boolean;
  value?: T;
};

export async function getCached<T>(
  task: CacheTask,
  scope: string,
  inputFingerprint: string
): Promise<CacheLookupResult<T>> {
  try {
    const db = getAdminFirestore();
    const id = buildCacheId(task, scope, inputFingerprint);
    const snap = await db.collection(COLLECTION).doc(id).get();
    if (!snap.exists) return { hit: false };
    const data = snap.data();
    if (!data || data.value === undefined) return { hit: false };
    return { hit: true, value: data.value as T };
  } catch (err: any) {
    // A cache failure must never break generation - fall through to a live call.
    console.warn('[ai-cache] read failed, proceeding uncached:', err?.message);
    return { hit: false };
  }
}

export async function setCached<T>(
  task: CacheTask,
  scope: string,
  inputFingerprint: string,
  value: T,
  meta?: Record<string, any>
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const id = buildCacheId(task, scope, inputFingerprint);
    await db.collection(COLLECTION).doc(id).set({
      task,
      promptVersion: PROMPT_VERSIONS[task],
      scope,
      inputFingerprint,
      value,
      ...(meta ? { meta } : {}),
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    // Best-effort: a failed write just means we pay for this call again later.
    console.warn('[ai-cache] write failed:', err?.message);
  }
}

/**
 * Wraps any expensive AI operation with cache-first behaviour.
 * Returns { value, cached } so callers can report/track hit rates.
 */
export async function withCache<T>(
  task: CacheTask,
  scope: string,
  inputFingerprint: string,
  produce: () => Promise<T>,
  options?: { shouldCache?: (value: T) => boolean; meta?: Record<string, any> }
): Promise<{ value: T; cached: boolean }> {
  const lookup = await getCached<T>(task, scope, inputFingerprint);
  if (lookup.hit && lookup.value !== undefined) {
    return { value: lookup.value, cached: true };
  }

  const value = await produce();

  // Never cache failures - otherwise one bad run poisons all future attempts.
  const shouldCache = options?.shouldCache ? options.shouldCache(value) : true;
  if (shouldCache) {
    await setCached(task, scope, inputFingerprint, value, options?.meta);
  }

  return { value, cached: false };
}
