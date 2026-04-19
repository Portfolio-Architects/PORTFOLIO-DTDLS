import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 && firebaseConfig.apiKey
  ? initializeApp(firebaseConfig) 
  : (getApps().length > 0 ? getApps()[0] : null);

export const db = (app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null) as unknown as ReturnType<typeof initializeFirestore>;

// Enable offline persistence (Background Sync & Offline queue)
if (db && typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('[Firestore] Multiple tabs open, persistence can only be enabled in one tab at a a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('[Firestore] The current browser does not support all of the features required to enable persistence');
    }
  });
}

export const auth = (app ? getAuth(app) : null) as unknown as ReturnType<typeof getAuth>;
export const googleProvider = new GoogleAuthProvider();
export const storage = (app ? getStorage(app) : null) as unknown as ReturnType<typeof getStorage>;

