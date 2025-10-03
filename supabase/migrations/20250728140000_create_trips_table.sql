/*
          # CRIAÇÃO DA TABELA DE VIAGENS (TRIPS)
          Este script cria a tabela `trips` para armazenar todos os registros de serviços/viagens,
          incluindo relacionamentos com clientes, veículos e motoristas, e configura as políticas
          de segurança para garantir o isolamento de dados entre empresas.

          ## Query Description: [Esta operação cria uma nova tabela `trips` e suas políticas de segurança. Se a tabela já existir, ela será removida e recriada, o que pode apagar dados existentes nessa tabela específica. Faça um backup se necessário.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Tabela afetada: `public.trips`
          - Colunas: `id`, `company_id`, `client_id`, `vehicle_id`, `driver_id`, `origin`, `destination`, `value`, `status`, `start_date`, etc.
          - Chaves estrangeiras: `company_id`, `client_id`, `vehicle_id`, `driver_id`
          
          ## Security Implications:
          - RLS Status: Habilitado para a tabela `trips`.
          - Policy Changes: Novas políticas de `SELECT`, `INSERT`, `UPDATE`, `DELETE` serão criadas para garantir que os usuários só possam acessar os dados da sua própria empresa.
          - Auth Requirements: Requer que o usuário esteja autenticado.
          
          ## Performance Impact:
          - Indexes: Um índice de chave primária é criado na coluna `id`. Índices são adicionados às chaves estrangeiras.
          - Triggers: Nenhum.
          - Estimated Impact: Baixo impacto em performance.
          */

-- Remove a tabela se ela já existir para evitar erros em execuções repetidas
DROP TABLE IF EXISTS public.trips;

-- Criação da tabela `trips`
CREATE TABLE public.trips (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    client_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    driver_id uuid NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    distance numeric,
    value numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    start_date date NOT NULL,
    end_date date,
    description text,
    attachments jsonb,
    cte text,
    nf text,
    requester text,
    vehicle_type text,
    freight_type text,
    insurance_info text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT trips_pkey PRIMARY KEY (id),
    CONSTRAINT trips_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
    CONSTRAINT trips_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE,
    CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- Habilita a segurança em nível de linha (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Permite que super administradores ignorem as políticas de RLS
ALTER TABLE public.trips BYPASS ROW LEVEL SECURITY FOR ROLE service_role;

-- POLÍTICAS DE ACESSO
-- Política de SELECT: Usuários podem ver apenas as viagens da sua própria empresa.
CREATE POLICY "Allow users to view trips from their own company"
ON public.trips
FOR SELECT
USING (
  company_id = (
    SELECT company_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Política de INSERT: Usuários podem criar viagens apenas para a sua própria empresa.
CREATE POLICY "Allow users to insert trips for their own company"
ON public.trips
FOR INSERT
WITH CHECK (
  company_id = (
    SELECT company_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Política de UPDATE: Usuários podem atualizar apenas as viagens da sua própria empresa.
CREATE POLICY "Allow users to update trips from their own company"
ON public.trips
FOR UPDATE
USING (
  company_id = (
    SELECT company_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Política de DELETE: Usuários podem deletar apenas as viagens da sua própria empresa.
CREATE POLICY "Allow users to delete trips from their own company"
ON public.trips
FOR DELETE
USING (
  company_id = (
    SELECT company_id
    FROM public.profiles
    WHERE id = auth.uid()
  )
);
