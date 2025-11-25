import { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { FaceMetrics, HandMetrics, BodyMetrics, PoseStatus } from "../types";

// Euclidean distance
const getDistance = (p1: NormalizedLandmark, p2: NormalizedLandmark): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

// --- FACE LOGIC ---

export const checkHeadPose = (landmarks: NormalizedLandmark[]): PoseStatus => {
  if (!landmarks || landmarks.length < 478) return { isCentered: false, message: "未检测到面部" };

  // Yaw (Left/Right Rotation)
  // Compare nose tip (1) position relative to cheekbones (234, 454)
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const nose = landmarks[1];
  
  const faceWidth = rightCheek.x - leftCheek.x;
  const noseRelX = (nose.x - leftCheek.x) / faceWidth; // Should be approx 0.5

  // Relaxed thresholds (was 0.40 - 0.60)
  if (noseRelX < 0.35) return { isCentered: false, message: "请向左转头" };
  if (noseRelX > 0.65) return { isCentered: false, message: "请向右转头" };

  // Pitch (Up/Down Tilt)
  const eyeLineY = (landmarks[33].y + landmarks[263].y) / 2;
  const noseY = landmarks[1].y;
  const chinY = landmarks[152].y;
  
  const upperFaceH = noseY - eyeLineY;
  const lowerFaceH = chinY - noseY;
  const ratio = upperFaceH / lowerFaceH; // 0.6 - 0.8 is normal usually

  // Relaxed thresholds (was 0.45 - 0.85)
  if (ratio < 0.35) return { isCentered: false, message: "请勿抬头" };
  if (ratio > 0.95) return { isCentered: false, message: "请勿低头" };

  return { isCentered: true, message: "位置极佳" };
};

export const calculateFaceMetrics = (landmarks: NormalizedLandmark[]): FaceMetrics => {
  if (!landmarks || landmarks.length < 478) {
    throw new Error("Insufficient landmarks detected");
  }

  // 1. Zones
  const upperDist = getDistance(landmarks[10], landmarks[9]);
  const middleDist = getDistance(landmarks[9], landmarks[1]);
  const lowerDist = getDistance(landmarks[1], landmarks[152]);

  let dominant: FaceMetrics['zones']['dominant'] = 'balanced';
  const maxZone = Math.max(upperDist, middleDist, lowerDist);
  const tolerance = 0.01;

  if (maxZone === upperDist && upperDist > middleDist + tolerance && upperDist > lowerDist + tolerance) dominant = 'upper';
  else if (maxZone === middleDist && middleDist > upperDist + tolerance && middleDist > lowerDist + tolerance) dominant = 'middle';
  else if (maxZone === lowerDist && lowerDist > upperDist + tolerance && lowerDist > middleDist + tolerance) dominant = 'lower';

  // 2. Ratios
  const noseWidth = getDistance(landmarks[49], landmarks[279]);
  const faceWidth = getDistance(landmarks[234], landmarks[454]);
  const noseWidthRatio = faceWidth > 0 ? noseWidth / faceWidth : 0;

  const leftBrowThick = getDistance(landmarks[107], landmarks[66]);
  const rightBrowThick = getDistance(landmarks[336], landmarks[296]);
  const browThickness = (leftBrowThick + rightBrowThick) / 2;

  // Eye Roundness (Left Eye)
  // Width: 33 to 133, Height: 159 to 145
  const eyeWidth = getDistance(landmarks[33], landmarks[133]);
  const eyeHeight = getDistance(landmarks[159], landmarks[145]);
  const eyeRoundness = eyeWidth > 0 ? eyeHeight / eyeWidth : 0;

  // Lip Fullness
  // Top Lip Height + Bottom Lip Height
  const topLip = getDistance(landmarks[0], landmarks[13]);
  const bottomLip = getDistance(landmarks[14], landmarks[17]);
  const mouthWidth = getDistance(landmarks[61], landmarks[291]);
  const lipFullness = mouthWidth > 0 ? (topLip + bottomLip) / mouthWidth : 0;

  // Jaw Width (approximate via 58 and 288 vs face width? No, use 172 and 397 for jawline width)
  const jawWidthRaw = getDistance(landmarks[172], landmarks[397]);
  const jawWidth = jawWidthRaw / faceWidth;

  return {
    zones: { upper: upperDist, middle: middleDist, lower: lowerDist, dominant },
    ratios: { noseWidthRatio, browThickness, eyeRoundness, lipFullness, jawWidth }
  };
};

// --- HAND LOGIC ---

export const calculateHandMetrics = (landmarks: NormalizedLandmark[]): HandMetrics => {
  // Wrist: 0
  // Index MCP: 5, Pinky MCP: 17 (Palm Width)
  // Middle Finger MCP: 9, Tip: 12 (Finger Length)
  // Wrist to Middle MCP (Palm Height)

  const palmWidth = getDistance(landmarks[5], landmarks[17]);
  const palmHeight = getDistance(landmarks[0], landmarks[9]);
  const middleFingerLength = getDistance(landmarks[9], landmarks[12]);

  const palmRatio = palmWidth / palmHeight; // Square (~1.0) vs Rectangular (<0.85)
  const fingerLengthRatio = middleFingerLength / palmHeight; // Short (<0.7) vs Long (>0.85)

  let element: HandMetrics['element'] = 'earth';
  const isSquarePalm = palmRatio > 0.88;
  const isLongFinger = fingerLengthRatio > 0.80;

  if (isSquarePalm && !isLongFinger) element = 'earth';
  else if (!isSquarePalm && !isLongFinger) element = 'fire';
  else if (isSquarePalm && isLongFinger) element = 'air';
  else element = 'water';

  return { palmRatio, fingerLengthRatio, element };
};

// --- BODY/POSE LOGIC ---

export const POSE_CONNECTIONS = [
  [11, 12], // Shoulders
  [11, 23], [12, 24], // Torso sides
  [23, 24], // Hips
  [11, 13], [13, 15], // Left Arm
  [12, 14], [14, 16], // Right Arm
  // We won't draw legs often as webcam often cuts them off, but defined just in case
  [23, 25], [25, 27], // Left Leg
  [24, 26], [26, 28] // Right Leg
];

export const calculateBodyMetrics = (landmarks: NormalizedLandmark[]): BodyMetrics => {
  // 11: Left Shoulder, 12: Right Shoulder
  // 23: Left Hip, 24: Right Hip
  // 0: Nose (for head tilt approx if eyes not visible enough in pose)
  // 7: Left Ear, 8: Right Ear

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const nose = landmarks[0];

  // 1. Shoulder Balance (Y difference)
  // Positive means Left is lower (screen coordinates y increases downwards) -> actually Left Shoulder is visually lower on screen?
  // Landmarks are normalized.
  const shoulderBalance = rightShoulder.y - leftShoulder.y; 

  // 2. Torso Alignment (Spine)
  // Midpoint of shoulders vs Midpoint of hips
  const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const midHipX = (leftHip.x + rightHip.x) / 2;
  const torsoAlignment = midShoulderX - midHipX;

  // 3. Head Tilt (Ear level)
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const headTilt = rightEar.y - leftEar.y;

  let postureType: BodyMetrics['postureType'] = 'upright';
  
  if (Math.abs(shoulderBalance) > 0.05) {
     postureType = shoulderBalance > 0 ? 'leaning_right' : 'leaning_left';
  } else if (Math.abs(torsoAlignment) > 0.05) {
     postureType = 'slouch'; // A simplified check, really checking lateral shift
  }

  // Check visibility logic? If hips are not visible (visibility < 0.5), we might default to upright
  if (leftHip.visibility && leftHip.visibility < 0.5) {
      // Fallback for partial body view (upper body only)
      // Just check shoulders
      if (Math.abs(shoulderBalance) > 0.04) {
         postureType = shoulderBalance > 0 ? 'leaning_right' : 'leaning_left';
      }
  }

  return {
      shoulderBalance,
      headTilt,
      torsoAlignment,
      postureType
  };
};