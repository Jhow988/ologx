-- =================================================================
-- MASTER SCRIPT TO RESET AND FIX RLS POLICIES AND HELPER FUNCTIONS
-- This script will:
-- 1. Drop all existing RLS policies on application tables.
-- 2. Drop all custom helper functions.
-- 3. Recreate helper functions correctly, using `raw_app_meta_data`.
-- 4. Recreate all RLS policies correctly.
-- =================================================================

-- Step 1: Drop all existing policies on all tables to avoid conflicts.
DROP POLICY IF EXISTS "Users can view their own company." ON public.companies;
DROP POLICY IF EXISTS "Users can view profiles in their own company" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage clients in their own company" ON public.clients;
DROP POLICY IF EXISTS "Users can manage vehicles in their own company" ON public.vehicles;
DROP POLICY IF EXISTS "Users can manage maintenances in their own company" ON public.maintenances;
DROP POLICY IF EXISTS "Users can manage trips in their own company" ON public.trips;
DROP POLICY IF EXISTS "Users can manage financial categories in their own company" ON public.financial_categories;
DROP POLICY IF EXISTS "Users can manage financial subcategories in their own company" ON public.financial_subcategories;
DROP POLICY IF EXISTS "Users can manage financial records in their own company" ON public.financial_records;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users in the same company" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on role" ON public.profiles;


-- Step 2: Drop the helper functions. CASCADE will handle dependencies.
DROP FUNCTION IF EXISTS public.get_my_claim(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_my_claims() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_company_id() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- Step 3: Recreate helper functions correctly.
-- This function now correctly checks the user's app metadata.
CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb -> claim,
    (select raw_app_meta_data from auth.users where id = auth.uid()) -> claim
  )
$$;

-- This function gets the user's company_id from the claims.
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_my_claim('company_id'))::uuid;
$$;

-- Step 4: Recreate all RLS policies correctly.

-- Table: companies
CREATE POLICY "Users can view their own company."
ON public.companies FOR SELECT
USING (id = public.get_my_company_id());

-- Table: profiles
CREATE POLICY "Users can view profiles in their own company"
ON public.profiles FOR SELECT
USING (company_id = public.get_my_company_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Table: clients
CREATE POLICY "Users can manage clients in their own company"
ON public.clients FOR ALL
USING (company_id = public.get_my_company_id());

-- Table: vehicles
CREATE POLICY "Users can manage vehicles in their own company"
ON public.vehicles FOR ALL
USING (company_id = public.get_my_company_id());

-- Table: maintenances
CREATE POLICY "Users can manage maintenances in their own company"
ON public.maintenances FOR ALL
USING (company_id = public.get_my_company_id());

-- Table: trips
CREATE POLICY "Users can manage trips in their own company"
ON public.trips FOR ALL
USING (company_id = public.get_my_company_id());

-- Table: financial_categories
CREATE POLICY "Users can manage financial categories in their own company"
ON public.financial_categories FOR ALL
USING (company_id = public.get_my_company_id());

-- Table: financial_subcategories
CREATE POLICY "Users can manage financial subcategories in their own company"
ON public.financial_subcategories FOR ALL
USING (company_id = public.get_my_company_id());

-- Table: financial_records
CREATE POLICY "Users can manage financial records in their own company"
ON public.financial_records FOR ALL
USING (company_id = public.get_my_company_id());
