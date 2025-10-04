-- Permitir leitura de veículos nos JOINs (para mostrar placa nas viagens)
DROP POLICY IF EXISTS "Users can view vehicles from their company for joins" ON vehicles;
CREATE POLICY "Users can view vehicles from their company for joins"
ON vehicles FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM profiles
    WHERE id = auth.uid()
  )
);

-- Permitir leitura de perfis (motoristas) nos JOINs
DROP POLICY IF EXISTS "Users can view profiles from their company for joins" ON profiles;
CREATE POLICY "Users can view profiles from their company for joins"
ON profiles FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM profiles
    WHERE id = auth.uid()
  ) OR id = auth.uid()
);

-- Permitir leitura de clientes nos JOINs
DROP POLICY IF EXISTS "Users can view clients from their company for joins" ON clients;
CREATE POLICY "Users can view clients from their company for joins"
ON clients FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM profiles
    WHERE id = auth.uid()
  )
);
