import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Card, Toolbar, SearchInput, Pill, Pagination } from "@/components/AdminLayout";
import { Edit2, Trash2, EyeOff, Eye, Loader2, Check, X, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
});

type ProductRow = {
  id: string;
  title: string;
  producer: string;
  category: string;
  color: string;
  price: number;
  image: string | null;
  stock: number;
  disabled: boolean;
  status?: "pending" | "approved" | "rejected";
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
};

const cats = ["All", "Kindai", "Bama", "Bangwal", "Yerwa"];
const PAGE_SIZE = 8;

function ProductsPage() {
  const [cat, setCat] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, cat, statusFilter]);

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProductRow));
      setRows(data);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load products");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = debounced.toLowerCase();
    return rows.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      
      const pStatus = p.status || "approved"; // Default to approved for older products
      if (statusFilter === "Pending" && pStatus !== "pending") return false;
      if (statusFilter === "Approved" && pStatus !== "approved") return false;
      if (statusFilter === "Rejected" && pStatus !== "rejected") return false;

      if (!q) return true;
      return (
        p.title?.toLowerCase().includes(q) ||
        p.producer?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.color?.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [rows, cat, debounced, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleDisabled = async (p: ProductRow) => {
    const next = !p.disabled;
    setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, disabled: next } : r)));
    try {
      await updateDoc(doc(db, "products", p.id), { disabled: next });
      toast.success(next ? "Product hidden from marketplace" : "Product reactivated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update product");
      setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, disabled: !next } : r)));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    try {
      await deleteDoc(doc(db, "products", id));
      setRows((rs) => rs.filter((r) => r.id !== id));
      toast.success("Product deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete product");
    }
    setDeleting(null);
  };

  const handleApprove = async (p: ProductRow) => {
    try {
      await updateDoc(doc(db, "products", p.id), {
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: "u_008",
        disabled: false
      });
      setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, status: "approved", disabled: false } : r)));
      toast.success("Product approved and is now live");
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve product");
    }
  };

  const [rejecting, setRejecting] = useState<ProductRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleRejectSubmit = async () => {
    if (!rejecting) return;
    try {
      await updateDoc(doc(db, "products", rejecting.id), {
        status: "rejected",
        rejectionReason: rejectionReason,
        disabled: true
      });
      setRows((rs) => rs.map((r) => (r.id === rejecting.id ? { ...r, status: "rejected", disabled: true, rejectionReason } : r)));
      toast.success("Product rejected");
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject product");
    }
    setRejecting(null);
    setRejectionReason("");
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Every cap listed across the marketplace — search, edit, suspend, or remove."
      />
      <Card>
        <Toolbar>
          <SearchInput
            placeholder="Search name, producer, category, ID…"
            value={search}
            onChange={(v) => setSearch(v)}
          />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    cat === c ? "border-gold text-gold" : "border-border text-muted-foreground hover:border-gold/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Pending", "Approved", "Rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    statusFilter === s ? "border-gold text-gold" : "border-border text-muted-foreground hover:border-gold/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Toolbar>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Producer</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No products match your search.
                  </td>
                </tr>
              ) : (
                pageRows.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-secondary/30">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.title} className="h-12 w-12 rounded-md object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-secondary" />
                        )}
                        <div>
                          <p className="font-display text-base">{p.title}</p>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.color}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{p.producer}</td>
                    <td className="text-muted-foreground">{p.category}</td>
                    <td className="tabular-nums">${Number(p.price).toFixed(2)}</td>
                    <td className="tabular-nums">{p.stock}</td>
                    <td>
                      {(p.status || "approved") === "pending" ? (
                        <Pill tone="muted">Pending</Pill>
                      ) : (p.status || "approved") === "rejected" ? (
                        <Pill tone="destructive">Rejected</Pill>
                      ) : p.disabled ? (
                        <Pill tone="muted">Disabled</Pill>
                      ) : (
                        <Pill tone="gold">Approved</Pill>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/product/${p.id}`}
                          target="_blank"
                          title="View Details"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        {(p.status === "pending") && (
                          <>
                            <button
                              onClick={() => handleApprove(p)}
                              title="Approve"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-green-500"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setRejecting(p)}
                              title="Reject"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setEditing(p)}
                          title="Edit"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggleDisabled(p)}
                          title={p.disabled ? "Reactivate" : "Suspend"}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          {p.disabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          title="Delete"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} total={totalPages} onPageChange={setPage} />
      </Card>

      <EditDialog
        product={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) => {
          setRows((rs) => rs.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
          setEditing(null);
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" will be permanently removed from the marketplace. This cannot be undone.
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

      <AlertDialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject "{rejecting?.title}"? You can optionally provide a reason below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label>Rejection Reason (optional)</Label>
            <Input 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              placeholder="e.g. Images do not meet guidelines"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectSubmit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function EditDialog({
  product,
  onClose,
  onSaved,
}: {
  product: ProductRow | null;
  onClose: () => void;
  onSaved: (p: ProductRow) => void;
}) {
  const [form, setForm] = useState<ProductRow | null>(product);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(product);
  }, [product]);

  if (!form) return null;

  const save = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "products", form.id), {
        title: form.title,
        producer: form.producer,
        category: form.category,
        color: form.color,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image,
      });
      toast.success("Product updated");
      onSaved(form);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit product</DialogTitle>
          <DialogDescription>Update details, image, stock, category and price.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Producer</Label>
              <Input value={form.producer} onChange={(e) => setForm({ ...form, producer: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-gold/60 transition-colors"
              >
                <option>Kindai</option>
                <option>Bama</option>
                <option>Bangwal</option>
                <option>Yerwa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Color</Label>
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Price</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Image URL</Label>
            <Input
              value={form.image ?? ""}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://…"
            />
            {form.image ? (
              <img src={form.image} alt="" className="h-24 w-24 rounded-md object-cover" />
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
