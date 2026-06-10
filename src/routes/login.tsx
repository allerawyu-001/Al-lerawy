import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, User, Lock } from "lucide-react";
import { dashboardMap } from "@/integrations/firebase/client";
import { deleteUser } from "firebase/auth";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";


import { useServerFn } from "@tanstack/react-start";
import { resolveIdentifier } from "@/lib/auth.functions";

type AppRole = "customer" | "producer" | "admin" | "super_admin";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "Sign In — AL-LERAWY" }] }),
});

function Login() {
  const navigate = useNavigate();
  const resolveFn = useServerFn(resolveIdentifier);
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setBusy(true);
    try {
      // 1. Resolve identifier to email if it's potentially a username or phone
      // Since Firebase Auth requires email natively, we'll see if they typed an email
      let emailToUse = identifier;
      
      if (!identifier.includes("@")) {
         // Resolve non-email identifiers via server function
         const resolved = await resolveFn({ data: { identifier } });
         emailToUse = resolved.email || identifier;
      }

      // 2. Sign in with Firebase Auth
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const { auth, db } = await import("@/integrations/firebase/client");
      
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const user = userCredential.user;

      // 3. Fetch profile from Firestore
      const { doc, getDoc, setDoc } = await import("firebase/firestore");
      const profileDoc = await getDoc(doc(db, "users", user.uid));
      
      if (profileDoc.exists()) {
        const profile = profileDoc.data();
        
        // We use Firebase Auth's native email verification conceptually, but checking status works
        if (profile.status === 'pending') {
          toast.error("Your account is awaiting administrator approval.");
          await auth.signOut();
          setBusy(false);
          return;
        }
        if (profile.status === 'rejected') {
          toast.error("Your account has been rejected.");
          await auth.signOut();
          setBusy(false);
          return;
        }
        if (profile.status === 'suspended') {
          toast.error("Your account has been suspended.");
          await auth.signOut();
          setBusy(false);
          return;
        }

        const role = ((profile?.role as string) || "customer").toLowerCase() as AppRole;
        console.log("[Login] uid:", user.uid, "profile.role:", profile?.role, "resolved role:", role);

        const destination = dashboardMap[role];
        if (!destination) {
          toast.error("User role not recognized. Please contact support.");
          setBusy(false);
          return;
        }
        console.log("[Login] redirecting to:", destination);
        toast.success("Welcome back!");
        navigate({ to: destination as any });
      } else {
        console.warn(`[Login] Profile not found for UID: ${user.uid}. Running repair...`);
        const fallbackPayload = {
           uid: user.uid,
           email: user.email || null,
           firstName: user.displayName?.split(' ')[0] || null,
           secondName: user.displayName?.split(' ')?.slice(1)?.join(' ') || null,
           role: "customer",
           status: "active",
           profilePicture: user.photoURL || null,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
        };
        try {
          await setDoc(doc(db, "users", user.uid), fallbackPayload);
          toast.info("Your profile was automatically repaired.");
          navigate({ to: "/customer/dashboard" });
        } catch (err: any) {
          await deleteUser(user);
          throw new Error("Profile repair failed, account access revoked.");
        }
      }
    } catch (err: any) {
      console.error("[Login] Exception:", err);
      toast.error(err.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-gold/3 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto flex max-w-[440px] flex-col px-6 py-16 md:py-24 relative z-10">
        <div className="text-center mb-10">
          <Link to="/" className="inline-block mb-8">
            <span className="font-display text-2xl tracking-tighter text-gold">AL-LERAWY</span>
          </Link>
          <h1 className="font-display text-4xl mb-4 tracking-tight">Welcome back.</h1>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-gold font-bold hover:underline transition-all">Sign Up</Link>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-border/50 bg-secondary/20 p-10 shadow-2xl backdrop-blur-xl transition-all">
          <Field label="Identity">
            <div className="relative group">
              <input
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-3.5 pl-11 outline-none group-focus-within:border-gold transition-all"
                placeholder="Email, Username or Phone"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors">
                <User className="h-4 w-4" />
              </div>
            </div>
          </Field>

          <Field label="Password">
            <div className="relative group">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-3.5 pl-11 outline-none group-focus-within:border-gold transition-all"
                placeholder="••••••••"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-gold transition-colors">
                <Lock className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-gold transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-bold text-background transition-all hover:bg-gold hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
