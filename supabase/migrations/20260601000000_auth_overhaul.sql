
-- Overhaul profiles table to include all requested fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS second_name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS local_government TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint for username format
-- Only letters, numbers, underscores, and hyphens allowed
ALTER TABLE public.profiles
  ADD CONSTRAINT username_format_check 
  CHECK (username ~* '^[a-zA-Z0-9_-]+$');

-- Create OTPs table
CREATE TABLE IF NOT EXISTS public.otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL, -- 'email' | 'phone'
  purpose TEXT NOT NULL, -- 'verification' | 'password_reset'
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on OTPs (mostly for internal use, but good practice)
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal service only" ON public.otps FOR ALL USING (false);

-- Update handle_new_user trigger to handle enriched metadata
-- This trigger runs after a user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  INSERT INTO public.profiles (
    id, 
    first_name, 
    second_name, 
    username, 
    date_of_birth, 
    gender, 
    state, 
    local_government, 
    avatar_url,
    phone
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'second_name',
    NEW.raw_user_meta_data->>'username',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'local_government',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'phone'
  );

  _role := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'role','')::public.app_role,
    'Customer'::public.app_role
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;
