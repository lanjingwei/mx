import { VisionMetrics, AnalysisReport, FaceMetrics, HandMetrics, BodyMetrics } from "../types";
import { analyzeWithGemini } from "./geminiService";

// ============================================
// 面相分析 - 重构版本
// ============================================

// 辅助函数：分类特征值
const classifyValue = (value: number, thresholds: number[]): number => {
  for (let i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i]) return i;
  }
  return thresholds.length;
};

// 辅助函数：计算加权分数
const calculateWeightedScore = (features: Array<{ value: number; weight: number; positive: boolean }>): number => {
  let score = 70; // 基础分
  features.forEach(({ value, weight, positive }) => {
    score += (positive ? value : (1 - value)) * weight;
  });
  return Math.max(50, Math.min(99, Math.floor(score)));
};

const getFaceAnalysis = (metrics: FaceMetrics): AnalysisReport => {
  const { zones, ratios } = metrics;
  
  // Calculate Ratios locally as they are not in the type
  const totalZone = zones.upper + zones.middle + zones.lower;
  const upperRatio = totalZone > 0 ? zones.upper / totalZone : 0.33;
  const middleRatio = totalZone > 0 ? zones.middle / totalZone : 0.33;
  const lowerRatio = totalZone > 0 ? zones.lower / totalZone : 0.33;

  // Mock missing ratios with safe defaults if they don't exist
  // Casting to any to access potentially missing properties safely
  const r = ratios as any;
  const avgEyeSize = r.avgEyeSize || 0.15;
  const eyeDistance = r.eyeDistance || 0.22;
  const noseHeightRatio = r.noseHeightRatio || 0.24;
  const lipRatio = r.lipRatio || 1.2;
  const mouthCurve = r.mouthCurve || 0.0;
  const browGap = r.browGap || 0.12;
  const cheekboneWidth = r.cheekboneWidth || 0.9;
  const cheekboneHeight = r.cheekboneHeight || 0.1;
  const chinSharpness = r.chinSharpness || 0.5;
  const faceSymmetry = r.faceSymmetry || 0.9;
  
  // ============================================
  // 1. 三停分析（主导特征）
  // ============================================
  let zoneAnalysis = "";
  let baseTitle = "";
  let baseArchetype = "";
  let baseScore = 70;
  
  switch (zones.dominant) {
    case 'upper':
      baseTitle = "天机星主";
      baseArchetype = "智慧型 · 木";
      baseScore = 75;
      if (upperRatio > 0.36) {
        zoneAnalysis = "上停特别饱满（天庭极高），属于高智商型人才。早年运势极佳，天赋异禀，思维敏捷超群，擅长抽象思维与战略规划。您天生具有洞察力，适合从事需要深度思考的领域：科研、哲学、AI、金融分析等。建议：充分发挥智力优势，但要注意平衡理性与感性。";
      } else {
        zoneAnalysis = "上停饱满，天庭开阔。早年运势顺遂，聪慧好学，逻辑思维能力强。您是天生的策略家，善于规划与分析，适合从事管理、设计、教育或技术类工作。建议：保持学习热情，将智慧转化为实际成果。";
      }
      break;
      
    case 'middle':
      baseTitle = "武曲星耀";
      baseArchetype = "行动型 · 火";
      baseScore = 80;
      if (middleRatio > 0.36) {
        zoneAnalysis = "中停极为隆起，鼻颧有势。中年运势如日中天，执行力超凡，意志如钢。您是天生的领导者与实干家，不惧艰险，勇于开拓。在商界、政界或高压环境中能大展宏图。建议：控制强势性格，学会倾听与包容。";
      } else {
        zoneAnalysis = "中停发达，鼻颧得势。中年运势强劲，行动力强，责任感重。您务实可靠，能承担重任，适合管理、创业、销售等需要执行力的领域。建议：在行动前多思考，避免冲动决策。";
      }
      break;
      
    case 'lower':
      baseTitle = "天府守财";
      baseArchetype = "稳重型 · 土";
      baseScore = 78;
      if (lowerRatio > 0.36) {
        zoneAnalysis = "下停极为宽厚，地阁方圆饱满。晚年运势极佳，福泽深厚。您性格沉稳如山，重信守诺，极具耐心。擅长积累与守成，是天生的资源整合者。适合金融、地产、传统行业或家族企业。建议：前期需要更多主动性，中晚年厚积薄发。";
      } else {
        zoneAnalysis = "下停宽厚，地阁有势。晚年运势安稳，性格务实可靠。您重视家庭与稳定，善于长期规划，能持续积累财富。适合稳定型行业或自主创业。建议：年轻时可大胆尝试，不要过于保守。";
      }
      break;
      
    default: // balanced
      baseTitle = "太阴调和";
      baseArchetype = "平衡型 · 水";
      baseScore = 82;
      zoneAnalysis = "三停匀称，比例和谐。一生运势平稳渐进，少有大起大落。您性格圆融，善于协调各方，既有智慧又懂人情，能在复杂环境中游刃有余。适合外交、人力资源、公关或需要综合能力的岗位。建议：发挥平衡优势，但要避免过于中庸而失去锋芒。";
      break;
  }
  
  // ============================================
  // 2. 眼相分析（洞察力与性格）
  // ============================================
  let eyeAnalysis = "";
  let eyeScore = 0;
  
  // 眼睛圆度分类：0.35以下=细长眼，0.35-0.50=标准，0.50以上=圆大眼
  if (ratios.eyeRoundness > 0.52) {
    eyeAnalysis = "眼大而圆，黑白分明。";
    eyeScore = 8;
    if (avgEyeSize > 0.18) {
      eyeAnalysis += "眼睛特别大，目光纯净如泉。您情感丰富，性格天真直率，艺术感知力极强，富有同情心。但容易感情用事，需要理性辅助。适合艺术、表演、设计、儿童教育等需要情感投入的领域。";
    } else {
      eyeAnalysis += "您性格开朗外向，情感表达直接，善于与人沟通。具有较强的感性思维和创造力，适合需要人际互动的工作。";
    }
  } else if (ratios.eyeRoundness > 0.40) {
    eyeAnalysis = "眼型标准，神采内敛。";
    eyeScore = 10;
    eyeAnalysis += "您性格稳重，理性与感性兼备。既能冷静分析，又能理解他人。这种平衡的眼相显示您处事得当，适应力强，能在各种环境中立足。";
  } else {
    eyeAnalysis = "眼细而长，目光深邃。";
    eyeScore = 12;
    if (ratios.eyeRoundness < 0.33) {
      eyeAnalysis += "典型的智者之眼。您性格深沉内敛，洞察力极强，善于观察与谋略。思考深刻，不轻易表露情绪。适合战略、侦查、心理、投资等需要深度思维的领域。但要注意不要过于封闭。";
    } else {
      eyeAnalysis += "您性格偏理智，善于思考，洞察力强。做事有条理，不易被情绪左右，适合需要冷静判断的工作。";
    }
  }
  
  // 眼距分析
  if (eyeDistance > 0.25) {
    eyeAnalysis += " 两眼距离较宽，心胸开阔，包容力强，不拘小节。";
    eyeScore += 3;
  } else if (eyeDistance < 0.20) {
    eyeAnalysis += " 两眼距离较近，注意力集中，专注力强，但有时略显固执。";
    eyeScore += 2;
  }
  
  // ============================================
  // 3. 鼻相分析（财运与自我）
  // ============================================
  let noseAnalysis = "";
  let noseScore = 0;
  
  // 鼻宽分析
  if (ratios.noseWidthRatio > 0.28) {
    noseAnalysis = "鼻翼饱满，准头丰隆。财库充盈，对物质有极强的掌控欲。";
    noseScore = 10;
    noseAnalysis += "您财运旺盛，善于聚财理财，物质运势佳。但要注意不要过于看重金钱而忽略精神层面。";
  } else if (ratios.noseWidthRatio > 0.24) {
    noseAnalysis = "鼻型适中，财运平稳。";
    noseScore = 8;
    noseAnalysis += "您对金钱有合理的态度，既不过度追求也不忽视，能保持物质与精神的平衡。";
  } else {
    noseAnalysis = "鼻梁清秀，鼻翼较窄。清贵之相。";
    noseScore = 7;
    noseAnalysis += "相比财富，您更看重名誉、尊严与精神追求。适合学术、艺术、专业技术等清高领域。晚年财运通过名声而来。";
  }
  
  // 鼻梁高度分析
  if (noseHeightRatio > 0.26) {
    noseAnalysis += " 鼻梁高挺，自尊心强，个性坚定，不轻易妥协。";
    noseScore += 5;
  } else if (noseHeightRatio < 0.22) {
    noseAnalysis += " 鼻梁较平，性格随和，容易与人相处，但需注意建立自信。";
    noseScore += 2;
  }
  
  // ============================================
  // 4. 嘴相分析（表达与人际）
  // ============================================
  let mouthAnalysis = "";
  let mouthScore = 0;
  
  if (ratios.lipFullness > 0.40) {
    mouthAnalysis = "唇厚而丰，福禄深厚。";
    mouthScore = 9;
    if (lipRatio > 1.3) {
      mouthAnalysis += "下唇特别丰满，重视物质享受与感官体验。您为人热情豪爽，口才极佳，人缘好，食禄丰厚。但需注意言多必失，控制欲望。";
    } else {
      mouthAnalysis += "您性格热情，善于表达，乐于助人。人际关系好，容易获得他人帮助。";
    }
  } else if (ratios.lipFullness > 0.30) {
    mouthAnalysis = "唇型适中，言行得体。";
    mouthScore = 8;
    mouthAnalysis += "您说话有分寸，既能表达又懂收敛。为人可靠，值得信赖。";
  } else {
    mouthAnalysis = "唇薄言谨，理智为先。";
    mouthScore = 7;
    if (ratios.lipFullness < 0.25) {
      mouthAnalysis += "典型的理性主义者。您说话精准，原则性强，做事一丝不苟，不轻易许诺。适合法律、技术、管理等需要严谨的领域。但要注意适当表达情感。";
    } else {
      mouthAnalysis += "您性格冷静克制，思考多于表达，适合需要理性判断的工作。";
    }
  }
  
  // 嘴角分析（很少使用，这里简化）
  if (mouthCurve > 0.01) {
    mouthAnalysis += " 嘴角上扬，天生乐观，笑容温暖。";
    mouthScore += 3;
  }
  
  // ============================================
  // 5. 眉相分析（气魄与胆识）
  // ============================================
  let browAnalysis = "";
  
  if (ratios.browThickness > 0.012) {
    browAnalysis = "眉浓而重，胆识过人。您性格豪爽，有魄力，敢作敢为，重情重义。但也容易冲动，需要控制脾气。适合需要勇气的领域：创业、销售、执法等。";
  } else if (ratios.browThickness > 0.008) {
    browAnalysis = "眉型适中，刚柔并济。您性格稳重，既有决断力又懂变通，能刚能柔。";
  } else {
    browAnalysis = "眉清目秀，心思细腻。您性格温和，理智冷静，善于观察与思考。适合需要细心的工作：设计、文案、数据分析等。";
  }
  
  // 眉间距
  if (browGap > 0.15) {
    browAnalysis += " 印堂宽阔，心胸开阔，能容人容事，运势通达。";
  } else if (browGap < 0.10) {
    browAnalysis += " 眉间较窄，思虑较多，容易纠结，需要学会放松。";
  }
  
  // ============================================
  // 6. 颧骨分析（权力与领导力）
  // ============================================
  let cheekboneAnalysis = "";
  
  if (cheekboneWidth > 0.95) {
    if (cheekboneHeight > 0.12) {
      cheekboneAnalysis = "颧骨高耸且宽，天生领袖相。您权力欲强，掌控力强，具有强烈的竞争意识和领导才能。适合高管、创业、政治等权力核心领域。注意：颧骨过高需配合鼻梁，否则易招小人。";
    } else {
      cheekboneAnalysis = "颧骨宽阔，社交能力强。您人脉广泛，善于协调资源，是天生的组织者。";
    }
  } else if (cheekboneWidth < 0.88) {
    cheekboneAnalysis = "颧骨内敛，不争权势。您性格温和，不喜争斗，更适合专业技术路线或幕后工作。";
  } else {
    cheekboneAnalysis = "颧骨适中，平衡发展。既有一定的领导力，又不过分强势。";
  }
  
  // ============================================
  // 7. 下颌分析（执行力与晚年运）
  // ============================================
  let jawAnalysis = "";
  
  if (ratios.jawWidth > 0.85) {
    jawAnalysis = "下颌宽厚，执行力强。您意志坚定，能吃苦耐劳，持之以恒。晚年运势稳固，能守住家业。";
  } else if (ratios.jawWidth < 0.75) {
    jawAnalysis = "下颌清秀，灵活多变。您思维敏捷，善于变通，但需注意增强毅力和持久力。";
  } else {
    jawAnalysis = "下颌适中，张弛有度。既有执行力又懂灵活，能攻能守。";
  }
  
  // 下巴形状
  if (chinSharpness > 0.55) {
    jawAnalysis += " 下巴宽圆，福气深厚，晚年安康。";
  } else if (chinSharpness < 0.45) {
    jawAnalysis += " 下巴尖削，思维敏捷，行动迅速，但需注意养生。";
  }
  
  // ============================================
  // 8. 对称性分析（运势平衡）
  // ============================================
  let symmetryAnalysis = "";
  
  if (faceSymmetry > 0.95) {
    symmetryAnalysis = "面相极为对称，运势平衡，性格稳定。您内外如一，坦诚可靠，少有大波折。这是贵人相，容易获得他人信任。";
  } else if (faceSymmetry < 0.88) {
    symmetryAnalysis = "面部略有不对称，性格中有矛盾面。您可能在不同场合展现不同性格，需要学会整合内在的多元性。不对称也代表独特性和创造力。";
  } else {
    symmetryAnalysis = "面相对称度良好，性格相对稳定，运势较为平衡。";
  }

  // ============================================
  // 9. 综合性格分析（多特征组合）
  // ============================================
  let personalityAnalysis = "";
  
  // 判断性格类型（基于多特征组合）
  const isLeaderType = cheekboneWidth > 0.92 && middleRatio > 0.32;
  const isScholarType = upperRatio > 0.34 && ratios.eyeRoundness < 0.38;
  const isArtistType = ratios.eyeRoundness > 0.50 && ratios.lipFullness > 0.35;
  const isBusinessType = ratios.noseWidthRatio > 0.26 && ratios.jawWidth > 0.80;
  
  if (isLeaderType) {
    personalityAnalysis = "**领导者性格**：您天生具有领袖气质，决策果断，执行力强。在团队中容易成为核心人物，善于统筹全局。但需注意倾听他人意见，避免过于强势。";
  } else if (isScholarType) {
    personalityAnalysis = "**学者型性格**：您智慧深邃，追求真理，喜欢钻研。对知识有强烈渴望，思维严密。适合从事研究、教育或专业技术工作。建议多与外界交流，避免过于封闭。";
  } else if (isArtistType) {
    personalityAnalysis = "**艺术家性格**：您感性细腻，富有创造力和想象力。情感丰富，审美能力强。适合艺术、设计、文化创意等领域。需要理性辅助，避免情绪化决策。";
  } else if (isBusinessType) {
    personalityAnalysis = "**商业型性格**：您务实能干，目标明确，执行力强。对财富和物质有清晰认知，善于把握商机。适合创业、投资、商业管理等领域。注意平衡物质与精神。";
  } else {
    // 综合型
    const traits = [];
    if (ratios.eyeRoundness > 0.45) traits.push("感性");
    if (ratios.browThickness > 0.010) traits.push("果敢");
    if (upperRatio > 0.32) traits.push("智慧");
    if (ratios.lipFullness > 0.35) traits.push("热情");
    if (ratios.jawWidth > 0.80) traits.push("坚韧");
    
    personalityAnalysis = `**综合型性格**：您性格多元，兼具${traits.join("、")}等特质。这种复合性格让您适应力强，能在不同环境中找到自己的位置。建议充分发挥多面性优势，但也要找到核心定位。`;
  }
  
  // ============================================
  // 10. 运势分析（基于特征组合）
  // ============================================
  let fortuneAnalysis = "";
  
  // 早年运（上停）
  if (upperRatio > 0.34) {
    fortuneAnalysis = "**早年运（1-30岁）**：运势极佳，学业顺利，容易获得贵人相助。智慧早现，年少有为。\n\n";
  } else if (upperRatio < 0.30) {
    fortuneAnalysis = "**早年运（1-30岁）**：需要更多努力，但磨砺将成为未来的宝贵财富。大器晚成之相。\n\n";
  } else {
    fortuneAnalysis = "**早年运（1-30岁）**：运势平稳，通过自身努力可获得良好发展。\n\n";
  }
  
  // 中年运（中停）
  if (middleRatio > 0.34) {
    fortuneAnalysis += "**中年运（30-50岁）**：事业高峰期，权力运势强，能成就大事。此时期是人生最辉煌的阶段。\n\n";
  } else if (middleRatio < 0.30) {
    fortuneAnalysis += "**中年运（30-50岁）**：相对平淡，适合稳健发展，不宜冒进。中年转型需谨慎。\n\n";
  } else {
    fortuneAnalysis += "**中年运（30-50岁）**：稳步上升，通过持续努力可获得稳固地位。\n\n";
  }
  
  // 晚年运（下停）
  if (lowerRatio > 0.34) {
    fortuneAnalysis += "**晚年运（50岁后）**：福禄深厚，子孙贤孝，晚景安康。越到后期越显富贵，能享清福。";
  } else if (lowerRatio < 0.30) {
    fortuneAnalysis += "**晚年运（50岁后）**：需要提前规划养老，注意健康与财务管理。精神追求更重要。";
  } else {
    fortuneAnalysis += "**晚年运（50岁后）**：平稳安康，有子女依靠，生活无忧。";
  }
  
  // ============================================
  // 11. 职业建议（基于多维特征）
  // ============================================
  let careerSuggestion = "";
  const careers = [];
  
  // 基于不同特征推荐职业
  if (upperRatio > 0.33) {
    careers.push("科研人员", "战略分析师", "大学教授", "AI研究员");
  }
  if (middleRatio > 0.33) {
    careers.push("企业高管", "项目经理", "创业者", "政府官员");
  }
  if (cheekboneWidth > 0.92) {
    careers.push("团队领导", "销售总监", "行政管理");
  }
  if (ratios.eyeRoundness > 0.48) {
    careers.push("艺术家", "设计师", "演员", "心理咨询师");
  }
  if (ratios.noseWidthRatio > 0.27) {
    careers.push("金融投资", "房地产", "商业顾问");
  }
  if (ratios.eyeRoundness < 0.38) {
    careers.push("数据分析师", "程序员", "侦探", "律师");
  }
  if (ratios.lipFullness > 0.38) {
    careers.push("公关", "主持人", "教师", "客户经理");
  }
  if (ratios.browThickness > 0.011) {
    careers.push("执法人员", "军人", "运动员", "应急管理");
  }
  
  // 去重并限制数量
  const uniqueCareers = [...new Set(careers)].slice(0, 6);
  careerSuggestion = `**推荐职业方向**：${uniqueCareers.join("、")}。\n\n这些领域能充分发挥您的天赋特质，建议结合自身兴趣和当前行业趋势进行选择。核心原则：扬长避短，发挥优势。`;
  
  // ============================================
  // 12. 计算综合评分（加权）
  // ============================================
  const finalScore = calculateWeightedScore([
    { value: upperRatio, weight: 8, positive: true },
    { value: middleRatio, weight: 10, positive: true },
    { value: lowerRatio, weight: 8, positive: true },
    { value: faceSymmetry, weight: 12, positive: true },
    { value: ratios.eyeRoundness > 0.35 ? ratios.eyeRoundness : 0.7 - ratios.eyeRoundness, weight: 5, positive: true },
    { value: noseHeightRatio, weight: 6, positive: true },
    { value: cheekboneWidth > 0.9 ? cheekboneWidth : 0.85, weight: 5, positive: true },
    { value: ratios.lipFullness, weight: 4, positive: true },
    { value: ratios.jawWidth, weight: 4, positive: true }
  ]);
  
  // ============================================
  // 13. 生成相应的诗词（基于类型）
  // ============================================
  const poemDatabase: { [key: string]: string[] } = {
    upper: [
      "天庭饱满智慧深，\n早岁功名志气新。\n运筹帷幄千里外，\n青云直上步步春。",
      "上停高耸贵人相，\n文采风流天下扬。\n若得苦心勤磨砺，\n他年必定耀门墙。"
    ],
    middle: [
      "颧鼻有势显威权，\n中年运起如登天。\n执掌乾坤凭魄力，\n建功立业在人间。",
      "印堂饱满鼻梁高，\n中年得势贵气豪。\n莫道征途多险阻，\n乘风破浪立功劳。"
    ],
    lower: [
      "地阁方圆福禄全，\n晚来富贵自天然。\n子孙贤孝家业旺，\n颐养天年享百年。",
      "下停宽厚福寿长，\n晚景安康喜气扬。\n积善之家多余庆，\n儿孙满堂福无疆。"
    ],
    balanced: [
      "三停匀称格局高，\n运势平和少风波。\n中庸之道天地合，\n进退自如乐逍遥。",
      "相随心转是天机，\n面有和气福自随。\n但能积善多行德，\n前程万里任君驰。"
    ]
  };
  
  const poemKey = zones.dominant === 'balanced' ? 'balanced' : zones.dominant;
  const poems = poemDatabase[poemKey] || poemDatabase.balanced;
  const selectedPoem = poems[Math.floor((finalScore + faceSymmetry * 100) % poems.length)];
  
  // ============================================
  // 14. 根据特征微调标题
  // ============================================
  let finalTitle = baseTitle;
  
  // 高对称性加成
  if (faceSymmetry > 0.95) {
    finalTitle += " · 贵人";
  }
  
  // 特殊组合标题
  if (upperRatio > 0.35 && ratios.eyeRoundness < 0.35) {
    finalTitle = "天机智囊";
  } else if (middleRatio > 0.36 && cheekboneWidth > 0.93) {
    finalTitle = "紫微权星";
  } else if (ratios.lipFullness > 0.40 && ratios.eyeRoundness > 0.50) {
    finalTitle = "天同福星";
  }
  
  return {
    mode: 'face',
    title: finalTitle,
    score: finalScore,
    archetype: baseArchetype,
    poem: selectedPoem,
    details: {
      zoneAnalysis,
      eyeAnalysis,
      noseAnalysis,
      mouthAnalysis,
      browAnalysis,
      cheekboneAnalysis,
      jawAnalysis,
      symmetryAnalysis,
      personalityAnalysis,
      fortuneAnalysis,
      careerSuggestion
    }
  };
};

// ============================================
// 手相分析（保留原逻辑）
// ============================================
const getHandAnalysis = (metrics: HandMetrics): AnalysisReport => {
  const { element } = metrics;
  let title = "";
  let archetype = "";
  let handShapeAnalysis = "";
  let careerAdvice = "";
  let score = 75;

  switch (element) {
    case 'earth':
      title = "大地之手";
      archetype = "实干家 (土)";
      handShapeAnalysis = "掌方指短，厚实有力。性格稳重，吃苦耐劳，重视传统与秩序。您不喜空谈，更愿意脚踏实地完成任务。";
      careerAdvice = "适合建筑、农业、机械、物流等需要耐心与体力的实业领域。";
      score = 82;
      break;
    case 'fire':
      title = "烈焰之手";
      archetype = "领袖 (火)";
      handShapeAnalysis = "掌长指短，精力旺盛。性格外向热情，充满野心与冲劲。您讨厌枯燥重复，喜欢挑战与冒险，具有极强的感召力。";
      careerAdvice = "适合创业、销售、演艺、体育或高风险投资领域。";
      score = 88;
      break;
    case 'air':
      title = "清风之手";
      archetype = "智者 (风)";
      handShapeAnalysis = "掌方指长，思维敏捷。性格知性好奇，善于沟通与分析。您重视精神交流，逻辑严密，通过资讯与知识来掌控世界。";
      careerAdvice = "适合教育、传媒、法律、写作或科技研发领域。";
      score = 85;
      break;
    case 'water':
      title = "流水之手";
      archetype = "艺术家 (水)";
      handShapeAnalysis = "掌长指长，纤细敏感。性格细腻多情，直觉力极强，富有想象力。您容易受环境影响，但也能敏锐地感知他人的情绪。";
      careerAdvice = "适合艺术、心理咨询、医疗护理、设计或神秘学领域。";
      score = 80;
      break;
  }

  return {
    mode: 'hand',
    title,
    score,
    archetype,
    poem: "掌中乾坤大，纹路泄天机。\n十指连心处，富贵在人为。",
    details: {
      handShapeAnalysis,
      fingerAnalysis: metrics.fingerLengthRatio > 0.8 ? "手指修长，显示您不仅重物质，更重精神层面的满足，审美能力强。" : "手指结实，显示您务实肯干，执行力强，更看重实际结果。",
      careerAdvice
    }
  };
};

// ============================================
// 体态分析（保留原逻辑）
// ============================================
const getBodyAnalysis = (metrics: BodyMetrics): AnalysisReport => {
  const { postureType, shoulderBalance } = metrics;
  let title = "";
  let archetype = "";
  let postureAnalysis = "";
  let energyAnalysis = "";
  let healthAdvice = "";
  let score = 70;

  switch (postureType) {
      case 'upright':
          title = "青松之姿";
          archetype = "君子 (正)";
          postureAnalysis = "骨相中正，脊柱挺拔如松。显示您为人正直，有原则，内心坦荡，不畏强权。肩颈平衡，意味着您能很好地平衡生活与责任。";
          energyAnalysis = "气脉畅通，精气神饱满，做事专注度高。";
          healthAdvice = "保持即可，可适当练习太极或冥想，进一步提升内在气的稳固。";
          score = 92;
          break;
      case 'slouch':
          title = "灵龟之态";
          archetype = "谋士 (藏)";
          postureAnalysis = "体态微屈，含胸收腹。这类人往往思虑深沉，善于隐藏实力，性格内敛，不喜张扬。但也可能意味着近期压力较大，背负重担。";
          energyAnalysis = "气沉丹田，由于过度内收，容易导致胸气郁结，需要通过开扩的活动来释放。";
          healthAdvice = "建议多做扩胸运动，仰望天空，以打开心扉，提升自信与决断力。";
          score = 75;
          break;
      case 'leaning_left':
      case 'leaning_right':
          title = "风柳之姿";
          archetype = "游侠 (变)";
          postureAnalysis = "双肩高低不一，体态灵动但不稳。显示您性格随性，适应力强，但也容易情绪化，或在做决定时摇摆不定。";
          energyAnalysis = "气机偏颇，左右能量不平衡。高肩一侧往往承担了过多的潜意识压力或紧张。";
          healthAdvice = "注意脊柱侧弯风险，建议练习瑜伽中的山式站立，有意识地觉察并纠正体态平衡。";
          score = 72;
          break;
  }

  return {
      mode: 'body',
      title,
      score,
      archetype,
      poem: "立如苍松坐如钟，行如微风卧如弓。\n骨正筋柔气血顺，百病不生乐无穷。",
      details: {
          postureAnalysis,
          energyAnalysis,
          healthAdvice
      }
  };
};

// ============================================
// 主导出函数 - 仅使用 AI 分析（无本地备份）
// ============================================
export const generateFortune = async (metrics: VisionMetrics): Promise<AnalysisReport> => {
  // 直接使用 AI 进行分析，失败则抛出错误
  return await analyzeWithGemini(metrics);
};
