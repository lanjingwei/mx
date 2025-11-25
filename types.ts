// Modes
export type VisionMode = 'face' | 'hand' | 'body';

export interface PoseStatus {
  isCentered: boolean;
  message: string; // e.g., "请向左转", "请抬头"
}

// Facial Metrics derived from landmarks
export interface FaceMetrics {
  zones: {
    upper: number;
    middle: number;
    lower: number;
    dominant: 'upper' | 'middle' | 'lower' | 'balanced';
  };
  ratios: {
    noseWidthRatio: number;
    browThickness: number;
    eyeRoundness: number; // Height/Width of eye
    lipFullness: number; // Lip area/width
    jawWidth: number; 
  };
  // 🆕 十二宫相关测量
  twelvePalaces?: {
    yintangWidth: number;        // 印堂宽度（命宫）
    foreheadFullness: number;    // 官禄宫饱满度
    foreheadCornerWidth: number; // 迁移宫宽度
    eyeTailWidth: number;        // 奸门宽度（夫妻宫）
    tearTroughFullness: number;  // 泪堂饱满度（男女宫）
    shanGenHeight: number;       // 山根高度（疾厄宫）
    cheekboneSupport: number;    // 颧骨护鼻程度
  };
}

// 🆕 耳朵指标（用户上传耳朵照片时使用）
export interface EarMetrics {
  hasEarImage: boolean;
  position?: 'high' | 'medium' | 'low';    // 耳朵位置高低
  lobeFullness?: 'thick' | 'medium' | 'thin'; // 耳垂厚度
  size?: 'large' | 'medium' | 'small';     // 耳朵大小
}

// Hand Metrics
export interface HandMetrics {
  palmRatio: number; // Width / Height
  fingerLengthRatio: number; // Middle finger / Palm Height
  element: 'earth' | 'fire' | 'air' | 'water'; // Hand Archetype
}

// Body/Pose Metrics
export interface BodyMetrics {
  shoulderBalance: number; // Difference in Y between shoulders (0 is balanced)
  headTilt: number; // Angle of eye line
  torsoAlignment: number; // Shoulder mid-point x vs Hip mid-point x
  postureType: 'upright' | 'slouch' | 'leaning_left' | 'leaning_right';
}

// Unified Metrics
export interface VisionMetrics {
  mode: VisionMode;
  face?: FaceMetrics;
  hand?: HandMetrics;
  body?: BodyMetrics;
  ear?: EarMetrics;  // 🆕 耳朵数据（可选，用户上传耳朵照片时填充）
}

// 🆕 十二宫分析结果
export interface TwelvePalacesAnalysis {
  mingGong: string;    // 命宫（印堂）- 总运势
  caiBo: string;       // 财帛宫 - 财运
  xiongDi: string;     // 兄弟宫 - 人脉
  tianZhai: string;    // 田宅宫 - 房产
  nanNv: string;       // 男女宫 - 子女
  nuPu: string;        // 奴仆宫 - 下属
  fuQi: string;        // 夫妻宫 - 婚姻
  qianYi: string;      // 迁移宫 - 变动
  jiE: string;         // 疾厄宫 - 健康
  guanLu: string;      // 官禄宫 - 事业
  fuDe: string;        // 福德宫 - 福气
  fuMu: string;        // 父母宫 - 长辈
}

// 🆕 三停分析结果
export interface SanTingAnalysis {
  overview: string;    // 三停整体格局
  upper: string;       // 上停（15-30岁）
  middle: string;      // 中停（31-50岁）
  lower: string;       // 下停（51岁后）
}

// 🆕 五官分析结果
export interface WuGuanAnalysis {
  brow: string;        // 眉毛（保寿官）
  eye: string;         // 眼睛（监察官）⭐最重要
  nose: string;        // 鼻子（审辨官）
  mouth: string;       // 嘴巴（出纳官）
  ear: string;         // 耳朵（采听官）
  earIsInferred: boolean; // 耳朵是否为AI推断
}

// 🆕 动态气色分析
export interface DynamicAnalysis {
  boneStructure: string;   // 骨相分析
  complexion: string;      // 气色分析
  spiritEssence: string;   // 神韵评估
  isInferred: boolean;     // 标记为AI推断
}

// 🆕 综合建议
export interface SummaryAdvice {
  personality: string;     // 性格画像
  career: string;          // 事业方向
  wealth: string;          // 财运指引
  love: string;            // 感情婚姻
  health: string;          // 健康提醒
  lucky: string;           // 开运锦囊
}

// 🆕 手相 - 掌型分析
export interface PalmTypeAnalysis {
  element: string;         // 五行手类型（金/木/水/火/土）
  description: string;     // 掌型特征描述
  personality: string;     // 性格倾向
  career: string;          // 适合职业
}

// 🆕 手相 - 三大主纹
export interface MainLinesAnalysis {
  lifeLine: string;        // 生命线（地纹）
  wisdomLine: string;      // 智慧线（人纹）
  emotionLine: string;     // 感情线（天纹）
}

// 🆕 手相 - 辅纹
export interface SecondaryLinesAnalysis {
  careerLine: string;      // 事业线（命运线）
  successLine: string;     // 成功线（太阳线）
  marriageLine: string;    // 婚姻线
  wealthLine: string;      // 财运线
}

// 🆕 手相 - 八大丘
export interface MountsAnalysis {
  jupiter: string;         // 木星丘（食指下）- 野心、领导
  saturn: string;          // 土星丘（中指下）- 思考、责任
  apollo: string;          // 太阳丘（无名指下）- 才华、名气
  mercury: string;         // 水星丘（小指下）- 口才、商业
  venus: string;           // 金星丘（拇指根）- 情欲、家族
  moon: string;            // 月丘（手掌外侧）- 想象力、旅行
}

// 🆕 手相 - 左右手对比
export interface HandComparisonAnalysis {
  innate: string;          // 先天（非惯用手）
  acquired: string;        // 后天（惯用手）
  comparison: string;      // 综合对比分析
}

// The Generated Report
export interface AnalysisReport {
  mode: VisionMode;
  title: string;
  score: number;
  archetype: string;
  poem: string;
  
  // 🆕 完整版面相分析（新结构）
  sanTing?: SanTingAnalysis;           // 三停分析
  wuGuan?: WuGuanAnalysis;             // 五官分析
  twelvePalaces?: TwelvePalacesAnalysis; // 十二宫分析
  dynamic?: DynamicAnalysis;           // 动态气色
  summary?: SummaryAdvice;             // 综合建议
  
  // 🆕 完整版手相分析
  palmType?: PalmTypeAnalysis;         // 掌型与手形
  mainLines?: MainLinesAnalysis;       // 三大主纹
  secondaryLines?: SecondaryLinesAnalysis; // 辅纹
  mounts?: MountsAnalysis;             // 八大丘
  handComparison?: HandComparisonAnalysis; // 左右手对比
  
  // 兼容旧版details字段（手相/体态仍使用）
  details: {
    // Face (旧版兼容)
    zoneAnalysis?: string;
    noseAnalysis?: string;
    browAnalysis?: string;
    eyeAnalysis?: string;
    mouthAnalysis?: string;
    cheekboneAnalysis?: string;
    jawAnalysis?: string;
    symmetryAnalysis?: string;
    personalityAnalysis?: string;
    fortuneAnalysis?: string;
    careerSuggestion?: string;
    
    // Hand
    handShapeAnalysis?: string;
    fingerAnalysis?: string;
    careerAdvice?: string;
    // Body
    postureAnalysis?: string;
    energyAnalysis?: string;
    healthAdvice?: string;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}