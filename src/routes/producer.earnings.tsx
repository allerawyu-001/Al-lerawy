import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, StatCard, Panel } from "@/components/DashboardLayout";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, DollarSign } from "lucide-react";

export const Route = createFileRoute("/producer/earnings")({
  component: ProducerEarningsPage,
  head: () => ({ meta: [{ title: "Earnings — Producer Studio" }] }),
});

function ProducerEarningsPage() {
  const { user } = useAuth();
  const [totalEarned, setTotalEarned] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadEarnings();
  }, [user]);

  const loadEarnings = async () => {
    try {
      const q = query(
        collection(db, "custom_requests"),
        where("producer_id", "==", user!.uid)
      );
      const snap = await getDocs(q);
      let earned = 0;
      let completed = 0;
      let pending = 0;

      snap.docs.forEach(d => {
        const data = d.data();
        const budget = Number(data.budget) || 0;
        if (data.status === "completed") {
          earned += budget;
          completed++;
        } else {
          pending++;
        }
      });

      setTotalEarned(earned);
      setCompletedCount(completed);
      setPendingCount(pending);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="producer" title="Earnings">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
            <StatCard label="Total Earned" value={`$${totalEarned.toFixed(2)}`} hint="From completed orders" />
            <StatCard label="Completed Orders" value={completedCount.toString()} hint="Delivered to customers" />
            <StatCard label="In Progress" value={pendingCount.toString()} hint="Awaiting completion" />
          </div>

          <Panel title="Revenue Breakdown">
            {totalEarned === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                <DollarSign className="h-10 w-10 text-gold/50" />
                <p className="font-medium">No earnings recorded yet</p>
                <p className="text-xs max-w-sm">Complete custom orders to start building your revenue history. Earnings will be displayed here automatically.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border/40 bg-secondary/20 p-6">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Average Order Value</p>
                    <p className="mt-2 font-display text-3xl tabular-nums">${completedCount > 0 ? (totalEarned / completedCount).toFixed(2) : "0.00"}</p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-secondary/20 p-6">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Projected Monthly</p>
                    <p className="mt-2 font-display text-3xl tabular-nums">${(totalEarned / Math.max(1, completedCount) * 4).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </>
      )}
    </DashboardLayout>
  );
}
