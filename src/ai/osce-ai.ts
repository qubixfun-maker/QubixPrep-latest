import { getVertexAccessToken, lastVertexTokenError } from '@/ai/genkit'

export type Tier = 'fast' | 'smart'
type Msg = { role: 'user' | 'assistant' | 'system'; content: string }

// LUNA: OpenAI's gpt-6-luna is tried first for Jelly and the OSCE stations when OPENAI_API_KEY is set.
// Any problem (key missing, rate limit, error) quietly falls back to the Gemini models below.
// Set OPENAI_LLM=off in the environment to switch Luna off without a code change.
const LUNA = 'openai:luna'
const lunaModel = () => process.env.LUNA_MODEL?.trim() || 'gpt-6-luna'
const lunaOn = () => !!process.env.OPENAI_API_KEY && process.env.OPENAI_LLM !== 'off'
let lunaDownUntil = 0
const lunaUsable = () => lunaOn() && Date.now() > lunaDownUntil
const lunaHurt = (status: number) => { if (status === 401 || status === 403 || status === 429 || status >= 500) lunaDownUntil = Date.now() + 60_000 }
// thinking 0/undefined: no hidden thinking (cheap, fast chat). The smart tier thinks a little.
const effortOf = (thinking: number | undefined, tier: Tier) => (tier === 'smart' ? 'low' : thinking && thinking > 0 ? 'low' : 'none')

function lunaBody(messages: Msg[], maxTokens: number, thinking: number | undefined, tier: Tier, json: boolean, stream: boolean) {
  const effort = effortOf(thinking, tier)
  return {
    model: lunaModel(), messages, stream,
    reasoning_effort: effort,
    max_completion_tokens: maxTokens + (effort === 'none' ? 0 : 1500),
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }
}
const lunaFetch = (body: any) => fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

const env = (k: string) => process.env[k]?.trim() || ''
const CHAIN: Record<Tier, string[]> = {
  fast: [env('OSCE_FAST_MODEL'), 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview'].filter(Boolean),
  smart: [env('OSCE_SMART_MODEL'), 'gemini-3.1-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'].filter(Boolean),
}
// Remember which model worked, so later calls skip the ones that fail (no wasted round trips).
const working: Partial<Record<Tier, string>> = {}
const gemini = (t: Tier) => (working[t] ? [working[t]!, ...CHAIN[t].filter((m) => m !== working[t])] : CHAIN[t])
const candidates = (t: Tier) => (lunaUsable() ? [LUNA, ...gemini(t)] : gemini(t))

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
    if (model === LUNA) {
      try {
        const r = await lunaFetch(lunaBody(messages, maxTokens, thinking, tier, json, false))
        if (r.ok) {
          const content = String((await r.json())?.choices?.[0]?.message?.content || '')
          if (content.trim()) return { content, provider: lunaModel() }
          last = 'luna: empty'
        } else { lunaHurt(r.status); last = `luna: ${r.status}` }
      } catch (e: any) { lunaDownUntil = Date.now() + 30_000; last = `luna: ${e?.message || 'failed'}` }
      continue
    }
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
    if (model === LUNA) {
      let started = false
      try {
        const r = await lunaFetch(lunaBody(messages, maxTokens, thinking, tier, false, true))
        if (!r.ok || !r.body) { lunaHurt(r.status); last = `luna: ${r.status}`; continue }
        const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          let i: number
          while ((i = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
            if (!line.startsWith('data:') || line.includes('[DONE]')) continue
            try { const t = JSON.parse(line.slice(5))?.choices?.[0]?.delta?.content; if (t) { started = true; yield t } } catch {}
          }
        }
        if (started) return
        last = 'luna: empty'
      } catch (e: any) {
        if (started) return // already showed text to the student: finish quietly instead of repeating it
        lunaDownUntil = Date.now() + 30_000; last = `luna: ${e?.message || 'failed'}`
      }
      continue
    }
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
