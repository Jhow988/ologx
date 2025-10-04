-- ============================================
-- FIX RLS DEFINITIVO - SEM RECURSÃO
-- ============================================

-- 1. Desabilitar RLS temporariamente para limpar
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas antigas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public'
              AND tablename IN ('profiles', 'vehicles', 'clients', 'trips'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. Remover funções antigas
DROP FUNCTION IF EXISTS public.get_user_company_id();

-- 4. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 5. NOVA ABORDAGEM: Políticas mais permissivas sem recursão

-- PROFILES: Permitir ver próprio perfil + usar FOR ALL para evitar conflitos
CREATE POLICY "profiles_all_policy"
ON profiles
FOR ALL
TO authenticated
USING (
  -- Sempre permite ver/editar próprio perfil
  id = auth.uid()
  OR
  -- Permite ver outros da mesma empresa (simples, sem subquery complexa)
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
)
WITH CHECK (
  id = auth.uid()
);

-- VEHICLES: Usar política simples
CREATE POLICY "vehicles_all_policy"
ON vehicles
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
);

-- CLIENTS: Usar política simples
CREATE POLICY "clients_all_policy"
ON clients
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
);

-- TRIPS: Usar política simples
CREATE POLICY "trips_all_policy"
ON trips
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
);

-- 6. IMPORTANTE: Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_company_id ON trips(company_id);
