-- First, drop existing SELECT and UPDATE policies on the profiles table to ensure a clean slate.
-- Using IF EXISTS makes this script safe to run even if the policies were named differently or don't exist.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;


/*
# [Fix] RLS Policy for Profiles Table
[This script corrects the Row-Level Security (RLS) policies for the `profiles` table to prevent an infinite recursion error that occurs during user authentication.]

## Query Description: [This operation resets and correctly defines the access rules for the user profiles table. It ensures that users can only view and update their own profile information, which is a critical security measure. The previous policy had a logical loop, causing login failures. This fix resolves that loop without affecting any existing data.]

## Metadata:
- Schema-Category: ["Structural", "Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Affects Table: `public.profiles`
- Operations: `DROP POLICY`, `CREATE POLICY`

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Applies to `authenticated` users]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Positive. Resolves a blocking error, allowing the application to load correctly.]
*/

-- 1. Create a policy to allow users to view their own profile.
-- This is the most critical fix. It directly compares the user's ID with the row's ID, avoiding any recursive function calls.
CREATE POLICY "Users can view their own profile."
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Create a policy to allow users to update their own profile.
-- This ensures users can only modify their own data.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Note: An INSERT policy is handled by the database trigger `on_auth_user_created`.
-- A DELETE policy for users is not added here for security reasons, as it should be handled with care.
