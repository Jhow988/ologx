-- ================================================
-- CORRIGIR INCONSISTÊNCIAS NOS DADOS
-- ================================================

-- 1. Atualizar emails nos profiles baseado no auth.users
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
  AND profiles.email IS NULL;

-- 2. Verificar resultado
SELECT
  p.id,
  p.full_name,
  p.email as profile_email,
  au.email as auth_email,
  CASE
    WHEN p.email = au.email THEN '✅ OK'
    WHEN p.email IS NULL AND au.email IS NOT NULL THEN '⚠️ NULL no profile'
    WHEN p.email != au.email THEN '❌ Diferente'
    ELSE '❓ Outro'
  END as status
FROM profiles p
INNER JOIN auth.users au ON p.id = au.id;

-- 3. Verificar se funções RLS existem
SELECT
  routine_name,
  CASE
    WHEN routine_name = 'is_super_admin' THEN '✅'
    WHEN routine_name = 'get_my_company_id' THEN '✅'
    WHEN routine_name = 'auto_fill_company_id' THEN '✅'
    ELSE '❓'
  END as exists
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_super_admin', 'get_my_company_id', 'auto_fill_company_id');

-- 4. Listar todos os usuários após correção
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
LEFT JOIN companies c ON p.company_id = c.id
ORDER BY p.is_super_admin DESC, p.created_at;
