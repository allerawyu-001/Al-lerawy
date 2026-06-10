import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardLayout, Panel } from "@/components/DashboardLayout";
import { db } from "@/integrations/firebase/client";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Loader2, Edit3, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/producer/products/$id")({
  component: ProducerProductDetails,
  head: () => ({ meta: [{ title: "Product Details — Producer" }] }),
});

type ProductData = {
  id: string;
  title: string;
  description?: string;
  category: string;
  color?: string;
  price: number;
  image: string | null;
  stock: number;
  disabled: boolean;
  created_at?: string;
};

function ProducerProductDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, id]);

  const load = async () => {
    try {
      const snap = await getDoc(doc(db, "products", id));
      if (!snap.exists()) {
        toast.error("Product not found");
        navigate({ to: "/producer/products" });
        return;
      }
      setProduct({ id: snap.id, ...snap.data() } as ProductData);
    } catch (e) {
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!product) return;
    try {
      await updateDoc(doc(db, "products", product.id), { disabled: !product.disabled });
      setProduct({ ...product, disabled: !product.disabled });
      toast.success(product.disabled ? "Product Live" : "Product Paused");
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
     return (
       <DashboardLayout role="producer" title="Product Details">
         <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-muted-foreground h-8 w-8" /></div>
       </DashboardLayout>
     );
  }

  if (!product) return null;

  return (
    <DashboardLayout role="producer" title="Product Details">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/producer/products" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-gold transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to My Products
        </Link>
        <div className="flex items-center gap-3">
           <button onClick={toggleStatus} className="rounded-md border border-border px-4 py-2 text-xs uppercase tracking-widest hover:border-gold/50 transition flex items-center gap-2">
             {product.disabled ? <Eye className="h-4 w-4 text-gold"/> : <EyeOff className="h-4 w-4 text-destructive" />} 
             {product.disabled ? "Publish" : "Pause"}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-8">
          <Panel title="Listing Overview">
            <div className="flex flex-col md:flex-row gap-8 mt-4">
              <div className="shrink-0">
                 {product.image ? (
                   <img src={product.image} alt={product.title} className="w-full md:w-64 h-64 rounded-xl object-cover border border-border/50 shadow-sm" />
                 ) : (
                   <div className="w-full md:w-64 h-64 rounded-xl border border-dashed border-border flex items-center justify-center bg-secondary/20 text-muted-foreground text-sm">No Image Provided</div>
                 )}
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                     <span className="text-[10px] uppercase tracking-widest text-gold bg-gold/10 px-2 py-1 rounded-sm">{product.category}</span>
                     {product.disabled ? (
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded-sm">Draft</span>
                     ) : (
                        <span className="text-[10px] uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 rounded-sm">Live</span>
                     )}
                  </div>
                  <h1 className="font-display text-4xl mt-1">{product.title}</h1>
                  <p className="text-xl mt-3 font-display tabular-nums">${Number(product.price).toFixed(2)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Color / Style</p>
                     <p className="mt-1 font-medium">{product.color || "Standard"}</p>
                   </div>
                   <div>
                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Stock</p>
                     <p className="mt-1 font-medium tabular-nums">{product.stock} units</p>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</p>
                   <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                     {product.description || "No description provided."}
                   </p>
                </div>
                
                {product.created_at && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-4 border-t border-border/50">
                    Created on {new Date(product.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
           <Panel title="Performance Metrics">
              <div className="space-y-6 mt-4">
                 <div className="bg-secondary/20 p-4 rounded-lg border border-border/40">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Views</p>
                   <p className="mt-2 text-3xl font-display tabular-nums">0</p>
                 </div>
                 <div className="bg-secondary/20 p-4 rounded-lg border border-border/40">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Units Sold</p>
                   <p className="mt-2 text-3xl font-display tabular-nums">0</p>
                 </div>
                 <div className="bg-secondary/20 p-4 rounded-lg border border-border/40">
                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Revenue Generated</p>
                   <p className="mt-2 text-3xl font-display tabular-nums">$0.00</p>
                 </div>
                 <p className="text-xs text-muted-foreground text-center mt-4 italic">Traffic metrics will populate once orders are placed against this SKU.</p>
              </div>
           </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
