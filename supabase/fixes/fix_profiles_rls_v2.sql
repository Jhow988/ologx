-- Remover TODAS as políticas da tabela profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_temp_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_company_select" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to manage their own company's profiles" ON public.profiles;

-- Desabilitar RLS temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar UMA ÚNICA política permissiva para tudo
-- Isso permite que usuários autenticados vejam e editem qualquer perfil (temporário para desenvolvimento)
CREATE POLICY "profiles_all_access"
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
