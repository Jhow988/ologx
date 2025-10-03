-- First, drop all existing SELECT policies on the profiles table to avoid conflicts.
DROP POLICY IF EXISTS "Enable read access for company members" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for company admins/managers" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on role" ON public.profiles;

-- Create a helper function to get the company_id of the currently authenticated user.
-- This function uses SECURITY DEFINER to bypass RLS and prevent recursion.
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create a helper function to get the role of the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Now, create the definitive, non-recursive SELECT policy for the profiles table.
CREATE POLICY "Enable read access for users based on role" ON public.profiles
FOR SELECT
USING (
  -- Rule 1: A user can always see their own profile.
  auth.uid() = id
  OR
  -- Rule 2: An admin or manager can see all profiles within their own company.
  (
    company_id = public.get_my_company_id() AND
    (public.get_my_role() = 'admin' OR public.get_my_role() = 'manager')
  )
);
