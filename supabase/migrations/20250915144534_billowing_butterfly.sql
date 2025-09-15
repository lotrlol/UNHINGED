/*
  # Add comment_count to content_posts table

  1. Schema Changes
    - Add `comment_count` column to `content_posts` table
    - Set default value to 0 for existing posts
    - Update existing trigger to maintain comment counts

  2. Trigger Updates
    - Modify `update_comment_counts()` function to update parent post's comment_count
    - Handle both INSERT and DELETE operations
    - Ensure counts stay accurate

  3. Data Migration
    - Calculate current comment counts for existing posts
    - Update all existing posts with correct counts
*/

-- Add comment_count column to content_posts table
ALTER TABLE content_posts 
ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS content_posts_comment_count_idx ON content_posts(comment_count);

-- Update the trigger function to maintain comment counts on content_posts
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment reply count for parent comment if this is a reply
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE comments 
      SET reply_count = reply_count + 1 
      WHERE id = NEW.parent_id;
    END IF;
    
    -- Increment comment count for the content post
    UPDATE content_posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.content_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement reply count for parent comment if this was a reply
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE comments 
      SET reply_count = GREATEST(reply_count - 1, 0) 
      WHERE id = OLD.parent_id;
    END IF;
    
    -- Decrement comment count for the content post
    UPDATE content_posts 
    SET comment_count = GREATEST(comment_count - 1, 0) 
    WHERE id = OLD.content_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing content_posts with current comment counts
UPDATE content_posts 
SET comment_count = (
  SELECT COUNT(*) 
  FROM comments 
  WHERE comments.content_id = content_posts.id
)
WHERE comment_count = 0;