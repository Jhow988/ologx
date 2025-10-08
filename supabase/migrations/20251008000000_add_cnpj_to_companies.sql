/*
  # [Operation Name]
  Add CNPJ field to Companies Table

  ## Query Description: [This operation ensures the companies table has a cnpj column for storing company registration numbers (CNPJ). It also adds a unique constraint to prevent duplicate CNPJs.]

  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Tables Affected: `companies`
  - Columns Modified/Added: `cnpj`

  ## Security Implications:
  - RLS Status: [No Change]
  - Policy Changes: [No]
  - Auth Requirements: [None]

  ## Performance Impact:
  - Indexes: [Adds unique index on cnpj]
  - Triggers: [No Change]
  - Estimated Impact: [Low]
*/

-- Add cnpj column if not exists (replacing document field concept)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Add unique constraint to prevent duplicate CNPJs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'companies_cnpj_unique'
  ) THEN
    ALTER TABLE public.companies
    ADD CONSTRAINT companies_cnpj_unique UNIQUE (cnpj);
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.companies.cnpj IS 'CNPJ da empresa (formato: 00.000.000/0000-00)';
