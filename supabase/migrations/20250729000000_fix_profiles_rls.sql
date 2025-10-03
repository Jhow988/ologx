-- Drop existing policies on profiles to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for own profile and company" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users in the same company" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;


-- Function to get the company_id of the current user
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
DECLARE
  company_id_val UUID;
BEGIN
  SELECT company_id INTO company_id_val FROM public.profiles WHERE id = auth.uid();
  RETURN company_id_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_super_admin_val BOOLEAN;
BEGIN
  SELECT is_super_admin INTO is_super_admin_val FROM public.profiles WHERE id = auth.uid();
  RETURN is_super_admin_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Recreate policies correctly

-- 1. Users can read their own profile. This is the most important one to fix the recursion.
CREATE POLICY "Allow authenticated users to read their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Users can read profiles of other users in the same company.
CREATE POLICY "Enable read access for users in the same company"
ON public.profiles FOR SELECT
TO authenticated
USING (company_id = get_my_company_id());

-- 3. Users can update their own profile.
CREATE POLICY "Enable update for own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
