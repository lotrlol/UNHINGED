-- First, identify and handle orphaned records in user_likes
DO $$
BEGIN
  -- Create a temporary table to store orphaned records for reference
  CREATE TEMP TABLE IF NOT EXISTS orphaned_user_likes AS
  SELECT * FROM public.user_likes
  WHERE liker_id NOT IN (SELECT id FROM public.profiles)
     OR liked_id NOT IN (SELECT id FROM public.profiles);

  -- Log the number of orphaned records being removed
  RAISE NOTICE 'Found % orphaned user_likes records that will be removed', 
    (SELECT COUNT(*) FROM orphaned_user_likes);

  -- Remove orphaned records
  DELETE FROM public.user_likes
  WHERE id IN (SELECT id FROM orphaned_user_likes);

  -- Now handle the foreign key constraints
  -- First, drop existing foreign key constraints if they exist
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'user_likes_liker_id_fkey' AND conrelid = 'public.user_likes'::regclass
  ) THEN
    ALTER TABLE public.user_likes DROP CONSTRAINT user_likes_liker_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'user_likes_liked_id_fkey' AND conrelid = 'public.user_likes'::regclass
  ) THEN
    ALTER TABLE public.user_likes DROP CONSTRAINT user_likes_liked_id_fkey;
  END IF;

  -- Now add them back with proper naming and structure
  -- First, add the constraints as NOT VALID to skip validation of existing rows
  BEGIN
    ALTER TABLE public.user_likes
    ADD CONSTRAINT user_likes_liker_id_fkey
    FOREIGN KEY (liker_id) REFERENCES public.profiles(id) 
    ON DELETE CASCADE
    NOT VALID;

    ALTER TABLE public.user_likes
    ADD CONSTRAINT user_likes_liked_id_fkey
    FOREIGN KEY (liked_id) REFERENCES public.profiles(id) 
    ON DELETE CASCADE
    NOT VALID;
    
    -- Now validate the constraints (this should pass since we removed orphaned records)
    ALTER TABLE public.user_likes VALIDATE CONSTRAINT user_likes_liker_id_fkey;
    ALTER TABLE public.user_likes VALIDATE CONSTRAINT user_likes_liked_id_fkey;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adding constraints: %', SQLERRM;
    -- If there's still an error, drop the constraints to leave the database in a clean state
    ALTER TABLE public.user_likes DROP CONSTRAINT IF EXISTS user_likes_liker_id_fkey;
    ALTER TABLE public.user_likes DROP CONSTRAINT IF EXISTS user_likes_liked_id_fkey;
    RAISE EXCEPTION 'Failed to add foreign key constraints. Check for orphaned records in user_likes table.';
  END;
  
  -- Ensure the constraints are immediately visible
  NOTIFY pgrst, 'reload schema';
  
  -- Log success
  RAISE NOTICE 'Successfully added foreign key constraints to user_likes table';
  
  -- We can't use DISCARD ALL in a transaction, so we'll rely on the NOTIFY to refresh the schema cache
  -- The application may need to reconnect to see the changes
END $$;

-- Add a unique constraint to prevent duplicate likes if it doesn't exist
DO $$
BEGIN
  -- First, remove any potential duplicates to prevent the constraint from failing
  CREATE TEMP TABLE IF NOT EXISTS deduplicated_user_likes AS
  SELECT DISTINCT ON (liker_id, liked_id) *
  FROM public.user_likes
  ORDER BY liker_id, liked_id, created_at DESC;
  
  -- Delete all records and re-insert the deduplicated ones
  TRUNCATE TABLE public.user_likes;
  
  INSERT INTO public.user_likes
  SELECT * FROM deduplicated_user_likes;
  
  -- Now add the unique constraint
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'user_likes_unique_like' AND conrelid = 'public.user_likes'::regclass
  ) THEN
    BEGIN
      ALTER TABLE public.user_likes
      ADD CONSTRAINT user_likes_unique_like 
      UNIQUE (liker_id, liked_id);
      
      RAISE NOTICE 'Successfully added unique constraint to user_likes table';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
      RAISE NOTICE 'This might be due to duplicate (liker_id, liked_id) pairs in the data';
    END;
  END IF;
  
  -- Clean up
  DROP TABLE IF EXISTS deduplicated_user_likes;
END $$;

-- Add check to prevent users from liking themselves if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'user_likes_no_self_like' AND conrelid = 'public.user_likes'::regclass
  ) THEN
    ALTER TABLE public.user_likes
    ADD CONSTRAINT user_likes_no_self_like CHECK (liker_id != liked_id);
  END IF;
END $$;

-- Create indexes for better query performance if they don't exist
DO $$
BEGIN
  -- Create index on liker_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'user_likes_liker_id_idx' AND tablename = 'user_likes'
  ) THEN
    CREATE INDEX user_likes_liker_id_idx ON public.user_likes(liker_id);
  END IF;
  
  -- Create index on liked_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_indexes 
    WHERE indexname = 'user_likes_liked_id_idx' AND tablename = 'user_likes'
  ) THEN
    CREATE INDEX user_likes_liked_id_idx ON public.user_likes(liked_id);
  END IF;
END $$;

-- Enable RLS for user_likes table if not already enabled
DO $$
BEGIN
  -- Check if RLS is already enabled
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'user_likes' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy to allow users to view their own likes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'user_likes' AND policyname = 'Users can view their own likes'
  ) THEN
    CREATE POLICY "Users can view their own likes"
    ON public.user_likes
    FOR SELECT
    TO authenticated
    USING (liker_id = auth.uid() OR liked_id = auth.uid());
  END IF;
END $$;

-- Policy to allow users to create their own likes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'user_likes' AND policyname = 'Users can create their own likes'
  ) THEN
    CREATE POLICY "Users can create their own likes"
    ON public.user_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (liker_id = auth.uid());
  END IF;
END $$;

-- Policy to allow users to delete their own likes if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'user_likes' AND policyname = 'Users can delete their own likes'
  ) THEN
    CREATE POLICY "Users can delete their own likes"
    ON public.user_likes
    FOR DELETE
    TO authenticated
    USING (liker_id = auth.uid());
  END IF;
END $$;

-- Refresh the database system catalogs
ANALYZE public.user_likes;
ANALYZE public.profiles;

-- Notify PostgREST to refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Create a view that enforces the relationship for PostgREST
CREATE OR REPLACE VIEW public.user_likes_with_profiles AS
SELECT 
  ul.*,
  liker.username as liker_username,
  liked.username as liked_username
FROM 
  public.user_likes ul
  JOIN public.profiles liker ON ul.liker_id = liker.id
  JOIN public.profiles liked ON ul.liked_id = liked.id;

-- Create a function to refresh the schema cache
CREATE OR REPLACE FUNCTION public.refresh_schema_cache()
RETURNS void AS $$
BEGIN
  -- We can't use DISCARD ALL in a transaction, so we'll just notify
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function to refresh the schema cache
SELECT public.refresh_schema_cache();

-- Add a comment to inform that a reconnect might be needed
COMMENT ON FUNCTION public.refresh_schema_cache() IS 'Notifies PostgREST to reload the schema cache. A client reconnect might be needed to see the changes.';
