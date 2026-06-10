import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Stat, Toolbar, SearchInput, Pill } from "@/components/AdminLayout";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsPage,
  head: () => ({ meta: [{ title: "Payments — Admin" }] }),
});

const txns = [
  { id: "TX-9182", order: "#A-2418", method: "Stripe", amount: "$184", status: "Captured", date: "May 19" },
  { id: "TX-9181", order: "#A-2417", method: "Stripe", amount: "$72", status: "Captured", date: "May 19" },
  { id: "TX-9180", order: "#A-2416", method: "Stripe", amount: "-$248", status: "Refunded", date: "May 18" },
  { id: "TX-9179", order: "#A-2415", method: "PayPal", amount: "$96", status: "Captured", date: "May 18" },
];

function PaymentsPage() {
  return (
    <>
      <PageHeader title="Payments" description="Transactions, payouts and refunds across the marketplace." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Gross volume" value="$184k" delta="+22% MTD" />
        <Stat label="Net revenue" value="$24.6k" delta="commission 13.4%" />
        <Stat label="Pending payouts" value="$8.2k" />
        <Stat label="Refunds" value="$1.1k" />
      </div>
      <Card className="mt-8">
        <Toolbar>
          <SearchInput placeholder="Search transactions" />
        </Toolbar>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Transaction</th>
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {txns.map((t) => (
                <tr key={t.id}>
                  <td className="py-3 font-display text-base">{t.id}</td>
                  <td className="text-muted-foreground">{t.order}</td>
                  <td className="text-muted-foreground">{t.method}</td>
                  <td className="tabular-nums">{t.amount}</td>
                  <td>
                    <Pill tone={t.status === "Captured" ? "gold" : "danger"}>{t.status}</Pill>
                  </td>
                  <td className="text-muted-foreground">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
