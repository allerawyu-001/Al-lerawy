import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-md bg-secondary/40">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          width={800}
          height={800}
          className="aspect-square w-full object-cover transition duration-700 group-hover:scale-[1.03]"
        />
        {product.tag && (
          <span className="absolute left-3 top-3 rounded-full border border-gold/30 bg-background/70 px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold backdrop-blur">
            {product.tag}
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur">
          {product.category}
        </span>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {product.producer}
          </p>
          <h3 className="font-display text-xl leading-tight transition group-hover:text-gold">
            {product.title}
          </h3>
        </div>
        <p className="shrink-0 text-sm tabular-nums">${product.price}</p>
      </div>
    </Link>
  );
}
