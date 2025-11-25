import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, HandLandmarker, PoseLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { VisionMode } from '../types';

export const useVision = (mode: VisionMode) => {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  
  // IMAGE mode instances for static image processing
  const [faceLandmarkerImage, setFaceLandmarkerImage] = useState<FaceLandmarker | null>(null);
  const [handLandmarkerImage, setHandLandmarkerImage] = useState<HandLandmarker | null>(null);
  const [poseLandmarkerImage, setPoseLandmarkerImage] = useState<PoseLandmarker | null>(null);
  
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const requestRef = useRef<number>();
  const modeRef = useRef<VisionMode>(mode);
  const isCameraActiveRef = useRef<boolean>(false);

  // Sync ref
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // Initialize Models
  useEffect(() => {
    let active = true;
    const initVision = async () => {
      try {
        // Use standard stable version compatible with the importmap
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        if (!active) return;

        // Load models in parallel for faster startup - VIDEO mode for camera
        const [fMarker, hMarker, pMarker] = await Promise.all([
            FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 1
            }).catch(e => { console.error("Face Model Failed", e); return null; }),

            HandLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            }).catch(e => { console.error("Hand Model Failed", e); return null; }),

            PoseLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 1
            }).catch(e => { console.error("Pose Model Failed", e); return null; })
        ]);
        
        // Load IMAGE mode models for uploaded static images
        const [fMarkerImg, hMarkerImg, pMarkerImg] = await Promise.all([
            FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "IMAGE",
                numFaces: 1
            }).catch(e => { console.error("Face Image Model Failed", e); return null; }),

            HandLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU"
                },
                runningMode: "IMAGE",
                numHands: 1
            }).catch(e => { console.error("Hand Image Model Failed", e); return null; }),

            PoseLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
                    delegate: "GPU"
                },
                runningMode: "IMAGE",
                numPoses: 1
            }).catch(e => { console.error("Pose Image Model Failed", e); return null; })
        ]);

        if (active) {
            if (fMarker) setFaceLandmarker(fMarker);
            if (hMarker) setHandLandmarker(hMarker);
            if (pMarker) setPoseLandmarker(pMarker);
            if (fMarkerImg) setFaceLandmarkerImage(fMarkerImg);
            if (hMarkerImg) setHandLandmarkerImage(hMarkerImg);
            if (pMarkerImg) setPoseLandmarkerImage(pMarkerImg);
            console.log("Vision Models Initialized (VIDEO + IMAGE modes)");
        }
      } catch (error) {
        console.error("Failed to initialize Vision Models Critical Error", error);
      }
    };
    initVision();

    return () => { active = false; };
  }, []);

  // Reset landmarks when mode changes or image uploaded
  useEffect(() => {
    setLandmarks(null);
    if (uploadedImage) {
        // Trigger detection on image change
        setTimeout(processImage, 100);
    }
  }, [mode, uploadedImage]);

  const startCamera = async () => {
    setUploadedImage(null); // Clear image if starting camera
    if (!videoRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            facingMode: facingMode 
        }
      });
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
      isCameraActiveRef.current = true;
      videoRef.current.addEventListener('loadeddata', () => {
        predictWebcam();
      });
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("无法访问摄像头，请检查权限。");
    }
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);

    if (isCameraActive) {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 }, 
                    facingMode: newMode 
                }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // re-attach listener if needed, but usually loadeddata fires again on new srcObject
            }
        } catch (err) {
            console.error("Failed to switch camera", err);
            setFacingMode(facingMode); 
        }
    }
  };

  // Generic Detect Function
  const detect = (element: HTMLVideoElement | HTMLImageElement, timestamp: number, isVideo: boolean = true) => {
    try {
        if (modeRef.current === 'face') {
            const detector = isVideo ? faceLandmarker : faceLandmarkerImage;
            if (!detector) return;
            const result = isVideo 
                ? detector.detectForVideo(element as HTMLVideoElement, timestamp)
                : detector.detect(element as HTMLImageElement);
            if (result.faceLandmarks && result.faceLandmarks.length > 0) {
                setLandmarks(result.faceLandmarks[0]);
            } else {
                setLandmarks(null);
            }
        } else if (modeRef.current === 'hand') {
            const detector = isVideo ? handLandmarker : handLandmarkerImage;
            if (!detector) return;
            const result = isVideo
                ? detector.detectForVideo(element as HTMLVideoElement, timestamp)
                : detector.detect(element as HTMLImageElement);
            if (result.landmarks && result.landmarks.length > 0) {
                setLandmarks(result.landmarks[0]);
            } else {
                setLandmarks(null);
            }
        } else if (modeRef.current === 'body') {
            const detector = isVideo ? poseLandmarker : poseLandmarkerImage;
            if (!detector) return;
            const result = isVideo
                ? detector.detectForVideo(element as HTMLVideoElement, timestamp)
                : detector.detect(element as HTMLImageElement);
            if (result.landmarks && result.landmarks.length > 0) {
                setLandmarks(result.landmarks[0]);
            } else {
                setLandmarks(null);
            }
        }
    } catch (e) {
        // Suppress individual frame errors to avoid console spam
        console.error('Detection error:', e);
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !isCameraActiveRef.current) return;
    
    // Check if video is ready
    if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
        const startTimeMs = performance.now();
        detect(videoRef.current, startTimeMs);
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const processImage = () => {
      if (!imageRef.current || !uploadedImage) return;
      if (imageRef.current.complete && imageRef.current.naturalWidth > 0) {
          const startTimeMs = performance.now();
          detect(imageRef.current, startTimeMs, false); // false = static image
      }
  };

  const stopCamera = () => {
      isCameraActiveRef.current = false;
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
      }
      if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
      }
      setIsCameraActive(false);
  }

  const handleFileUpload = (file: File) => {
      stopCamera();
      const reader = new FileReader();
      reader.onload = (e) => {
          if (e.target?.result) {
              setUploadedImage(e.target.result as string);
              // Detection triggers via useEffect on uploadedImage + onLoad of img element
          }
      };
      reader.readAsDataURL(file);
  };

  return { 
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
  };
};