-- Enable RLS on content_likes table
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

-- Allow users to view all likes
CREATE POLICY "Enable read access for all users" 
ON content_likes FOR SELECT 
USING (true);

-- Allow users to insert their own likes
CREATE POLICY "Enable insert for authenticated users" 
ON content_likes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own likes
CREATE POLICY "Enable delete for users based on user_id" 
ON content_likes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Grant necessary permissions on the content_likes table
GRANT SELECT, INSERT, DELETE ON content_likes TO authenticated;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'content_likes_content_id_fkey'
  ) THEN
    ALTER TABLE content_likes 
    ADD CONSTRAINT content_likes_content_id_fkey 
    FOREIGN KEY (content_id) 
    REFERENCES content_posts(id) 
    ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'content_likes_user_id_fkey'
  ) THEN
    ALTER TABLE content_likes 
    ADD CONSTRAINT content_likes_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;
