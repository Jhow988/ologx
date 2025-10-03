-- Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for own profile" ON "public"."profiles";

-- Create a SECURITY DEFINER function to safely get the current user's company_id
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT company_id FROM profiles WHERE id = auth.uid());
END;
$$;

-- Recreate the policy using the safe function
CREATE POLICY "Enable read access for own profile"
ON "public"."profiles"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR
  (company_id = get_my_company_id())
);
