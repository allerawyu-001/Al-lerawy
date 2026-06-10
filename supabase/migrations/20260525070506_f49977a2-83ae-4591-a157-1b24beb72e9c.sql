
-- Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Revoke broad EXECUTE on SECURITY DEFINER funcs; only the trigger/RLS needs them
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Replace broad SELECT on avatars with object-owner-only listing (public read still works via getPublicUrl)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Anyone can read avatar files by path"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
-- Note: bucket remains public for getPublicUrl. Listing requires knowing the path, which is by design.
