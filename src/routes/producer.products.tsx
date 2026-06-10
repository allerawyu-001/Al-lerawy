import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Edit3, Trash2, Eye, EyeOff, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/producer/products")({
  component: ProducerProductsPage,
  head: () => ({ meta: [{ title: "My Products — Producer Studio" }] }),
});

type ProductRow = {
  id: string;
  title: string;
  category: string;
  color?: string;
  price: number;
  image: string | null;
  stock: number;
  disabled: boolean;
};

function ProducerProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Real-time synchronization
    const q = query(
      collection(db, "products"), 
      where("producerId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductRow));
      // order by client-side since compound queries require composite indexes
      data.sort((a,b) => a.title.localeCompare(b.title));
      setRows(data);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error("Failed to sync products stream");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleDisabled = async (p: ProductRow) => {
    try {
      await updateDoc(doc(db, "products", p.id), { disabled: !p.disabled });
      toast.success(p.disabled ? "Product is now Live" : "Product paused temporarily");
    } catch (e: any) {
      toast.error("Status update failed");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteDoc(doc(db, "products", deleting.id));
      toast.success("Product deleted successfully");
    } catch (e) {
      toast.error("Failed to delete product");
    }
    setDeleting(null);
  };

  return (
    <DashboardLayout role="producer" title="My Products">
      <Panel
        title="Inventory"
        action={
          <button onClick={() => navigate({ to: "/producer/upload" })} className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground transition hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Upload Product
          </button>
        }
      >
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">You don't have any products uploaded yet.</td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-secondary/30">
                    <td className="py-3">
                      <Link to="/producer/products/$id" params={{ id: p.id }} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {p.image ? (
                           <img src={p.image} alt={p.title} className="h-10 w-10 rounded object-cover" />
                        ) : (
                           <div className="h-10 w-10 rounded bg-secondary"/>
                        )}
                        <span className="font-display text-base hover:text-gold transition-colors">{p.title}</span>
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{p.category}</td>
                    <td className="tabular-nums">{p.stock}</td>
                    <td className="tabular-nums">${Number(p.price).toFixed(2)}</td>
                    <td>
                      {p.disabled ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Draft</span>
                      ) : (
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold text-nowrap">Live</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2 text-muted-foreground">
                        <button onClick={() => toggleDisabled(p)} className="hover:text-foreground transition-colors p-1" title={p.disabled ? "Publish" : "Draft"}>
                          {p.disabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditing(p)} className="hover:text-gold transition-colors p-1" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleting(p)} className="hover:text-destructive transition-colors p-1" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <EditProductDialog product={editing} onClose={() => setEditing(null)} />
      
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" will be permanently removed. Order history pointing to it will remain intact, but it cannot be bought again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

function EditProductDialog({ product, onClose }: { product: ProductRow | null; onClose: () => void }) {
  const [form, setForm] = useState<ProductRow | null>(product);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(product); }, [product]);

  if (!form) return null;

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "products", form.id), {
        title: form.title,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      toast.success("Product updated");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to edit product");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-gold/60 transition-colors";

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Edit Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 mt-2">
          <div className="grid gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Title</Label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
          </div>
          <div className="grid gap-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Category</Label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
              <option>Kindai</option>
              <option>Bama</option>
              <option>Bangwal</option>
              <option>Yerwa</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Price ($)</Label>
               <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inputCls} />
            </div>
            <div className="grid gap-2">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Stock</Label>
               <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={inputCls} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mr-2">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-md bg-gold px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground hover:opacity-90 transition disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
