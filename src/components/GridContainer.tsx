import React, { ReactNode } from 'react';

interface GridContainerProps {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

export default function GridContainer({ 
  children, 
  className = '',
  gap = 'md'
}: GridContainerProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8'
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-12 ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
} 