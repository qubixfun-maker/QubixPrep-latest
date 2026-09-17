import OpenAI from 'openai'
import { GoogleAuth } from 'google-auth-library'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

interface Provider {
  name: string
  baseURL: string
  apiKey: string
  model: string
}

function getStaticProviders(): Provider[] {
  return [
    {
      name: 'Groq',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY || '',
      model: 'gpt-oss-120b',
    },
    {
      name: 'Cerebras',
      baseURL: 'https://api.cerebras.ai/v1',
      apiKey: process.env.CEREBRAS_API_KEY || '',
      model: 'llama-3.3-70b',
    },
    {
      name: 'Gemini',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-2.5-flash',
    },
    {
      name: 'Mistral',
      baseURL: 'https://api.mistral.ai/v1',
      apiKey: process.env.MISTRAL_API_KEY || '',
      model: 'mistral-small-latest',
    },
    {
      name: 'OpenRouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      model: 'meta-llama/llama-3.3-70b-instruct',
    },
  ].filter(p => p.apiKey)
}

// Vertex AI uses a short-lived OAuth access token (not a static API key),
// generated from a service account JSON key. Cached in-memory until near expiry.
let cachedVertexToken: { token: string; expiresAt: number } | null = null

async function getVertexAccessToken(): Promise<string | null> {
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!rawKey) return null

  if (cachedVertexToken && cachedVertexToken.expiresAt > Date.now() + 60_000) {
    return cachedVertexToken.token
  }

  try {
    const credentials = JSON.parse(rawKey)
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    const client = await auth.getClient()
    const tokenResponse = await client.getAccessToken()
    if (!tokenResponse.token) return null

    cachedVertexToken = {
      token: tokenResponse.token,
      // Vertex tokens last ~1hr; refresh a bit early to be safe.
      expiresAt: Date.now() + 50 * 60_000,
    }
    return tokenResponse.token
  } catch (err: any) {
    console.warn('[AI] Failed to get Vertex AI access token:', err?.message)
    return null
  }
}

async function getVertexProvider(): Promise<Provider | null> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  if (!projectId) return null

  const token = await getVertexAccessToken()
  if (!token) return null

  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
  const model = process.env.GOOGLE_VERTEX_MODEL || 'google/gemini-2.5-flash'

  return {
    name: 'Vertex AI',
    baseURL: `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/openapi`,
    apiKey: token,
    model,
  }
}

// Low-level call to Vertex's native generateContent REST endpoint (not the OpenAI-compat
// shim above) - needed for image generation and vision input, which aren't reliably
// exposed through the chat-completions shim.
async function vertexGenerateContent(model: string, contents: any[], generationConfig?: any): Promise<any> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  if (!projectId) throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured')
  const token = await getVertexAccessToken()
  if (!token) throw new Error('Vertex AI access token unavailable (check GOOGLE_SERVICE_ACCOUNT_KEY)')
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, ...(generationConfig ? { generationConfig } : {}) }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Vertex generateContent failed (${res.status}): ${text.slice(0, 500)}`)
  }
  return res.json()
}

// Generates one image from a text prompt using Vertex's Gemini image model. The prompt
// should spell out the exact text to render, not just a topic to write about - image
// models are far more accurate at reproducing given text than composing their own.
export async function generateVertexImage(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  const model = process.env.GOOGLE_VERTEX_IMAGE_MODEL || 'gemini-2.5-flash-image'
  // Vertex's image models default to text-only output unless explicitly told to also
  // return an image - without this, the model just replies with text and we get nothing.
  const data = await vertexGenerateContent(model, [{ role: 'user', parts: [{ text: prompt }] }], { responseModalities: ['TEXT', 'IMAGE'] })
  const parts = data?.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' }
    }
  }
  return null
}

// Transcribes all visible text from an image using Vertex's Gemini vision - used to check
// a generated note-image actually rendered the intended text accurately before saving it.
export async function transcribeVertexImage(base64: string, mimeType: string): Promise<string> {
  const model = process.env.GOOGLE_VERTEX_MODEL_VISION || 'gemini-2.5-flash'
  const data = await vertexGenerateContent(model, [
    {
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: 'Transcribe every word of visible text in this image exactly as written, in reading order. Output only the transcribed text, no commentary.' },
      ],
    },
  ])
  const parts = data?.candidates?.[0]?.content?.parts || []
  return parts.map((p: any) => p.text || '').join('').trim()
}

export async function callAI(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000
): Promise<string> {
  const providers = getStaticProviders()

  const vertexProvider = await getVertexProvider()
  if (vertexProvider) {
    providers.push(vertexProvider)
  }

  if (providers.length === 0) {
    throw new Error('No AI providers configured. Please set at least one API key in environment variables.')
  }

  for (const provider of providers) {
    try {
      const client = new OpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      })

      const response = await client.chat.completions.create({
        model: provider.model,
        messages,
        max_tokens: maxTokens,
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        console.log(`[AI] Used provider: ${provider.name}`)
        return content
      }
    } catch (error: any) {
      const isQuotaError =
        error?.status === 429 ||
        error?.status === 503 ||
        error?.message?.includes('quota') ||
        error?.message?.includes('rate limit') ||
        error?.message?.includes('capacity') ||
        error?.message?.includes('overloaded')

      if (isQuotaError) {
        console.warn(`[AI] ${provider.name} quota/rate limit hit, trying next provider...`)
        continue
      }

      console.warn(`[AI] ${provider.name} error: ${error?.message}, trying next...`)
      continue
    }
  }

  throw new Error('All AI providers exhausted. Please try again later.')
}

// Same as callAI, but also returns which provider actually answered - used where
// we want to track/tag output quality across a long automated run (e.g. bulk
// long-answer generation), since the fallback chain can switch models mid-run.
// Simplified to a single provider (Gemini 3.8 Flash native) rather than a multi-provider
// fallback chain (Groq, Cerebras, Mistral, OpenRouter, Vertex-OpenAI-shim) - the fallback
// chain added resilience but also inconsistency (which provider actually served a given
// request was often unclear, and different providers gave meaningfully different output
// quality for the same prompt). Every existing caller keeps working unchanged, since the
// signature and return shape ({content, provider}) are the same - this just delegates.
export async function callAIWithProvider(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  maxTokens: number = 2000,
  forceVertex: boolean = false
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens)
}

// Calls Vertex AI only, with no fallback to other providers. Used for bulk generation
// runs where consistent output quality matters more than resilience via fallback - a
// silent slide to a weaker free-tier model mid-run is worse than a clear retry/backoff
// on the same model.
export async function callVertexOnly(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000
): Promise<string> {
  const provider = await getVertexProvider()
  if (!provider) {
    throw new Error('Vertex AI is not configured (check GOOGLE_CLOUD_PROJECT_ID and GOOGLE_SERVICE_ACCOUNT_KEY).')
  }

  const client = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL })
  const response = await client.chat.completions.create({
    model: provider.model,
    messages,
    max_tokens: maxTokens,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Vertex AI returned an empty response.')
  }
  return content
}

// Calls the Anthropic API directly - it is NOT OpenAI-chat-completions compatible
// (different endpoint, system prompts are a separate top-level field rather than a
// message role, and responses come back as a content-block array), so it can't reuse
// the OpenAI-client pattern the other providers share. No fallback: used deliberately
// for the one step (chapter knowledge extraction) where accurate interpretation matters
// more than provider resilience.
// Writes the service account JSON to a temp file once per process lifetime, so
// AnthropicVertex's own internal (bundled) GoogleAuth instance can find it via the
// standard GOOGLE_APPLICATION_CREDENTIALS file-based lookup. We deliberately do NOT
// construct our own GoogleAuth object and pass it in - @anthropic-ai/vertex-sdk bundles
// its own nested copy of google-auth-library, and TypeScript rejects a GoogleAuth
// instance built from a separately-installed top-level copy as an incompatible type
// (identical shape, but nominally different due to private class fields). Letting the
// SDK build its own default auth internally sidesteps this entirely.
let vertexCredentialsFilePath: string | null = null;
async function ensureVertexCredentialsFile(rawKey: string): Promise<string> {
  if (vertexCredentialsFilePath) return vertexCredentialsFilePath;
  const fs = await import('fs');
  const os = await import('os');
  const path = await import('path');
  const filePath = path.join(os.tmpdir(), `vertex-claude-credentials-${Date.now()}.json`);
  fs.writeFileSync(filePath, rawKey, 'utf8');
  vertexCredentialsFilePath = filePath;
  return filePath;
}

// Simplified to delegate to Gemini 3.8 native, same reasoning as callAIWithProvider
// above - one consistent model handling everything, rather than a second alternate
// provider (this path was also never reliably working, due to a persistent Claude-via-
// Vertex quota-grant issue). Signature/return shape unchanged, so existing callers
// that pass useClaude: true keep working, just served by Gemini now.
export async function callClaudeOnly(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000
): Promise<{ content: string; provider: string }> {
  return callGeminiNative(messages, maxTokens)
}

// Calls Gemini via Vertex AI, authenticated with a service account JSON key
// (GOOGLE_SERVICE_ACCOUNT_KEY, exchanged for a short-lived OAuth token) rather than a
// plain Gemini Developer API key. This draws on Google Cloud Vertex AI billing/credits
// instead of the separate Gemini Developer API "Prepay" balance, and lets gemini-2.5-pro
// keep working past the Developer API's "not available to new users" restriction on
// generateContent. Requires GOOGLE_CLOUD_PROJECT_ID and GOOGLE_SERVICE_ACCOUNT_KEY.
//
// Google's model lineup churns fast and different accounts/tiers get access to
// different models (a fresh account has 404'd on both gemini-2.5-pro and a pinned
// preview model in the past) - and gemini-2.5-pro itself is being shut down entirely
// on Oct 16 2026. Rather than hardcode one model name that keeps breaking, this tries
// an explicit override first (if GEMINI_NATIVE_MODEL is set), then gemini-2.5-pro, then
// progressively lighter fallbacks. Only a 403/404 (model not found / not accessible to
// this account) advances to the next candidate - any other error (rate limit, bad
// request, server error) surfaces immediately instead of being masked by silently
// cycling through models.
const GEMINI_MODEL_FALLBACK_CHAIN = ['gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash']

function geminiModelCandidates(): string[] {
  const override = process.env.GEMINI_NATIVE_MODEL?.trim()
  return override ? [override, ...GEMINI_MODEL_FALLBACK_CHAIN] : GEMINI_MODEL_FALLBACK_CHAIN
}

async function callGeminiNativeWithFallback(body: any): Promise<{ content: string; provider: string }> {
  const candidates = geminiModelCandidates()
  let lastError = ''

  for (const model of candidates) {
    try {
      const data = await vertexGenerateContent(model, body.contents, body.generationConfig)
      const content = (data.candidates?.[0]?.content?.parts || [])
        .map((p: any) => p.text || '')
        .join('')
      if (content) return { content, provider: `Gemini (native, Vertex, ${model})` }
      lastError = `Gemini (native, Vertex, ${model}) returned an empty response.`
      continue // empty response is also worth trying the next candidate for
    } catch (err: any) {
      const message = err?.message || String(err)
      lastError = message
      // 403/404 means this account/key can't use this specific model - try the next one.
      // Any other status (429 rate limit, 400 bad request, 5xx) won't be fixed by
      // switching models, so stop and surface the real error instead of masking it.
      const statusMatch = message.match(/failed \((\d+)\)/)
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 0
      if (status !== 403 && status !== 404) {
        throw new Error(lastError)
      }
    }
  }

  throw new Error(`All Gemini model candidates failed. Last error: ${lastError}`)
}

export async function callGeminiNative(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000,
  thinkingBudget?: number
): Promise<{ content: string; provider: string }> {
  // Gemini's native API uses "model" (not "assistant") for the assistant role, and
  // system prompts go in a separate top-level field, not the contents array.
  const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content)
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

  // 2.5-series models spend part of maxOutputTokens on internal "thinking" before
  // writing the visible answer - for calls where the visible text budget is tight
  // (e.g. a short structured JSON response), that can silently truncate the actual
  // output. Passing thinkingBudget caps or disables that (0 = disabled) so the full
  // token budget goes to the real answer.
  const generationConfig: any = { maxOutputTokens: maxTokens }
  if (thinkingBudget !== undefined) {
    generationConfig.thinkingConfig = { thinkingBudget }
  }

  return callGeminiNativeWithFallback({
    contents,
    ...(systemParts.length ? { systemInstruction: { parts: [{ text: systemParts.join('\n\n') }] } } : {}),
    generationConfig,
  })
}

// Same Vertex auth as callGeminiNative, but accepts one or more files (base64-encoded,
// sent as inlineData parts - images or a single-page PDF) alongside the text prompt.
// Gemini reads the file's actual content directly rather than needing a separate
// OCR/rasterization step.
export async function callGeminiNativeMultimodal(
  prompt: string,
  imagesBase64: string[],
  maxTokens: number = 2000,
  mimeType: string = 'image/jpeg'
): Promise<{ content: string; provider: string }> {
  const imageParts = imagesBase64.map((data) => ({ inlineData: { mimeType, data } }))
  const contents = [{ role: 'user', parts: [...imageParts, { text: prompt }] }]

  const { content, provider } = await callGeminiNativeWithFallback({
    contents,
    generationConfig: { maxOutputTokens: maxTokens },
  })
  return { content, provider: `${provider}, vision` }
}

export function getGroqClient() {
  return {
    chat: {
      completions: {
        create: async (params: any) => {
          const content = await callAI(params.messages, params.max_tokens)
          return {
            choices: [{ message: { content } }]
          }
        }
      }
    }
  }
}
