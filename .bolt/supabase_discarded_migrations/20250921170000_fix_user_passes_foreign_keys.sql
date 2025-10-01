-- Fix user_passes foreign key constraints to point to profiles instead of auth.users
-- This migration updates user_passes to reference public.profiles(id) instead of auth.users(id)
-- Similar to the user_likes fix, but for user_passes table

-- First, identify and handle orphaned records in user_passes
DO $$
BEGIN
  -- Create a temporary table to store orphaned records for reference
  CREATE TEMP TABLE IF NOT EXISTS orphaned_user_passes AS
  SELECT * FROM public.user_passes
  WHERE user_id NOT IN (SELECT id FROM public.profiles)
     OR passed_user_id NOT IN (SELECT id FROM public.profiles);

  -- Log the number of orphaned records being removed
  RAISE NOTICE 'Found % orphaned user_passes records that will be removed',
    (SELECT COUNT(*) FROM orphaned_user_passes);

  -- Remove orphaned records
  DELETE FROM public.user_passes
  WHERE id IN (SELECT id FROM orphaned_user_passes);

  -- Now handle the foreign key constraints
  -- First, drop existing foreign key constraints if they exist
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_passes_user_id_fkey' AND conrelid = 'public.user_passes'::regclass
  ) THEN
    ALTER TABLE public.user_passes DROP CONSTRAINT user_passes_user_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_passes_passed_user_id_fkey' AND conrelid = 'public.user_passes'::regclass
  ) THEN
    ALTER TABLE public.user_passes DROP CONSTRAINT user_passes_passed_user_id_fkey;
  END IF;

  -- Now add them back with proper naming and structure
  -- First, add the constraints as NOT VALID to skip validation of existing rows
  BEGIN
    ALTER TABLE public.user_passes
    ADD CONSTRAINT user_passes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE
    NOT VALID;

    ALTER TABLE public.user_passes
    ADD CONSTRAINT user_passes_passed_user_id_fkey
    FOREIGN KEY (passed_user_id) REFERENCES public.profiles(id)
    ON DELETE CASCADE
    NOT VALID;

    -- Now validate the constraints (this should pass since we removed orphaned records)
    ALTER TABLE public.user_passes VALIDATE CONSTRAINT user_passes_user_id_fkey;
    ALTER TABLE public.user_passes VALIDATE CONSTRAINT user_passes_passed_user_id_fkey;

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding constraints: %', SQLERRM;
    -- If there's still an error, drop the constraints to leave the database in a clean state
    ALTER TABLE public.user_passes DROP CONSTRAINT IF EXISTS user_passes_user_id_fkey;
    ALTER TABLE public.user_passes DROP CONSTRAINT IF EXISTS user_passes_passed_user_id_fkey;
    RAISE EXCEPTION 'Failed to add foreign key constraints. Check for orphaned records in user_passes table.';
  END;

  -- Ensure the constraints are immediately visible
  NOTIFY pgrst, 'reload schema';

  -- Log success
  RAISE NOTICE 'Successfully added foreign key constraints to user_passes table';

END $$;

-- Add indexes for better query performance if they don't exist
DO $$
BEGIN
  -- Create index on user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'user_passes_user_id_idx' AND tablename = 'user_passes'
  ) THEN
    CREATE INDEX user_passes_user_id_idx ON public.user_passes(user_id);
  END IF;

  -- Create index on passed_user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'user_passes_passed_user_id_idx' AND tablename = 'user_passes'
  ) THEN
    CREATE INDEX user_passes_passed_user_id_idx ON public.user_passes(passed_user_id);
  END IF;
END $$;

-- Refresh the database system catalogs
ANALYZE public.user_passes;
ANALYZE public.profiles;

-- Notify PostgREST to refresh the schema cache
NOTIFY pgrst, 'reload schema';
