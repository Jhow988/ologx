/*
# [Fix] Corrige a Recursão Infinita na Política de Segurança de Perfis
[Este script corrige um erro crítico de "recursão infinita" que impedia o login e o carregamento da aplicação. Ele substitui as regras de segurança (RLS) da tabela 'profiles' por uma versão correta e segura.]

## Query Description: [Esta operação apaga e recria as políticas de segurança da tabela de perfis de usuário. Não há risco de perda de dados. A correção é essencial para que o sistema de autenticação e permissões funcione corretamente.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tabela Afetada: public.profiles
- Ações: DROP POLICY, CREATE FUNCTION (SECURITY DEFINER), CREATE POLICY

## Security Implications:
- RLS Status: [Modificado]
- Policy Changes: [Yes]
- Auth Requirements: [N/A]

## Performance Impact:
- Indexes: [N/A]
- Triggers: [N/A]
- Estimated Impact: [Baixo. A nova função é otimizada e a política é mais eficiente.]
*/

-- 1. Apagar políticas de SELECT antigas e problemáticas na tabela 'profiles' para garantir um estado limpo.
DROP POLICY IF EXISTS "Enable read access for own profile and company" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users in the same company" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;


-- 2. Criar uma função segura que obtém o company_id do usuário atual.
-- A cláusula SECURITY DEFINER é crucial. Ela faz a função rodar com permissões elevadas,
-- o que quebra o loop de recursão, pois a consulta interna da função não aciona a política de segurança novamente.
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
-- Defina o search_path para evitar problemas de sequestro de caminho de busca.
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT company_id FROM public.profiles WHERE id = auth.uid());
END;
$$;


-- 3. Recriar a política de SELECT usando uma abordagem segura.
-- Esta política combina duas condições com OR:
-- a) Um usuário pode sempre ler seu próprio perfil (auth.uid() = id).
-- b) Um usuário pode ler os perfis de outros usuários se eles pertencerem à mesma empresa.
CREATE POLICY "Enable read access for own profile and company" ON public.profiles
FOR SELECT
USING (
  (auth.uid() = id) OR
  (company_id = public.get_current_user_company_id())
);
