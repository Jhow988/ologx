/*
          # Criação da Tabela de Veículos (vehicles)
          Este script cria a tabela para armazenar os dados da frota de cada empresa e configura as políticas de segurança para garantir o isolamento dos dados (multi-tenancy).

          ## Query Description: 
          - Cria a tabela `vehicles` com colunas para placa, modelo, marca, ano, status e data de vencimento do licenciamento.
          - Adiciona uma coluna `company_id` para associar cada veículo a uma empresa.
          - Habilita a Segurança em Nível de Linha (RLS) para a tabela.
          - Define políticas de segurança que permitem que os usuários apenas acessem (SELECT, INSERT, UPDATE, DELETE) os veículos pertencentes à sua própria empresa.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (DROP TABLE)
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (criação de políticas de acesso)
          - Auth Requirements: Usuários autenticados só podem interagir com dados da sua própria empresa.
          */

-- 1. Criar a tabela de veículos
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    plate TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, maintenance, inactive
    licensing_due_date DATE
);

-- Adicionar comentários para clareza
COMMENT ON TABLE public.vehicles IS 'Armazena os veículos da frota de cada empresa.';
COMMENT ON COLUMN public.vehicles.plate IS 'Placa do veículo.';
COMMENT ON COLUMN public.vehicles.status IS 'Status atual do veículo (ativo, em manutenção, inativo).';
COMMENT ON COLUMN public.vehicles.licensing_due_date IS 'Data de vencimento do licenciamento.';

-- 2. Habilitar a Segurança em Nível de Linha (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de segurança para isolamento de dados
CREATE POLICY "Allow full access to own company vehicles"
ON public.vehicles
FOR ALL
USING (
    company_id = (
        SELECT company_id
        FROM public.profiles
        WHERE id = auth.uid()
    )
)
WITH CHECK (
    company_id = (
        SELECT company_id
        FROM public.profiles
        WHERE id = auth.uid()
    )
);
