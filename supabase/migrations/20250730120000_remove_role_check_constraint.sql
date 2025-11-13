/*
  # [Operação Estrutural]
  Remove a constraint profiles_role_check para permitir custom roles.

  ## Query Description: [Remove a constraint CHECK que limitava o campo role apenas aos valores padrão. Isso permite que UUIDs de custom roles sejam armazenados na coluna role.]

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Tabela afetada: `public.profiles`
  - Constraint removida: `profiles_role_check`

  ## Security Implications:
  - RLS Status: Inalterado
  - Policy Changes: Não
  - Auth Requirements: Não

  ## Performance Impact:
  - Indexes: Nenhum
  - Triggers: Nenhum
  - Estimated Impact: Nenhum impacto na performance.
*/

-- Remove a constraint que limita os valores de role
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;
