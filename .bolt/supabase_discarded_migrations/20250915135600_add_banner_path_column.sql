-- Add banner_path column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_path TEXT;

-- Update RLS policies to include banner_path
DROP POLICY IF EXISTS "Users can view their own banner" ON public.profiles;
CREATE POLICY "Users can view their own banner" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Update the storage policy for banners to include the banner_path check
DROP POLICY IF EXISTS "Users can upload their own banner" ON storage.objects;
CREATE POLICY "Users can upload their own banner" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'banners' AND (storage.filename(name) = (auth.uid() || '.jpg') 
                                OR storage.filename(name) = (auth.uid() || '.jpeg') 
                                OR storage.filename(name) = (auth.uid() || '.png') 
                                OR storage.filename(name) = (auth.uid() || '.gif') 
                                OR storage.filename(name) = (auth.uid() || '.webp')))
WITH CHECK (bucket_id = 'banners' AND (storage.filename(name) = (auth.uid() || '.jpg') 
                                     OR storage.filename(name) = (auth.uid() || '.jpeg') 
                                     OR storage.filename(name) = (auth.uid() || '.png') 
                                     OR storage.filename(name) = (auth.uid() || '.gif') 
                                     OR storage.filename(name) = (auth.uid() || '.webp')));
