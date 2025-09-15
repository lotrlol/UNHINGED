import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AvatarUploaderProps = {
  currentAvatarUrl?: string | null;
  userId: string;
  onUpload: (url: string) => void;
};

export function AvatarUploader({ currentAvatarUrl, userId, onUpload }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    
    try {
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload an image file (JPEG, PNG, WebP, or GIF)');
      }
      
      // Create a consistent file name with extension based on file type
      const fileExt = file.type.split('/')[1];
      const fileName = `${userId}.${fileExt}`;
      const filePath = fileName;

      // First try to delete any existing avatar files for this user
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('avatars')
        .list('', {
          search: `${userId}.`
        });
      
      if (listError) throw listError;
      
      // Delete all existing avatar files for this user
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => file.name);
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
          
        if (deleteError) throw deleteError;
      }

      // Upload the new avatar with cache control and content type
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
          {currentAvatarUrl ? (
            <img
              src={`${currentAvatarUrl}?t=${new Date().getTime()}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleClick}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="image/*"
          className="hidden"
          disabled={uploading}
        />
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Change photo'}
      </button>
    </div>
  );
}
