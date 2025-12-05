import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, ParticleMode, HandGesture } from '../types';

interface ParticleFieldProps {
  config: ParticleConfig;
  handPosition?: { x: number, y: number } | null;
  gesture?: HandGesture;
}

const ParticleField: React.FC<ParticleFieldProps> = ({ config, handPosition, gesture = 'none' }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport, mouse } = useThree();

  // Initialize particles with stable random assignments for shapes
  const particleData = useMemo(() => {
    const count = config.count;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    // Store random attributes to keep shapes consistent per particle
    const randoms = new Float32Array(count * 3); 

    const colorA = new THREE.Color(config.colorA);
    const colorB = new THREE.Color(config.colorB);

    for (let i = 0; i < count; i++) {
      // Initial random cloud positions
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      // Assign colors
      const mixedColor = colorA.clone().lerp(colorB, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      // Random factors for shape calculation
      randoms[i * 3] = Math.random();     // u (0-1)
      randoms[i * 3 + 1] = Math.random(); // v (0-1)
      randoms[i * 3 + 2] = Math.random(); // noise/selection
    }

    return { positions, colors, randoms };
  }, [config.count, config.colorA, config.colorB]);

  // Create geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3));
    return geo;
  }, [particleData]);

  // --- SHAPE MATH HELPERS ---

  const getSpherePosition = (u: number, v: number, radius: number, cx: number, cy: number, time: number) => {
    const theta = u * Math.PI * 2;
    const phi = Math.acos(2 * v - 1);
    const spin = time * 2;
    const x = cx + radius * Math.sin(phi) * Math.cos(theta + spin);
    const y = cy + radius * Math.sin(phi) * Math.sin(theta + spin);
    const z = radius * Math.cos(phi);
    return { x, y, z };
  };

  const getTorusPosition = (u: number, v: number, radius: number, tube: number, cx: number, cy: number, time: number) => {
    const u2 = u * Math.PI * 2;
    const v2 = v * Math.PI * 2;
    const spinX = time;
    let tx = (radius + tube * Math.cos(v2)) * Math.cos(u2 + spinX);
    let ty = (radius + tube * Math.cos(v2)) * Math.sin(u2 + spinX);
    let tz = tube * Math.sin(v2);
    // Tilt
    const tilt = 1; 
    const tiltedY = ty * Math.cos(tilt) - tz * Math.sin(tilt);
    const tiltedZ = ty * Math.sin(tilt) + tz * Math.cos(tilt);
    return { x: cx + tx, y: cy + tiltedY, z: tiltedZ };
  };

  const getSaturnRingPosition = (u: number, v: number, innerRadius: number, outerRadius: number, cx: number, cy: number, time: number) => {
    const angle = u * Math.PI * 2;
    const r = innerRadius + v * (outerRadius - innerRadius);
    const spin = time * 0.5;
    let tx = r * Math.cos(angle + spin);
    let ty = r * Math.sin(angle + spin);
    let tz = (Math.random() - 0.5) * 0.1;
    // Tilt
    const tilt = 0.5;
    const tiltedX = tx;
    const tiltedY = ty * Math.cos(tilt) - tz * Math.sin(tilt);
    const tiltedZ = ty * Math.sin(tilt) + tz * Math.cos(tilt);
    return { x: cx + tiltedX, y: cy + tiltedY, z: tiltedZ };
  };

  const getCubePosition = (u: number, v: number, noise: number, size: number, cx: number, cy: number, time: number) => {
    // Map random 0-1 to -1 to 1
    let tx = (u - 0.5) * 2 * size;
    let ty = (v - 0.5) * 2 * size;
    let tz = (noise - 0.5) * 2 * size;
    
    // Rotate cube
    const cos = Math.cos(time * 0.5);
    const sin = Math.sin(time * 0.5);
    
    // Rotation Y
    const rx = tx * cos - tz * sin;
    const rz = tx * sin + tz * cos;
    
    // Rotation X
    const ry = ty * cos - rz * sin;
    const rz2 = ty * sin + rz * cos;

    return { x: cx + rx, y: cy + ry, z: rz2 };
  };

  const getDNAPosition = (u: number, v: number, noise: number, cx: number, cy: number, time: number) => {
    const strand = noise > 0.5 ? 0 : Math.PI; // Two strands offset by PI
    const height = (u - 0.5) * 10; // Vertical spread
    const angle = height * 1.5 + time * 2 + strand;
    const radius = 1.5;
    
    const tx = Math.cos(angle) * radius;
    const ty = height;
    const tz = Math.sin(angle) * radius;
    
    // Add some random scatter to make it look like particles, not a solid line
    const scatter = 0.2;
    return { 
      x: cx + tx + (Math.random() - 0.5) * scatter, 
      y: cy + ty, 
      z: tz + (Math.random() - 0.5) * scatter 
    };
  };

  const getHeartPosition = (u: number, v: number, cx: number, cy: number, time: number) => {
    // Parametric Heart
    // x = 16sin^3(t)
    // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    const t = u * Math.PI * 2;
    const scale = 0.15;
    
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    
    // Add volume with 'v' and beat with 'time'
    const beat = 1 + Math.sin(time * 8) * 0.05; // Heartbeat
    const volume = (v - 0.5) * 2; // Thickness
    
    return { 
      x: cx + hx * scale * beat, 
      y: cy + hy * scale * beat, 
      z: volume * 0.5 // Flat-ish heart with some depth
    };
  };

  const getVortexPosition = (u: number, v: number, cx: number, cy: number, time: number) => {
    // Cone / Tornado
    const height = (u - 0.2) * 8; // -1.6 to 6.4
    const radius = Math.max(0.1, (height + 2) * 0.4); // Radius gets larger as height goes up
    const angle = v * Math.PI * 2 + time * 5 + height; // Spin faster at different heights
    
    const tx = Math.cos(angle) * radius;
    const tz = Math.sin(angle) * radius;
    
    return { x: cx + tx, y: cy + height, z: tz };
  };

  // Animation Loop
  useFrame((state) => {
    if (!pointsRef.current) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const count = config.count;
    const time = state.clock.getElapsedTime();
    
    // Determine target center
    let targetX = mouse.x * viewport.width / 2;
    let targetY = mouse.y * viewport.height / 2;

    if (handPosition) {
        targetX = (handPosition.x - 0.5) * viewport.width;
        targetY = -(handPosition.y - 0.5) * viewport.height;
    }

    let lerpFactor = 0.05 * config.speed; 
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      let cx = positions[idx];
      let cy = positions[idx + 1];
      let cz = positions[idx + 2];
      
      const u = particleData.randoms[idx];
      const v = particleData.randoms[idx + 1];
      const noise = particleData.randoms[idx + 2];

      let tx, ty, tz;

      if (handPosition) {
        switch (gesture) {
            case 'pinch': {
                // Sphere
                const p = getSpherePosition(u, v, 1.5, targetX, targetY, time);
                tx = p.x; ty = p.y; tz = p.z;
                lerpFactor = 0.15;
                break;
            }
            case 'saturn': {
                // Sphere + Rings
                const isPlanet = noise < 0.6;
                if (isPlanet) {
                    const p = getSpherePosition(u, v, 1.2, targetX, targetY, time);
                    tx = p.x; ty = p.y; tz = p.z;
                } else {
                    const p = getSaturnRingPosition(u, v, 2.0, 4.5, targetX, targetY, time);
                    tx = p.x; ty = p.y; tz = p.z;
                }
                lerpFactor = 0.1;
                break;
            }
            case 'cube': {
                // Cube
                const p = getCubePosition(u, v, noise, 2.5, targetX, targetY, time);
                tx = p.x; ty = p.y; tz = p.z;
                lerpFactor = 0.12;
                break;
            }
            case 'dna': {
                // Double Helix
                const p = getDNAPosition(u, v, noise, targetX, targetY, time);
                tx = p.x; ty = p.y; tz = p.z;
                lerpFactor = 0.08;
                break;
            }
            case 'heart': {
                // Heart
                const p = getHeartPosition(u, v, targetX, targetY, time);
                tx = p.x; ty = p.y; tz = p.z;
                lerpFactor = 0.1;
                break;
            }
            case 'vortex': {
                // Tornado
                const p = getVortexPosition(u, v, targetX, targetY, time);
                tx = p.x; ty = p.y; tz = p.z;
                lerpFactor = 0.08;
                break;
            }
            case 'open': 
            default: {
                // Torus Portal
                const p = getTorusPosition(u, v, 3, 0.5, targetX, targetY, time);
                tx = p.x; ty = p.y; tz = p.z;
                lerpFactor = 0.08;
                break;
            }
        }
      } else {
        // --- NO HAND TRACKING (Mouse / Idle) ---
        const scale = 0.5;
        tx = Math.sin(time * 0.5 + u * Math.PI * 2) * 10 * scale + Math.cos(time * 0.3 + v * Math.PI) * 5;
        ty = Math.cos(time * 0.3 + u * Math.PI) * 8 * scale;
        tz = Math.sin(time * 0.2 + v * Math.PI * 2) * 5 * scale;
        
        if (config.mode === ParticleMode.RAIN) {
             ty -= (time * 5 + noise * 20) % 20;
             if (ty < -10) ty += 20;
        } else if (config.mode === ParticleMode.SWIRL) {
             const angle = time + u * Math.PI * 2;
             const r = 5 + v * 5;
             tx = Math.cos(angle) * r;
             ty = Math.sin(time + noise * 10) * 2;
             tz = Math.sin(angle) * r;
        }

        lerpFactor = 0.02 * config.speed;
      }

      // Add turbulence (reduced when forming strict shapes)
      const shapeStability = (handPosition && gesture !== 'open') ? 0.2 : 1.0;
      const turbulence = 0.1 * config.chaos * shapeStability;
      
      tx += (Math.random() - 0.5) * turbulence;
      ty += (Math.random() - 0.5) * turbulence;
      tz += (Math.random() - 0.5) * turbulence;

      // Apply Movement
      cx += (tx - cx) * lerpFactor;
      cy += (ty - cy) * lerpFactor;
      cz += (tz - cz) * lerpFactor;

      positions[idx] = cx;
      positions[idx + 1] = cy;
      positions[idx + 2] = cz;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += 0.001;
  });

  // Dynamic Light Color based on Gesture
  const getLightColor = () => {
      switch(gesture) {
          case 'pinch': return '#ff8800'; // Orange
          case 'saturn': return '#d8b4fe'; // Purple
          case 'cube': return '#3b82f6'; // Blue
          case 'dna': return '#22c55e'; // Green
          case 'heart': return '#ef4444'; // Red
          case 'vortex': return '#eab308'; // Yellow
          default: return '#00ffff'; // Cyan
      }
  }

  return (
    <>
        <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
            size={config.size}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation={true}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
        </points>
        
        {/* Light that follows hand */}
        {handPosition && (
            <pointLight 
                position={[
                    (handPosition.x - 0.5) * viewport.width,
                    -(handPosition.y - 0.5) * viewport.height,
                    0
                ]} 
                intensity={3} 
                distance={15} 
                decay={2}
                color={getLightColor()} 
            />
        )}
    </>
  );
};

export default ParticleField;