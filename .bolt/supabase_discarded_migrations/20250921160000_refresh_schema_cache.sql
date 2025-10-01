-- Refresh PostgREST schema cache to recognize the corrected foreign key relationships
-- This migration fixes the issue where PostgREST couldn't find relationships between user_likes/user_passes and profiles

-- Notify PostgREST to refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Create or replace the refresh function to ensure it's available
CREATE OR REPLACE FUNCTION public.refresh_schema_cache()
RETURNS void AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function to ensure schema cache is refreshed
SELECT public.refresh_schema_cache();

-- Add a comment to explain what this function does
COMMENT ON FUNCTION public.refresh_schema_cache() IS 'Notifies PostgREST to reload the schema cache. Use this after making schema changes that affect foreign key relationships.';
