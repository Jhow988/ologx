-- ============================================
-- FIX RLS ULTIMATE - SEM RECURSÃO USANDO JWT
-- ============================================

-- 1. Desabilitar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. Remover funções antigas
DROP FUNCTION IF EXISTS public.get_user_company_id();

-- 4. Criar função que extrai company_id do JWT (SEM CONSULTAR TABELA)
-- Esta função NÃO causa recursão porque não consulta profiles
CREATE OR REPLACE FUNCTION auth.jwt_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'company_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- 5. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS SIMPLES - Primeiro teste: permitir tudo para authenticated
-- Vamos começar permissivo e depois restringir

CREATE POLICY "profiles_authenticated_all"
ON profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (id = auth.uid());

CREATE POLICY "vehicles_authenticated_all"
ON vehicles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "clients_authenticated_all"
ON clients
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "trips_authenticated_all"
ON trips
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Adicionar índices
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_company_id ON trips(company_id);
