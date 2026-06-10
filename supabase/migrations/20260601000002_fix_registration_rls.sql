-- Fix RLS error during user registration
-- Allow users to insert their own profile and ensure associated tables support inserts

-- Profiles: Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- Notifications: Allow internal/authenticated inserts (since trigger creates them)
-- Sometimes triggers running under invoker context need explicit permissions
CREATE POLICY "Allow trigger to insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK ( true );

-- User Roles: Allow trigger/user to insert their initial role
CREATE POLICY "Allow trigger to insert user_roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

-- Activities: Ensure activities can be inserted smoothly
-- (There was already a policy, but ensuring it exists explicitly for all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Allow inserts for activities'
    ) THEN
        CREATE POLICY "Allow inserts for activities" ON public.activities FOR INSERT WITH CHECK (true);
    END IF;
END
$$;
