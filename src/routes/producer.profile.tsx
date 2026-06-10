import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { AvatarUpload } from "@/components/AvatarUpload";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { db, auth } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/producer/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile settings — AL-LERAWY.com" }] }),
});

function ProfilePage() {
  const { user, profile, loading: authLoading, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const name = profile.firstName ? `${profile.firstName} ${profile.secondName || ''}`.trim() : '';
    setFullName(name);
    setPhone(profile.phoneNumber ?? "");
    setBio(profile.bio ?? "");
    (async () => {
      const snap = await getDoc(doc(db, "users", profile.uid));
      if (snap.exists()) {
        setAddress(snap.data()?.address ?? "");
      }
    })();
  }, [profile]);

  if (!authLoading && !user) throw redirect({ to: "/login" });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const nameParts = fullName.split(' ');
      await updateDoc(doc(db, "users", user.uid), {
        firstName: nameParts[0] || null,
        secondName: nameParts.slice(1).join(' ') || null,
        phoneNumber: phone || null,
        bio: bio || null,
        address: address || null,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Profile updated");
      await refresh();
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    }
    setSaving(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setPwSaving(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, pw);
        setPw("");
        toast.success("Password updated");
      }
    } catch (error: any) {
      toast.error(error.message || "Password update failed");
    }
    setPwSaving(false);
  };

  if (authLoading) return <DashboardLayout role="producer" title="Profile"><div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout role="producer" title="Profile settings">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Account">
            <form onSubmit={save} className="space-y-4">
              <div className="flex items-center gap-4">
                <AvatarUpload />
                <div>
                  <p className="text-sm text-muted-foreground">Profile photo</p>
                  <p className="text-xs text-muted-foreground">Click to upload (JPG/PNG/WebP, ≤5MB)</p>
                </div>
              </div>
              <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" /></Field>
              <Field label="Email"><input value={user?.email ?? ""} disabled className="input opacity-60" /></Field>
              <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" /></Field>
              <Field label="Address"><textarea value={address} onChange={(e) => setAddress(e.target.value)} className="input min-h-[80px]" /></Field>
              <Field label="Bio"><textarea value={bio} onChange={(e) => setBio(e.target.value)} className="input min-h-[80px]" /></Field>
              <button disabled={saving} className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </Panel>
        </div>
        <div>
          <Panel title="Change password">
            <form onSubmit={changePassword} className="space-y-4">
              <Field label="New password"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="input" placeholder="••••••••" /></Field>
              <button disabled={pwSaving} className="rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50">
                {pwSaving ? "Updating…" : "Update password"}
              </button>
            </form>
          </Panel>
        </div>
      </div>
      <style>{`.input{width:100%;border-radius:0.375rem;border:1px solid hsl(var(--border));background:hsl(var(--secondary)/0.3);padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.input:focus{border-color:hsl(var(--gold,45 80% 47%))}`}</style>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
