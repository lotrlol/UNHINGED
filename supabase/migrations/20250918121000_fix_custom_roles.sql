-- Ensure profiles table has the correct structure for roles
DO $$
BEGIN
  -- Check if roles column exists and is of type text[]
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'roles' AND data_type = 'ARRAY'
  ) THEN
    -- Column exists with correct type, no changes needed
    RAISE NOTICE 'roles column already exists with correct type';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'roles'
  ) THEN
    -- Column exists but with wrong type, alter it
    ALTER TABLE public.profiles 
    ALTER COLUMN roles TYPE text[] USING array[roles::text];
    RAISE NOTICE 'Altered roles column to text[] type';
  ELSE
    -- Column doesn't exist, create it
    ALTER TABLE public.profiles
    ADD COLUMN roles text[] NOT NULL DEFAULT '{}'::text[];
    RAISE NOTICE 'Added roles column as text[]';
  END IF;

  -- Add a check constraint to ensure roles is never null
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_roles_not_null'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_roles_not_null 
    CHECK (roles IS NOT NULL);
  END IF;

  -- Add a comment to the column
  COMMENT ON COLUMN public.profiles.roles IS 'Array of role strings for the user';

  -- Update RLS policies if needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone.'
  ) THEN
    CREATE POLICY "Public profiles are viewable by everyone." 
    ON public.profiles FOR SELECT 
    TO public 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile.'
  ) THEN
    CREATE POLICY "Users can update their own profile." 
    ON public.profiles FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error in migration: %', SQLERRM;
END $$;
