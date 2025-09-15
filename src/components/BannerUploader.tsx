import { useState, useRef, ChangeEvent } from 'react';
import { useProfile } from '../hooks/useProfile';
import { Button } from './ui/Button';
import { Loader2, Image, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function BannerUploader({ onUpload }: { onUpload?: (url: string) => void }) {
  const { uploadBanner, profile } = useProfile() as { 
    uploadBanner: (file: File) => Promise<{ data: any; error: Error | null }>; 
    profile: { id: string; banner_url?: string | null; banner_path?: string | null } | null 
  };
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { data, error: uploadError } = await uploadBanner(file);
      
      if (uploadError) {
        throw uploadError;
      }

      if (data && onUpload) {
        onUpload(data.banner_url || '');
      }
    } catch (err) {
      console.error('Error uploading banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBanner = async () => {
    if (!profile?.banner_path) return;
    
    try {
      setUploading(true);
      // Delete the banner from storage
      const { error: deleteError } = await supabase.storage
        .from('banners')
        .remove([profile.banner_path]);

      if (deleteError) throw deleteError;

      // Update the profile to remove the banner
      const updates = { 
        banner_url: null as string | null,
        banner_path: null as string | null,
        updated_at: new Date().toISOString() 
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates as any) // Type assertion to bypass type checking
        .eq('id', profile.id);

      if (updateError) throw updateError;

      if (onUpload) {
        onUpload('');
      }
    } catch (err) {
      console.error('Error removing banner:', err);
      setError('Failed to remove banner');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        id="banner-upload"
        disabled={uploading}
      />
      
      <div className="flex flex-col items-center justify-center space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Image className="w-4 h-4" />
              {profile?.banner_url ? 'Change Banner' : 'Upload Banner'}
            </>
          )}
        </Button>
        
        {profile?.banner_url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveBanner}
            disabled={uploading}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
          >
            <X className="w-4 h-4 mr-1" />
            Remove Banner
          </Button>
        )}
        
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}
