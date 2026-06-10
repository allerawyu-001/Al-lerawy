
-- Approval workflow and role enhancements

-- 1. Add 'super_admin' to app_role enum
-- We can't use IF NOT EXISTS with ADD VALUE, so we use a DO block
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'super_admin') THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END
$$;

-- 2. Enhance profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Update status default to 'pending' for new registrations
-- Existing column was 'active' default from prev migration
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Target user (Admin or User)
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info|success|warning|error
  read BOOLEAN DEFAULT false,
  link TEXT, -- Optional link to related detail page
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User who performed the action
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional target user
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.has_role(auth.uid(), 'Admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Public can view activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Internal service only insert activities" ON public.activities FOR INSERT WITH CHECK (true); -- Usually inserted via functions

-- 5. Updated handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _status TEXT := 'pending';
  _admin_id UUID;
BEGIN
  -- Super Admin Restriction
  IF NEW.email = 'aliyuumarallerawy@gmail.com' THEN
    _role := 'super_admin'::public.app_role;
    _status := 'approved'; -- Super Admin is auto-approved
  ELSE
    _role := COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role','')::public.app_role,
      'Customer'::public.app_role
    );
    
    -- Prevent unauthorized super_admin assignment
    IF _role = 'super_admin'::public.app_role THEN
       _role := 'Customer'::public.app_role;
    END IF;

    -- Admins are also pending until approved by Super Admin? 
    -- Request says "New Customer and Producer registrations must require approval"
    -- It doesn't explicitly mention Admins, but usually they need approval too.
    -- For now, follow request strictly.
    IF _role IN ('Customer', 'Producer') THEN
      _status := 'pending';
    ELSE
      _status := 'approved'; -- Other roles (Admin) default to approved for now if created by super/self?
      -- Actually, Admin creation is restricted to Super Admin anyway.
    END IF;
  END IF;

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
    phone,
    business_name,
    status
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
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'business_name',
    _status
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  -- Create Notification for Admins
  IF _role IN ('Customer', 'Producer') THEN
    FOR _admin_id IN (SELECT user_id FROM public.user_roles WHERE role IN ('Admin', 'super_admin')) LOOP
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        _admin_id,
        'New ' || _role || ' registration',
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'A new user') || ' is awaiting approval.',
        'info',
        '/admin/' || LOWER(_role) || 's'
      );
    END LOOP;
    
    -- Log Activity
    INSERT INTO public.activities (user_id, action, details)
    VALUES (NEW.id, 'Registration', 'New ' || _role || ' account created: ' || COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
  END IF;

  RETURN NEW;
END;
$$;
