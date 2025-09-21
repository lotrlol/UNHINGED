
\restrict 2wCw996p4dHdbQpvEBwJRvkpU362WZPKlB7TCUymYYIHyOdsDGEHgVTUnWH59Xa


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."content_type_enum" AS ENUM (
    'video',
    'audio',
    'image',
    'article'
);


ALTER TYPE "public"."content_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_chat_for_match"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_chat_id uuid;
BEGIN
  -- Create chat
  INSERT INTO chats (project_id)
  VALUES (NEW.project_id)
  RETURNING id INTO new_chat_id;

  -- Link match to chat
  UPDATE matches
  SET chat_id = new_chat_id
  WHERE id = NEW.id;

  -- Add both members
  INSERT INTO chat_members (chat_id, user_id) VALUES
    (new_chat_id, NEW.creator_id),
    (new_chat_id, NEW.user_id);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_chat_for_match"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_match"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."create_user_match"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_match_from_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."create_user_match_from_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  EXECUTE format('UPDATE %I SET %I = GREATEST(0, %I - $1) WHERE id = $2', 
                table_name, column_name, column_name)
  USING amount, id_value;
END;
$_$;


ALTER FUNCTION "public"."decrement"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_discoverable_users"("p_user_id" "uuid", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "username" "text", "full_name" "text", "roles" "text"[], "skills" "text"[], "looking_for" "text"[], "tagline" "text", "vibe_words" "text"[], "location" "text", "is_remote" boolean, "avatar_url" "text", "cover_url" "text", "is_verified" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.roles,
    p.skills,
    p.looking_for,
    p.tagline,
    p.vibe_words,
    p.location,
    p.is_remote,
    p.avatar_url,
    p.cover_url,
    p.is_verified,
    p.created_at
  FROM 
    public.profiles p
  WHERE 
    p.id != p_user_id  -- Don't show current user
    AND p.id NOT IN (
      -- Exclude users that have been liked
      SELECT liked_id 
      FROM public.user_likes 
      WHERE liker_id = p_user_id
    )
    AND p.id NOT IN (
      -- Exclude users that have been passed
      SELECT passed_user_id 
      FROM public.user_passes 
      WHERE user_id = p_user_id
    )
  ORDER BY 
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_discoverable_users"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mutual_likes"() RETURNS TABLE("user_id" "uuid", "username" "text", "avatar_url" "text", "full_name" "text", "matched_at" timestamp with time zone)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    ul1.liked_id as user_id,
    p.username,
    p.avatar_url,
    p.full_name,
    ul1.created_at as matched_at
  FROM public.user_likes ul1
  JOIN public.user_likes ul2 
    ON ul1.liker_id = ul2.liked_id 
    AND ul1.liked_id = ul2.liker_id
  JOIN public.profiles p ON p.id = ul1.liked_id
  WHERE ul1.liker_id = auth.uid()
  ORDER BY ul1.created_at DESC;
$$;


ALTER FUNCTION "public"."get_mutual_likes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_content_with_stats"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "creator_id" "uuid", "title" "text", "description" "text", "content_type" "text", "media_urls" "text"[], "thumbnail_url" "text", "external_url" "text", "tags" "text"[], "is_featured" boolean, "is_nsfw" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "creator_username" "text", "creator_avatar" "text", "creator_roles" "text"[], "like_count" bigint, "comment_count" bigint, "view_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.*,
    p.username as creator_username,
    p.avatar_url as creator_avatar,
    p.roles as creator_roles,
    COALESCE(l.like_count, 0)::BIGINT as like_count,
    COALESCE(cm.comment_count, 0)::BIGINT as comment_count,
    COALESCE(v.view_count, 0)::BIGINT as view_count
  FROM 
    public.content c
    JOIN public.profiles p ON c.creator_id = p.id
    LEFT JOIN (
      SELECT content_id, COUNT(*) as like_count
      FROM public.content_likes
      GROUP BY content_id
    ) l ON c.id = l.content_id
    LEFT JOIN (
      SELECT content_id, COUNT(*) as comment_count
      FROM public.comments
      GROUP BY content_id
    ) cm ON c.id = cm.content_id
    LEFT JOIN (
      SELECT content_id, COUNT(*) as view_count
      FROM public.content_views
      GROUP BY content_id
    ) v ON c.id = v.content_id
  WHERE 
    c.creator_id = p_user_id
  ORDER BY 
    c.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_content_with_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_comment_mentions"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  mentioned_user_id uuid;
  commenter_profile profiles%ROWTYPE;
  content_post content_posts%ROWTYPE;
BEGIN
  -- Get commenter profile
  SELECT * INTO commenter_profile FROM profiles WHERE id = NEW.user_id;
  
  -- Get content post
  SELECT * INTO content_post FROM content_posts WHERE id = NEW.content_id;
  
  -- Process each mentioned user
  FOREACH mentioned_user_id IN ARRAY NEW.mentioned_users
  LOOP
    -- Insert mention record
    INSERT INTO comment_mentions (comment_id, mentioned_user_id)
    VALUES (NEW.id, mentioned_user_id)
    ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
    
    -- Create notification for mentioned user
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      data
    ) VALUES (
      mentioned_user_id,
      'mention',
      'You were mentioned in a comment',
      commenter_profile.full_name || ' mentioned you in a comment on "' || content_post.title || '"',
      jsonb_build_object(
        'comment_id', NEW.id,
        'content_id', NEW.content_id,
        'commenter_id', NEW.user_id,
        'commenter_name', commenter_profile.full_name
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_comment_mentions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_liked_user"("target_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_likes 
    WHERE liker_id = auth.uid() 
    AND liked_id = target_user_id
  );
$$;


ALTER FUNCTION "public"."has_liked_user"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + $1 WHERE id = $2', 
                table_name, column_name, column_name)
  USING amount, id_value;
END;
$_$;


ALTER FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_owner_banner"("path" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    storage.filename(path) = (auth.uid()::text || '.jpg') OR
    storage.filename(path) = (auth.uid()::text || '.jpeg') OR
    storage.filename(path) = (auth.uid()::text || '.png') OR
    storage.filename(path) = (auth.uid()::text || '.webp') OR
    storage.filename(path) = (auth.uid()::text || '.gif')
  );
END;
$$;


ALTER FUNCTION "public"."is_owner_banner"("path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."matches_user_id_pattern"("filename" "text", "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  RETURN filename ~ ('^' || user_id::text || '-[0-9]+\\.(jpg|jpeg|png|webp|gif)$');
END;
$_$;


ALTER FUNCTION "public"."matches_user_id_pattern"("filename" "text", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_friend_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."notify_friend_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_user_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Insert notification for the user being followed
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  SELECT 
    NEW.following_id,
    'follow',
    'New Follower!',
    follower.full_name || ' (@' || follower.username || ') started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follow_id', NEW.id
    )
  FROM profiles follower
  WHERE follower.id = NEW.follower_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_user_follow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."update_comment_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_like_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_comment_like_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_like_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_content_like_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_view_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE content_posts 
  SET view_count = view_count + 1 
  WHERE id = NEW.content_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_content_view_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_comment_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comment count on project
    UPDATE projects
    SET comment_count = comment_count + 1
    WHERE id = NEW.project_id;
    
    -- If this is a reply, increment reply count on parent comment
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE project_comments
      SET reply_count = reply_count + 1
      WHERE id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comment count on project
    UPDATE projects
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.project_id;
    
    -- If this was a reply, decrement reply count on parent comment
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE project_comments
      SET reply_count = GREATEST(reply_count - 1, 0)
      WHERE id = OLD.parent_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_project_comment_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_comment_like_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE project_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE project_comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_project_comment_like_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_view_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE projects
  SET view_count = view_count + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_project_view_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chat_members" (
    "chat_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "group_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_mentions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "mentioned_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comment_mentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "mentioned_users" "text"[] DEFAULT '{}'::"text"[],
    "like_count" integer DEFAULT 0,
    "reply_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "content_type" "text" NOT NULL,
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "thumbnail_url" "text",
    "external_url" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_featured" boolean DEFAULT false,
    "is_nsfw" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_content_type_check" CHECK (("content_type" = ANY (ARRAY['video'::"text", 'audio'::"text", 'image'::"text", 'article'::"text"])))
);


ALTER TABLE "public"."content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "content_type" "public"."content_type_enum" NOT NULL,
    "platform" "text",
    "external_url" "text",
    "thumbnail_url" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_featured" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "comment_count" integer DEFAULT 0
);


ALTER TABLE "public"."content_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "roles" "text"[] DEFAULT '{}'::"text"[],
    "skills" "text"[] DEFAULT '{}'::"text"[],
    "looking_for" "text"[] DEFAULT '{}'::"text"[],
    "tagline" "text",
    "vibe_words" "text"[] DEFAULT '{}'::"text"[],
    "location" "text",
    "is_remote" boolean DEFAULT false,
    "nsfw_preference" boolean DEFAULT false,
    "avatar_url" "text",
    "cover_url" "text",
    "is_verified" boolean DEFAULT false,
    "phone_verified" boolean DEFAULT false,
    "flagged" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "onboarding_completed" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "banner_url" "text",
    "banner_path" "text",
    "avatar_path" "text",
    "bio" "text",
    CONSTRAINT "profiles_roles_not_null" CHECK (("roles" IS NOT NULL))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."roles" IS 'Array of role strings for the user';



COMMENT ON COLUMN "public"."profiles"."bio" IS 'User biography or description';



CREATE OR REPLACE VIEW "public"."content_with_creators" AS
 SELECT "cp"."id",
    "cp"."creator_id",
    "cp"."title",
    "cp"."description",
    "cp"."content_type",
    "cp"."platform",
    "cp"."external_url",
    "cp"."thumbnail_url",
    "cp"."tags",
    "cp"."is_featured",
    "cp"."view_count",
    "cp"."like_count",
    "cp"."created_at",
    "cp"."updated_at",
    "p"."username" AS "creator_username",
    "p"."full_name" AS "creator_name",
    "p"."avatar_url" AS "creator_avatar",
    "p"."roles" AS "creator_roles",
    "p"."is_verified" AS "creator_verified"
   FROM ("public"."content_posts" "cp"
     JOIN "public"."profiles" "p" ON (("p"."id" = "cp"."creator_id")))
  WHERE ("p"."flagged" = false);


ALTER VIEW "public"."content_with_creators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friend_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    CONSTRAINT "friend_requests_check" CHECK (("sender_id" <> "receiver_id")),
    CONSTRAINT "friend_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."friend_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "is_admin" boolean DEFAULT false,
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text" NOT NULL,
    "avatar_url" "text",
    "cover_url" "text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "creator_id" "uuid",
    "chat_id" "uuid"
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid",
    "sender_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['application'::"text", 'match'::"text", 'message'::"text", 'project_update'::"text", 'system'::"text", 'follow'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "applicant_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "applied_at" timestamp with time zone DEFAULT "now"(),
    "decided_at" timestamp with time zone,
    CONSTRAINT "project_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."project_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_comment_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_comment_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "like_count" integer DEFAULT 0,
    "reply_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "user_id" "uuid",
    "choice" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "creator_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "roles_needed" "text"[] DEFAULT '{}'::"text"[],
    "collab_type" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "location" "text",
    "is_remote" boolean DEFAULT false,
    "nsfw" boolean DEFAULT false,
    "cover_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "view_count" integer DEFAULT 0,
    "comment_count" integer DEFAULT 0,
    CONSTRAINT "projects_collab_type_check" CHECK (("collab_type" = ANY (ARRAY['Paid'::"text", 'Unpaid'::"text", 'Revenue Split'::"text"]))),
    CONSTRAINT "projects_creator_type_check" CHECK (("creator_type" = ANY (ARRAY['profile'::"text", 'group'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."projects_with_profiles" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."creator_id",
    "p"."creator_type",
    "p"."title",
    "p"."description",
    "p"."roles_needed",
    "p"."collab_type",
    "p"."tags",
    "p"."location",
    "p"."is_remote",
    "p"."nsfw",
    "p"."cover_url",
    "p"."created_at",
        CASE
            WHEN ("p"."creator_type" = 'profile'::"text") THEN "pr"."full_name"
            WHEN ("p"."creator_type" = 'group'::"text") THEN "g"."name"
            ELSE 'Unknown'::"text"
        END AS "creator_name",
        CASE
            WHEN ("p"."creator_type" = 'profile'::"text") THEN "pr"."avatar_url"
            WHEN ("p"."creator_type" = 'group'::"text") THEN "g"."avatar_url"
            ELSE NULL::"text"
        END AS "creator_avatar",
        CASE
            WHEN ("p"."creator_type" = 'profile'::"text") THEN "pr"."roles"
            WHEN ("p"."creator_type" = 'group'::"text") THEN ARRAY[]::"text"[]
            ELSE ARRAY[]::"text"[]
        END AS "creator_roles"
   FROM (("public"."projects" "p"
     LEFT JOIN "public"."profiles" "pr" ON ((("p"."creator_type" = 'profile'::"text") AND ("p"."creator_id" = "pr"."id"))))
     LEFT JOIN "public"."groups" "g" ON ((("p"."creator_type" = 'group'::"text") AND ("p"."creator_id" = "g"."id"))))
  WHERE ((("p"."creator_type" = 'profile'::"text") AND ("pr"."flagged" = false)) OR ("p"."creator_type" = 'group'::"text"));


ALTER VIEW "public"."projects_with_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_profiles" AS
 SELECT "id",
    "username",
    "full_name",
    "roles",
    "skills",
    "tagline",
    "vibe_words",
    "location",
    "is_remote",
    "avatar_url",
    "cover_url",
    "is_verified",
    "created_at"
   FROM "public"."profiles"
  WHERE ("flagged" = false);


ALTER VIEW "public"."public_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid",
    "reported_user_id" "uuid",
    "reported_project_id" "uuid",
    "reported_message_id" "uuid",
    "reason" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blocker_id" "uuid",
    "blocked_id" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_follows_no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "liker_id" "uuid" NOT NULL,
    "liked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "chat_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_matches_check" CHECK (("user1_id" <> "user2_id"))
);


ALTER TABLE "public"."user_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_passes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "passed_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_passes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "marketing_emails" boolean DEFAULT false,
    "show_online_status" boolean DEFAULT true,
    "auto_accept_matches" boolean DEFAULT false,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_pkey" PRIMARY KEY ("chat_id", "user_id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_mentions"
    ADD CONSTRAINT "comment_mentions_comment_id_mentioned_user_id_key" UNIQUE ("comment_id", "mentioned_user_id");



ALTER TABLE ONLY "public"."comment_mentions"
    ADD CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_likes"
    ADD CONSTRAINT "content_likes_content_id_user_id_key" UNIQUE ("content_id", "user_id");



ALTER TABLE ONLY "public"."content_likes"
    ADD CONSTRAINT "content_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_posts"
    ADD CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_views"
    ADD CONSTRAINT "content_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_sender_id_receiver_id_key" UNIQUE ("sender_id", "receiver_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_project_id_applicant_id_key" UNIQUE ("project_id", "applicant_id");



ALTER TABLE ONLY "public"."project_comment_likes"
    ADD CONSTRAINT "project_comment_likes_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."project_comment_likes"
    ADD CONSTRAINT "project_comment_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_project_id_user_id_key" UNIQUE ("project_id", "user_id");



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocker_id_blocked_id_key" UNIQUE ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_unique" UNIQUE ("follower_id", "following_id");



ALTER TABLE ONLY "public"."user_likes"
    ADD CONSTRAINT "user_likes_liker_id_liked_id_key" UNIQUE ("liker_id", "liked_id");



ALTER TABLE ONLY "public"."user_likes"
    ADD CONSTRAINT "user_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_matches"
    ADD CONSTRAINT "user_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_matches"
    ADD CONSTRAINT "user_matches_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."user_passes"
    ADD CONSTRAINT "user_passes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_passes"
    ADD CONSTRAINT "user_passes_user_id_passed_user_id_key" UNIQUE ("user_id", "passed_user_id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "chat_members_chat_id_idx" ON "public"."chat_members" USING "btree" ("chat_id");



CREATE INDEX "chat_members_chat_idx" ON "public"."chat_members" USING "btree" ("chat_id");



CREATE INDEX "chat_members_user_id_idx" ON "public"."chat_members" USING "btree" ("user_id");



CREATE INDEX "chat_members_user_idx" ON "public"."chat_members" USING "btree" ("user_id");



CREATE INDEX "chats_group_idx" ON "public"."chats" USING "btree" ("group_id");



CREATE INDEX "chats_project_idx" ON "public"."chats" USING "btree" ("project_id");



CREATE INDEX "comment_likes_comment_id_idx" ON "public"."comment_likes" USING "btree" ("comment_id");



CREATE INDEX "comment_likes_user_id_idx" ON "public"."comment_likes" USING "btree" ("user_id");



CREATE INDEX "comment_mentions_comment_id_idx" ON "public"."comment_mentions" USING "btree" ("comment_id");



CREATE INDEX "comment_mentions_mentioned_user_id_idx" ON "public"."comment_mentions" USING "btree" ("mentioned_user_id");



CREATE INDEX "comments_content_id_idx" ON "public"."comments" USING "btree" ("content_id");



CREATE INDEX "comments_created_at_idx" ON "public"."comments" USING "btree" ("created_at" DESC);



CREATE INDEX "comments_parent_id_idx" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "comments_user_id_idx" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "content_likes_content_idx" ON "public"."content_likes" USING "btree" ("content_id");



CREATE INDEX "content_likes_user_idx" ON "public"."content_likes" USING "btree" ("user_id");



CREATE INDEX "content_posts_comment_count_idx" ON "public"."content_posts" USING "btree" ("comment_count");



CREATE INDEX "content_posts_content_type_idx" ON "public"."content_posts" USING "btree" ("content_type");



CREATE INDEX "content_posts_created_at_idx" ON "public"."content_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "content_posts_creator_idx" ON "public"."content_posts" USING "btree" ("creator_id");



CREATE INDEX "content_posts_featured_idx" ON "public"."content_posts" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "content_posts_tags_idx" ON "public"."content_posts" USING "gin" ("tags");



CREATE INDEX "content_views_content_idx" ON "public"."content_views" USING "btree" ("content_id");



CREATE INDEX "content_views_created_at_idx" ON "public"."content_views" USING "btree" ("created_at" DESC);



CREATE INDEX "friend_requests_created_at_idx" ON "public"."friend_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "friend_requests_receiver_idx" ON "public"."friend_requests" USING "btree" ("receiver_id");



CREATE INDEX "friend_requests_sender_idx" ON "public"."friend_requests" USING "btree" ("sender_id");



CREATE INDEX "friend_requests_status_idx" ON "public"."friend_requests" USING "btree" ("status");



CREATE INDEX "group_members_admin_idx" ON "public"."group_members" USING "btree" ("is_admin");



CREATE INDEX "group_members_group_idx" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "group_members_user_idx" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "groups_name_idx" ON "public"."groups" USING "btree" ("name");



CREATE INDEX "groups_verified_idx" ON "public"."groups" USING "btree" ("is_verified");



CREATE INDEX "idx_content_created_at" ON "public"."content" USING "btree" ("created_at");



CREATE INDEX "idx_content_creator_id" ON "public"."content" USING "btree" ("creator_id");



CREATE INDEX "idx_content_posts_external_url" ON "public"."content_posts" USING "btree" ("external_url") WHERE ("external_url" IS NOT NULL);



CREATE INDEX "idx_content_posts_thumbnail_url" ON "public"."content_posts" USING "btree" ("thumbnail_url") WHERE ("thumbnail_url" IS NOT NULL);



CREATE INDEX "idx_content_views_content_id" ON "public"."content_views" USING "btree" ("content_id");



CREATE INDEX "idx_projects_collab_type" ON "public"."projects" USING "btree" ("collab_type");



CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_projects_creator_id" ON "public"."projects" USING "btree" ("creator_id");



CREATE INDEX "idx_projects_is_remote" ON "public"."projects" USING "btree" ("is_remote");



CREATE INDEX "idx_projects_location" ON "public"."projects" USING "btree" ("location");



CREATE INDEX "idx_projects_nsfw" ON "public"."projects" USING "btree" ("nsfw");



CREATE INDEX "idx_projects_roles_needed" ON "public"."projects" USING "gin" ("roles_needed");



CREATE INDEX "idx_projects_tags" ON "public"."projects" USING "gin" ("tags");



CREATE INDEX "idx_user_likes_liked_id" ON "public"."user_likes" USING "btree" ("liked_id");



CREATE INDEX "idx_user_likes_liker_id" ON "public"."user_likes" USING "btree" ("liker_id");



CREATE INDEX "idx_user_passes_passed_user_id" ON "public"."user_passes" USING "btree" ("passed_user_id");



CREATE INDEX "idx_user_passes_user_id" ON "public"."user_passes" USING "btree" ("user_id");



CREATE INDEX "matches_chat_id_idx" ON "public"."matches" USING "btree" ("chat_id");



CREATE INDEX "matches_creator_id_idx" ON "public"."matches" USING "btree" ("creator_id");



CREATE INDEX "matches_project_idx" ON "public"."matches" USING "btree" ("project_id");



CREATE INDEX "matches_user_id_idx" ON "public"."matches" USING "btree" ("user_id");



CREATE INDEX "matches_user_idx" ON "public"."matches" USING "btree" ("user_id");



CREATE INDEX "messages_chat_id_idx" ON "public"."messages" USING "btree" ("chat_id");



CREATE INDEX "messages_chat_idx" ON "public"."messages" USING "btree" ("chat_id");



CREATE INDEX "messages_created_at_idx" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "messages_sender_id_idx" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "messages_sender_idx" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "notifications_created_at_idx" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "notifications_read_idx" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "notifications_type_idx" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "notifications_user_idx" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "profiles_flagged_idx" ON "public"."profiles" USING "btree" ("flagged");



CREATE INDEX "profiles_is_remote_idx" ON "public"."profiles" USING "btree" ("is_remote");



CREATE INDEX "profiles_location_idx" ON "public"."profiles" USING "btree" ("location");



CREATE INDEX "profiles_onboarding_completed_idx" ON "public"."profiles" USING "btree" ("onboarding_completed");



CREATE INDEX "profiles_roles_idx" ON "public"."profiles" USING "gin" ("roles");



CREATE INDEX "profiles_username_idx" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "project_applications_applicant_idx" ON "public"."project_applications" USING "btree" ("applicant_id");



CREATE INDEX "project_applications_project_idx" ON "public"."project_applications" USING "btree" ("project_id");



CREATE INDEX "project_applications_status_idx" ON "public"."project_applications" USING "btree" ("status");



CREATE INDEX "project_comment_likes_comment_idx" ON "public"."project_comment_likes" USING "btree" ("comment_id");



CREATE INDEX "project_comment_likes_user_idx" ON "public"."project_comment_likes" USING "btree" ("user_id");



CREATE INDEX "project_comments_created_at_idx" ON "public"."project_comments" USING "btree" ("created_at" DESC);



CREATE INDEX "project_comments_parent_idx" ON "public"."project_comments" USING "btree" ("parent_id");



CREATE INDEX "project_comments_project_idx" ON "public"."project_comments" USING "btree" ("project_id");



CREATE INDEX "project_comments_user_idx" ON "public"."project_comments" USING "btree" ("user_id");



CREATE INDEX "project_likes_project_idx" ON "public"."project_likes" USING "btree" ("project_id");



CREATE INDEX "project_likes_user_idx" ON "public"."project_likes" USING "btree" ("user_id");



CREATE INDEX "project_views_created_at_idx" ON "public"."project_views" USING "btree" ("created_at" DESC);



CREATE INDEX "project_views_project_idx" ON "public"."project_views" USING "btree" ("project_id");



CREATE INDEX "project_views_user_idx" ON "public"."project_views" USING "btree" ("user_id");



CREATE INDEX "projects_collab_type_idx" ON "public"."projects" USING "btree" ("collab_type");



CREATE INDEX "projects_created_at_idx" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "projects_creator_idx" ON "public"."projects" USING "btree" ("creator_id", "creator_type");



CREATE INDEX "projects_location_idx" ON "public"."projects" USING "btree" ("location");



CREATE INDEX "projects_nsfw_idx" ON "public"."projects" USING "btree" ("nsfw");



CREATE INDEX "projects_remote_idx" ON "public"."projects" USING "btree" ("is_remote");



CREATE INDEX "projects_roles_idx" ON "public"."projects" USING "gin" ("roles_needed");



CREATE INDEX "projects_tags_idx" ON "public"."projects" USING "gin" ("tags");



CREATE INDEX "reports_reporter_idx" ON "public"."reports" USING "btree" ("reporter_id");



CREATE INDEX "reports_status_idx" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "user_blocks_blocked_idx" ON "public"."user_blocks" USING "btree" ("blocked_id");



CREATE INDEX "user_blocks_blocker_idx" ON "public"."user_blocks" USING "btree" ("blocker_id");



CREATE INDEX "user_follows_created_at_idx" ON "public"."user_follows" USING "btree" ("created_at" DESC);



CREATE INDEX "user_follows_follower_idx" ON "public"."user_follows" USING "btree" ("follower_id");



CREATE INDEX "user_follows_following_idx" ON "public"."user_follows" USING "btree" ("following_id");



CREATE INDEX "user_matches_created_at_idx" ON "public"."user_matches" USING "btree" ("created_at" DESC);



CREATE INDEX "user_matches_user1_idx" ON "public"."user_matches" USING "btree" ("user1_id");



CREATE INDEX "user_matches_user2_idx" ON "public"."user_matches" USING "btree" ("user2_id");



CREATE OR REPLACE TRIGGER "comment_count_trigger" AFTER INSERT OR DELETE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_counts"();



CREATE OR REPLACE TRIGGER "comment_like_count_trigger" AFTER INSERT OR DELETE ON "public"."comment_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_comment_like_counts"();



CREATE OR REPLACE TRIGGER "comment_mentions_trigger" AFTER INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_comment_mentions"();



CREATE OR REPLACE TRIGGER "content_like_count_trigger" AFTER INSERT OR DELETE ON "public"."content_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_like_count"();



CREATE OR REPLACE TRIGGER "content_view_count_trigger" AFTER INSERT ON "public"."content_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_view_count"();



CREATE OR REPLACE TRIGGER "create_chat_for_match_trigger" AFTER INSERT ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."create_chat_for_match"();



CREATE OR REPLACE TRIGGER "friend_request_accepted_trigger" AFTER UPDATE ON "public"."friend_requests" FOR EACH ROW EXECUTE FUNCTION "public"."create_user_match_from_request"();



CREATE OR REPLACE TRIGGER "friend_request_notification_trigger" AFTER INSERT ON "public"."friend_requests" FOR EACH ROW EXECUTE FUNCTION "public"."notify_friend_request"();



CREATE OR REPLACE TRIGGER "project_comment_count_trigger" AFTER INSERT OR DELETE ON "public"."project_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_comment_counts"();



CREATE OR REPLACE TRIGGER "project_comment_like_count_trigger" AFTER INSERT OR DELETE ON "public"."project_comment_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_comment_like_counts"();



CREATE OR REPLACE TRIGGER "project_view_count_trigger" AFTER INSERT ON "public"."project_views" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_view_count"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_comments_updated_at" BEFORE UPDATE ON "public"."project_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "user_follow_notification_trigger" AFTER INSERT ON "public"."user_follows" FOR EACH ROW EXECUTE FUNCTION "public"."notify_user_follow"();



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_members"
    ADD CONSTRAINT "chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_likes"
    ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_mentions"
    ADD CONSTRAINT "comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_mentions"
    ADD CONSTRAINT "comment_mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_likes"
    ADD CONSTRAINT "content_likes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_likes"
    ADD CONSTRAINT "content_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_posts"
    ADD CONSTRAINT "content_posts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_views"
    ADD CONSTRAINT "content_views_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_views"
    ADD CONSTRAINT "content_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friend_requests"
    ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_applications"
    ADD CONSTRAINT "project_applications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comment_likes"
    ADD CONSTRAINT "project_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."project_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comment_likes"
    ADD CONSTRAINT "project_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."project_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_comments"
    ADD CONSTRAINT "project_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_likes"
    ADD CONSTRAINT "project_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_message_id_fkey" FOREIGN KEY ("reported_message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_project_id_fkey" FOREIGN KEY ("reported_project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_likes"
    ADD CONSTRAINT "user_likes_liked_id_fkey" FOREIGN KEY ("liked_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_likes"
    ADD CONSTRAINT "user_likes_liker_id_fkey" FOREIGN KEY ("liker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_matches"
    ADD CONSTRAINT "user_matches_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_matches"
    ADD CONSTRAINT "user_matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_matches"
    ADD CONSTRAINT "user_matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_passes"
    ADD CONSTRAINT "user_passes_passed_user_id_fkey" FOREIGN KEY ("passed_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_passes"
    ADD CONSTRAINT "user_passes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can record project views" ON "public"."project_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can record views" ON "public"."content_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view comment likes" ON "public"."comment_likes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comment mentions" ON "public"."comment_mentions" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comments" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view follow relationships" ON "public"."user_follows" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view groups" ON "public"."groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view likes" ON "public"."content_likes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view non-flagged projects" ON "public"."projects" FOR SELECT USING ((NOT (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "projects"."creator_id") AND ("profiles"."flagged" = true))))));



CREATE POLICY "Anyone can view project comment likes" ON "public"."project_comment_likes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view project comments" ON "public"."project_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view published content" ON "public"."content_posts" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "content_posts"."creator_id") AND ("profiles"."flagged" = false)))));



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Authenticated users can create groups" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create project comments" ON "public"."project_comments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Authenticated users can create projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "creator_id") AND ("creator_type" = 'profile'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."flagged" = false))))));



CREATE POLICY "Enable delete for content creators" ON "public"."content" FOR DELETE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."content_likes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."content_likes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."content" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."content" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."content_likes" FOR SELECT USING (true);



CREATE POLICY "Enable update for content creators" ON "public"."content" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Group admins can manage all members" ON "public"."group_members" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm_check"
  WHERE (("gm_check"."group_id" = "group_members"."group_id") AND ("gm_check"."user_id" = "auth"."uid"()) AND ("gm_check"."is_admin" = true)))));



CREATE POLICY "Group admins can update groups" ON "public"."groups" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "groups"."id") AND ("gm"."user_id" = "auth"."uid"()) AND ("gm"."is_admin" = true)))));



CREATE POLICY "Project owners can update applications" ON "public"."project_applications" FOR UPDATE TO "authenticated" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."creator_type" = 'profile'::"text") AND ("projects"."creator_id" = "auth"."uid"())))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (("flagged" = false));



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "System can create comment mentions" ON "public"."comment_mentions" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can create matches" ON "public"."matches" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can create matches" ON "public"."user_matches" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can create applications" ON "public"."project_applications" FOR INSERT TO "authenticated" WITH CHECK (("applicant_id" = "auth"."uid"()));



CREATE POLICY "Users can create profile projects" ON "public"."projects" FOR INSERT TO "authenticated" WITH CHECK ((("creator_type" = 'profile'::"text") AND ("creator_id" = "auth"."uid"())));



CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own content" ON "public"."content_posts" FOR INSERT TO "authenticated" WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can create their own likes" ON "public"."user_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "liker_id"));



CREATE POLICY "Users can create their own passes" ON "public"."user_passes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own content" ON "public"."content_posts" FOR DELETE TO "authenticated" USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own likes" ON "public"."user_likes" FOR DELETE USING (("auth"."uid"() = "liker_id"));



CREATE POLICY "Users can delete their own project comments" ON "public"."project_comments" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own projects" ON "public"."projects" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can delete their profile projects" ON "public"."projects" FOR DELETE TO "authenticated" USING ((("creator_type" = 'profile'::"text") AND ("creator_id" = "auth"."uid"())));



CREATE POLICY "Users can delete their sent requests" ON "public"."friend_requests" FOR DELETE TO "authenticated" USING ((("sender_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can follow others" ON "public"."user_follows" FOR INSERT TO "authenticated" WITH CHECK (("follower_id" = "auth"."uid"()));



CREATE POLICY "Users can insert applications" ON "public"."project_applications" FOR INSERT TO "authenticated" WITH CHECK (("applicant_id" = "auth"."uid"()));



CREATE POLICY "Users can insert matches" ON "public"."matches" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can join groups themselves" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can leave groups themselves" ON "public"."group_members" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own blocks" ON "public"."user_blocks" TO "authenticated" USING (("blocker_id" = "auth"."uid"())) WITH CHECK (("blocker_id" = "auth"."uid"()));



CREATE POLICY "Users can manage settings" ON "public"."user_settings" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own comment likes" ON "public"."comment_likes" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own likes" ON "public"."content_likes" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own likes" ON "public"."project_likes" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own project comment likes" ON "public"."project_comment_likes" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read their matches" ON "public"."matches" FOR SELECT TO "authenticated" USING ((("creator_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can see if they are blocked" ON "public"."user_blocks" FOR SELECT TO "authenticated" USING (("blocked_id" = "auth"."uid"()));



CREATE POLICY "Users can send friend requests" ON "public"."friend_requests" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can unfollow others" ON "public"."user_follows" FOR DELETE TO "authenticated" USING (("follower_id" = "auth"."uid"()));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update received requests" ON "public"."friend_requests" FOR UPDATE TO "authenticated" USING (("receiver_id" = "auth"."uid"())) WITH CHECK (("receiver_id" = "auth"."uid"()));



CREATE POLICY "Users can update their matches" ON "public"."matches" FOR UPDATE TO "authenticated" USING ((("creator_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own content" ON "public"."content_posts" FOR UPDATE TO "authenticated" USING (("creator_id" = "auth"."uid"())) WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile." ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own project comments" ON "public"."project_comments" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "creator_id")) WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Users can update their profile projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING ((("creator_type" = 'profile'::"text") AND ("creator_id" = "auth"."uid"())));



CREATE POLICY "Users can view all group memberships" ON "public"."group_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view applications for their projects" ON "public"."project_applications" FOR SELECT TO "authenticated" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."creator_type" = 'profile'::"text") AND ("projects"."creator_id" = "auth"."uid"())))));



CREATE POLICY "Users can view content views" ON "public"."content_views" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view own applications" ON "public"."project_applications" FOR SELECT TO "authenticated" USING (("applicant_id" = "auth"."uid"()));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view project views" ON "public"."project_views" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ((("nsfw" = false) OR (("nsfw" = true) AND ("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."nsfw_preference" = true))))));



CREATE POLICY "Users can view their matches" ON "public"."matches" FOR SELECT TO "authenticated" USING ((("creator_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own applications" ON "public"."project_applications" FOR SELECT TO "authenticated" USING (("applicant_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own banner" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own likes" ON "public"."user_likes" FOR SELECT USING ((("auth"."uid"() = "liker_id") OR ("auth"."uid"() = "liked_id")));



CREATE POLICY "Users can view their own matches" ON "public"."user_matches" FOR SELECT TO "authenticated" USING ((("user1_id" = "auth"."uid"()) OR ("user2_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own passes" ON "public"."user_passes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their received requests" ON "public"."friend_requests" FOR SELECT TO "authenticated" USING (("receiver_id" = "auth"."uid"()));



CREATE POLICY "Users can view their reports" ON "public"."reports" FOR SELECT TO "authenticated" USING (("reporter_id" = "auth"."uid"()));



CREATE POLICY "Users can view their sent requests" ON "public"."friend_requests" FOR SELECT TO "authenticated" USING (("sender_id" = "auth"."uid"()));



ALTER TABLE "public"."chat_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_members_delete_own" ON "public"."chat_members" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "chat_members_insert_self" ON "public"."chat_members" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "chat_members_select_own" ON "public"."chat_members" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chats_select_if_member" ON "public"."chats" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."chat_members" "cm"
  WHERE (("cm"."chat_id" = "chats"."id") AND ("cm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."comment_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_mentions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friend_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_insert_if_member_and_sender" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."chat_members" "cm"
  WHERE (("cm"."chat_id" = "messages"."chat_id") AND ("cm"."user_id" = "auth"."uid"()))))));



CREATE POLICY "messages_select_if_member" ON "public"."messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."chat_members" "cm"
  WHERE (("cm"."chat_id" = "messages"."chat_id") AND ("cm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_comment_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_select_all" ON "public"."projects" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_passes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_chat_for_match"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_chat_for_match"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_chat_for_match"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_match"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_match"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_match"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_match_from_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_match_from_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_match_from_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_discoverable_users"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_discoverable_users"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_discoverable_users"("p_user_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mutual_likes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_mutual_likes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mutual_likes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_content_with_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_content_with_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_content_with_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_comment_mentions"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_comment_mentions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_comment_mentions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_liked_user"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_liked_user"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_liked_user"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment"("table_name" "text", "column_name" "text", "id_value" "uuid", "amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_owner_banner"("path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_owner_banner"("path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_owner_banner"("path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."matches_user_id_pattern"("filename" "text", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."matches_user_id_pattern"("filename" "text", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."matches_user_id_pattern"("filename" "text", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_friend_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_friend_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_friend_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_user_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_user_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_user_follow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_like_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_like_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_like_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_content_like_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_content_like_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_content_like_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_content_view_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_content_view_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_content_view_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_comment_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_comment_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_comment_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_comment_like_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_comment_like_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_comment_like_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_view_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_view_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_view_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."chat_members" TO "anon";
GRANT ALL ON TABLE "public"."chat_members" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_members" TO "service_role";



GRANT ALL ON TABLE "public"."chats" TO "anon";
GRANT ALL ON TABLE "public"."chats" TO "authenticated";
GRANT ALL ON TABLE "public"."chats" TO "service_role";



GRANT ALL ON TABLE "public"."comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."comment_mentions" TO "anon";
GRANT ALL ON TABLE "public"."comment_mentions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_mentions" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."content" TO "anon";
GRANT ALL ON TABLE "public"."content" TO "authenticated";
GRANT ALL ON TABLE "public"."content" TO "service_role";



GRANT ALL ON TABLE "public"."content_likes" TO "anon";
GRANT ALL ON TABLE "public"."content_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."content_likes" TO "service_role";



GRANT ALL ON TABLE "public"."content_posts" TO "anon";
GRANT ALL ON TABLE "public"."content_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."content_posts" TO "service_role";



GRANT ALL ON TABLE "public"."content_views" TO "anon";
GRANT ALL ON TABLE "public"."content_views" TO "authenticated";
GRANT ALL ON TABLE "public"."content_views" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."content_with_creators" TO "anon";
GRANT ALL ON TABLE "public"."content_with_creators" TO "authenticated";
GRANT ALL ON TABLE "public"."content_with_creators" TO "service_role";



GRANT ALL ON TABLE "public"."friend_requests" TO "anon";
GRANT ALL ON TABLE "public"."friend_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_requests" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."project_applications" TO "anon";
GRANT ALL ON TABLE "public"."project_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."project_applications" TO "service_role";



GRANT ALL ON TABLE "public"."project_comment_likes" TO "anon";
GRANT ALL ON TABLE "public"."project_comment_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_comment_likes" TO "service_role";



GRANT ALL ON TABLE "public"."project_comments" TO "anon";
GRANT ALL ON TABLE "public"."project_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_comments" TO "service_role";



GRANT ALL ON TABLE "public"."project_likes" TO "anon";
GRANT ALL ON TABLE "public"."project_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."project_likes" TO "service_role";



GRANT ALL ON TABLE "public"."project_views" TO "anon";
GRANT ALL ON TABLE "public"."project_views" TO "authenticated";
GRANT ALL ON TABLE "public"."project_views" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."projects_with_profiles" TO "anon";
GRANT ALL ON TABLE "public"."projects_with_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."projects_with_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."public_profiles" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."user_blocks" TO "anon";
GRANT ALL ON TABLE "public"."user_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



GRANT ALL ON TABLE "public"."user_likes" TO "anon";
GRANT ALL ON TABLE "public"."user_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_likes" TO "service_role";



GRANT ALL ON TABLE "public"."user_matches" TO "anon";
GRANT ALL ON TABLE "public"."user_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."user_matches" TO "service_role";



GRANT ALL ON TABLE "public"."user_passes" TO "anon";
GRANT ALL ON TABLE "public"."user_passes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_passes" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























\unrestrict 2wCw996p4dHdbQpvEBwJRvkpU362WZPKlB7TCUymYYIHyOdsDGEHgVTUnWH59Xa

RESET ALL;
