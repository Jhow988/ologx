-- Fix Function Search Path security advisory
CREATE OR REPLACE FUNCTION public.get_my_claims()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select coalesce(
    (select claims from auth.users where id = auth.uid()),
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  select coalesce(
    (select nullif(get_my_claims() ->> 'company_id', '')::uuid),
    (null)::uuid
  );
$$;

-- Add new columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS document TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS address TEXT;
