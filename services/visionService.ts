
import { FilesetResolver, FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';

// Singleton instance management
let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;

// Internal Canvas for Pixel Analysis (Simulating OpenCV)
let analysisCanvas: HTMLCanvasElement | null = null;
let analysisCtx: CanvasRenderingContext2D | null = null;

// Constants
const SMOOTHING_FACTOR = 0.2; 
let lastTongueScore = 0;

export type FaceLandmarks = NormalizedLandmark[];

export interface PredictionResult {
  isTongueOut: boolean;
  isPersonDetected: boolean;
  landmarks?: FaceLandmarks;
  score: number;
  debug?: {
    mouthOpen: number;
    colorMatch: number;
  };
}

export const initializeVisionModel = async (): Promise<void> => {
  if (faceLandmarker || isInitializing) return;
  isInitializing = true;

  try {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: "GPU" 
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
    });
    
    console.log("FaceLandmarker loaded successfully with GPU delegate");
  } catch (error) {
    console.error("Failed to load FaceLandmarker", error);
    throw error;
  } finally {
    isInitializing = false;
  }
};

export const predictTongue = (video: HTMLVideoElement, timestamp: number): PredictionResult => {
  if (!faceLandmarker) return { isTongueOut: false, isPersonDetected: false, score: 0 };

  try {
    const result = faceLandmarker.detectForVideo(video, timestamp);
    
    const landmarks = result.faceLandmarks?.[0];
    const isPersonDetected = !!landmarks;
    
    // Default state
    if (!isPersonDetected || !landmarks) {
      lastTongueScore = Math.max(0, lastTongueScore - 0.1);
      return { isTongueOut: false, isPersonDetected: false, score: lastTongueScore };
    }

    // Landmarks for Mouth
    // 13: Upper Lip Inner
    // 14: Lower Lip Inner
    // 61: Mouth Corner Left
    // 291: Mouth Corner Right
    const topLip = landmarks[13];
    const bottomLip = landmarks[14];
    const leftCorner = landmarks[61];
    const rightCorner = landmarks[291];

    // Calculate Mouth Aspect Ratio (MAR)
    // This is scale-invariant, helping with "too close" or "too far" scenarios.
    const mouthHeight = Math.hypot(topLip.x - bottomLip.x, topLip.y - bottomLip.y);
    const mouthWidth = Math.hypot(leftCorner.x - rightCorner.x, leftCorner.y - rightCorner.y);
    
    // Avoid division by zero
    const openRatio = mouthHeight / (mouthWidth + 0.0001);

    // --- COLOR ANALYSIS ---
    // We only check color if the mouth is open to distinguish "Yelling" from "Tongue"
    let colorScore = 0;
    
    // Thresholds Updated:
    // Must be significantly open (> 0.2) to even consider it
    
    if (openRatio > 0.2) {
      // 1. Calculate pixel coordinates
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      const cx = (topLip.x + bottomLip.x) / 2 * width;
      const cy = (topLip.y + bottomLip.y) / 2 * height;

      // 2. Initialize canvas
      if (!analysisCanvas) {
        analysisCanvas = document.createElement('canvas');
        analysisCanvas.width = 8;
        analysisCanvas.height = 8;
        analysisCtx = analysisCanvas.getContext('2d', { willReadFrequently: true });
      }

      if (analysisCtx) {
        // 3. Safe Sampling (Clamp to video bounds)
        const sampleSize = 3;
        const safeX = Math.floor(Math.max(0, Math.min(width - sampleSize, cx - sampleSize / 2)));
        const safeY = Math.floor(Math.max(0, Math.min(height - sampleSize, cy - sampleSize / 2)));

        // Draw small patch
        analysisCtx.drawImage(video, safeX, safeY, sampleSize, sampleSize, 0, 0, sampleSize, sampleSize);
        const frameData = analysisCtx.getImageData(0, 0, sampleSize, sampleSize).data;

        let r = 0, g = 0, b = 0;
        const pixelCount = frameData.length / 4;
        for (let i = 0; i < frameData.length; i += 4) {
          r += frameData[i];
          g += frameData[i+1];
          b += frameData[i+2];
        }
        r /= pixelCount;
        g /= pixelCount;
        b /= pixelCount;

        const brightness = (r + g + b) / 3;
        // Added +1 to denominator to prevent huge numbers for black pixels, though brightness check handles that
        const redness = r / (Math.max(g, b) + 1);

        // Logic Refined to avoid triggering on Teeth or Dark Throats:
        // Dark (< 35) = Open mouth cavity / Throat -> Score 0
        // Bright (> 70) and Low Redness (< 1.1) = Teeth -> Score 0
        // High Redness (> 1.15) = Tongue -> Score 1
        
        if (brightness < 35) {
          colorScore = 0; // Dark throat/void
        } else {
          if (redness > 1.2) {
            colorScore = 1.0; // Strong Red
          } else if (brightness > 80 && redness < 1.05) {
             colorScore = 0; // Likely White Teeth
          } else if (redness > 1.05) {
             colorScore = 0.5; // Moderate Red (Bad lighting or lips)
          } else {
             colorScore = 0.1; // Skin/Face
          }
        }
      }
    }

    // --- FUSION LOGIC ---
    let instantScore = 0;

    // Stricter rules:
    // Must have significant opening AND significant color match.
    // openRatio 0.35 is about the threshold where lips part significantly.
    
    if (openRatio > 0.35 && colorScore > 0.8) {
      instantScore = 1.0; // Ideal case
    }
    else if (openRatio > 0.5 && colorScore > 0.4) {
      // Very wide open, color is okay (maybe shadow on tongue)
      instantScore = 0.8;
    }
    else {
      instantScore = 0;
    }

    // Smoothing
    lastTongueScore = (instantScore * SMOOTHING_FACTOR) + (lastTongueScore * (1 - SMOOTHING_FACTOR));
    
    // Hysteresis threshold to stop flickering
    // Trigger ON at 0.6, Turn OFF at 0.4
    const threshold = lastTongueScore > 0.5 ? 0.4 : 0.6;
    const isTongueOut = lastTongueScore > threshold;

    return { 
      isTongueOut, 
      isPersonDetected, 
      landmarks,
      score: lastTongueScore,
      debug: { mouthOpen: openRatio, colorMatch: colorScore }
    };
  } catch (e) {
    console.warn(e);
    return { isTongueOut: false, isPersonDetected: false, score: 0 };
  }
};

export const getFaceLandmarkerInstance = () => faceLandmarker;
