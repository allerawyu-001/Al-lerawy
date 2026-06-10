import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/customer/orders/$id")({
  component: OrderDetailPage,
  head: () => ({ meta: [{ title: "Order details — AL-LERAWY.com" }] }),
});

type Order = {
  id: string; order_number: string; status: string; payment_status: string;
  delivery_status: string; total: number; producer_name: string | null;
  shipping_address: string | null; notes: string | null; created_at: string;
};
type Item = { id: string; product_name: string; product_image: string | null; quantity: number; unit_price: number };

function badge(s: string) {
  const cls = s === "delivered" || s === "paid" ? "bg-gold/15 text-gold"
    : s === "shipped" || s === "confirmed" ? "bg-accent/15 text-accent"
    : s === "cancelled" ? "bg-destructive/15 text-destructive"
    : "bg-secondary text-muted-foreground";
  return `rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest ${cls}`;
}

function OrderDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const orderSnap = await getDoc(doc(db, "orders", id));
        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() } as Order);
        }
        
        const itemsQuery = query(collection(db, "order_items"), where("order_id", "==", id));
        const itemsSnap = await getDocs(itemsQuery);
        setItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Item)));
      } catch (e) {
        console.error("Failed to load order", e);
      }
      setLoading(false);
    })();
  }, [id]);

  const cancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, "orders", order.id), { status: "cancelled", updated_at: new Date().toISOString() });
      toast.success("Order cancelled");
      setOrder({ ...order, status: "cancelled" });
    } catch (error: any) {
      toast.error(error.message || "Cancel failed");
    }
    setCancelling(false);
  };

  return (
    <DashboardLayout role="customer" title="Order details">
      <Link to="/customer/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !order ? (
        <Panel title="Not found"><p className="text-muted-foreground">This order doesn't exist or you don't have access.</p></Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Panel title={`Order ${order.order_number}`}>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className={badge(order.status)}>{order.status.replace("_"," ")}</span>
                <span className={badge(order.payment_status)}>payment: {order.payment_status}</span>
                <span className={badge(order.delivery_status)}>delivery: {order.delivery_status}</span>
              </div>
              <div className="divide-y divide-border/40">
                {items.map((it) => (
                  <div key={it.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 py-3">
                    {it.product_image ? <img src={it.product_image} alt="" className="h-16 w-16 rounded-md object-cover" /> : <div className="h-16 w-16 rounded-md bg-secondary" />}
                    <div>
                      <p className="font-display text-lg">{it.product_name}</p>
                      <p className="text-xs text-muted-foreground">Qty {it.quantity} · ${Number(it.unit_price).toFixed(2)}</p>
                    </div>
                    <p className="font-display tabular-nums">${(Number(it.unit_price) * it.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-2xl tabular-nums">${Number(order.total).toFixed(2)}</span>
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Timeline">
              <ol className="space-y-3 text-sm">
                <li><span className="text-gold">●</span> Ordered — {new Date(order.created_at).toLocaleString()}</li>
                {["confirmed","in_production","shipped","delivered"].includes(order.status) && <li><span className="text-gold">●</span> Confirmed</li>}
                {["in_production","shipped","delivered"].includes(order.status) && <li><span className="text-gold">●</span> In production</li>}
                {["shipped","delivered"].includes(order.status) && <li><span className="text-gold">●</span> Shipped</li>}
                {order.status === "delivered" && <li><span className="text-gold">●</span> Delivered</li>}
                {order.status === "cancelled" && <li className="text-destructive">● Cancelled</li>}
              </ol>
            </Panel>
            <Panel title="Producer & shipping">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Producer</p>
              <p className="mb-3 font-display text-lg">{order.producer_name ?? "—"}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Ship to</p>
              <p className="text-sm">{order.shipping_address ?? "—"}</p>
              {order.notes && (<><p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">Notes</p><p className="text-sm">{order.notes}</p></>)}
            </Panel>
            {!["delivered","cancelled","shipped"].includes(order.status) && (
              <button onClick={cancel} disabled={cancelling} className="w-full rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-50">
                {cancelling ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
