-- ============================================
-- FIX PARA POLÍTICAS RLS - SEM RECURSÃO
-- ============================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS (limpar tudo)
DROP POLICY IF EXISTS "Users can view vehicles from their company for joins" ON vehicles;
DROP POLICY IF EXISTS "Users can view profiles from their company for joins" ON profiles;
DROP POLICY IF EXISTS "Users can view clients from their company for joins" ON clients;

-- Remover políticas antigas de profiles que causam recursão
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same company" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 2. CRIAR FUNÇÃO HELPER (sem recursão) - usar public schema
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 3. POLÍTICAS PARA PROFILES (sem recursão)
CREATE POLICY "profiles_select_own_company"
ON profiles FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id()
  OR id = auth.uid()
);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 4. POLÍTICAS PARA VEHICLES
CREATE POLICY "vehicles_select_own_company"
ON vehicles FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id());

CREATE POLICY "vehicles_insert_own_company"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "vehicles_update_own_company"
ON vehicles FOR UPDATE
TO authenticated
USING (company_id = public.get_user_company_id());

CREATE POLICY "vehicles_delete_own_company"
ON vehicles FOR DELETE
TO authenticated
USING (company_id = public.get_user_company_id());

-- 5. POLÍTICAS PARA CLIENTS
CREATE POLICY "clients_select_own_company"
ON clients FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id());

CREATE POLICY "clients_insert_own_company"
ON clients FOR INSERT
TO authenticated
WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "clients_update_own_company"
ON clients FOR UPDATE
TO authenticated
USING (company_id = public.get_user_company_id());

CREATE POLICY "clients_delete_own_company"
ON clients FOR DELETE
TO authenticated
USING (company_id = public.get_user_company_id());

-- 6. POLÍTICAS PARA TRIPS
DROP POLICY IF EXISTS "trips_select_own_company" ON trips;
DROP POLICY IF EXISTS "trips_insert_own_company" ON trips;
DROP POLICY IF EXISTS "trips_update_own_company" ON trips;
DROP POLICY IF EXISTS "trips_delete_own_company" ON trips;

CREATE POLICY "trips_select_own_company"
ON trips FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id());

CREATE POLICY "trips_insert_own_company"
ON trips FOR INSERT
TO authenticated
WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "trips_update_own_company"
ON trips FOR UPDATE
TO authenticated
USING (company_id = public.get_user_company_id());

CREATE POLICY "trips_delete_own_company"
ON trips FOR DELETE
TO authenticated
USING (company_id = public.get_user_company_id());
