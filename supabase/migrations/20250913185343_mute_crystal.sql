/*
  Reset RLS for chats, chat_members, messages to avoid recursion.
  - chat_members: user can only see/join/leave their own rows (no subqueries)
  - chats/messages: visibility via EXISTS against chat_members
  This avoids chats<->chat_members circular references.
*/

-- Ensure RLS is ON (safe if already on)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =========================
-- Drop ALL existing policies (idempotent)
-- =========================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('chats', 'chat_members', 'messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- =========================
-- chat_members (NO recursion)
-- =========================
-- Users can read ONLY their own membership rows
CREATE POLICY "chat_members_select_own"
  ON public.chat_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can join chats ONLY as themselves
CREATE POLICY "chat_members_insert_self"
  ON public.chat_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can leave chats ONLY removing their own row
CREATE POLICY "chat_members_delete_own"
  ON public.chat_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =========================
-- chats (resolve via membership EXISTS)
-- =========================
-- Users can view chats where they are a member
CREATE POLICY "chats_select_if_member"
  ON public.chats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_members cm
      WHERE cm.chat_id = chats.id
        AND cm.user_id = auth.uid()
    )
  );

-- =========================
-- messages (resolve via membership EXISTS)
-- =========================
-- Users can read messages from chats they belong to
CREATE POLICY "messages_select_if_member"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.chat_members cm
      WHERE cm.chat_id = messages.chat_id
        AND cm.user_id = auth.uid()
    )
  );

-- Users can send messages only if they are a member of that chat and sender_id is themselves
CREATE POLICY "messages_insert_if_member_and_sender"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.chat_members cm
      WHERE cm.chat_id = messages.chat_id
        AND cm.user_id = auth.uid()
    )
  );

-- =========================
-- Fix projects table policy for joins
-- =========================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
CREATE POLICY "projects_select_all"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

-- =========================
-- Helpful indexes (safe to re-run)
-- =========================
CREATE INDEX IF NOT EXISTS chat_members_user_id_idx ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS chat_members_chat_id_idx ON public.chat_members(chat_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);