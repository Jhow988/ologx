/*
# [Fix] Corrige Recursão Infinita na Política de Segurança

Este script corrige um erro de "recursão infinita" que ocorre ao tentar buscar o perfil do usuário. O problema é causado por uma dependência circular entre as políticas de segurança (RLS) das tabelas `profiles` e `companies`.

## Descrição da Consulta:
- **Cria uma função `get_my_company_id()`:** Esta função auxiliar segura obtém o `company_id` do usuário logado sem disparar a política de segurança da tabela `profiles`, quebrando o ciclo de recursão.
- **Atualiza a política da tabela `companies`:** A política de visualização da tabela `companies` é recriada para usar a nova função auxiliar, tornando a verificação mais eficiente e segura.

## Metadados:
- Categoria do Esquema: "Estrutural"
- Nível de Impacto: "Baixo"
- Requer Backup: false
- Reversível: true (recriando a política antiga)

## Detalhes da Estrutura:
- **Funções Afetadas:** `get_my_company_id` (criada)
- **Políticas Afetadas:** Política de SELECT na tabela `companies` (recriada)

## Implicações de Segurança:
- Status do RLS: Ativado
- Alterações na Política: Sim. A lógica da política é a mesma, mas a implementação é alterada para evitar recursão. A segurança é mantida.

## Impacto no Desempenho:
- Índices: Nenhum
- Gatilhos: Nenhum
- Impacto Estimado: Positivo. A consulta para verificar a permissão se torna mais direta.
*/

-- 1. Crie uma função auxiliar para obter o company_id do usuário atual
-- Esta função é executada com os privilégios de quem a define, ignorando o RLS na tabela de perfis para esta consulta específica, quebrando assim o ciclo de recursão.
create or replace function public.get_my_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select company_id from public.profiles where id = auth.uid();
$$;


-- 2. Recrie a política na tabela de empresas para usar a função auxiliar
-- Isso evita a chamada recursiva que estava causando o erro.

-- Primeiro, remova a política existente
drop policy if exists "Users can view their own company." on public.companies;

-- Em seguida, crie a nova política não recursiva
create policy "Users can view their own company."
on public.companies for select
using ( id = public.get_my_company_id() );

-- Conceda permissão de execução na função para usuários autenticados
grant execute on function public.get_my_company_id() to authenticated;
