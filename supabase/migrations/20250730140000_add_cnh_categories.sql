/*
  # [Operação Estrutural]
  Adiciona campo de categorias da CNH aos perfis de motoristas.

  ## Query Description: [Adiciona a coluna cnh_categories à tabela profiles para armazenar as categorias da CNH do motorista (A, B, C, D, E).]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Tabela afetada: `public.profiles`
  - Coluna adicionada: `cnh_categories` (TEXT ARRAY)

  ## Security Implications:
  - RLS Status: Inalterado
  - Policy Changes: Não
  - Auth Requirements: Não

  ## Performance Impact:
  - Indexes: Nenhum
  - Triggers: Nenhum
  - Estimated Impact: Nenhum impacto significativo na performance.
*/

-- Adicionar coluna para armazenar as categorias da CNH
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cnh_categories TEXT[] DEFAULT '{}';

-- Comentário na coluna
COMMENT ON COLUMN public.profiles.cnh_categories IS 'Categorias da CNH do motorista (A, B, C, D, E). Exemplo: {A, B, C}';
