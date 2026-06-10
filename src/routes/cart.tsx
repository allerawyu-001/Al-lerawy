import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { products } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Cart — AL-LERAWY.com" }] }),
});

function CartPage() {
  const [items, setItems] = useState(
    products.slice(0, 2).map((p) => ({ ...p, qty: 1 }))
  );

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal > 100 ? 0 : 8;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs uppercase tracking-widest text-gold">Cart</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl">Your selection</h1>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <div className="divide-y divide-border/40 border-y border-border/40">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[100px_1fr_auto] gap-6 py-6">
                <img src={item.image} alt={item.title} className="h-24 w-24 rounded-md object-cover" />
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{item.producer}</p>
                  <h3 className="font-display text-xl">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.color} · {item.category}</p>
                  <div className="mt-3 inline-flex items-center gap-3 rounded-full border border-border px-3 py-1 text-sm">
                    <button onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, qty: Math.max(1, i.qty - 1) } : i))}>
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center tabular-nums">{item.qty}</span>
                    <button onClick={() => setItems(items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <p className="font-display text-2xl tabular-nums">${item.price * item.qty}</p>
                  <button
                    onClick={() => setItems(items.filter(i => i.id !== item.id))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <p className="py-20 text-center text-muted-foreground">Your cart is empty.</p>
            )}
          </div>

          <aside className="h-fit rounded-md border border-border bg-secondary/30 p-6">
            <h2 className="font-display text-2xl">Order summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <Row k="Subtotal" v={`$${subtotal}`} />
              <Row k="Shipping" v={shipping === 0 ? "Free" : `$${shipping}`} />
              <div className="my-3 hairline" />
              <Row k="Total" v={`$${total}`} bold />
            </dl>
            <button className="mt-6 w-full rounded-full bg-foreground py-3 text-sm font-medium text-background hover:bg-gold">
              Checkout
            </button>
            <Link to="/shop" className="mt-3 block text-center text-xs text-muted-foreground hover:text-gold">
              Continue browsing
            </Link>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base text-foreground" : "text-muted-foreground"}`}>
      <dt>{k}</dt>
      <dd className={bold ? "font-display text-xl" : "tabular-nums"}>{v}</dd>
    </div>
  );
}
