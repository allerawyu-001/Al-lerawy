import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/AdminLayout";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const user = auth.currentUser;
    if (!user) {
      throw redirect({ to: "/login" });
    }
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const role = profileSnap.exists() ? (profileSnap.data()?.role || "").toLowerCase() : "";
    
    console.log("[Admin Guard] uid:", user.uid, "role:", role);

    if (role !== "admin" && role !== "super_admin") {
      throw redirect({ to: "/customer/dashboard" });
    }
  },
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin — AL-LERAWY.com" }] }),
});
