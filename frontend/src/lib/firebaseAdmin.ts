import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin safely in Next.js to avoid multiple initializations
if (!admin.apps.length) {
  let credential;
  
  try {
    // 1. Try to load from a local file first (for easy local development)
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf-8');
    const serviceAccount = JSON.parse(serviceAccountRaw);
    
    credential = admin.credential.cert(serviceAccount);
  } catch (error) {
    // 2. Fallback to an environment variable (for production/Vercel)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
      } catch (parseError) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON.');
      }
    } else {
      console.warn('⚠️ Firebase Admin credential not found. Admin features calling this module will fail.');
      console.warn('Place serviceAccountKey.json in the project root or set FIREBASE_SERVICE_ACCOUNT_KEY env var.');
    }
  }

  if (credential) {
    admin.initializeApp({
      credential: credential,
    });
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
