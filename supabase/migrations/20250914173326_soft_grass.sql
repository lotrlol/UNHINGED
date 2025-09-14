/*
  # Add onboarding completion tracking

  1. Schema Changes
    - Add `onboarding_completed` column to `profiles` table
    - Set default value to `false` for new profiles
    - Update existing profiles to `true` (assume they've completed onboarding)

  2. Security
    - No RLS changes needed as this uses existing profile policies
    - Users can only update their own profile's onboarding status

  3. Notes
    - This allows the app to track whether a user has completed the onboarding flow
    - Prevents the onboarding wizard from showing repeatedly for existing users
*/

-- Add onboarding_completed column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- Set existing profiles to have completed onboarding (they already have profiles)
UPDATE profiles 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS profiles_onboarding_completed_idx 
ON profiles (onboarding_completed);