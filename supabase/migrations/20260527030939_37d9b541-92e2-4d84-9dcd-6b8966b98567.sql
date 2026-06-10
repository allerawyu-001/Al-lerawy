CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  producer text NOT NULL,
  category text NOT NULL,
  color text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  image text,
  stock integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  reviews integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  tag text,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (disabled = false OR has_role(auth.uid(), 'Admin'::app_role));

CREATE POLICY "Admins insert products"
  ON public.products FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'Admin'::app_role));

CREATE POLICY "Admins update products"
  ON public.products FOR UPDATE
  USING (has_role(auth.uid(), 'Admin'::app_role));

CREATE POLICY "Admins delete products"
  ON public.products FOR DELETE
  USING (has_role(auth.uid(), 'Admin'::app_role));

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_products_search ON public.products
  USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(producer,'') || ' ' || coalesce(category,'') || ' ' || coalesce(color,'')));

CREATE OR REPLACE FUNCTION public.seed_products_if_empty()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'Admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can seed products';
  END IF;

  IF EXISTS (SELECT 1 FROM public.products LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO public.products (title, producer, category, color, price, image, stock, rating, reviews, description, tag) VALUES
    ('Onyx Snapback','Atelier Noir','Snapback','Black',68,'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600',24,4.9,184,'A flat-brim snapback in heavy structured twill.','Trending'),
    ('Crown Dad Hat — Ivory','Maison Doré','Dad Hat','Cream',54,'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600',12,4.8,96,'Soft washed cotton six-panel with hand-embroidered gold crown.','New'),
    ('Atlas Wool Fitted','Northfield Co.','Fitted','Charcoal',84,'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=600',6,4.95,47,'A merino-blend fitted in deep charcoal.','Limited'),
    ('Field Trucker — Sand','Studio Wares','Trucker','Sand',46,'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600',32,4.7,212,'Garment-dyed canvas front with breathable mesh back.',NULL),
    ('Onyx Snapback — Wide','Atelier Noir','Snapback','Black',72,'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600',18,4.85,64,'Wide-brim variant of the Onyx with tonal stitching.',NULL),
    ('Crown Dad Hat — Stone','Maison Doré','Dad Hat','Stone',54,'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600',9,4.6,38,'Crown silhouette in a softer stone colorway.',NULL),
    ('Atlas Beret','Northfield Co.','Beret','Black',62,'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=600',4,4.9,21,'Hand-shaped wool beret. Unstructured, satin-lined.','Limited'),
    ('Field Trucker — Black','Studio Wares','Trucker','Black',46,'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600',40,4.7,158,'Trucker in washed black with tonal mesh.','Trending');
END;
$$;