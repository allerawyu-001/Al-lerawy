CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _meta_role text;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  _meta_role := NEW.raw_user_meta_data->>'role';

  -- Auto-promote known admin email, or honor 'Admin'/'super_admin' metadata
  IF NEW.email = 'admin@caphub.com'
     OR lower(coalesce(_meta_role,'')) IN ('admin','super_admin') THEN
    _role := 'Admin'::public.app_role;
  ELSIF _meta_role IN ('Customer','Producer') THEN
    _role := _meta_role::public.app_role;
  ELSE
    _role := 'Customer'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$function$;

-- Backfill: if admin@caphub.com already exists, ensure they have the Admin role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'Admin'::public.app_role
FROM auth.users u
WHERE u.email = 'admin@caphub.com'
ON CONFLICT (user_id, role) DO NOTHING;