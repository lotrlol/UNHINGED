-- Enable RLS on content_likes table
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_likes' AND policyname = 'Enable read access for all users') THEN
    DROP POLICY "Enable read access for all users" ON content_likes;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_likes' AND policyname = 'Enable insert for authenticated users') THEN
    DROP POLICY "Enable insert for authenticated users" ON content_likes;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_likes' AND policyname = 'Enable delete for users based on user_id') THEN
    DROP POLICY "Enable delete for users based on user_id" ON content_likes;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for all users" 
ON content_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON content_likes 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable delete for users based on user_id" 
ON content_likes 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON content_likes TO authenticated;

-- Create a trigger to update like_count
CREATE OR REPLACE FUNCTION update_content_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_posts 
    SET like_count = GREATEST(0, like_count - 1) 
    WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'content_like_count_trigger'
  ) THEN
    CREATE TRIGGER content_like_count_trigger
    AFTER INSERT OR DELETE ON content_likes
    FOR EACH ROW EXECUTE FUNCTION update_content_like_count();
  END IF;
END $$;
