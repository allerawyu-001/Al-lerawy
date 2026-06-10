import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Pill } from "@/components/AdminLayout";
import { Star } from "lucide-react";

export const Route = createFileRoute("/admin/reviews")({
  component: ReviewsPage,
  head: () => ({ meta: [{ title: "Reviews — Admin" }] }),
});

const reviews = [
  { product: "Onyx Kindai", customer: "Iris L.", rating: 5, body: "Crown shape is perfect, stitching impeccable.", status: "Published" },
  { product: "Crown Bama — Ivory", customer: "Marc D.", rating: 4, body: "Beautiful embroidery, sizing runs slightly small.", status: "Pending" },
  { product: "Atlas Bangwal Fitted", customer: "Theo B.", rating: 5, body: "Worth every dollar. Will buy again.", status: "Published" },
  { product: "Field Yerwa — Sand", customer: "Anon", rating: 1, body: "Spam comment about external links.", status: "Flagged" },
];

function ReviewsPage() {
  return (
    <>
      <PageHeader title="Reviews" description="Customer feedback waiting for moderation." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviews.map((r, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gold">{r.product}</p>
                <p className="mt-1 font-display text-lg">{r.customer}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-3.5 w-3.5 ${j < r.rating ? "fill-gold text-gold" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">"{r.body}"</p>
            <div className="mt-4 flex items-center justify-between">
              <Pill tone={r.status === "Published" ? "gold" : r.status === "Flagged" ? "danger" : "warn"}>
                {r.status}
              </Pill>
              <div className="flex gap-1.5">
                <button className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">Approve</button>
                <button className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Remove</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
