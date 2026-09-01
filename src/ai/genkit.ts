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
      model: 'gemini-2.0-flash',
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
export async function callAIWithProvider(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  maxTokens: number = 2000
): Promise<{ content: string; provider: string }> {
  const providers = getStaticProviders()
  const vertexProvider = await getVertexProvider()
  if (vertexProvider) providers.push(vertexProvider)

  if (providers.length === 0) {
    throw new Error("No AI providers configured. Please set at least one API key in environment variables.")
  }

  for (const provider of providers) {
    try {
      const client = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseURL })
      const response = await client.chat.completions.create({
        model: provider.model,
        messages,
        max_tokens: maxTokens,
      })
      const content = response.choices[0]?.message?.content
      if (content) {
        return { content, provider: provider.name }
      }
    } catch (error: any) {
      continue
    }
  }
  throw new Error("All AI providers exhausted. Please try again later.")
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
