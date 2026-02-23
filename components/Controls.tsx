import React from 'react';
import { SimulationParams, SimulationState, ViewFrame } from '../types';
import { DEFAULT_PARAMS } from '../constants';

interface ControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  resetSimulation: () => void;
}

const Controls: React.FC<ControlsProps> = ({ params, setParams, state, setState, resetSimulation }) => {

  // Calc Speed for UI
  const massVal = params.length * 0.02 + (params.tipWeight * 0.0000648);
  const forceVal = params.drawWeight * 4.448;
  const estSpeed = Math.sqrt(forceVal / massVal); // v = sqrt(a) based on sim logic

  const setSpeed = (v: number) => {
      // v^2 = a = F/m => F = m*v^2
      const neededForce = massVal * v * v;
      const neededDW = neededForce / 4.448;
      handleChange('drawWeight', Number(neededDW.toFixed(1)));
  };

  const handleChange = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handlePreset = (type: 'tuned' | 'stiff' | 'weak') => {
    resetSimulation();
    switch (type) {
        case 'tuned':
            setParams(prev => ({ ...prev, spine: 200, drawWeight: 12, harmonicMode: 3, length: 0.71 }));
            break;
        case 'stiff':
            setParams(prev => ({ ...prev, spine: 100, drawWeight: 8, harmonicMode: 1, length: 0.66 })); // Ultra stiff
            break;
        case 'weak':
            setParams(prev => ({ ...prev, spine: 250, drawWeight: 15, harmonicMode: 5, length: 0.76 })); // "Softest" possible in this range
            break;
    }
    // Auto start
    setTimeout(() => setState(s => ({...s, isPlaying: true})), 100);
  };

  const setNodes = (n: number) => {
      resetSimulation();
      setParams(prev => ({ ...prev, harmonicMode: n }));
      setTimeout(() => setState(s => ({...s, isPlaying: true})), 100);
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-white border-l border-slate-200 shadow-xl flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">控制面板</h2>
        <p className="text-sm text-slate-500">调整物理参数以观察动态挠度的变化。</p>
      </div>

      {/* Main Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setState(s => ({ ...s, isPlaying: !s.isPlaying }))}
          className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
            state.isPlaying 
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }`}
        >
          {state.isPlaying ? '暂停' : '发射 / 继续'}
        </button>
        <button
          onClick={resetSimulation}
          className="px-4 py-3 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
        >
          重置
        </button>
      </div>

      {/* Presets - Physics Configuration */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">箭矢配置预设</h3>
        <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handlePreset('tuned')} className="p-2 text-sm rounded border bg-white border-slate-200 hover:border-emerald-400 hover:text-emerald-700 transition-colors">
            ✅ 调优
            </button>
            <button onClick={() => handlePreset('stiff')} className="p-2 text-sm rounded border bg-white border-slate-200 hover:border-amber-400 hover:text-amber-700 transition-colors">
            🪨 偏硬
            </button>
            <button onClick={() => handlePreset('weak')} className="p-2 text-sm rounded border bg-white border-slate-200 hover:border-rose-400 hover:text-rose-700 transition-colors">
            🍃 偏软
            </button>
        </div>
      </div>

      {/* Presets - Node Setup */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">振动模式预设 (模式阶数 · 演示用)</h3>
        <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setNodes(1)} className={`p-2 text-sm rounded border ${params.harmonicMode === 1 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            1阶 (基础波形)
            </button>
            <button onClick={() => setNodes(3)} className={`p-2 text-sm rounded border ${params.harmonicMode === 3 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            3阶 (更复杂波形)
            </button>
            <button onClick={() => setNodes(5)} className={`p-2 text-sm rounded border ${params.harmonicMode === 5 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
            5阶 (高阶波形)
            </button>
        </div>
      </div>

      {/* Physics Sliders - Compact Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b pb-1">物理参数</h3>
        
        {/* Spine & Length Group */}
        <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-600">静态挠度</label>
                    <span className="text-xs font-mono text-indigo-600 font-bold">{params.spine}</span>
                </div>
                <input
                    type="range" min="50" max="250" step="5"
                    value={params.spine}
                    onChange={(e) => handleChange('spine', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="text-[10px] text-slate-400 text-right">大=软, 小=硬</div>
             </div>
             <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-600">箭长</label>
                    <span className="text-xs font-mono text-indigo-600 font-bold">
                        {(params.length / 0.0254).toFixed(1)}&quot; <span className="text-[10px] text-slate-400 font-normal">({params.length.toFixed(2)}m)</span>
                    </span>
                </div>
                <input
                    type="range" min="24" max="32" step="0.5"
                    value={params.length / 0.0254}
                    onChange={(e) => handleChange('length', Number(e.target.value) * 0.0254)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="text-[10px] text-slate-400 text-right">长=慢, 短=快</div>
             </div>
        </div>

        {/* Launch Speed & Draw Weight (Merged/Collapsed) */}
        <div className="bg-slate-50 rounded p-2 border border-slate-200 space-y-2">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-800">发射初速度/拉力</label>
                    <span className="text-xs font-mono text-indigo-700 font-bold">{estSpeed.toFixed(1)} m/s</span>
                 </div>
                 <input
                    type="range" min="10" max="40" step="1"
                    value={estSpeed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
                 <div className="flex justify-between text-[10px] text-slate-400 px-1">
                    <span>速度越快，拉力越大，弯曲越明显</span>
                 </div>
                 
                 <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 mt-1">
                    <span className="text-[10px] text-slate-500">拉力: {params.drawWeight} lbs</span>
                    {/* Tiny Damping Control tucked in */}
                    <div className="flex items-center gap-2 w-1/2 justify-end">
                        <label className="text-[10px] text-slate-400">阻尼(大=停得快)</label>
                        <input
                            type="range" min="0.1" max="2.0" step="0.1"
                            value={params.damping}
                            onChange={(e) => handleChange('damping', Number(e.target.value))}
                            className="w-16 h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-500"
                        />
                         <span className="text-[10px] w-4 text-right text-slate-500">{params.damping}</span>
                    </div>
                 </div>
        </div>
      </div>

      {/* View Options */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">视图与播放</h3>
         
         {/* Playback Speed (New Segmented Control) */}
         <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>播放倍速</span>
                <span className="font-mono">{state.speed}x</span>
            </div>
            <div className="grid grid-cols-6 gap-1">
                {[0.3, 0.5, 0.8, 1.0, 1.5, 2.0].map(s => (
                    <button
                        key={s}
                        onClick={() => setState(prev => ({ ...prev, speed: s }))}
                        className={`text-[10px] py-1 rounded border transition-colors ${
                            state.speed === s 
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                        }`}
                    >
                        {s}x
                    </button>
                ))}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-2 mt-2">
            <button 
                onClick={() => setState(s => ({...s, showNodes: !s.showNodes}))}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded border transition-all ${
                    state.showNodes ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                }`}
            >
                <span>显示波节</span>
                <div className={`w-2 h-2 rounded-full ${state.showNodes ? 'bg-indigo-500' : 'bg-slate-300'}`} />
            </button>

            <button 
                onClick={() => setState(s => ({...s, showTrajectory: !s.showTrajectory}))}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded border transition-all ${
                    state.showTrajectory ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                }`}
            >
                <span>显示轨迹</span>
                <div className={`w-2 h-2 rounded-full ${state.showTrajectory ? 'bg-indigo-500' : 'bg-slate-300'}`} />
            </button>
         </div>
      </div>

    </div>
  );
};

export default Controls;