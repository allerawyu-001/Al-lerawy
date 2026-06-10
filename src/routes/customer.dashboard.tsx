import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, StatCard, Panel } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/customer/dashboard")({
  component: CustomerDashboard,
  head: () => ({ meta: [{ title: "Your studio — AL-LERAWY.com" }] }),
});

type Order = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items?: any[];
};

type CustomReq = {
  id: string;
  title: string;
  status: string;
  producer_name: string | null;
  created_at: string;
};

function CustomerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistCount: 0,
    activeRequests: 0,
    spent: 0
  });
  
  const [requests, setRequests] = useState<CustomReq[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;
    
    (async () => {
      try {
        const fetchOrders = getDocs(query(collection(db, "orders"), where("user_id", "==", user.uid), orderBy("created_at", "desc"), limit(5)));
        const fetchAllOrders = getDocs(query(collection(db, "orders"), where("user_id", "==", user.uid)));
        const fetchWishlist = getDocs(query(collection(db, "wishlist"), where("user_id", "==", user.uid)));
        const fetchRequests = getDocs(query(collection(db, "custom_requests"), where("user_id", "==", user.uid), orderBy("created_at", "desc"), limit(5)));
        
        const [ordersSnap, allOrdersSnap, wishlistSnap, reqSnap] = await Promise.all([
          fetchOrders, fetchAllOrders, fetchWishlist, fetchRequests
        ]);
        
        setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as CustomReq)));
        
        let totalSpent = 0;
        allOrdersSnap.docs.forEach(doc => {
           totalSpent += Number(doc.data().total || 0);
        });
        
        setStats({
          totalOrders: allOrdersSnap.size,
          wishlistCount: wishlistSnap.size,
          activeRequests: reqSnap.size,
          spent: totalSpent
        });
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  const firstName = profile?.firstName || user?.email?.split('@')[0] || "Guest";

  return (
    <DashboardLayout role="customer" title={`Welcome back, ${firstName}.`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Orders" value={stats.totalOrders.toString()} hint="lifetime" />
        <StatCard label="Open requests" value={stats.activeRequests.toString()} hint="all pending" />
        <StatCard label="Wishlist" value={stats.wishlistCount.toString()} hint="pieces saved" />
        <StatCard label="Spent" value={`$${stats.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} hint="lifetime" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Recent orders">
            {loading ? (
              <div className="py-12 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent orders found.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {orders.map((o) => (
                  <div key={o.id} className="items-center gap-4 py-4 flex justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{o.order_number || o.id} · {new Date(o.created_at).toLocaleDateString()}</p>
                      <p className="font-display text-lg">Order #{o.order_number || o.id.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg tabular-nums">${Number(o.total || 0).toFixed(2)}</p>
                      <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest bg-secondary text-muted-foreground`}>
                        {o.status?.replace("_", " ") || "Processing"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Custom requests">
          {loading ? (
              <div className="py-12 flex justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : requests.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent requests.</div>
          ) : (
            <ul className="space-y-4">
              {requests.map((r) => (
                <li key={r.id} className="rounded-md border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-widest text-gold">{r.producer_name || "Unassigned"}</p>
                  <p className="mt-1 font-display text-lg">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.status?.replace("_", " ") || "Reviewing"}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
