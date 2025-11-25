import { VisionMetrics, AnalysisReport, FaceMetrics, HandMetrics, BodyMetrics, EarMetrics } from "../types";

// ⚠️ 注意：实际开发中，建议把 Key 放在 .env 文件里
const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "x-ai/grok-4.1-fast:free";

// 将指标数据转换为易读的描述
function formatMetricsForPrompt(metrics: VisionMetrics): string {
  if (metrics.mode === 'face' && metrics.face) {
    return formatFaceMetrics(metrics.face, metrics.ear);
  } else if (metrics.mode === 'hand' && metrics.hand) {
    return formatHandMetrics(metrics.hand);
  } else if (metrics.mode === 'body' && metrics.body) {
    return formatBodyMetrics(metrics.body);
  }
  return "";
}

function formatFaceMetrics(face: FaceMetrics, ear?: EarMetrics): string {
  const { zones, ratios, twelvePalaces } = face;
  const totalZone = zones.upper + zones.middle + zones.lower;
  const upperRatio = zones.upper / totalZone;
  const middleRatio = zones.middle / totalZone;
  const lowerRatio = zones.lower / totalZone;
  
  let metricsText = `
【面相特征数据】

一、三停比例：
- 上停（发际-眉毛）：${(upperRatio * 100).toFixed(1)}%
- 中停（眉毛-鼻头）：${(middleRatio * 100).toFixed(1)}%
- 下停（人中-下巴）：${(lowerRatio * 100).toFixed(1)}%
- 主导区域：${zones.dominant === 'upper' ? '上停(天庭)' : zones.dominant === 'middle' ? '中停(鼻颜)' : zones.dominant === 'lower' ? '下停(地阁)' : '三停平衡'}

二、五官指标：
- 眉毛厚度：${(ratios.browThickness * 100).toFixed(2)}%
- 眼睛圆度：${(ratios.eyeRoundness * 100).toFixed(1)}%
- 鼻宽比：${(ratios.noseWidthRatio * 100).toFixed(1)}%
- 嘴唇丰满度：${(ratios.lipFullness * 100).toFixed(1)}%
- 下颌宽度：${(ratios.jawWidth * 100).toFixed(1)}%`;

  // 添加十二宫数据（如果有）
  if (twelvePalaces) {
    metricsText += `

三、十二宫位指标：
- 印堂宽度（命宫）：${(twelvePalaces.yintangWidth * 100).toFixed(1)}%
- 额头饱满度（官禄宫）：${(twelvePalaces.foreheadFullness * 100).toFixed(1)}%
- 额角宽度（迁移宫）：${(twelvePalaces.foreheadCornerWidth * 100).toFixed(1)}%
- 奸门宽度（夫妻宫）：${(twelvePalaces.eyeTailWidth * 100).toFixed(1)}%
- 泪堂饱满度（男女宫）：${(twelvePalaces.tearTroughFullness * 100).toFixed(1)}%
- 山根高度（疾厄宫）：${(twelvePalaces.shanGenHeight * 100).toFixed(1)}%
- 颜骨护鼻程度：${(twelvePalaces.cheekboneSupport * 100).toFixed(1)}%`;
  }

  // 添加耳朵数据（如果有）
  if (ear && ear.hasEarImage) {
    metricsText += `

四、耳朵特征（用户上传照片）：
- 耳朵位置：${ear.position === 'high' ? '高位' : ear.position === 'low' ? '低位' : '中位'}
- 耳垂厚度：${ear.lobeFullness === 'thick' ? '厚实' : ear.lobeFullness === 'thin' ? '较薄' : '适中'}
- 耳朵大小：${ear.size === 'large' ? '大' : ear.size === 'small' ? '小' : '中等'}`;
  } else {
    metricsText += `

四、耳朵特征：
- 状态：未上传耳朵照片，请基于整体面相特征进行AI推断`;
  }

  return metricsText.trim();
}

function formatHandMetrics(hand: HandMetrics): string {
  return `
手相特征数据：
- 手掌类型：${hand.element === 'earth' ? '土(掌方指短)' : hand.element === 'fire' ? '火(掌长指短)' : hand.element === 'air' ? '风(掌方指长)' : '水(掌长指长)'}
- 手掌长宽比：${hand.palmRatio.toFixed(2)}
- 手指长度比：${hand.fingerLengthRatio.toFixed(2)}
  `.trim();
}

function formatBodyMetrics(body: BodyMetrics): string {
  return `
体态特征数据：
- 姿态类型：${body.postureType === 'upright' ? '挺拔中正' : body.postureType === 'slouch' ? '含胸收腹' : body.postureType === 'leaning_left' ? '左倾' : '右倾'}
- 肩膀平衡度：${(Math.abs(body.shoulderBalance) * 100).toFixed(1)}%
- 头部倾斜：${(Math.abs(body.headTilt) * 100).toFixed(1)}%
- 躯干对齐度：${(Math.abs(body.torsoAlignment) * 100).toFixed(1)}%
  `.trim();
}

// 生成系统提示词
function getSystemPrompt(mode: 'face' | 'hand' | 'body'): string {
  const basePrompt = `你是"天机"AI算命系统的核心算法，精通中国传统相学（Mian Xiang）与现代心理学。你的分析需要融合古典智慧与科技感，既要有深度又要有温度。

**核心原则**：
1. 基于提供的实际测量数据进行分析，不要虚构数据
2. 使用中国传统相学术语（如三停五眼、五行属性等）
3. 语气神秘、专业但带有鼓励性，结合“流年运势”给出建议
4. 结论要具体、个性化，避免泛泛而谈
5. 不要直接罗列数据，要转化为术语（如“天庭饱满”）

**输出格式要求**（严格按JSON格式返回）：
{
  "title": "命格标题（4-6字，如：天机星主、武曲星耀）",
  "score": 分数（50-99之间的整数）,
  "archetype": "人格原型（如：智慧型·木、行动型·火）",
  "poem": "四句七言诗，用\\n分隔每行",
  "details": {
    详细分析字段（根据分析类型不同）
  }
}`;

  if (mode === 'face') {
    return `你是"天机"AI算命系统的核心算法，精通中国传统相学与现代心理学。

**核心原则**：
1. 基于提供的实际测量数据进行分析，不要虚构数据
2. 使用中国传统相学术语（三停、五官、十二宫等）
3. 语气神秘专业但带有鼓励性
4. 对于无法精确测量的部分（如耳朵、气色、骨相），需标注"[AI推断]"
5. 结论要具体、个性化，避免泛泛而谈

**完整面相分析JSON格式**：
{
  "title": "命格标题（4字，如：天机星主）",
  "score": 综合评分（50-99整数）,
  "archetype": "命格原型（如：智慧型·木）",
  "poem": "七言四句判词，用\\n分隔",
  
  "sanTing": {
    "overview": "三停整体格局评价（80-100字）",
    "upper": "上停分析（15-30岁）：智力、早年运、祖荫（120-150字）",
    "middle": "中停分析（31-50岁）：事业、财富、意志（120-150字）",
    "lower": "下停分析（51岁后）：晚福、子孙、统御（120-150字）"
  },
  
  "wuGuan": {
    "brow": "眉相（保寿官）：情感、兄弟运、性格急缓（80-100字）",
    "eye": "眼相（监察官）：智慧、心性、决断力，这是最重要的部分（150-180字）",
    "nose": "鼻相（审辨官）：财运、自尊心、攻击性（100-120字）",
    "mouth": "嘴相（出纳官）：表达、食禄、人际（80-100字）",
    "ear": "耳相（采听官）：童年运、福气、健康（80-100字）",
    "earIsInferred": true或false（如果用户未上传耳朵照片则为true）
  },
  
  "twelvePalaces": {
    "mingGong": "命宫（印堂）：近期总运势（60-80字）",
    "caiBo": "财帛宫：赚钱与守财能力（60-80字）",
    "xiongDi": "兄弟宫：人脉与平辈助力（50-60字）",
    "tianZhai": "田宅宫：房产与家庭环境（50-60字）",
    "nanNv": "男女宫：子女状况（50-60字）",
    "nuPu": "奴仆宫：下属与晚辈支持（50-60字）",
    "fuQi": "夫妻宫：婚姻感情（60-80字）",
    "qianYi": "迁移宫：外出与变动运（50-60字）",
    "jiE": "疾厄宫：健康与抵抗力（60-80字）",
    "guanLu": "官禄宫：事业与升迁（60-80字）",
    "fuDe": "福德宫：精神享受与福气（50-60字）",
    "fuMu": "父母宫：长辈缘与遗传（50-60字）"
  },
  
  "dynamic": {
    "boneStructure": "[AI推断] 骨相承载力分析（80-100字）",
    "complexion": "[AI推断] 当前气色吉凶判断（60-80字）",
    "spiritEssence": "眼神神韵评估（80-100字）",
    "isInferred": true
  },
  
  "summary": {
    "personality": "综合性格画像（100-120字）",
    "career": "事业发展建议与适合领域（80-100字）",
    "wealth": "财运指引与理财建议（60-80字）",
    "love": "感情婚姻建议（60-80字）",
    "health": "健康注意事项（60-80字）",
    "lucky": "开运锦囊：幸运色、幸运数字、贵人方位等（60-80字）"
  },
  
  "details": {}
}`;
  } else if (mode === 'hand') {
    return `你是"天机"AI算命系统的核心算法，精通中国传统手相学与西方掌纹学。

**核心原则**：
1. 基于提供的手部测量数据进行分析
2. 使用五行手分类法和传统掌纹术语
3. 语气神秘专业但带有鼓励性
4. 掌纹细节无法精确测量时，需标注"[AI推断]"

**完整手相分析JSON格式**：
{
  "title": "命格标题（4字，如：掌握乾坤）",
  "score": 综合评分（50-99整数）,
  "archetype": "五行手型（如：木形手·智者）",
  "poem": "七言四句判词，用\\n分隔",
  
  "palmType": {
    "element": "五行手类型（金/木/水/火/土）",
    "description": "掌型特征描述：手掌形状、软硬厚薄、整体观感（80-100字）",
    "personality": "性格底色分析（60-80字）",
    "career": "适合的职业方向（60-80字）"
  },
  
  "mainLines": {
    "lifeLine": "生命线（地纹）：生命力强弱、健康状况、精力旺盛程度（80-100字）",
    "wisdomLine": "智慧线（人纹）：思维逻辑、创造力、专注力及走向分析（80-100字）",
    "emotionLine": "感情线（天纹）：情感模式、恋爱态度、心态特点（80-100字）"
  },
  
  "secondaryLines": {
    "careerLine": "[AI推断] 事业线：工作稳定性、事业心（60-80字）",
    "successLine": "[AI推断] 成功线：名声、贵人运、幸福感（60-80字）",
    "marriageLine": "[AI推断] 婚姻线：结婚早晚、婚姻质量（50-60字）",
    "wealthLine": "[AI推断] 财运线：金钱观念、理财能力（50-60字）"
  },
  
  "mounts": {
    "jupiter": "木星丘（食指下）：野心、权力、领导欲（40-50字）",
    "saturn": "土星丘（中指下）：思考、责任、独立性（40-50字）",
    "apollo": "太阳丘（无名指下）：才华、名气、艺术感（40-50字）",
    "mercury": "水星丘（小指下）：口才、机智、商业头脑（40-50字）",
    "venus": "金星丘（拇指根）：情欲、包容力、家族运（40-50字）",
    "moon": "月丘（手掌外侧）：想象力、直觉、旅行运（40-50字）"
  },
  
  "handComparison": {
    "innate": "先天潜能（非惯用手代表30岁前）：天赋与遗传基因分析（60-80字）",
    "acquired": "后天发展（惯用手代表30岁后）：努力成果与未来方向（60-80字）",
    "comparison": "左右手对比总结：是否发挥天赋、命运改变程度（60-80字）"
  },
  
  "summary": {
    "personality": "综合性格画像（80-100字）",
    "career": "事业发展建议（60-80字）",
    "wealth": "财运与理财建议（50-60字）",
    "love": "感情婚姻指引（50-60字）",
    "health": "健康注意事项（50-60字）",
    "lucky": "开运锦囊（50-60字）"
  },
  
  "details": {}
}`;
  } else {
    return basePrompt + `

**体态分析要求**：
details字段应包含：
- "postureAnalysis": 姿态分析（150-200字）
- "energyAnalysis": 气场能量分析（100-150字）
- "healthAdvice": 健康建议（100-150字）`;
  }
}

// 调用 OpenRouter API (Grok 4.1 Fast)
export async function analyzeWithGemini(metrics: VisionMetrics): Promise<AnalysisReport> {
  try {
    const metricsDescription = formatMetricsForPrompt(metrics);
    const systemPrompt = getSystemPrompt(metrics.mode);
    
    const userPrompt = `${metricsDescription}

请基于以上${metrics.mode === 'face' ? '面相' : metrics.mode === 'hand' ? '手相' : '体态'}数据，进行深度分析。
请严格按照JSON格式返回分析结果，不要包含任何markdown格式符号（如\`\`\`json），直接返回纯JSON对象。`;

    console.log('正在调用 OpenRouter API...');
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.href || 'https://lanjingwei.github.io/mx',
        'X-Title': 'Tianji AI Face Reader'
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API 错误响应:', errorData);
      const errorMsg = errorData?.error?.message || JSON.stringify(errorData);
      throw new Error(`API 请求失败 (${response.status}): ${errorMsg}`);
    }

    const result = await response.json();
    
    // 从 OpenRouter 响应中提取内容
    let text = result.choices?.[0]?.message?.content || '';
    
    // 清理可能的 markdown 代码块标记和多余字符
    text = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*[\r\n]+/, '')  // 移除开头空行
      .trim();
    
    // 尝试提取 JSON 对象（从第一个 { 到最后一个 }）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 返回内容无法解析为 JSON 格式');
    }
    
    let jsonText = jsonMatch[0];
    
    // 修复常见的 JSON 格式问题
    jsonText = jsonText
      .replace(/,\s*}/g, '}')      // 移除对象末尾多余逗号
      .replace(/,\s*]/g, ']')      // 移除数组末尾多余逗号
      .replace(/'/g, '"')          // 单引号转双引号
      .replace(/[\u201C\u201D]/g, '"')  // 中文引号转英文
      .replace(/：/g, ':')         // 中文冒号转英文
      .replace(/，/g, ',');        // 中文逗号转英文
    
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON 解析失败，原始内容:', text);
      throw new Error('AI 返回的 JSON 格式错误，请重试');
    }
    
    // 确保返回的数据包含 mode 字段
    return {
      ...data,
      mode: metrics.mode
    } as AnalysisReport;
    
  } catch (error) {
    console.error('OpenRouter API 调用失败:', error);
    
    // 如果 API 调用失败，抛出错误让上层处理（上层会回退到本地分析）
    throw new Error('AI 分析服务暂时不可用，请稍后再试。错误详情: ' + (error instanceof Error ? error.message : String(error)));
  }
}
