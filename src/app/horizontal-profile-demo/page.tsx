'use client';

import { useStore } from '@/lib/zustandStore';
import HorizontalProfileCard from '@/components/HorizontalProfileCard';
import ProfileCard from '@/components/ProfileCard';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useProfile } from '@/hooks/useProfile';
import { useState, useEffect } from 'react';

export default function HorizontalProfileDemo() {
  const { currentUser } = useStore();
  const { profile } = useProfile();
  const router = useRouter();
  
  const handleCardEditClick = () => {
    toast.success('Edit profile action triggered!');
    router.push('/profile');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center py-12 px-4">
      {/* Glassmorphism effect with blurry shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Modern Profile UI</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            A collection of sleek, responsive profile cards with glassmorphism effects
            and modern design aesthetics.
          </p>
        </div>
        
        <div className="space-y-12">
          {/* Section 1: Horizontal Card */}
          <section>
            <h2 className="text-xl text-white mb-5 font-semibold pl-1 border-l-4 border-teal-500 pl-4">
              Horizontal Layout
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Current User */}
              <HorizontalProfileCard 
                name={profile?.name || currentUser?.displayName || "Anonymous User"}
                email={profile?.email || currentUser?.email || "user@example.com"}
                photoURL={profile?.profilePicture || currentUser?.photoURL}
                onEditClick={handleCardEditClick}
                className="mx-auto"
              />
              
              {/* Example with Image */}
              <HorizontalProfileCard 
                name="Alex Carey"
                email="alex.carey@example.com"
                photoURL="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                onEditClick={handleCardEditClick}
                className="mx-auto"
              />
            </div>
          </section>

          {/* Section 2: Comparison with Vertical Card */}
          <section>
            <h2 className="text-xl text-white mb-5 font-semibold pl-1 border-l-4 border-teal-500 pl-4">
              Compare Layouts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm font-medium text-slate-400">Horizontal</span>
                <HorizontalProfileCard 
                  name="Sophie Moore"
                  email="sophie.moore@example.com"
                  photoURL="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                  onEditClick={handleCardEditClick}
                />
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm font-medium text-slate-400">Vertical</span>
                <ProfileCard 
                  name="Sophie Moore"
                  email="sophie.moore@example.com"
                  photoURL="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
                  onEditClick={handleCardEditClick}
                />
              </div>
            </div>
          </section>
        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg font-medium 
            hover:bg-slate-700 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 