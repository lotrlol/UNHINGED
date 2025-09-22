import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { UserProfileModal } from './UserProfileModal';
import { getInitials, processUserUrls } from '../lib/utils';
import { Skeleton } from './ui/Skeleton';
import { Heart } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  roles: string[];
  tagline: string | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
  skills?: string[];
  looking_for?: string[];
  vibe_words?: string[];
  website_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
}

export const LikedProfilesList = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchLikedProfiles = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get all user IDs that the current user has liked
        const { data: likes, error: likesError } = await supabase
          .from('user_likes')
          .select('liked_id')
          .eq('liker_id', user.id) as { data: { liked_id: string }[], error: any };
          
        if (likesError) throw likesError;
        
        if (likes.length === 0) {
          setProfiles([]);
          return;
        }

        // Get the actual user profiles
        const likedUserIds = likes.map(like => like.liked_id);
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', likedUserIds)
          .not('id', 'eq', user.id); // Exclude current user
          
        if (usersError) throw usersError;
        
        // Process URLs for each user before setting profiles
        const processedUsers = (users || []).map(user => processUserUrls(user));
        setProfiles(processedUsers);
      } catch (error) {
        console.error('Error fetching liked profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedProfiles();
  }, [user]);

  const handleProfileClick = (profile: any) => {
    setSelectedProfile(profile);
    setShowProfileModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center p-4 bg-white/5 rounded-xl">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="ml-4 flex-1">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Heart className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg">No liked profiles yet</p>
        <p className="text-sm mt-2">Swipe right to like someone!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          onClick={() => handleProfileClick(profile)}
          className="flex items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || profile.username}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-medium">
              {getInitials(profile.full_name || profile.username || '')}
            </div>
          )}
          <div className="ml-4">
            <h3 className="font-medium text-white">
              {profile.full_name || `@${profile.username}`}
            </h3>
            {profile.bio && (
              <p className="text-sm text-gray-400 line-clamp-1">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      ))}

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedProfile}
      />
    </div>
  );
};
