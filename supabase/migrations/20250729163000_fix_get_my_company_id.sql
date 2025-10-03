/*
          # [Operation Name]
          Fix get_my_company_id function

          ## Query Description: [This operation corrects a bug in the `get_my_company_id` function. The previous version had an incorrect type cast that prevented database policies from working, causing the application to get stuck on the loading screen. This fix ensures the function correctly returns the company ID, resolving the login and loading issue. This operation is safe and does not affect any stored data.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Functions: Modifies the `get_my_company_id` function.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible performance impact. Fixes a critical functional bug.]
          */
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Correctly extracts the jsonb string value to text before casting to uuid
  RETURN (SELECT (public.get_my_claim('company_id')#>>'{}')::uuid);
END;
$$;
