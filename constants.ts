import { SimulationParams } from './types';

// Default Physics Parameters
export const DEFAULT_PARAMS: SimulationParams = {
  spine: 200, // Very stiff (User requested max softness 250)
  length: 0.71, // ~28 inches (Standard draw length)
  drawWeight: 10, // Very weak (User requested max 15lbs)
  tipWeight: 100, // grains
  damping: 0.5,
  harmonicMode: 3, 
};

export const PHYSICS_CONSTANTS = {
  ARROW_DIAMETER: 0.008, // meters
  FLETCHING_OFFSET: 0.1, // meters from back
  TIMESTEP: 0.016, // 60fps
};

export const COLORS = {
  arrowShaft: '#1e293b', // Slate 800
  arrowFletching: '#ef4444', // Red 500
  arrowTip: '#94a3b8', // Slate 400
  nodePoint: '#3b82f6', // Blue 500
  trajectoryLine: '#10b981', // Emerald 500
  grid: '#e2e8f0',
};