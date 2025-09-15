-- Add banner_url and banner_path columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_path TEXT;
