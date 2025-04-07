import Link from 'next/link';
import React, { ReactNode } from 'react';

interface ActionLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function ActionLink({ 
  href, 
  icon, 
  children,
  className = ''
}: ActionLinkProps) {
  return (
    <Link 
      href={href} 
      className={`flex items-center text-slate-300 hover:text-teal-400 transition-colors p-2 hover:bg-slate-800/50 rounded-lg ${className}`}
    >
      <span className="w-5 h-5 mr-3 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </Link>
  );
} 