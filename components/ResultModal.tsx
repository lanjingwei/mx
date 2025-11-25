import React, { useState } from 'react';
import { AnalysisReport } from '../types';
import { X, Sparkles, Fingerprint, Eye, Activity, Accessibility, Star, Hexagon, Grid3X3, Layers, Zap, Heart, Briefcase, Coins, HeartPulse, Clover, AlertCircle } from 'lucide-react';

interface ResultModalProps {
  report: AnalysisReport | null;
  onClose: () => void;
  isOpen: boolean;
}

type FaceTabType = 'sanTing' | 'wuGuan' | 'twelvePalaces' | 'dynamic' | 'summary';
type HandTabType = 'palmType' | 'mainLines' | 'secondaryLines' | 'mounts' | 'summary';

export const ResultModal: React.FC<ResultModalProps> = ({ report, onClose, isOpen }) => {
  const [faceTab, setFaceTab] = useState<FaceTabType>('sanTing');
  const [handTab, setHandTab] = useState<HandTabType>('palmType');
  
  if (!isOpen || !report) return null;

  const getModeLabel = () => {
    switch(report.mode) {
      case 'face': return '五行骨相';
      case 'hand': return '五行掌型';
      case 'body': return '形体仪态';
      default: return '命理分析';
    }
  }

  const hasFaceAnalysis = report.mode === 'face' && report.sanTing;
  const hasHandAnalysis = report.mode === 'hand' && report.palmType;

  const faceTabs: { key: FaceTabType; label: string; icon: any }[] = [
    { key: 'sanTing', label: '三停', icon: Layers },
    { key: 'wuGuan', label: '五官', icon: Eye },
    { key: 'twelvePalaces', label: '十二宫', icon: Grid3X3 },
    { key: 'dynamic', label: '气色', icon: Zap },
    { key: 'summary', label: '综合', icon: Star },
  ];

  const handTabs: { key: HandTabType; label: string; icon: any }[] = [
    { key: 'palmType', label: '掌型', icon: Fingerprint },
    { key: 'mainLines', label: '主纹', icon: Activity },
    { key: 'secondaryLines', label: '辅纹', icon: Hexagon },
    { key: 'mounts', label: '八丘', icon: Grid3X3 },
    { key: 'summary', label: '综合', icon: Star },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-amber-500/30 rounded-3xl shadow-[0_0_100px_rgba(251,191,36,0.1)] overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

        {/* Header */}
        <div className="flex justify-between items-start p-6 bg-slate-900/50 z-10 shrink-0">
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">{getModeLabel()}</span>
            <h2 className="text-3xl font-serif text-white tracking-widest mt-2">{report.title}</h2>
            <p className="text-slate-400 text-sm mt-1"><span className="text-amber-500">◆</span> {report.archetype}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
            <X className="w-6 h-6 text-slate-500 hover:text-amber-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 pb-6 space-y-6">
          {/* Score & Poem */}
          <div className="flex gap-6 items-center py-4">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="5" fill="transparent" />
                <circle cx="56" cy="56" r="48" stroke="#fbbf24" strokeWidth="5" fill="transparent" strokeLinecap="round"
                  strokeDasharray={301} strokeDashoffset={301 - (301 * report.score) / 100} />
              </svg>
              <div className="flex flex-col items-center z-10">
                <span className="text-3xl font-serif text-white font-bold">{report.score}</span>
                <span className="text-[10px] text-amber-500 uppercase">Fortune</span>
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 flex-grow">
              <Sparkles className="w-4 h-4 text-amber-500 mb-2" />
              <p className="text-sm text-slate-200 font-serif leading-7 whitespace-pre-line italic">{report.poem}</p>
            </div>
          </div>

          {/* Face Analysis Tabs */}
          {hasFaceAnalysis && (
            <>
              <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl">
                {faceTabs.map(tab => (
                  <button key={tab.key} onClick={() => setFaceTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${faceTab === tab.key ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <tab.icon className="w-3.5 h-3.5" /><span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {faceTab === 'sanTing' && report.sanTing && (
                  <>
                    <Card title="三停总论" content={report.sanTing.overview} />
                    <Card title="上停 · 早年运（15-30岁）" content={report.sanTing.upper} />
                    <Card title="中停 · 中年运（31-50岁）" content={report.sanTing.middle} />
                    <Card title="下停 · 晚年运（51岁后）" content={report.sanTing.lower} />
                  </>
                )}
                {faceTab === 'wuGuan' && report.wuGuan && (
                  <>
                    <Card title="眼相 · 监察官 ⭐" content={report.wuGuan.eye} highlight />
                    <Card title="眉相 · 保寿官" content={report.wuGuan.brow} />
                    <Card title="鼻相 · 审辨官" content={report.wuGuan.nose} />
                    <Card title="嘴相 · 出纳官" content={report.wuGuan.mouth} />
                    <Card title="耳相 · 采听官" content={report.wuGuan.ear} inferred={report.wuGuan.earIsInferred} />
                  </>
                )}
                {faceTab === 'twelvePalaces' && report.twelvePalaces && (
                  <div className="grid grid-cols-2 gap-2">
                    <Palace title="命宫" sub="印堂" content={report.twelvePalaces.mingGong} />
                    <Palace title="财帛宫" sub="鼻" content={report.twelvePalaces.caiBo} />
                    <Palace title="官禄宫" sub="额中" content={report.twelvePalaces.guanLu} />
                    <Palace title="夫妻宫" sub="奸门" content={report.twelvePalaces.fuQi} />
                    <Palace title="疾厄宫" sub="山根" content={report.twelvePalaces.jiE} />
                    <Palace title="迁移宫" sub="额角" content={report.twelvePalaces.qianYi} />
                    <Palace title="兄弟宫" sub="眉" content={report.twelvePalaces.xiongDi} />
                    <Palace title="田宅宫" sub="眉眼间" content={report.twelvePalaces.tianZhai} />
                    <Palace title="男女宫" sub="泪堂" content={report.twelvePalaces.nanNv} />
                    <Palace title="奴仆宫" sub="下巴旁" content={report.twelvePalaces.nuPu} />
                    <Palace title="福德宫" sub="眉尾上" content={report.twelvePalaces.fuDe} />
                    <Palace title="父母宫" sub="日月角" content={report.twelvePalaces.fuMu} />
                  </div>
                )}
                {faceTab === 'dynamic' && report.dynamic && (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>以下分析基于AI推断，仅供参考</span>
                    </div>
                    <Card title="骨相承载" content={report.dynamic.boneStructure} inferred />
                    <Card title="气色吉凶" content={report.dynamic.complexion} inferred />
                    <Card title="神韵评估" content={report.dynamic.spiritEssence} highlight />
                  </>
                )}
                {faceTab === 'summary' && report.summary && (
                  <>
                    <Card title="性格画像" content={report.summary.personality} />
                    <Card title="事业方向" content={report.summary.career} highlight />
                    <Card title="财运指引" content={report.summary.wealth} />
                    <Card title="感情婚姻" content={report.summary.love} />
                    <Card title="健康提醒" content={report.summary.health} />
                    <Card title="开运锦囊" content={report.summary.lucky} highlight />
                  </>
                )}
              </div>
            </>
          )}

          {/* Hand Analysis Tabs */}
          {hasHandAnalysis && (
            <>
              <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl">
                {handTabs.map(tab => (
                  <button key={tab.key} onClick={() => setHandTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${handTab === tab.key ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'}`}>
                    <tab.icon className="w-3.5 h-3.5" /><span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {handTab === 'palmType' && report.palmType && (
                  <>
                    <Card title={`五行手型 · ${report.palmType.element}形手`} content={report.palmType.description} highlight />
                    <Card title="性格底色" content={report.palmType.personality} />
                    <Card title="适合职业" content={report.palmType.career} />
                  </>
                )}
                {handTab === 'mainLines' && report.mainLines && (
                  <>
                    <Card title="生命线 · 地纹" content={report.mainLines.lifeLine} />
                    <Card title="智慧线 · 人纹" content={report.mainLines.wisdomLine} highlight />
                    <Card title="感情线 · 天纹" content={report.mainLines.emotionLine} />
                  </>
                )}
                {handTab === 'secondaryLines' && report.secondaryLines && (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>辅纹基于AI推断，仅供参考</span>
                    </div>
                    <Card title="事业线 · 命运线" content={report.secondaryLines.careerLine} inferred />
                    <Card title="成功线 · 太阳线" content={report.secondaryLines.successLine} inferred />
                    <Card title="婚姻线" content={report.secondaryLines.marriageLine} inferred />
                    <Card title="财运线" content={report.secondaryLines.wealthLine} inferred />
                  </>
                )}
                {handTab === 'mounts' && report.mounts && (
                  <div className="grid grid-cols-2 gap-2">
                    <Palace title="木星丘" sub="食指下" content={report.mounts.jupiter} />
                    <Palace title="土星丘" sub="中指下" content={report.mounts.saturn} />
                    <Palace title="太阳丘" sub="无名指下" content={report.mounts.apollo} />
                    <Palace title="水星丘" sub="小指下" content={report.mounts.mercury} />
                    <Palace title="金星丘" sub="拇指根" content={report.mounts.venus} />
                    <Palace title="月丘" sub="手掌外侧" content={report.mounts.moon} />
                  </div>
                )}
                {handTab === 'summary' && report.summary && (
                  <>
                    <Card title="性格画像" content={report.summary.personality} />
                    <Card title="事业方向" content={report.summary.career} highlight />
                    <Card title="财运指引" content={report.summary.wealth} />
                    <Card title="感情婚姻" content={report.summary.love} />
                    <Card title="健康提醒" content={report.summary.health} />
                    <Card title="开运锦囊" content={report.summary.lucky} highlight />
                  </>
                )}
              </div>
            </>
          )}

          {/* Legacy Analysis */}
          {!hasFaceAnalysis && !hasHandAnalysis && (
            <div className="space-y-4">
              {report.mode === 'face' && (
                <>
                  <Card title="三停流年" content={report.details.zoneAnalysis} />
                  <Card title="眼相分析" content={report.details.eyeAnalysis} />
                  <Card title="鼻相分析" content={report.details.noseAnalysis} />
                  <Card title="嘴相分析" content={report.details.mouthAnalysis} />
                </>
              )}
              {report.mode === 'hand' && (
                <>
                  <Card title="掌型天赋" content={report.details.handShapeAnalysis} />
                  <Card title="手指特征" content={report.details.fingerAnalysis} />
                  <Card title="事业建议" content={report.details.careerAdvice} highlight />
                </>
              )}
              {report.mode === 'body' && (
                <>
                  <Card title="仪态骨相" content={report.details.postureAnalysis} />
                  <Card title="气场能量" content={report.details.energyAnalysis} />
                  <Card title="养生建议" content={report.details.healthAdvice} highlight />
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-900 border-t border-white/5 shrink-0">
          <button onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold py-4 rounded-xl flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5" />
            <span>开启新一轮解析</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, content, highlight, inferred }: any) => (
  <div className={`p-4 rounded-xl border ${highlight ? 'bg-amber-900/10 border-amber-500/30' : 'bg-slate-800/40 border-white/5'}`}>
    <h4 className={`font-bold mb-2 text-sm flex items-center gap-2 ${highlight ? 'text-amber-400' : 'text-slate-200'}`}>
      {title}
      {inferred && <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">AI推断</span>}
    </h4>
    <p className="text-slate-400 text-sm leading-relaxed">{content}</p>
  </div>
);

const Palace = ({ title, sub, content }: any) => (
  <div className="p-3 bg-slate-800/40 border border-white/5 rounded-lg">
    <div className="flex items-center gap-1 mb-1">
      <span className="text-amber-500">◇</span>
      <span className="text-slate-200 text-sm font-medium">{title}</span>
      <span className="text-slate-500 text-xs">({sub})</span>
    </div>
    <p className="text-slate-400 text-xs leading-relaxed">{content}</p>
  </div>
);
