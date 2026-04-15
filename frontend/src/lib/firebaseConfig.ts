import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
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

// 보안: 브라우저 환경이고 ReCAPTCHA 키가 유효할 경우에만 App Check (Domain Lockdown) 주입
if (app && typeof window !== 'undefined') {
  /* 
   * [TEMPORARY BYPASS] 
   * ReCAPTCHA Enterprise (App Check) 가 지속적으로 400 Bad Request를 반환하여 
   * Firebase Auth 및 Firestore 통신을 차단하는 현상이 있어 임시 비활성화합니다.
   * Google Cloud Console의 키 유형 및 Firebase 콘솔 연동이 완벽히 끝난 후 주석을 해제하세요.
   */
  // const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  // if (recaptchaKey && recaptchaKey.length > 10) {
  //   try {
  //     initializeAppCheck(app, {
  //       provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
  //       isTokenAutoRefreshEnabled: true
  //     });
  //     console.log('[Security] Firebase App Check initialized.');
  //   } catch (err) {
  //     console.warn('[Security] App Check init failed:', err);
  //   }
  // }
}

export const db = app ? initializeFirestore(app, { ignoreUndefinedProperties: true }) : null as any;
export const auth = app ? getAuth(app) : null as any;
export const googleProvider = new GoogleAuthProvider();
export const storage = app ? getStorage(app) : null as any;
