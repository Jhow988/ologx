/*
          # [Operation Name]
          Fix Profile RLS Policies

          ## Query Description: [This script drops the old, problematic Row-Level Security (RLS) policies on the 'profiles' table and recreates them with a simpler, correct logic. This resolves the "infinite recursion" error that was preventing users from logging in and causing the application to hang on the loading screen. The new policies directly check against `auth.uid()` to ensure users can only access their own profile, which is a secure and non-recursive approach.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Affects RLS policies on the `public.profiles` table.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are based on `authenticated` role.
          
          ## Performance Impact:
          - Indexes: Not Affected
          - Triggers: Not Affected
          - Estimated Impact: Positive. Resolves a query loop, improving login performance.
          */

-- Drop the old, problematic policies if they exist.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users based on role" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users in the same company" ON public.profiles;

-- Create new, correct policies.
CREATE POLICY "Enable read access for authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
