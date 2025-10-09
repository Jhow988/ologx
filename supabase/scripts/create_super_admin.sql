-- Script para criar Super Admin manualmente no banco de dados
-- Execute este SQL no painel do Supabase: SQL Editor

-- ATENÇÃO: Substitua os valores abaixo antes de executar:
-- 1. 'seu-email@example.com' pelo email do super admin
-- 2. 'SuaSenhaForte123!' pela senha desejada

-- Passo 1: Criar usuário no auth.users
-- Execute este bloco primeiro e anote o user_id retornado
DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Inserir usuário na tabela auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'seu-email@example.com', -- ALTERE AQUI
    crypt('SuaSenhaForte123!', gen_salt('bf')), -- ALTERE A SENHA AQUI
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Criar profile do super admin
  INSERT INTO public.profiles (
    id,
    company_id,
    full_name,
    role,
    is_super_admin
  ) VALUES (
    new_user_id,
    NULL, -- Super admin não tem empresa
    'Super Administrador', -- ALTERE O NOME AQUI
    'admin',
    true -- Marca como super admin
  );

  -- Criar identity para o usuário
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    json_build_object('sub', new_user_id::text, 'email', 'seu-email@example.com'), -- ALTERE O EMAIL AQUI
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Super Admin criado com sucesso! User ID: %', new_user_id;
END $$;

-- IMPORTANTE:
-- 1. Substitua 'seu-email@example.com' pelo email real
-- 2. Substitua 'SuaSenhaForte123!' por uma senha forte
-- 3. Substitua 'Super Administrador' pelo nome da pessoa
-- 4. Execute todo o bloco de uma vez no SQL Editor
-- 5. Após executar, você poderá fazer login com o email e senha definidos
