-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow public read access to profiles
CREATE POLICY "Public read access"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to update specific fields in their own profile
CREATE POLICY "Users can update their own banner"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    (
      -- Only allow updating these specific fields
      (SELECT array_length(ARRAY(
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name IN ('banner_url', 'avatar_url', 'updated_at')
        AND column_name = ANY(ARRAY(SELECT jsonb_object_keys(to_jsonb(NEW) - 'id')))
      ), 1)) > 0
    )
  );
