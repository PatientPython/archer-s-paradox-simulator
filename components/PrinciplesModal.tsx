import React from 'react';
import { createPortal } from 'react-dom';

interface PrinciplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrinciplesModal: React.FC<PrinciplesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">物理原理 (Physics Principles)</h2>
            <p className="text-sm text-slate-500">关于弓手悖论与箭杆振动的简要说明</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 text-slate-700 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                什么是“弓手悖论”？
            </h3>
            <p className="mb-4">
              由于这一现象最早被发现时与人们的直觉相悖，故称为“悖论”。简单来说，箭在搭在弓上时，箭头其实指向目标的偏左侧（对于右手持弓者）。如果箭完全沿直线飞行，它应该偏离目标。
            </p>
            <p>
              然而现实中，离弦瞬间弓弦对箭尾的作用线通常与箭杆质心/轴线存在偏心与约束（与弓把/箭台接触、中心射位不完全重合等），会激发箭杆的横向弯曲振动。这个横向振动让箭杆在初段运动中“绕开”弓把/箭台的几何阻挡，并在离弦后逐步衰减，平均方向仍可接近瞄准线。
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                挠度 (Spine) 与动态匹配
            </h3>
            <p className="mb-4">
              <strong>静态挠度 (Static Spine)</strong>：指箭杆的硬度。通常用“挂载重物下的弯曲量”来衡量。
              <div className="mt-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-sm font-medium">
                 数值越大 = 弯曲越多 = 箭越软 <br/>
                 数值越小 = 弯曲越少 = 箭越硬
              </div>
            </p>
            <p>
              为了让箭完美绕过弓把，箭的硬度必须与弓的拉力（磅数）匹配：
              <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>拉力越大 (High Force)</strong>：施加在箭尾的推力越大，箭越容易弯曲，因此需要更<strong>硬 (Stiff)</strong> 的箭（低Spine值）。</li>
                  <li><strong>拉力越小 (Low Force)</strong>：推力不足，箭不易弯曲，因此需要更<strong>软 (Weak)</strong> 的箭（高Spine值）。</li>
              </ul>
            </p>
          </section>

           {/* Section 3 */}
           <section>
            <h3 className="text-lg font-bold text-indigo-700 mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                振动模式与波节
            </h3>
            <p>
                箭杆的横向振动可近似看作欧拉-伯努利梁 (Euler-Bernoulli Beam) 的弯曲振动；“波节/节点 (Nodes)”指的是某一振型下横向位移为零（或极小）的空间位置。
            </p>
            <p className="mt-2">
                重要的是：节点数量主要由<strong>振型阶数与边界条件</strong>决定，而不是由重力本身决定。重力主要影响质心轨迹；空气阻力更像是额外阻尼，会让振幅更快衰减，但不会“凭空产生更多节点”。
              </p>
              <p className="mt-2">
                在真实箭的飞行里，最常见、也最“稳定可见”的通常是<strong>第一弯曲振型</strong>（它会有两个内部节点；两端并非固定端，端点往往是振幅较大的区域）。更高阶振型当然可以被离弦激发，但会更快被结构内耗与气动阻尼衰减，通常只在非常短的初段出现。
              </p>
              <p className="mt-2">
                本仿真里的“模式阶数”是为了清晰展示不同空间波形的可视化开关：
              <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li><strong>1阶/3阶/5阶</strong>表示使用不同的空间谐波形状来画出“弯曲外形”；它不等价于“真实飞行里一定会稳定出现3个或5个波节”。</li>
                    <li><strong>节点标记</strong>用于帮助识别该简化振型的零位移位置；真实情况下若多振型叠加，节点位置会随时间移动，且不一定均匀分布。</li>
              </ul>
            </p>
          </section>

          <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-500 border border-slate-200">
             * 本仿真采用简化的阻尼谐振子模型与三次样条插值来模拟视觉上的弯曲效果，主要用于定性演示参数关系。
          </div>
        
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <button 
                onClick={onClose}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all"
            >
                明白了
            </button>
        </div>
      </div>
    </div>
  , document.body);
};
