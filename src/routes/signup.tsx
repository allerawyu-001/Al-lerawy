import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Eye, EyeOff, Loader2, Upload, X, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { useServerFn } from "@tanstack/react-start";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { checkUsername } from "@/lib/auth.functions";
import { NIGERIA_STATES_LGAS } from "@/lib/nigeria-states";
import { auth, db, googleProvider } from "@/integrations/firebase/client";
import { createUserWithEmailAndPassword, signInWithPopup, deleteUser } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const Route = createFileRoute("/signup")({
  component: Signup,
  head: () => ({ meta: [{ title: "Create Account — AL-LERAWY" }] }),
});

type Step = 1 | 2 | 3;

function Signup() {
  const navigate = useNavigate();
  const checkUsernameFn = useServerFn(checkUsername);

  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Form State
  const [role, setRole] = useState<"customer" | "producer">("customer");
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [contactValue, setContactValue] = useState("");

  const handleStateChange = (newState: string) => {
    setState(newState);
    setLga(""); // Reset LGA when State changes
  };
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  
  // Profile Picture
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameCheckIdRef = useRef(0);
  const [usernameError, setUsernameError] = useState("");

  const VALID_USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

  const onUsernameChange = (val: string) => {
    setUsername(val);
    setUsernameError("");
    
    // Clear any pending check
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    
    // Too short — reset to idle
    if (val.length < 3) {
      setUsernameStatus("idle");
      if (val.length > 0) setUsernameError("Username must be at least 3 characters");
      return;
    }
    
    // Client-side format check
    if (!VALID_USERNAME_RE.test(val)) {
      setUsernameStatus("idle");
      setUsernameError("Only letters, numbers, underscore (_) and hyphen (-) allowed");
      return;
    }
    
    setUsernameStatus("checking");
    
    // Debounce 400ms
    usernameTimerRef.current = setTimeout(async () => {
      const checkId = ++usernameCheckIdRef.current;
      
      try {
        const response = await fetch(`/api/auth/check-username?username=${val}`);
        const res = await response.json();
        
        // Only update if this is still the latest check
        if (checkId !== usernameCheckIdRef.current) return;
        
        if (response.ok && res.available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError(res.error || "Username already taken");
        }
      } catch (err: any) {
        console.error(`[Username Check] Error:`, err);
        if (checkId === usernameCheckIdRef.current) {
          // On error, don't block the user — mark as available and show a warning
          setUsernameStatus("available");
          setUsernameError("");
        }
      }
    }, 400);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!firstName || !secondName || !username || !dob || !gender) {
        toast.error("Please fill all required fields");
        return;
      }
      // Username format validation
      if (username.length < 3) {
        toast.error("Username must be at least 3 characters");
        return;
      }
      if (!VALID_USERNAME_RE.test(username)) {
        toast.error("Username can only contain letters, numbers, underscores, and hyphens");
        return;
      }
      if (usernameStatus === "checking") {
        toast.info("Checking username availability, please wait...");
        return;
      }
      if (usernameStatus === "taken") {
        toast.error("Username is already taken, please choose another");
        return;
      }
      // Allow "idle" through if format is valid (server check may have failed gracefully)
      setStep(2);
    } else if (step === 2) {
      if (!state || !lga || !contactValue) {
        toast.error("Please fill all required fields");
        return;
      }
      setStep(3);
    }
  };

  const onGoogleSignup = async () => {
    try {
      setBusy(true);
      const res = await signInWithPopup(auth, googleProvider);
      
      try {
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          email: res.user.email || null,
          firstName: res.user.displayName?.split(' ')[0] || null,
          secondName: res.user.displayName?.split(' ')?.slice(1)?.join(' ') || null,
          username: res.user.email?.split('@')[0] || null,
          role: role.toLowerCase(),
          profilePicture: res.user.photoURL || null,
          business_name: role === 'producer' ? businessName : null,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
        toast.success("Account created successfully!");
        console.log("[Signup Google] role saved:", role);
        const destination = role === "producer" ? "/producer/dashboard" : "/customer/dashboard";
        navigate({ to: destination as any });
      } catch (err: any) {
        // Roll back Auth user if Firestore write fails
        try {
          await deleteUser(res.user);
          console.warn('[Signup Google] Auth user removed due to Firestore failure');
        } catch (cleanupErr) {
          console.error('[Signup Google] Failed to clean up Auth user:', cleanupErr);
        }
        toast.error(err.message || "Google signup failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Google signup failed");
    } finally {
      setBusy(false);
    }
  };

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
    if (contactType !== "email") {
       toast.error("Only Email Registration is supported currently.");
       return;
    }

    setBusy(true);
    let authRes;
    try {
      // 1. Create Firebase Auth user
      authRes = await createUserWithEmailAndPassword(auth, contactValue, password);
      
      const payload: any = {
        uid: authRes.user.uid,
        email: contactValue,
        firstName: firstName,
        secondName: secondName,
        username: username,
        dateOfBirth: dob,
        gender: gender,
        state: state,
        localGovernment: lga,
        role: role.toLowerCase(),
        business_name: role === 'producer' ? businessName : null,
        status: 'active',
        phoneNumber: null,
        profilePicture: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (avatar) {
        try {
          const { uploadToCloudinary } = await import("@/lib/cloudinary");
          payload.profilePicture = await uploadToCloudinary(avatar, "avatars");
        } catch (e) {
          console.error("Avatar upload failed:", e);
        }
      }

      await setDoc(doc(db, "users", authRes.user.uid), payload, { merge: true });

      toast.success("Account created successfully!");
      navigate({ to: "/login" });
    } catch (err: any) {
      if (authRes?.user) {
        await deleteUser(authRes.user);
      }
      toast.error(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="mx-auto flex max-w-2xl flex-col px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Step {step} of 3</p>
            <h1 className="mt-2 font-display text-4xl">Create your account.</h1>
          </div>
          <div className="hidden space-x-2 sm:flex">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full ${step >= s ? "bg-gold" : "bg-secondary"}`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-border bg-secondary/20 p-8 shadow-xl backdrop-blur-sm">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field label="I am joining as a">
                <div className="grid grid-cols-2 gap-4">
                  {(["customer", "producer"] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                        role === r ? "border-gold bg-gold/10 text-gold" : "border-border bg-background/40"
                      }`}
                    >
                      <span className="text-sm font-medium capitalize">{r}</span>
                    </button>
                  ))}
                </div>
              </Field>

              {role === "producer" && (
                <Field label="Business Name">
                  <input
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="input-base"
                    placeholder="e.g. Al-Lerawy Crafts"
                  />
                </Field>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="First Name">
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-base"
                    placeholder="e.g. Aliyu"
                  />
                </Field>
                <Field label="Second Name">
                  <input
                    required
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                    className="input-base"
                    placeholder="e.g. Umar"
                  />
                </Field>
              </div>

              <Field label="Username">
                <div className="relative">
                  <input
                    required
                    value={username}
                    onChange={(e) => onUsernameChange(e.target.value)}
                    className={`input-base pr-10 ${
                      usernameStatus === "available" ? "border-green-500/50" : 
                      usernameStatus === "taken" || usernameError ? "border-red-500/50" : ""
                    }`}
                    placeholder="aliyu_umar"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {usernameStatus === "available" && <div className="h-2 w-2 rounded-full bg-green-500" />}
                    {usernameStatus === "taken" && <div className="h-2 w-2 rounded-full bg-red-500" />}
                  </div>
                </div>
                {usernameStatus === "available" && <p className="mt-1 text-[10px] text-green-500">Username available ✓</p>}
                {usernameStatus === "checking" && <p className="mt-1 text-[10px] text-muted-foreground">Checking availability...</p>}
                {usernameError && <p className="mt-1 text-[10px] text-red-500">{usernameError}</p>}
              </Field>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Date of Birth">
                  <input
                    required
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="input-base"
                  />
                </Field>
                <Field label="Gender">
                  <Select required value={gender} onValueChange={setGender}>
                    <SelectTrigger className="input-base h-auto py-3">
                      <SelectValue placeholder="Select Gender..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-background hover:brightness-110"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="State">
                  <Select required value={state} onValueChange={handleStateChange}>
                    <SelectTrigger className="input-base h-auto py-3">
                      <SelectValue placeholder="Select State..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(NIGERIA_STATES_LGAS).sort().map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="LGA">
                  <Select required value={lga} onValueChange={setLga} disabled={!state}>
                    <SelectTrigger className="input-base h-auto py-3 disabled:cursor-not-allowed disabled:opacity-50">
                      <SelectValue placeholder="Select LGA..." />
                    </SelectTrigger>
                    <SelectContent>
                      {state && NIGERIA_STATES_LGAS[state]?.sort().map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Contact Method">
                <div className="flex gap-4">
                  {(["email", "phone"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => {
                        setContactType(t);
                        setContactValue("");
                      }}
                      className={`rounded-full border px-4 py-1.5 text-xs transition-all ${
                        contactType === t ? "border-gold bg-gold text-background" : "border-border bg-background/60"
                      }`}
                    >
                      {t === "email" ? "Email Address" : "Phone Number"}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={contactType === "email" ? "Email Address" : "Phone Number"}>
                <input
                  required
                  type={contactType === "email" ? "email" : "tel"}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  className="input-base"
                  placeholder={contactType === "email" ? "you@example.com" : "+234 ..."}
                />
              </Field>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-semibold transition-colors hover:bg-secondary/50"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 rounded-full bg-gold px-8 py-3 text-sm font-semibold text-background hover:brightness-110"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field label="Profile Picture (Optional)">
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-border bg-background/40">
                    {avatarPreview ? (
                      <>
                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setAvatar(null);
                            setAvatarPreview(null);
                          }}
                          className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-[10px]">Upload</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">JPG, PNG or WEBP. Max 2MB.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-gold hover:underline"
                    >
                      Choose Image
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </Field>

              <Field label="Create Password">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-base pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                />
              </Field>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-semibold transition-colors hover:bg-secondary/50"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  disabled={busy}
                  className="flex items-center gap-2 rounded-full bg-foreground px-10 py-3 text-sm font-semibold text-background hover:bg-gold disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Finish & Sign Up
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-gold hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        .input-base { width: 100%; border-radius: 0.75rem; border: 1px solid hsl(var(--border)); background: rgba(255,255,255,0.03); padding: 0.75rem 1.25rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
        .input-base:focus { border-color: rgba(212,160,23,0.6); box-shadow: 0 0 0 4px rgba(212,160,23,0.1); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{label}</label>
      {children}
    </div>
  );
}
