import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUpload({ size = 96 }: { size?: number }) {
  const { user, profile, refresh } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast.error("Use JPG, PNG, or WebP");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Max file size is 5MB");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const downloadURL = await uploadToCloudinary(file, "avatars");
      
      await updateDoc(doc(db as any, "users", user.uid), {
        profilePicture: downloadURL,
        updatedAt: new Date().toISOString(),
      });
      await refresh();
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const fullName = profile?.firstName ? `${profile.firstName} ${profile.secondName || ''}`.trim() : null;
  const src = preview ?? profile?.profilePicture ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName ?? user.email ?? "User")}&background=c9a84c&color=0B1F3A&bold=true`;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <img
        src={src}
        alt="Profile"
        className="h-full w-full rounded-full border border-gold/30 object-cover"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-md transition hover:bg-gold disabled:opacity-60"
        aria-label="Upload photo"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );
}
