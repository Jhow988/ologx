-- =================================================================
--  Reset and Fix RLS Policies for `profiles` table
-- =================================================================
-- This script corrects the "infinite recursion" error by resetting
-- the policies on the `profiles` table and creating them correctly
-- using SECURITY DEFINER functions to break the recursion loop.
-- =================================================================

-- Step 1: Drop all existing RLS policies on the 'profiles' table to ensure a clean slate.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their own company." ON public.profiles;
DROP POLICY IF EXISTS "Allow individual users to read their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Allow admin access to company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user access to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on company" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users on their own profile" ON public.profiles;


-- Step 2: Create a SECURITY DEFINER function to safely get the current user's company ID.
-- This function runs with elevated privileges, bypassing the RLS policy on the 'profiles' table
-- for this specific query, thus breaking the infinite recursion loop.
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 3: Create a SECURITY DEFINER function to safely get the current user's role.
-- This also helps prevent recursion when checking the user's role within a policy.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 4: Re-create the policies for the 'profiles' table correctly.

-- Policy for SELECT:
-- A user can see their own profile.
-- OR, if the user is an 'admin' or 'manager', they can see all profiles from their own company.
CREATE POLICY "Enable read access for users based on company" ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR
  (company_id = public.get_my_company_id() AND public.get_my_role() IN ('admin', 'manager'))
);

-- Policy for UPDATE:
-- Users can only update their own profile.
CREATE POLICY "Enable update for users on their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Note: INSERTs are handled by a trigger on `auth.users`, so no INSERT policy is needed for users.
-- DELETEs should be restricted, so no DELETE policy is defined for users.
