/*
          # [Operation Name]
          Fix Profile RLS Policies

          [Description of what this operation does]
          This script drops all existing SELECT policies on the `profiles` table and replaces them with a single, non-recursive policy. This is the definitive fix for the "infinite recursion detected" error that is preventing users from logging in and causing the application to hang on the loading screen.

          ## Query Description: ["This operation corrects a security policy misconfiguration. It drops potentially faulty Row-Level Security (RLS) policies on the `profiles` table and creates a new, safe policy. This change is critical to resolve the login and infinite loading issues. No data will be lost or modified."]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affects RLS policies on the `public.profiles` table.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [This fixes an authentication-related issue.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Positive. Resolves a query loop that was causing performance degradation and application failure.]
          */

-- Drop all potentially conflicting SELECT policies on the profiles table.
-- It's safe to run these even if the policies do not exist.
DROP POLICY IF EXISTS "Users can view their own company's profiles." ON public.profiles;
DROP POLICY IF EXISTS "Allow individual user access" ON public.profiles;
DROP POLICY IF EXISTS "Allow user to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read their own profile" ON public.profiles;


-- Create a new, non-recursive policy that allows users to read their own profile.
-- This is the key fix for the infinite recursion error.
CREATE POLICY "Allow authenticated users to read their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
