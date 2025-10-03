-- =============================================
-- Corrige a política de RLS da tabela 'profiles' para evitar recursão infinita.
-- Cria funções com SECURITY DEFINER para buscar dados de forma segura.
-- =============================================

-- Remove políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for company members" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users for own profile" ON public.profiles;

-- Função segura para obter o company_id do usuário atual
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT company_id FROM profiles WHERE id = auth.uid());
END;
$$;

-- Função segura para verificar se o ID do perfil pertence ao usuário atual
CREATE OR REPLACE FUNCTION is_my_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN profile_id = auth.uid();
END;
$$;

-- Cria a nova política de SELECT (leitura)
CREATE POLICY "Enable read access for own profile and company" ON public.profiles
FOR SELECT USING (
  is_my_profile(id) OR (get_my_company_id() = company_id)
);

-- Cria a nova política de UPDATE
CREATE POLICY "Enable update for users for own profile" ON public.profiles
FOR UPDATE USING (
  is_my_profile(id)
) WITH CHECK (
  is_my_profile(id)
);
