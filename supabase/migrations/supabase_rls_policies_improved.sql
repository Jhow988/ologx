-- ================================================
-- POLÍTICAS RLS MELHORADAS - SUPABASE
-- Inclui correções e melhorias para super_admin
-- ================================================

-- 1. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view company profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own company" ON companies;
DROP POLICY IF EXISTS "Super admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Super admins can update companies" ON companies;
DROP POLICY IF EXISTS "Super admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Super admins can delete companies" ON companies;

-- Remover policies de todas as outras tabelas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('clients', 'vehicles', 'trips', 'maintenances',
                         'financial_categories', 'financial_subcategories',
                         'financial_records')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Users can view company %s" ON %I', r.tablename, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert company %s" ON %I', r.tablename, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update company %s" ON %I', r.tablename, r.tablename);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete company %s" ON %I', r.tablename, r.tablename);
    END LOOP;
END $$;

-- 2. Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- 3. Função helper para verificar se é super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()),
    false
  )
$$;

-- 4. Função helper para obter company_id do usuário
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

-- ================================================
-- POLICIES PARA PROFILES
-- ================================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Usuários podem ver perfis da mesma empresa
CREATE POLICY "Users can view company profiles"
ON profiles FOR SELECT
USING (
  company_id = get_my_company_id()
  AND company_id IS NOT NULL
);

-- Super admins podem ver todos os perfis
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
USING (is_super_admin());

-- Super admins podem inserir perfis
CREATE POLICY "Super admins can insert profiles"
ON profiles FOR INSERT
WITH CHECK (is_super_admin());

-- Super admins podem atualizar todos os perfis
CREATE POLICY "Super admins can update all profiles"
ON profiles FOR UPDATE
USING (is_super_admin());

-- Super admins podem deletar perfis
CREATE POLICY "Super admins can delete profiles"
ON profiles FOR DELETE
USING (is_super_admin());

-- ================================================
-- POLICIES PARA COMPANIES
-- ================================================

-- Usuários podem ver sua própria empresa
CREATE POLICY "Users can view own company"
ON companies FOR SELECT
USING (
  id = get_my_company_id()
);

-- Admins da empresa podem atualizar sua empresa
CREATE POLICY "Company admins can update company"
ON companies FOR UPDATE
USING (
  id = get_my_company_id()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Super admins podem ver todas as empresas
CREATE POLICY "Super admins can view all companies"
ON companies FOR SELECT
USING (is_super_admin());

-- Super admins podem inserir empresas
CREATE POLICY "Super admins can insert companies"
ON companies FOR INSERT
WITH CHECK (is_super_admin());

-- Super admins podem atualizar empresas
CREATE POLICY "Super admins can update companies"
ON companies FOR UPDATE
USING (is_super_admin());

-- Super admins podem deletar empresas
CREATE POLICY "Super admins can delete companies"
ON companies FOR DELETE
USING (is_super_admin());

-- ================================================
-- MACRO PARA CRIAR POLICIES PADRÃO
-- ================================================

CREATE OR REPLACE FUNCTION create_standard_policies(table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- SELECT
  EXECUTE format('
    CREATE POLICY "Users can view company %s"
    ON %I FOR SELECT
    USING (company_id = get_my_company_id() OR is_super_admin())
  ', table_name, table_name);

  -- INSERT
  EXECUTE format('
    CREATE POLICY "Users can insert company %s"
    ON %I FOR INSERT
    WITH CHECK (
      (company_id = get_my_company_id() AND get_my_company_id() IS NOT NULL)
      OR is_super_admin()
    )
  ', table_name, table_name);

  -- UPDATE
  EXECUTE format('
    CREATE POLICY "Users can update company %s"
    ON %I FOR UPDATE
    USING (company_id = get_my_company_id() OR is_super_admin())
  ', table_name, table_name);

  -- DELETE
  EXECUTE format('
    CREATE POLICY "Users can delete company %s"
    ON %I FOR DELETE
    USING (company_id = get_my_company_id() OR is_super_admin())
  ', table_name, table_name);
END;
$$;

-- 5. Aplicar policies padrão em todas as tabelas
SELECT create_standard_policies('clients');
SELECT create_standard_policies('vehicles');
SELECT create_standard_policies('trips');
SELECT create_standard_policies('maintenances');
SELECT create_standard_policies('financial_categories');
SELECT create_standard_policies('financial_subcategories');
SELECT create_standard_policies('financial_records');

-- ================================================
-- TRIGGERS PARA AUTO-FILL DE COMPANY_ID
-- ================================================

-- Função para preencher company_id automaticamente
CREATE OR REPLACE FUNCTION auto_fill_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id := get_my_company_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Criar triggers para todas as tabelas relevantes
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT unnest(ARRAY['clients', 'vehicles', 'trips', 'maintenances',
                            'financial_categories', 'financial_subcategories',
                            'financial_records'])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS auto_fill_company_id_trigger ON %I;
            CREATE TRIGGER auto_fill_company_id_trigger
            BEFORE INSERT ON %I
            FOR EACH ROW
            EXECUTE FUNCTION auto_fill_company_id();
        ', table_name, table_name);
    END LOOP;
END $$;

-- ================================================
-- PERMISSÕES PARA AUTENTICAÇÃO
-- ================================================

-- Permitir que novos usuários criem empresas e perfis durante signup
CREATE POLICY "Allow signup to create company"
ON companies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow signup to create profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_company_id ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_company_id ON maintenances(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_company_id ON financial_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_subcategories_company_id ON financial_subcategories(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_company_id ON financial_records(company_id);

-- ================================================
-- VERIFICAÇÃO DE INTEGRIDADE
-- ================================================

-- Comentários úteis
COMMENT ON FUNCTION is_super_admin() IS 'Retorna true se o usuário atual é super admin';
COMMENT ON FUNCTION get_my_company_id() IS 'Retorna o company_id do usuário atual';
COMMENT ON FUNCTION auto_fill_company_id() IS 'Preenche automaticamente o company_id em novos registros';
COMMENT ON FUNCTION create_standard_policies(text) IS 'Cria policies padrão de CRUD para uma tabela';

-- ================================================
-- DONE!
-- ================================================
-- Execute este script no SQL Editor do Supabase
-- Ele irá configurar todas as políticas de segurança
-- ================================================
