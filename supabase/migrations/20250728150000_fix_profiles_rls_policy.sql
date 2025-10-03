/*
# [FIX] Corrige Erro de Recursão Infinita na Tabela 'profiles'
Este script corrige o erro "infinite recursion detected in policy for relation 'profiles'" que está impedindo o login na aplicação.

## Descrição da Query:
1.  **DROP POLICY**: Remove todas as políticas de leitura (SELECT) existentes na tabela `profiles` para limpar configurações incorretas.
2.  **CREATE POLICY**: Cria uma única e segura política de leitura que permite a um usuário visualizar **apenas o seu próprio perfil**. Isso quebra o ciclo de recursão e permite que o sistema de autenticação funcione corretamente.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true
*/

-- Step 1: Drop all existing SELECT policies on the profiles table to be safe.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their own company." ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

-- Step 2: Create a new, non-recursive policy that allows users to read ONLY their own profile.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
USING (auth.uid() = id);
