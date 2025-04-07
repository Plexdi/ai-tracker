'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useStore } from '@/lib/zustandStore';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import HorizontalProfileCard from '@/components/HorizontalProfileCard';
import Link from 'next/link';

export default function ProfilePage() {
  const { currentUser } = useStore();
  const { profile, loading, updating, updateProfile, updateProfilePicture } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    goals: profile?.goals || '',
    stats: profile?.stats || {
      height: '',
      weight: '',
      experience: ''
    }
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || currentUser?.displayName || '',
        bio: profile.bio || '',
        goals: profile.goals || '',
        stats: profile.stats || {
          height: '',
          weight: '',
          experience: ''
        }
      });
    }
  }, [profile, currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('stats.')) {
      const statName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statName]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    try {
      await updateProfilePicture(file);
    } catch (error) {
      console.error('Error updating profile picture:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    
    let completed = 0;
    let total = 5; // Total number of profile fields we're checking
    
    if (profile.name) completed++;
    if (profile.bio) completed++;
    if (profile.goals) completed++;
    if (profile.profilePicture) completed++;
    
    // Check if any stats are filled
    if (profile.stats && Object.values(profile.stats).some(val => val)) {
      completed++;
    }
    
    return Math.floor((completed / total) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-indigo-500/10 rounded-full filter blur-3xl"></div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto relative z-10 space-y-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
          <p className="text-slate-400">Manage your information and account settings</p>
        </div>

        {isEditing ? (
          <div className="max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/50 shadow-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Picture Upload */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center">
                  <div className="relative mb-3">
                    {profile?.profilePicture || currentUser?.photoURL ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-teal-500/40 ring-offset-2 ring-offset-slate-900">
                        <Image
                          src={profile?.profilePicture || currentUser?.photoURL || ''}
                          alt={profile?.name || currentUser?.displayName || ''}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center ring-2 ring-teal-500/40 ring-offset-2 ring-offset-slate-900">
                        <span className="text-2xl font-medium text-slate-300">
                          {formData.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-teal-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-teal-600 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                  </div>
                  <p className="text-xs text-slate-400">Upload a profile picture</p>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Fitness Goals
                    </label>
                    <input
                      type="text"
                      name="goals"
                      value={formData.goals}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                      placeholder="e.g. Build strength, Lose weight, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Physical Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Height
                    </label>
                    <input
                      type="text"
                      name="stats.height"
                      value={formData.stats.height}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                      placeholder="e.g. 5'10''"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Weight
                    </label>
                    <input
                      type="text"
                      name="stats.weight"
                      value={formData.stats.weight}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                      placeholder="e.g. 160 lbs"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Experience Level
                    </label>
                    <input
                      type="text"
                      name="stats.experience"
                      value={formData.stats.experience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                      placeholder="e.g. Beginner, 3 years"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl mx-auto">
            {/* Profile Card */}
            <div className="flex justify-center">
              <HorizontalProfileCard 
                name={profile?.name || currentUser?.displayName || "Anonymous User"}
                email={profile?.email || currentUser?.email || ""}
                photoURL={profile?.profilePicture || currentUser?.photoURL}
                onEditClick={() => setIsEditing(true)}
              />
            </div>

            {/* User Statistics and Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Profile Completion Card */}
              <div className="md:col-span-5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/50 shadow-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Profile Completion</h3>
                <div className="space-y-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-300">{completionPercentage}% Complete</span>
                    <span className="text-sm font-medium text-teal-500">{completionPercentage}/100</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-teal-400 h-2.5 rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Complete your profile to get personalized workout recommendations.
                  </p>
                  {completionPercentage < 100 && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="text-sm text-teal-400 hover:text-teal-300 mt-2 flex items-center"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Complete Your Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Bio & Goals */}
              <div className="md:col-span-7 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/50 shadow-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">About You</h3>
                <div className="space-y-4">
                  {profile?.bio ? (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Bio</h4>
                      <p className="text-slate-300">{profile.bio}</p>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm">Add a bio to tell others about yourself</p>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="text-sm text-teal-400 hover:text-teal-300 mt-2 inline-flex items-center"
                      >
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Bio
                      </button>
                    </div>
                  )}

                  {profile?.goals ? (
                    <div>
                      <h4 className="text-sm font-medium text-slate-400 mb-1">Fitness Goals</h4>
                      <p className="text-slate-300">{profile.goals}</p>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center">
                      <p className="text-slate-400 text-sm">Set your fitness goals</p>
                      <button 
                        onClick={() => setIsEditing(true)} 
                        className="text-sm text-teal-400 hover:text-teal-300 mt-2 inline-flex items-center"
                      >
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Goals
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Stats */}
              <div className="md:col-span-4 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/50 shadow-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Physical Stats</h3>
                {(profile?.stats?.height || profile?.stats?.weight || profile?.stats?.experience) ? (
                  <div className="space-y-4">
                    {profile.stats.height && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-1">Height</h4>
                        <p className="text-slate-300">{profile.stats.height}</p>
                      </div>
                    )}
                    {profile.stats.weight && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-1">Weight</h4>
                        <p className="text-slate-300">{profile.stats.weight}</p>
                      </div>
                    )}
                    {profile.stats.experience && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-1">Experience</h4>
                        <p className="text-slate-300">{profile.stats.experience}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-700 rounded-lg p-4 text-center">
                    <p className="text-slate-400 text-sm">Add your physical stats</p>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="text-sm text-teal-400 hover:text-teal-300 mt-2 inline-flex items-center"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Stats
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="md:col-span-4 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/50 shadow-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link 
                    href="/plan" 
                    className="flex items-center text-slate-300 hover:text-teal-400 transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Create Workout Plan
                  </Link>
                  <Link 
                    href="/log-lift" 
                    className="flex items-center text-slate-300 hover:text-teal-400 transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Log a Workout
                  </Link>
                  <Link 
                    href="/progress" 
                    className="flex items-center text-slate-300 hover:text-teal-400 transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Progress
                  </Link>
                  <Link 
                    href="/ai" 
                    className="flex items-center text-slate-300 hover:text-teal-400 transition-colors p-2 hover:bg-slate-800/50 rounded-lg"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    AI Assistant
                  </Link>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="md:col-span-4 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800/50 shadow-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3">Activity Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-sm text-slate-400">Last Login</span>
                    <span className="text-sm text-slate-300 font-medium">Today</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-sm text-slate-400">Workouts This Week</span>
                    <span className="text-sm text-slate-300 font-medium">0</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-sm text-slate-400">Account Created</span>
                    <span className="text-sm text-slate-300 font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Workout Streak</span>
                    <span className="text-sm text-slate-300 font-medium">0 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 