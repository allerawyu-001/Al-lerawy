import { createServerFn } from "@tanstack/react-start";
import { adminAuth, adminDb, adminStorage } from "@/integrations/firebase/firebase-admin.server";
import { z } from "zod";

const usernameSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username must contain only letters, numbers, underscores, or hyphens"),
});

export const checkUsername = createServerFn({ method: "GET" })
  .inputValidator(usernameSchema)
  .handler(async (ctx) => {
    const { username } = ctx.data;

    try {
      const snapshot = await adminDb.collection('users')
        .where('username', '==', username)
        .limit(1)
        .get();

      return { available: snapshot.empty };
    } catch (err: any) {
      console.error("[checkUsername] Exception:", err);
      // Fail-safe to true so we don't permanently block, allow registration to try and catch
      return { available: true, error: err?.message || "Validation error" };
    }
  });

// Profile initialization has been migrated to client-side SDK directly in signup.tsx to avoid Admin API dependence.

export const resolveIdentifier = createServerFn({ method: "POST" })
  .inputValidator(z.object({ identifier: z.string() }))
  .handler(async ({ data }) => {
    const { identifier } = data;
    const isEmail = identifier.includes("@");
    if (isEmail) return { email: identifier };

    // Search by username or phone
    const snapshot = await adminDb.collection("users").where("username", "==", identifier).limit(1).get();
    
    if (snapshot.empty) {
      const phoneSnapshot = await adminDb.collection("users").where("phoneNumber", "==", identifier).limit(1).get();
      if (phoneSnapshot.empty) {
         throw new Error("Account not found");
      }
      return { email: phoneSnapshot.docs[0].data().email, userId: phoneSnapshot.docs[0].id };
    }

    return { email: snapshot.docs[0].data().email, userId: snapshot.docs[0].id };
  });

// Legacy OTP functions removed as Firebase Auth natively handles email/phone verification and password resets

export const verifyOtp = createServerFn({ method: "POST" }).handler(async () => {
  throw new Error("OTP verification is not supported in the Firebase implementation.");
});

export const resendOtp = createServerFn({ method: "POST" }).handler(async () => {
  throw new Error("OTP resend is not supported in the Firebase implementation.");
});

export const forgotPassword = createServerFn({ method: "POST" }).handler(async () => {
  throw new Error("Password reset is now handled directly by Firebase Auth client.");
});
