import { createServerFn } from "@tanstack/react-start";
import { adminAuth, adminDb } from "@/integrations/firebase/firebase-admin.server";

const DEFAULT_ADMIN_EMAIL = "aliyuumarallerawy@gmail.com";

/**
 * Idempotently ensures the default admin profile exists in Firestore.
 * Safe to call repeatedly — does nothing if the admin is already present.
 */
export const ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    // Check if any Admin already exists in Firestore
    const snapshot = await adminDb
      .collection("users")
      .where("role", "==", "admin")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return { created: false, email: DEFAULT_ADMIN_EMAIL };
    }

    // Try to find the admin user in Firebase Auth by email
    try {
      const user = await adminAuth.getUserByEmail(DEFAULT_ADMIN_EMAIL);
      // Set admin role in Firestore profile if it exists
      await adminDb.collection("users").doc(user.uid).set({
        uid: user.uid,
        email: DEFAULT_ADMIN_EMAIL,
        role: "admin",
        status: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return { created: false, email: DEFAULT_ADMIN_EMAIL, userId: user.uid };
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        // Admin user doesn't exist yet in Firebase Auth — nothing to bootstrap
        return { created: false, email: DEFAULT_ADMIN_EMAIL, message: "Admin user must register first" };
      }
      throw err;
    }
  },
);
