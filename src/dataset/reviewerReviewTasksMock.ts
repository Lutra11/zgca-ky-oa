// 我的评审任务 — 演示 mock 数据
export type ReviewerProjectStatus = '待评审' | '草稿' | '已评审'
export type ReviewGrade = 'A' | 'B' | 'C' | 'D' | ''

export interface ReviewerMaterial {
  id: string
  name: string
  type: string
  format: string
  size: string
  uploader: string
  uploadedAt: string
  previewContent: string
  previewUrl: string
  downloadUrl: string
}

/** 申报书内容（同项目负责人填写的申报书，表7(a)-(f)，示例数据） */
export interface ReviewerApplicationForm {
  templateVersion: string
  fillDate: string
  projectName: string
  department: string
  subdirection: string
  projectCategory: string
  researchPeriod: string
  firstYearBudget: string
  abstract: string
  defensePptName: string
  unitName: string
  applicantName: string
  gender: string
  birthMonth: string
  education: string
  professionalTitle: string
  mobile: string
  email: string
  researchPurpose: string
  mainResearchContent: string
  researchFoundation: string
  annualTasks: string
  assessmentIndicators: string
  participants: Array<{
    category: string
    name: string
    unit: string
    gender: string
    major: string
    title: string
    responsibility: string
  }>
  totalBudget: number
  annualAllocations: Array<{ yearLabel: string; amount: number }>
  packageNote: string
  consentConfirmedAt: string
}

export interface ReviewerProject {
  id: string
  projectCode: string
  application: ReviewerApplicationForm
  projectName: string
  projectType: string
  projectBatch: string
  faculty: string
  subDirection: string
  projectLeader: string
  status: ReviewerProjectStatus
  evaluationStatus?: 'DRAFT' | 'SUBMITTED' | string
  evaluationSubmittedAt?: string
  submissionStatus: 'DRAFT' | 'SUBMITTED'
  isMaterialsSubmitted: boolean
  reviewDeadline: string
  plannedPeriod: string
  budget: string
  description: string
  materials: ReviewerMaterial[]
}

export interface ReviewDimensionValue {
  grade: ReviewGrade
  reason: string
}

export interface ReviewerScoreForm {
  projectProgress: ReviewDimensionValue
  resultOutput: ReviewDimensionValue
  teamCollaboration: ReviewDimensionValue
  overallComment: string
}

export const reviewRuleItems: string[] = [
  '重点支持与学部战略牵引方向强相关的申报，同等分数下优先推荐；',
  '兼顾基础培育与重大项目两类体量，分类评审、不跨类直接比较；',
  '外部申请人申报的评审标准与院内一致，评分不因身份加权；',
  '涉及算力资源较大额度的申报，请在可行性维度从严把握；',
  '评分建议拉开区分度，避免集中给中间档。',
]

export const reviewConfidentialityItems: string[] = [
  '评审材料（含申报书、附件、评审表）仅限本次评审使用，不得下载、转发或向任何第三方披露；',
  '评审意见、分数与排名在结果公布前保密，不得向申请人或其他专家透露；',
  '评审期间不得与相关申请人私下沟通评审事宜；',
  '与申请人存在合作、师生或其他利害关系的，应主动申报并回避；',
  '违反上述约定的，取消评审资格并按学院相关规定追责。',
]

function materials(leader: string): ReviewerMaterial[] {
  return [
    {
      id: 'm-1',
      name: '项目申报书.pdf',
      type: '申报材料',
      format: 'PDF',
      size: '3.42 MB',
      uploader: leader,
      uploadedAt: '2026-10-28 16:40',
      previewContent: '项目申报书全文，含研究背景、研究内容、技术路线与预期成果。',
      previewUrl: '',
      downloadUrl: '',
    },
    {
      id: 'm-2',
      name: '经费预算明细表.xlsx',
      type: '预算材料',
      format: 'XLSX',
      size: '128 KB',
      uploader: leader,
      uploadedAt: '2026-10-28 16:41',
      previewContent: '按年度拆分的经费预算与算力资源申请明细。',
      previewUrl: '',
      downloadUrl: '',
    },
    {
      id: 'm-3',
      name: '团队成员简历.pdf',
      type: '证明材料',
      format: 'PDF',
      size: '2.10 MB',
      uploader: leader,
      uploadedAt: '2026-10-28 16:42',
      previewContent: '项目负责人与核心成员简历及分工说明。',
      previewUrl: '',
      downloadUrl: '',
    },
  ]
}

/** 按种子生成申报书示例数据 */
function createApplicationForm(seed: {
  code: string
  name: string
  sub: string
  leader: string
}): ReviewerApplicationForm {
  return {
    templateVersion: '2026年3月修订版',
    fillDate: '2026-10-28',
    projectName: seed.name,
    department: 'AI核心学部',
    subdirection: seed.sub,
    projectCategory: '基础培育项目',
    researchPeriod: '2 年（2026-11 至 2028-10）',
    firstYearBudget: '20 万元',
    abstract: `围绕“${seed.name}”，研究面向学部战略牵引方向的关键科学问题与技术路线，形成可复现的原型系统、开放数据集与阶段性成果，支撑学部重点方向布局。`,
    defensePptName: `${seed.code}-答辩汇报.pptx`,
    unitName: '北京中关村学院',
    applicantName: seed.leader,
    gender: '男',
    birthMonth: '1992-06',
    education: '博士研究生',
    professionalTitle: '副研究员',
    mobile: '13800000000',
    email: 'leader@example.edu.cn',
    researchPurpose:
      '本课题面向学部战略牵引方向，瞄准领域内公认的关键瓶颈问题，研究具有原创性的理论与方法，力争在核心指标上取得突破，并为后续重大项目培育奠定基础。课题意义体现在三个方面：一是补齐现有方法在可信性、泛化性与安全性上的短板；二是沉淀可复用的算法框架与评测基准；三是培养一支稳定的研究梯队。',
    mainResearchContent:
      '（一）研究面向任务目标的问题建模与形式化方法，建立统一的任务描述空间；（二）研究核心算法与模型结构，重点攻关对齐、协同与验证机制，给出可证明的性能边界；（三）构建实验验证平台，在标准数据集与真实场景上开展系统性对比实验，形成完整的消融与误差分析；（四）沉淀开源工具链与评测基准，支撑学部内外团队复用。',
    researchFoundation:
      '申请人长期从事本方向研究，主持或骨干参与相关课题 3 项，发表高水平论文 10 余篇，具备完整的算法实现与实验验证条件；团队拥有所需算力资源与数据基础，前期已在小规模数据上完成关键模块的可行性验证。',
    annualTasks:
      '第一年度：完成任务建模与方法设计，实现核心算法原型，完成小规模验证，发表论文 1–2 篇；第二年度：完成系统级集成与真实场景验证，沉淀开源工具链与评测基准，形成总结报告并支撑结题。',
    assessmentIndicators:
      '发表高水平学术论文 3–4 篇（其中顶级会议/期刊不少于 2 篇）；申请发明专利 1 项；开源核心代码与评测基准 1 套；培养研究生 2 名；完成结题报告与成果演示。',
    participants: [
      { category: '项目负责人', name: seed.leader, unit: '北京中关村学院', gender: '男', major: '人工智能', title: '副研究员', responsibility: '项目总体负责，主持核心算法设计与验证' },
      { category: '成员', name: '刘一鸣', unit: '北京中关村学院', gender: '男', major: '计算机科学与技术', title: '助理研究员', responsibility: '算法实现与实验平台开发' },
      { category: '成员', name: '陈思羽', unit: '北京中关村学院', gender: '女', major: '人工智能', title: '博士后', responsibility: '数据构建与评测基准建设' },
      { category: '成员', name: '赵启明', unit: '北京中关村学院', gender: '男', major: '软件工程', title: '研究实习员', responsibility: '系统部署与文档整理' },
    ],
    totalBudget: 50,
    annualAllocations: [
      { yearLabel: '第一年度', amount: 20 },
      { yearLabel: '第二年度', amount: 30 },
    ],
    packageNote: '经费按包干制管理，主要用于算力资源、实验耗材与学术交流。',
    consentConfirmedAt: '2026-10-28 17:05',
  }
}

const taskSeeds: Array<{
  code: string
  name: string
  sub: string
  deadline: string
  status: ReviewerProjectStatus
  leader: string
}> = [
  { code: 'AP-2026-B1-001', name: '面向具身智能的可信对齐关键技术研究', sub: '具身智能', deadline: '2026-11-05 17:00', status: '待评审', leader: '王赫' },
  { code: 'AP-2026-B1-008', name: '多智能体协同决策与安全验证', sub: '多智能体', deadline: '2026-11-05 17:00', status: '待评审', leader: '杨耀东' },
  { code: 'AP-2026-B1-024', name: '具身大模型场景理解与任务规划', sub: '具身智能', deadline: '2026-11-02 17:00', status: '待评审', leader: '李雨桐' },
  { code: 'AP-2026-B1-004', name: '机器人操作技能的模仿学习泛化', sub: '具身智能', deadline: '2026-11-05 17:00', status: '草稿', leader: '闵耀森' },
  { code: 'AP-2026-B1-011', name: '大模型推理加速与显存优化', sub: '大模型系统', deadline: '2026-11-05 17:00', status: '已评审', leader: '陈宇轩' },
]

export const mockReviewTasks: ReviewerProject[] = taskSeeds.map((seed) => ({
  id: seed.code,
  application: createApplicationForm(seed),
  projectCode: seed.code,
  projectName: seed.name,
  projectType: '基础培育',
  projectBatch: '2026年第一批基础培育类',
  faculty: 'AI核心学部',
  subDirection: seed.sub,
  projectLeader: seed.leader,
  status: seed.status,
  evaluationStatus: seed.status === '已评审' ? 'SUBMITTED' : seed.status === '草稿' ? 'DRAFT' : '',
  evaluationSubmittedAt: seed.status === '已评审' ? '2026-11-04 15:20' : '',
  submissionStatus: 'SUBMITTED',
  isMaterialsSubmitted: true,
  reviewDeadline: seed.deadline,
  plannedPeriod: '2026-11 ~ 2028-10',
  budget: '48.0 万元',
  description: '面向重点支持方向开展关键技术攻关，形成可验证的原型系统与阶段性成果。',
  materials: materials(seed.leader),
}))

export function getMockReviewTasks(): ReviewerProject[] {
  return mockReviewTasks.map((task) => ({
    ...task,
    application: {
      ...task.application,
      participants: task.application.participants.map((participant) => ({ ...participant })),
      annualAllocations: task.application.annualAllocations.map((allocation) => ({ ...allocation })),
    },
    materials: task.materials.map((material) => ({ ...material })),
  }))
}
