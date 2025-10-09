-- Desabilitar TODOS os triggers problemáticos que interferem na criação de usuários
-- Os profiles agora são criados manualmente no código com controle total

-- Remover trigger de criação de usuário (tentava criar empresa automaticamente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remover trigger de confirmação de email (causava conflitos ao atualizar profiles)
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- IMPORTANTE: Execute estes dois comandos no SQL Editor do Supabase
-- Após executar, o código terá controle total sobre a criação de profiles
-- Isso corrige definitivamente o erro "Database error creating new user"
