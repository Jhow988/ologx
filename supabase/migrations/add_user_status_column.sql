-- ==============================================================================
-- MIGRATION: Add status column to profiles table
-- ==============================================================================
-- Execute this SQL in your Supabase SQL Editor
-- ==============================================================================

-- Add status column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
CHECK (status IN ('pending', 'active', 'inactive'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update existing users to 'active' (they are already confirmed)
UPDATE profiles
SET status = 'active'
WHERE status IS NULL OR status = 'pending';

-- Add comment
COMMENT ON COLUMN profiles.status IS 'User account status: pending (invite sent), active (confirmed), inactive (disabled)';

-- ==============================================================================
-- Create function to update profile status when user confirms email
-- ==============================================================================

-- Function to handle user email confirmation
CREATE OR REPLACE FUNCTION handle_user_email_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- When user confirms email, update profile status to active
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE profiles
    SET status = 'active'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_email_confirmed();

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
