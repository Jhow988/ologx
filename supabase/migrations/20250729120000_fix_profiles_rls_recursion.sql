/*
# [Fix] Corrige a Recursão Infinita nas Políticas de Segurança da Tabela de Perfis

Este script corrige um erro crítico de "recursão infinita" que impedia o carregamento da aplicação. O problema ocorria porque as regras de segurança (policies) da tabela `profiles` estavam tentando validar o acesso lendo a própria tabela, criando um loop que travava o banco de dados.

## Descrição da Query:
1.  **DROP POLICY IF EXISTS**: Remove todas as políticas de segurança anteriores e potencialmente conflitantes da tabela `profiles`. Isso garante uma correção limpa.
2.  **CREATE POLICY (SELECT)**: Cria uma nova regra simples e segura que permite que um usuário leia **apenas** a sua própria linha na tabela de perfis.
3.  **CREATE POLICY (UPDATE)**: Cria uma nova regra que permite que um usuário atualize **apenas** o seu próprio perfil.

Esta correção é segura, não afeta nenhum dado existente e resolve a causa raiz do erro de carregamento.

## Metadados:
- Categoria do Esquema: "Estrutural"
- Nível de Impacto: "Baixo" (afeta apenas as regras de acesso, não os dados)
- Requer Backup: false
- Reversível: true (as políticas antigas podem ser recriadas, embora não seja recomendado)

## Detalhes da Estrutura:
- Tabela Afetada: `public.profiles`
- Operação: `DROP POLICY`, `CREATE POLICY`

## Implicações de Segurança:
- Status RLS: Permanece Habilitado
- Mudanças na Política: Sim. As políticas de acesso para a tabela `profiles` são redefinidas para serem mais seguras e eficientes.
- Requisitos de Autenticação: As regras dependem do `auth.uid()` do usuário autenticado.

## Impacto no Desempenho:
- Índices: Nenhum
- Triggers: Nenhum
- Impacto Estimado: Positivo. Remove um loop infinito que causava timeouts e alto consumo de recursos no banco de dados.
*/

-- Remove todas as políticas de segurança anteriores e potencialmente conflitantes da tabela `profiles`.
-- Isso é crucial para garantir que não haja regras antigas causando o loop.
DROP POLICY IF EXISTS "Enable read access for users on their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;
DROP POLICY IF EXISTS "Enable select for users on their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users on their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable access for users based on company" ON public.profiles;
DROP POLICY IF EXISTS "Users can only see profiles in their own company" ON public.profiles;

-- Cria a política de SELECT correta e não recursiva.
-- Um usuário só pode ler a sua própria linha na tabela de perfis.
CREATE POLICY "Allow users to read their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Cria a política de UPDATE correta e não recursiva.
-- Um usuário só pode atualizar a sua própria linha na tabela de perfis.
CREATE POLICY "Allow users to update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
