-- Migration: Add service_number field to trips table
-- Description: Adds a sequential service number field to uniquely identify each trip/service

-- Add service_number column (nullable initially)
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS service_number INTEGER;

-- Create a function to get the next service number for a company
CREATE OR REPLACE FUNCTION get_next_service_number(p_company_id uuid)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(service_number), 0) + 1
  INTO next_number
  FROM trips
  WHERE company_id = p_company_id;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Update existing trips with sequential numbers (grouped by company)
DO $$
DECLARE
  company_record RECORD;
  trip_record RECORD;
  current_number INTEGER;
BEGIN
  -- For each company
  FOR company_record IN
    SELECT DISTINCT company_id FROM trips WHERE service_number IS NULL
  LOOP
    current_number := 1;

    -- For each trip of this company, ordered by creation date
    FOR trip_record IN
      SELECT id
      FROM trips
      WHERE company_id = company_record.company_id
        AND service_number IS NULL
      ORDER BY created_at ASC
    LOOP
      UPDATE trips
      SET service_number = current_number
      WHERE id = trip_record.id;

      current_number := current_number + 1;
    END LOOP;
  END LOOP;
END $$;

-- Make service_number NOT NULL after populating existing data
ALTER TABLE public.trips
ALTER COLUMN service_number SET NOT NULL;

-- Add unique constraint for service_number per company
ALTER TABLE public.trips
ADD CONSTRAINT unique_service_number_per_company
UNIQUE (company_id, service_number);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trips_service_number
ON public.trips(company_id, service_number);

-- Add comment to document the column
COMMENT ON COLUMN public.trips.service_number IS 'Sequential service/trip number unique per company';
