-- Create user_passes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  passed_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, passed_user_id),
  CHECK (user_id != passed_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_passes_user_id_idx ON public.user_passes(user_id);
CREATE INDEX IF NOT EXISTS user_passes_passed_user_id_idx ON public.user_passes(passed_user_id);

-- Enable RLS
ALTER TABLE public.user_passes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own passes" ON public.user_passes;
DROP POLICY IF EXISTS "Users can view their own passes" ON public.user_passes;
DROP POLICY IF EXISTS "Users can delete their own passes" ON public.user_passes;

-- Policy to allow users to insert their own passes
CREATE POLICY "Users can insert their own passes"
  ON public.user_passes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to view their own passes
CREATE POLICY "Users can view their own passes"
  ON public.user_passes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy to allow users to delete their own passes
CREATE POLICY "Users can delete their own passes"
  ON public.user_passes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Notify PostgREST to refresh the schema cache
NOTIFY pgrst, 'reload schema';
