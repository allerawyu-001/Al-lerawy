import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/AdminLayout";
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useCategories, categoriesStore, type Category } from "@/lib/categories-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
  head: () => ({ meta: [{ title: "Categories — Admin" }] }),
});

function CategoriesPage() {
  const cats = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleting, setDeleting] = useState<Category | null>(null);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description ?? "");
    setImageFile(null);
    setImagePreview(c.image ?? null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be smaller than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name is required");
      return;
    }

    setUploading(true);
    let imageUrl = imagePreview;

    try {
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, "categories");
      }

      categoriesStore.update(editing.slug, { 
        name: trimmed, 
        description: description.trim(),
        image: imageUrl || undefined
      });
      toast.success(`Category updated: ${trimmed}`);
      setEditing(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    if (deleting.products > 0) {
      toast.error(
        `Cannot delete "${deleting.name}" — ${deleting.products} products are still linked. Reassign them first.`
      );
      setDeleting(null);
      return;
    }
    const name = deleting.name;
    categoriesStore.remove(deleting.slug);
    toast.success(`Category deleted: ${name}`);
    setDeleting(null);
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Curate the taxonomy that powers shop, search and filters."
        action={
          <button
            type="button"
            onClick={() => toast.message("Use Edit on a row to modify, or wire 'New category' to your form.")}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground"
          >
            <Plus className="h-3 w-3" /> New category
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cats.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <p className="py-6 text-center text-sm text-muted-foreground">No categories yet.</p>
          </Card>
        )}
        {cats.map((c) => (
          <Card key={c.slug} className="overflow-hidden p-0">
            {c.image && (
              <div className="h-32 w-full overflow-hidden bg-secondary/30">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-4 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-gold">/{c.slug}</p>
                <h3 className="mt-1 font-display text-2xl">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.products} products</p>
                {c.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  aria-label={`Edit ${c.name}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(c)}
                  aria-label={`Delete ${c.name}`}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Rename, update the description, or add a category image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
               <label className="mb-2 block text-[10px] uppercase tracking-widest text-muted-foreground">Category Image</label>
               <div className="flex items-center gap-4">
                 <div 
                   onClick={() => !uploading && fileInputRef.current?.click()}
                   className="relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-secondary/30 transition-colors hover:bg-secondary/50"
                 >
                   {imagePreview ? (
                     <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                   ) : (
                     <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
                   )}
                 </div>
                 <div className="flex-1">
                   <p className="text-xs text-muted-foreground">Click the thumbnail to upload a new cover image.</p>
                   <p className="text-[10px] text-muted-foreground/70 mt-1">Under 2MB (JPG/PNG/WebP)</p>
                   {imagePreview && (
                     <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-xs text-destructive mt-2 hover:underline">Remove image</button>
                   )}
                 </div>
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
               </div>
            </div>
            
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-gold/60"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-gold/60"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setEditing(null)}
              className="rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={saveEdit}
              className="rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground disabled:opacity-50 inline-flex items-center gap-2"
            >
              {uploading && <Loader2 className="h-3 w-3 animate-spin"/>}
              {uploading ? "Saving..." : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.products > 0
                ? `This category has ${deleting.products} products linked. Reassign them before deleting.`
                : "This permanently removes the category. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
