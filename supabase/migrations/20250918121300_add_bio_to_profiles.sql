-- Add bio column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN bio TEXT NULL;
    
    COMMENT ON COLUMN public.profiles.bio IS 'User biography or description';
    
    RAISE NOTICE 'Added bio column to profiles table';
  ELSE
    RAISE NOTICE 'bio column already exists in profiles table';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error adding bio column: %', SQLERRM;
END $$;
