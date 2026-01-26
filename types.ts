export enum ViewFrame {
  WORLD = 'WORLD',
  COM = 'COM' // Center of Mass
}

export interface SimulationParams {
  spine: number; // Static Spine (stiffness) 0.1 - 1.0 (inverse scaling)
  length: number; // Arrow length in meters (0.6 - 0.9)
  drawWeight: number; // Force in lbs (20 - 70)
  tipWeight: number; // Tip weight in grains (simulated mass effect)
  damping: number; // Vibration decay
  harmonicMode: number; // 1, 2, 3 (Principal vibration modes)
}

export interface SimulationState {
  isPlaying: boolean;
  time: number;
  viewFrame: ViewFrame;
  showNodes: boolean;
  showTrajectory: boolean;
  speed: number; // Playback speed
}