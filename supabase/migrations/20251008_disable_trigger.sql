-- Desabilitar o trigger problemático on_auth_user_created
-- Agora os profiles são criados manualmente no código

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- A função handle_new_user pode ser mantida para referência,
-- mas não será mais chamada automaticamente
