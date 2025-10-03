-- This script fixes the infinite recursion error in RLS policies by safely dropping and recreating the helper functions and policies.

-- Drop the problematic function and all dependent policies using CASCADE
DROP FUNCTION IF EXISTS public.get_my_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_claim(text) CASCADE;

-- Recreate the function to get the current user's company_id securely
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Recreate the function to get a claim from the JWT securely
CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb -> claim;
$$;


-- Re-enable RLS on the profiles table if it was disabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate the policy to allow users to read their own profile
-- This is the key fix: it checks the ID directly, avoiding recursion.
CREATE POLICY "Enable read access for own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Recreate the policy for admins/managers to view others in the same company
CREATE POLICY "Enable read access for users in the same company"
ON public.profiles
FOR SELECT
USING (
  (get_my_claim('user_role'::text) = '"admin"'::jsonb) OR
  (get_my_claim('user_role'::text) = '"manager"'::jsonb)
);

-- Recreate the policy for users to update their own profile
CREATE POLICY "Enable update for users for own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Re-enable RLS on the companies table if it was disabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Recreate the policy for users to view their own company's details
CREATE POLICY "Users can view their own company."
ON public.companies
FOR SELECT
USING (id = get_my_company_id());
