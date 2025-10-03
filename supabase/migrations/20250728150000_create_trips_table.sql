/*
  # [Structural] Create Trips Table and Policies
  This script creates the 'trips' table to store service/trip information and sets up row-level security to ensure data isolation between companies.

  ## Query Description: 
  This operation will first attempt to drop the 'trips' table if it exists to ensure a clean setup, then recreate it with the correct structure and security policies. No existing data will be lost as we haven't populated it yet.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by dropping the table)

  ## Structure Details:
  - Table Created: public.trips
  - Columns: id, company_id, client_id, vehicle_id, driver_id, origin, destination, value, status, start_date, etc.
  - Foreign Keys:
    - trips.company_id -> companies.id
    - trips.client_id -> clients.id
    - trips.vehicle_id -> vehicles.id
    - trips.driver_id -> profiles.id
  - RLS Policies:
    - Enables RLS on the table.
    - Creates a policy to ensure users can only access trips belonging to their own company.

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes, new policies are created for data isolation.
  - Auth Requirements: Policies use `auth.uid()` to identify the current user.

  ## Performance Impact:
  - Indexes: Primary key and foreign key indexes are created automatically.
  - Triggers: None.
  - Estimated Impact: Low.
*/

-- Drop the table if it exists to start fresh from the corrected script
DROP TABLE IF EXISTS public.trips;

-- Create the trips table with correct foreign keys
CREATE TABLE public.trips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    driver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    distance NUMERIC,
    value NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    attachments JSONB,
    cte TEXT,
    nf TEXT,
    requester TEXT,
    vehicle_type TEXT,
    freight_type TEXT,
    insurance_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments to columns for clarity
COMMENT ON TABLE public.trips IS 'Stores information about transportation services (trips).';
COMMENT ON COLUMN public.trips.company_id IS 'The company this trip belongs to.';
COMMENT ON COLUMN public.trips.driver_id IS 'The driver assigned to this trip, references the profiles table.';

-- Enable Row Level Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Allow users to manage their own company's trips"
ON public.trips
FOR ALL
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
