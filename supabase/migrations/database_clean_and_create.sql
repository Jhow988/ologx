-- ================================================
-- LIMPAR E RECRIAR BANCO DE DADOS - OLOGX
-- ================================================

-- 1. REMOVER TUDO (Views, Funções, Tabelas)
DROP VIEW IF EXISTS trips_with_details CASCADE;
DROP VIEW IF EXISTS financial_summary CASCADE;

DROP FUNCTION IF EXISTS get_vehicle_total_trips(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_vehicle_total_maintenance_cost(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_financial_balance(uuid) CASCADE;
DROP FUNCTION IF EXISTS seed_default_financial_categories(uuid) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

DROP TABLE IF EXISTS financial_records CASCADE;
DROP TABLE IF EXISTS financial_subcategories CASCADE;
DROP TABLE IF EXISTS financial_categories CASCADE;
DROP TABLE IF EXISTS maintenances CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 2. CRIAR EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. CRIAR TABELAS

-- COMPANIES
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  cnpj text,
  address text,
  city text,
  state text,
  zip_code text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT companies_status_check CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- PROFILES
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  full_name text,
  role text DEFAULT 'operator',
  is_super_admin boolean DEFAULT false,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'manager', 'operator', 'driver'))
);

-- CLIENTS
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  document text,
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clients_status_check CHECK (status IN ('active', 'inactive'))
);

-- VEHICLES
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate text NOT NULL,
  model text,
  brand text,
  year integer,
  type text,
  capacity numeric,
  fuel_type text,
  status text DEFAULT 'available',
  current_km numeric DEFAULT 0,
  renavam text,
  chassis text,
  color text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT vehicles_company_plate_unique UNIQUE(company_id, plate),
  CONSTRAINT vehicles_type_check CHECK (type IN ('truck', 'van', 'car', 'motorcycle', 'other')),
  CONSTRAINT vehicles_fuel_type_check CHECK (fuel_type IN ('diesel', 'gasoline', 'ethanol', 'electric', 'hybrid')),
  CONSTRAINT vehicles_status_check CHECK (status IN ('available', 'in_use', 'maintenance', 'inactive'))
);

-- TRIPS
CREATE TABLE trips (
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
  status text DEFAULT 'scheduled',
  cargo_description text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT trips_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- MAINTENANCES
CREATE TABLE maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type text NOT NULL,
  description text NOT NULL,
  scheduled_date timestamptz,
  completed_date timestamptz,
  cost numeric,
  km_at_maintenance numeric,
  status text DEFAULT 'scheduled',
  service_provider text,
  invoice_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT maintenances_type_check CHECK (type IN ('preventive', 'corrective', 'inspection', 'other')),
  CONSTRAINT maintenances_status_check CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- FINANCIAL_CATEGORIES
CREATE TABLE financial_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  color text,
  icon text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT financial_categories_unique UNIQUE(company_id, name, type),
  CONSTRAINT financial_categories_type_check CHECK (type IN ('income', 'expense'))
);

-- FINANCIAL_SUBCATEGORIES
CREATE TABLE financial_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES financial_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT financial_subcategories_unique UNIQUE(category_id, name)
);

-- FINANCIAL_RECORDS
CREATE TABLE financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES financial_categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES financial_subcategories(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  type text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  paid_date date,
  status text DEFAULT 'pending',
  payment_method text,
  notes text,
  attachments jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT financial_records_type_check CHECK (type IN ('income', 'expense')),
  CONSTRAINT financial_records_status_check CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  CONSTRAINT financial_records_payment_check CHECK (payment_method IN ('cash', 'debit', 'credit', 'pix', 'transfer', 'check', 'other'))
);

-- 4. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_maintenances_updated_at BEFORE UPDATE ON maintenances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_financial_categories_updated_at BEFORE UPDATE ON financial_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_financial_subcategories_updated_at BEFORE UPDATE ON financial_subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_financial_records_updated_at BEFORE UPDATE ON financial_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. ÍNDICES
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_trips_company_id ON trips(company_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_client_id ON trips(client_id);
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_start_date ON trips(start_date);
CREATE INDEX idx_maintenances_company_id ON maintenances(company_id);
CREATE INDEX idx_maintenances_vehicle_id ON maintenances(vehicle_id);
CREATE INDEX idx_maintenances_status ON maintenances(status);
CREATE INDEX idx_financial_categories_company_id ON financial_categories(company_id);
CREATE INDEX idx_financial_categories_type ON financial_categories(type);
CREATE INDEX idx_financial_subcategories_company_id ON financial_subcategories(company_id);
CREATE INDEX idx_financial_subcategories_category_id ON financial_subcategories(category_id);
CREATE INDEX idx_financial_records_company_id ON financial_records(company_id);
CREATE INDEX idx_financial_records_type ON financial_records(type);
CREATE INDEX idx_financial_records_status ON financial_records(status);
CREATE INDEX idx_financial_records_due_date ON financial_records(due_date);
CREATE INDEX idx_financial_records_category_id ON financial_records(category_id);

-- 6. VIEWS
CREATE VIEW trips_with_details AS
SELECT t.*, c.name as client_name, v.plate as vehicle_plate,
       v.model as vehicle_model, p.full_name as driver_name
FROM trips t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN profiles p ON t.driver_id = p.id;

CREATE VIEW financial_summary AS
SELECT fr.company_id, fc.name as category_name, fc.type,
       COUNT(fr.id) as record_count,
       SUM(fr.amount) as total_amount,
       SUM(CASE WHEN fr.status = 'paid' THEN fr.amount ELSE 0 END) as paid_amount,
       SUM(CASE WHEN fr.status = 'pending' THEN fr.amount ELSE 0 END) as pending_amount
FROM financial_records fr
LEFT JOIN financial_categories fc ON fr.category_id = fc.id
GROUP BY fr.company_id, fc.name, fc.type;

-- 7. FUNÇÕES ÚTEIS
CREATE FUNCTION get_vehicle_total_trips(vehicle_uuid uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM trips
  WHERE vehicle_id = vehicle_uuid AND status = 'completed';
$$ LANGUAGE sql STABLE;

CREATE FUNCTION get_vehicle_total_maintenance_cost(vehicle_uuid uuid)
RETURNS numeric AS $$
  SELECT COALESCE(SUM(cost), 0) FROM maintenances
  WHERE vehicle_id = vehicle_uuid AND status = 'completed';
$$ LANGUAGE sql STABLE;

CREATE FUNCTION get_financial_balance(comp_id uuid)
RETURNS numeric AS $$
  SELECT COALESCE(SUM(CASE
    WHEN type = 'income' AND status = 'paid' THEN amount
    WHEN type = 'expense' AND status = 'paid' THEN -amount
    ELSE 0 END), 0)
  FROM financial_records WHERE company_id = comp_id;
$$ LANGUAGE sql STABLE;

CREATE FUNCTION seed_default_financial_categories(comp_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO financial_categories (company_id, name, type, color) VALUES
    (comp_id, 'Frete', 'income', '#10b981'),
    (comp_id, 'Serviços', 'income', '#3b82f6'),
    (comp_id, 'Outras Receitas', 'income', '#8b5cf6'),
    (comp_id, 'Combustível', 'expense', '#ef4444'),
    (comp_id, 'Manutenção', 'expense', '#f59e0b'),
    (comp_id, 'Salários', 'expense', '#6366f1'),
    (comp_id, 'Impostos', 'expense', '#ec4899'),
    (comp_id, 'Seguro', 'expense', '#14b8a6'),
    (comp_id, 'Outras Despesas', 'expense', '#64748b')
  ON CONFLICT (company_id, name, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- CONCLUÍDO! ✅
-- ================================================
SELECT 'Database criado com sucesso!' as status;
