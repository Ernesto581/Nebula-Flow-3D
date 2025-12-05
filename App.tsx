import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Github } from 'lucide-react';
import ParticleField from './components/ParticleField';
import Controls from './components/Controls';
import HandTracker from './components/HandTracker';
import { DEFAULT_CONFIG, ParticleConfig, HandGesture } from './types';

const App: React.FC = () => {
  const [config, setConfig] = useState<ParticleConfig>(DEFAULT_CONFIG);
  const [handEnabled, setHandEnabled] = useState(false);
  const [handPosition, setHandPosition] = useState<{x: number, y: number} | null>(null);
  const [gesture, setGesture] = useState<HandGesture>('none');

  const handleHandMove = (x: number, y: number, currentGesture: HandGesture, isDetected: boolean) => {
    if (isDetected) {
      setHandPosition({ x, y });
      setGesture(currentGesture);
    } else {
      setHandPosition(null);
      setGesture('none');
    }
  };

  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 15], fov: 60 }}
          dpr={[1, 2]}
          gl={{ antialias: false, alpha: false, preserveDrawingBuffer: true }} 
        >
          <color attach="background" args={['#050505']} />
          
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />
            <ParticleField 
                config={config} 
                handPosition={handEnabled ? handPosition : null} 
                gesture={handEnabled ? gesture : 'none'}
            />
          </Suspense>

          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minDistance={5}
            maxDistance={40}
            autoRotate={config.mode === 'swirl' && !handPosition}
            autoRotateSpeed={0.5}
            enabled={!handPosition}
          />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <Controls config={config} onChange={setConfig} />
      
      <HandTracker 
        enabled={handEnabled} 
        onToggle={setHandEnabled} 
        onHandMove={handleHandMove} 
      />
      
      {/* Title / Instructions */}
      <div className="absolute top-6 left-6 z-0 pointer-events-none opacity-50 hover:opacity-100 transition-opacity select-none">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Nebula Flow</h1>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
          Interactive real-time particle simulation. <br/>
          Use mouse to rotate. Scroll to zoom. <br/>
          <strong className="text-cyan-400">Enable Camera</strong> for hand gestures. <br/>
          <span className="opacity-75">See bottom right panel for gesture guide.</span>
        </p>
      </div>

      {/* Author Watermark */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-auto">
        <a 
          href="https://github.com/Ernesto581" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-600 hover:text-cyan-400 transition-all duration-300 group bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-transparent hover:border-cyan-900/50"
        >
          <Github size={14} className="opacity-70 group-hover:opacity-100" />
          <span className="text-[10px] font-medium tracking-wider uppercase">
            Developed by Ernesto Linares
          </span>
        </a>
      </div>
    </div>
  );
};

export default App;