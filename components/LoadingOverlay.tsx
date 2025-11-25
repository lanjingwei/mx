import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Eye, Brain, Zap } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  mode: 'face' | 'hand' | 'body';
}

// 命理术语随机提示
const fortuneTips = {
  face: [
    '正在观察天庭气色...',
    '解读三停比例格局...',
    '分析眉眼神韵...',
    '推算十二宫运势...',
    '识别五官吉凶...',
    '感应气色明暗...',
    '推演流年大运...',
    '参悟面相玄机...',
  ],
  hand: [
    '识别掌型五行属性...',
    '解读生命线走向...',
    '分析智慧线深浅...',
    '推算感情线纹理...',
    '观察八大掌丘起伏...',
    '推演事业线命运...',
    '感应婚姻线气场...',
    '解析左右手对比...',
  ],
  body: [
    '观察体态骨相...',
    '感应气场能量...',
    '分析姿态吉凶...',
    '推演健康运势...',
  ]
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, mode }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const tips = fortuneTips[mode];

  // 循环切换提示语
  useEffect(() => {
    if (!isVisible) {
      setTipIndex(0);
      setProgress(0);
      return;
    }

    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95));
    }, 500);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [isVisible, tips.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 八卦旋转 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-5">
          <div className="w-full h-full border-2 border-amber-500 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-8 border border-amber-500/50 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-16 border border-amber-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
        </div>
        
        {/* 粒子效果 */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 主要内容 */}
      <div className="relative flex flex-col items-center gap-8 p-8">
        
        {/* 中央图标动画 */}
        <div className="relative">
          {/* 外圈脉冲 */}
          <div className="absolute inset-0 w-32 h-32 -m-4">
            <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border border-amber-500/20 rounded-full animate-ping animation-delay-200" />
          </div>
          
          {/* 核心图标 */}
          <div className="relative w-24 h-24 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-full flex items-center justify-center border border-amber-500/30 shadow-[0_0_60px_rgba(251,191,36,0.3)]">
            <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
            {mode === 'face' ? (
              <Eye className="w-10 h-10 text-amber-500 animate-pulse" />
            ) : mode === 'hand' ? (
              <Sparkles className="w-10 h-10 text-amber-500 animate-pulse" />
            ) : (
              <Zap className="w-10 h-10 text-amber-500 animate-pulse" />
            )}
          </div>
          
          {/* 旋转光环 */}
          <div className="absolute inset-0 w-24 h-24 animate-[spin_3s_linear_infinite]">
            <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24]" />
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif text-white tracking-widest flex items-center gap-3">
            <Brain className="w-6 h-6 text-amber-500" />
            天机运算中
          </h3>
          <p className="text-slate-500 text-sm font-mono">AI NEURAL COMPUTING</p>
        </div>

        {/* 动态提示 */}
        <div className="h-8 flex items-center justify-center">
          <p className="text-amber-400/80 text-sm font-medium animate-pulse flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {tips[tipIndex]}
          </p>
        </div>

        {/* 进度条 */}
        <div className="w-64 space-y-2">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_#fbbf24]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-600">
            <span>PROCESSING</span>
            <span>{Math.floor(progress)}%</span>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-slate-600 text-xs text-center max-w-xs">
          正在调用大模型进行深度分析，请稍候...
          <br />
          <span className="text-slate-700">分析结果仅供娱乐参考</span>
        </p>
      </div>
    </div>
  );
};
