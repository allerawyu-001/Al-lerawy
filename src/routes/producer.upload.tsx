import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { db } from "@/integrations/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2, UploadCloud, Image as ImageIcon, X } from "lucide-react";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const Route = createFileRoute("/producer/upload")({
  component: ProducerUploadPage,
  head: () => ({ meta: [{ title: "Upload Product — Producer Studio" }] }),
});

function ProducerUploadPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Kindai");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`Image ${f.name} must be smaller than 5MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
        setPreviews(prev => [
          ...prev,
          ...validFiles.map(f => URL.createObjectURL(f))
        ]);
      }
    }
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]); // Free up memory
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  const uploadFile = (f: File, onProgress: (p: number) => void): Promise<string> => {
    return uploadToCloudinary(f, "products", onProgress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !price || !stock) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      let imageUrls: string[] = [];
      
      if (files.length > 0) {
        setUploadProgress(1); // initialize
        const progressTracker = new Array(files.length).fill(0);
        
        imageUrls = await Promise.all(
          files.map((f, i) => uploadFile(f, (p) => {
            progressTracker[i] = p;
            const total = progressTracker.reduce((a, b) => a + b, 0) / files.length;
            setUploadProgress(total);
          }))
        );
      }

      await addDoc(collection(db as any, "products"), {
        producerId: user.uid,
        producer: (profile as any)?.business_name || profile?.firstName || "Unknown Producer",
        title: title.trim(),
        description: description.trim(),
        category,
        color: color.trim() || "Multi",
        price: Number(price),
        stock: Number(stock),
        image: imageUrls.length > 0 ? imageUrls[0] : null,
        images: imageUrls,
        disabled: false,
        status: "approved",
        created_at: new Date().toISOString()
      });

      toast.success("Product uploaded successfully!");
      navigate({ to: "/producer/products" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload product");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-md border border-border bg-secondary/40 px-4 py-2.5 text-sm outline-none focus:border-gold/60 transition-colors";

  return (
    <DashboardLayout role="producer" title="Upload Product">
      <Panel title="New Listing">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-4">
          <div className="space-y-6">
            <div className="grid gap-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Product Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Classic Wool Bangwal" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                  <option>Kindai</option>
                  <option>Bama</option>
                  <option>Bangwal</option>
                  <option>Yerwa</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Color / Style</label>
                <input value={color} onChange={e => setColor(e.target.value)} className={inputCls} placeholder="e.g. Navy Blue" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Price ($) *</label>
                <input required type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} placeholder="45.00" />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Initial Stock *</label>
                <input required type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className={inputCls} placeholder="50" />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} className={inputCls} placeholder="Deep dive into the materials, stitch counts, and fit..." />
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-2 min-h-[300px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Product Images (Primary image first)</label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {previews.map((previewUrl, index) => (
                  <div key={index} className="relative aspect-square border border-border rounded-xl bg-secondary/20 flex overflow-hidden group">
                    <img src={previewUrl} alt={`Preview ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button type="button" onClick={() => removeImage(index)} className="rounded-full bg-destructive/90 p-2 text-background hover:bg-destructive shadow-xl transition-transform hover:scale-110">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Upload Button visible next to previews */}
                <div className="relative aspect-square border-2 border-dashed border-border rounded-xl bg-secondary/10 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-gold/50 cursor-pointer group hover:bg-secondary/30">
                  <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center text-muted-foreground p-2 text-center">
                    <div className="rounded-full bg-secondary/50 p-2.5 mb-2 text-foreground/70 group-hover:bg-gold/20 group-hover:text-gold transition-colors">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-foreground text-xs">{previews.length === 0 ? "Upload Imagery" : "Add More"}</span>
                    <span className="text-[10px] mt-1 hidden sm:block">Max 5MB per file</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

             <div className="pt-2 flex flex-col items-end gap-3">
               {loading && files.length > 0 && (
                 <div className="w-full md:w-64 h-2 bg-secondary rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-gold transition-all duration-300"
                     style={{ width: `${Math.max(5, uploadProgress)}%` }}
                   />
                 </div>
               )}
               <button type="submit" disabled={loading} className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-gold px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                 {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                 {loading ? "Uploading..." : "Publish Product"}
               </button>
             </div>
          </div>
        </form>
      </Panel>
    </DashboardLayout>
  );
}

