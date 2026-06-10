import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Package } from "lucide-react";

export const Route = createFileRoute("/customer/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Your orders — AL-LERAWY.com" }] }),
});

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  total: number;
  producer_name: string | null;
  created_at: string;
};

function statusClass(s: string) {
  if (s === "delivered" || s === "paid") return "bg-gold/15 text-gold";
  if (s === "shipped" || s === "confirmed") return "bg-accent/15 text-accent";
  if (s === "cancelled") return "bg-destructive/15 text-destructive";
  return "bg-secondary text-muted-foreground";
}

function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, "orders"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc")
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch (e) {
        console.error("Failed to load orders", e);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (!authLoading && !user) {
    throw redirect({ to: "/login" });
  }

  return (
    <DashboardLayout role="customer" title="Your orders">
      <Panel title="All orders">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Package className="h-8 w-8 text-gold" />
            <p>No orders yet. Browse the shop to place your first.</p>
            <Link to="/shop" className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Shop now</Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/customer/orders/$id"
                params={{ id: o.id }}
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 transition hover:bg-secondary/30 -mx-2 px-2 rounded-md"
              >
                <div>
                  <p className="text-xs text-muted-foreground">
                    {o.order_number} · {new Date(o.created_at).toLocaleDateString()} · {o.producer_name ?? "—"}
                  </p>
                  <p className="font-display text-lg">Order {o.order_number}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusClass(o.status)}`}>{o.status.replace("_"," ")}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusClass(o.payment_status)}`}>pay: {o.payment_status}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${statusClass(o.delivery_status)}`}>ship: {o.delivery_status}</span>
                  </div>
                </div>
                <p className="font-display text-lg tabular-nums">${Number(o.total).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </DashboardLayout>
  );
}
