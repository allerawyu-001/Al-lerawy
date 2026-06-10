import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Hammer, Truck, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import heroCap from "@/assets/hero-cap.jpg";
import { useState, useEffect } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AL-LERAWY.com — A marketplace for considered headwear" },
      {
        name: "description",
        content:
          "Shop ready-made caps from independent makers or commission a custom piece on AL-LERAWY.com.",
      },
    ],
  }),
});

function Index() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "products"),
      where("disabled", "==", false),
      orderBy("created_at", "desc"),
      limit(8)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          image: doc.data().image || (doc.data().images && doc.data().images[0]) || "",
        }))
        // Include products that are approved OR have no status field (legacy products)
        .filter((p: any) => !p.status || p.status === "approved");
      setProducts(fetched);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching homepage products:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Split into featured (first 4) and trending (next 4)
  const featured = products.slice(0, 4);
  const trending = products.slice(4, 8);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-16 lg:grid-cols-12 lg:gap-8 lg:pt-24">
          <div className="lg:col-span-6 lg:pt-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-3 py-1 text-[11px] uppercase tracking-widest text-gold">
              <span className="h-1 w-1 rounded-full bg-gold" />
              Vol. 04 — Atelier Edition
            </div>
            <h1 className="mt-6 font-display text-6xl leading-[0.95] tracking-tight md:text-7xl lg:text-[88px]">
              Headwear,
              <br />
              <span className="italic text-gold-gradient">considered.</span>
            </h1>
            <p className="mt-6 max-w-md text-base text-muted-foreground">
              A curated marketplace for ready-made and custom caps. Small batches.
              Independent makers. Pieces meant to be worn for years.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:bg-gold"
              >
                Browse the shop
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/custom"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm hover:border-gold/40"
              >
                Commission a piece
              </Link>
            </div>

            <dl className="mt-16 grid grid-cols-3 gap-6 border-t border-border/40 pt-8">
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Makers</dt>
                <dd className="mt-1 font-display text-3xl">42</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Pieces</dt>
                <dd className="mt-1 font-display text-3xl">1,280</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">Commissions</dt>
                <dd className="mt-1 font-display text-3xl">340</dd>
              </div>
            </dl>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative overflow-hidden rounded-md bg-secondary/40">
              <img
                src={heroCap}
                alt="The Atelier hero cap — black with gold embroidery"
                width={1536}
                height={1536}
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gold">Featured</p>
                  <p className="font-display text-2xl text-foreground">The Atelier 01</p>
                </div>
                <Link
                  to="/product/$id"
                  params={{ id: "noir-01" }}
                  className="rounded-full bg-background/80 px-4 py-2 text-xs backdrop-blur"
                >
                  $68 →
                </Link>
              </div>
            </div>
            <div className="absolute -left-6 -top-6 hidden h-24 w-24 rounded-full border border-gold/40 lg:block" />
            <div className="absolute -bottom-6 -right-6 hidden h-32 w-32 rounded-full gold-gradient opacity-20 blur-2xl lg:block" />
          </div>
        </div>

        {/* Marquee */}
        <div className="border-y border-border/40 bg-secondary/20 py-4">
          <div className="mx-auto flex max-w-7xl items-center gap-12 overflow-hidden px-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span>Atelier Noir</span>
            <span className="text-gold">◆</span>
            <span>Maison Doré</span>
            <span className="text-gold">◆</span>
            <span>Northfield Co.</span>
            <span className="text-gold">◆</span>
            <span>Studio Wares</span>
            <span className="text-gold">◆</span>
            <span>Pressed Goods</span>
            <span className="text-gold">◆</span>
            <span>House of Brim</span>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Featured</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">This week's selection</h2>
          </div>
          <Link to="/shop" className="hidden text-sm text-muted-foreground hover:text-foreground md:inline">
            View all →
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : featured.length === 0 ? (
          <p className="mt-12 text-muted-foreground">No featured products available at this time.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}
      </section>

      {/* Pillars */}
      <section className="border-y border-border/40 bg-secondary/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-px bg-border/40 md:grid-cols-3">
          {[
            { icon: Hammer, t: "Made by hand", d: "Every piece cut and stitched in small batches by independent ateliers." },
            { icon: Sparkles, t: "Custom commissions", d: "Bring a reference, choose a maker, approve the proof. We handle the rest." },
            { icon: Truck, t: "Considered shipping", d: "Carbon-neutral delivery, recyclable packaging, no plastic film." },
          ].map((c) => (
            <div key={c.t} className="bg-background p-10">
              <c.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-6 font-display text-2xl">{c.t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Trending</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Moving fast</h2>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : trending.length === 0 ? (
          <p className="mt-12 text-muted-foreground">Check back soon for trending products.</p>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {[
            { q: "The custom commission was the most thoughtful purchase I've made all year.", a: "Iris L." },
            { q: "Build quality you can feel. The Atelier 01 is now in heavy rotation.", a: "Marc D." },
            { q: "Finally a marketplace that treats the makers like the brand they are.", a: "Sora K." },
          ].map((t, i) => (
            <figure key={i} className="border-l border-gold/40 pl-6">
              <blockquote className="font-display text-2xl leading-snug">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                — {t.a}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-md border border-gold/30 bg-secondary/30 px-8 py-20 text-center md:px-16">
          <div className="absolute inset-0 -z-10 gold-gradient opacity-[0.06]" />
          <p className="text-xs uppercase tracking-widest text-gold">Become a maker</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-5xl md:text-6xl">
            Sell your craft to a community that gets it.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Open a producer studio in minutes. Manage products, orders, custom requests, and earnings — all in one place.
          </p>
          <Link
            to="/producer/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:bg-gold"
          >
            Open producer dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
