-- First, check if the table exists and has the correct structure
DO $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_likes') THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.content_likes (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      content_id uuid NOT NULL,
      user_id uuid NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      CONSTRAINT content_likes_pkey PRIMARY KEY (id),
      CONSTRAINT content_likes_content_id_fkey FOREIGN KEY (content_id) 
        REFERENCES public.content_posts (id) ON DELETE CASCADE,
      CONSTRAINT content_likes_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES auth.users (id) ON DELETE CASCADE,
      CONSTRAINT content_likes_content_id_user_id_key UNIQUE (content_id, user_id)
    );
    
    -- Enable RLS
    ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS content_likes_content_id_idx ON public.content_likes (content_id);
    CREATE INDEX IF NOT EXISTS content_likes_user_id_idx ON public.content_likes (user_id);
    
    -- Grant permissions
    GRANT ALL ON TABLE public.content_likes TO authenticated;
    
    -- Create policies
    CREATE POLICY "Allow public read access" 
    ON public.content_likes 
    FOR SELECT 
    USING (true);
    
    CREATE POLICY "Allow authenticated users to insert their own likes" 
    ON public.content_likes 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Allow users to delete their own likes" 
    ON public.content_likes 
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);
    
    -- Create a function to update like_count
    CREATE OR REPLACE FUNCTION public.update_content_like_count()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        UPDATE public.content_posts 
        SET like_count = COALESCE(like_count, 0) + 1 
        WHERE id = NEW.content_id;
      ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.content_posts 
        SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
        WHERE id = OLD.content_id;
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Create the trigger
    DROP TRIGGER IF EXISTS content_like_count_trigger ON public.content_likes;
    CREATE TRIGGER content_like_count_trigger
    AFTER INSERT OR DELETE ON public.content_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_content_like_count();
    
    -- Add comments
    COMMENT ON TABLE public.content_likes IS 'Tracks user likes on content posts';
    COMMENT ON COLUMN public.content_likes.content_id IS 'The content post that was liked';
    COMMENT ON COLUMN public.content_likes.user_id IS 'The user who liked the content';
  END IF;
END $$;
