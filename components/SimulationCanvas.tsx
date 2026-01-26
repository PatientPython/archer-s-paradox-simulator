import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationParams, SimulationState, ViewFrame } from '../types';
import { PHYSICS_CONSTANTS, COLORS } from '../constants';

interface SimulationCanvasProps {
  params: SimulationParams;
  state: SimulationState;
  onTimeUpdate: (t: number, ampRatio?: number) => void;
}

// Camera Rig to handle view switching
const CameraRig = ({ viewFrame }: { viewFrame: ViewFrame }) => {
    const { camera, controls } = useThree();
    const targetPos = useMemo(() => new THREE.Vector3(), []);
    const targetLook = useMemo(() => new THREE.Vector3(), []);

    useFrame((_, delta) => {
        const orbitControls = controls as any;
        if (!orbitControls) return;

        const step = 5 * delta; // Interpolation speed

        if (viewFrame === ViewFrame.COM) {
            // Zoom In for detail
            targetPos.set(0.5, 0.5, 1.2); // Closer and lower for better side view of wave
            targetLook.set(0, 0, 0);
        } else {
            // Wide shot for World View
            targetPos.set(2, 3, 5);
            targetLook.set(0, 0, -2); 
        }

        // Smooth Lerp
        camera.position.lerp(targetPos, step);
        orbitControls.target.lerp(targetLook, step);
        orbitControls.update();
    });

    return null;
}

// Props for Environment Component
interface EnvironmentProps {
  arrowZRef: React.MutableRefObject<number>;
  state: SimulationState;
}

// Separate Environment Component to prevent re-renders
const Environment: React.FC<EnvironmentProps> = React.memo(({ arrowZRef, state }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    // Smoothly update position without React render
    useFrame(() => {
        if (!groupRef.current) return;
        
        if (state.viewFrame === ViewFrame.COM) {
            // Move environment opposite to arrow to simulate camera following arrow
            groupRef.current.position.z = arrowZRef.current;
        } else {
            // World frame: Environment is static at 0
            groupRef.current.position.z = 0;
        }
    });

    return (
        <group ref={groupRef}>
             {/* Ground Plane (Grass) */}
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -400]} receiveShadow>
                <planeGeometry args={[200, 1000]} />
                <meshStandardMaterial color="#74b07b" roughness={1} />
             </mesh>
             
             {/* Road (Asphalt) */}
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, -400]} receiveShadow>
                <planeGeometry args={[6, 1000]} />
                <meshStandardMaterial color="#475569" roughness={0.6} /> 
             </mesh>

             {/* Road Center Lines */}
             {Array.from({ length: 80 }).map((_, i) => (
                 <mesh key={`line-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, -i * 10 - 2]} receiveShadow>
                    <planeGeometry args={[0.2, 4]} />
                    <meshStandardMaterial color="#f8fafc" />
                 </mesh>
             ))}

             {/* Trees & Landmarks */}
             {Array.from({ length: 80 }).map((_, i) => {
                const zPos = -i * 10;
                return (
                <group key={i} position={[0, -0.5, zPos]}>
                    {[6, -6].map((xOffset, side) => (
                        <group key={side} position={[xOffset, 0, 0]} rotation={[0, (i * 1337) % 6.28, 0]}>
                            {/* Trunk */}
                            <mesh position={[0, 0.8, 0]} castShadow>
                                <cylinderGeometry args={[0.3, 0.4, 1.6, 8]} />
                                <meshStandardMaterial color="#5D4037" /> 
                            </mesh>
                            {/* Leaves */}
                            <mesh position={[0, 2.5, 0]} castShadow>
                                <coneGeometry args={[1.8, 3.5, 8]} />
                                <meshStandardMaterial color="#2E7D32" flatShading /> 
                            </mesh>
                            <mesh position={[0, 4.0, 0]} castShadow>
                                <coneGeometry args={[1.4, 3.0, 8]} />
                                <meshStandardMaterial color="#388E3C" flatShading />
                            </mesh>
                        </group>
                    ))}

                    {/* Milestone Markers */}
                    {i % 5 === 0 && i !== 0 && (
                        <group position={[-4.5, 0, 0]} rotation={[0, 0.2, 0]}>
                           {/* Stone Base */}
                           <mesh position={[0, 0.4, 0]} castShadow>
                                <boxGeometry args={[0.8, 0.8, 0.4]} />
                                <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
                           </mesh>
                           {/* Milestone Body */}
                           <mesh position={[0, 1.0, 0]} castShadow>
                                <cylinderGeometry args={[0.4, 0.4, 0.8, 32]} rotation={[0, Math.PI/2, 0]} />
                                <meshStandardMaterial color="#f1f5f9" />
                           </mesh>
                           <group position={[0, 1.0, 0.41]}>
                                <Html transform distanceFactor={20} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
                                <div style={{ 
                                    fontSize: '24px', 
                                    color: '#334155', 
                                    fontWeight: 'bold', 
                                    fontFamily: 'Impact, sans-serif',
                                    border: '3px solid #334155',
                                    padding: '4px 8px',
                                    backgroundColor: '#fff',
                                    borderRadius: '6px'
                                }}>
                                    {Math.abs(zPos)}m
                                </div>
                                </Html>
                           </group>
                        </group>
                     )}
                </group>
             )})}
        </group>
    );
});

// Arrow Component
const Arrow = ({ params, state, onTimeUpdate, arrowZRef }: SimulationCanvasProps & { arrowZRef: React.MutableRefObject<number> }) => {
  const shaftRef = useRef<THREE.Mesh>(null);
  
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
        
        // Calculate decay ratio for auto-stop check
        const currentDecayRatio = Math.exp(-params.damping * currentT);

        if (Math.abs(currentT - lastUpdateRef.current) > 0.05) {
          onTimeUpdate(currentT, currentDecayRatio);
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
    
    // Update shared ref for environment
    arrowZRef.current = distanceTraveled;

    // 2. Vibration Model (Euler-Bernoulli Beam approximation)
    const stiffnessFactor = 1000 / params.spine; // Invert so higher number = stiffer
    const angularFreq = stiffnessFactor * 8 * (params.harmonicMode / 2); // rad/s
    
    // Amplitude depends on Force and Softness (Spine)
    // Initial buckling amplitude
    // Reduced divisor from 200000 to 120000 to increase visual prominence of vibration
    const baseAmplitude = (force * params.spine) / 120000; 
    
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
                              <Html center distanceFactor={state.viewFrame === ViewFrame.COM ? 2 : 8} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
                                <div style={{
                                  fontSize: '10px', 
                                  fontWeight: 'bold',
                                  color: '#000',
                                  backgroundColor: 'rgba(255,255,255,0.6)',
                                  padding: '1px 3px',
                                  borderRadius: '2px',
                                  fontFamily: "Arial, sans-serif",
                                  whiteSpace: 'nowrap',
                                  opacity: 0.8,
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
        
    </group>
  );
};

// Main Scene Container
const SimulationCanvas: React.FC<SimulationCanvasProps & { onToggleFrame: () => void }> = (props) => {
  const arrowZRef = useRef(0);
  
  return (
    <div className="w-full h-full bg-slate-50 rounded-lg overflow-hidden shadow-inner border border-slate-200 relative">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [2, 1.5, 4], fov: 45 }}>
        <color attach="background" args={['#87CEEB']} />
        <fog attach="fog" args={['#87CEEB', 10, 60]} />

        {/* Use Canvas camera prop instead of PerspectiveCamera to avoid initialization conflicts */}
        <OrbitControls makeDefault enablePan={true} enableZoom={true} minDistance={0.1} maxDistance={20} />
        <CameraRig viewFrame={props.state.viewFrame} />
        
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        {/* The Simulation */}
        <Environment arrowZRef={arrowZRef} state={props.state} />
        <Arrow {...props} arrowZRef={arrowZRef} />
      </Canvas>
      
      {/* Overlay Status */}
      <div className="absolute top-4 left-4 pointer-events-none z-[200]">
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-100/50">
              <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${props.state.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {props.state.isPlaying ? 'Simulation Running' : (props.state.time > 0 ? 'Simulation Paused' : 'Ready')}
                  </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">T: {props.state.time.toFixed(3)}s</p>
          </div>
      </div>

      {/* View Toggle Button (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-10">
          <button 
            onClick={props.onToggleFrame}
            className="flex items-center gap-3 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 group"
          > 
             <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase opacity-70 leading-none">当前视角</span>
                <span className="font-bold text-sm">
                    {props.state.viewFrame === ViewFrame.COM ? '跟随质心 (COM)' : '世界固定 (World)'}
                </span>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
             </div>
          </button>
      </div>
    </div>
  );
};

export default SimulationCanvas;