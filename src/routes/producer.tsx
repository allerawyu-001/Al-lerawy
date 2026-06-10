import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { auth, db } from "@/integrations/firebase/client";
import { doc, getDoc } from "firebase/firestore";

export const Route = createFileRoute("/producer")({
  beforeLoad: async () => {
    const user = auth.currentUser;
    if (!user) {
      throw redirect({ to: "/login" });
    }
    
    try {
      const profileSnap = await getDoc(doc(db, "users", user.uid));
      const role = profileSnap.exists() ? (profileSnap.data()?.role || "").toLowerCase() : "customer";
      
      console.log("[Producer Guard] uid:", user.uid, "role:", role);

      if (role !== "producer") {
        if (role === "admin") {
          throw redirect({ to: "/admin" });
        }
        throw redirect({ to: "/customer/dashboard" });
      }
    } catch (error: any) {
      // Re-throw redirect errors — they are intentional role-based redirects
      if (error?.isRedirect || error?.to) throw error;
      // Genuine Firestore errors → fall back to customer dashboard
      console.error("[Producer Guard] Error:", error);
      throw redirect({ to: "/customer/dashboard" });
    }
  },
  component: () => <Outlet />,
});
