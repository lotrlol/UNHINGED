-- First, add banner_url and banner_path columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_path TEXT;

-- Create a new storage bucket for banners
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (name) do nothing;

-- Set up storage policies for the banners bucket
create or replace policy "Public read access for banners"
on storage.objects for select
using (bucket_id = 'banners');

create or replace policy "Users can upload their own banners"
on storage.objects for insert
with check (
  bucket_id = 'banners' and
  (auth.role() = 'authenticated') and
  (storage.filename(name) = (auth.uid() || '.png') or
   storage.filename(name) = (auth.uid() || '.jpg') or
   storage.filename(name) = (auth.uid() || '.jpeg') or
   storage.filename(name) = (auth.uid() || '.webp') or
   storage.filename(name) = (auth.uid() || '.gif'))
);

create or replace policy "Users can update their own banners"
on storage.objects for update
using (
  bucket_id = 'banners' and
  auth.role() = 'authenticated' and
  (storage.filename(name) = (auth.uid() || '.png') or
   storage.filename(name) = (auth.uid() || '.jpg') or
   storage.filename(name) = (auth.uid() || '.jpeg') or
   storage.filename(name) = (auth.uid() || '.webp') or
   storage.filename(name) = (auth.uid() || '.gif'))
);

create or replace policy "Users can delete their own banners"
on storage.objects for delete
using (
  bucket_id = 'banners' and
  auth.role() = 'authenticated' and
  (storage.filename(name) = (auth.uid() || '.png') or
   storage.filename(name) = (auth.uid() || '.jpg') or
   storage.filename(name) = (auth.uid() || '.jpeg') or
   storage.filename(name) = (auth.uid() || '.webp') or
   storage.filename(name) = (auth.uid() || '.gif'))
);

-- Enable RLS on the storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
