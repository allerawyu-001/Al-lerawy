import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Toolbar, SearchInput, Pill, Pagination } from "@/components/AdminLayout";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
});

const orders = [
  { id: "#A-2418", customer: "Iris Laurent", producer: "Atelier Noir", total: "$184", payment: "Paid", status: "Shipped" },
  { id: "#A-2417", customer: "Marc Devereux", producer: "Studio Wares", total: "$72", payment: "Paid", status: "Processing" },
  { id: "#A-2416", customer: "Sora Kimura", producer: "Northfield Co.", total: "$248", payment: "Refunded", status: "Cancelled" },
  { id: "#A-2415", customer: "Lena Ortiz", producer: "Maison Doré", total: "$96", payment: "Paid", status: "Delivered" },
  { id: "#A-2414", customer: "Theo Bardot", producer: "Atelier Noir", total: "$312", payment: "Pending", status: "On hold" },
  { id: "#A-2413", customer: "Hugo Marin", producer: "Northfield Co.", total: "$140", payment: "Paid", status: "Shipped" },
  { id: "#A-2412", customer: "Anya Volkov", producer: "Studio Wares", total: "$58", payment: "Paid", status: "Delivered" },
  { id: "#A-2411", customer: "Noah Kestrel", producer: "Atelier Noir", total: "$220", payment: "Paid", status: "Processing" },
  { id: "#A-2410", customer: "Mei Tanaka", producer: "Maison Doré", total: "$176", payment: "Pending", status: "On hold" },
];

const PAGE_SIZE = 5;

function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "All" && o.status !== status) return false;
      if (!q) return true;
      return `${o.id} ${o.customer} ${o.producer}`.toLowerCase().includes(q);
    });
  }, [search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <PageHeader title="Orders" description="Every transaction across the platform." />
      <Card>
        <Toolbar>
          <SearchInput
            placeholder="Search by order ID, customer or producer"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-border bg-secondary/40 px-3 text-xs"
          >
            <option>All</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
            <option>On hold</option>
          </select>
        </Toolbar>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Producer</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Payment</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">No orders match your search.</td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 font-display text-base">{o.id}</td>
                    <td className="text-muted-foreground">{o.customer}</td>
                    <td className="text-muted-foreground">{o.producer}</td>
                    <td className="tabular-nums">{o.total}</td>
                    <td>
                      <Pill tone={o.payment === "Paid" ? "gold" : o.payment === "Refunded" ? "danger" : "warn"}>
                        {o.payment}
                      </Pill>
                    </td>
                    <td className="text-muted-foreground">{o.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} total={totalPages} onPageChange={setPage} />
      </Card>
    </>
  );
}
