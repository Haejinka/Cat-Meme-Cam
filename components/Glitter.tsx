
import React, { useEffect, useState } from 'react';

interface Sparkle {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
}

export const Glitter: React.FC = () => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    // Generate random sparkles
    const count = 20;
    const newSparkles: Sparkle[] = [];
    for (let i = 0; i < count; i++) {
      newSparkles.push({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.5 + 0.5, // 0.5rem to 2rem
        delay: Math.random() * 2,
      });
    }
    setSparkles(newSparkles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute animate-pulse-fast text-y2k-lime drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            fontSize: `${s.size}rem`,
            animationDelay: `${s.delay}s`,
            opacity: 0.8
          }}
        >
          ✨
        </div>
      ))}
    </div>
  );
};
