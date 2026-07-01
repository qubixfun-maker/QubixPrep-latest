import OpenAI from 'openai'

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

interface Provider {
  name: string
  baseURL: string
  apiKey: string
  model: string
}

function getProviders(): Provider[] {
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

export async function callAI(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  maxTokens: number = 2000
): Promise<string> {
  const providers = getProviders()

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
