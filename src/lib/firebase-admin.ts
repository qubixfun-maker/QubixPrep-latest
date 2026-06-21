import * as admin from 'firebase-admin'

export function getAdminDb() {
  if (!admin.apps.length) {
    let rawKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').trim()

    // Strip wrapping quotes (handles cases where quotes got pasted in literally)
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
      rawKey = rawKey.slice(1, -1)
    }

    // Convert literal \n escape sequences into real newlines
    const privateKey = rawKey.replace(/\\n/g, '\n').trim()

    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
      throw new Error(
        `Firebase Admin credentials missing. projectId=${!!process.env.FIREBASE_ADMIN_PROJECT_ID}, clientEmail=${!!process.env.FIREBASE_ADMIN_CLIENT_EMAIL}, privateKey=${!!privateKey}`
      )
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    })
  }
  return admin.firestore()
}
