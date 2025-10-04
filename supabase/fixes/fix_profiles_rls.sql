-- Remover todas as políticas existentes na tabela profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_temp_all" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to manage their own company's profiles" ON public.profiles;

-- Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar política simples: usuários podem ver e editar seu próprio perfil
CREATE POLICY "profiles_own_select"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "profiles_own_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Usuários podem ver outros perfis da mesma empresa (SEM recursão)
CREATE POLICY "profiles_company_select"
ON public.profiles FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT p.company_id
    FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);
