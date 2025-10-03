/*
# [Fix] Corrige a Política de Segurança da Tabela 'profiles'
Este script corrige o erro de "recursão infinita" que está travando a aplicação na tela de login. Ele substitui as regras de segurança (RLS) da tabela 'profiles' por versões mais seguras que não causam loops.

## Query Description: "Esta operação irá apagar e recriar as políticas de segurança para a tabela de perfis. É uma operação segura que não afeta os dados existentes, mas é crucial para corrigir o bug de login."

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tabela afetada: public.profiles
- Políticas removidas: "Enable read access for own profile and company", "Enable read access for own profile", "Enable read access for company members"
- Políticas criadas: "Enable read access for own profile", "Enable read access for company members"

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: N/A

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Nenhum impacto negativo na performance. A correção deve melhorar a performance de login ao remover o loop de recursão.
*/

-- 1. Apaga TODAS as políticas de SELECT anteriores na tabela 'profiles' para garantir um estado limpo.
DROP POLICY IF EXISTS "Enable read access for own profile and company" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for company members" ON public.profiles;

-- 2. Cria uma política específica e segura para permitir que um usuário leia SEU PRÓPRIO perfil.
-- Esta política é simples e não depende de outras tabelas, evitando recursão.
CREATE POLICY "Enable read access for own profile"
ON public.profiles FOR SELECT
USING ( auth.uid() = id );

-- 3. Cria uma segunda política para permitir que usuários leiam os perfis de OUTROS membros da mesma empresa.
-- A verificação da empresa é feita de forma segura, consultando diretamente os metadados do usuário autenticado.
CREATE POLICY "Enable read access for company members"
ON public.profiles FOR SELECT
USING (
  company_id = (
    SELECT raw_user_meta_data->>'company_id'
    FROM auth.users
    WHERE id = auth.uid()
  )::uuid
);
