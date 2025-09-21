import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Upload,
  GripVertical,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface UserLink {
  id: string;
  title: string;
  url: string;
  image_url?: string;
  display_order: number;
}

interface AddLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinksUpdated?: () => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AddLinksModal({ isOpen, onClose, onLinksUpdated }: AddLinksModalProps) {
  const { user } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Fetch user's links
  useEffect(() => {
    if (isOpen && user) {
      fetchUserLinks();
    }
  }, [isOpen, user]);

  const fetchUserLinks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_links')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })
        .returns<UserLink[]>();

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
      toast.error('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (linkId: string, file: File) => {
    if (!user) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please upload a valid image (JPEG, PNG, WebP, or GIF)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 2MB.`);
      return;
    }

    setUploadingImage(linkId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${linkId}/link-image-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the link with the image URL
      await (supabase as any)
        .from('user_links')
        .update({ image_url: data.publicUrl })
        .eq('id', linkId);

      // Update local state
      setLinks(prev => prev.map(link =>
        link.id === linkId ? { ...link, image_url: data.publicUrl } : link
      ));

      toast.success('Link image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const addNewLink = () => {
    const newLink: UserLink = {
      id: `temp-${Date.now()}`,
      title: '',
      url: '',
      image_url: undefined,
      display_order: 0
    };
    setLinks(prev => [newLink, ...prev.map(link => ({ ...link, display_order: link.display_order + 1 }))]);
  };

  const updateLink = (id: string, updates: Partial<UserLink>) => {
    setLinks(prev => prev.map(link =>
      link.id === id ? { ...link, ...updates } : link
    ));
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    setLinks(prev => {
      const newLinks = [...prev];
      [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
      return newLinks;
    });
  };

  const saveLinks = async () => {
    if (!user) return;

    // Validate all links
    for (const link of links) {
      if (!link.title.trim()) {
        toast.error('Please provide a title for all links');
        return;
      }
      if (!link.url.trim()) {
        toast.error('Please provide a URL for all links');
        return;
      }
      if (!validateUrl(link.url)) {
        toast.error(`Invalid URL: ${link.url}`);
        return;
      }
    }

    setSaving(true);
    try {
      // Delete existing links
      await supabase
        .from('user_links')
        .delete()
        .eq('user_id', user.id);

      // Insert updated links
      const linksToInsert = links
        .filter(link => link.title.trim() && link.url.trim())
        .map((link, index) => ({
          user_id: user.id,
          title: link.title.trim(),
          url: link.url.trim(),
          image_url: link.image_url || null,
          display_order: index
        }));

      if (linksToInsert.length > 0) {
        const { error } = await (supabase as any)
          .from('user_links')
          .insert(linksToInsert);

        if (error) throw error;
      }

      toast.success('Links saved successfully');
      onLinksUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error saving links:', error);
      toast.error('Failed to save links');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gray-900"
      >
        {/* Animated background blobs */}
        <motion.div
          className="fixed -top-32 -left-32 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-pink-500/30 via-purple-600/30 to-indigo-600/30 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="fixed -bottom-32 -right-32 w-72 h-72 sm:w-[28rem] sm:h-[28rem] bg-gradient-to-tr from-indigo-500/30 via-purple-600/30 to-pink-500/30 rounded-full blur-3xl"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-2 sm:p-4 bg-gray-800/90 backdrop-blur-md border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-sm sm:text-lg font-semibold text-white">Manage Links</h1>
          <div className="w-8 sm:w-10" />
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <>
                {/* Add new link button (mobile = sticky) */}
                <div className="sm:static sticky top-16 z-10 py-2">
                  <button
                    onClick={addNewLink}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 text-white transition-all border border-purple-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Link
                  </button>
                </div>

                {/* Links */}
                <div className="space-y-4">
                  {links.map((link, index) => (
                    <div
                      key={link.id}
                      className="bg-gray-800 border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-6 space-y-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <h3 className="text-sm sm:text-lg font-semibold text-white">
                          {link.title || 'Button Title'}
                        </h3>
                        <div className="flex-1" />
                        <button
                          onClick={() => removeLink(link.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Link Title */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                            Button Title *
                          </label>
                          <input
                            type="text"
                            value={link.title}
                            onChange={(e) => updateLink(link.id, { title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder="e.g., My Portfolio"
                            maxLength={100}
                          />
                        </div>

                        {/* Link URL */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                            Destination URL *
                          </label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateLink(link.id, { url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      {/* Link Image */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">
                          Button Image (Optional)
                        </label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <input
                            ref={(el) => fileInputRefs.current[link.id] = el}
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(link.id, file);
                              }
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[link.id]?.click()}
                            disabled={uploadingImage === link.id}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all border border-white/20 disabled:opacity-50"
                          >
                            {uploadingImage === link.id ? (
                              <div className="w-4 h-4 animate-spin border-2 border-purple-500 border-t-transparent rounded-full" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span className="text-xs sm:text-sm">Upload Image</span>
                          </button>

                          {link.image_url && (
                            <img
                              src={link.image_url}
                              alt="Link preview"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Recommended: 64x64px square image, max 2MB
                        </p>
                      </div>

                      {/* Move buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => moveLink(index, 'up')}
                          disabled={index === 0}
                          className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-300 rounded"
                        >
                          ↑ Move Up
                        </button>
                        <button
                          onClick={() => moveLink(index, 'down')}
                          disabled={index === links.length - 1}
                          className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-300 rounded"
                        >
                          ↓ Move Down
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="sticky bottom-0 bg-gray-900 pt-4 pb-3">
                  <motion.button
                    onClick={saveLinks}
                    disabled={saving || links.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 animate-spin border-2 border-white/30 border-t-white rounded-full" />
                        Saving Links...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save All Links
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
