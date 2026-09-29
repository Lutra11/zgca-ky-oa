import type { LoggedInUser, RoleKey } from '../types/auth'
import type { RiskLevel, SyncStatus } from './researchFinanceMock'

export type FinanceLifecycleViewKey =
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

export type ProjectFinanceType =
  | 'INTERNAL_BUDGET'
  | 'INTERNAL_LUMP_SUM'
  | 'VERTICAL_BUDGET'
  | 'VERTICAL_LUMP_SUM'
  | 'HORIZONTAL'
  | 'JOINT_LAB'

export type BudgetMode = 'BUDGET_BASED' | 'LUMP_SUM'
export type ExpenseSource =
  | 'FINANCE_PAID'
  | 'NON_CONTRACT_PURCHASE'
  | 'CONTRACT_PURCHASE'
  | 'COMPUTE_API'
  | 'INTELLECTUAL_PROPERTY'
  | 'INTERN_SALARY'

export type BudgetAdjustmentType =
  | 'SUBJECT_INTERNAL'
  | 'SUBJECT_TRANSFER'
  | 'PROJECT_INFO_UPDATE'
  | 'BUDGET_INCREASE'
  | 'BUDGET_DECREASE'
  | 'BUDGET_RECOVERY'

export interface FinanceProject {
  id: string
  projectCode: string
  projectName: string
  projectType: ProjectFinanceType
  budgetMode: BudgetMode
  leaderId: string
  leaderName: string
  department: string
  projectStatus: string
  sourceType: '院内' | '院外'
  incomeStatus: string
  fundingSource: string
  startDate: string
  endDate: string
  totalFunding: number
  approvedBudget: number
  receivedAmount: number
  directCostBudget: number
  indirectCostBudget: number
  taxAmount: number
  managementFee: number
  depositAmount: number
  paidAmount: number
  frozenAmount: number
  availableBudget: number
  cashAvailable: number
  paymentExecutionRate: number
  budgetOccupancyRate: number
  reconciliationStatus: string
  warningLevel: RiskLevel
  syncStatus: SyncStatus
  lastSyncTime: string
  ownerDemo?: boolean
  authorizedMemberIds?: string[]
}

export interface BudgetSubject {
  id: string
  projectId: string
  parentId?: string
  level: 1 | 2 | 3
  subjectName: string
  approvedAmount: number
  adjustedAmount: number
  paidAmount: number
  frozenAmount: number
  availableAmount: number
  riskStatus: RiskLevel
}

export interface FundingReceipt {
  id: string
  projectId?: string
  receiptNo: string
  payerName: string
  amount: number
  receivedAt: string
  receiptFileName?: string
  claimStatus: string
  allocationStatus: string
  financeReceiptStatus: string
}

export interface FundAllocation {
  id: string
  projectId: string
  allocationNo: string
  topicName: string
  partnerName: string
  totalFunding: number
  directCost: number
  indirectCost: number
  reviewFee: number
  allocationRate: number
  allocationAmount: number
  paidAllocationAmount: number
  pendingAllocationAmount: number
  approvalStatus: string
  syncStatus: SyncStatus
}

export interface FinanceExpense {
  id: string
  projectId: string
  expenseNo: string
  source: ExpenseSource
  sourceSystem: string
  businessType: string
  sourceDocumentNo: string
  targetName: string
  firstLevelSubject: string
  secondLevelSubject: string
  payableAmount: number
  paidAmount: number
  frozenAmount: number
  frozenAt?: string
  frozenDays?: number
  paidAt?: string
  voucherNo?: string
  status: string
  reconciliationStatus: string
}

export interface BudgetAdjustment {
  id: string
  adjustmentNo: string
  adjustmentType: BudgetAdjustmentType
  projectId: string
  content: string
  amount: number
  applicant: string
  currentNode: string
  approvalStatus: string
  financeSyncStatus: SyncStatus
  receiptStatus: string
  beforeLaborRate: number
  afterLaborRate: number
  beforeOutsourcingRate: number
  afterOutsourcingRate: number
}

export interface BudgetVersion {
  id: string
  projectId: string
  versionNo: string
  effectiveAt: string
  reason: string
  changedBy: string
  approvalNo: string
  totalBudget: number
  status: string
}

export interface FinanceWarning {
  id: string
  projectId: string
  warningNo: string
  ruleName: string
  currentValue: number
  threshold: number
  level: 'INFO' | 'WARNING' | 'HIGH'
  notifiedAt: string
  recipients: string
  notifyStatus: string
  handlingStatus: string
  handlerName?: string
  handlingRemark?: string
}

export interface FinanceRuleConfig {
  laborFeeLimit: number
  laborFeeBase: 'TOTAL_BUDGET' | 'DIRECT_COST'
  outsourcingFeeLimit: number
  freezeTimeoutDays: number
  balanceWarningRate: number
}

export interface FinanceRule {
  id: string
  ruleName: string
  enabled: boolean
  projectType: string
  metric: string
  operator: string
  threshold: number
  level: 'INFO' | 'WARNING' | 'HIGH'
  recipients: string
  notifyWay: string
  scanTime: string
  noRepeatIn24h: boolean
}

export interface SubjectCorrection {
  id: string
  expenseNo: string
  projectId: string
  sourceSystem: string
  summary: string
  financeSubject: string
  matchedSubject: string
  suggestedSubject: string
  reason: string
  status: string
  pushStatus: SyncStatus
  financeConfirmStatus: string
}

export interface ReconciliationRecord {
  id: string
  batchNo: string
  type: '日对账' | '月对账' | '差异处理'
  date: string
  researchCount: number
  financeCount: number
  researchAmount: number
  financeAmount: number
  diffCount: number
  diffAmount: number
  status: string
  reason?: string
}

export interface FinanceReport {
  id: string
  title: string
  description: string
  scene: string
}

export interface FinanceSettlement {
  id: string
  settlementNo: string
  projectId: string
  totalFunding: number
  paidAmount: number
  frozenAmount: number
  remainingAmount: number
  createdAt: string
  currentNode: string
  status: string
  financeConfirmStatus: string
}

export interface LifecycleSyncRecord {
  id: string
  syncNo: string
  sourceSystem: string
  targetSystem: string
  businessType: string
  businessNo: string
  projectCode: string
  direction: string
  pushedAt: string
  receiptAt?: string
  status: SyncStatus
  retryCount: number
  errorReason?: string
}

export interface OperationLog {
  id: string
  projectId: string
  operator: string
  action: string
  operatedAt: string
  remark: string
}

type FinanceProjectSeed = Omit<
  FinanceProject,
  'availableBudget' | 'cashAvailable' | 'paymentExecutionRate' | 'budgetOccupancyRate'
>

export const financeLifecycleViewLabels: Record<FinanceLifecycleViewKey, string> = {
  workbench: '财务工作台',
  ledger: '项目经费台账',
  receipts: '到账与经费分拨',
  budget: '预算管理',
  expenses: '支出与冻结',
  alerts: '经费预警中心',
  reconciliation: '科目纠错与对账',
  reports: '报表中心',
  settlement: '财务决算',
  sync: '数据同步中心',
}

export const financeLifecycleDescriptions: Record<FinanceLifecycleViewKey, string> = {
  workbench: '集中查看科研经费运行、待办风险和项目经费执行情况。',
  ledger: '沉淀项目全生命周期经费台账，查看到账、预算、支出、调整、预警和决算。',
  receipts: '管理来款认领、经费下拨和财务平台确认回执。',
  budget: '覆盖预算编制、预算审核、预算调整和预算版本管理。',
  expenses: '展示财务已付款、应付未付、冻结记录、退回与释放状态。',
  alerts: '配置经费预警规则并集中处理风险记录。',
  reconciliation: '处理科目纠错、日对账、月对账和差异闭环。',
  reports: '按项目、部门、科目和时间生成科研经费报表。',
  settlement: '发起、审核并归档项目结题财务决算。',
  sync: '查看科研平台、财务平台和外部业务平台之间的数据同步记录。',
}

export const projectTypeLabels: Record<ProjectFinanceType, string> = {
  INTERNAL_BUDGET: '院内预算制',
  INTERNAL_LUMP_SUM: '院内包干制',
  VERTICAL_BUDGET: '纵向预算制',
  VERTICAL_LUMP_SUM: '纵向包干制',
  HORIZONTAL: '横向项目',
  JOINT_LAB: '联合实验室',
}

export const budgetModeLabels: Record<BudgetMode, string> = {
  BUDGET_BASED: '预算制',
  LUMP_SUM: '包干制',
}

export const riskTextMap: Record<RiskLevel, string> = {
  NORMAL: '正常',
  ATTENTION: '关注',
  WARNING: '预警',
}

export const syncTextMap: Record<SyncStatus, string> = {
  WAITING: '待同步',
  PROCESSING: '同步中',
  SUCCESS: '成功',
  FAILED: '失败',
  DELAYED: '延迟',
}

export const adjustmentTypeLabels: Record<BudgetAdjustmentType, string> = {
  SUBJECT_INTERNAL: '科目内调整',
  SUBJECT_TRANSFER: '科目间调整',
  PROJECT_INFO_UPDATE: '项目基本信息更新',
  BUDGET_INCREASE: '预算增加',
  BUDGET_DECREASE: '预算减少',
  BUDGET_RECOVERY: '预算收回',
}

export const expenseSourceLabels: Record<ExpenseSource, string> = {
  FINANCE_PAID: '财务已付款',
  NON_CONTRACT_PURCHASE: '非合同类采购应付未付',
  CONTRACT_PURCHASE: '合同类采购应付未付',
  COMPUTE_API: '算力和API应付未付',
  INTELLECTUAL_PROPERTY: '知识产权费用分摊',
  INTERN_SALARY: '项目实习生工资',
}

export const defaultFinanceRuleConfig: FinanceRuleConfig = {
  laborFeeLimit: 0.3,
  laborFeeBase: 'DIRECT_COST',
  outsourcingFeeLimit: 0.5,
  freezeTimeoutDays: 90,
  balanceWarningRate: 0.1,
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0
}

function withDerived(seed: FinanceProjectSeed): FinanceProject {
  const availableBudget = Number((seed.approvedBudget - seed.paidAmount - seed.frozenAmount).toFixed(2))
  const cashAvailable = Number((seed.receivedAmount - seed.paidAmount).toFixed(2))

  return {
    ...seed,
    availableBudget,
    cashAvailable,
    paymentExecutionRate: rate(seed.paidAmount, seed.approvedBudget),
    budgetOccupancyRate: rate(seed.paidAmount + seed.frozenAmount, seed.approvedBudget),
  }
}

export const financeProjects: FinanceProject[] = [
  withDerived({
    id: 'finance-prj-001',
    projectCode: 'JC2608005',
    projectName: '基础培育类项目经费执行示例',
    projectType: 'INTERNAL_BUDGET',
    budgetMode: 'BUDGET_BASED',
    leaderId: 'user-project-member',
    leaderName: '张天宇',
    department: '基础研究部',
    projectStatus: '在研',
    sourceType: '院内',
    incomeStatus: '已到账',
    fundingSource: '北京中关村学院院内科研经费',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    totalFunding: 500000,
    approvedBudget: 500000,
    receivedAmount: 500000,
    directCostBudget: 500000,
    indirectCostBudget: 0,
    taxAmount: 0,
    managementFee: 0,
    depositAmount: 0,
    paidAmount: 149060.88,
    frozenAmount: 73205.32,
    reconciliationStatus: '有差异',
    warningLevel: 'WARNING',
    syncStatus: 'SUCCESS',
    lastSyncTime: '2026-08-27 09:30',
    ownerDemo: true,
    authorizedMemberIds: ['student-001', 'mentor-001'],
  }),
  withDerived({
    id: 'finance-prj-002',
    projectCode: 'ZX2608001',
    projectName: '多肽分子预测和设计算法研究',
    projectType: 'VERTICAL_BUDGET',
    budgetMode: 'BUDGET_BASED',
    leaderId: 'user-project-member',
    leaderName: '张天宇',
    department: '生命与医学学部',
    projectStatus: '在研',
    sourceType: '院外',
    incomeStatus: '部分到账',
    fundingSource: '北京市纵向科研专项',
    startDate: '2026-04-01',
    endDate: '2028-03-31',
    totalFunding: 1200000,
    approvedBudget: 1200000,
    receivedAmount: 800000,
    directCostBudget: 920000,
    indirectCostBudget: 280000,
    taxAmount: 0,
    managementFee: 60000,
    depositAmount: 0,
    paidAmount: 286000,
    frozenAmount: 76000,
    reconciliationStatus: '已核对',
    warningLevel: 'ATTENTION',
    syncStatus: 'SUCCESS',
    lastSyncTime: '2026-08-27 09:10',
    ownerDemo: true,
  }),
  withDerived({
    id: 'finance-prj-003',
    projectCode: 'HX2608001',
    projectName: '基于多模态大语言模型的游戏智能体研究',
    projectType: 'HORIZONTAL',
    budgetMode: 'BUDGET_BASED',
    leaderId: 'user-leader',
    leaderName: '周明远',
    department: '产业研究中心',
    projectStatus: '在研',
    sourceType: '院外',
    incomeStatus: '已到账',
    fundingSource: '企业委托合同经费',
    startDate: '2026-05-01',
    endDate: '2027-04-30',
    totalFunding: 850000,
    approvedBudget: 700000,
    receivedAmount: 850000,
    directCostBudget: 620000,
    indirectCostBudget: 80000,
    taxAmount: 48000,
    managementFee: 170000,
    depositAmount: 127500,
    paidAmount: 355000,
    frozenAmount: 210000,
    reconciliationStatus: '有差异',
    warningLevel: 'WARNING',
    syncStatus: 'DELAYED',
    lastSyncTime: '2026-08-27 07:08',
  }),
  withDerived({
    id: 'finance-prj-004',
    projectCode: 'LH2607002',
    projectName: '未来智能联合实验室机器人平台',
    projectType: 'JOINT_LAB',
    budgetMode: 'LUMP_SUM',
    leaderId: 'user-lab',
    leaderName: '陈晓阳',
    department: '智能制造中心',
    projectStatus: '在研',
    sourceType: '院外',
    incomeStatus: '部分到账',
    fundingSource: '联合实验室多方出资',
    startDate: '2026-01-01',
    endDate: '2028-12-31',
    totalFunding: 1800000,
    approvedBudget: 1500000,
    receivedAmount: 1100000,
    directCostBudget: 1300000,
    indirectCostBudget: 200000,
    taxAmount: 36000,
    managementFee: 120000,
    depositAmount: 90000,
    paidAmount: 520000,
    frozenAmount: 180000,
    reconciliationStatus: '待核对',
    warningLevel: 'NORMAL',
    syncStatus: 'PROCESSING',
    lastSyncTime: '2026-08-26 18:20',
  }),
  withDerived({
    id: 'finance-prj-005',
    projectCode: 'ZY2606008',
    projectName: '自由探索类智能教育小样本研究',
    projectType: 'INTERNAL_LUMP_SUM',
    budgetMode: 'LUMP_SUM',
    leaderId: 'user-project-member',
    leaderName: '张天宇',
    department: '应用研究部',
    projectStatus: '结题中',
    sourceType: '院内',
    incomeStatus: '已到账',
    fundingSource: '自由探索项目经费',
    startDate: '2025-09-01',
    endDate: '2026-09-30',
    totalFunding: 180000,
    approvedBudget: 180000,
    receivedAmount: 180000,
    directCostBudget: 180000,
    indirectCostBudget: 0,
    taxAmount: 0,
    managementFee: 0,
    depositAmount: 0,
    paidAmount: 138000,
    frozenAmount: 15000,
    reconciliationStatus: '已核对',
    warningLevel: 'ATTENTION',
    syncStatus: 'SUCCESS',
    lastSyncTime: '2026-08-27 08:50',
    ownerDemo: true,
  }),
]

function createSubject(
  projectId: string,
  code: string,
  subjectName: string,
  level: 1 | 2,
  approvedAmount: number,
  paidAmount: number,
  frozenAmount: number,
  parentId?: string,
  riskStatus: RiskLevel = 'NORMAL',
): BudgetSubject {
  return {
    id: `${projectId}-${code}`,
    projectId,
    parentId,
    level,
    subjectName,
    approvedAmount,
    adjustedAmount: approvedAmount,
    paidAmount,
    frozenAmount,
    availableAmount: Number((approvedAmount - paidAmount - frozenAmount).toFixed(2)),
    riskStatus,
  }
}

function budgetSubjectsForProject(project: FinanceProject): BudgetSubject[] {
  if (project.budgetMode === 'LUMP_SUM') {
    return [
      createSubject(project.id, 'LS01', '包干项目总经费', 1, project.approvedBudget, project.paidAmount, project.frozenAmount),
      createSubject(project.id, 'LS0101', '差旅材料劳务等支出归类统计', 2, project.approvedBudget, project.paidAmount, project.frozenAmount, `${project.id}-LS01`),
    ]
  }

  if (project.projectType === 'HORIZONTAL') {
    return [
      createSubject(project.id, 'H01', '合同总额', 1, project.totalFunding, project.paidAmount, project.frozenAmount),
      createSubject(project.id, 'H02', '税费', 1, project.taxAmount, 0, 0),
      createSubject(project.id, 'H03', '管理费', 1, project.managementFee, 0, 0),
      createSubject(project.id, 'H04', '保证金', 1, project.depositAmount, 0, 0),
      createSubject(project.id, 'H05', '外协经费', 1, 280000, 120000, 120000, undefined, 'WARNING'),
    ]
  }

  const primaryRows = [
    ['01', '设备费', 0.18, 'NORMAL'],
    ['02', '材料费', 0.1, 'NORMAL'],
    ['03', '测试化验加工费', 0.1, 'NORMAL'],
    ['04', '燃料动力费', 0.06, 'NORMAL'],
    ['05', '差旅／会议／国际合作交流费', 0.14, 'ATTENTION'],
    ['06', '出版／文献／信息传播／知识产权事务费', 0.1, 'NORMAL'],
    ['07', '劳务费', 0.22, 'ATTENTION'],
    ['08', '专家咨询费', 0.06, 'NORMAL'],
    ['09', '其他支出', 0.04, 'NORMAL'],
  ] as const

  return primaryRows.flatMap(([code, name, ratioValue, risk], index) => {
    const approved = Number((project.approvedBudget * ratioValue).toFixed(2))
    const paid = Number((project.paidAmount * ratioValue).toFixed(2))
    const frozen = Number((project.frozenAmount * ratioValue).toFixed(2))
    const row = createSubject(project.id, code, name, 1, approved, paid, frozen, undefined, risk)
    const child = createSubject(
      project.id,
      `${code}01`,
      index === 6 ? '项目实习生工资' : `${name}明细`,
      2,
      approved,
      paid,
      frozen,
      row.id,
      risk,
    )

    return [row, child]
  })
}

export const budgetSubjects = financeProjects.flatMap(budgetSubjectsForProject)

export const fundingReceipts: FundingReceipt[] = [
  {
    id: 'receipt-001',
    projectId: 'finance-prj-001',
    receiptNo: 'DK20260701001',
    payerName: '北京中关村学院',
    amount: 500000,
    receivedAt: '2026-07-01',
    receiptFileName: '银行回单-JC2608005.pdf',
    claimStatus: '已认领',
    allocationStatus: '无需分拨',
    financeReceiptStatus: '财务已确认',
  },
  {
    id: 'receipt-002',
    projectId: 'finance-prj-002',
    receiptNo: 'DK20260412003',
    payerName: '北京市科委',
    amount: 800000,
    receivedAt: '2026-04-12',
    receiptFileName: '纵向项目来款回单.pdf',
    claimStatus: '已认领',
    allocationStatus: '待下拨',
    financeReceiptStatus: '财务已确认',
  },
  {
    id: 'receipt-003',
    receiptNo: 'DK20260822007',
    payerName: '北京智游互动科技有限公司',
    amount: 260000,
    receivedAt: '2026-08-22',
    receiptFileName: '企业来款回单.pdf',
    claimStatus: '待认领',
    allocationStatus: '未下拨',
    financeReceiptStatus: '待确认',
  },
]

export const fundAllocations: FundAllocation[] = [
  {
    id: 'alloc-001',
    projectId: 'finance-prj-002',
    allocationNo: 'FB20260416001',
    topicName: '多肽结构预测课题',
    partnerName: '北京生命数据科技有限公司',
    totalFunding: 800000,
    directCost: 620000,
    indirectCost: 160000,
    reviewFee: 20000,
    allocationRate: 0.65,
    allocationAmount: 520000,
    paidAllocationAmount: 260000,
    pendingAllocationAmount: 260000,
    approvalStatus: '审批中',
    syncStatus: 'WAITING',
  },
  {
    id: 'alloc-002',
    projectId: 'finance-prj-004',
    allocationNo: 'FB20260208002',
    topicName: '机器人平台课题',
    partnerName: '联合实验室合作单位A',
    totalFunding: 1100000,
    directCost: 820000,
    indirectCost: 180000,
    reviewFee: 30000,
    allocationRate: 0.42,
    allocationAmount: 462000,
    paidAllocationAmount: 300000,
    pendingAllocationAmount: 162000,
    approvalStatus: '已通过',
    syncStatus: 'SUCCESS',
  },
]

export const financeExpenses: FinanceExpense[] = [
  {
    id: 'expense-001',
    projectId: 'finance-prj-001',
    expenseNo: 'ZC20260821018',
    source: 'FINANCE_PAID',
    sourceSystem: '财务一体化平台',
    businessType: 'API服务费',
    sourceDocumentNo: 'YYPZ-20260821-018',
    targetName: '苏州智算科技有限公司',
    firstLevelSubject: '业务费',
    secondLevelSubject: 'API服务',
    payableAmount: 34163.4,
    paidAmount: 34163.4,
    frozenAmount: 0,
    paidAt: '2026-08-21',
    voucherNo: 'YYPZ-20260821-018',
    status: '已付款',
    reconciliationStatus: '已核对',
  },
  {
    id: 'expense-002',
    projectId: 'finance-prj-001',
    expenseNo: 'YF20260825011',
    source: 'NON_CONTRACT_PURCHASE',
    sourceSystem: '采购平台',
    businessType: 'IT设备采购',
    sourceDocumentNo: 'CG20260825011',
    targetName: '京东科技信息有限公司',
    firstLevelSubject: '设备费',
    secondLevelSubject: '笔记本电脑／IT设备',
    payableAmount: 39000,
    paidAmount: 0,
    frozenAmount: 39000,
    frozenAt: '2026-08-25',
    frozenDays: 3,
    status: '已冻结',
    reconciliationStatus: '待核对',
  },
  {
    id: 'expense-003',
    projectId: 'finance-prj-003',
    expenseNo: 'YF20260502005',
    source: 'CONTRACT_PURCHASE',
    sourceSystem: '采购定标登记平台',
    businessType: '外协开发合同',
    sourceDocumentNo: 'HT20260502005',
    targetName: '中关村应用软件联盟',
    firstLevelSubject: '外协经费',
    secondLevelSubject: '外部测试服务',
    payableAmount: 120000,
    paidAmount: 0,
    frozenAmount: 120000,
    frozenAt: '2026-05-02',
    frozenDays: 118,
    status: '已冻结',
    reconciliationStatus: '有差异',
  },
  {
    id: 'expense-004',
    projectId: 'finance-prj-005',
    expenseNo: 'YF20260818009',
    source: 'INTERN_SALARY',
    sourceSystem: '人力实习生招聘平台',
    businessType: '项目实习生工资',
    sourceDocumentNo: 'RL20260818009',
    targetName: '实习生工资批次',
    firstLevelSubject: '劳务费',
    secondLevelSubject: '项目实习生工资',
    payableAmount: 15000,
    paidAmount: 0,
    frozenAmount: 15000,
    frozenAt: '2026-08-18',
    frozenDays: 10,
    status: '已冻结',
    reconciliationStatus: '已核对',
  },
]

export const budgetAdjustments: BudgetAdjustment[] = [
  {
    id: 'adjust-001',
    adjustmentNo: 'TZ20260818001',
    adjustmentType: 'SUBJECT_TRANSFER',
    projectId: 'finance-prj-001',
    content: '业务费调减，设备费调增',
    amount: 20000,
    applicant: '张天宇',
    currentNode: '科研财务管理员',
    approvalStatus: '审批中',
    financeSyncStatus: 'WAITING',
    receiptStatus: '待回执',
    beforeLaborRate: 0.22,
    afterLaborRate: 0.22,
    beforeOutsourcingRate: 0,
    afterOutsourcingRate: 0,
  },
  {
    id: 'adjust-002',
    adjustmentNo: 'TZ20260712002',
    adjustmentType: 'BUDGET_INCREASE',
    projectId: 'finance-prj-003',
    content: '企业追加研发经费并关联来款',
    amount: 260000,
    applicant: '周明远',
    currentNode: '院领导',
    approvalStatus: '终审中',
    financeSyncStatus: 'PROCESSING',
    receiptStatus: '待确认',
    beforeLaborRate: 0.18,
    afterLaborRate: 0.16,
    beforeOutsourcingRate: 0.42,
    afterOutsourcingRate: 0.45,
  },
  {
    id: 'adjust-003',
    adjustmentNo: 'TZ20260630004',
    adjustmentType: 'BUDGET_RECOVERY',
    projectId: 'finance-prj-005',
    content: '结题前收回未使用包干经费',
    amount: 12000,
    applicant: '张天宇',
    currentNode: '科研部负责人',
    approvalStatus: '已通过',
    financeSyncStatus: 'SUCCESS',
    receiptStatus: '已回执',
    beforeLaborRate: 0.24,
    afterLaborRate: 0.24,
    beforeOutsourcingRate: 0,
    afterOutsourcingRate: 0,
  },
]

export const budgetVersions: BudgetVersion[] = [
  {
    id: 'version-001',
    projectId: 'finance-prj-001',
    versionNo: 'V1',
    effectiveAt: '2026-07-01',
    reason: '项目立项批复预算',
    changedBy: '科研财务管理员',
    approvalNo: 'LP2026-Q3-001',
    totalBudget: 500000,
    status: '当前版本',
  },
  {
    id: 'version-002',
    projectId: 'finance-prj-003',
    versionNo: 'V2',
    effectiveAt: '2026-08-22',
    reason: '企业追加合同经费',
    changedBy: '周明远',
    approvalNo: 'TZ20260712002',
    totalBudget: 850000,
    status: '审批中',
  },
]

export const financeWarnings: FinanceWarning[] = [
  {
    id: 'warn-001',
    projectId: 'finance-prj-003',
    warningNo: 'YJ20260827001',
    ruleName: '横向外协预警',
    currentValue: 0.45,
    threshold: 0.5,
    level: 'HIGH',
    notifiedAt: '2026-08-27 08:30',
    recipients: '项目负责人、科研财务管理员',
    notifyStatus: '已提醒',
    handlingStatus: '待处理',
  },
  {
    id: 'warn-002',
    projectId: 'finance-prj-001',
    warningNo: 'YJ20260825002',
    ruleName: '应付未付持续过高',
    currentValue: 73205.32,
    threshold: 60000,
    level: 'WARNING',
    notifiedAt: '2026-08-25 12:20',
    recipients: '项目负责人',
    notifyStatus: '已提醒',
    handlingStatus: '处理中',
  },
  {
    id: 'warn-003',
    projectId: 'finance-prj-005',
    warningNo: 'YJ20260822003',
    ruleName: '项目经费即将到期',
    currentValue: 34,
    threshold: 60,
    level: 'INFO',
    notifiedAt: '2026-08-22 09:20',
    recipients: '项目负责人',
    notifyStatus: '已提醒',
    handlingStatus: '已处理',
    handlerName: '张天宇',
    handlingRemark: '已启动结题财务决算。',
  },
]

export const financeRules: FinanceRule[] = [
  {
    id: 'rule-001',
    ruleName: '劳务费上限预警',
    enabled: true,
    projectType: '全部预算制项目',
    metric: '劳务费比例',
    operator: '>=',
    threshold: 0.3,
    level: 'HIGH',
    recipients: '项目负责人、科研财务管理员',
    notifyWay: '站内消息',
    scanTime: '每日 08:00',
    noRepeatIn24h: true,
  },
  {
    id: 'rule-002',
    ruleName: '冻结超时预警',
    enabled: true,
    projectType: '全部项目',
    metric: '冻结天数',
    operator: '>=',
    threshold: 90,
    level: 'WARNING',
    recipients: '科研财务管理员',
    notifyWay: '站内消息',
    scanTime: '每日 09:00',
    noRepeatIn24h: true,
  },
]

export const subjectCorrections: SubjectCorrection[] = [
  {
    id: 'correction-001',
    expenseNo: 'YF20260502005',
    projectId: 'finance-prj-003',
    sourceSystem: '采购定标登记平台',
    summary: '外部测试服务合同科目匹配异常',
    financeSubject: '业务费／软件服务',
    matchedSubject: '外协经费／外部测试服务',
    suggestedSubject: '外协经费／外部测试服务',
    reason: '合同内容为外部测试服务，应进入外协经费。',
    status: '待处理',
    pushStatus: 'WAITING',
    financeConfirmStatus: '待确认',
  },
  {
    id: 'correction-002',
    expenseNo: 'YF20260818009',
    projectId: 'finance-prj-005',
    sourceSystem: '人力实习生招聘平台',
    summary: '实习生工资归入劳务费',
    financeSubject: '劳务支出',
    matchedSubject: '劳务费／项目实习生工资',
    suggestedSubject: '劳务费／项目实习生工资',
    reason: '需确认劳务费与劳务支出口径是否重复。',
    status: '已核实',
    pushStatus: 'SUCCESS',
    financeConfirmStatus: '已确认',
  },
]

export const reconciliationRecords: ReconciliationRecord[] = [
  {
    id: 'recon-001',
    batchNo: 'DZ20260827001',
    type: '日对账',
    date: '2026-08-27',
    researchCount: 128,
    financeCount: 128,
    researchAmount: 1490060.88,
    financeAmount: 1490060.88,
    diffCount: 0,
    diffAmount: 0,
    status: '已平账',
  },
  {
    id: 'recon-002',
    batchNo: 'DZ20260826002',
    type: '日对账',
    date: '2026-08-26',
    researchCount: 36,
    financeCount: 35,
    researchAmount: 73205.32,
    financeAmount: 34205.32,
    diffCount: 1,
    diffAmount: 39000,
    status: '有差异',
    reason: '采购平台冻结记录已入科研平台，财务平台回执延迟。',
  },
  {
    id: 'recon-003',
    batchNo: 'YDZ202608',
    type: '月对账',
    date: '2026-08',
    researchCount: 512,
    financeCount: 509,
    researchAmount: 2864000,
    financeAmount: 2825000,
    diffCount: 3,
    diffAmount: 39000,
    status: '处理中',
  },
]

export const financeReports: FinanceReport[] = [
  { id: 'report-001', title: '项目经费执行表', description: '按项目查看预算、到账、支出、冻结和余额。', scene: '科研财务管理员 / 项目负责人' },
  { id: 'report-002', title: '课题经费分配表', description: '展示项目课题、合作单位和分拨执行情况。', scene: '财务 / 学部' },
  { id: 'report-003', title: '部门经费汇总表', description: '按部门汇总项目经费规模与执行率。', scene: '院领导 / 部门负责人' },
  { id: 'report-004', title: '年度经费统计表', description: '按年度统计到账、支出、冻结与结余。', scene: '管理层' },
  { id: 'report-005', title: '预算执行率分析表', description: '分析预算执行率、占用率和项目风险。', scene: '科研财务' },
  { id: 'report-006', title: '对账差异报告', description: '输出科研平台和财务平台差异明细。', scene: '接口 / 财务' },
]

export const financeSettlements: FinanceSettlement[] = [
  {
    id: 'settle-001',
    settlementNo: 'JS20260826001',
    projectId: 'finance-prj-005',
    totalFunding: 180000,
    paidAmount: 138000,
    frozenAmount: 15000,
    remainingAmount: 27000,
    createdAt: '2026-08-26 10:00',
    currentNode: '科研财务管理员',
    status: '审核中',
    financeConfirmStatus: '待推送',
  },
  {
    id: 'settle-002',
    settlementNo: 'JS20260718002',
    projectId: 'finance-prj-001',
    totalFunding: 500000,
    paidAmount: 149060.88,
    frozenAmount: 73205.32,
    remainingAmount: 277733.8,
    createdAt: '2026-07-18 09:30',
    currentNode: '项目负责人',
    status: '草稿',
    financeConfirmStatus: '未推送',
  },
]

export const lifecycleSyncRecords: LifecycleSyncRecord[] = [
  {
    id: 'sync-001',
    syncNo: 'TB20260827001',
    sourceSystem: '科研平台',
    targetSystem: '财务一体化平台',
    businessType: '项目立项',
    businessNo: 'LP2026-Q3-001',
    projectCode: 'JC2608005',
    direction: '科研 → 财务',
    pushedAt: '2026-08-27 09:00',
    receiptAt: '2026-08-27 09:01',
    status: 'SUCCESS',
    retryCount: 0,
  },
  {
    id: 'sync-002',
    syncNo: 'TB20260827002',
    sourceSystem: '采购平台',
    targetSystem: '科研平台',
    businessType: '采购应付未付',
    businessNo: 'CG20260825011',
    projectCode: 'JC2608005',
    direction: '外部平台 → 科研',
    pushedAt: '2026-08-27 09:05',
    receiptAt: '2026-08-27 09:06',
    status: 'SUCCESS',
    retryCount: 0,
  },
  {
    id: 'sync-003',
    syncNo: 'TB20260827003',
    sourceSystem: '科研平台',
    targetSystem: '财务一体化平台',
    businessType: '科目纠错',
    businessNo: 'YF20260502005',
    projectCode: 'HX2608001',
    direction: '科研 → 财务',
    pushedAt: '2026-08-27 09:12',
    status: 'FAILED',
    retryCount: 1,
    errorReason: '财务平台科目编码未匹配。',
  },
  {
    id: 'sync-004',
    syncNo: 'HB20260827004',
    sourceSystem: '财务一体化平台',
    targetSystem: '科研平台',
    businessType: '已付款',
    businessNo: 'YYPZ-20260821-018',
    projectCode: 'JC2608005',
    direction: '财务 → 科研',
    pushedAt: '2026-08-27 09:20',
    receiptAt: '2026-08-27 09:30',
    status: 'DELAYED',
    retryCount: 0,
    errorReason: '回传队列超过2小时未完成。',
  },
]

export const operationLogs: OperationLog[] = [
  { id: 'log-001', projectId: 'finance-prj-001', operator: '科研财务管理员', action: '认领来款', operatedAt: '2026-07-01 10:00', remark: '院内经费到账后完成认领。' },
  { id: 'log-002', projectId: 'finance-prj-001', operator: '张天宇', action: '发起预算调整', operatedAt: '2026-08-18 10:20', remark: '业务费调减至设备费。' },
  { id: 'log-003', projectId: 'finance-prj-003', operator: '接口管理员', action: '同步失败', operatedAt: '2026-08-27 09:12', remark: '科目编码映射失败，等待重试。' },
]

export function getLifecycleProjectsForRole(roleKey: RoleKey, currentUser: LoggedInUser | null) {
  if (roleKey === 'projectMember') {
    const currentUserId = currentUser?.id
    return financeProjects.filter(
      (project) =>
        project.ownerDemo ||
        project.leaderId === currentUserId ||
        project.leaderName === currentUser?.displayName,
    )
  }

  if (roleKey === 'projectStudent' || roleKey === 'projectMentor') {
    const currentUserId = currentUser?.id
    return financeProjects.filter((project) => project.authorizedMemberIds?.includes(currentUserId ?? ''))
  }

  if (roleKey === 'researchDepartmentLeader' || roleKey === 'facultyLeader') {
    return financeProjects.filter((project) => ['基础研究部', '生命与医学学部', '应用研究部'].includes(project.department))
  }

  return financeProjects
}

export function getProjectName(projectId: string) {
  return financeProjects.find((project) => project.id === projectId)?.projectName ?? '未关联项目'
}

export function getProjectCode(projectId: string) {
  return financeProjects.find((project) => project.id === projectId)?.projectCode ?? '-'
}

export function getLifecycleProjectDetail(projectId: string) {
  const project = financeProjects.find((item) => item.id === projectId)

  if (!project) {
    return null
  }

  return {
    project,
    subjects: budgetSubjects.filter((item) => item.projectId === projectId),
    receipts: fundingReceipts.filter((item) => item.projectId === projectId),
    allocations: fundAllocations.filter((item) => item.projectId === projectId),
    expenses: financeExpenses.filter((item) => item.projectId === projectId),
    adjustments: budgetAdjustments.filter((item) => item.projectId === projectId),
    warnings: financeWarnings.filter((item) => item.projectId === projectId),
    corrections: subjectCorrections.filter((item) => item.projectId === projectId),
    settlements: financeSettlements.filter((item) => item.projectId === projectId),
    logs: operationLogs.filter((item) => item.projectId === projectId),
  }
}
