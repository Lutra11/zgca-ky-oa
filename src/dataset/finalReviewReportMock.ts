// 学部推荐立项终审 — 评审结果报告 mock（示例数据，逐字按用户样例）
export interface FinalReviewSummaryRow {
  seq: number
  originalSeq: number
  projectName: string
  leader: string
  subDirection: string
  score: string
  zScore: string
  strategicStar: boolean
  rankChange: 'up' | 'down' | '-'
  majorProject: string
  reviewComment: string
  recommended: boolean
  /** 学部复议（线下合议会）剔除标记：学部推荐后经复议剔除，由 PMO 在系统中登记 */
  recheckExcluded?: boolean
}

/** AN-MWVFPQVT：项目评审详情 — 三位评委独立打分明细（评委打分口径与报告 weightNote 一致） */
export interface FinalReviewerScore {
  name: string
  grade: 'A' | 'B' | 'C'
  dimensions: { label: string; value: number; max: number }[]
  total: number
  comment: string
}

const finalScoreDimensionDefs = [
  { label: '选题和科学价值', max: 30 },
  { label: '研究内容与方案', max: 30 },
  { label: '可行性论证', max: 20 },
  { label: '学生培养与成果转化', max: 20 },
]

const finalReviewerNamePool = [
  '闵耀森',
  '杨耀东',
  '陈宇轩',
  '李雨桐',
  '赵文博',
  '周建国',
  '宋佳霖',
  '韩明轩',
]

const finalReviewerCommentPool: Record<'A' | 'B' | 'C', string[]> = {
  A: [
    '选题方向与学部战略布局高度契合，研究方案设计完整，建议立项后重点跟踪。',
    '研究基础扎实，可行性论证充分，预期成果对学生培养价值显著。',
    '创新性突出，指标设置合理，建议列为学部重点培育项目。',
  ],
  B: [
    '选题具备研究价值，方案基本完整，建议进一步聚焦核心研究内容。',
    '整体可行，建议补充算力与资源保障论证，细化阶段成果指标。',
    '研究基础较好，建议加强成果转化路径设计与风险预案。',
  ],
  C: [
    '选题一般，研究内容偏宽，建议收敛范围后下一批次再报。',
    '可行性论证不足，关键假设缺少支撑材料，建议补充预研数据。',
    '与同学方向其他申报相比竞争力不足，建议打磨后重新申报。',
  ],
}

/** 由项目名生成确定性 seed（不同项目评委组合稳定不同） */
function projectSeed(projectName: string): number {
  let seed = 7
  for (let i = 0; i < projectName.length; i += 1) {
    seed = (seed * 31 + projectName.charCodeAt(i)) % 100003
  }
  return seed
}

/** AN-MWVFRNN7：三位（或两位）复审评委独立打分明细；reviewers 传入实际评委名单（缺省按项目名轮换派生） */
export function makeReviewerScores(projectName: string, base?: number, reviewers?: string[]): FinalReviewerScore[] {
  const seed = projectSeed(projectName)
  const avg = base ?? 76 + (seed % 13)
  // 评委相对均分的偏移（合计为 0，保证平均 ≈ 汇总分；三评委用原偏移表，两位评委用 ±0.6）
  const offsets =
    reviewers && reviewers.length === 2 ? [0.6, -0.6] : reviewers && reviewers.length > 3
      ? Array.from({ length: reviewers.length }, (_, i) => (i % 2 === 0 ? 0.6 : -0.6))
      : [1.8, -1.2, -0.6]
  const gradeOf = (total: number): 'A' | 'B' | 'C' => (total >= 85 ? 'A' : total >= 75 ? 'B' : 'C')
  const commentOf = (grade: 'A' | 'B' | 'C', index: number) =>
    finalReviewerCommentPool[grade][(seed + index) % finalReviewerCommentPool[grade].length]
  return offsets.map((offset, index) => {
    const total = Math.min(100, Math.max(60, Math.round((avg + offset) * 10) / 10))
    // 按四维权重拆分总分并加 ±1 微扰，保证各维不超满分
    const dimensions = finalScoreDimensionDefs.map((def, dimIndex) => {
      const weight = def.max / 100
      const jitter = (((seed + index) * 7 + dimIndex * 3) % 3 - 1) * 0.5
      const value = Math.min(def.max, Math.max(1, Math.round(total * weight + jitter)))
      return { label: def.label, value, max: def.max }
    })
    const name = reviewers
      ? reviewers[index % reviewers.length]
      : finalReviewerNamePool[(seed * 2 + index * 3) % finalReviewerNamePool.length]
    const grade = gradeOf(total)
    return { name, grade, dimensions, total, comment: commentOf(grade, index) }
  })
}

/** 学部终审表（finalReviewRows）行 → 三评委打分明细（以汇总分为基准） */
export function getFinalReviewerScores(row: FinalReviewSummaryRow): FinalReviewerScore[] {
  return makeReviewerScores(row.projectName, Number(row.score) || undefined)
}

export const finalReviewReport = {
  kicker: 'AI 核心学部・2026 年第一批・基础培育类',
  statusTag: '已汇总',
  info: [
    { label: '评审范围', value: '北京中关村学院 2026 年秋季导师立项（人工智能核心学部）' },
    { label: '汇总时间', value: '2026-10-28' },
    { label: '申报数量', value: '14 项' },
    { label: '拟推荐进入复审数量', value: '14 项' },
    { label: '报告版本号', value: 'V1.0' },
  ],
  overview: {
    declared: '14 项',
    recommended: '14 项・全部推荐，拟推荐进入复审',
    average: '82.3（满分 100）',
    highest: '86.00',
  },
  weightNote:
    '权重参考：理论与算法 2・模型 5・AI 安全 1・具身智能 6｜评价指标：选题和科学价值 30 / 研究内容与方案 30 / 可行性论证 20 / 学生培养与成果转化 20（满分 100，三位评委平均分）｜得分按学部进行 Z 分数处理，供跨学部比较参考',
  overallComment1:
    '本次评审共收到 14 项申报，覆盖理论与算法、AI 模型、AI 安全、具身智能四个子方向。多数项目方案成熟、研究基础较好；评委意见集中指出算力与资源保障论证、研究内容聚焦等问题，将在立项后持续跟进。',
  overallComment2:
    '学部综合考虑初评得分、评委意见与学部战略布局，经初审评议，建议本轮 14 项申报项目全部推荐进入复审。其中，张骁庆、唐郁钰、胡耀清等项目与学部战略布局高度关联，建议列为重点跟踪项目。',
  draftSavedTag: '已自动保存草稿',
  signers: '人工智能核心学部负责人 董彬、江江',
}

export const finalReviewRows: FinalReviewSummaryRow[] = [
  { seq: 1, originalSeq: 1, projectName: '基础模型持续学习与在线适应研究', leader: '张骁庆', subDirection: 'AI 模型', score: '86.00', zScore: '1.13', strategicStar: false, rankChange: '-', majorProject: '拟申请腾讯大模型基座与强化学习合作方向内的 Code & Agent 相关项目，计划围绕科研智能体自主持续进化开展升级，重点研究自更新', reviewComment: '项目直面大语言模型持续学习与遗忘这一难题，选题贴切', recommended: true },
  { seq: 2, originalSeq: 2, projectName: '主动交互与自进化物理 AI 关键技术研究', leader: '唐郁钰', subDirection: '具身智能', score: '86.00', zScore: '1.13', strategicStar: false, rankChange: '-', majorProject: '本项目计划对接 CYY 大模型后训练项目与 AI for 空天项目，围绕主动交互与自进化物理 AI 关键技术开展预研积累，为上述外部重大项目的申报铺路', reviewComment: '课题面向物理 AI 从被动执行走向主动交互与自进化的前沿方向', recommended: true },
  { seq: 3, originalSeq: 3, projectName: '面向具身智能的精密感知与仿生操作策略技术研究及应用', leader: '胡耀清', subDirection: '具身智能', score: '86.00', zScore: '1.13', strategicStar: false, rankChange: '-', majorProject: '本项目面向学部 "具身智能与物理世界 AGI" 战略布局，围绕人类交互多源、全模态精密感知以及主动观察与交互开展前期研究，与学部', reviewComment: '课题面向具身智能与物理世界 AGI 方向，聚焦精密感知与操作', recommended: true },
  { seq: 4, originalSeq: 4, projectName: '人类知识与自主进化协同的 AI4A 机制研究', leader: '付靖文', subDirection: '理论与算法', score: '85.33', zScore: '0.85', strategicStar: false, rankChange: '-', majorProject: '本项目对应学部 "新路径探索新一代训练范式""大模型与科研智能体" 两个重点方向的基础研究，服务于', reviewComment: '项目面向 AI4A 国际前沿，准确抓住人机知识协同与自主', recommended: true },
  { seq: 5, originalSeq: 5, projectName: '机器人形态 - 技能协同自进化理论与方法研究', leader: '丁加涛', subDirection: '具身智能', score: '85.00', zScore: '0.83', strategicStar: false, rankChange: '-', majorProject: '本项目服务于学院 AI 核心学部尤其是具身智能方向的整体布局，聚焦结构共进化与技能自主进化，支撑机器人在真实物理交互中持续学习与自主进化', reviewComment: '项目面向具身智能与自主进化前沿，将形态控制和技能打通融合', recommended: true },
  { seq: 6, originalSeq: 6, projectName: '面向流体立体分场景的 VLA 与世界模型驱动泛化操作任务方法研究', leader: '者文明', subDirection: '具身智能', score: '83.67', zScore: '0.42', strategicStar: false, rankChange: '-', majorProject: '面向科技部、国家发改委等部门的国家重大科技与产业专项，以及行业龙头企业的联合攻关项目，围绕大模型与具身智能融合、通用', reviewComment: '课题聚焦流体立体分场景与操作的真实环境问题，直面长难', recommended: true },
  { seq: 7, originalSeq: 7, projectName: '多智能体组织智能形成与双向自增强学习', leader: '邓悦', subDirection: '理论与算法', score: '83.00', zScore: '0.22', strategicStar: false, rankChange: '-', majorProject: '本立项拟对接两类外部重大项目：一是面向多智能体自组织智能的研究，聚焦结构共进化与任务分工、技能共享、轮值迁移、协同自进化；二是', reviewComment: '项目直接对应学部 "智能体系统与真实世界交互" 方向，以', recommended: true },
  { seq: 8, originalSeq: 8, projectName: '持续学习与无上限上下文大模型', leader: '王培栋', subDirection: 'AI 模型', score: '82.00', zScore: '0.09', strategicStar: false, rankChange: '-', majorProject: '本项目（持续学习与无上限上下文大模型）旨在填补国外前沿空白，直接支撑学部 AI 全栈关键技术攻关项目中的持续学习方向，是学部', reviewComment: '项目以持续学习和无上限上下文为主线，直接对接 AI Core', recommended: true },
  { seq: 9, originalSeq: 9, projectName: '多模态图像生成关键算法与智能体技术研究', leader: '王东升', subDirection: 'AI 模型', score: '81.67', zScore: '0.19', strategicStar: false, rankChange: '-', majorProject: '项目的蒸馏、强化学习算法或者智能体部分，计划申请中科院外部项目', reviewComment: '项目聚焦多模态视觉生成领域的关键科学与技术问题，面向', recommended: true },
  { seq: 10, originalSeq: 10, projectName: '面向物理 AI 基座模型的世界表征技术研究', leader: '黄聪', subDirection: '具身智能', score: '81.67', zScore: '0.19', strategicStar: false, rankChange: '-', majorProject: '拟申请物理基础模型的院外重大项目，研究如何从大规模人类观测与交互经验中学习可共享、可复用的物理世界模型，构建融合空间可', reviewComment: '课题面向世界表征技术，为物理 AI 基座模型构建基础', recommended: true },
  { seq: 11, originalSeq: 11, projectName: '未来预测驱动的大模型自进化', leader: '段易通', subDirection: 'AI 模型', score: '81.00', zScore: '-0.39', strategicStar: false, rankChange: '-', majorProject: '本项目对标学部拓展数据谱系、推进持续学习和探索训练范式的前沿布局，拟围绕自进化反馈驱动的大模型持续学习与自进化方向', reviewComment: '项目聚焦大模型自进化，抓住生成式预训练后的拓展', recommended: true },
  { seq: 12, originalSeq: 12, projectName: '面向人机协同操作的可迁移交互世界模型', leader: '徐良', subDirection: '具身智能', score: '77.67', zScore: '-1.41', strategicStar: false, rankChange: '-', majorProject: '本项目对接人工智能核心学部面向物理世界 AGI 的战略布局，围绕空间推理、运动交互及感知 / 规划 / 决策一体化 - 环境反馈，凝练', reviewComment: '课题聚焦可迁移交互世界模型这一前沿方向，面向人机协同', recommended: true },
  { seq: 13, originalSeq: 13, projectName: '面向长期交互的智能体自进化方法研究', leader: '沈逸飞', subDirection: 'AI 模型', score: '76.67', zScore: '-1.71', strategicStar: false, rankChange: '-', majorProject: '本项目面向 "十五五" 关于突破人工智能基础理论和核心技术、全面实施人工智能 + 行动及加强人机智能治理的部署，落实学部构建可学习、可交', reviewComment: '项目面向长期交互智能体的持续学习与自进化，提出基础', recommended: true },
  { seq: 14, originalSeq: 14, projectName: '模型不可信条件下智能体安全防御研究', leader: '徐枭云', subDirection: 'AI 安全', score: '76.33', zScore: '-1.81', strategicStar: false, rankChange: '-', majorProject: '本项目面向 AI Core 学部构建 "可学习、可交互、可持续进化的完整智能体环" 的战略目标，衔接 AI 安全方向的动态验证机制与可信可牵引', reviewComment: '项目聚焦模型不可信条件下智能体的安全防御，揭示模型', recommended: true },
]
