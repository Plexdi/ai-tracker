'use client';

import React from 'react';
import { useStore } from '@/lib/zustandStore';
import Link from 'next/link';
import ModernButton from './ModernButton';

export default function DashboardHorizontalProfile() {
  const { currentUser } = useStore();
  
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 backdrop-blur-md rounded-xl p-6 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute left-1/2 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      
      <div className="flex flex-col md:flex-row md:items-center">
        {/* Avatar and name */}
        <div className="flex items-center mb-4 md:mb-0">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-bold">
            {currentUser?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="ml-4">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {currentUser?.displayName || 'User'}
            </h2>
            <p className="text-slate-400 text-sm">
              {currentUser?.email || 'Email not available'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6 md:ml-auto">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-xs text-slate-400">Total Workouts</p>
          </div>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-xs text-slate-400">Lift PRs</p>
          </div>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-xs text-slate-400">Day Streak</p>
          </div>
          
          <Link href="/profile">
            <ModernButton 
              variant="secondary"
              className="ml-2"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            >
              Profile
            </ModernButton>
          </Link>
        </div>
      </div>
    </div>
  );
} 