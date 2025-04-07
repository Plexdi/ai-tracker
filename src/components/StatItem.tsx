import React, { ReactNode } from 'react';

interface StatItemProps {
  label: string;
  value: ReactNode;
  divider?: boolean;
}

export default function StatItem({ 
  label, 
  value,
  divider = true
}: StatItemProps) {
  return (
    <div className={`flex justify-between items-center ${divider ? 'border-b border-slate-800 pb-2 mb-2' : ''}`}>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-300 font-medium">{value}</span>
    </div>
  );
} 