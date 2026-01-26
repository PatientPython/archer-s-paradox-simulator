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
            setParams(prev => ({ ...prev, spine: 200, drawWeight: 12, harmonicMode: 3, length: 1.2 }));
            break;
        case 'stiff':
            setParams(prev => ({ ...prev, spine: 100, drawWeight: 8, harmonicMode: 1, length: 1.0 })); // Ultra stiff
            break;
        case 'weak':
            setParams(prev => ({ ...prev, spine: 250, drawWeight: 15, harmonicMode: 5, length: 1.5 })); // "Softest" possible in this range
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

      {/* Presets - Node Setup */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">震动模式预设 (波节数量)</h3>
        <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setNodes(1)} className={`p-2 text-sm rounded border ${params.harmonicMode === 1 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                1个模式 (简单弯曲)
            </button>
            <button onClick={() => setNodes(3)} className={`p-2 text-sm rounded border ${params.harmonicMode === 3 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                3个模式 (标准悖论)
            </button>
            <button onClick={() => setNodes(5)} className={`p-2 text-sm rounded border ${params.harmonicMode === 5 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                5个模式 (极软箭杆)
            </button>
        </div>
      </div>

      {/* Physics Sliders */}
      <div className="space-y-6">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">物理参数</h3>
        
        {/* Spine */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-700">静态挠度 (Static Spine)</label>
            <span className="text-sm font-mono text-indigo-600">{params.spine}</span>
          </div>
          <input
            type="range" min="50" max="250" step="5"
            value={params.spine}
            onChange={(e) => handleChange('spine', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>极硬 (50)</span>
            <span>最软 (250)</span>
          </div>
        </div>

        {/* Launch Speed & Draw Weight */}
        <div className="p-3 bg-slate-50 rounded-lg space-y-4 border border-slate-200">
            {/* Speed Control (Primary User Request) */}
            <div className="space-y-2">
                 <div className="flex justify-between">
                    <label className="text-sm font-bold text-slate-800">发射初速度 (Launch Speed)</label>
                    <span className="text-sm font-mono text-indigo-700 font-bold">{estSpeed.toFixed(1)} m/s</span>
                 </div>
                 <input
                    type="range" min="20" max="80" step="1"
                    value={estSpeed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                 />
                 <div className="flex justify-between text-xs text-slate-400">
                    <span>慢 (20)</span>
                    <span>快 (80)</span>
                 </div>
            </div>

            {/* Underlying Draw Weight */}
            <div className="space-y-1 pt-2 border-t border-slate-200">
               <div className="flex justify-between">
                <label className="text-xs font-medium text-slate-500">对应拉力 (Draw Weight)</label>
                <span className="text-xs font-mono text-slate-500">{params.drawWeight} lbs</span>
              </div>
              <input
                type="range" min="5" max="60" step="0.5"
                value={params.drawWeight}
                onChange={(e) => handleChange('drawWeight', Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>
        </div>

         {/* Arrow Length */}
         <div className="space-y-2">
           <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-700">箭长 (Length)</label>
            <span className="text-sm font-mono text-indigo-600">{params.length.toFixed(2)} m</span>
          </div>
          <input
            type="range" min="1.0" max="1.8" step="0.05"
            value={params.length}
            onChange={(e) => handleChange('length', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
        
        {/* Damping */}
        <div className="space-y-2">
           <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-700">阻尼 (Damping)</label>
            <span className="text-sm font-mono text-indigo-600">{params.damping.toFixed(1)}</span>
          </div>
          <input
            type="range" min="0.1" max="2.0" step="0.1"
            value={params.damping}
            onChange={(e) => handleChange('damping', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {/* View Options */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
         <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">视图选项</h3>
         
         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-700">参考系</span>
            <div className="flex bg-slate-200 rounded p-1">
                <button 
                    onClick={() => setState(s => ({...s, viewFrame: ViewFrame.WORLD}))}
                    className={`px-3 py-1 text-xs rounded transition-all ${state.viewFrame === ViewFrame.WORLD ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500'}`}
                >
                    世界
                </button>
                <button 
                    onClick={() => setState(s => ({...s, viewFrame: ViewFrame.COM}))}
                    className={`px-3 py-1 text-xs rounded transition-all ${state.viewFrame === ViewFrame.COM ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500'}`}
                >
                    质心
                </button>
            </div>
         </div>

         <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
            <span className="text-sm text-slate-700">显示波节 (Show Nodes)</span>
            <input 
                type="checkbox" 
                checked={state.showNodes} 
                onChange={e => setState(s => ({...s, showNodes: e.target.checked}))}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
         </label>

         <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
            <span className="text-sm text-slate-700">显示质心轨迹</span>
            <input 
                type="checkbox" 
                checked={state.showTrajectory} 
                onChange={e => setState(s => ({...s, showTrajectory: e.target.checked}))}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
         </label>
         
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-700">播放速度</span>
            <input 
                type="range" min="0.1" max="1.5" step="0.1"
                value={state.speed}
                onChange={e => setState(s => ({...s, speed: Number(e.target.value)}))}
                className="w-24 h-2 bg-slate-200 rounded-lg accent-indigo-600"
            />
         </div>
      </div>

    </div>
  );
};

export default Controls;