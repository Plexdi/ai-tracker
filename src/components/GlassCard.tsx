'use client';

import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  title?: string;
  colSpan?: string;
  className?: string;
}

export default function GlassCard({ 
  children, 
  title, 
  colSpan = 'md:col-span-4',
  className = '' 
}: GlassCardProps) {
  return (
    <div className={`bg-slate-900/60 backdrop-blur-md border border-slate-800/60 rounded-xl overflow-hidden ${colSpan} ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-slate-800/60">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
} 