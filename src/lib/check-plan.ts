async function getAccessToken(): Promise<string> {
  const { SignJWT, importPKCS8 } = await import('jose')

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set')
  }
  const sa = JSON.parse(serviceAccountJson)

  const now = Math.floor(Date.now() / 1000)
  const privateKey = await importPKCS8(sa.private_key, 'RS256')

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/datastore',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .sign(privateKey)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const data = await res.json()
  if (!data.access_token) {
    throw new Error('Failed to get access token: ' + JSON.stringify(data))
  }
  return data.access_token
}

export async function requireProPlan(userId: string | undefined): Promise<void> {
  if (!userId) {
    throw new Error('Authentication required. Please sign in.')
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error('Server configuration error.')
  }
  const sa = JSON.parse(serviceAccountJson)
  const accessToken = await getAccessToken()

  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/users/${userId}`

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error('Could not verify your subscription. Please try again.')
  }

  const doc = await res.json()
  const fields = doc.fields || {}
  const plan = fields.plan?.stringValue || 'free'
  const role = fields.role?.stringValue

  if (role === 'admin') return
  if (plan !== 'pro') {
    throw new Error('This feature requires the Clinician plan. Please upgrade to continue.')
  }
}
