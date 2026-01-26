import React, { useState, useCallback } from 'react';
import { SimulationParams, SimulationState, ViewFrame } from './types';
import { DEFAULT_PARAMS } from './constants';
import SimulationCanvas from './components/SimulationCanvas';
import Controls from './components/Controls';
import { PrinciplesModal } from './components/PrinciplesModal';

const App: React.FC = () => {
  // State initialization
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, setState] = useState<SimulationState>({
    isPlaying: false,
    time: 0,
    viewFrame: ViewFrame.COM, // Default to COM to see vibration clearly first
    showNodes: true,
    showTrajectory: true,
    speed: 0.5, // Slowed down by half as requested
  });

  const resetSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      time: 0,
      isPlaying: false
    }));
  }, []);

  const handleTimeUpdate = useCallback((t: number, currentAmpRatio?: number) => {
    setState(prev => {
        // Auto-stop if amplitude decays below 0.1% (0.001)
        if (currentAmpRatio !== undefined && currentAmpRatio < 0.001 && prev.isPlaying && t > 0.5) {
            // Schedule reset
            setTimeout(() => {
                setState(s => ({ ...s, time: 0, isPlaying: false, viewFrame: ViewFrame.WORLD }));
            }, 500); // Small delay to show "Finished" state briefly if needed, or instant
            return { ...prev, isPlaying: false };
        }
        return { ...prev, time: t };
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-800">
      
      {/* Navbar */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                AP
            </div>
            <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">弓手悖论仿真 (Archer's Paradox)</h1>
                <p className="text-xs text-slate-500">横向振动与动态挠度可视化研究</p>
            </div>
        </div>
        <div className="flex gap-4 text-sm text-slate-600">
             <button onClick={() => setIsModalOpen(true)} className="hover:text-indigo-600 transition-colors font-medium">
                关于原理
             </button>
        </div>
      </header>

      <PrinciplesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: 3D Visualization */}
        <section className="flex-1 p-4 relative">
            <SimulationCanvas 
                params={params} 
                state={state} 
                onTimeUpdate={handleTimeUpdate}
                onToggleFrame={() => setState(s => ({...s, viewFrame: s.viewFrame === ViewFrame.COM ? ViewFrame.WORLD : ViewFrame.COM}))}
            />
            
            {/* Legend / Overlay Info */}
            <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-slate-100 max-w-sm pointer-events-none z-[200]">
                <h4 className="font-bold text-slate-800 mb-2 text-sm">物理状态</h4>
                <div className="space-y-1 text-xs">
                     <div className="flex justify-between">
                         <span className="text-slate-500">当前振幅:</span>
                         <span className="font-mono text-indigo-600">
                             {(Math.exp(-params.damping * state.time) * 100).toFixed(1)}%
                         </span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-slate-500">谐波模式 (n):</span>
                         <span className="font-mono text-indigo-600">{params.harmonicMode}</span>
                     </div>
                     <div className="flex justify-between">
                         <span className="text-slate-500">动态刚度因子:</span>
                         <span className="font-mono text-indigo-600">{(1000/params.spine).toFixed(2)}</span>
                     </div>
                </div>
            </div>
        </section>

        {/* Right: Controls */}
        <aside className="w-96 flex-none h-full z-10">
            <Controls 
                params={params} 
                setParams={setParams} 
                state={state} 
                setState={setState} 
                resetSimulation={resetSimulation}
            />
        </aside>

      </main>
    </div>
  );
};

export default App;