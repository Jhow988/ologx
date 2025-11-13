-- ================================================
-- SCRIPT PARA VERIFICAR ESTADO DO BANCO DE DADOS
-- Execute no SQL Editor do Supabase
-- ================================================

-- 1. Verificar se as tabelas principais existem
SELECT
  'TABELAS EXISTENTES' as tipo,
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Contar registros em cada tabela
DO $$
DECLARE
  table_record RECORD;
  count_value integer;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'CONTAGEM DE REGISTROS POR TABELA';
  RAISE NOTICE '============================================';

  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_record.tablename) INTO count_value;
    RAISE NOTICE '%: % registros', table_record.tablename, count_value;
  END LOOP;
END $$;

-- 3. Verificar se RLS está habilitado
SELECT
  'RLS STATUS' as tipo,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Listar policies RLS existentes
SELECT
  'POLICIES RLS' as tipo,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Verificar estrutura da tabela companies
SELECT
  'ESTRUTURA: companies' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela profiles
SELECT
  'ESTRUTURA: profiles' as tipo,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. Verificar empresas existentes
SELECT
  'EMPRESAS EXISTENTES' as tipo,
  id,
  name,
  email,
  status,
  created_at
FROM companies
ORDER BY created_at DESC;

-- 8. Verificar usuários/perfis existentes
SELECT
  'PERFIS EXISTENTES' as tipo,
  p.id,
  p.full_name,
  p.role,
  p.is_super_admin,
  p.company_id,
  c.name as company_name,
  p.created_at
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.created_at DESC;

-- 9. Verificar usuários no auth.users
SELECT
  'USUÁRIOS AUTH' as tipo,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 10. Verificar funções personalizadas
SELECT
  'FUNÇÕES CUSTOMIZADAS' as tipo,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_super_admin',
    'get_my_company_id',
    'auto_fill_company_id',
    'seed_default_financial_categories',
    'get_financial_balance'
  )
ORDER BY routine_name;

-- 11. Verificar triggers
SELECT
  'TRIGGERS' as tipo,
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 12. Verificar índices
SELECT
  'ÍNDICES' as tipo,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ================================================
-- FIM DA VERIFICAÇÃO
-- ================================================
-- Copie TODOS os resultados e envie para análise
-- ================================================
