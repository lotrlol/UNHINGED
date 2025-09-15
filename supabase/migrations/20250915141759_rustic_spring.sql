/*
  # Friend Request System with Messaging

  1. New Tables
    - `friend_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `message` (text, optional message with request)
      - `status` (enum: pending, accepted, rejected)
      - `created_at` (timestamp)
      - `responded_at` (timestamp, when accepted/rejected)

  2. Security
    - Enable RLS on `friend_requests` table
    - Add policies for users to manage their own requests
    - Add policies for viewing incoming/outgoing requests

  3. Functions
    - Trigger to create user match when request is accepted
    - Trigger to create chat when match is created

  4. Indexes
    - Performance indexes for common queries
*/

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS friend_requests_sender_idx ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS friend_requests_receiver_idx ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS friend_requests_status_idx ON friend_requests(status);
CREATE INDEX IF NOT EXISTS friend_requests_created_at_idx ON friend_requests(created_at DESC);

-- RLS Policies for friend_requests
CREATE POLICY "Users can send friend requests"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their sent requests"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can view their received requests"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (receiver_id = auth.uid());

CREATE POLICY "Users can update received requests"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

CREATE POLICY "Users can delete their sent requests"
  ON friend_requests
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() AND status = 'pending');

-- Function to create user match when friend request is accepted
CREATE OR REPLACE FUNCTION create_user_match_from_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create match if request was accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Create chat first
    INSERT INTO chats (project_id, group_id)
    VALUES (NULL, NULL);
    
    -- Get the chat ID
    DECLARE
      chat_id uuid;
    BEGIN
      SELECT id INTO chat_id FROM chats WHERE project_id IS NULL AND group_id IS NULL ORDER BY created_at DESC LIMIT 1;
      
      -- Add both users to the chat
      INSERT INTO chat_members (chat_id, user_id)
      VALUES 
        (chat_id, NEW.sender_id),
        (chat_id, NEW.receiver_id);
      
      -- Create user match (ensure user1_id < user2_id for consistency)
      INSERT INTO user_matches (user1_id, user2_id, chat_id)
      VALUES (
        CASE WHEN NEW.sender_id < NEW.receiver_id THEN NEW.sender_id ELSE NEW.receiver_id END,
        CASE WHEN NEW.sender_id < NEW.receiver_id THEN NEW.receiver_id ELSE NEW.sender_id END,
        chat_id
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
      
      -- Create notifications for both users
      INSERT INTO notifications (user_id, type, title, content, data)
      VALUES 
        (NEW.sender_id, 'match', 'Friend Request Accepted!', 
         (SELECT full_name FROM profiles WHERE id = NEW.receiver_id) || ' accepted your friend request!',
         jsonb_build_object('user_id', NEW.receiver_id, 'chat_id', chat_id)),
        (NEW.receiver_id, 'match', 'New Friend!', 
         'You are now connected with ' || (SELECT full_name FROM profiles WHERE id = NEW.sender_id) || '!',
         jsonb_build_object('user_id', NEW.sender_id, 'chat_id', chat_id));
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend request acceptance
CREATE TRIGGER friend_request_accepted_trigger
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_user_match_from_request();

-- Function to send notification when friend request is created
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for receiver
  INSERT INTO notifications (user_id, type, title, content, data)
  VALUES (
    NEW.receiver_id,
    'application',
    'New Friend Request',
    (SELECT full_name FROM profiles WHERE id = NEW.sender_id) || ' wants to connect with you!' ||
    CASE WHEN NEW.message IS NOT NULL THEN ' Message: "' || NEW.message || '"' ELSE '' END,
    jsonb_build_object('sender_id', NEW.sender_id, 'request_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for friend request notifications
CREATE TRIGGER friend_request_notification_trigger
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();