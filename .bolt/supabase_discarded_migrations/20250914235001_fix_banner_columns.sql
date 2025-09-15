-- Ensure banner_url and banner_path columns exist in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_path TEXT;

-- Refresh the schema cache to ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';
