import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface HorizontalProfileCardProps {
  name: string;
  email: string;
  photoURL?: string;
  onEditClick?: () => void;
  className?: string;
}

export default function HorizontalProfileCard({
  name = "Anonymous User",
  email = "",
  photoURL,
  onEditClick,
  className = ""
}: HorizontalProfileCardProps) {
  const router = useRouter();

  const handleEditClick = () => {
    if (onEditClick) {
      onEditClick();
    } else {
      router.push('/profile');
    }
  };

  return (
    <div className={`w-full max-w-md bg-slate-900/80 backdrop-blur-md rounded-2xl 
      shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-800/50 p-6
      ${className}`}>
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {photoURL ? (
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-teal-500/40 ring-offset-2 ring-offset-slate-900">
              <Image
                src={photoURL}
                alt={name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 
              flex items-center justify-center ring-2 ring-teal-500/40 ring-offset-2 ring-offset-slate-900">
              <span className="text-xl font-medium text-slate-300">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate font-['Inter',system-ui]">
            {name}
          </h3>
          <p className="text-sm text-slate-400 truncate font-['Inter',system-ui] mb-3">
            {email}
          </p>
          <button
            onClick={handleEditClick}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium text-teal-50
              bg-teal-600/80 hover:bg-teal-600 rounded-lg transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 focus:ring-offset-slate-900"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
} 