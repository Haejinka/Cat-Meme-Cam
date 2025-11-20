import React, { useState, useEffect, useRef } from 'react';
import { WebcamInput } from './components/WebcamInput';
import { CatDisplay } from './components/CatDisplay';
import { Glitter } from './components/Glitter';
import { DetectionStatus } from './types';
import { playGoofySound, playSeriousSound } from './utils/audio';

const BACKGROUNDS = [
  { id: 'grid', name: 'Cyber Grid', class: 'pattern-grid' },
  { id: 'dots', name: 'Polka Dot', class: 'pattern-dots' },
  { id: 'checker', name: 'Checkerboard', class: 'pattern-checker' },
];

export default function App() {
  const [status, setStatus] = useState<DetectionStatus>(DetectionStatus.LOADING);
  const [isTongueOut, setIsTongueOut] = useState(false);
  const [isPersonDetected, setIsPersonDetected] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const firstRender = useRef(true);

  // Handle sound effects on state change
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (status === DetectionStatus.READY && soundEnabled) {
      if (isTongueOut) {
        playGoofySound();
      } else {
        playSeriousSound();
      }
    }
  }, [isTongueOut, soundEnabled, status]);

  const cycleBackground = () => {
    setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
  };

  const currentBg = BACKGROUNDS[bgIndex];

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 font-comic text-white selection:bg-y2k-pink selection:text-black transition-all duration-500 ${currentBg.class}`}>
      
      {/* Glitter Overlay when secret is unlocked */}
      {isTongueOut && <Glitter />}

      {/* Header - Marquee style */}
      <div className="w-full max-w-4xl mb-8 bg-gradient-to-r from-y2k-purple via-y2k-pink to-y2k-purple border-y-4 border-black p-2 shadow-[0_0_15px_rgba(255,0,255,0.5)] z-10 relative">
        <h1 className="font-pixel text-xl md:text-3xl text-center text-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
          ✨ CYBER-BOOTH 3000 ✨
        </h1>
      </div>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10 relative">
        
        {/* Column 1: The Webcam */}
        <div className="flex flex-col items-center order-2 md:order-1">
          <WebcamInput 
            onStatusChange={setStatus} 
            onTongueDetection={setIsTongueOut} 
            onPersonDetection={setIsPersonDetected}
            isTongueOut={isTongueOut}
            isPersonDetected={isPersonDetected}
          />
          
          {/* Status Indicator */}
          <div className="mt-6 font-terminal text-lg bg-black/80 border border-white px-6 py-2 rounded-full flex gap-4">
            <span>SYSTEM: <span className={`${status === DetectionStatus.READY ? 'text-y2k-lime' : 'text-red-500'}`}>{status === DetectionStatus.READY ? 'ONLINE' : status}</span></span>
          </div>

          {status === DetectionStatus.PERMISSION_DENIED && (
             <div className="mt-4 p-4 bg-red-900/80 border-2 border-red-500 rounded font-mono text-sm max-w-xs text-center">
               ⚠️ CAMERA ACCESS REQUIRED ⚠️<br/>
               Initialize video stream to proceed.
             </div>
          )}
        </div>

        {/* Column 2: The Cat */}
        <div className={`flex flex-col items-center justify-center order-1 md:order-2 transition-transform duration-500 ${isTongueOut ? 'animate-bounce' : 'animate-float'}`}>
          <CatDisplay isTongueOut={isTongueOut} />
        </div>

      </main>

      {/* Footer Controls */}
      <footer className="mt-12 text-center space-y-4 z-10 relative bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-white/20">
        
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <button 
            onClick={cycleBackground}
            className="px-4 py-2 bg-y2k-blue text-black font-pixel text-xs hover:bg-white hover:scale-105 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] border-2 border-black"
          >
            🎨 Theme: {currentBg.name}
          </button>

          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-4 py-2 font-pixel text-xs hover:scale-105 transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] border-2 border-black ${soundEnabled ? 'bg-y2k-lime text-black' : 'bg-gray-600 text-gray-300'}`}
          >
            {soundEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF'}
          </button>
        </div>

        <div className="flex gap-2 justify-center text-2xl mt-4">
          <span className="animate-pulse">👾</span>
          <span>💿</span>
          <span className="animate-pulse delay-75">💾</span>
        </div>
        <p className="font-terminal text-y2k-blue/70 text-sm">
          est. 1999 // web ring member
        </p>
      </footer>

      {/* Decorative background elements */}
      <div className="fixed top-10 left-10 text-6xl opacity-20 -z-10 animate-spin-slow select-none pointer-events-none">🌸</div>
      <div className="fixed bottom-10 right-10 text-6xl opacity-20 -z-10 animate-bounce select-none pointer-events-none">⭐</div>
    </div>
  );
}