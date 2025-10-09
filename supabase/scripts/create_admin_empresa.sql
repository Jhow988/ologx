-- Script para criar Admin de Empresa manualmente no banco de dados
-- Execute este SQL no painel do Supabase: SQL Editor

-- ATENÇÃO: Substitua os valores abaixo antes de executar:
-- 1. 'admin@empresa.com' pelo email do admin
-- 2. 'SenhaForte123!' pela senha desejada
-- 3. ID da empresa (você precisa saber qual é)

-- PRIMEIRO: Consultar empresas existentes para pegar o ID
-- Descomente a linha abaixo para ver as empresas:
-- SELECT id, name, cnpj FROM companies;

-- SEGUNDO: Criar o Admin
DO $$
DECLARE
  new_user_id uuid;
  target_company_id uuid;
BEGIN
  -- ALTERE AQUI: ID da empresa (copie da query acima)
  target_company_id := 'COLE_O_ID_DA_EMPRESA_AQUI'; -- exemplo: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

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
    'admin@empresa.com', -- ALTERE AQUI: Email do admin
    crypt('SenhaForte123!', gen_salt('bf')), -- ALTERE AQUI: Senha
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

  -- Criar profile do admin vinculado à empresa
  INSERT INTO public.profiles (
    id,
    company_id,
    full_name,
    role,
    is_super_admin
  ) VALUES (
    new_user_id,
    target_company_id, -- Vincula à empresa
    'Administrador da Empresa', -- ALTERE AQUI: Nome do admin
    'admin',
    false -- NÃO é super admin
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
    json_build_object('sub', new_user_id::text, 'email', 'admin@empresa.com'), -- ALTERE AQUI: Email
    'email',
    NOW(),
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Admin criado com sucesso! User ID: %, Company ID: %', new_user_id, target_company_id;
END $$;

-- RESUMO DO QUE ALTERAR:
-- 1. Linha 15: Descomente para ver as empresas e pegar o ID
-- 2. Linha 22: Cole o ID da empresa
-- 3. Linha 37: Email do admin
-- 4. Linha 38: Senha do admin
-- 5. Linha 54: Nome do admin
-- 6. Linha 67: Email do admin (mesmo da linha 37)
