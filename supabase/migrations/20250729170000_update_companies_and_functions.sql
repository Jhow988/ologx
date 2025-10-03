/*
          # [Operation Name]
          Update Companies Table and Secure Functions

          ## Query Description: [This operation adds new columns to the `companies` table to store contact and address information. It also sets a fixed `search_path` for existing database functions to resolve security warnings and improve stability. This is a non-destructive operation.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables Affected: `companies`
          - Columns Added: `document`, `email`, `phone`, `address`
          - Functions Affected: `get_my_claims`, `get_my_company_id`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [Low. Adds nullable columns to a table and modifies function definitions.]
          */

-- Add columns to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS document TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Secure existing functions by setting search_path
CREATE OR REPLACE FUNCTION get_my_claims()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata',
    '{}'::jsonb
  );
$$;

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    CASE
      WHEN (get_my_claims() ->> 'is_super_admin')::boolean = true THEN NULL
      ELSE (get_my_claims() ->> 'company_id')::uuid
    END;
$$;
