'use client';

import { useStore } from '@/lib/zustandStore';
import ProfileCard from '@/components/ProfileCard';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function ProfileCardDemo() {
  const { currentUser } = useStore();
  const router = useRouter();
  
  const handleCardEditClick = () => {
    toast.success('Edit profile action triggered!');
    router.push('/profile');
  };
  
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Profile Card Variations</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Current User Card */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl text-white mb-4">Current User</h2>
            <ProfileCard 
              name={currentUser?.displayName || "Anonymous User"}
              email={currentUser?.email || "user@example.com"}
              photoURL={currentUser?.photoURL}
              onEditClick={handleCardEditClick}
            />
          </div>
          
          {/* With Image Example */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl text-white mb-4">With Profile Picture</h2>
            <ProfileCard 
              name="Jane Appleseed"
              email="jane@example.com"
              photoURL="https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
              onEditClick={handleCardEditClick}
            />
          </div>
          
          {/* Without Image Example */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl text-white mb-4">No Profile Picture</h2>
            <ProfileCard 
              name="Alex Thompson"
              email="alex.thompson@example.com"
              onEditClick={handleCardEditClick}
            />
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium 
            hover:bg-slate-100 transition-colors duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 