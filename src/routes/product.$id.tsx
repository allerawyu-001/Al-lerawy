import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, Truck, Shield, ShoppingBag, Minus, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, collection, query, limit, getDocs, where } from "firebase/firestore";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "Product — AL-LERAWY.com" },
    ],
  }),
});

function ProductPage() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          setSelectedImage(data.image || (data.images && data.images[0]) || "");

          // Load related products
          const q = query(
            collection(db, "products"),
            where("disabled", "==", false),
            limit(8)
          );
          const relSnap = await getDocs(q);
          const relData = relSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((p: any) => p.id !== id && (!p.status || p.status === "approved"))
            .slice(0, 4);
          setRelated(relData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Link to="/shop" className="text-gold">← Product not found. Back to shop</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image].filter(Boolean);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <nav className="mb-8 text-xs uppercase tracking-widest text-muted-foreground">
          <Link to="/shop" className="hover:text-gold">Shop</Link>
          <span className="mx-2">/</span>
          <span>{product.category}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-md bg-secondary/40 relative aspect-square">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title}
                  width={1200}
                  height={1200}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="absolute inset-0 bg-secondary flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest">No Image</div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {images.map((imgUrl: string, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${selectedImage === imgUrl ? 'border-gold' : 'border-transparent hover:border-gold/50'}`}
                  >
                    <img src={imgUrl} className="absolute inset-0 w-full h-full object-cover" alt={`${product.title} view ${i+1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:pt-6">
            <p className="text-xs uppercase tracking-widest text-gold">{product.producer || "Unknown Maker"}</p>
            <h1 className="mt-2 font-display text-5xl leading-tight md:text-6xl">{product.title}</h1>
            <div className="mt-4 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-gold text-gold" />
                {product.rating || "5.0"}
              </span>
              <span className="text-muted-foreground">{product.reviews || 0} reviews</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{product.stock} in stock</span>
            </div>
            <p className="mt-3 font-display text-4xl tabular-nums">${product.price?.toFixed(2)}</p>

            <p className="mt-8 max-w-md text-muted-foreground">{product.description}</p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Color</p>
                <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm">
                  <span className="h-3 w-3 rounded-full bg-foreground" />
                  {product.color || "Multi"}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Quantity</p>
                <div className="inline-flex items-center gap-3 rounded-full border border-border px-3 py-1.5 text-sm">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-muted-foreground hover:text-gold">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center tabular-nums">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="text-muted-foreground hover:text-gold">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <button className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium text-background transition hover:bg-gold">
                <ShoppingBag className="h-4 w-4" />
                Add to cart
              </button>
              <Link
                to="/custom"
                className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3.5 text-sm hover:border-gold/40"
              >
                Commission similar
              </Link>
            </div>

            <ul className="mt-10 space-y-3 border-t border-border/40 pt-6 text-sm text-muted-foreground">
              <li className="flex items-center gap-3"><Truck className="h-4 w-4 text-gold" /> Carbon-neutral shipping, 3–5 days</li>
              <li className="flex items-center gap-3"><Shield className="h-4 w-4 text-gold" /> 30-day exchange · 2-year craft warranty</li>
            </ul>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-32">
            <h2 className="mb-10 font-display text-4xl">You may also like</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
