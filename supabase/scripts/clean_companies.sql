-- ================================================
-- DELETAR EMPRESAS DESNECESSÁRIAS
-- Mantém apenas: ALEXANDER DOMINGOS PEREIRA TRANSPORTES
-- ================================================

-- 1. Verificar empresas antes de deletar
SELECT id, name, cnpj, status
FROM companies
ORDER BY name;

-- 2. Deletar todas as empresas EXCETO "ALEXANDER DOMINGOS PEREIRA TRANSPORTES"
-- IMPORTANTE: Isso vai deletar em CASCADE todos os dados relacionados (clientes, veículos, etc)
DELETE FROM companies
WHERE name != 'ALEXANDER DOMINGOS PEREIRA TRANSPORTES';

-- 3. Verificar resultado (deve sobrar apenas 1 empresa)
SELECT id, name, cnpj, email, status
FROM companies;

-- 4. Verificar perfis restantes
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.is_super_admin,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.is_super_admin DESC;

-- 5. Contar dados restantes
SELECT
  'companies' as tabela, COUNT(*) as total FROM companies
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'trips', COUNT(*) FROM trips;
