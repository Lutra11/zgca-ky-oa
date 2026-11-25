// 学部推荐报告（学部生成推荐报告 → 二级弹窗预览）mock，逐字按用户样例
export interface RecommendRow {
  order: number
  projectName: string
  leader: string
  subDirection: string
  score: string
  zScore: string
  strategic: boolean
  majorProject: string
  reviewComment: string
  leaderOpinion: string
}

export interface NotRecommendedRow {
  projectName: string
  leader: string
  subDirection: string
  score: string
  zScore: string
  reviewComment: string
  leaderOpinion: string
}

export const facultyRecommendReport = {
  kicker: '人工智能核心学部・2026 秋季学导师立项・基础培育类',
  statusTag: '已定版',
  info: [
    { label: '批次名称', value: '2026 年秋季导师立项（人工智能核心学部）' },
    { label: '学部', value: '人工智能核心学部' },
    { label: '报告版本', value: 'V1.0（随审核生效版）' },
    { label: '生成时间', value: '2026-11-02 14:36' },
  ],
  overview: [
    { label: '参评单据', value: '14 项' },
    { label: '推荐立项', value: '8 项' },
    { label: '不推荐', value: '6 项' },
    { label: '战略相关占比', value: '6/8=75% 阈值 66.7%，达标' },
  ],
  overallComment:
    '本次共受理 14 项申报，覆盖 AI 模型、具身智能、理论与算法、AI 安全四个子方向。经专家评审与学部综合衡量，推荐 8 项进入后续流程，覆盖持续学习、物理 AI 自进化、精密感知与具身操作、多智能体与长上下文等主线方向，研究基础扎实、路线可行；其中 6 项为战略相关推荐，战略相关占比 75%，流程模板配置阈值（66.7%）。其余 6 项未入选，主要总分未达本次推荐线（82.00）或与学部本次布局匹配度有限，均已逐项出具项目评语，建议按评语完善研究方案后参加下一批申报。',
  signers: '董彬（学部负责人）、边江（学部助理）',
  signDate: '2026-11-02',
}

export const recommendRows: RecommendRow[] = [
  {
    order: 1,
    projectName: '基础模型持续学习与在线适应研究',
    leader: '张骁庆',
    subDirection: 'AI 模型',
    score: '86.00',
    zScore: '1.13',
    strategic: true,
    majorProject: '拟申请腾讯大模型基座与强化学习合作方向中的 Code & Agent 相关项目，计划围绕科研智能体自主持续进化开展申报。重点研究实验规划、代码执行、结果反馈驱动的智能体能力提升及评测方法',
    reviewComment: '项目直面大语言模型持续学习与优化这一核心问题，选题紧贴基础模型相关技术发展趋势，与学部战略发展方向高度一致，具有重要的科学价值。研究内容条理清晰、目标明确、创新合理，能够从系统、框架和优化的角度对大语言模型提出较为实用的解决方案，可行性好',
    leaderOpinion: '同意推荐；组内按三个方向分组培养，建议进一步明确每位博士生独立研究点',
  },
  {
    order: 2,
    projectName: '主动交互与自进化物理 AI 关键技术研究',
    leader: '唐郁钰',
    subDirection: '具身智能',
    score: '86.00',
    zScore: '1.13',
    strategic: true,
    majorProject: '本项目计划对接 CYY 大模型后训练项目与 AI for 空天项目，围绕主动交互与自进化物理 AI 开展预研积累，为上述外部重大项目的申报与实施奠定基础',
    reviewComment: '课题面向物理 AI 从被动执行走向主动交互与自进化的前沿趋势，与学部战略发展方向高度一致，处于国际学术前沿，具有下一代范式雏形。项目以主动交互 — 可验证经验 — 自主学习为统一范式，防止自欺等易被忽视的痛点纳入',
    leaderOpinion: '同意推荐；建议立项后尽快落定自进化能力的评测基准，明确与主线方向的一致性',
  },
  {
    order: 3,
    projectName: '面向具身智能的精密感知与仿生操作策略技术研究及应用',
    leader: '胡耀清',
    subDirection: '具身智能',
    score: '86.00',
    zScore: '1.13',
    strategic: true,
    majorProject: '本项目面向学部具身智能与物理世界 AGI 战略布局，围绕人类交互多源、全模态精密感知以及与具身交互开展前期研究，与学部 Scaling Human Data、全模态感知、全交互及物理技能学习等方向形成衔接',
    reviewComment: '课题面向具身智能与物理世界 AGI 方向，聚焦精密感知与仿生操作，选题定位准确、科学问题提炼清晰，文档中具身智能的精度、交互改造原创性强，与学部主攻方向高度契合',
    leaderOpinion: '同意推荐；建议在研究中结合精密感知数据集形成阶段性成果',
  },
  {
    order: 4,
    projectName: '人类知识与自主进化协同的 AI4A 机制研究',
    leader: '付靖文',
    subDirection: '理论与算法',
    score: '85.33',
    zScore: '0.93',
    strategic: true,
    majorProject: '本项目对应学部新路径探索新一代训练范式、大模型与科研智能体两个重点方向的基础研究，服务于学部冲刺 AGI 下半程关键拼图的科研目标和高价值反馈 — 自主进化 — 反馈智能提升的智能闭环',
    reviewComment: '项目面向 AI4A 国际前沿，准确抓住人类知识依赖与自主创新之间的核心矛盾，将人类知识从固定约束转为动态可调节，按探索、评估、内化三个环节形成闭环研究框架，环节与学部战略高度契合，目标量化程度较高，培养体系完整',
    leaderOpinion: '同意推荐；机制类研究关注实验闭环，中期检查前可交付成果',
  },
  {
    order: 5,
    projectName: '机器人 "形态 - 技能" 协同自进化理论与方法研究',
    leader: '丁加涛',
    subDirection: '具身智能',
    score: '85.00',
    zScore: '0.83',
    strategic: true,
    majorProject: '本项目服务于学院 AI 核心部门尤其是具身智能方向的整体布局，聚焦结构共进化与技能自主进化，支撑机器人在真实物理交互中持续学习与自主进化，依托本项目在形态 - 技能协同进化方面的理论方法、算法工具与实验平台，计划申报国家重点研发计划相关重点专项、国家自然科学基金重点项目……',
    reviewComment: '项目面向具身智能与自主进化前沿，将形态控制与技能打通融合，范式原创性强、递进层次清晰，契合机器人通用化、协作化的趋势，提出能力诊断、协同优化与经验驱动决策三项方法创新，构建 "任务执行 — 能力诊断 — 协同优化 — 物理验证" 一致闭环',
    leaderOpinion: '同意推荐；建议结合学部机器人方向布局明确里程碑节点',
  },
  {
    order: 6,
    projectName: '面向流体立体分场景的 VLA 与世界模型驱动高泛化具身操作方法研究',
    leader: '者文明',
    subDirection: '具身智能',
    score: '83.67',
    zScore: '0.42',
    strategic: true,
    majorProject: '面向科技部、国家发改委等部门的国家重大科技与产业专项，以及行业龙头企业的联合攻关项目，围绕大模型与具身智能融合、通用、适用机器人关键能力以及真实产业场景应用展开布局，将始终以物理世界 AGI 为主线，持续补齐 AGI 关键能力、形成严谨科学逻辑的核心技术变量、培养产学研直送与产业重构者',
    reviewComment: '课题聚焦流体立体分场景与操作的真实环境问题，直面长难、复杂接触、不连续高梯度等场景痛点，问题定义清晰、方案完备，考核指标量化可验证，产业转化路径明确，"上货架" 价值突出',
    leaderOpinion: '同意推荐；关注影子运行、版本回退等风险应对措施的落实',
  },
  {
    order: 7,
    projectName: '多智能体组织智能形成与双向自增强学习',
    leader: '邓悦',
    subDirection: '理论与算法',
    score: '83.00',
    zScore: '0.22',
    strategic: false,
    majorProject: '本立项拟对接两类外部重大项目：一是面向多智能体具身智能前沿治理，聚焦单智能体间的任务分工、技能共享、经验迁移与协同自进化；二是面向国家多模态重大应用需求，围绕多尺度协同自适应大群体任务，研究动态任务规划、协同探测与感知、受限通信条件下的自组织协作、集群博弈与体系化决策',
    reviewComment: '项目直接对应学部 "智能体系统与真实世界交互" 方向，以多智能体组织智能为主线，回应多智能体研究中只看任务成功率、忽略净增益的薄弱环节，科学问题清晰，具有较好的创新潜力，可为学院相关项目提供算法与评测底座',
    leaderOpinion: '同意推荐；关注实验验证进度，中期检查前形成对比基线',
  },
  {
    order: 8,
    projectName: '持续学习与无上限上下文大模型',
    leader: '王培栋',
    subDirection: 'AI 模型',
    score: '82.00',
    zScore: '0.09',
    strategic: true,
    majorProject: '本项目（持续学习与无上限上下文大模型）旨在填补国际前沿空白，直接支撑学部 AI 全栈关键技术攻关项目中的持续学习方向，是学部构建可学习、可交互、可持续进化的完整智能闭环中的核心底座',
    reviewComment: '项目以持续学习和长上下文记忆为主线，直接对应 AI Core 对本体能力的研究定位，是值得持续布局的基础研究方向。项目将参数高效更新、经验回放、自我蒸馏与分层记忆结合，探索使用经验向长期能力转化的路径，具有较高的科学价值和应用潜力，研究方案充分',
    leaderOpinion: '同意推荐；产业对接以联合攻关项目落地为节点考核',
  },
]

export const notRecommendedRows: NotRecommendedRow[] = [
  {
    projectName: '多模态图像生成关键算法与智能体技术研究',
    leader: '王东升',
    subDirection: 'AI 模型',
    score: '81.67',
    zScore: '',
    reviewComment: '总分 81.67，未达本次推荐线（82.00）；蒸馏与智能体部分建议先在院外项目合作中培育',
    leaderOpinion: '同意不推荐结论；该方向与学部本次布局匹配度有限，建议项目按原方向先行培育，完善后参加下一批次申报',
  },
  {
    projectName: '面向物理 AI 基座模型的世界表征技术研究',
    leader: '黄聪',
    subDirection: '具身智能',
    score: '81.67',
    zScore: '',
    reviewComment: '总分 81.67，未达推荐线；建议明确与基座模型团队的研究边界',
    leaderOpinion: '同意不推荐结论；研究边界问题厘清后再报，届时竞争力会明显提升',
  },
  {
    projectName: '未来预测驱动的大模型自进化研究',
    leader: '段易通',
    subDirection: 'AI 模型',
    score: '81.00',
    zScore: '',
    reviewComment: '总分 81.00，未达推荐线；建议补充完善与现有自进化工作的差异化说明',
    leaderOpinion: '同意不推荐结论；差异化论证补充充分后，优先考虑下一批次',
  },
  {
    projectName: '面向人机协同操作的可迁移交互世界模型',
    leader: '徐良',
    subDirection: '具身智能',
    score: '77.67',
    zScore: '',
    reviewComment: '总分 77.67，未达推荐线；技术组合完整，建议强化迁移机制的原创性',
    leaderOpinion: '同意不推荐结论；迁移机制的原创性提升后再报备',
  },
  {
    projectName: '面向长期交互的智能体自进化方法研究',
    leader: '沈逸飞',
    subDirection: 'AI 模型',
    score: '76.67',
    zScore: '',
    reviewComment: '总分 76.67，未达推荐线；建议夯实长期交互基础问题的形式化',
    leaderOpinion: '同意不推荐结论；基础问题形式化做实后再报',
  },
  {
    projectName: '模型不可信条件下智能体安全防御研究',
    leader: '徐枭云',
    subDirection: 'AI 安全',
    score: '76.33',
    zScore: '-1.81',
    reviewComment: 'AI 安全为新所设方向，建议先以培育类项目积累',
    leaderOpinion: '同意不推荐结论；AI 安全方向学部以培育类项目另行支持，鼓励积累再申报',
  },
]
