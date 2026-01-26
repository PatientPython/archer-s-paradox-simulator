import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationParams, SimulationState, ViewFrame } from '../types';
import { PHYSICS_CONSTANTS, COLORS } from '../constants';

interface SimulationCanvasProps {
  params: SimulationParams;
  state: SimulationState;
  onTimeUpdate: (t: number) => void;
}


// Arrow Component
const Arrow = ({ params, state, onTimeUpdate }: SimulationCanvasProps) => {
  const shaftRef = useRef<THREE.Mesh>(null);
  const envRef = useRef<THREE.Group>(null);
  
  // Physics Calculation State
  const timeRef = useRef(0);
  const lastUpdateRef = useRef(0);
  // Store previous time to prevent redundant calculations when paused
  const prevTimeRef = useRef(-1); 
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [trajectoryPoints, setTrajectoryPoints] = useState<THREE.Vector3[]>([]);

  // Generate initial geometry points
  const numSegments = 60;
  
  // Reset Handler: Sync internal physics time when global state is reset
  useEffect(() => {
    if (state.time === 0 && !state.isPlaying) {
        timeRef.current = 0;
        setTrajectoryPoints([]);
        // We do not return early here to ensure the useFrame loop below
        // updates the geometry to the initial t=0 state immediately.
    }
  }, [state.time, state.isPlaying]);

  // Update Physics Loop
  useFrame((rootState, delta) => {
    // Determine current simulation time
    let currentT = timeRef.current;

    // Only advance time if playing
    if (state.isPlaying) {
        // Apply playback speed
        const dt = delta * state.speed;
        currentT += dt;
        timeRef.current = currentT;
        if (Math.abs(currentT - lastUpdateRef.current) > 0.05) {
          onTimeUpdate(currentT);
          lastUpdateRef.current = currentT;
        }
    }

    // Physics Model
    
    // Optimization: Skip calculation if time hasn't changed and points are already generated
    // This prevents infinite re-render loops when paused
    if (!state.isPlaying && points.length > 0 && Math.abs(currentT - prevTimeRef.current) < 0.0001) {
        return;
    }
    prevTimeRef.current = currentT;

    // 1. Calculate Velocity based on Draw Weight and Mass (Simplified)
    const mass = params.length * 0.02 + (params.tipWeight * 0.0000648); // rough kg
    const force = params.drawWeight * 4.448; // Newtons
    const acceleration = force / mass;
    const maxVelocity = Math.sqrt(2 * acceleration * 0.5); // accelerating over 0.5m power stroke (simplified)
    
    // Arrow forward motion (Z-axis)
    // If we are in COM frame, Z stays 0 relative to camera, but we simulate 'distance traveled' for decay
    const distanceTraveled = maxVelocity * currentT; 
    
    // Update Environment Position for Reference
    if (envRef.current) {
         if (state.viewFrame === ViewFrame.COM) {
             envRef.current.position.z = distanceTraveled;
         } else {
             envRef.current.position.z = 0;
         }
    }

    // 2. Vibration Model (Euler-Bernoulli Beam approximation)
    const stiffnessFactor = 1000 / params.spine; // Invert so higher number = stiffer
    const angularFreq = stiffnessFactor * 8 * (params.harmonicMode / 2); // rad/s
    
    // Amplitude depends on Force and Softness (Spine)
    // Initial buckling amplitude
    const baseAmplitude = (force * params.spine) / 200000; 
    
    // Damping
    const decay = Math.exp(-params.damping * currentT);
    const currentAmp = baseAmplitude * decay;

    // Generate Points along the shaft
    const newPoints: THREE.Vector3[] = [];
    
    // Determine Center Z based on view frame
    const centerZ = state.viewFrame === ViewFrame.WORLD ? -distanceTraveled : 0;

    for (let i = 0; i <= numSegments; i++) {
      const normalizedPos = i / numSegments; // 0 to 1 (Tip to Nock)
      const xPos = (normalizedPos - 0.5) * params.length; // Local Z coordinate along shaft (-L/2 to L/2)
      
      // Standing Wave Equation: y(x,t) = A * sin(n * pi * x / L) * cos(omega * t)
      const wavePhase = normalizedPos * Math.PI * params.harmonicMode;
      
      // Transverse displacement (X-axis in 3D world)
      const transverseDisp = currentAmp * Math.sin(wavePhase) * Math.cos(angularFreq * currentT);

      // Map to 3D Space
      const pZ = centerZ + xPos;
      const pX = transverseDisp;
      const pY = 0; 

      newPoints.push(new THREE.Vector3(pX, pY, pZ));
    }
    setPoints(newPoints);

    // Update Trajectory (COM Path)
    if (state.isPlaying && state.showTrajectory && state.viewFrame === ViewFrame.WORLD) {
        // Sample trajectory points periodically
        if (currentT > 0 && (trajectoryPoints.length === 0 || currentT % 0.05 < 0.02)) {
             setTrajectoryPoints(prev => {
                 const newPt = new THREE.Vector3(0, 0, -distanceTraveled);
                 // Limit tail length for performance
                 if (prev.length > 200) return [...prev.slice(1), newPt];
                 return [...prev, newPt];
             });
        }
    }
  });

  // Re-generate geometry when points change
  const tubeGeometry = useMemo(() => {
    if (points.length < 2) return null;
    try {
        const curve = new THREE.CatmullRomCurve3(points);
        return new THREE.TubeGeometry(curve, 60, PHYSICS_CONSTANTS.ARROW_DIAMETER / 2, 8, false);
    } catch (e) {
        console.warn("Curve generation failed", e);
        return null;
    }
  }, [points]);

  // Calculate Node positions for visualization
  const nodeMarkers = useMemo(() => {
    if (!state.showNodes) return [];
    const markers = [];
    for (let k = 0; k <= params.harmonicMode; k++) {
        const ratio = k / params.harmonicMode;
        // Theoretical local Z position
        const zLocal = (ratio - 0.5) * params.length;
        markers.push(new THREE.Vector3(0, 0, zLocal));
    }
    return markers;
  }, [params.harmonicMode, params.length, state.showNodes]);


  return (
    <group>
        {/* The Arrow Mesh */}
        {tubeGeometry && points.length >= 2 && (
            <mesh ref={shaftRef} geometry={tubeGeometry} castShadow>
                <meshStandardMaterial color={COLORS.arrowShaft} metalness={0.5} roughness={0.4} />
            </mesh>
        )}
        
        {/* Tip */}
        {points.length > 0 && points[0] && (
            <mesh position={points[0]} rotation={[Math.PI/2, 0, 0]}>
                <coneGeometry args={[PHYSICS_CONSTANTS.ARROW_DIAMETER * 1.5, 0.04, 16]} />
                <meshStandardMaterial color={COLORS.arrowTip} />
            </mesh>
        )}
        
        {/* Fletchings (Visual only, attached to last point) */}
        {points.length > 0 && points[points.length - 1] && (
             <group position={points[points.length - 1]}>
                {[0, 2*Math.PI/3, 4*Math.PI/3].map((rot, i) => (
                    <mesh key={i} rotation={[0, 0, rot]} position={[0, 0, 0.05]}>
                        <boxGeometry args={[0.002, 0.03, 0.08]} />
                        <meshStandardMaterial color={COLORS.arrowFletching} />
                    </mesh>
                ))}
             </group>
        )}

        {/* Node Markers */}
        {state.showNodes && points.length > 0 && (
             <group>
                 {nodeMarkers.map((_, idx) => {
                     // Get the index in the points array to find the current world position of this node on the bent arrow
                     // Clamp index to prevent undefined access
                     const rawIndex = Math.floor((idx / params.harmonicMode) * numSegments);
                     const pointIndex = Math.max(0, Math.min(points.length - 1, rawIndex));
                     
                     // Fallback vector just in case
                     const nodePos = points[pointIndex] || new THREE.Vector3(0,0,0);

                     return (
                        <mesh key={idx} position={nodePos}>
                            <sphereGeometry args={[0.015, 16, 16]} />
                            <meshBasicMaterial color={COLORS.nodePoint} transparent opacity={0.8} />
                            <group position={[0, 0.05, 0]}>
                              <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                                <div style={{
                                  fontSize: '2px',
                                  color: '#111',
                                  fontFamily: "'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', Arial, sans-serif",
                                  whiteSpace: 'nowrap',
                                  opacity: 0.7
                                }}>
                                  {idx === 0 || idx === params.harmonicMode ? '端点' : '波节'}
                                </div>
                              </Html>
                            </group>
                        </mesh>
                     )
                 })}
             </group>
        )}

        {/* Trajectory Line (World Frame Only) */}
        {state.showTrajectory && state.viewFrame === ViewFrame.WORLD && trajectoryPoints.length > 1 && (
             <Line points={trajectoryPoints} color={COLORS.trajectoryLine} lineWidth={2} dashed={true} dashScale={5} />
        )}
        
        {/* Environment Group - Moves in COM frame, Static in World frame */}
        <group ref={envRef}>
             <Grid position={[0, -0.4, 0]} args={[100, 100]} infiniteGrid fadeDistance={40} sectionColor={COLORS.grid} cellColor={COLORS.grid} />
             
             {/* Reference Markers (Poles every 5m) */}
             {Array.from({ length: 30 }).map((_, i) => (
                <group key={i} position={[0, -0.4, -i * 5]}>
                    <mesh position={[2, 0.5, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
                        <meshStandardMaterial color="#94a3b8" transparent opacity={0.5} />
                    </mesh>
                    <mesh position={[-2, 0.5, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
                        <meshStandardMaterial color="#94a3b8" transparent opacity={0.5} />
                    </mesh>
                     {/* Text Labels */}
                    <group position={[2.5, 0.5, 0]} rotation={[0, Math.PI/2, 0]}>
                         <Html transform distanceFactor={5} style={{ pointerEvents: 'none' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>{i * 5}m</div>
                         </Html>
                    </group>
                </group>
             ))}
        </group>
        
        {/* COM Reference Point Indicator - Removed in favor of moving environment */}
    </group>
  );
};

// Main Scene Container
const SimulationCanvas: React.FC<SimulationCanvasProps> = (props) => {
  return (
    <div className="w-full h-full bg-slate-50 rounded-lg overflow-hidden shadow-inner border border-slate-200">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [1.5, 1, 1.5], fov: 50 }}>
        {/* Use Canvas camera prop instead of PerspectiveCamera to avoid initialization conflicts */}
        <OrbitControls makeDefault enablePan={true} enableZoom={true} minDistance={0.5} maxDistance={10} />
        
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
        {/* Environment removed to avoid HDR fetch errors in offline/blocked networks */}

        {/* The Simulation */}
        <Arrow {...props} />
      </Canvas>
      
      {/* Overlay Status */}
      <div className="absolute top-4 left-4 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-sm p-2 rounded shadow text-xs text-slate-600 font-mono">
              <p>参考系: {props.state.viewFrame === ViewFrame.COM ? '质心 (跟随)' : '世界 (固定)'}</p>
              <p>时间: {props.state.time.toFixed(2)}s</p>
          </div>
      </div>
    </div>
  );
};

export default SimulationCanvas;