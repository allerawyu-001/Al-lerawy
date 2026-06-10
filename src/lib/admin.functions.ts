import { createServerFn } from "@tanstack/react-start";
import { adminAuth, adminDb } from "@/integrations/firebase/firebase-admin.server";
import { z } from "zod";

// Activity Logger helper
async function logActivity(userId: string, action: string, details: string, targetUserId?: string) {
  await adminDb.collection("activities").add({
    user_id: userId,
    target_user_id: targetUserId || null,
    action,
    details,
    created_at: new Date().toISOString(),
  });
}

// Notification helper
async function createNotification(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string) {
  await adminDb.collection("notifications").add({
    user_id: userId,
    title,
    message,
    type,
    link: link || null,
    read: false,
    created_at: new Date().toISOString(),
  });
}

export const updateUserStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    userId: z.string(),
    adminId: z.string(),
    status: z.enum(['approved', 'rejected', 'suspended']),
    reason: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const { userId, adminId, status, reason } = data;

    const updates: Record<string, any> = { status, updatedAt: new Date().toISOString() };
    if (status === 'approved') {
      updates.approvedBy = adminId;
      updates.approvedAt = new Date().toISOString();
    } else if (status === 'rejected') {
      updates.rejectedAt = new Date().toISOString();
    } else if (status === 'suspended') {
      updates.suspendedAt = new Date().toISOString();
    }

    await adminDb.collection("users").doc(userId).update(updates);

    // Log Activity
    await logActivity(adminId, `Account ${status}`, `Admin ${adminId} ${status} account for user ${userId}${reason ? `: ${reason}` : ''}`, userId);

    // Notify User
    await createNotification(
      userId,
      `Account ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      status === 'approved'
        ? "Your account has been approved. You can now log in."
        : `Your account has been ${status}.${reason ? ` Reason: ${reason}` : ''}`,
      status === 'approved' ? 'success' : 'warning'
    );

    return { success: true };
  });

export const deleteUserAccount = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    userId: z.string(),
    adminId: z.string()
  }))
  .handler(async ({ data }) => {
    const { userId, adminId } = data;

    // Delete the profile document from Firestore
    await adminDb.collection("users").doc(userId).delete();

    // Delete from Firebase Auth
    await adminAuth.deleteUser(userId);

    await logActivity(adminId, 'Account Deleted', `Admin ${adminId} permanently deleted account ${userId}`, userId);

    return { success: true };
  });
