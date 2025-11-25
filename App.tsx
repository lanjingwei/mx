import React, { useState, useEffect } from 'react';
import { useVision } from './hooks/useFaceMesh';
import { FaceScanner } from './components/FaceScanner';
import { ResultModal } from './components/ResultModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { generateFortune } from './services/fortuneService';
import { AnalysisReport, AppState, VisionMetrics, VisionMode } from './types';
import { BrainCircuit, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<VisionMode>('face');
  const { 
    videoRef, 
    imageRef,
    landmarks, 
    isCameraActive, 
    uploadedImage,
    startCamera, 
    stopCamera, 
    switchCamera, 
    facingMode,
    handleFileUpload,
    processImage
  } = useVision(mode);
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  // When camera activates or image uploaded, set state to scanning
  useEffect(() => {
    if ((isCameraActive || uploadedImage) && appState === AppState.IDLE) {
      setAppState(AppState.SCANNING);
    }
  }, [isCameraActive, uploadedImage, appState]);

  const handleAnalyze = async (metrics: VisionMetrics) => {
    setAppState(AppState.ANALYZING);

    try {
        const generatedReport = await generateFortune(metrics);
        setReport(generatedReport);
        setAppState(AppState.RESULT);
    } catch (e) {
        console.error(e);
        const errorMsg = e instanceof Error ? e.message : '未知错误';
        alert(`🔮 天机运算失败\n\n原因：${errorMsg}\n\n请检查网络连接后重试`);
        setAppState(AppState.SCANNING);
    }
  };

  const handleCloseModal = () => {
    setAppState(AppState.SCANNING);
    setReport(null);
  };
  
  const getSubtext = () => {
      switch(mode) {
          case 'face': return '请正对镜头，AI将基于《麻衣神相》解析三停五眼。';
          case 'hand': return '请伸出惯用手张开，AI将解析掌纹与五行天赋。';
          case 'body': return '请拍摄上半身或全身，AI将分析您的仪态与气场。';
      }
  }

  const getTitle = () => {
      switch(mode) {
          case 'face': return '面相 · 识人';
          case 'hand': return '手相 · 通天';
          case 'body': return '骨相 · 观气';
      }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex flex-col relative overflow-x-hidden selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Ambient Background - Cyber Grid & Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.15]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] opacity-50 mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
      </div>

      {/* Header */}
      <header className="px-6 py-5 flex justify-between items-center z-40 relative">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative">
             <div className="absolute inset-0 bg-amber-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
             <div className="relative w-12 h-12 bg-slate-900/80 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/10 group-hover:border-amber-500/50 transition-colors">
                <BrainCircuit className="text-amber-500 w-7 h-7" />
             </div>
          </div>
          <div>
            <h1 className="text-2xl font-serif text-white tracking-widest flex items-center gap-2">
              天机 <span className="text-xs font-sans text-amber-500/80 border border-amber-500/30 px-1.5 py-0.5 rounded tracking-normal">BETA</span>
            </h1>
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Cyber-Taoism AI</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM ONLINE</span>
          <span className="opacity-50">V.3.1.2</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-7xl mx-auto">
        
        <div className="w-full flex flex-col items-center gap-10">
          
          <div className="text-center space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-700">
             <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-2">
                <Sparkles className="w-3 h-3" /> AI 算命 · 科学玄学
             </div>
             <h2 className="text-4xl md:text-5xl font-serif text-white tracking-wide drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
               {getTitle()}
             </h2>
             <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
               {getSubtext()}
             </p>
          </div>

          <div className="w-full animate-in zoom-in-95 duration-700 delay-150">
            <FaceScanner
                videoRef={videoRef}
                imageRef={imageRef}
                uploadedImage={uploadedImage}
                landmarks={landmarks}
                isCameraActive={isCameraActive}
                onStartCamera={startCamera}
                onAnalyze={handleAnalyze}
                isProcessing={appState === AppState.ANALYZING}
                mode={mode}
                setMode={setMode}
                onSwitchCamera={switchCamera}
                facingMode={facingMode}
                onFileUpload={handleFileUpload}
                processImage={processImage}
            />
          </div>
          
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-xs font-mono z-10 relative">
        <div className="flex justify-center gap-4 mb-2 opacity-50">
            <span>DATA_STREAM: SECURE</span>
            <span>LATENCY: 12ms</span>
            <span>ENCRYPTION: AES-256</span>
        </div>
        <p>© 2025 TIANJI LABS. 天机不可泄露.</p>
      </footer>

      {/* Result Modal */}
      <ResultModal 
        isOpen={appState === AppState.RESULT}
        report={report}
        onClose={handleCloseModal}
      />

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={appState === AppState.ANALYZING}
        mode={mode}
      />

    </div>
  );
};

export default App;