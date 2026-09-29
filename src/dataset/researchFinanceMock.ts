import type { LoggedInUser, RoleKey } from '../types/auth'

export type FundNature = 'DIRECT' | 'INDIRECT'
export type RiskLevel = 'NORMAL' | 'ATTENTION' | 'WARNING'
export type SyncStatus = 'WAITING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'DELAYED'
export type PayableType =
  | 'PROCUREMENT'
  | 'CONTRACT'
  | 'COMPUTE_API'
  | 'INTELLECTUAL_PROPERTY'
  | 'INTERN_SALARY'

export type FinanceViewKey =
  | 'workbench'
  | 'ledger'
  | 'receipts'
  | 'budget'
  | 'expenses'
  | 'alerts'
  | 'reconciliation'
  | 'reports'
  | 'settlement'
  | 'sync'
  | 'overview'
  | 'budget-adjustments'
  | 'sync-records'

export interface ProjectFinanceSummary {
  projectId: string
  projectCode: string
  projectName: string
  leaderId: string
  leaderName: string
  departmentId: string
  departmentName: string
  projectStatus: string
  projectPeriod: string
  totalBudget: number
  paidAmount: number
  unpaidPayableAmount: number
  occupiedAmount: number
  availableAmount: number
  actualPaymentRate: number
  budgetOccupancyRate: number
  availableRate: number
  riskLevel: RiskLevel
  lastSyncTime?: string
  syncStatus?: SyncStatus
  isOwnerDemo?: boolean
}

export interface BudgetSubject {
  id: string
  projectId: string
  parentId?: string
  level: 1 | 2
  code: string
  name: string
  fundNature: FundNature
  budgetAmount: number
  paidAmount: number
  unpaidPayableAmount: number
  occupiedAmount: number
  availableAmount: number
  occupancyRate: number
}

export interface PaymentDetailRecord {
  id: string
  projectId: string
  paymentNo: string
  paymentDate: string
  payee: string
  summary: string
  primarySubject: string
  secondarySubject: string
  amount: number
  status: string
  voucherNo: string
  syncTime: string
}

export interface PayableDetailRecord {
  id: string
  projectId: string
  payableNo: string
  payableType: PayableType
  confirmDate: string
  supplier: string
  summary: string
  primarySubject: string
  secondarySubject: string
  amount: number
  freezeStatus: string
  expectedPaymentDate: string
  syncTime: string
}

export interface BudgetAdjustmentRecord {
  id: string
  projectId: string
  projectCode: string
  projectName: string
  adjustmentNo: string
  version: string
  subject: string
  fromSubject: string
  toSubject: string
  beforeAmount: number
  afterAmount: number
  adjustmentAmount: number
  reason: string
  applicant: string
  applyTime: string
  status: string
  yonyouSyncStatus: string
  syncTime?: string
}

export interface FinanceAlertRecord {
  id: string
  projectId: string
  projectCode: string
  projectName: string
  alertType: string
  level: 'INFO' | 'WARNING' | 'HIGH'
  content: string
  triggeredAt: string
  recipients: string
  remindStatus: string
  processStatus: string
}

export interface FinanceSyncRecord {
  id: string
  syncBatchNo: string
  dataType: string
  direction: '科研平台 → 用友' | '用友 → 科研平台'
  projectCode: string
  startedAt: string
  completedAt?: string
  status: SyncStatus
  dataCount: number
  errorMessage?: string
  retryCount: number
}

export interface ProjectFinanceDetail {
  summary: ProjectFinanceSummary
  budgetSubjects: BudgetSubject[]
  payments: PaymentDetailRecord[]
  payables: PayableDetailRecord[]
  adjustments: BudgetAdjustmentRecord[]
  alerts: FinanceAlertRecord[]
}

export interface FinanceProjectFilterModel {
  keyword: string
  departmentId: string | 'all'
  projectStatus: string | 'all'
  riskLevel: RiskLevel | 'all'
}

type ProjectFinanceSeed = Omit<
  ProjectFinanceSummary,
  'occupiedAmount' | 'availableAmount' | 'actualPaymentRate' | 'budgetOccupancyRate' | 'availableRate'
>

export const researchFinanceMockMode = true

export const researchFinanceApiEndpoints = {
  overview: 'GET /api/research-finance/overview',
  projects: 'GET /api/research-finance/projects',
  projectDetail: 'GET /api/research-finance/projects/{projectId}',
  budgetSubjects: 'GET /api/research-finance/projects/{projectId}/budget-subjects',
  payments: 'GET /api/research-finance/projects/{projectId}/payments',
  payables: 'GET /api/research-finance/projects/{projectId}/payables',
  projectAdjustments: 'GET /api/research-finance/projects/{projectId}/adjustments',
  projectAlerts: 'GET /api/research-finance/projects/{projectId}/alerts',
  adjustments: 'GET /api/research-finance/adjustments',
  createAdjustment: 'POST /api/research-finance/adjustments',
  adjustmentPush: 'POST /api/research-finance/adjustments/{adjustmentId}/push',
  alerts: 'GET /api/research-finance/alerts',
  updateAlertStatus: 'PUT /api/research-finance/alerts/{alertId}/status',
  syncRecords: 'GET /api/research-finance/sync-records',
  retrySyncRecord: 'POST /api/research-finance/sync-records/{syncRecordId}/retry',
} as const

const projectSeeds: ProjectFinanceSeed[] = [
  {
    projectId: 'finance-prj-001',
    projectCode: 'JC2608005',
    projectName: '基础培育类项目经费执行示例',
    leaderId: 'u006',
    leaderName: '赵同学',
    departmentId: 'dep-ai',
    departmentName: '人工智能学院',
    projectStatus: '在研',
    projectPeriod: '2026.07—2027.06',
    totalBudget: 500000,
    paidAmount: 149060.23,
    unpaidPayableAmount: 73205.318819,
    riskLevel: 'ATTENTION',
    lastSyncTime: '2026-08-27 09:30',
    syncStatus: 'SUCCESS',
    isOwnerDemo: true,
  },
  {
    projectId: 'finance-prj-002',
    projectCode: 'ZX2608001',
    projectName: '多肽分子预测和设计算法研究',
    leaderId: 'u006',
    leaderName: '赵同学',
    departmentId: 'dep-life',
    departmentName: '生命科学中心',
    projectStatus: '在研',
    projectPeriod: '2026.04—2027.03',
    totalBudget: 900000,
    paidAmount: 382000,
    unpaidPayableAmount: 76000,
    riskLevel: 'NORMAL',
    lastSyncTime: '2026-08-27 09:10',
    syncStatus: 'SUCCESS',
    isOwnerDemo: true,
  },
  {
    projectId: 'finance-prj-003',
    projectCode: 'JC2608003',
    projectName: '生成式语言模型水印加密技术研究',
    leaderId: 'u004',
    leaderName: '王老师',
    departmentId: 'dep-engineering',
    departmentName: '智能工程中心',
    projectStatus: '在研',
    projectPeriod: '2026.05—2027.05',
    totalBudget: 650000,
    paidAmount: 280000,
    unpaidPayableAmount: 95000,
    riskLevel: 'ATTENTION',
    lastSyncTime: '2026-08-27 07:08',
    syncStatus: 'DELAYED',
  },
  {
    projectId: 'finance-prj-004',
    projectCode: 'YY2607003',
    projectName: '超级软件智能应用平台关键技术研究',
    leaderId: 'u003',
    leaderName: '陈教授',
    departmentId: 'dep-ai',
    departmentName: '人工智能学院',
    projectStatus: '临近结题',
    projectPeriod: '2025.10—2026.11',
    totalBudget: 800000,
    paidAmount: 640000,
    unpaidPayableAmount: 100000,
    riskLevel: 'WARNING',
    lastSyncTime: '2026-08-27 09:25',
    syncStatus: 'SUCCESS',
  },
  {
    projectId: 'finance-prj-005',
    projectCode: 'HX2608001',
    projectName: '基于多模态大语言模型的游戏智能体研究',
    leaderId: 'u001',
    leaderName: '张晓明',
    departmentId: 'dep-humanities',
    departmentName: '人文智能研究院',
    projectStatus: '在研',
    projectPeriod: '2026.03—2027.02',
    totalBudget: 720000,
    paidAmount: 515000,
    unpaidPayableAmount: 150000,
    riskLevel: 'WARNING',
    lastSyncTime: '2026-08-27 08:45',
    syncStatus: 'SUCCESS',
  },
  {
    projectId: 'finance-prj-006',
    projectCode: 'YY2607005',
    projectName: '产业级应用后训练关键技术研究',
    leaderId: 'u002',
    leaderName: '李主任',
    departmentId: 'dep-industry',
    departmentName: '产业研究中心',
    projectStatus: '在研',
    projectPeriod: '2026.01—2026.12',
    totalBudget: 680000,
    paidAmount: 360000,
    unpaidPayableAmount: 180000,
    riskLevel: 'ATTENTION',
    lastSyncTime: '2026-08-27 09:18',
    syncStatus: 'SUCCESS',
  },
  {
    projectId: 'finance-prj-007',
    projectCode: 'ZX2607004',
    projectName: '智能制造场景工业机器人协同控制方法',
    leaderId: 'u004',
    leaderName: '王老师',
    departmentId: 'dep-engineering',
    departmentName: '智能工程中心',
    projectStatus: '在研',
    projectPeriod: '2026.02—2027.01',
    totalBudget: 760000,
    paidAmount: 238000,
    unpaidPayableAmount: 58000,
    riskLevel: 'NORMAL',
    lastSyncTime: '2026-08-27 09:02',
    syncStatus: 'SUCCESS',
  },
  {
    projectId: 'finance-prj-008',
    projectCode: 'ZX2607002',
    projectName: '复杂系统可信智能推理与验证技术',
    leaderId: 'u007',
    leaderName: '周主任',
    departmentId: 'dep-research',
    departmentName: '科研部',
    projectStatus: '已结题',
    projectPeriod: '2025.01—2026.06',
    totalBudget: 580000,
    paidAmount: 512000,
    unpaidPayableAmount: 0,
    riskLevel: 'NORMAL',
    lastSyncTime: '2026-08-26 18:30',
    syncStatus: 'SUCCESS',
  },
]

function toRate(numerator: number, denominator: number) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0
}

function withDerivedFinance(seed: ProjectFinanceSeed): ProjectFinanceSummary {
  const occupiedAmount = Number((seed.paidAmount + seed.unpaidPayableAmount).toFixed(6))
  const availableAmount = Number((seed.totalBudget - occupiedAmount).toFixed(6))

  return {
    ...seed,
    occupiedAmount,
    availableAmount,
    actualPaymentRate: toRate(seed.paidAmount, seed.totalBudget),
    budgetOccupancyRate: toRate(occupiedAmount, seed.totalBudget),
    availableRate: toRate(availableAmount, seed.totalBudget),
  }
}

export const projectFinanceSummaries: ProjectFinanceSummary[] = projectSeeds.map(withDerivedFinance)

function createSubject(
  projectId: string,
  code: string,
  name: string,
  level: 1 | 2,
  fundNature: FundNature,
  budgetAmount: number,
  paidAmount: number,
  unpaidPayableAmount: number,
  parentId?: string,
): BudgetSubject {
  const occupiedAmount = Number((paidAmount + unpaidPayableAmount).toFixed(6))
  const availableAmount = Number((budgetAmount - occupiedAmount).toFixed(6))
  const id = `${projectId}-${code}`

  return {
    id,
    projectId,
    parentId,
    level,
    code,
    name,
    fundNature,
    budgetAmount,
    paidAmount,
    unpaidPayableAmount,
    occupiedAmount,
    availableAmount,
    occupancyRate: toRate(occupiedAmount, budgetAmount),
  }
}

function createJc2608005Budget(): BudgetSubject[] {
  const projectId = 'finance-prj-001'
  const s1 = createSubject(projectId, '01', '设备费', 1, 'DIRECT', 120000, 2199, 39000)
  const s2 = createSubject(projectId, '02', '业务费', 1, 'DIRECT', 280000, 89093.4, 34205.318819)
  const s3 = createSubject(projectId, '03', '劳务费', 1, 'DIRECT', 100000, 57767.83, 0)
  const s4 = createSubject(projectId, '04', '外协费', 1, 'DIRECT', 0, 0, 0)
  const s5 = createSubject(projectId, '05', '间接经费', 1, 'INDIRECT', 0, 0, 0)

  return [
    s1,
    createSubject(projectId, '0101', '笔记本电脑／IT设备', 2, 'DIRECT', 80000, 2199, 39000, s1.id),
    createSubject(projectId, '0102', '科研设备', 2, 'DIRECT', 40000, 0, 0, s1.id),
    s2,
    createSubject(projectId, '0201', '算力购买租用', 2, 'DIRECT', 60000, 0, 0, s2.id),
    createSubject(projectId, '0202', '材料费', 2, 'DIRECT', 20000, 0, 0, s2.id),
    createSubject(projectId, '0203', '测试化验加工费', 2, 'DIRECT', 30000, 0, 0, s2.id),
    createSubject(projectId, '0204', '差旅费', 2, 'DIRECT', 60000, 52477.53, 0, s2.id),
    createSubject(projectId, '0205', '国际合作与交流费', 2, 'DIRECT', 20000, 0, 0, s2.id),
    createSubject(projectId, '0206', '出版／文献／信息传播费', 2, 'DIRECT', 30000, 200, 0, s2.id),
    createSubject(projectId, '0207', '快递费', 2, 'DIRECT', 10000, 488.75, 0, s2.id),
    createSubject(projectId, '0208', '软件服务', 2, 'DIRECT', 30000, 1376.36, 0, s2.id),
    createSubject(projectId, '0209', 'API服务', 2, 'DIRECT', 100000, 34163.4, 34205.318819, s2.id),
    s3,
    createSubject(projectId, '0301', '项目实习生工资', 2, 'DIRECT', 100000, 57767.83, 0, s3.id),
    s4,
    s5,
  ]
}

function createGenericBudget(project: ProjectFinanceSummary): BudgetSubject[] {
  const primaryConfigs = [
    {
      code: '01',
      name: '设备费',
      fundNature: 'DIRECT' as const,
      ratio: 0.18,
      children: ['笔记本电脑／IT设备', '科研设备'],
    },
    {
      code: '02',
      name: '业务费',
      fundNature: 'DIRECT' as const,
      ratio: 0.45,
      children: ['算力购买租用', '材料费', '测试化验加工费', '差旅费', '会议费', '软件服务', 'API服务'],
    },
    {
      code: '03',
      name: '劳务费',
      fundNature: 'DIRECT' as const,
      ratio: 0.22,
      children: ['项目实习生工资', '专家咨询费'],
    },
    {
      code: '04',
      name: '外协费',
      fundNature: 'DIRECT' as const,
      ratio: 0.08,
      children: ['委托开发服务', '外部测试服务'],
    },
    {
      code: '05',
      name: '间接经费',
      fundNature: 'INDIRECT' as const,
      ratio: 0.07,
      children: ['管理服务费'],
    },
  ]

  return primaryConfigs.flatMap((config) => {
    const primaryBudget = Number((project.totalBudget * config.ratio).toFixed(2))
    const primaryPaid = Number((project.paidAmount * config.ratio).toFixed(2))
    const primaryUnpaid = Number((project.unpaidPayableAmount * config.ratio).toFixed(2))
    const primary = createSubject(
      project.projectId,
      config.code,
      config.name,
      1,
      config.fundNature,
      primaryBudget,
      primaryPaid,
      primaryUnpaid,
    )

    const childRows = config.children.map((name, index) => {
      const childBudget = Number((primaryBudget / config.children.length).toFixed(2))
      const childPaid = Number((primaryPaid / config.children.length).toFixed(2))
      const childUnpaid = Number((primaryUnpaid / config.children.length).toFixed(2))

      return createSubject(
        project.projectId,
        `${config.code}${String(index + 1).padStart(2, '0')}`,
        name,
        2,
        config.fundNature,
        childBudget,
        childPaid,
        childUnpaid,
        primary.id,
      )
    })

    return [primary, ...childRows]
  })
}

export const budgetSubjectsByProjectId: Record<string, BudgetSubject[]> = Object.fromEntries(
  projectFinanceSummaries.map((project) => [
    project.projectId,
    project.projectId === 'finance-prj-001' ? createJc2608005Budget() : createGenericBudget(project),
  ]),
)

export const paymentDetailRecords: PaymentDetailRecord[] = [
  {
    id: 'pay-001',
    projectId: 'finance-prj-001',
    paymentNo: 'FK20260821018',
    paymentDate: '2026-08-21',
    payee: '苏州智算科技有限公司',
    summary: 'API服务费（7月）',
    primarySubject: '业务费',
    secondarySubject: 'API服务',
    amount: 34163.4,
    status: '已付款',
    voucherNo: 'YYPZ-20260821-018',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'pay-002',
    projectId: 'finance-prj-001',
    paymentNo: 'FK20260812007',
    paymentDate: '2026-08-12',
    payee: '中国铁路上海局集团',
    summary: '项目调研差旅',
    primarySubject: '业务费',
    secondarySubject: '差旅费',
    amount: 28420,
    status: '已付款',
    voucherNo: 'YYPZ-20260812-007',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'pay-003',
    projectId: 'finance-prj-001',
    paymentNo: 'FK20260726031',
    paymentDate: '2026-07-26',
    payee: '项目实习生批次工资',
    summary: '实习生劳务（7月）',
    primarySubject: '劳务费',
    secondarySubject: '项目实习生工资',
    amount: 32767.83,
    status: '已付款',
    voucherNo: 'YYPZ-20260726-031',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'pay-004',
    projectId: 'finance-prj-001',
    paymentNo: 'FK20260711012',
    paymentDate: '2026-07-11',
    payee: '上海云程会务有限公司',
    summary: '研究交流差旅及会议',
    primarySubject: '业务费',
    secondarySubject: '差旅费',
    amount: 24057.53,
    status: '已付款',
    voucherNo: 'YYPZ-20260711-012',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'pay-005',
    projectId: 'finance-prj-001',
    paymentNo: 'FK20260702008',
    paymentDate: '2026-07-02',
    payee: '项目实习生批次工资',
    summary: '实习生劳务（6月）',
    primarySubject: '劳务费',
    secondarySubject: '项目实习生工资',
    amount: 25000,
    status: '已付款',
    voucherNo: 'YYPZ-20260702-008',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'pay-006',
    projectId: 'finance-prj-001',
    paymentNo: 'FK20260615004',
    paymentDate: '2026-06-15',
    payee: '京东科技信息有限公司',
    summary: '笔记本电脑配件',
    primarySubject: '设备费',
    secondarySubject: '笔记本电脑／IT设备',
    amount: 2199,
    status: '已付款',
    voucherNo: 'YYPZ-20260615-004',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'pay-007',
    projectId: 'finance-prj-002',
    paymentNo: 'FK20260819013',
    paymentDate: '2026-08-19',
    payee: '北京生命数据科技有限公司',
    summary: '生物信息计算服务',
    primarySubject: '业务费',
    secondarySubject: '算力购买租用',
    amount: 86000,
    status: '已付款',
    voucherNo: 'YYPZ-20260819-013',
    syncTime: '2026-08-27 09:10',
  },
  {
    id: 'pay-008',
    projectId: 'finance-prj-004',
    paymentNo: 'FK20260809026',
    paymentDate: '2026-08-09',
    payee: '中关村应用软件联盟',
    summary: '平台测试服务费',
    primarySubject: '外协费',
    secondarySubject: '外部测试服务',
    amount: 120000,
    status: '已付款',
    voucherNo: 'YYPZ-20260809-026',
    syncTime: '2026-08-27 09:25',
  },
]

export const payableDetailRecords: PayableDetailRecord[] = [
  {
    id: 'payable-001',
    projectId: 'finance-prj-001',
    payableNo: 'YF20260825011',
    payableType: 'PROCUREMENT',
    confirmDate: '2026-08-25',
    supplier: '京东科技信息有限公司',
    summary: '研发笔记本电脑采购',
    primarySubject: '设备费',
    secondarySubject: '笔记本电脑／IT设备',
    amount: 39000,
    freezeStatus: '已冻结',
    expectedPaymentDate: '2026-09-05',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'payable-002',
    projectId: 'finance-prj-001',
    payableNo: 'YF20260823006',
    payableType: 'COMPUTE_API',
    confirmDate: '2026-08-23',
    supplier: '学校信息化部',
    summary: 'API统采分摊（截至7月）',
    primarySubject: '业务费',
    secondarySubject: 'API服务',
    amount: 34205.318819,
    freezeStatus: '已冻结',
    expectedPaymentDate: '2026-09-10',
    syncTime: '2026-08-27 09:30',
  },
  {
    id: 'payable-003',
    projectId: 'finance-prj-002',
    payableNo: 'YF20260822009',
    payableType: 'CONTRACT',
    confirmDate: '2026-08-22',
    supplier: '北京生命数据科技有限公司',
    summary: '蛋白结构预测服务合同尾款',
    primarySubject: '业务费',
    secondarySubject: '测试化验加工费',
    amount: 76000,
    freezeStatus: '已冻结',
    expectedPaymentDate: '2026-09-12',
    syncTime: '2026-08-27 09:10',
  },
  {
    id: 'payable-004',
    projectId: 'finance-prj-005',
    payableNo: 'YF20260821021',
    payableType: 'INTELLECTUAL_PROPERTY',
    confirmDate: '2026-08-21',
    supplier: '北京知产服务中心',
    summary: '软件著作权与专利服务',
    primarySubject: '业务费',
    secondarySubject: '出版／文献／信息传播费',
    amount: 32000,
    freezeStatus: '已冻结',
    expectedPaymentDate: '2026-09-16',
    syncTime: '2026-08-27 08:45',
  },
]

export const budgetAdjustmentRecords: BudgetAdjustmentRecord[] = [
  {
    id: 'adjust-001',
    projectId: 'finance-prj-001',
    projectCode: 'JC2608005',
    projectName: '基础培育类项目经费执行示例',
    adjustmentNo: 'TZ20260818001',
    version: 'V2',
    subject: '业务费 → 设备费',
    fromSubject: '业务费',
    toSubject: '设备费',
    beforeAmount: 100000,
    afterAmount: 120000,
    adjustmentAmount: 20000,
    reason: '补充研发工作站和移动测试设备采购预算。',
    applicant: '赵同学',
    applyTime: '2026-08-18 10:20',
    status: '已通过',
    yonyouSyncStatus: '已同步',
    syncTime: '2026-08-18 16:30',
  },
  {
    id: 'adjust-002',
    projectId: 'finance-prj-002',
    projectCode: 'ZX2608001',
    projectName: '多肽分子预测和设计算法研究',
    adjustmentNo: 'TZ20260729003',
    version: 'V1',
    subject: '设备费 → 业务费',
    fromSubject: '设备费',
    toSubject: '业务费',
    beforeAmount: 420000,
    afterAmount: 380000,
    adjustmentAmount: 40000,
    reason: '计算服务采购周期提前，调增业务费。',
    applicant: '赵同学',
    applyTime: '2026-07-29 14:05',
    status: '审批中',
    yonyouSyncStatus: '待推送',
  },
  {
    id: 'adjust-003',
    projectId: 'finance-prj-003',
    projectCode: 'JC2608003',
    projectName: '生成式语言模型水印加密技术研究',
    adjustmentNo: 'TZ20260712002',
    version: 'V3',
    subject: '劳务费 → 业务费',
    fromSubject: '劳务费',
    toSubject: '业务费',
    beforeAmount: 150000,
    afterAmount: 120000,
    adjustmentAmount: 30000,
    reason: '减少实习生排期，增加安全评测服务预算。',
    applicant: '王老师',
    applyTime: '2026-07-12 09:40',
    status: '已通过',
    yonyouSyncStatus: '同步失败',
    syncTime: '2026-07-12 17:10',
  },
]

export const financeAlertRecords: FinanceAlertRecord[] = [
  {
    id: 'alert-001',
    projectId: 'finance-prj-004',
    projectCode: 'YY2607003',
    projectName: '超级软件智能应用平台关键技术研究',
    alertType: '项目经费即将到期',
    level: 'HIGH',
    content: '项目将在95天后到期，可用经费比例仅7.5%。',
    triggeredAt: '2026-08-27 08:30',
    recipients: '项目负责人、科研管理办公室',
    remindStatus: '已提醒',
    processStatus: '待处理',
  },
  {
    id: 'alert-002',
    projectId: 'finance-prj-005',
    projectCode: 'HX2608001',
    projectName: '基于多模态大语言模型的游戏智能体研究',
    alertType: '预算占用率过高',
    level: 'HIGH',
    content: '预算占用率达到92.36%，请关注后续支出节奏。',
    triggeredAt: '2026-08-27 08:35',
    recipients: '项目负责人、科研管理办公室',
    remindStatus: '已提醒',
    processStatus: '处理中',
  },
  {
    id: 'alert-003',
    projectId: 'finance-prj-006',
    projectCode: 'YY2607005',
    projectName: '产业级应用后训练关键技术研究',
    alertType: '某一预算科目可用余额低于设定比例',
    level: 'WARNING',
    content: '业务费可用余额低于科目预算20%。',
    triggeredAt: '2026-08-26 16:10',
    recipients: '项目负责人',
    remindStatus: '已提醒',
    processStatus: '待处理',
  },
  {
    id: 'alert-004',
    projectId: 'finance-prj-001',
    projectCode: 'JC2608005',
    projectName: '基础培育类项目经费执行示例',
    alertType: '应付未付金额持续过高',
    level: 'WARNING',
    content: '设备费存在39000元采购应付未付，已计入冻结占用。',
    triggeredAt: '2026-08-25 12:20',
    recipients: '项目负责人、财务接口管理员',
    remindStatus: '已提醒',
    processStatus: '待处理',
  },
  {
    id: 'alert-005',
    projectId: 'finance-prj-003',
    projectCode: 'JC2608003',
    projectName: '生成式语言模型水印加密技术研究',
    alertType: '用友数据同步延迟',
    level: 'INFO',
    content: '用友执行数据同步延迟超过2小时。',
    triggeredAt: '2026-08-27 07:08',
    recipients: '接口管理员',
    remindStatus: '已提醒',
    processStatus: '已处理',
  },
  {
    id: 'alert-006',
    projectId: 'finance-prj-002',
    projectCode: 'ZX2608001',
    projectName: '多肽分子预测和设计算法研究',
    alertType: '劳务费接近30%上限',
    level: 'INFO',
    content: '劳务费预算比例为22%，当前处于关注阈值内。',
    triggeredAt: '2026-08-24 10:10',
    recipients: '项目负责人',
    remindStatus: '未提醒',
    processStatus: '观察中',
  },
]

export const financeSyncRecords: FinanceSyncRecord[] = [
  {
    id: 'sync-001',
    syncBatchNo: 'TB20260827001',
    dataType: '项目立项信息',
    direction: '科研平台 → 用友',
    projectCode: 'JC2608005',
    startedAt: '2026-08-27 09:00',
    completedAt: '2026-08-27 09:01',
    status: 'SUCCESS',
    dataCount: 1,
    retryCount: 0,
  },
  {
    id: 'sync-002',
    syncBatchNo: 'TB20260827002',
    dataType: '项目总预算及科目预算',
    direction: '科研平台 → 用友',
    projectCode: 'ALL',
    startedAt: '2026-08-27 09:05',
    completedAt: '2026-08-27 09:08',
    status: 'SUCCESS',
    dataCount: 86,
    retryCount: 0,
  },
  {
    id: 'sync-003',
    syncBatchNo: 'TB20260712002',
    dataType: '预算调整信息',
    direction: '科研平台 → 用友',
    projectCode: 'JC2608003',
    startedAt: '2026-07-12 17:02',
    completedAt: '2026-07-12 17:10',
    status: 'FAILED',
    dataCount: 1,
    errorMessage: '用友预算科目编码未匹配，请后端接口重新映射后重试。',
    retryCount: 1,
  },
  {
    id: 'sync-004',
    syncBatchNo: 'HB20260827001',
    dataType: '已付款汇总与明细',
    direction: '用友 → 科研平台',
    projectCode: 'ALL',
    startedAt: '2026-08-27 09:20',
    completedAt: '2026-08-27 09:30',
    status: 'SUCCESS',
    dataCount: 128,
    retryCount: 0,
  },
  {
    id: 'sync-005',
    syncBatchNo: 'HB20260827002',
    dataType: '应付未付与冻结明细',
    direction: '用友 → 科研平台',
    projectCode: 'ALL',
    startedAt: '2026-08-27 09:21',
    completedAt: '2026-08-27 09:31',
    status: 'SUCCESS',
    dataCount: 36,
    retryCount: 0,
  },
  {
    id: 'sync-006',
    syncBatchNo: 'HB20260827003',
    dataType: '项目增量执行数据',
    direction: '用友 → 科研平台',
    projectCode: 'JC2608003',
    startedAt: '2026-08-27 07:08',
    status: 'DELAYED',
    dataCount: 0,
    errorMessage: '用友队列仍在处理中，超过2小时未完成。',
    retryCount: 0,
  },
]

export const payableTypeLabels: Record<PayableType, string> = {
  PROCUREMENT: '采购应付未付',
  CONTRACT: '合同应付未付',
  COMPUTE_API: '算力和API应付未付',
  INTELLECTUAL_PROPERTY: '知识产权应付未付',
  INTERN_SALARY: '项目实习生工资应付未付',
}

export const riskLevelLabels: Record<RiskLevel, string> = {
  NORMAL: '正常',
  ATTENTION: '关注',
  WARNING: '预警',
}

export const syncStatusLabels: Record<SyncStatus, string> = {
  WAITING: '待同步',
  PROCESSING: '同步中',
  SUCCESS: '成功',
  FAILED: '失败',
  DELAYED: '延迟',
}

export const alertLevelLabels: Record<FinanceAlertRecord['level'], string> = {
  INFO: '提示',
  WARNING: '关注',
  HIGH: '高风险',
}

export function getFinanceDepartments(projects = projectFinanceSummaries) {
  return Array.from(new Map(projects.map((item) => [item.departmentId, item.departmentName])).entries()).map(
    ([value, label]) => ({ value, label }),
  )
}

export function getFinanceProjectStatuses(projects = projectFinanceSummaries) {
  return Array.from(new Set(projects.map((item) => item.projectStatus)))
}

export function getFinanceProjectsForRole(roleKey: RoleKey, currentUser: LoggedInUser | null) {
  if (roleKey !== 'projectMember') {
    return projectFinanceSummaries
  }

  const ownProjects = projectFinanceSummaries.filter(
    (project) =>
      (currentUser && (project.leaderId === currentUser.id || project.leaderName === currentUser.displayName)) ||
      project.isOwnerDemo,
  )

  return ownProjects.length > 0 ? ownProjects : projectFinanceSummaries.filter((project) => project.isOwnerDemo)
}

export function getFinanceProjectDetail(projectId: string): ProjectFinanceDetail | null {
  const summary = projectFinanceSummaries.find((project) => project.projectId === projectId)

  if (!summary) {
    return null
  }

  return {
    summary,
    budgetSubjects: budgetSubjectsByProjectId[projectId] ?? [],
    payments: paymentDetailRecords.filter((item) => item.projectId === projectId),
    payables: payableDetailRecords.filter((item) => item.projectId === projectId),
    adjustments: budgetAdjustmentRecords.filter((item) => item.projectId === projectId),
    alerts: financeAlertRecords.filter((item) => item.projectId === projectId),
  }
}

export function getFinanceProjectByCode(projectCode: string) {
  return projectFinanceSummaries.find((project) => project.projectCode === projectCode)
}
