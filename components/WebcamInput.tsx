import React, { useEffect, useRef, useState } from 'react';
import { initializeVisionModel, predictTongue, FaceLandmarks } from '../services/visionService';
import { DetectionStatus } from '../types';
import { RetroCard } from './RetroCard';

interface WebcamInputProps {
  onStatusChange: (status: DetectionStatus) => void;
  onTongueDetection: (isOut: boolean) => void;
  onPersonDetection: (isDetected: boolean) => void;
  isTongueOut: boolean;
  isPersonDetected: boolean;
}

export const WebcamInput: React.FC<WebcamInputProps> = ({ 
  onStatusChange, 
  onTongueDetection, 
  onPersonDetection, 
  isTongueOut,
  isPersonDetected
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [isPermitted, setIsPermitted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ mouth: number, color: number }>({ mouth: 0, color: 0 });

  // 1. Initialize AI Model
  useEffect(() => {
    const loadModel = async () => {
      onStatusChange(DetectionStatus.LOADING);
      try {
        await initializeVisionModel();
        onStatusChange(DetectionStatus.READY);
        startCamera();
      } catch (error) {
        console.error(error);
        onStatusChange(DetectionStatus.ERROR);
      }
    };
    loadModel();
    
    // Cleanup
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = predictLoop;
        setIsPermitted(true);
      }
    } catch (err) {
      onStatusChange(DetectionStatus.PERMISSION_DENIED);
    }
  };

  // 3. Prediction & Drawing Loop
  const predictLoop = () => {
    if (videoRef.current && videoRef.current.currentTime > 0) {
      const result = predictTongue(videoRef.current, performance.now());
      
      // Report state
      onTongueDetection(result.isTongueOut);
      onPersonDetection(result.isPersonDetected);
      
      if (result.debug) {
        setDebugInfo({ mouth: result.debug.mouthOpen, color: result.debug.colorMatch });
      }

      // Draw Landmarks (Facial Analysis)
      drawAnalysis(result.landmarks, result.score, result.isTongueOut);
    }
    requestRef.current = requestAnimationFrame(predictLoop);
  };

  const drawAnalysis = (landmarks: FaceLandmarks | undefined, score: number, isTongue: boolean) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sync canvas size
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Analysis Info / HUD
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`SYS: ${isTongue ? 'RECORDING' : 'READY'}`, 10, 20);
    
    // Only draw the mouth analysis box if landmarks exist
    if (landmarks) {
      // Draw Mouth Analysis Box (But obscure what it is doing)
      const topLip = landmarks[13];
      const bottomLip = landmarks[14];
      
      const mouthX = (topLip.x + bottomLip.x) / 2 * canvas.width;
      const mouthY = (topLip.y + bottomLip.y) / 2 * canvas.height;

      // Draw the target reticle where we are sampling color
      ctx.strokeStyle = isTongue ? '#ccff00' : 'rgba(0, 255, 255, 0.3)';
      ctx.lineWidth = isTongue ? 2 : 1;
      
      // Crosshair size
      const size = 10;

      ctx.beginPath();
      // Top left corner
      ctx.moveTo(mouthX - size, mouthY - size/2);
      ctx.lineTo(mouthX - size, mouthY - size);
      ctx.lineTo(mouthX - size/2, mouthY - size);

      // Top right corner
      ctx.moveTo(mouthX + size/2, mouthY - size);
      ctx.lineTo(mouthX + size, mouthY - size);
      ctx.lineTo(mouthX + size, mouthY - size/2);

      // Bottom right corner
      ctx.moveTo(mouthX + size, mouthY + size/2);
      ctx.lineTo(mouthX + size, mouthY + size);
      ctx.lineTo(mouthX + size/2, mouthY + size);

      // Bottom left corner
      ctx.moveTo(mouthX - size/2, mouthY + size);
      ctx.lineTo(mouthX - size, mouthY + size);
      ctx.lineTo(mouthX - size, mouthY + size/2);
      
      ctx.stroke();

      if (isTongue) {
        ctx.font = '10px "Press Start 2P"';
        ctx.fillStyle = '#ccff00';
        ctx.fillText("FOCUS", mouthX + 15, mouthY);
      }
    }
  };

  return (
    <RetroCard 
      variant={isTongueOut ? 'lime' : 'blue'} 
      title={isTongueOut ? "CAPTURE MODE" : "LIVE FEED"} 
      className={`w-full max-w-[320px] mx-auto transition-all duration-300 ${isTongueOut ? 'scale-105 shadow-[0_0_30px_rgba(204,255,0,0.6)]' : ''}`}
    >
      <div className={`relative w-full aspect-[4/3] bg-black rounded border-4 overflow-hidden transition-colors duration-200 ${isTongueOut ? 'border-y2k-lime' : 'border-gray-700'}`}>
        {!isPermitted && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4 z-30">
            <p className="font-terminal text-y2k-blue animate-pulse">
              Booting Camera...<br/>Grant Access
            </p>
          </div>
        )}
        
        {/* Raw Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-10" 
        />
        
        {/* Facial Landmark Analysis Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-20"
        />

        {/* Person Detected Label */}
        {isPersonDetected && (
          <div className="absolute top-2 right-2 z-30 bg-y2k-purple/90 border border-y2k-blue px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,1)]">
            <span className="font-pixel text-[10px] text-white animate-pulse">
              [ TRACKING ]
            </span>
          </div>
        )}

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-40 bg-[length:100%_4px,3px_100%]"></div>
        
        {/* Active Border Overlay */}
        <div className={`absolute inset-0 pointer-events-none border-[6px] z-40 transition-opacity duration-200 ${isTongueOut ? 'border-y2k-lime opacity-100 animate-pulse' : 'border-transparent opacity-0'}`}></div>
      </div>
      <div className="mt-2 flex justify-between items-center">
        <span className={`text-xs font-pixel ${isTongueOut ? 'text-y2k-lime animate-pulse' : 'text-y2k-blue'}`}>
          {isTongueOut ? '● REC [ACTIVE]' : '● REC'}
        </span>
        <span className="text-xs font-mono text-white opacity-50">
           STRM:{Math.round(debugInfo.mouth * 100)} DATA:{Math.round(debugInfo.color * 100)}
        </span>
      </div>
    </RetroCard>
  );
};