import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const dashboardMap: Record<string, string> = {
  customer: "/customer/dashboard",
  producer: "/producer/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
};

export const validateConfig = () => {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];
  requiredKeys.forEach((key) => {
    if (!firebaseConfig[key as keyof typeof firebaseConfig]) {
      throw new Error(`Missing Firebase config key: ${key}`);
    }
  });
};


// Detect placeholder values in development to provide clearer error messages
let isConfigValid = true;
if (import.meta.env.DEV) {
  const placeholderPattern = /your_firebase_/i;
  const placeholderKeys = Object.entries(firebaseConfig).filter(([key, value]) =>
    typeof value === 'string' && placeholderPattern.test(value as string)
  );
  if (placeholderKeys.length) {
    const keys = placeholderKeys.map(([k]) => k).join(', ');
    console.error(`Firebase config contains placeholder values for: ${keys}. Please replace them with real credentials in .env`);
    isConfigValid = false;
  }
}

// After placeholder checks, validate that all required keys are present
validateConfig();

// Initialize Firebase only if config is valid
export const app = isConfigValid ? (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)) : null;

// Export auth, db, etc. conditionally
export const auth = isConfigValid && app ? getAuth(app) : null;
export const googleProvider = isConfigValid && app ? new GoogleAuthProvider() : null;
export const db = isConfigValid && app ? getFirestore(app) : null;
