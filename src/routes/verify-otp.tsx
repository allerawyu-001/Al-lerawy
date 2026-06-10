import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/verify-otp")({
  component: VerifyEmail,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      userId: (search.userId as string) || "",
      type: (search.type as "email" | "phone") || "email",
      purpose: (search.purpose as "verification" | "password_reset") || "verification",
    };
  },
  head: () => ({ meta: [{ title: "Verify Account — AL-LERAWY" }] }),
});

function VerifyEmail() {
  const { purpose } = Route.useSearch();
  const navigate = useNavigate();

  const isReset = purpose === "password_reset";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <button
          onClick={() => navigate({ to: isReset ? "/forgot-password" : "/login" })}
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 text-gold">
            <Mail className="h-10 w-10" />
          </div>

          <h1 className="mt-8 font-display text-4xl">
            {isReset ? "Check your email." : "Verify your account."}
          </h1>

          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {isReset
              ? "We've sent a password reset link to your email address. Click the link in the email to set a new password."
              : "We've sent a verification link to your email address. Click the link in the email to verify your account and get started."}
          </p>

          <div className="mt-8 w-full rounded-2xl border border-border bg-secondary/20 p-6 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What to do next</p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Look for an email from AL-LERAWY</li>
              <li>Click the link inside the email</li>
              {isReset
                ? <li>You'll be taken to a page to set your new password</li>
                : <li>Your account will be verified and you can sign in</li>
              }
            </ol>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Didn't receive an email? Check your spam folder.{" "}
            {isReset ? (
              <Link to="/forgot-password" className="text-gold hover:underline">Request again</Link>
            ) : (
              <Link to="/login" className="text-gold hover:underline">Back to sign in</Link>
            )}
          </p>

          <Link
            to="/login"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-10 py-3.5 text-sm font-bold text-background transition-all hover:bg-gold"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
