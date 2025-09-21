-- Create user_links table to store user's social/website links
CREATE TABLE IF NOT EXISTS public.user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS user_links_user_id_idx ON public.user_links(user_id);
CREATE INDEX IF NOT EXISTS user_links_display_order_idx ON public.user_links(display_order);

-- Enable Row Level Security
ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own links"
  ON public.user_links
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links"
  ON public.user_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
  ON public.user_links
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
  ON public.user_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_links_updated_at
BEFORE UPDATE ON public.user_links
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Create a function to get all links for the current user
CREATE OR REPLACE FUNCTION public.get_my_links()
RETURNS SETOF public.user_links
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.user_links WHERE user_id = auth.uid() ORDER BY display_order ASC;
$$;

-- Create a function to update the display order of links
CREATE OR REPLACE FUNCTION public.update_link_order(link_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i INTEGER := 0;
  link_id UUID;
BEGIN
  FOREACH link_id IN ARRAY link_ids LOOP
    UPDATE public.user_links
    SET display_order = i,
        updated_at = NOW()
    WHERE id = link_id
    AND user_id = auth.uid();
    i := i + 1;
  END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_links TO authenticated;

-- Notify PostgREST to refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Add a comment to the table
COMMENT ON TABLE public.user_links IS 'Stores user''s social/website links with display ordering';

-- Add comments to columns
COMMENT ON COLUMN public.user_links.user_id IS 'Reference to the user who owns this link';
COMMENT ON COLUMN public.user_links.title IS 'Display title for the link';
COMMENT ON COLUMN public.user_links.url IS 'The actual URL';
COMMENT ON COLUMN public.user_links.image_url IS 'Optional image/icon URL for the link';
COMMENT ON COLUMN public.user_links.display_order IS 'Order in which to display the links (ascending)';

-- Create a view for public access to user links (only non-null fields)
CREATE OR REPLACE VIEW public.user_links_public AS
SELECT 
  id,
  user_id,
  title,
  url,
  image_url,
  display_order
FROM public.user_links
WHERE user_id = auth.uid();

-- Grant select on the public view
GRANT SELECT ON public.user_links_public TO authenticated;
