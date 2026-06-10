import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/AdminLayout";
import { Download, FileBarChart } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
});

const reports = [
  { name: "Monthly GMV report", desc: "Sales volume broken down by category and studio.", period: "May 2026" },
  { name: "Producer payouts", desc: "Pending and paid commissions per producer.", period: "Q2 2026" },
  { name: "Tax summary", desc: "VAT and sales tax collected per region.", period: "YTD" },
  { name: "Customer cohort", desc: "Retention and lifetime value across signups.", period: "Last 12 months" },
];

function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Generate and export operational reports." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((r) => (
          <Card key={r.name}>
            <div className="flex items-start gap-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-gold/15 text-gold">
                <FileBarChart className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-gold">{r.period}</p>
                <h3 className="mt-1 font-display text-xl">{r.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold">
                <Download className="h-3 w-3" /> CSV
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
