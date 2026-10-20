import { getVertexAccessToken, lastVertexTokenError } from '@/ai/genkit'

export type Tier = 'fast' | 'smart'
type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

const env = (k: string) => process.env[k]?.trim() || ''
const CHAIN: Record<Tier, string[]> = {
  fast: [env('OSCE_FAST_MODEL'), 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview'].filter(Boolean),
  smart: [env('OSCE_SMART_MODEL'), 'gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'].filter(Boolean),
}
// Remember which model worked, so later calls skip the ones that fail (no wasted round trips).
const working: Partial<Record<Tier, string>> = {}
const candidates = (t: Tier) => (working[t] ? [working[t]!, ...CHAIN[t].filter((m) => m !== working[t])] : CHAIN[t])

function bodyFor(messages: Msg[], maxTokens: number, thinking?: number, json?: boolean) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n')
  const contents = messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const generationConfig: any = { maxOutputTokens: maxTokens, temperature: 0.7 }
  if (thinking !== undefined) generationConfig.thinkingConfig = { thinkingBudget: thinking }
  if (json) generationConfig.responseMimeType = 'application/json'
  return { contents, ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}), generationConfig }
}

async function post(model: string, body: any, stream: boolean): Promise<Response> {
  const project = process.env.GOOGLE_CLOUD_PROJECT_ID
  if (!project) throw new Error('GOOGLE_CLOUD_PROJECT_ID not configured')
  const token = await getVertexAccessToken()
  if (!token) throw new Error(`Vertex token unavailable: ${lastVertexTokenError || ''}`)
  const loc = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
  const url = `https://${loc}-aiplatform.googleapis.com/v1/projects/${project}/locations/${loc}/publishers/google/models/${model}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`
  const send = (b: any) => fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
  let res = await send(body)
  if (res.status === 400 && body.generationConfig?.thinkingConfig) {
    // some models do not accept a thinking budget: retry once without it
    const { thinkingConfig, ...rest } = body.generationConfig
    res = await send({ ...body, generationConfig: rest })
  }
  return res
}

const textOf = (d: any) => (d?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('')

/** One-shot call. Tries the tier's models in order and remembers the one that works. */
export async function osceCall(messages: Msg[], maxTokens: number, thinking: number | undefined, tier: Tier, json = false): Promise<{ content: string; provider: string }> {
  let last = ''
  for (const model of candidates(tier)) {
    const res = await post(model, bodyFor(messages, maxTokens, thinking, json), false)
    if (res.ok) {
      const content = textOf(await res.json())
      if (content) { working[tier] = model; return { content, provider: model } }
      last = `${model}: empty`; continue
    }
    last = `${model}: ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`
    if ([403, 404, 429, 503].includes(res.status)) continue
    throw new Error(last)
  }
  throw new Error(`No AI model available. ${last}`)
}

/** Streaming call: yields text pieces as the model writes them. */
export async function* osceStream(messages: Msg[], maxTokens: number, thinking: number | undefined, tier: Tier): AsyncGenerator<string> {
  let last = ''
  for (const model of candidates(tier)) {
    const res = await post(model, bodyFor(messages, maxTokens, thinking), true)
    if (!res.ok || !res.body) {
      last = `${model}: ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`
      if ([403, 404, 429, 503].includes(res.status)) continue
      throw new Error(last)
    }
    working[tier] = model
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let i: number
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
        if (!line.startsWith('data:')) continue
        try { const t = textOf(JSON.parse(line.slice(5))); if (t) yield t } catch {}
      }
    }
    return
  }
  throw new Error(`No AI model available. ${last}`)
}

export function parseJson(raw: string): any | null {
  const c = raw.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  try { return JSON.parse(c) } catch {}
  const s = c.indexOf('{'); const e = c.lastIndexOf('}')
  if (s < 0 || e <= s) return null
  try { return JSON.parse(c.slice(s, e + 1)) } catch { return null }
}
