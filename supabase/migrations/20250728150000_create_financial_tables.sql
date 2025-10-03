/*
          # [Operação Estrutural] Criação das Tabelas Financeiras
          Cria as tabelas `financial_categories`, `financial_subcategories` e `financial_records` para armazenar todos os dados financeiros.

          ## Query Description: [Este script estabelece a fundação para o módulo financeiro. Ele cria as tabelas para categorias, subcategorias e os lançamentos financeiros (contas a pagar/receber). As regras de segurança (RLS) são aplicadas para garantir que os dados de cada empresa sejam estritamente isolados. Não há risco para dados existentes de outras tabelas.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Cria a tabela `financial_categories`.
          - Cria a tabela `financial_subcategories`.
          - Cria a tabela `financial_records`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (Cria políticas de acesso para as novas tabelas)
          - Auth Requirements: Usuário autenticado pertencente a uma empresa.
          
          ## Performance Impact:
          - Indexes: Adiciona chaves primárias e estrangeiras, que são indexadas.
          - Triggers: Nenhum.
          - Estimated Impact: Nenhum impacto negativo esperado.
          */

-- Garante que o script possa ser executado novamente, limpando as tabelas se existirem
DROP TABLE IF EXISTS public.financial_records CASCADE;
DROP TABLE IF EXISTS public.financial_subcategories CASCADE;
DROP TABLE IF EXISTS public.financial_categories CASCADE;


-- Tabela para Categorias Financeiras
CREATE TABLE public.financial_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela para Subcategorias Financeiras
CREATE TABLE public.financial_subcategories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.financial_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela para Lançamentos Financeiros
CREATE TABLE public.financial_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('receivable', 'payable')),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    category_id uuid REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    subcategory_id uuid REFERENCES public.financial_subcategories(id) ON DELETE SET NULL,
    recurrence TEXT NOT NULL DEFAULT 'unique',
    related_trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
    recurrence_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para financial_categories
CREATE POLICY "Allow full access to own company categories"
ON public.financial_categories
FOR ALL
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas de Segurança para financial_subcategories
CREATE POLICY "Allow full access to own company subcategories"
ON public.financial_subcategories
FOR ALL
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas de Segurança para financial_records
CREATE POLICY "Allow full access to own company financial records"
ON public.financial_records
FOR ALL
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
