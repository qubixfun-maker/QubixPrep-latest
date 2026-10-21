export const dynamic = "force-dynamic"
export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/firebase-admin'

type Story = { id: string; title: string; summary: string; image: string | null; source: string; url: string; date: number; tag: string }

// Public medical news feeds. A feed that is down or blocked is simply skipped.
const FEEDS = [
  { name: 'News-Medical', url: 'https://www.news-medical.net/syndication.axd?format=rss' },
  { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/health_medicine.xml' },
  { name: 'WHO', url: 'https://www.who.int/rss-feeds/news-english.xml' },
  { name: 'Medical News Today', url: 'https://www.medicalnewstoday.com/newsfeeds/medical_news_today.xml' },
  { name: 'The Hindu Health', url: 'https://www.thehindu.com/sci-tech/health/feeder/default.rss' },
  { name: 'BMJ', url: 'https://www.bmj.com/rss/recent.xml' },
]
const UA = 'Mozilla/5.0 (compatible; QubixPrepBot/1.0; +https://qubixprep.com)'
const TTL = 20 * 60 * 1000
const PER_SOURCE = 12
const MAX_STORIES = 40

const TAGS: [RegExp, string][] = [
  [/cancer|tumou?r|oncolog|leuk[a]?emia|lymphoma|chemotherapy/i, 'Oncology'],
  [/heart|cardi|stroke|blood pressure|hypertension|cholesterol|statin/i, 'Cardiology'],
  [/brain|alzheimer|dementia|neuro|parkinson|epilep|migraine/i, 'Neurology'],
  [/diabet|insulin|obes|metabol|thyroid|weight loss/i, 'Endocrine'],
  [/infect|virus|viral|bacteri|vaccin|covid|malaria|tubercul|dengue|antibiotic|outbreak|sepsis/i, 'Infectious disease'],
  [/kidney|renal|dialysis/i, 'Nephrology'],
  [/lung|asthma|copd|respirat|pneumonia/i, 'Pulmonology'],
  [/pregnan|birth|fertil|maternal|menopaus|ovarian|uterine/i, 'Obs & Gyn'],
  [/child|infant|paediat|pediat|newborn|baby/i, 'Paediatrics'],
  [/depress|anxiety|mental|psychiat|schizo|autism|adhd/i, 'Psychiatry'],
  [/skin|derm|psoriasis|eczema|acne/i, 'Dermatology'],
  [/eye|vision|retina|glaucoma|cataract/i, 'Ophthalmology'],
  [/bone|fracture|arthritis|osteo|joint|spine/i, 'Orthopaedics'],
  [/liver|hepat|gut|bowel|colon|stomach|gastro|crohn/i, 'Gastro'],
  [/drug|trial|therapy|treatment|approval|dose/i, 'Clinical trials'],
]
const tagFor = (t: string) => TAGS.find(([re]) => re.test(t))?.[1] || 'Medicine'

const dec = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;|&#160;/g, ' ').replace(/&#x?([0-9a-f]+);/gi, (m, n) => { try { return String.fromCodePoint(m.includes('x') ? parseInt(n, 16) : parseInt(n, 10)) } catch { return '' } }).replace(/&amp;/g, '&')
const strip = (h: string) => dec(dec(h).replace(/<[^>]+>/g, ' ')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
const inner = (block: string, name: string) => { const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i')); return m ? m[1] : '' }
const attr = (block: string, re: RegExp) => { const m = block.match(re); return m ? dec(m[1]) : null }

function shorten(s: string, max = 300) {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '))
  return (dot > 120 ? cut.slice(0, dot + 1) : cut.replace(/\s+\S*$/, '') + '…')
}

function parseFeed(xml: string, source: string): Story[] {
  const items = xml.split(/<item[\s>]|<entry[\s>]/i).slice(1)
  const out: Story[] = []
  for (const raw of items.slice(0, PER_SOURCE * 2)) {
    const title = strip(inner(raw, 'title'))
    let url = strip(inner(raw, 'link')) || attr(raw, /<link[^>]*href="([^"]+)"/i) || ''
    if (!title || !/^https?:\/\//.test(url)) continue
    const descRaw = inner(raw, 'description') || inner(raw, 'summary') || inner(raw, 'content:encoded')
    const summary = shorten(strip(descRaw))
    let image = attr(raw, /<media:content[^>]*url="([^"]+)"/i) || attr(raw, /<media:thumbnail[^>]*url="([^"]+)"/i)
      || attr(raw, /<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]+)"/i) || attr(raw, /<enclosure[^>]*url="([^"]+)"[^>]*type="image/i)
    if (!image) { const m = dec(descRaw + inner(raw, 'content:encoded')).match(/<img[^>]+src=["']([^"']+)["']/i); image = m ? m[1] : null }
    if (image && !/^https?:\/\//.test(image)) image = null
    const ds = (inner(raw, 'pubDate') || inner(raw, 'updated') || inner(raw, 'published') || inner(raw, 'dc:date')).trim()
    const d = Number.isFinite(Date.parse(ds)) ? Date.parse(ds) : Date.parse(ds.replace(/Z$/, ' GMT'))
    out.push({ id: Buffer.from(url).toString('base64url').slice(-24), title, summary, image, source, url, date: Number.isFinite(d) ? d : Date.now(), tag: tagFor(`${title} ${summary}`) })
    if (out.length >= PER_SOURCE) break
  }
  return out
}

async function getFeed(f: { name: string; url: string }): Promise<Story[]> {
  try {
    const res = await fetch(f.url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' }, signal: AbortSignal.timeout(7000), cache: 'no-store' })
    if (!res.ok) return []
    return parseFeed(await res.text(), f.name)
  } catch { return [] }
}

async function ogImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(3500), cache: 'no-store' })
    if (!res.ok) return null
    const html = (await res.text()).slice(0, 150000)
    const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i)
    const u = m ? dec(m[1]) : null
    return u && /^https?:\/\//.test(u) ? u : null
  } catch { return null }
}

let cache: { at: number; stories: Story[] } | null = null
let inflight: Promise<Story[]> | null = null

async function build(): Promise<Story[]> {
  const all = (await Promise.all(FEEDS.map(getFeed))).flat()
  const seen = new Set<string>()
  const uniq = all.filter((s) => { const k = s.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true })
  uniq.sort((a, b) => b.date - a.date)
  const top = uniq.slice(0, MAX_STORIES)
  const noImg = top.filter((s) => !s.image).slice(0, 24)
  for (let i = 0; i < noImg.length; i += 8) {
    await Promise.all(noImg.slice(i, i + 8).map(async (s) => { s.image = await ogImage(s.url) }))
  }
  return top
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    await verifyIdToken(idToken)
    if (!cache || Date.now() - cache.at > TTL) {
      inflight = inflight || build().finally(() => { inflight = null })
      const stories = await inflight
      if (stories.length || !cache) cache = { at: Date.now(), stories }
    }
    return NextResponse.json({ stories: cache!.stories, updated: cache!.at })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Could not load stories' }, { status: 500 })
  }
}
