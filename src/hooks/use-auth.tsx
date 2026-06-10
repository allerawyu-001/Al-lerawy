import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { type User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";

export type AppRole = "customer" | "producer" | "admin" | "super_admin";

export type Profile = {
  uid: string;
  firstName: string | null;
  secondName: string | null;
  username: string | null;
  phoneNumber: string | null;
  profilePicture: string | null;
  bio: string | null;
  role: AppRole;
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<AuthState>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback refresh for manual pings if necessary
  const refresh = async () => {
    if (!db) {
      console.error('[useAuth] Firestore db is null – cannot refresh profile');
      return;
    }
    if (user) {
      const snap = await getDoc(doc(db as any, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data() as Profile;
        data.uid = user.uid;
        setProfile(data);
        setRoles([ (data.role || "customer").toLowerCase() as AppRole ]);
      }
    }
  };

  useEffect(() => {
    let profileUnsub: () => void;

    // Guard against missing Firebase auth (e.g., config placeholders)
    if (!auth) {
      console.error('[useAuth] Firebase auth is null – check .env configuration');
      setLoading(false);
      return;
    }
    const authUnsub = onAuthStateChanged(auth!, (u) => {
      setUser(u);
      if (u) {
        // Guard against missing Firestore db
        if (!db) {
          console.error('[useAuth] Firestore db is null – cannot load profile');
          setLoading(false);
          return;
        }
        profileUnsub = onSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Profile;
            data.uid = u.uid;
            setProfile(data);
            setRoles([ (data.role || "customer").toLowerCase() as AppRole ]);
          } else {
            setProfile(null);
            setRoles([]);
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile snapshot error", err);
          setLoading(false);
        });
      } else {
        if (profileUnsub) profileUnsub();
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });
    
    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  return (
    <AuthCtx.Provider value={{ user, profile, roles, loading, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

export function homeForRoles(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("producer")) return "/producer/dashboard";
  return "/customer/dashboard";
}
