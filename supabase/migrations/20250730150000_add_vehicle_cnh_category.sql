/*
  # [Operação Estrutural]
  Adiciona campo de categoria CNH necessária aos veículos.

  ## Query Description: [Adiciona a coluna required_cnh_category à tabela vehicles para armazenar a categoria mínima da CNH necessária para operar o veículo (A, B, C, D, E).]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Tabela afetada: `public.vehicles`
  - Coluna adicionada: `required_cnh_category` (TEXT)

  ## Security Implications:
  - RLS Status: Inalterado
  - Policy Changes: Não
  - Auth Requirements: Não

  ## Performance Impact:
  - Indexes: Nenhum
  - Triggers: Nenhum
  - Estimated Impact: Nenhum impacto significativo na performance.
*/

-- Adicionar coluna para armazenar a categoria CNH necessária para operar o veículo
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS required_cnh_category TEXT;

-- Adicionar constraint para validar valores permitidos
ALTER TABLE public.vehicles
ADD CONSTRAINT check_required_cnh_category
CHECK (required_cnh_category IS NULL OR required_cnh_category IN ('A', 'B', 'C', 'D', 'E'));

-- Comentário na coluna
COMMENT ON COLUMN public.vehicles.required_cnh_category IS 'Categoria mínima da CNH necessária para operar o veículo (A, B, C, D, E). Usado para validar se o motorista possui habilitação adequada.';
