import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { categories, colors } from "@/lib/products";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";

export const Route = createFileRoute("/shop")({
  component: Shop,
  head: () => ({
    meta: [
      { title: "Shop — AL-LERAWY.com" },
      { name: "description", content: "Browse every cap on AL-LERAWY.com. Filter by category and color." },
    ],
  }),
});

function Shop() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [color, setColor] = useState<string>("All");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "products"),
      where("disabled", "==", false),
      orderBy("created_at", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedProducts = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure image fallback works
          image: doc.data().image || (doc.data().images && doc.data().images[0]) || "",
        }))
        // Include products that are approved OR have no status field (legacy products)
        .filter((p: any) => !p.status || p.status === "approved");
      setProducts(fetchedProducts);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching products:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (cat !== "All" && p.category !== cat) return false;
      if (color !== "All" && p.color !== color) return false;
      if (q && !`${p.title} ${p.producer}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, cat, color, products]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Shop</p>
            <h1 className="mt-2 font-display text-5xl md:text-6xl">The full collection</h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search caps, makers..."
              className="w-full rounded-full border border-border bg-secondary/40 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-gold/50"
            />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <FilterGroup label="Category">
              {categories.map((c) => (
                <FilterPill key={c} active={cat === c} onClick={() => setCat(c)}>
                  {c}
                </FilterPill>
              ))}
            </FilterGroup>

            <FilterGroup label="Color">
              {colors.map((c) => (
                <FilterPill key={c} active={color === c} onClick={() => setColor(c)}>
                  {c}
                </FilterPill>
              ))}
            </FilterGroup>
          </aside>

          <div>
            <p className="mb-6 text-xs uppercase tracking-widest text-muted-foreground">
              {filtered.length} pieces
            </p>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="rounded-md border border-border p-12 text-center text-muted-foreground">
                Nothing matches those filters.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-gold bg-gold text-primary-foreground"
          : "border-border text-muted-foreground hover:border-gold/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
