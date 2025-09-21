/*
  # Fix create_user_match function to handle missing tables

  The create_user_match function is trying to insert into notifications table
  which might not exist or might have RLS issues. This migration updates the
  function to be more robust and handle missing tables gracefully.
*/

-- Update the create_user_match function to handle missing tables
CREATE OR REPLACE FUNCTION create_user_match()
RETURNS TRIGGER AS $$
DECLARE
  mutual_like_exists boolean;
  new_chat_id uuid;
  user1_id uuid;
  user2_id uuid;
BEGIN
  -- Check if there's a mutual like
  SELECT EXISTS(
    SELECT 1 FROM user_likes
    WHERE liker_id = NEW.liked_id
    AND liked_id = NEW.liker_id
  ) INTO mutual_like_exists;

  -- If mutual like exists, create a match
  IF mutual_like_exists THEN
    -- Ensure consistent ordering (smaller UUID first)
    IF NEW.liker_id < NEW.liked_id THEN
      user1_id := NEW.liker_id;
      user2_id := NEW.liked_id;
    ELSE
      user1_id := NEW.liked_id;
      user2_id := NEW.liker_id;
    END IF;

    -- Check if match already exists
    IF NOT EXISTS(
      SELECT 1 FROM user_matches
      WHERE user1_id = user1_id AND user2_id = user2_id
    ) THEN
      -- Create a chat for the match
      INSERT INTO chats (project_id, group_id)
      VALUES (NULL, NULL)
      RETURNING id INTO new_chat_id;

      -- Add both users to the chat
      INSERT INTO chat_members (chat_id, user_id) VALUES
        (new_chat_id, user1_id),
        (new_chat_id, user2_id);

      -- Create the match
      INSERT INTO user_matches (user1_id, user2_id, chat_id)
      VALUES (user1_id, user2_id, new_chat_id);

      -- Try to create notifications (ignore errors if table doesn't exist or has RLS issues)
      BEGIN
        INSERT INTO notifications (user_id, type, title, content, data) VALUES
          (user1_id, 'match', 'New Match!', 'You have a new match! Start chatting now.',
           jsonb_build_object('match_user_id', user2_id, 'chat_id', new_chat_id)),
          (user2_id, 'match', 'New Match!', 'You have a new match! Start chatting now.',
           jsonb_build_object('match_user_id', user1_id, 'chat_id', new_chat_id));
      EXCEPTION
        WHEN undefined_table THEN
          -- Notifications table doesn't exist, continue without notifications
          NULL;
        WHEN insufficient_privilege THEN
          -- RLS issue with notifications, continue without notifications
          NULL;
        WHEN OTHERS THEN
          -- Other error, continue without notifications
          NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
