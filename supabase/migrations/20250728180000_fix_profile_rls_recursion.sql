-- Drop existing policies and functions to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for own profile and company" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin update access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual and admin update access" ON public.profiles;
DROP FUNCTION IF EXISTS public.get_my_company_id();
DROP FUNCTION IF EXISTS public.get_my_role(uuid);

-- Create a security definer function to get the user's company_id without recursion
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create a security definer function to get a user's role
CREATE OR REPLACE FUNCTION public.get_my_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;


-- Recreate policies with the correct, non-recursive logic

-- 1. SELECT Policy: Users can see their own profile, or other profiles in their company.
CREATE POLICY "Enable read access for own profile and company"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR
  company_id = public.get_my_company_id()
);

-- 2. INSERT Policy: Authenticated users can insert their own profile.
-- This is typically handled by a trigger on auth.users.
CREATE POLICY "Enable insert for authenticated users"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. UPDATE Policy: Users can update their own profile. Admins/Managers can update others in their company.
CREATE POLICY "Allow individual and admin update access"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR
  (
    company_id = public.get_my_company_id() AND
    (
      public.get_my_role(auth.uid()) = 'admin' OR
      public.get_my_role(auth.uid()) = 'manager'
    )
  )
)
WITH CHECK (
  auth.uid() = id OR
  (
    company_id = public.get_my_company_id() AND
    (
      public.get_my_role(auth.uid()) = 'admin' OR
      public.get_my_role(auth.uid()) = 'manager'
    )
  )
);
