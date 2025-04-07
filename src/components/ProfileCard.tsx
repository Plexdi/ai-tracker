import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ProfileCardProps {
  name: string;
  email: string;
  photoURL?: string;
  onEditClick?: () => void;
  className?: string;
}

export default function ProfileCard({ 
  name = "Anonymous User", 
  email = "", 
  photoURL, 
  onEditClick,
  className = ""
}: ProfileCardProps) {
  const router = useRouter();

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick();
    } else {
      router.push('/profile');
    }
  };

  return (
    <div className={`max-w-[400px] bg-slate-800 rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex flex-col items-center text-center">
        <div className="relative w-20 h-20 mb-4">
          {photoURL ? (
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-700">
              <Image
                src={photoURL}
                alt={name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
              <span className="text-2xl font-medium text-slate-300">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-1 font-['Inter',system-ui]">{name}</h3>
        <p className="text-sm text-slate-400 mb-5 font-['Inter',system-ui]">{email}</p>
        
        <button
          onClick={handleEditClick}
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm
          transition-all duration-200 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
} 