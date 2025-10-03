-- Passo 1: Remover políticas antigas para evitar conflitos.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on role" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users in the same company" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- Passo 2: Recriar as políticas da tabela 'profiles' de forma segura.
CREATE POLICY "Enable read access for own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable update for users to update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Passo 3: Adicionar colunas à tabela 'companies' para salvar os dados da empresa.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS document TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address TEXT;

-- Passo 4: Corrigir avisos de segurança (boa prática).
ALTER FUNCTION IF EXISTS public.get_my_claims() SET search_path = public;
ALTER FUNCTION IF EXISTS public.get_my_company_id() SET search_path = public;
