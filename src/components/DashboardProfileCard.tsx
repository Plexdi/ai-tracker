import React, { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useStore } from '@/lib/zustandStore';
import ProfileCard from './ProfileCard';
import { useRouter } from 'next/navigation';

export default function DashboardProfileCard() {
  const { currentUser } = useStore();
  const { profile, loading } = useProfile();
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Add a slight delay to prevent flash of content
    if (!loading) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!isLoaded) {
    return (
      <div className="max-w-[400px] bg-slate-800 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-700 mb-4"></div>
          <div className="h-6 w-32 bg-slate-700 rounded mb-2"></div>
          <div className="h-4 w-48 bg-slate-700 rounded mb-5"></div>
          <div className="h-10 w-full bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <ProfileCard
      name={profile?.name || currentUser?.displayName || "Anonymous User"}
      email={profile?.email || currentUser?.email || ""}
      photoURL={profile?.profilePicture || currentUser?.photoURL}
      onEditClick={() => router.push('/profile')}
      className="mx-auto"
    />
  );
} 