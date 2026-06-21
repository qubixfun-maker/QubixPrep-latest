import * as admin from 'firebase-admin'

export function getAdminDb() {
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is not set')
    }

    let serviceAccount
    try {
      serviceAccount = JSON.parse(serviceAccountJson)
    } catch (e: any) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ' + e.message)
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  }
  return admin.firestore()
}
