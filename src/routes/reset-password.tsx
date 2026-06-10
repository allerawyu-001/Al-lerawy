import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { auth } from "@/integrations/firebase/client";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      oobCode: (search.oobCode as string) || "",
      // Firebase may also pass these — capture but ignore for now
      mode: (search.mode as string) || "",
    };
  },
  head: () => ({ meta: [{ title: "Reset Password — AL-LERAWY" }] }),
});

function ResetPassword() {
  const { oobCode } = Route.useSearch();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [codeValid, setCodeValid] = useState(false);
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  // Verify the oobCode is valid before showing the form
  useEffect(() => {
    if (!oobCode) {
      setVerifying(false);
      setCodeValid(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setCodeValid(true);
      })
      .catch(() => {
        setCodeValid(false);
      })
      .finally(() => setVerifying(false));
  }, [oobCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setBusy(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      toast.success("Password updated successfully!");
    } catch (err: any) {
      if (err?.code === "auth/expired-action-code") {
        toast.error("This reset link has expired. Please request a new one.");
      } else if (err?.code === "auth/invalid-action-code") {
        toast.error("Invalid reset link. Please request a new one.");
      } else {
        toast.error(err instanceof Error ? err.message : "Reset failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-gold" />
          <p className="mt-4 text-muted-foreground">Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  if (!codeValid) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col px-6 py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="mt-8 font-display text-4xl">Invalid Link.</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-12 py-4 text-sm font-bold text-background transition-all hover:bg-gold"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col px-6 py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="mt-8 font-display text-4xl">Success!</h1>
          <p className="mt-4 text-muted-foreground">
            Your password has been reset. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-12 py-4 text-sm font-bold text-background transition-all hover:bg-gold"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="text-center">
          <h1 className="font-display text-4xl">Set new password.</h1>
          {email && (
            <p className="mt-2 text-xs text-muted-foreground">
              Resetting password for <span className="font-semibold text-foreground">{email}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Please choose a strong password that you haven't used before.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 space-y-6 rounded-2xl border border-border bg-secondary/20 p-8 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-3.5 pr-11 outline-none focus:border-gold transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
            <input
              type={showPw ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-3.5 outline-none focus:border-gold transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={busy || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-bold text-background transition-all hover:bg-gold disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
