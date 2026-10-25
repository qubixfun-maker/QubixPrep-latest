// Server-only. Lets an admin give a plan for free (influencers, partners). Never import this from a client component.
// It writes the plan through the server, because users are not allowed to change their own plan.

const DAY_MS = 24 * 60 * 60 * 1000

export type GrantPlan = 'basic' | 'pro'
export type FoundUser = { uid: string; email: string; name: string; role?: string; plan: string; planExpiresAt: number | null; planOrderId?: string }
export type GrantLog = {
  id: string; uid: string; email: string; name: string; plan: GrantPlan; days: number
  expiresAt: number; note: string; grantedBy: string; grantedAt: number; revoked: boolean; revokedAt?: number
}

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('Server configuration error.')
  return JSON.parse(raw)
}

let cached: { token: string; exp: number } | null = null
async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token
  const { SignJWT, importPKCS8 } = await import('jose')
  const sa = serviceAccount()
  const now = Math.floor(Date.now() / 1000)
  const key = await importPKCS8(sa.private_key, 'RS256')
  const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/datastore' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .sign(key)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Could not authorise with Firestore.')
  cached = { token: data.access_token, exp: Date.now() + 3300_000 }
  return data.access_token
}

const docsBase = () => `https://firestore.googleapis.com/v1/projects/${serviceAccount().project_id}/databases/(default)/documents`
const S = (v: string) => ({ stringValue: v })
const I = (v: number) => ({ integerValue: String(Math.round(v)) })
const num = (f: any) => (f?.integerValue ?? f?.doubleValue) !== undefined ? Number(f.integerValue ?? f.doubleValue) : 0

async function call(url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', ...(init.headers || {}) } })
  return res
}

async function runQuery(structuredQuery: any): Promise<any[]> {
  const res = await call(`${docsBase()}:runQuery`, { method: 'POST', body: JSON.stringify({ structuredQuery }) })
  if (!res.ok) throw new Error('Could not read from the database.')
  const rows: any[] = await res.json()
  return rows.filter((r) => r.document)
}

const userFrom = (doc: any): FoundUser => {
  const f = doc.fields || {}
  const exp = num(f.planExpiresAt)
  return {
    uid: String(doc.name).split('/').pop() as string,
    email: f.email?.stringValue || '',
    name: f.displayName?.stringValue || '',
    role: f.role?.stringValue,
    plan: f.plan?.stringValue || 'free',
    planExpiresAt: exp || null,
    planOrderId: f.planOrderId?.stringValue,
  }
}

/** Finds an account by email. Returns null when that person has not signed up yet. */
export async function findUserByEmail(email: string): Promise<FoundUser | null> {
  const clean = email.trim()
  const tries = Array.from(new Set([clean, clean.toLowerCase()]))
  for (const e of tries) {
    const rows = await runQuery({
      from: [{ collectionId: 'users' }],
      where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: S(e) } },
      limit: 1,
    })
    if (rows[0]) return userFrom(rows[0].document)
  }
  return null
}

async function readUser(uid: string): Promise<FoundUser | null> {
  const res = await call(`${docsBase()}/users/${encodeURIComponent(uid)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Could not read the account.')
  return userFrom(await res.json())
}

const isActive = (u: { plan: string; planExpiresAt: number | null }, now: number) => u.plan !== 'free' && (!u.planExpiresAt || u.planExpiresAt > now)

/** What the account should hold after the grant. Extends an active plan instead of cutting it short, and never lowers a plan. */
export function computeGrant(u: { plan: string; planExpiresAt: number | null }, plan: GrantPlan, days: number, now: number): { plan: GrantPlan; expiresAt: number } {
  const active = isActive(u, now)
  const base = active && u.planExpiresAt ? u.planExpiresAt : now
  const keepPro = active && u.plan === 'pro'
  return { plan: keepPro ? 'pro' : plan, expiresAt: base + days * DAY_MS }
}

async function patchUser(uid: string, fields: Record<string, any>, remove: string[] = []) {
  const mask = [...Object.keys(fields), ...remove].map((m) => 'updateMask.fieldPaths=' + encodeURIComponent(m)).join('&')
  const res = await call(`${docsBase()}/users/${encodeURIComponent(uid)}?${mask}`, { method: 'PATCH', body: JSON.stringify({ fields }) })
  if (!res.ok) throw new Error('Could not update the account.')
}

const logFrom = (doc: any): GrantLog => {
  const f = doc.fields || {}
  return {
    id: String(doc.name).split('/').pop() as string,
    uid: f.uid?.stringValue || '',
    email: f.email?.stringValue || '',
    name: f.name?.stringValue || '',
    plan: (f.plan?.stringValue as GrantPlan) || 'basic',
    days: num(f.days),
    expiresAt: num(f.expiresAt),
    note: f.note?.stringValue || '',
    grantedBy: f.grantedBy?.stringValue || '',
    grantedAt: num(f.grantedAt),
    revoked: !!f.revoked?.booleanValue,
    revokedAt: num(f.revokedAt) || undefined,
  }
}

export async function listGrants(): Promise<GrantLog[]> {
  const rows = await runQuery({ from: [{ collectionId: 'planGrants' }], orderBy: [{ field: { fieldPath: 'grantedAt' }, direction: 'DESCENDING' }], limit: 300 })
  return rows.map((r) => logFrom(r.document))
}

export type GrantResult = { email: string; ok: boolean; message: string }

/** Gives one person the plan. Admin accounts and people who have not signed up yet are reported, not changed. */
export async function grantFree(email: string, plan: GrantPlan, days: number, note: string, adminUid: string): Promise<GrantResult> {
  const user = await findUserByEmail(email)
  if (!user) return { email, ok: false, message: 'No account with this email yet. Ask them to sign up first, then grant again.' }
  if (user.role === 'admin') return { email, ok: false, message: 'This is an admin account - it already has full access.' }
  const now = Date.now()
  const g = computeGrant(user, plan, days, now)

  // The log is written first, because its id is stored on the account (so a revoke can tell this grant apart from a purchase).
  const logRes = await call(`${docsBase()}/planGrants`, {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        uid: S(user.uid), email: S(user.email || email), name: S(user.name), plan: S(g.plan), days: I(days), expiresAt: I(g.expiresAt),
        note: S(note), grantedBy: S(adminUid), grantedAt: I(now), revoked: { booleanValue: false },
      },
    }),
  })
  if (!logRes.ok) return { email, ok: false, message: 'Could not save the record. Nothing was changed.' }
  const id = String((await logRes.json()).name).split('/').pop() as string
  try {
    await patchUser(user.uid, {
      plan: S(g.plan), planExpiresAt: I(g.expiresAt), planOrderId: S('grant:' + id), planPaymentId: S('free-grant'), planUpdatedAt: I(now),
    })
  } catch (e) {
    await call(`${docsBase()}/planGrants/${id}`, { method: 'DELETE' }).catch(() => {})
    return { email, ok: false, message: 'Could not update the account. Nothing was changed.' }
  }
  const label = g.plan === 'pro' ? 'Clinician' : 'Scholar'
  return { email, ok: true, message: `${label} until ${new Date(g.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` }
}

/** Takes a free grant back. If the person has bought a plan since, their purchase is left alone. */
export async function revokeGrant(id: string): Promise<string> {
  const res = await call(`${docsBase()}/planGrants/${encodeURIComponent(id)}`)
  if (res.status === 404) throw new Error('That grant was not found.')
  if (!res.ok) throw new Error('Could not read the grant.')
  const log = logFrom(await res.json())
  if (log.revoked) throw new Error('This grant was already revoked.')
  const user = await readUser(log.uid)
  let message = 'Revoked.'
  if (user && user.planOrderId === 'grant:' + id) {
    await patchUser(log.uid, { plan: S('free'), planUpdatedAt: I(Date.now()), planOrderId: S('grant-revoked:' + id) }, ['planExpiresAt'])
    message = 'Revoked - the account is back on the free plan.'
  } else {
    message = 'Marked revoked. The account has a different plan now, so it was left unchanged.'
  }
  const mask = ['revoked', 'revokedAt'].map((m) => 'updateMask.fieldPaths=' + m).join('&')
  await call(`${docsBase()}/planGrants/${encodeURIComponent(id)}?${mask}`, { method: 'PATCH', body: JSON.stringify({ fields: { revoked: { booleanValue: true }, revokedAt: I(Date.now()) } }) })
  return message
}
