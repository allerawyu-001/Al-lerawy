import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, StatCard, Panel } from "@/components/DashboardLayout";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/producer/dashboard")({
  component: ProducerDashboard,
  head: () => ({ meta: [{ title: "Producer studio — AL-LERAWY.com" }] }),
});

type Task = { id: string; title: string; status: string; declined_by?: string[]; user_id?: string; budget?: string | number };

function ProducerDashboard() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricProducts, setMetricProducts] = useState(0);
  const [metricOrders, setMetricOrders] = useState(0);
  const [metricRevenue, setMetricRevenue] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load pending custom requests (all producers see these)
      const qr = query(collection(db, "custom_requests"), where("status", "==", "pending"));
      const rSnap = await getDocs(qr);
      const allTasks = rSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
      // Filter out tasks this producer already declined
      const validTasks = allTasks.filter(t => !t.declined_by?.includes(user!.uid));
      setTasks(validTasks);

      // Products metric
      const qp = query(collection(db, "products"), where("producerId", "==", user!.uid));
      const pSnap = await getDocs(qp);
      setMetricProducts(pSnap.size);

      // Orders & revenue from custom_requests assigned to this producer
      const qo = query(collection(db, "custom_requests"), where("producer_id", "==", user!.uid));
      const oSnap = await getDocs(qo);
      let revenue = 0;
      let orderCount = oSnap.size;
      oSnap.docs.forEach(d => {
        const data = d.data();
        if (data.status === "completed") {
          revenue += Number(data.budget) || 0;
        }
      });
      setMetricOrders(orderCount);
      setMetricRevenue(revenue);

    } catch (e) {
      console.error(e);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (task: Task) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "custom_requests", task.id), {
        status: "accepted",
        producer_id: user.uid,
        producer_name: profile?.firstName ? `${profile.firstName} ${profile.secondName || ""}`.trim() : "Producer",
        accepted_at: new Date().toISOString()
      });
      setTasks(tasks.filter(t => t.id !== task.id));
      toast.success("Task accepted! It is now in your orders.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to accept task");
    }
  };

  const handleDecline = async (task: Task) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "custom_requests", task.id), {
        declined_by: arrayUnion(user.uid),
        declined_at: new Date().toISOString()
      });
      setTasks(tasks.filter(t => t.id !== task.id));
      toast.success("Task declined.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to decline task");
    }
  };

  const sales = [42, 58, 51, 73, 64, 88, 96, 81, 110, 124, 108, 142]; // Placeholder chart baseline
  const max = Math.max(...sales);

  return (
    <DashboardLayout role="producer" title="Producer Dashboard">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Revenue" value={`$${metricRevenue.toFixed(2)}`} hint="From completed orders" />
        <StatCard label="Orders" value={metricOrders.toString()} hint="Lifetime metrics" />
        <StatCard label="Products" value={metricProducts.toString()} hint="Active catalog size" />
        <StatCard label="Rating" value="5.0" hint="Baseline" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <Panel title="Sales · baseline placeholder" action={<span className="text-xs uppercase tracking-widest text-gold">+0% YoY</span>}>
             <div className="flex h-44 items-end gap-2">
               {sales.map((v, i) => (
                 <div key={i} className="flex flex-1 flex-col items-center gap-2">
                   <div
                     className="w-full rounded-sm gold-gradient opacity-40 grayscale"
                     style={{ height: `${(v / max) * 100}%` }}
                   />
                 </div>
               ))}
             </div>
             <div className="mt-3 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
               {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <span key={m}>{m}</span>)}
             </div>
           </Panel>
        </div>

        <Panel title="Available Requests">
          {loading ? (
             <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : tasks.length === 0 ? (
             <p className="text-sm text-muted-foreground py-4 text-center">No new requests available.</p>
          ) : (
            <ul className="space-y-3 text-sm max-h-[300px] overflow-y-auto">
              {tasks.map((r) => (
                <li key={r.id} className="rounded-md border border-border/60 p-4">
                  <p className="font-display text-lg">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">Budget: {r.budget || "Unspecified"}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-muted-foreground">Pending response</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleAccept(r)} className="rounded-full bg-foreground px-3 py-1 text-[10px] uppercase tracking-widest text-background hover:bg-gold transition-colors">Accept</button>
                      <button onClick={() => handleDecline(r)} className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-widest hover:text-destructive hover:border-destructive transition-colors">Decline</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
