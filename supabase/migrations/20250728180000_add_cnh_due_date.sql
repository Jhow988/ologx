/*
          # [Operação Estrutural]
          Adiciona a coluna `cnh_due_date` à tabela `profiles`.

          ## Query Description: [Esta operação adiciona uma nova coluna à tabela de perfis de usuário para armazenar a data de vencimento da CNH. É uma alteração segura que não afeta dados existentes e é necessária para a funcionalidade de alertas de vencimento.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tabela afetada: `public.profiles`
          - Coluna adicionada: `cnh_due_date` (DATE)
          
          ## Security Implications:
          - RLS Status: Inalterado
          - Policy Changes: Não
          - Auth Requirements: Não
          
          ## Performance Impact:
          - Indexes: Nenhum
          - Triggers: Nenhum
          - Estimated Impact: Nenhum impacto significativo na performance.
          */

ALTER TABLE public.profiles
ADD COLUMN cnh_due_date DATE;
