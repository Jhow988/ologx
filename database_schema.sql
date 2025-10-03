-- ================================================
-- SCHEMA DO BANCO DE DADOS - OLOGX TRANSPORTES
-- Execute este script PRIMEIRO no SQL Editor do Supabase
-- ================================================

-- ================================================
-- 1. EXTENSÕES
-- ================================================

-- Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 2. TABELA: COMPANIES (Empresas)
-- ================================================

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  cnpj text,
  address text,
  city text,
  state text,
  zip_code text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 3. TABELA: PROFILES (Perfis de Usuários)
-- ================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'driver')),
  is_super_admin boolean DEFAULT false,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 4. TABELA: CLIENTS (Clientes)
-- ================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  document text, -- CPF ou CNPJ
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 5. TABELA: VEHICLES (Veículos)
-- ================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate text NOT NULL,
  model text,
  brand text,
  year integer,
  type text CHECK (type IN ('truck', 'van', 'car', 'motorcycle', 'other')),
  capacity numeric,
  fuel_type text CHECK (fuel_type IN ('diesel', 'gasoline', 'ethanol', 'electric', 'hybrid')),
  status text DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'inactive')),
  current_km numeric DEFAULT 0,
  renavam text,
  chassis text,
  color text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, plate)
);

-- ================================================
-- 6. TABELA: TRIPS (Viagens)
-- ================================================

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  origin text NOT NULL,
  destination text NOT NULL,
  distance numeric,

  start_date timestamptz,
  end_date timestamptz,
  estimated_date timestamptz,

  start_km numeric,
  end_km numeric,

  freight_value numeric,
  expense_value numeric,

  status text DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled')
  ),

  cargo_description text,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 7. TABELA: MAINTENANCES (Manutenções)
-- ================================================

CREATE TABLE IF NOT EXISTS maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

  type text NOT NULL CHECK (
    type IN ('preventive', 'corrective', 'inspection', 'other')
  ),
  description text NOT NULL,

  scheduled_date timestamptz,
  completed_date timestamptz,

  cost numeric,
  km_at_maintenance numeric,

  status text DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled')
  ),

  service_provider text,
  invoice_number text,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 8. TABELA: FINANCIAL_CATEGORIES (Categorias Financeiras)
-- ================================================

CREATE TABLE IF NOT EXISTS financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name, type)
);

-- ================================================
-- 9. TABELA: FINANCIAL_SUBCATEGORIES (Subcategorias Financeiras)
-- ================================================

CREATE TABLE IF NOT EXISTS financial_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES financial_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, name)
);

-- ================================================
-- 10. TABELA: FINANCIAL_RECORDS (Lançamentos Financeiros)
-- ================================================

CREATE TABLE IF NOT EXISTS financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES financial_categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES financial_subcategories(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,

  type text NOT NULL CHECK (type IN ('income', 'expense')),
  description text NOT NULL,
  amount numeric NOT NULL,

  due_date date NOT NULL,
  paid_date date,

  status text DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'overdue', 'cancelled')
  ),

  payment_method text CHECK (
    payment_method IN ('cash', 'debit', 'credit', 'pix', 'transfer', 'check', 'other')
  ),

  notes text,
  attachments jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ================================================
-- 11. TRIGGERS PARA UPDATED_AT
-- ================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_maintenances_updated_at
  BEFORE UPDATE ON maintenances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_financial_categories_updated_at
  BEFORE UPDATE ON financial_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_financial_subcategories_updated_at
  BEFORE UPDATE ON financial_subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_financial_records_updated_at
  BEFORE UPDATE ON financial_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- 12. ÍNDICES PARA PERFORMANCE
-- ================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_company_id ON trips(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_client_id ON trips(client_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);

-- Maintenances
CREATE INDEX IF NOT EXISTS idx_maintenances_company_id ON maintenances(company_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_vehicle_id ON maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenances_status ON maintenances(status);

-- Financial Categories
CREATE INDEX IF NOT EXISTS idx_financial_categories_company_id ON financial_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_categories_type ON financial_categories(type);

-- Financial Subcategories
CREATE INDEX IF NOT EXISTS idx_financial_subcategories_company_id ON financial_subcategories(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_subcategories_category_id ON financial_subcategories(category_id);

-- Financial Records
CREATE INDEX IF NOT EXISTS idx_financial_records_company_id ON financial_records(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_type ON financial_records(type);
CREATE INDEX IF NOT EXISTS idx_financial_records_status ON financial_records(status);
CREATE INDEX IF NOT EXISTS idx_financial_records_due_date ON financial_records(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_records_category_id ON financial_records(category_id);

-- ================================================
-- 13. VIEWS ÚTEIS
-- ================================================

-- View: Viagens com informações relacionadas
CREATE OR REPLACE VIEW trips_with_details AS
SELECT
  t.*,
  c.name as client_name,
  v.plate as vehicle_plate,
  v.model as vehicle_model,
  p.full_name as driver_name
FROM trips t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN profiles p ON t.driver_id = p.id;

-- View: Resumo financeiro por categoria
CREATE OR REPLACE VIEW financial_summary AS
SELECT
  fr.company_id,
  fc.name as category_name,
  fc.type,
  COUNT(fr.id) as record_count,
  SUM(fr.amount) as total_amount,
  SUM(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END) as paid_amount,
  SUM(CASE WHEN fr.status = 'pending' THEN fr.amount ELSE 0 END) as pending_amount
FROM financial_records fr
LEFT JOIN financial_categories fc ON fr.category_id = fc.id
GROUP BY fr.company_id, fc.name, fc.type;

-- ================================================
-- 14. FUNÇÕES ÚTEIS
-- ================================================

-- Função: Calcular total de viagens de um veículo
CREATE OR REPLACE FUNCTION get_vehicle_total_trips(vehicle_uuid uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM trips
  WHERE vehicle_id = vehicle_uuid
  AND status = 'completed';
$$ LANGUAGE sql STABLE;

-- Função: Calcular total gasto em manutenção de um veículo
CREATE OR REPLACE FUNCTION get_vehicle_total_maintenance_cost(vehicle_uuid uuid)
RETURNS numeric AS $$
  SELECT COALESCE(SUM(cost), 0)
  FROM maintenances
  WHERE vehicle_id = vehicle_uuid
  AND status = 'completed';
$$ LANGUAGE sql STABLE;

-- Função: Calcular saldo financeiro
CREATE OR REPLACE FUNCTION get_financial_balance(comp_id uuid)
RETURNS numeric AS $$
  SELECT
    COALESCE(SUM(CASE
      WHEN type = 'income' AND status = 'paid' THEN amount
      WHEN type = 'expense' AND status = 'paid' THEN -amount
      ELSE 0
    END), 0)
  FROM financial_records
  WHERE company_id = comp_id;
$$ LANGUAGE sql STABLE;

-- ================================================
-- 15. DADOS INICIAIS (SEED)
-- ================================================

-- Categorias financeiras padrão para novas empresas
CREATE OR REPLACE FUNCTION seed_default_financial_categories(comp_id uuid)
RETURNS void AS $$
BEGIN
  -- Receitas
  INSERT INTO financial_categories (company_id, name, type, color) VALUES
    (comp_id, 'Frete', 'income', '#10b981'),
    (comp_id, 'Serviços', 'income', '#3b82f6'),
    (comp_id, 'Outras Receitas', 'income', '#8b5cf6');

  -- Despesas
  INSERT INTO financial_categories (company_id, name, type, color) VALUES
    (comp_id, 'Combustível', 'expense', '#ef4444'),
    (comp_id, 'Manutenção', 'expense', '#f59e0b'),
    (comp_id, 'Salários', 'expense', '#6366f1'),
    (comp_id, 'Impostos', 'expense', '#ec4899'),
    (comp_id, 'Seguro', 'expense', '#14b8a6'),
    (comp_id, 'Outras Despesas', 'expense', '#64748b');
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 16. COMENTÁRIOS
-- ================================================

COMMENT ON TABLE companies IS 'Empresas cadastradas no sistema';
COMMENT ON TABLE profiles IS 'Perfis de usuários vinculados às empresas';
COMMENT ON TABLE clients IS 'Clientes das empresas';
COMMENT ON TABLE vehicles IS 'Veículos da frota';
COMMENT ON TABLE trips IS 'Viagens/Serviços realizados';
COMMENT ON TABLE maintenances IS 'Manutenções dos veículos';
COMMENT ON TABLE financial_categories IS 'Categorias financeiras (receitas e despesas)';
COMMENT ON TABLE financial_subcategories IS 'Subcategorias financeiras';
COMMENT ON TABLE financial_records IS 'Lançamentos financeiros';

COMMENT ON FUNCTION get_vehicle_total_trips(uuid) IS 'Retorna total de viagens completadas de um veículo';
COMMENT ON FUNCTION get_vehicle_total_maintenance_cost(uuid) IS 'Retorna total gasto em manutenção de um veículo';
COMMENT ON FUNCTION get_financial_balance(uuid) IS 'Retorna saldo financeiro de uma empresa';
COMMENT ON FUNCTION seed_default_financial_categories(uuid) IS 'Cria categorias financeiras padrão para uma empresa';

-- ================================================
-- CONCLUÍDO!
-- ================================================
-- Após executar este script:
-- 1. Execute supabase_rls_policies_improved.sql
-- 2. Configure autenticação e emails
-- 3. Crie o primeiro super admin
-- ================================================
