export type InitiationProjectNode =
  | '待形式审查'
  | '待配置评审'
  | '评审中'
  | '待确认立项'
  | '已立项'

export type InitiationSubmitStatus = '已提交' | '草稿' | '已撤回'

export type InitiationBatchStatus = '未开始' | '申报中' | '已结束'

export interface InitiationGuideFileMock {
  name: string
  size: string
  url?: string
}

export interface InitiationBatchMockRow {
  id: string
  batchName: string
  batchCode: string
  batch_name?: string
  batch_code?: string
  project_category?: string
  batch_introduction?: string
  batch_apply_start?: string
  batch_apply_deadline?: string
  batch_limit_count?: number
  batch_guide_file?: InitiationGuideFileMock
  remark?: string
  year: number
  quarter: number
  applyPeriod: string
  status: InitiationBatchStatus
  submittedProjectCount: number
  reviewingCount: number
  establishedCount: number
  progress: number
  isCurrent: boolean
}

export interface InitiationProjectMockRow {
  id: string
  projectId: string
  projectName: string
  projectCode: string
  leader: string
  department: string
  submitTime: string
  currentNode: InitiationProjectNode
  reviewFinished: number
  reviewTotal: number
  submitStatus: InitiationSubmitStatus
  year: number
  quarter: number
}

export type InitiationToolKey = 'review' | 'settings' | 'import'

export interface InitiationToolEntry {
  key: InitiationToolKey
  title: string
  description: string
  countLabel?: string
  actionLabel: string
}

// TODO: 后续接入立项批次、项目列表、评审进度等后端接口后，统一替换本文件数据源。
export const initiationBatchMockRows: InitiationBatchMockRow[] = [
  {
    id: 'batch-2026-q3',
    batchName: '2026 年第 3 季度科研项目立项',
    batchCode: 'LXB-2026-Q3',
    batch_name: '2026 年第 3 季度科研项目立项批次',
    batch_code: 'LXB-2026-Q3',
    project_category: '纵向项目',
    batch_introduction: '本批次面向人工智能核心技术、AI 与科学技术交叉方向开放申报，重点支持具有明确研究基础、可形成阶段性成果并具备后续培育价值的科研项目。',
    batch_apply_start: '2026-07-01 09:00',
    batch_apply_deadline: '2026-09-20 18:00',
    batch_limit_count: 0,
    batch_guide_file: {
      name: '2026 年第 3 季度科研项目立项指南.pdf',
      size: '2.8 MB',
    },
    remark: '管理员内部备注：当前批次重点关注跨学科原创性项目。',
    year: 2026,
    quarter: 3,
    applyPeriod: '2026.07.01-2026.09.20',
    status: '申报中',
    submittedProjectCount: 10,
    reviewingCount: 3,
    establishedCount: 0,
    progress: 38,
    isCurrent: true,
  },
  {
    id: 'batch-2026-q2',
    batchName: '2026 年第 2 季度科研项目立项',
    batchCode: 'LXB-2026-Q2',
    batch_name: '2026 年第 2 季度科研项目立项批次',
    batch_code: 'LXB-2026-Q2',
    project_category: '横向项目',
    batch_introduction: '本批次主要支持与外部单位协同开展的横向科研项目，鼓励围绕产业需求、技术服务与成果转化形成可落地的研究方案。',
    batch_apply_start: '2026-04-01 09:00',
    batch_apply_deadline: '2026-06-20 18:00',
    batch_limit_count: 20,
    batch_guide_file: {
      name: '2026 年第 2 季度科研项目立项指南.pdf',
      size: '2.5 MB',
    },
    remark: '管理员内部备注：已完成批次，仅用于历史查询。',
    year: 2026,
    quarter: 2,
    applyPeriod: '2026.04.01-2026.06.20',
    status: '已结束',
    submittedProjectCount: 24,
    reviewingCount: 0,
    establishedCount: 19,
    progress: 100,
    isCurrent: false,
  },
  {
    id: 'batch-2026-q1',
    batchName: '2026 年第 1 季度科研项目立项',
    batchCode: 'LXB-2026-Q1',
    batch_name: '2026 年第 1 季度科研项目立项批次',
    batch_code: 'LXB-2026-Q1',
    project_category: '校内项目',
    batch_introduction: '本批次用于校内科研培育项目申报，重点关注青年教师科研启动、跨学院协同探索和前期研究基础建设。',
    batch_apply_start: '2026-01-05 09:00',
    batch_apply_deadline: '2026-03-20 18:00',
    batch_limit_count: 0,
    batch_guide_file: {
      name: '2026 年第 1 季度科研项目立项指南.pdf',
      size: '2.2 MB',
    },
    remark: '管理员内部备注：已完成批次，仅用于历史查询。',
    year: 2026,
    quarter: 1,
    applyPeriod: '2026.01.05-2026.03.20',
    status: '已结束',
    submittedProjectCount: 18,
    reviewingCount: 0,
    establishedCount: 15,
    progress: 100,
    isCurrent: false,
  },
  {
    id: 'batch-2025-q4',
    batchName: '2025 年第 4 季度科研项目立项',
    batchCode: 'LXB-2025-Q4',
    batch_name: '2025 年第 4 季度科研项目立项批次',
    batch_code: 'LXB-2025-Q4',
    project_category: '纵向项目',
    batch_introduction: '本批次面向纵向科研项目储备和培育，支持围绕国家及北京市重点方向开展前期研究和申报准备。',
    batch_apply_start: '2025-10-08 09:00',
    batch_apply_deadline: '2025-12-20 18:00',
    batch_limit_count: 15,
    batch_guide_file: {
      name: '2025 年第 4 季度科研项目立项指南.pdf',
      size: '2.4 MB',
    },
    remark: '管理员内部备注：已完成批次，仅用于历史查询。',
    year: 2025,
    quarter: 4,
    applyPeriod: '2025.10.08-2025.12.20',
    status: '已结束',
    submittedProjectCount: 21,
    reviewingCount: 0,
    establishedCount: 17,
    progress: 100,
    isCurrent: false,
  },
  {
    id: 'batch-2025-q3',
    batchName: '2025 年第 3 季度科研项目立项',
    batchCode: 'LXB-2025-Q3',
    batch_name: '2025 年第 3 季度科研项目立项批次',
    batch_code: 'LXB-2025-Q3',
    project_category: '横向项目',
    batch_introduction: '本批次聚焦横向合作项目立项归集，支持校企联合研发、咨询服务、技术验证和应用示范类项目申报。',
    batch_apply_start: '2025-07-01 09:00',
    batch_apply_deadline: '2025-09-22 18:00',
    batch_limit_count: 18,
    batch_guide_file: {
      name: '2025 年第 3 季度科研项目立项指南.pdf',
      size: '2.3 MB',
    },
    remark: '管理员内部备注：已完成批次，仅用于历史查询。',
    year: 2025,
    quarter: 3,
    applyPeriod: '2025.07.01-2025.09.22',
    status: '已结束',
    submittedProjectCount: 16,
    reviewingCount: 0,
    establishedCount: 13,
    progress: 100,
    isCurrent: false,
  },
  {
    id: 'batch-2025-q2',
    batchName: '2025 年第 2 季度科研项目立项',
    batchCode: 'LXB-2025-Q2',
    batch_name: '2025 年第 2 季度科研项目立项批次',
    batch_code: 'LXB-2025-Q2',
    project_category: '纵向项目',
    batch_introduction: '本批次用于纵向项目申报前的校内遴选与过程管理，鼓励提交研究目标清晰、团队基础扎实的项目方案。',
    batch_apply_start: '2025-04-01 09:00',
    batch_apply_deadline: '2025-06-20 18:00',
    batch_limit_count: 0,
    batch_guide_file: {
      name: '2025 年第 2 季度科研项目立项指南.pdf',
      size: '2.1 MB',
    },
    remark: '管理员内部备注：已完成批次，仅用于历史查询。',
    year: 2025,
    quarter: 2,
    applyPeriod: '2025.04.01-2025.06.20',
    status: '已结束',
    submittedProjectCount: 23,
    reviewingCount: 0,
    establishedCount: 18,
    progress: 100,
    isCurrent: false,
  },
  {
    id: 'batch-2025-q1',
    batchName: '2025 年第 1 季度科研项目立项',
    batchCode: 'LXB-2025-Q1',
    batch_name: '2025 年第 1 季度科研项目立项批次',
    batch_code: 'LXB-2025-Q1',
    project_category: '校内项目',
    batch_introduction: '本批次用于校内科研项目年度启动申报，重点支持基础研究积累、教学科研融合和科研团队建设类项目。',
    batch_apply_start: '2025-01-06 09:00',
    batch_apply_deadline: '2025-03-21 18:00',
    batch_limit_count: 0,
    batch_guide_file: {
      name: '2025 年第 1 季度科研项目立项指南.pdf',
      size: '2.0 MB',
    },
    remark: '管理员内部备注：已完成批次，仅用于历史查询。',
    year: 2025,
    quarter: 1,
    applyPeriod: '2025.01.06-2025.03.21',
    status: '已结束',
    submittedProjectCount: 14,
    reviewingCount: 0,
    establishedCount: 11,
    progress: 100,
    isCurrent: false,
  },
  {
    id: 'batch-2024-q4',
    batchName: '2024 年第 4 季度科研项目立项',
    batchCode: 'LXB-2024-Q4',
    batch_name: '2024 年第 4 季度科研项目立项批次',
    batch_code: 'LXB-2024-Q4',
    project_category: '纵向项目',
    batch_introduction: '本批次为历史纵向科研项目立项批次，保留用于项目负责人查看批次要求、申报周期和指南材料。',
    batch_apply_start: '2024-10-08 09:00',
    batch_apply_deadline: '2024-12-20 18:00',
    batch_limit_count: 16,
    batch_guide_file: {
      name: '2024 年第 4 季度科研项目立项指南.pdf',
      size: '1.9 MB',
    },
    remark: '管理员内部备注：已完成批次，仅用于历史查询。',
    year: 2024,
    quarter: 4,
    applyPeriod: '2024.10.08-2024.12.20',
    status: '已结束',
    submittedProjectCount: 19,
    reviewingCount: 0,
    establishedCount: 16,
    progress: 100,
    isCurrent: false,
  },
]

export const initiationProjectMockRows: InitiationProjectMockRow[] = [
  {
    id: 'init-2026-q3-001',
    projectId: 'PMJ240401',
    projectName: '多模态脑影像在阿尔茨海默病早期诊断中的应用研究',
    projectCode: 'PMJ240401',
    leader: '张天宇',
    department: '基础研究部',
    submitTime: '2026-08-18 09:30',
    currentNode: '待形式审查',
    reviewFinished: 0,
    reviewTotal: 0,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-002',
    projectId: 'PMJ240402',
    projectName: '基于深度学习的量子材料力学性能预测方法研究',
    projectCode: 'PMJ240402',
    leader: '李思远',
    department: '应用研究部',
    submitTime: '2026-08-18 14:20',
    currentNode: '评审中',
    reviewFinished: 4,
    reviewTotal: 6,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-003',
    projectId: 'PMJ240403',
    projectName: '肿瘤微环境调控机制研究',
    projectCode: 'PMJ240403',
    leader: '王欣然',
    department: '生命与医学学部',
    submitTime: '2026-08-19 10:05',
    currentNode: '待配置评审',
    reviewFinished: 0,
    reviewTotal: 0,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-004',
    projectId: 'PMJ240404',
    projectName: '工业机器人精密装配控制方法',
    projectCode: 'PMJ240404',
    leader: '刘上铭',
    department: '智能制造中心',
    submitTime: '2026-08-20 11:40',
    currentNode: '待确认立项',
    reviewFinished: 8,
    reviewTotal: 10,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-005',
    projectId: 'PMJ240405',
    projectName: '药物靶标识别深度挖掘与验证研究',
    projectCode: 'PMJ240405',
    leader: '刘博士',
    department: '生命科学中心',
    submitTime: '2026-08-21 09:12',
    currentNode: '待形式审查',
    reviewFinished: 0,
    reviewTotal: 0,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-006',
    projectId: 'PMJ240406',
    projectName: '固态电池电解质界面优化研究',
    projectCode: 'PMJ240406',
    leader: '陈晓阳',
    department: '新能源材料中心',
    submitTime: '2026-08-21 16:30',
    currentNode: '评审中',
    reviewFinished: 5,
    reviewTotal: 8,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-007',
    projectId: 'PMJ240407',
    projectName: '医学知识图谱辅助诊断模型研究',
    projectCode: 'PMJ240407',
    leader: '何文清',
    department: 'AI 医疗研究部',
    submitTime: '2026-08-22 08:50',
    currentNode: '待配置评审',
    reviewFinished: 0,
    reviewTotal: 0,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-008',
    projectId: 'PMJ240408',
    projectName: '物理约束神经网络在复杂场景中的泛化研究',
    projectCode: 'PMJ240408',
    leader: '唐若琳',
    department: 'AI 物理研究部',
    submitTime: '2026-08-22 15:18',
    currentNode: '待确认立项',
    reviewFinished: 10,
    reviewTotal: 10,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-009',
    projectId: 'PMJ240409',
    projectName: '细胞免疫应答多组学分析平台构建',
    projectCode: 'PMJ240409',
    leader: '陆一鸣',
    department: '生命与医学学部',
    submitTime: '2026-08-23 10:22',
    currentNode: '已立项',
    reviewFinished: 6,
    reviewTotal: 6,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-010',
    projectId: 'PMJ240410',
    projectName: '高端制造设备状态感知与预测维护系统研究',
    projectCode: 'PMJ240410',
    leader: '邹博',
    department: '智能制造中心',
    submitTime: '2026-08-23 13:45',
    currentNode: '评审中',
    reviewFinished: 3,
    reviewTotal: 6,
    submitStatus: '已提交',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-draft-001',
    projectId: 'PMJ240411',
    projectName: '高效催化材料界面调控与性能提升研究',
    projectCode: 'PMJ240411',
    leader: '孙雨娜',
    department: '应用研究部',
    submitTime: '',
    currentNode: '待形式审查',
    reviewFinished: 0,
    reviewTotal: 0,
    submitStatus: '草稿',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q3-withdrawn-001',
    projectId: 'PMJ240412',
    projectName: '可信数据空间访问控制与隐私计算方法',
    projectCode: 'PMJ240412',
    leader: '赵天宇',
    department: '可信计算中心',
    submitTime: '2026-08-18 17:20',
    currentNode: '待形式审查',
    reviewFinished: 0,
    reviewTotal: 0,
    submitStatus: '已撤回',
    year: 2026,
    quarter: 3,
  },
  {
    id: 'init-2026-q2-001',
    projectId: 'PMJ240413',
    projectName: '柔性装配生产线动态调度策略研究',
    projectCode: 'PMJ240413',
    leader: '罗敏',
    department: '智能制造中心',
    submitTime: '2026-05-12 09:42',
    currentNode: '已立项',
    reviewFinished: 8,
    reviewTotal: 8,
    submitStatus: '已提交',
    year: 2026,
    quarter: 2,
  },
  {
    id: 'init-2026-q2-002',
    projectId: 'PMJ240414',
    projectName: '智能问诊大模型安全评测体系研究',
    projectCode: 'PMJ240414',
    leader: '高铭',
    department: 'AI 医疗研究部',
    submitTime: '2026-05-14 11:18',
    currentNode: '已立项',
    reviewFinished: 6,
    reviewTotal: 6,
    submitStatus: '已提交',
    year: 2026,
    quarter: 2,
  },
  {
    id: 'init-2025-q4-001',
    projectId: 'PMJ240415',
    projectName: '复杂系统不确定性建模与智能优化方法研究',
    projectCode: 'PMJ240415',
    leader: '周景然',
    department: '数学科学中心',
    submitTime: '2025-11-03 10:10',
    currentNode: '已立项',
    reviewFinished: 10,
    reviewTotal: 10,
    submitStatus: '已提交',
    year: 2025,
    quarter: 4,
  },
]

export const initiationYearOptions = [2026, 2025, 2024]

export const initiationQuarterOptions = [1, 2, 3, 4]

export const initiationToolEntries: InitiationToolEntry[] = [
  {
    key: 'review',
    title: '申报审查',
    description: '核验申报材料完整性与形式要求，退回或提交至评审环节。',
    countLabel: '3 项待处理',
    actionLabel: '进入审查',
  },
  {
    key: 'settings',
    title: '评审设置',
    description: '配置评审规则、指标权重、评委任务与评审起止时间。',
    countLabel: '2 项待配置',
    actionLabel: '进入设置',
  },
  {
    key: 'import',
    title: '外部项目导入',
    description: '批量导入线下或外部已立项项目，并完善项目基础档案。',
    actionLabel: '开始导入',
  },
]
