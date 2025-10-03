-- Drop the problematic functions and any dependent policies
DROP FUNCTION IF EXISTS get_my_company_id() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

-- Recreate the functions safely
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT company_id FROM profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT is_super_admin FROM profiles WHERE id = auth.uid());
END;
$$;

-- Drop all existing policies on the profiles table to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for users based on role" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users in the same company" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile and company" ON public.profiles;
DROP POLICY IF EXISTS "Allow super admins to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read profiles in their own company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their own company" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their company" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON public.profiles;


-- Recreate the policies correctly
-- 1. Users can read their own profile. This is the key fix to prevent recursion.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Admins/Managers can read profiles of users in their own company.
CREATE POLICY "Admins can view profiles in their own company"
ON public.profiles FOR SELECT
USING (company_id = get_my_company_id() AND (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
));

-- 3. Super Admins can read all profiles.
CREATE POLICY "Super Admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_super_admin());


-- 4. Users can update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Admins can update profiles in their company (except super admins).
CREATE POLICY "Admins can update profiles in their company"
ON public.profiles FOR UPDATE
USING (company_id = get_my_company_id() AND (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
))
WITH CHECK (company_id = get_my_company_id());

-- 6. Super Admins can update any profile.
CREATE POLICY "Super Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());
