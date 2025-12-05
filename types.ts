export enum ParticleMode {
  FLOAT = 'float',
  ATTRACT = 'attract',
  SWIRL = 'swirl',
  RAIN = 'rain'
}

export type HandGesture = 'none' | 'open' | 'pinch' | 'saturn' | 'cube' | 'dna' | 'heart' | 'vortex';

export interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  colorA: string; // Hex color
  colorB: string; // Hex color
  mode: ParticleMode;
  chaos: number; // Randomness factor
}

export interface Preset {
  name: string;
  config: ParticleConfig;
}

export const DEFAULT_CONFIG: ParticleConfig = {
  count: 4000,
  size: 0.15,
  speed: 1.0,
  colorA: '#00ffff',
  colorB: '#ff00ff',
  mode: ParticleMode.SWIRL,
  chaos: 0.5
};