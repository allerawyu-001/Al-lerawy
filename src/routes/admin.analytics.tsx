import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Stat } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
});

const bars = [42, 58, 36, 71, 64, 88, 74, 92, 80, 96, 82, 110];
const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];

function AnalyticsPage() {
  const max = Math.max(...bars);
  return (
    <>
      <PageHeader title="Analytics" description="Sales, traffic and conversion across the marketplace." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Sessions" value="84.2k" delta="+18%" />
        <Stat label="Conversion" value="3.4%" delta="+0.6pp" />
        <Stat label="AOV" value="$96" delta="+$4" />
        <Stat label="Returning" value="38%" delta="+5%" />
      </div>

      <Card className="mt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl">GMV — last 12 months</h2>
          <select className="h-9 rounded-md border border-border bg-secondary/40 px-3 text-xs">
            <option>Last 12 months</option><option>Year to date</option><option>Last 30 days</option>
          </select>
        </div>
        <div className="flex h-56 items-end gap-2">
          {bars.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-sm gold-gradient transition-all"
                style={{ height: `${(b / max) * 100}%` }}
              />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{months[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl">Category breakdown</h3>
          <ul className="mt-4 space-y-4">
            {[
              { l: "Kindai", v: 45 },
              { l: "Bama", v: 25 },
              { l: "Bangwal", v: 20 },
              { l: "Yerwa", v: 10 },
            ].map((c) => (
              <li key={c.l}>
                <div className="flex justify-between text-sm">
                  <span>{c.l}</span>
                  <span className="text-muted-foreground">{c.v}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-gold" style={{ width: `${c.v}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-display text-xl">Top producers</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { l: "Atelier Noir", v: "$48k" },
              { l: "Northfield Co.", v: "$92k" },
              { l: "Studio Wares", v: "$31k" },
              { l: "Maison Doré", v: "$22k" },
            ].map((p) => (
              <li key={p.l} className="flex justify-between border-b border-border/40 pb-3 last:border-0">
                <span>{p.l}</span>
                <span className="tabular-nums text-gold">{p.v}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
