-- ============================================
-- FIX RLS - SOLUÇÃO SIMPLES SEM RECURSÃO
-- ============================================

-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view vehicles from their company for joins" ON vehicles;
DROP POLICY IF EXISTS "Users can view profiles from their company for joins" ON profiles;
DROP POLICY IF EXISTS "Users can view clients from their company for joins" ON clients;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same company" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own_company" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "vehicles_select_own_company" ON vehicles;
DROP POLICY IF EXISTS "vehicles_insert_own_company" ON vehicles;
DROP POLICY IF EXISTS "vehicles_update_own_company" ON vehicles;
DROP POLICY IF EXISTS "vehicles_delete_own_company" ON vehicles;
DROP POLICY IF EXISTS "clients_select_own_company" ON clients;
DROP POLICY IF EXISTS "clients_insert_own_company" ON clients;
DROP POLICY IF EXISTS "clients_update_own_company" ON clients;
DROP POLICY IF EXISTS "clients_delete_own_company" ON clients;
DROP POLICY IF EXISTS "trips_select_own_company" ON trips;
DROP POLICY IF EXISTS "trips_insert_own_company" ON trips;
DROP POLICY IF EXISTS "trips_update_own_company" ON trips;
DROP POLICY IF EXISTS "trips_delete_own_company" ON trips;

-- 2. Remover função se existir
DROP FUNCTION IF EXISTS public.get_user_company_id();

-- 3. POLÍTICAS SIMPLES PARA PROFILES (SEM SUBQUERY)
-- Usar EXISTS para evitar recursão
CREATE POLICY "profiles_select_policy"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.company_id = profiles.company_id
  )
);

CREATE POLICY "profiles_update_policy"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_insert_policy"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 4. POLÍTICAS PARA VEHICLES
CREATE POLICY "vehicles_select_policy"
ON vehicles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = vehicles.company_id
  )
);

CREATE POLICY "vehicles_insert_policy"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = vehicles.company_id
  )
);

CREATE POLICY "vehicles_update_policy"
ON vehicles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = vehicles.company_id
  )
);

CREATE POLICY "vehicles_delete_policy"
ON vehicles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = vehicles.company_id
  )
);

-- 5. POLÍTICAS PARA CLIENTS
CREATE POLICY "clients_select_policy"
ON clients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = clients.company_id
  )
);

CREATE POLICY "clients_insert_policy"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = clients.company_id
  )
);

CREATE POLICY "clients_update_policy"
ON clients FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = clients.company_id
  )
);

CREATE POLICY "clients_delete_policy"
ON clients FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = clients.company_id
  )
);

-- 6. POLÍTICAS PARA TRIPS
CREATE POLICY "trips_select_policy"
ON trips FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = trips.company_id
  )
);

CREATE POLICY "trips_insert_policy"
ON trips FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = trips.company_id
  )
);

CREATE POLICY "trips_update_policy"
ON trips FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = trips.company_id
  )
);

CREATE POLICY "trips_delete_policy"
ON trips FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = trips.company_id
  )
);
