-- ==============================================================================
-- MIGRATION: Create custom_roles table for customizable permission profiles
-- ==============================================================================
-- Execute this SQL in your Supabase SQL Editor to create the custom_roles table
-- This enables admins to create custom permission profiles for their users
-- ==============================================================================

-- Create custom_roles table
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions text[] NOT NULL DEFAULT '{}',
  is_custom boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT custom_roles_name_company_unique UNIQUE (name, company_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_roles_company_id ON custom_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_roles_created_at ON custom_roles(created_at);

-- Enable RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Users can view custom roles from their company" ON custom_roles;
DROP POLICY IF EXISTS "Admins can create custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Admins can update custom roles" ON custom_roles;
DROP POLICY IF EXISTS "Admins can delete custom roles" ON custom_roles;

-- RLS Policies for custom_roles
-- Users can only see custom roles from their own company
CREATE POLICY "Users can view custom roles from their company"
  ON custom_roles
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Only admins can create custom roles
CREATE POLICY "Admins can create custom roles"
  ON custom_roles
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update custom roles
CREATE POLICY "Admins can update custom roles"
  ON custom_roles
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete custom roles
CREATE POLICY "Admins can delete custom roles"
  ON custom_roles
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_custom_roles_updated_at ON custom_roles;
DROP FUNCTION IF EXISTS update_custom_roles_updated_at();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_roles_updated_at();

-- Add comments to table
COMMENT ON TABLE custom_roles IS 'Stores custom permission profiles created by company admins';
COMMENT ON COLUMN custom_roles.permissions IS 'Array of permission keys (e.g., servicos:criar, cadastros:gerenciar_frota)';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- The custom_roles table is now ready to use.
-- You can now create custom permission profiles through the UI.
-- ==============================================================================
