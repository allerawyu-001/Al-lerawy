import admin from 'firebase-admin';

// Initialize Firebase Admin only if there are no existing apps to avoid errors on hot module reloading
if (!admin.apps || !admin.apps.length) {
  try {
    // If you have a base64 encoded service account json in your environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('ascii')
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
      });
    } else {
      // Fallback for default application credentials
      admin.initializeApp({
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
