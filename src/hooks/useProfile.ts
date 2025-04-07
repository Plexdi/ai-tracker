import { useState, useEffect } from 'react';
import { useStore } from '../lib/zustandStore';
import { getUserProfile, updateUserProfile, uploadProfilePicture, UserProfile } from '../lib/profile-service';

export const useProfile = () => {
  const { currentUser } = useStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      loadProfile();
    }
  }, [currentUser?.id]);

  const loadProfile = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const userProfile = await getUserProfile(currentUser.id);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser?.id) return;
    
    setUpdating(true);
    try {
      await updateUserProfile(currentUser.id, data);
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const updateProfilePicture = async (file: File) => {
    if (!currentUser?.id) return;
    
    setUpdating(true);
    try {
      const downloadURL = await uploadProfilePicture(currentUser.id, file);
      await updateProfile({ profilePicture: downloadURL });
    } catch (error) {
      console.error('Error updating profile picture:', error);
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile,
    loading,
    updating,
    updateProfile,
    updateProfilePicture,
    refreshProfile: loadProfile
  };
}; 