
-- profiles: add address
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number text NOT NULL UNIQUE DEFAULT ('ORD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  status text NOT NULL DEFAULT 'pending', -- pending|confirmed|in_production|shipped|delivered|cancelled
  payment_status text NOT NULL DEFAULT 'unpaid', -- unpaid|paid|refunded
  delivery_status text NOT NULL DEFAULT 'processing', -- processing|shipped|delivered
  total numeric(10,2) NOT NULL DEFAULT 0,
  shipping_address text,
  notes text,
  producer_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'Admin'));
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(),'Admin'));
CREATE POLICY "Users delete own orders" ON public.orders FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(),'Admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_orders_user ON public.orders(user_id, created_at DESC);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR has_role(auth.uid(),'Admin'))));
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Users delete own order items" ON public.order_items FOR DELETE
  USING (EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR has_role(auth.uid(),'Admin'))));
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- WISHLIST
CREATE TABLE public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  price numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- CUSTOM REQUESTS
CREATE TABLE public.custom_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|in_review|responded|accepted|rejected|completed
  budget numeric(10,2),
  producer_name text,
  producer_response text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own requests" ON public.custom_requests FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'Admin'));
CREATE POLICY "Users insert own requests" ON public.custom_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own requests" ON public.custom_requests FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(),'Admin'));
CREATE POLICY "Users delete own requests" ON public.custom_requests FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(),'Admin'));
CREATE TRIGGER custom_requests_updated_at BEFORE UPDATE ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_custom_requests_user ON public.custom_requests(user_id, created_at DESC);

-- Seed helper: gives the calling user sample data if they have none
CREATE OR REPLACE FUNCTION public.seed_sample_customer_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  o1 uuid; o2 uuid; o3 uuid;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE user_id = uid) THEN
    INSERT INTO public.orders (user_id, status, payment_status, delivery_status, total, shipping_address, producer_name, created_at)
    VALUES (uid,'delivered','paid','delivered',68.00,'12 Sabon Gari, Kano','Northfield Co.', now() - interval '21 days') RETURNING id INTO o1;
    INSERT INTO public.orders (user_id, status, payment_status, delivery_status, total, shipping_address, producer_name, created_at)
    VALUES (uid,'shipped','paid','shipped',54.00,'12 Sabon Gari, Kano','Maison Doré', now() - interval '6 days') RETURNING id INTO o2;
    INSERT INTO public.orders (user_id, status, payment_status, delivery_status, total, shipping_address, producer_name, created_at)
    VALUES (uid,'in_production','paid','processing',46.00,'12 Sabon Gari, Kano','Atelier Zare', now() - interval '2 days') RETURNING id INTO o3;

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, quantity, unit_price) VALUES
      (o1,'p1','Heritage Wool Cap','https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400',1,68.00),
      (o2,'p2','Embroidered Hausa Cap','https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=400',1,54.00),
      (o3,'p3','Zare Threaded Cap','https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400',1,46.00);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.wishlist WHERE user_id = uid) THEN
    INSERT INTO public.wishlist (user_id, product_id, product_name, product_image, price) VALUES
      (uid,'p4','Royal Gold Edition','https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',89.00),
      (uid,'p5','Cream Linen Cap','https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',42.00);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.custom_requests WHERE user_id = uid) THEN
    INSERT INTO public.custom_requests (user_id, title, description, status, budget, producer_name, producer_response, responded_at) VALUES
      (uid,'Heritage wool fitted','Custom wool cap with gold thread monogram','responded',120.00,'Northfield Co.','We can deliver in 3 weeks for $120.', now() - interval '1 day'),
      (uid,'Monogrammed dad hat','Cream cap with initials AL embroidered','pending',60.00,NULL,NULL,NULL);
  END IF;
END;
$$;
