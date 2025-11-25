import React, { useEffect, useRef, useMemo } from 'react';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { ScanFace, Activity, Zap, Hand, AlertTriangle, User, SwitchCamera, Accessibility, Upload, Image as ImageIcon, ChevronRight, Crosshair } from 'lucide-react';
import { FaceMetrics, HandMetrics, BodyMetrics, VisionMetrics, VisionMode } from '../types';
import { calculateFaceMetrics, calculateHandMetrics, calculateBodyMetrics, checkHeadPose, POSE_CONNECTIONS } from '../utils/faceLogic';

interface FaceScannerProps {
  landmarks: NormalizedLandmark[] | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  imageRef?: React.RefObject<HTMLImageElement>; // Optional for upload preview
  uploadedImage?: string | null;
  isCameraActive: boolean;
  onStartCamera: () => void;
  onAnalyze: (metrics: VisionMetrics) => void;
  isProcessing: boolean;
  mode: VisionMode;
  setMode: (mode: VisionMode) => void;
  onSwitchCamera: () => void;
  facingMode: 'user' | 'environment';
  onFileUpload: (file: File) => void;
  processImage?: () => void;
}

export const FaceScanner: React.FC<FaceScannerProps> = ({
  landmarks,
  videoRef,
  imageRef,
  uploadedImage,
  isCameraActive,
  onStartCamera,
  onAnalyze,
  isProcessing,
  mode,
  setMode,
  onSwitchCamera,
  facingMode,
  onFileUpload,
  processImage
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Pose Status (Only for Face)
  const poseStatus = useMemo(() => {
    if (mode === 'face' && landmarks) {
      return checkHeadPose(landmarks);
    }
    return { isCentered: true, message: "" };
  }, [landmarks, mode]);

  // Drawing Logic
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sourceWidth = 0;
    let sourceHeight = 0;

    // Determine dimensions based on active source
    if (uploadedImage && imageRef?.current) {
        sourceWidth = imageRef.current.naturalWidth;
        sourceHeight = imageRef.current.naturalHeight;
    } else if (videoRef.current) {
        sourceWidth = videoRef.current.videoWidth;
        sourceHeight = videoRef.current.videoHeight;
    }

    if (sourceWidth === 0 || sourceHeight === 0) return;

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!landmarks) return;

    // Setup Styles
    ctx.lineWidth = mode === 'face' ? 1.5 : 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Glow Effect
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    
    ctx.strokeStyle = '#fbbf24'; // Amber-400
    ctx.fillStyle = '#fbbf24';

    const drawPoint = (index: number, size = 3) => {
      const p = landmarks[index];
      if (!p) return;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, size, 0, 2 * Math.PI);
      ctx.fill();
    };

    const drawLine = (idx1: number, idx2: number) => {
        const p1 = landmarks[idx1];
        const p2 = landmarks[idx2];
        if (!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
        ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
        ctx.stroke();
    };

    if (mode === 'face') {
        // Draw T-Zone / Crucial Points
        drawPoint(10, 4); // Top
        drawPoint(152, 4); // Chin
        drawPoint(234, 4); // Left
        drawPoint(454, 4); // Right
        
        // Eyes
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
        drawLine(33, 133);
        drawLine(159, 145);
        
        // Pose Warning Color (Only show red if using camera, relax for uploaded images)
        if (!poseStatus.isCentered && !uploadedImage) {
          ctx.strokeStyle = '#ef4444'; // Red
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
        }

        // Contour subset
        const contourPoints = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
        ctx.beginPath();
        for (let i = 0; i < contourPoints.length; i++) {
           const p = landmarks[contourPoints[i]];
           if (i === 0) ctx.moveTo(p.x * canvas.width, p.y * canvas.height);
           else ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
        }
        ctx.closePath();
        ctx.stroke();
    } else if (mode === 'hand') {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8], // Index
            [0, 9], [9, 10], [10, 11], [11, 12], // Middle
            [0, 13], [13, 14], [14, 15], [15, 16], // Ring
            [0, 17], [17, 18], [18, 19], [19, 20] // Pinky
        ];
        
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
        for (const [start, end] of connections) {
            drawLine(start, end);
        }
        drawPoint(0, 6);
        drawPoint(9, 6);
    } else if (mode === 'body') {
        // DRAW POSE (Skeleton)
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)';
        
        POSE_CONNECTIONS.forEach(([start, end]) => {
           drawLine(start, end);
        });

        // Draw major joints
        [11, 12, 23, 24, 0].forEach(idx => drawPoint(idx, 5));
    }

  }, [landmarks, videoRef, imageRef, uploadedImage, mode, poseStatus, facingMode]);

  const handleAnalyzeClick = () => {
    if (landmarks) {
      try {
        let metrics: VisionMetrics = { mode };
        if (mode === 'face') {
            metrics.face = calculateFaceMetrics(landmarks);
        } else if (mode === 'hand') {
            metrics.hand = calculateHandMetrics(landmarks);
        } else if (mode === 'body') {
            metrics.body = calculateBodyMetrics(landmarks);
        }
        onAnalyze(metrics);
      } catch (e) {
        console.error("Analysis failed", e);
        alert("分析失败：未能检测到清晰的特征点，请尝试调整角度或上传更清晰的图片。");
      }
    } else {
        alert("未检测到目标，请确保人脸/手/身体在画面中清晰可见。");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          onFileUpload(file);
      }
  };

  // Only mirror if using front facing camera AND not displaying an uploaded image
  const transformStyle = (!uploadedImage && facingMode === 'user') ? 'scale-x-[-1]' : '';

  // Button disabled logic:
  const isAnalyzeDisabled = !landmarks || isProcessing || (mode === 'face' && !poseStatus.isCentered && !uploadedImage);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      
      {/* Mode Tabs - Cyber Style */}
      <div className="flex p-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 mb-6 shadow-xl relative z-20">
         {[
             { id: 'face', label: '面相', icon: User },
             { id: 'hand', label: '手相', icon: Hand },
             { id: 'body', label: '仪态', icon: Accessibility }
         ].map((m) => {
            const isActive = mode === m.id;
            return (
                <button 
                    key={m.id}
                    onClick={() => setMode(m.id as VisionMode)}
                    className={`
                        relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2
                        ${isActive ? 'text-slate-950' : 'text-slate-400 hover:text-slate-200'}
                    `}
                >
                    {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.4)]" />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        <m.icon className="w-4 h-4" /> {m.label}
                    </span>
                </button>
            )
         })}
      </div>

      {/* Main Scanner Container */}
      <div className="relative w-full aspect-[9/16] md:aspect-[4/3] bg-slate-950 rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-slate-800 ring-1 ring-white/5 group isolate">
        
        {/* Decorative Tech Borders (HUD Corners) */}
        <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-amber-500/50 rounded-tl-xl z-20 pointer-events-none"></div>
        <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-amber-500/50 rounded-tr-xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-amber-500/50 rounded-bl-xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-amber-500/50 rounded-br-xl z-20 pointer-events-none"></div>
        
        {/* Fake Data Stream HUD */}
        <div className="absolute top-8 right-10 z-20 flex flex-col items-end gap-1 opacity-60 pointer-events-none">
             <div className="text-[10px] font-mono text-amber-500 tracking-widest">SCAN_MATRIX: ACTIVE</div>
             <div className="flex gap-1">
                 <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
                 <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse delay-75"></div>
                 <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse delay-150"></div>
             </div>
        </div>

        {/* Media Source */}
        {uploadedImage ? (
           <img 
              ref={imageRef}
              src={uploadedImage}
              alt="Analysis Target"
              className="absolute inset-0 w-full h-full object-contain bg-black"
              onLoad={() => processImage && processImage()}
           />
        ) : (
          <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transform ${transformStyle} transition-transform duration-500`}
          />
        )}
        
        {/* AR Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transform ${transformStyle} transition-transform duration-500 object-contain`}
        />

        {/* Top Controls Bar */}
        <div className="absolute top-0 inset-x-0 p-6 z-30 flex justify-between pointer-events-none">
           <div className="pointer-events-auto flex gap-3">
               {/* Controls for Camera */}
               {isCameraActive && !uploadedImage && (
                  <button 
                    onClick={onSwitchCamera}
                    className="w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-all duration-300"
                    title="切换摄像头"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
               )}
               
               <div className="relative">
                  <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                  />
                  <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-slate-900 hover:border-amber-500 transition-all duration-300"
                      title="上传图片"
                  >
                      <ImageIcon className="w-5 h-5" />
                  </button>
               </div>
           </div>
        </div>

        {/* Center Overlay - Initial State */}
        {!isCameraActive && !uploadedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 flex-col gap-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse"></div>
                    <Crosshair className="w-24 h-24 text-amber-500/30 relative z-10" />
                </div>
                <div className="text-slate-400 font-mono text-sm tracking-[0.2em] uppercase">System Ready</div>
            </div>
        )}

        {/* POSE WARNING OVERLAY */}
        {isCameraActive && mode === 'face' && !poseStatus.isCentered && landmarks && !uploadedImage && (
           <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="bg-red-500/10 border border-red-500/50 text-red-100 px-8 py-6 rounded-2xl backdrop-blur-xl flex flex-col items-center gap-3 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in fade-in zoom-in duration-300">
                 <AlertTriangle className="w-10 h-10 text-red-500" />
                 <span className="text-xl font-bold tracking-wider">{poseStatus.message}</span>
                 <span className="text-xs text-red-300 opacity-80 uppercase tracking-widest">Adjust Position</span>
              </div>
           </div>
        )}

        {/* Scanning Animation */}
        {(isCameraActive || uploadedImage) && !isProcessing && (landmarks ? (mode === 'face' ? (uploadedImage ? true : poseStatus.isCentered) : true) : true) && (
          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
             <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#fbbf24] animate-scan-vertical"></div>
          </div>
        )}
        
        {/* Bottom Status Bar */}
        <div className="absolute inset-x-0 bottom-0 p-6 flex items-end justify-between pointer-events-none z-30 bg-gradient-to-t from-slate-950/80 to-transparent">
           <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${landmarks ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-600'} transition-colors duration-500`}></div>
               <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                   Target: {landmarks ? 'LOCKED' : 'SEARCHING...'}
               </div>
           </div>
        </div>

      </div>

      {/* Main Action Area - Floating Below */}
      <div className="mt-8 flex justify-center w-full z-30">
        {isCameraActive || uploadedImage ? (
            <button
            onClick={handleAnalyzeClick}
            disabled={isAnalyzeDisabled}
            className={`
                relative group overflow-hidden
                w-full max-w-sm
                bg-slate-900 border 
                px-8 py-5 rounded-2xl
                transition-all duration-500
                flex items-center justify-center gap-4
                ${isAnalyzeDisabled 
                    ? 'opacity-60 border-slate-800 cursor-not-allowed grayscale' 
                    : 'border-amber-500/50 shadow-[0_0_30px_rgba(251,191,36,0.15)] hover:shadow-[0_0_50px_rgba(251,191,36,0.3)] hover:border-amber-400 hover:-translate-y-1'
                }
            `}
            >
            {/* Background Gradient Animation */}
            {!isAnalyzeDisabled && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            )}
            
            <Zap className={`w-6 h-6 text-amber-500 ${!isAnalyzeDisabled && landmarks ? 'fill-amber-500 animate-pulse' : ''}`} />
            <div className="flex flex-col items-start">
                <span className={`text-lg font-bold tracking-widest uppercase ${isAnalyzeDisabled ? 'text-slate-500' : 'text-amber-100'}`}>
                    {isProcessing ? 'CALCULATING...' : '开始解析'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
                    Initialize Analysis
                </span>
            </div>
            {!isAnalyzeDisabled && !isProcessing && <ChevronRight className="w-5 h-5 text-amber-500/50 group-hover:translate-x-1 transition-transform" />}
            </button>
        ) : (
            <div className="flex gap-4">
                <button 
                onClick={onStartCamera}
                className="
                    group relative px-8 py-4 rounded-full bg-amber-500 text-slate-950 font-bold tracking-wider 
                    hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)] 
                    hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] active:scale-95
                    flex items-center gap-3 overflow-hidden
                "
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></div>
                    <ScanFace className="w-5 h-5" />
                    <span>启动天眼系统</span>
                </button>
                
                <button 
                onClick={() => fileInputRef.current?.click()}
                className="
                    px-6 py-4 rounded-full bg-slate-800 text-slate-300 border border-slate-600 font-bold tracking-wider 
                    hover:bg-slate-700 hover:text-amber-400 hover:border-amber-500/50 transition-all flex items-center gap-2
                "
                >
                    <Upload className="w-5 h-5" />
                    上传
                </button>
            </div>
        )}
      </div>

    </div>
  );
};