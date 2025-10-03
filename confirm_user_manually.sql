-- ==============================================================================
-- DESENVOLVIMENTO: Confirmar usuários manualmente (sem email)
-- ==============================================================================
-- Use este script APENAS EM DESENVOLVIMENTO quando atingir rate limit de emails
-- ==============================================================================

-- 1. Listar usuários não confirmados
SELECT
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 2. Confirmar usuário manualmente (substitua o EMAIL_DO_USUARIO)
-- ATENÇÃO: Execute isso para cada usuário que precisa confirmar

UPDATE auth.users
SET
  email_confirmed_at = now(),
  confirmed_at = now()
WHERE email = 'EMAIL_DO_USUARIO@exemplo.com';

-- 3. Verificar se o status do perfil foi atualizado automaticamente
SELECT
  p.id,
  p.full_name,
  p.status,
  u.email,
  u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'EMAIL_DO_USUARIO@exemplo.com';

-- Se o status não atualizou automaticamente, force manualmente:
UPDATE profiles
SET status = 'active'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'EMAIL_DO_USUARIO@exemplo.com'
);

-- ==============================================================================
-- IMPORTANTE: Em produção, SEMPRE use confirmação de email!
-- ==============================================================================
