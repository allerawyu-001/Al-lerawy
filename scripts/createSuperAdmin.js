// scripts/createSuperAdmin.js
// This script creates a permanent Super Admin account in Firebase Auth and Firestore.
// It is safe to run multiple times – it will not create duplicate accounts.

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import path from 'path';
import { readFileSync } from 'fs';

// Load service account credentials from env variable or default location
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore(app);
const auth = getAuth(app);


// Configuration – replace with desired Super Admin email
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'Aliyuumarallerawy@gmail.com';

async function main() {
  try {
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
      console.log(`[Info] User already exists with UID: ${userRecord.uid}`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        // Create user with a random temporary password
        const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
        userRecord = await auth.createUser({
          email: SUPER_ADMIN_EMAIL,
          emailVerified: true,
          password: tempPassword,
        });
        console.log(`[Success] Created Firebase Auth user. UID: ${userRecord.uid}`);
        console.log(`[Info] Temporary password: ${tempPassword}`);
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;
    const userRef = db.collection('users').doc(uid);
    const snapshot = await userRef.get();
    if (!snapshot.exists) {
      // Create Firestore profile document
      await userRef.set({
        uid,
        email: SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        isProtected: true,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: uid,
      });
      console.log('[Success] Firestore profile created for Super Admin.');
    } else {
      // Update existing document to ensure correct fields
      await userRef.update({
        role: 'super_admin',
        isProtected: true,
        status: 'active',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('[Info] Firestore profile already existed – fields updated.');
    }
    console.log('✅ Super Admin setup complete.');
  } catch (err) {
    console.error('❌ Error during Super Admin creation:', err);
    process.exit(1);
  }
}

main();
