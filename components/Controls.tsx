import React, { useState } from 'react';
import { ParticleConfig, ParticleMode } from '../types';
import { Sliders, Shuffle } from 'lucide-react';

interface ControlsProps {
  config: ParticleConfig;
  onChange: (newConfig: ParticleConfig) => void;
}

const Controls: React.FC<ControlsProps> = ({ config, onChange }) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleChange = (key: keyof ParticleConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md p-3 rounded-full text-white border border-gray-700 hover:bg-gray-800 transition-all z-10"
      >
        <Sliders size={20} />
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 w-80 bg-gray-900/90 backdrop-blur-lg border border-gray-800 rounded-xl p-5 shadow-2xl z-10 text-gray-200 transition-all">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Sliders size={18} className="text-cyan-400" />
          System Controls
        </h2>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-sm">
            Close
        </button>
      </div>

      {/* Manual Controls */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-400 mb-1 block">Mode</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(ParticleMode).map((m) => (
              <button
                key={m}
                onClick={() => handleChange('mode', m)}
                className={`text-xs py-1.5 rounded-md border capitalize transition-colors ${
                  config.mode === m
                    ? 'bg-cyan-900/50 border-cyan-500 text-cyan-200'
                    : 'bg-gray-800 border-transparent hover:bg-gray-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
           <div className="flex justify-between text-xs mb-1">
             <label className="text-gray-400">Particle Count</label>
             <span className="text-gray-500">{config.count}</span>
           </div>
           <input
            type="range"
            min="500"
            max="10000"
            step="100"
            value={config.count}
            onChange={(e) => handleChange('count', parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div>
           <div className="flex justify-between text-xs mb-1">
             <label className="text-gray-400">Speed</label>
             <span className="text-gray-500">{config.speed.toFixed(1)}x</span>
           </div>
           <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={config.speed}
            onChange={(e) => handleChange('speed', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div>
           <div className="flex justify-between text-xs mb-1">
             <label className="text-gray-400">Chaos / Noise</label>
             <span className="text-gray-500">{config.chaos.toFixed(1)}</span>
           </div>
           <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.chaos}
            onChange={(e) => handleChange('chaos', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div>
           <div className="flex justify-between text-xs mb-1">
             <label className="text-gray-400">Size</label>
             <span className="text-gray-500">{config.size.toFixed(2)}</span>
           </div>
           <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={config.size}
            onChange={(e) => handleChange('size', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="flex gap-4 pt-2">
            <div className="flex-1">
                <label className="text-xs font-medium text-gray-400 mb-1 block">Color Start</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="color" 
                        value={config.colorA}
                        onChange={(e) => handleChange('colorA', e.target.value)}
                        className="h-8 w-full bg-transparent rounded cursor-pointer border-0 p-0"
                    />
                </div>
            </div>
            <div className="flex-1">
                <label className="text-xs font-medium text-gray-400 mb-1 block">Color End</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="color" 
                        value={config.colorB}
                        onChange={(e) => handleChange('colorB', e.target.value)}
                        className="h-8 w-full bg-transparent rounded cursor-pointer border-0 p-0"
                    />
                </div>
            </div>
        </div>
        
        <button 
            onClick={() => {
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff'];
                handleChange('colorA', colors[Math.floor(Math.random() * colors.length)]);
                handleChange('colorB', colors[Math.floor(Math.random() * colors.length)]);
            }}
            className="w-full mt-2 py-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 flex items-center justify-center gap-2 transition-colors"
        >
            <Shuffle size={12} /> Randomize Colors
        </button>

      </div>
    </div>
  );
};

export default Controls;