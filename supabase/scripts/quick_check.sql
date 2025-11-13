-- ================================================
-- VERIFICAÇÃO RÁPIDA DO BANCO DE DADOS
-- ================================================

-- 1. Listar todas as tabelas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verificar colunas da tabela companies
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'companies'
ORDER BY ordinal_position;

-- 3. Verificar colunas da tabela profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Contar registros
SELECT
  'companies' as tabela,
  COUNT(*) as total
FROM companies
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'trips', COUNT(*) FROM trips
UNION ALL
SELECT 'financial_records', COUNT(*) FROM financial_records;

-- 5. Ver empresas existentes
SELECT id, name, email, cnpj, status, created_at
FROM companies;

-- 6. Ver perfis existentes
SELECT
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.is_super_admin,
  p.status,
  p.company_id,
  c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id;

-- 7. Ver usuários no auth
SELECT id, email, email_confirmed_at, created_at
FROM auth.users;

-- 8. Verificar RLS
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 9. Verificar se funções existem
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_super_admin', 'get_my_company_id', 'auto_fill_company_id')
ORDER BY routine_name;
