-- ==============================================================================
-- FIX: Problemas com coluna status e trigger
-- ==============================================================================

-- 1. Verificar se a coluna status existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'status';

-- 2. Se não existir, adicionar coluna status
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
CHECK (status IN ('pending', 'active', 'inactive'));

-- 3. Atualizar usuários existentes para 'active'
UPDATE profiles
SET status = 'active'
WHERE status IS NULL;

-- 4. Verificar trigger existente
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_email_confirmed';

-- 5. Recriar função do trigger
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- When user confirms email, update profile status to active
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
    UPDATE public.profiles
    SET status = 'active'
    WHERE id = NEW.id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_email_confirmed();

-- 7. Verificar políticas RLS da tabela profiles
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';

-- 8. IMPORTANTE: Garantir que o usuário pode inserir na coluna status
-- Verifique se há alguma política RLS bloqueando INSERT com status

-- 9. Teste manual: criar usuário de teste
-- Execute isso para testar se funciona:
/*
INSERT INTO profiles (id, full_name, role, company_id, status)
VALUES (
  'test-user-id-123',
  'Teste Usuario',
  'operator',
  (SELECT id FROM companies LIMIT 1),
  'pending'
);

-- Se funcionar, delete o teste:
DELETE FROM profiles WHERE id = 'test-user-id-123';
*/

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
