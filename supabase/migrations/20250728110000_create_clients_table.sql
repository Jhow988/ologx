/*
          # [Operation Name]
          Create Clients Table

          ## Query Description: [This script creates the 'clients' table to store customer information. It establishes a multi-tenant structure by linking each client to a company and enables Row-Level Security (RLS) to ensure data isolation, meaning a company can only access its own clients.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: public.clients
          - Columns: id, company_id, name, document, email, phone, address, city, state, cep, created_at
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (New policies for SELECT, INSERT, UPDATE, DELETE)
          - Auth Requirements: Users must be authenticated.
          
          ## Performance Impact:
          - Indexes: Added (primary key on id, foreign key on company_id)
          - Triggers: None
          - Estimated Impact: Low.
          */

CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    cep TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- 1. Users can see clients that belong to their company
CREATE POLICY "Allow read access to own company clients"
ON public.clients
FOR SELECT
USING ((SELECT company_id FROM public.profiles WHERE id = auth.uid()) = company_id);

-- 2. Users can insert clients into their own company
CREATE POLICY "Allow insert for own company clients"
ON public.clients
FOR INSERT
WITH CHECK ((SELECT company_id FROM public.profiles WHERE id = auth.uid()) = company_id);

-- 3. Users can update clients in their own company
CREATE POLICY "Allow update for own company clients"
ON public.clients
FOR UPDATE
USING ((SELECT company_id FROM public.profiles WHERE id = auth.uid()) = company_id);

-- 4. Users can delete clients from their own company
CREATE POLICY "Allow delete for own company clients"
ON public.clients
FOR DELETE
USING ((SELECT company_id FROM public.profiles WHERE id = auth.uid()) = company_id);
