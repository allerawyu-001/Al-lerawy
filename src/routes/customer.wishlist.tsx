import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Heart, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/customer/wishlist")({
  component: WishlistPage,
  head: () => ({ meta: [{ title: "Wishlist — AL-LERAWY.com" }] }),
});

type Item = { id: string; product_id: string; product_name: string; product_image: string | null; price: number | null };

function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, "wishlist"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (!authLoading && !user) throw redirect({ to: "/login" });

  const remove = async (id: string) => {
    const prev = items;
    setItems(items.filter((i) => i.id !== id));
    try {
      await deleteDoc(doc(db, "wishlist", id));
      toast.success("Removed from wishlist");
    } catch (error: any) {
      setItems(prev);
      toast.error(error.message || "Failed to remove");
    }
  };

  return (
    <DashboardLayout role="customer" title="Your wishlist">
      <Panel title="Saved pieces">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Heart className="h-8 w-8 text-gold" />
            <p>Your wishlist is empty.</p>
            <Link to="/shop" className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Browse shop</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div key={it.id} className="rounded-md border border-border bg-secondary/20 p-4">
                {it.product_image && <img src={it.product_image} alt="" className="mb-3 aspect-square w-full rounded-md object-cover" />}
                <p className="font-display text-lg">{it.product_name}</p>
                {it.price != null && <p className="mt-1 text-sm tabular-nums">${Number(it.price).toFixed(2)}</p>}
                <div className="mt-3 flex gap-2">
                  <Link to="/cart" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs text-background">
                    <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
                  </Link>
                  <button onClick={() => remove(it.id)} className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </DashboardLayout>
  );
}
