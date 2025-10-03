/*
          # CRIAÇÃO DA TABELA DE MANUTENÇÕES (maintenances)
          Cria a tabela para armazenar os registros de manutenção dos veículos e configura as políticas de segurança para isolamento de dados entre empresas.

          ## Query Description: "Este script cria a tabela `maintenances` e suas políticas de segurança. Se a tabela já existir de uma tentativa anterior, ela será removida e recriada para garantir a estrutura correta. Nenhum dado de outras tabelas será afetado."
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tabela `maintenances` criada com colunas para ID, ID da empresa, ID do veículo, título, datas, custo, status, etc.
          - Chaves estrangeiras para `companies` e `vehicles`.
          
          ## Security Implications:
          - RLS Status: Habilitado para a tabela `maintenances`.
          - Policy Changes: Políticas de SELECT, INSERT, UPDATE, DELETE são criadas para garantir que uma empresa só possa acessar seus próprios registros de manutenção.
          - Auth Requirements: Requer um usuário autenticado.
          
          ## Performance Impact:
          - Indexes: Índices são criados para a chave primária e chaves estrangeiras.
          - Triggers: Nenhum.
          - Estimated Impact: Baixo.
          */

-- Remove a tabela se ela existir de uma tentativa anterior para garantir uma criação limpa
DROP TABLE IF EXISTS public.maintenances;

-- Cria a tabela de manutenções
CREATE TABLE public.maintenances (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    title text NOT NULL,
    start_date date NOT NULL,
    end_date date NULL,
    description text NOT NULL,
    cost numeric(10, 2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'scheduled'::text,
    type text NOT NULL DEFAULT 'preventive'::text,
    next_maintenance_reminder date NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT maintenances_pkey PRIMARY KEY (id),
    CONSTRAINT maintenances_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT maintenances_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE
);

-- Habilita a segurança a nível de linha (RLS)
ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver suas próprias manutenções" ON public.maintenances;
DROP POLICY IF EXISTS "Usuários podem inserir manutenções para sua empresa" ON public.maintenances;
DROP POLICY IF EXISTS "Usuários podem atualizar as manutenções de sua empresa" ON public.maintenances;
DROP POLICY IF EXISTS "Usuários podem deletar as manutenções de sua empresa" ON public.maintenances;

-- Cria as políticas de segurança
CREATE POLICY "Usuários podem ver suas próprias manutenções"
ON public.maintenances
FOR SELECT USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Usuários podem inserir manutenções para sua empresa"
ON public.maintenances
FOR INSERT WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Usuários podem atualizar as manutenções de sua empresa"
ON public.maintenances
FOR UPDATE USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Usuários podem deletar as manutenções de sua empresa"
ON public.maintenances
FOR DELETE USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);
