-- Corrigir função handle_new_user para suportar convites
-- Quando company_id vem no metadata, não criar nova empresa

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  target_company_id uuid;
  user_role text;
  user_is_super_admin boolean;
BEGIN
  -- Verificar se company_id foi fornecido no metadata (convite para empresa existente)
  IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    target_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'admin');
    user_is_super_admin := COALESCE((new.raw_user_meta_data->>'is_super_admin')::boolean, false);
  ELSE
    -- Criar nova empresa para o usuário (caso de signup normal)
    INSERT INTO public.companies (name)
    VALUES (COALESCE(new.raw_user_meta_data->>'company_name', 'Minha Empresa'))
    RETURNING id INTO target_company_id;

    user_role := 'admin'; -- Primeiro usuário da empresa é admin
    user_is_super_admin := false;
  END IF;

  -- Criar perfil do usuário vinculado à empresa
  INSERT INTO public.profiles (id, company_id, full_name, role, is_super_admin)
  VALUES (
    new.id,
    target_company_id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    user_role,
    user_is_super_admin
  );

  RETURN new;
END;
$$;
