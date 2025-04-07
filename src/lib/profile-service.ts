import { ref, get, set, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebase';
import { toast } from 'react-hot-toast';

export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  goals?: string;
  profilePicture?: string;
  stats?: {
    height?: string;
    weight?: string;
    experience?: string;
  };
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const profileRef = ref(db, `users/${userId}`);
    const snapshot = await get(profileRef);
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    toast.error('Failed to load profile');
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    const profileRef = ref(db, `users/${userId}`);
    await update(profileRef, data);
    toast.success('Profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    toast.error('Failed to update profile');
    throw error;
  }
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  try {
    const storage = getStorage();
    const fileRef = storageRef(storage, `profile-pictures/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    toast.error('Failed to upload profile picture');
    throw error;
  }
}; 