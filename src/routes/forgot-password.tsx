import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowLeft, Mail, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { useServerFn } from "@tanstack/react-start";
import { resolveIdentifier } from "@/lib/auth.functions";
import { auth } from "@/integrations/firebase/client";
import { sendPasswordResetEmail } from "firebase/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({ meta: [{ title: "Forgot Password — AL-LERAWY" }] }),
});

function ForgotPassword() {
  const resolveIdentifierFn = useServerFn(resolveIdentifier);

  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;

    setBusy(true);
    try {
      // Resolve username/phone to email via server function
      const { email } = await resolveIdentifierFn({ data: { identifier: contact } });

      // Send Firebase password reset email
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: false,
      });

      setSentEmail(email);
      setSent(true);
    } catch (err: any) {
      // Don't reveal whether account exists for security
      if (err?.code === "auth/user-not-found" || err?.message?.includes("Account not found")) {
        toast.error("No account found with that email, username, or phone.");
      } else {
        toast.error(err instanceof Error ? err.message : "Request failed. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col px-6 py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Mail className="h-10 w-10" />
          </div>
          <h1 className="mt-8 font-display text-4xl">Check your inbox.</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            We've sent a password reset link to{" "}
            <span className="font-semibold text-foreground">{sentEmail}</span>.
            Click the link in the email to set a new password.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Didn't receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-gold hover:underline"
            >
              try again
            </button>
            .
          </p>
          <Link
            to="/login"
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-12 py-4 text-sm font-bold text-background transition-all hover:bg-gold"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-6 py-20">
        <Link
          to="/login"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        <div className="text-center">
          <h1 className="font-display text-4xl">Forgot Password.</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Enter your Email, Phone, or Username. We'll send a reset link to your registered email address.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-10 space-y-6 rounded-2xl border border-border bg-secondary/20 p-8 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Email, Username or Phone
            </label>
            <input
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-3.5 outline-none focus:border-gold transition-all"
              placeholder="Email, Username or Phone"
            />
          </div>

          <button
            disabled={busy || !contact}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-bold text-background transition-all hover:bg-gold disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Reset Link
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Mail className="h-3 w-3" /> support@caphub.com
          </p>
          <p className="flex items-center gap-2">
            <Phone className="h-3 w-3" /> +234 800 000 0000
          </p>
        </div>
      </div>
    </div>
  );
}
