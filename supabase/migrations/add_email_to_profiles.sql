-- ==============================================================================
-- Add email column to profiles table
-- ==============================================================================

-- Add email column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update existing profiles with email from auth.users
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL;

-- Update the handle_new_user trigger to include email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, company_id, email, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
    (NEW.raw_user_meta_data->>'company_id')::uuid,
    NEW.email,
    CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'
      ELSE 'pending'
    END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    status = CASE
      WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active'
      ELSE profiles.status
    END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- COMPLETE
-- ==============================================================================
