import fs from "fs";

// Supports one or more possible marker strings per replacement, so this works whether
// the file is untouched or already has an earlier version of this patch applied.
function patch(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  for (const { markers, replacement, label } of replacements) {
    if (content.includes(replacement)) {
      console.log(`[${filePath}] Already applied: ${label}`);
      continue;
    }
    const markerList = Array.isArray(markers) ? markers : [markers];
    let applied = false;
    for (const marker of markerList) {
      const count = content.split(marker).length - 1;
      if (count === 1) {
        content = content.split(marker).join(replacement);
        console.log(`[${filePath}] Applied: ${label}`);
        applied = true;
        break;
      } else if (count > 1) {
        throw new Error(`[${filePath}] Marker for "${label}" matched ${count} times (ambiguous). Aborting.`);
      }
    }
    if (!applied) {
      throw new Error(`[${filePath}] Could not find any known form of "${label}". Aborting - paste surrounding lines and I'll adjust.`);
    }
  }
  fs.writeFileSync(filePath, content, "utf8");
}

patch("src/ai/genkit.ts", [
  {
    label: "callGeminiNativeWithFallback accepts modelOverride",
    markers: [`async function callGeminiNativeWithFallback(body: any): Promise<{ content: string; provider: string }> {
  const candidates = geminiModelCandidates()`],
    replacement: `async function callGeminiNativeWithFallback(body: any, modelOverride?: string): Promise<{ content: string; provider: string }> {
  const candidates = modelOverride ? [modelOverride] : geminiModelCandidates()`,
  },
  {
    label: "callGeminiNative accepts and forwards modelOverride",
    markers: [`export async function callGeminiNative(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000,
  thinkingBudget?: number
): Promise<{ content: string; provider: string }> {`],
    replacement: `export async function callGeminiNative(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000,
  thinkingBudget?: number,
  modelOverride?: string
): Promise<{ content: string; provider: string }> {`,
  },
  {
    label: "callGeminiNative passes modelOverride to fallback call",
    markers: [`  return callGeminiNativeWithFallback({
    contents,
    ...(systemParts.length ? { systemInstruction: { parts: [{ text: systemParts.join('\\n\\n') }] } } : {}),
    generationConfig,
  })
}`],
    replacement: `  return callGeminiNativeWithFallback({
    contents,
    ...(systemParts.length ? { systemInstruction: { parts: [{ text: systemParts.join('\\n\\n') }] } } : {}),
    generationConfig,
  }, modelOverride)
}`,
  },
  {
    label: "callAIWithProvider accepts and forwards modelOverride + thinkingBudget",
    markers: [
      `export async function callAIWithProvider(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  maxTokens: number = 2000,
  forceVertex: boolean = false
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens)
}`,
      `export async function callAIWithProvider(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  maxTokens: number = 2000,
  forceVertex: boolean = false,
  modelOverride?: string
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens, undefined, modelOverride)
}`,
    ],
    replacement: `export async function callAIWithProvider(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  maxTokens: number = 2000,
  forceVertex: boolean = false,
  modelOverride?: string,
  thinkingBudget?: number
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens, thinkingBudget, modelOverride)
}`,
  },
  {
    label: "callClaudeOnly accepts and forwards modelOverride + thinkingBudget",
    markers: [
      `export async function callClaudeOnly(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens)
}`,
      `export async function callClaudeOnly(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000,
  modelOverride?: string
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens, undefined, modelOverride)
}`,
    ],
    replacement: `export async function callClaudeOnly(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000,
  modelOverride?: string,
  thinkingBudget?: number
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens, thinkingBudget, modelOverride)
}`,
  },
]);

patch("src/ai/notes-to-mindmap.ts", [
  {
    label: "bound requested depth in TASK line",
    markers: [`TASK: Produce the full recursive sub-tree for the topic "\${node.name}" - the same depth and completeness you would produce if you were building this branch directly from a standard textbook chapter, not just summarizing the notes above.`],
    replacement: `TASK: Produce a well-organized sub-tree for the topic "\${node.name}", typically about 3 levels deep (main sub-categories, their key points, and specific exam-ready facts) - focused and exam-relevant rather than an exhaustive textbook transcription.`,
  },
  {
    label: "bound requested depth in STRUCTURE GUIDANCE bullet",
    markers: [`- Go as deep as a standard Indian MBBS textbook genuinely covers this topic - multiple levels of nesting are expected for any topic with real depth, not just one flat layer of facts.`],
    replacement: `- Aim for about 3 levels of nesting for topics with real depth (fewer for simpler ones) - enough for genuinely useful exam revision without turning into an exhaustive textbook transcription.`,
  },
  {
    label: "force gemini-2.5-pro + disable thinking budget in callModel",
    markers: [
      `async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens);
  if (useGeminiNative) return callGeminiNative([{ role: 'user', content: prompt }], maxTokens);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex);
}`,
      `// Mindmap generation is pinned to gemini-2.5-pro specifically (not the app-wide
// fallback chain, which tries the pricier gemini-3.1-pro-preview first) - mindmap
// branches are structured organization/extraction, not frontier reasoning, and the
// pricier model was driving most of the per-subject AI cost for this feature.
const MINDMAP_MODEL = 'gemini-2.5-pro';

async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens, MINDMAP_MODEL);
  if (useGeminiNative) return callGeminiNative([{ role: 'user', content: prompt }], maxTokens, undefined, MINDMAP_MODEL);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex, MINDMAP_MODEL);
}`,
    ],
    replacement: `// Mindmap generation is pinned to gemini-2.5-pro specifically (not the app-wide
// fallback chain, which tries the pricier gemini-3.1-pro-preview first) - mindmap
// branches are structured organization/extraction, not frontier reasoning, and the
// pricier model was driving most of the per-subject AI cost for this feature.
const MINDMAP_MODEL = 'gemini-2.5-pro';
// Disables the model's invisible internal "thinking" pass before it writes the
// visible answer - that thinking still takes real wall-clock time even when the
// visible output is short, and this task (organizing notes into a tree) doesn't
// need deliberate reasoning. This does NOT reduce the output token ceiling below,
// so full-depth topics still have all 8000 tokens of room to write their answer.
const MINDMAP_THINKING_BUDGET = 0;

async function callModel(prompt: string, maxTokens: number, useClaude?: boolean, useGeminiNative?: boolean, forceVertex?: boolean) {
  if (useClaude) return callClaudeOnly([{ role: 'user', content: prompt }], maxTokens, MINDMAP_MODEL, MINDMAP_THINKING_BUDGET);
  if (useGeminiNative) return callGeminiNative([{ role: 'user', content: prompt }], maxTokens, MINDMAP_THINKING_BUDGET, MINDMAP_MODEL);
  return callAIWithProvider([{ role: 'user', content: prompt }], maxTokens, forceVertex, MINDMAP_MODEL, MINDMAP_THINKING_BUDGET);
}`,
  },
  {
    label: "shorten per-call pacing delay from 1000ms to 300ms",
    markers: [`      // A small fixed pace before every call, on top of the backoff below for
      // actual 429s - important here since branches run with concurrency, so
      // several of these can otherwise fire at once.
      await sleep(1000);`],
    replacement: `      // A small fixed pace before every call, on top of the backoff below for
      // actual 429s - important here since branches run with concurrency, so
      // several of these can otherwise fire at once. Shortened from 1000ms now that
      // generation is pinned to one model (gemini-2.5-pro) with its own quota bucket,
      // rather than potentially cycling across several models under load.
      await sleep(300);`,
  },
  {
    label: "raise top-level concurrency from 2 to 5",
    markers: [`const TOP_LEVEL_CONCURRENCY = 2; // lowered from 3 - fewer simultaneous Vertex calls means a burst is less likely to trip the per-minute quota`],
    replacement: `// Raised from 2 now that generation is pinned to a single model (gemini-2.5-pro)
// with its own dedicated quota bucket, instead of potentially cycling across several
// models under load - more simultaneous branches means less total wall-clock time
// per chapter, with the same per-call 429 backoff/retry logic still in place.
const TOP_LEVEL_CONCURRENCY = 5;`,
  },
]);

patch("src/ai/flows/ai-mindmap-data-generator.ts", [
  {
    label: "force gemini-2.5-pro + disable thinking in branch extraction call",
    markers: [
      `        const { content: raw } = await callAIWithProvider([{ role: 'user', content: prompt }], 4000, forceVertex);`,
      `        const { content: raw } = await callAIWithProvider([{ role: 'user', content: prompt }], 4000, forceVertex, 'gemini-2.5-pro');`,
    ],
    replacement: `        const { content: raw } = await callAIWithProvider([{ role: 'user', content: prompt }], 4000, forceVertex, 'gemini-2.5-pro', 0);`,
  },
  {
    label: "force gemini-2.5-pro + disable thinking in branch detail call",
    markers: [
      `        const { content: raw, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], 8000, forceVertex);`,
      `        const { content: raw, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], 8000, forceVertex, 'gemini-2.5-pro');`,
    ],
    replacement: `        const { content: raw, provider } = await callAIWithProvider([{ role: 'user', content: prompt }], 8000, forceVertex, 'gemini-2.5-pro', 0);`,
  },
]);

patch("src/app/api/admin/master-generate-mindmap/route.ts", [
  {
    label: "accept force flag and skip regeneration if mindmap already exists",
    markers: [`    const { idToken, subjectId, textbookId, chapterId, chapterTitle, useGeminiNative, useClaude } = await req.json()

    if (!idToken || !subjectId || !textbookId || !chapterId) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, or chapterId.' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const docKey = \`\${textbookId}__\${chapterId}\`
    const notesDoc = await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).get()`],
    replacement: `    const { idToken, subjectId, textbookId, chapterId, chapterTitle, useGeminiNative, useClaude, force } = await req.json()

    if (!idToken || !subjectId || !textbookId || !chapterId) {
      return NextResponse.json({ error: 'Missing idToken, subjectId, textbookId, or chapterId.' }, { status: 400 })
    }

    const decoded = await verifyIdToken(idToken)
    const db = getAdminFirestore()

    const userDoc = await db.collection('users').doc(decoded.uid).get()
    if (userDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const docKey = \`\${textbookId}__\${chapterId}\`

    // Idempotency guard: a chapter's mindmap is a real AI-billed generation (many
    // Gemini calls, one per top-level topic). Without this check, re-running a job
    // whose Firestore progress got reset (a retry-failed click, a fresh job that
    // happens to include an already-done chapter, a stuck "running" job resumed from
    // scratch) silently regenerates - and re-bills - chapters that already have a
    // perfectly good saved mindmap. Skip unless the caller explicitly passes force:true.
    const mmId = \`\${docKey}-mindmap\`
    if (!force) {
      const existing = await db.collection('subjects').doc(subjectId).collection('mindmaps').doc(mmId).get()
      if (existing.exists) {
        const existingData = existing.data() as any
        return NextResponse.json({ success: true, skipped: true, branchCount: existingData?.data?.branches?.length || 0 })
      }
    }

    const notesDoc = await db.collection('subjects').doc(subjectId).collection('textNotes').doc(docKey).get()`,
  },
  {
    label: "reuse mmId variable instead of redeclaring it",
    markers: [`    const mindmapData = await generateMindmapFromNotes(notes.topics, centralTopic, subjectName, { useGeminiNative: !!useGeminiNative, useClaude: !!useClaude })

    const mmId = \`\${docKey}-mindmap\`
    await db.collection('subjects').doc(subjectId).collection('mindmaps').doc(mmId).set({`],
    replacement: `    const mindmapData = await generateMindmapFromNotes(notes.topics, centralTopic, subjectName, { useGeminiNative: !!useGeminiNative, useClaude: !!useClaude })

    await db.collection('subjects').doc(subjectId).collection('mindmaps').doc(mmId).set({`,
  },
]);

console.log("\nAll patches applied successfully.");
