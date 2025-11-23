import React from 'react';
import { RetroCard } from './RetroCard';

interface CatDisplayProps {
  isTongueOut: boolean;
}

export const CatDisplay: React.FC<CatDisplayProps> = ({ isTongueOut }) => {
  // Using seeds to keep consistent images for "Goofy" vs "Serious" within a session
  // Use local images from `public/` so the app works offline during dev
  const goofyCatUrl = "/silly-cat.jpg";

  // Vite serves files in `public` at the project root — this file is available at `/serious-cat.png`
  const seriousCatUrl = "/serious-cat.png";
  
  return (
    <RetroCard variant={isTongueOut ? 'lime' : 'pink'} title={isTongueOut ? 'ALERT!' : 'DIGITAL ASSISTANT'}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-64 h-64 rounded-full border-4 border-white overflow-hidden shadow-inner group">
          {/* We use two images and toggle opacity for smooth transition */}
          <img 
            src={seriousCatUrl} 
            alt="Serious Cat" 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isTongueOut ? 'opacity-0' : 'opacity-100'}`}
          />
          <img 
            src={goofyCatUrl} 
            alt="Goofy Cat" 
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isTongueOut ? 'opacity-100' : 'opacity-0'}`}
          />
          
          {/* Glare effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent pointer-events-none rounded-full"></div>
        </div>

        <div className="text-center space-y-2">
          <h2 className={`font-pixel text-2xl md:text-3xl ${isTongueOut ? 'text-y2k-lime animate-bounce' : 'text-y2k-pink'}`}>
            {isTongueOut ? 'YOU ARE FREAKY' : 'STANDBY MODE...'}
          </h2>
          <p className="font-terminal text-xl text-white bg-black/50 px-4 py-1 rounded">
             {isTongueOut ? 'you are freaky' : 'Awaiting subject...'}
          </p>
        </div>
      </div>
    </RetroCard>
  );
};