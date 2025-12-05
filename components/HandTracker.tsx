import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { Camera, Loader2, Hand, Grab, Orbit, Box, Dna, Heart, Tornado, AlertCircle, StopCircle } from 'lucide-react';
import { HandGesture } from '../types';

interface HandTrackerProps {
  onHandMove: (x: number, y: number, gesture: HandGesture, isDetected: boolean) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandMove, enabled, onToggle }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gestureState, setGestureState] = useState<HandGesture>('none');
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(null);
  
  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        setIsLoaded(true);

      } catch (err) {
        console.error("Failed to load systems:", err);
        setError("Failed to load AI models");
      }
    };

    if (enabled && !handLandmarkerRef.current) {
      init();
    }
  }, [enabled]);

  // Handle Webcam Stream
  useEffect(() => {
    if (!enabled || !isLoaded || !videoRef.current) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 320, 
                height: 240,
                frameRate: { ideal: 30 }
            } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }

      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Camera access denied");
        onToggle(false);
      }
    };

    startCamera();

    return () => {
        // Cleanup Camera
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    };
  }, [enabled, isLoaded]);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current) return;

    const startTimeMs = performance.now();
    let results;
    try {
        results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
    } catch (e) {
        console.warn("Detection error", e);
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
    }

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks[0];
      const wrist = hand[0];
      const indexTip = hand[8]; 
      const thumbTip = hand[4];
      
      const x = 1 - indexTip.x;
      const y = indexTip.y;
      
      // Calculate squared distance
      const distSq = (p1: NormalizedLandmark, p2: NormalizedLandmark) => 
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

      const isTipFarther = (tipIdx: number, pipIdx: number) => distSq(hand[tipIdx], wrist) > distSq(hand[pipIdx], wrist);

      // Thumb logic
      const thumbExt = distSq(thumbTip, hand[17]) > distSq(hand[2], hand[17]);
      const indexExt = isTipFarther(8, 6);
      const middleExt = isTipFarther(12, 10);
      const ringExt = isTipFarther(16, 14);
      const pinkyExt = isTipFarther(20, 18);

      // Pinch Detection
      const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
      const isPinching = pinchDist < 0.05;

      let currentGesture: HandGesture = 'open';

      if (isPinching) {
        currentGesture = 'pinch'; 
      } else if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
        currentGesture = 'cube'; 
      } else if (thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt) {
        currentGesture = 'vortex'; 
      } else if (!thumbExt && indexExt && !middleExt && !ringExt && pinkyExt) {
        currentGesture = 'dna'; 
      } else if (thumbExt && indexExt && !middleExt && !ringExt && pinkyExt) {
        currentGesture = 'heart'; 
      } else if (!thumbExt && indexExt && middleExt && !ringExt && !pinkyExt) {
        currentGesture = 'saturn'; 
      } else {
        currentGesture = 'open'; 
      }

      setGestureState(currentGesture);
      onHandMove(x, y, currentGesture, true);
    } else {
      setGestureState('none');
      onHandMove(0, 0, 'none', false);
    }

    if (enabled) {
        requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  const LegendItem = ({ icon: Icon, label, active, color }: any) => (
    <div className={`transition-all duration-300 bg-black/60 backdrop-blur text-gray-300 text-[9px] px-2 py-1 rounded-full border flex items-center gap-1.5 ${active ? `text-${color}-400 border-${color}-500/50 bg-${color}-900/20` : 'border-gray-800'}`}>
        <Icon size={10} className={active ? `text-${color}-400` : ''} />
        <span>{label}</span>
    </div>
  );

  return (
    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Webcam Preview */}
      <div className={`relative overflow-hidden rounded-xl border border-cyan-900/50 bg-black shadow-2xl transition-all duration-500 origin-bottom-right pointer-events-auto ${enabled ? 'w-48 h-36 opacity-100 translate-y-0' : 'w-0 h-0 opacity-0 translate-y-10'}`}>
        <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100 opacity-80" 
        />
        {!isLoaded && enabled && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
                <Loader2 className="animate-spin text-cyan-400" size={24} />
            </div>
        )}
        
        {/* Status Overlay */}
        {isLoaded && enabled && (
            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${gestureState !== 'none' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
                <span className="text-[10px] uppercase font-bold text-white/80 tracking-wider">
                    {gestureState === 'none' ? 'Scanning' : gestureState}
                </span>
            </div>
        )}

        <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-xl pointer-events-none"></div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-950/80 backdrop-blur px-3 py-2 rounded-lg border border-red-900/50 pointer-events-auto">
            <AlertCircle size={14} />
            {error}
        </div>
      )}

      <button 
        onClick={() => onToggle(!enabled)}
        className={`pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-lg backdrop-blur-md ${
            enabled 
            ? 'bg-red-500/90 text-white shadow-red-500/25 hover:bg-red-600' 
            : 'bg-cyan-600/90 text-white shadow-cyan-500/25 hover:bg-cyan-500'
        }`}
      >
        {enabled ? (
            <>
                <StopCircle size={18} /> Disable Camera
            </>
        ) : (
            <>
                <Camera size={18} /> Enable Camera
            </>
        )}
      </button>
      
      {enabled && isLoaded && (
        <div className="flex flex-col items-end gap-1 w-48">
             <div className="grid grid-cols-2 gap-1 w-full">
                <LegendItem icon={Hand} label="Open: Portal" active={gestureState === 'open'} color="cyan" />
                <LegendItem icon={Grab} label="Pinch: Sphere" active={gestureState === 'pinch'} color="orange" />
                <LegendItem icon={Orbit} label="Victory: Saturn" active={gestureState === 'saturn'} color="purple" />
                <LegendItem icon={Box} label="Fist: Cube" active={gestureState === 'cube'} color="blue" />
                <LegendItem icon={Dna} label="Rock: DNA" active={gestureState === 'dna'} color="green" />
                <LegendItem icon={Heart} label="Love: Heart" active={gestureState === 'heart'} color="red" />
                <LegendItem icon={Tornado} label="Shaka: Vortex" active={gestureState === 'vortex'} color="yellow" />
             </div>
        </div>
      )}
    </div>
  );
};

export default HandTracker;