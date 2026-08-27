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
  const model = process.env.GOOGLE_VERTEX_MODEL || 'google/gemini-2.0-flash-001'

  return {
    name: 'Vertex AI',
    baseURL: `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/openapi`,
    apiKey: token,
    model,
  }
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
