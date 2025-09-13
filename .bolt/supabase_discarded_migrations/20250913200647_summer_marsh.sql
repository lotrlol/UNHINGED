/*
  # Fix ambiguous column references in create_user_match function

  1. Problem
    - The create_user_match() trigger function has parameter names that clash with table column names
    - This causes "column reference user1_id is ambiguous" errors when inserting into user_likes

  2. Solution
    - Recreate the function with prefixed parameter names (_liker_id, _liked_id)
    - Update all internal references to use the prefixed names
    - This eliminates ambiguity between function parameters and table columns

  3. Changes
    - Drop and recreate create_user_match() function with proper parameter naming
    - Function now uses _liker_id and _liked_id to avoid column name conflicts
*/

-- Drop the existing problematic function
DROP FUNCTION IF EXISTS public.create_user_match();

-- Recreate the function with proper parameter naming to avoid ambiguity
CREATE OR REPLACE FUNCTION public.create_user_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _liker_id uuid;
  _liked_id uuid;
  _existing_like_id uuid;
  _new_chat_id uuid;
  _match_id uuid;
BEGIN
  -- Get the liker and liked user IDs from the NEW record
  _liker_id := NEW.liker_id;
  _liked_id := NEW.liked_id;

  -- Check if the liked user has also liked the liker (mutual like)
  SELECT id INTO _existing_like_id
  FROM user_likes
  WHERE liker_id = _liked_id AND liked_id = _liker_id;

  -- If mutual like exists, create a match
  IF _existing_like_id IS NOT NULL THEN
    -- Create a new chat for this match
    INSERT INTO chats DEFAULT VALUES
    RETURNING id INTO _new_chat_id;

    -- Create the user match (ensure user1_id < user2_id for consistency)
    INSERT INTO user_matches (user1_id, user2_id, chat_id)
    VALUES (
      LEAST(_liker_id, _liked_id),
      GREATEST(_liker_id, _liked_id),
      _new_chat_id
    )
    RETURNING id INTO _match_id;

    -- Add both users as chat members
    INSERT INTO chat_members (chat_id, user_id)
    VALUES 
      (_new_chat_id, _liker_id),
      (_new_chat_id, _liked_id);
  END IF;

  RETURN NEW;
END;
$$;