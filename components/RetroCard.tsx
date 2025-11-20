import React, { ReactNode } from 'react';

interface RetroCardProps {
  children: ReactNode;
  title?: string;
  variant?: 'pink' | 'blue' | 'lime';
  className?: string;
}

export const RetroCard: React.FC<RetroCardProps> = ({ children, title, variant = 'pink', className = '' }) => {
  const borderColors = {
    pink: 'border-y2k-pink shadow-y2k-pink',
    blue: 'border-y2k-blue shadow-y2k-blue',
    lime: 'border-y2k-lime shadow-y2k-lime',
  };

  const bgColors = {
    pink: 'bg-pink-950/50',
    blue: 'bg-blue-950/50',
    lime: 'bg-lime-950/50',
  };

  return (
    <div className={`
      relative border-4 border-double p-4 rounded-xl
      shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
      backdrop-blur-md
      ${borderColors[variant]}
      ${bgColors[variant]}
      ${className}
    `}>
      {title && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black border-2 border-white px-3 py-1 rounded-full z-10">
          <span className="font-pixel text-xs text-white uppercase tracking-widest animate-pulse">
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  );
};