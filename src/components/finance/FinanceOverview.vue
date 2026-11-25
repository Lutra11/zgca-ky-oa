<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Bell,
  CircleCheck,
  Connection,
  DataAnalysis,
  DataLine,
  Document,
  Download,
  Files,
  Money,
  Plus,
  Refresh,
  Search,
  Tickets,
  Warning,
} from '@element-plus/icons-vue'
import {
  budgetSubjectsByProjectId as classicBudgetSubjectsByProjectId,
  payableDetailRecords as classicPayableDetailRecords,
  paymentDetailRecords as classicPaymentDetailRecords,
  projectFinanceSummaries as classicProjectFinanceSummaries,
  type BudgetSubject as ClassicBudgetSubject,
  type FinanceViewKey,
  type PayableDetailRecord as ClassicPayableDetailRecord,
  type PaymentDetailRecord as ClassicPaymentDetailRecord,
  type ProjectFinanceSummary as ClassicProjectFinanceSummary,
  type RiskLevel,
  type SyncStatus,
} from '../../dataset/researchFinanceMock'
import type { LoggedInUser, RoleKey } from '../../types/auth'
import {
  adjustmentTypeLabels,
  budgetAdjustments,
  budgetModeLabels,
  budgetSubjects,
  budgetVersions,
  defaultFinanceRuleConfig,
  expenseSourceLabels,
  financeExpenses,
  financeLifecycleDescriptions,
  financeLifecycleViewLabels,
  financeProjects,
  financeReports,
  financeRules,
  financeSettlements,
  financeWarnings,
  fundAllocations,
  fundingReceipts,
  getLifecycleProjectDetail,
  getLifecycleProjectsForRole,
  getProjectCode,
  getProjectName,
  lifecycleSyncRecords,
  operationLogs,
  projectTypeLabels,
  reconciliationRecords,
  riskTextMap,
  subjectCorrections,
  syncTextMap,
  type BudgetAdjustment,
  type BudgetAdjustmentType,
  type BudgetSubject,
  type ExpenseSource,
  type FinanceLifecycleViewKey,
  type FinanceProject,
  type FinanceRule,
  type FinanceRuleConfig,
  type FinanceSettlement,
  type FinanceWarning,
  type FundingReceipt,
  type LifecycleSyncRecord,
  type ReconciliationRecord,
  type SubjectCorrection,
} from '../../dataset/researchFinanceLifecycleMock'
import { formatCurrency, formatPercent, toProgressPercent } from './financeFormat'

interface PersistedFinanceState {
  receiptClaimStatus: Record<string, string>
  receiptAllocationStatus: Record<string, string>
  warningHandlingStatus: Record<string, string>
  correctionStatus: Record<string, string>
  correctionPushStatus: Record<string, SyncStatus>
  expenseStatus: Record<string, string>
  expensePaidAt: Record<string, string>
  syncStatus: Record<string, SyncStatus>
  syncRetryCount: Record<string, number>
  settlementStatus: Record<string, string>
  settlementNode: Record<string, string>
  financeRuleConfig: FinanceRuleConfig
  customAdjustments: BudgetAdjustment[]
  customRules: FinanceRule[]
}

type FinanceSortKey = 'default' | 'fundingDesc' | 'paymentDesc' | 'occupancyDesc'
type ReceiptTab = 'receipts' | 'allocations'
type BudgetTab = 'compile' | 'audit' | 'adjustments' | 'versions'
type ExpenseTab = 'all' | 'paid' | 'payable' | 'frozen' | 'release'
type AlertTab = 'records' | 'rules'
type ReconciliationTab = 'correction' | 'daily' | 'monthly' | 'difference'
type DetailTab =
  | 'overview'
  | 'receipts'
  | 'allocations'
  | 'budget'
  | 'paid'
  | 'payable'
  | 'expenses'
  | 'adjustments'
  | 'warnings'
  | 'reconciliation'
  | 'settlement'
  | 'logs'

interface ProjectFilter {
  keyword: string
  projectType: FinanceProject['projectType'] | 'all'
  sourceType: FinanceProject['sourceType'] | 'all'
  budgetMode: FinanceProject['budgetMode'] | 'all'
  department: string
  projectStatus: string
  incomeStatus: string
  reconciliationStatus: string
  warningLevel: RiskLevel | 'all'
}

interface AdjustmentForm {
  adjustmentType: BudgetAdjustmentType
  projectId: string
  fromSubject: string
  toSubject: string
  amount: number
  effectiveDate: string
  relatedReceipt: string
  attachmentName: string
  reason: string
}

interface BudgetSubjectTreeRow extends BudgetSubject {
  children?: BudgetSubjectTreeRow[]
  primarySubjectName?: string
  secondarySubjectName?: string
  fundNature?: ClassicBudgetSubject['fundNature']
  detailCode?: string
  detailType?: string
  remark?: string
  sourceDocumentNo?: string
  targetName?: string
  expenseStatus?: string
}

interface FinancePaymentDisplayRow {
  id: string
  documentNo: string
  paymentDate: string
  targetName: string
  summary: string
  firstLevelSubject: string
  secondLevelSubject: string
  amount: number
  status: string
  voucherNo: string
  syncTime: string
}

interface FinancePayableDisplayRow {
  id: string
  documentNo: string
  payableType: string
  confirmDate: string
  targetName: string
  summary: string
  firstLevelSubject: string
  secondLevelSubject: string
  amount: number
  freezeStatus: string
  expectedPaymentDate: string
  syncTime: string
}

const route = useRoute()
const router = useRouter()

const props = defineProps<{
  view: FinanceViewKey
  roleKey: RoleKey
  currentUser: LoggedInUser | null
}>()

const STORAGE_KEY = 'zgca_finance_lifecycle_prototype_state_v1'

function createDefaultPersistedState(): PersistedFinanceState {
  return {
    receiptClaimStatus: {},
    receiptAllocationStatus: {},
    warningHandlingStatus: {},
    correctionStatus: {},
    correctionPushStatus: {},
    expenseStatus: {},
    expensePaidAt: {},
    syncStatus: {},
    syncRetryCount: {},
    settlementStatus: {},
    settlementNode: {},
    financeRuleConfig: { ...defaultFinanceRuleConfig },
    customAdjustments: [],
    customRules: [],
  }
}

function readPersistedState(): PersistedFinanceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return createDefaultPersistedState()
    }

    const parsed = JSON.parse(raw) as Partial<PersistedFinanceState>
    return {
      ...createDefaultPersistedState(),
      ...parsed,
      financeRuleConfig: {
        ...defaultFinanceRuleConfig,
        ...(parsed.financeRuleConfig ?? {}),
      },
      customAdjustments: parsed.customAdjustments ?? [],
      customRules: parsed.customRules ?? [],
    }
  } catch {
    return createDefaultPersistedState()
  }
}

const persisted = reactive<PersistedFinanceState>(readPersistedState())

function savePersistedState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
}

const projectFilter = reactive<ProjectFilter>({
  keyword: '',
  projectType: 'all',
  sourceType: 'all',
  budgetMode: 'all',
  department: 'all',
  projectStatus: 'all',
  incomeStatus: 'all',
  reconciliationStatus: 'all',
  warningLevel: 'all',
})

const projectPage = shallowRef(1)
const pageSize = shallowRef(6)
const sortKey = shallowRef<FinanceSortKey>('default')
const tableLoading = shallowRef(false)
const receiptTab = shallowRef<ReceiptTab>('receipts')
const budgetTab = shallowRef<BudgetTab>('compile')
const expenseTab = shallowRef<ExpenseTab>('all')
const alertTab = shallowRef<AlertTab>('records')
const reconciliationTab = shallowRef<ReconciliationTab>('correction')
const detailTab = shallowRef<DetailTab>('overview')

const drawerVisible = shallowRef(false)
const selectedProjectId = shallowRef('')
const lastAutoOpenFinanceTarget = shallowRef('')
const metricDialogVisible = shallowRef(false)
const adjustmentDialogVisible = shallowRef(false)
const allocationDialogVisible = shallowRef(false)
const ruleDialogVisible = shallowRef(false)
const settlementDialogVisible = shallowRef(false)
const genericDialogVisible = shallowRef(false)
const genericDialogTitle = shallowRef('')
const genericDialogText = shallowRef('')

const adjustmentForm = reactive<AdjustmentForm>({
  adjustmentType: 'SUBJECT_TRANSFER',
  projectId: financeProjects[0]?.id ?? '',
  fromSubject: '业务费',
  toSubject: '设备费',
  amount: 10000,
  effectiveDate: '2026-09-01',
  relatedReceipt: '',
  attachmentName: '',
  reason: '',
})

const newRuleForm = reactive({
  ruleName: '',
  projectType: '全部项目',
  metric: '可用余额比例',
  operator: '<=',
  threshold: 0.1,
  level: 'WARNING' as FinanceRule['level'],
  recipients: '项目负责人、科研财务管理员',
})

const expenseSourceLabelsByClassicPayableType: Record<ClassicPayableDetailRecord['payableType'], string> = {
  PROCUREMENT: '采购应付未付',
  CONTRACT: '合同应付未付',
  COMPUTE_API: '算力和API应付未付',
  INTELLECTUAL_PROPERTY: '知识产权应付未付',
  INTERN_SALARY: '项目实习生工资应付未付',
}

const viewKey = computed<FinanceLifecycleViewKey>(() => {
  if (props.view === 'budget-adjustments') {
    return 'budget'
  }

  if (props.view === 'sync-records') {
    return 'sync'
  }

  if (props.view === 'overview') {
    return 'workbench'
  }

  return props.view
})

const financeAdminScope = computed(() => props.roleKey === 'researchProjectAdmin')
const ownerScope = computed(() => props.roleKey === 'projectMember')
const memberReadOnlyScope = computed(() => props.roleKey === 'projectStudent' || props.roleKey === 'projectMentor')

const pageTitle = computed(() =>
  ownerScope.value && viewKey.value === 'workbench' ? '我的经费' : financeLifecycleViewLabels[viewKey.value],
)
const pageDescription = computed(() =>
  ownerScope.value && viewKey.value === 'workbench'
    ? '查看本人负责项目的到账、预算、支出、冻结、余额和风险状态。'
    : financeLifecycleDescriptions[viewKey.value],
)
const roleScopeText = computed(() => {
  if (financeAdminScope.value) {
    return '科研财务管理员：查看全院项目，并可进行预算审核、纠错、对账、决算审核和规则配置。'
  }

  if (props.roleKey === 'researchDepartmentLeader' || props.roleKey === 'facultyLeader') {
    return '院领导／部门负责人：查看分管范围项目，可进行终审演示，不修改普通支出数据。'
  }

  if (ownerScope.value) {
    return '项目负责人：仅查看本人负责项目，可发起预算调整和结题财务决算。'
  }

  if (memberReadOnlyScope.value) {
    return '项目组成员：仅查看已授权项目，财务信息只读。'
  }

  return '当前角色按原型权限展示科研经费数据。'
})

const visibleProjects = computed(() => getLifecycleProjectsForRole(props.roleKey, props.currentUser))
const visibleProjectIds = computed(() => new Set(visibleProjects.value.map((item) => item.id)))
const departments = computed(() => Array.from(new Set(visibleProjects.value.map((item) => item.department))))
const projectStatuses = computed(() => Array.from(new Set(visibleProjects.value.map((item) => item.projectStatus))))
const incomeStatuses = computed(() => Array.from(new Set(visibleProjects.value.map((item) => item.incomeStatus))))
const reconciliationStatuses = computed(() => Array.from(new Set(visibleProjects.value.map((item) => item.reconciliationStatus))))

const displayReceipts = computed(() =>
  fundingReceipts.map((item) => ({
    ...item,
    claimStatus: persisted.receiptClaimStatus[item.id] ?? item.claimStatus,
    allocationStatus: persisted.receiptAllocationStatus[item.id] ?? item.allocationStatus,
  })),
)
const visibleReceipts = computed(() =>
  displayReceipts.value.filter((item) => !item.projectId || visibleProjectIds.value.has(item.projectId)),
)
const visibleAllocations = computed(() => fundAllocations.filter((item) => visibleProjectIds.value.has(item.projectId)))
const displayExpenses = computed(() =>
  financeExpenses.map((item) => ({
    ...item,
    status: persisted.expenseStatus[item.id] ?? item.status,
    paidAt: persisted.expensePaidAt[item.id] ?? item.paidAt,
  })),
)
const visibleExpenses = computed(() => displayExpenses.value.filter((item) => visibleProjectIds.value.has(item.projectId)))
const currentExpenseRows = computed(() => {
  if (expenseTab.value === 'paid') {
    return visibleExpenses.value.filter((item) => item.status === '已付款')
  }

  if (expenseTab.value === 'payable') {
    return visibleExpenses.value.filter((item) => item.payableAmount > item.paidAmount)
  }

  if (expenseTab.value === 'frozen') {
    return visibleExpenses.value.filter((item) => item.status === '已冻结')
  }

  if (expenseTab.value === 'release') {
    return visibleExpenses.value.filter((item) => ['付款退回', '释放冻结'].includes(item.status))
  }

  return visibleExpenses.value
})
const displayWarnings = computed(() =>
  financeWarnings.map((item) => ({
    ...item,
    handlingStatus: persisted.warningHandlingStatus[item.id] ?? item.handlingStatus,
  })),
)
const visibleWarnings = computed(() => displayWarnings.value.filter((item) => visibleProjectIds.value.has(item.projectId)))
const displayCorrections = computed(() =>
  subjectCorrections.map((item) => ({
    ...item,
    status: persisted.correctionStatus[item.id] ?? item.status,
    pushStatus: persisted.correctionPushStatus[item.id] ?? item.pushStatus,
  })),
)
const visibleCorrections = computed(() => displayCorrections.value.filter((item) => visibleProjectIds.value.has(item.projectId)))
const currentReconciliationRows = computed(() => {
  if (reconciliationTab.value === 'daily') {
    return reconciliationRecords.filter((item) => item.type === '日对账')
  }

  if (reconciliationTab.value === 'monthly') {
    return reconciliationRecords.filter((item) => item.type === '月对账')
  }

  if (reconciliationTab.value === 'difference') {
    return reconciliationRecords.filter((item) => item.diffCount > 0)
  }

  return reconciliationRecords
})
const displaySyncRecords = computed(() =>
  lifecycleSyncRecords.map((item) => ({
    ...item,
    status: persisted.syncStatus[item.id] ?? item.status,
    retryCount: persisted.syncRetryCount[item.id] ?? item.retryCount,
  })),
)
const displaySettlements = computed(() =>
  financeSettlements.map((item) => ({
    ...item,
    status: persisted.settlementStatus[item.id] ?? item.status,
    currentNode: persisted.settlementNode[item.id] ?? item.currentNode,
  })),
)
const visibleSettlements = computed(() => displaySettlements.value.filter((item) => visibleProjectIds.value.has(item.projectId)))
const allAdjustments = computed(() => [...persisted.customAdjustments, ...budgetAdjustments])
const visibleAdjustments = computed(() => allAdjustments.value.filter((item) => visibleProjectIds.value.has(item.projectId)))
const allRules = computed(() => [...persisted.customRules, ...financeRules])

const filteredProjects = computed(() => {
  const keyword = projectFilter.keyword.trim().toLowerCase()
  const filtered = visibleProjects.value.filter((project) => {
    const matchKeyword =
      !keyword ||
      `${project.projectCode} ${project.projectName} ${project.leaderName}`.toLowerCase().includes(keyword)
    return (
      matchKeyword &&
      (projectFilter.projectType === 'all' || project.projectType === projectFilter.projectType) &&
      (projectFilter.sourceType === 'all' || project.sourceType === projectFilter.sourceType) &&
      (projectFilter.budgetMode === 'all' || project.budgetMode === projectFilter.budgetMode) &&
      (projectFilter.department === 'all' || project.department === projectFilter.department) &&
      (projectFilter.projectStatus === 'all' || project.projectStatus === projectFilter.projectStatus) &&
      (projectFilter.incomeStatus === 'all' || project.incomeStatus === projectFilter.incomeStatus) &&
      (projectFilter.reconciliationStatus === 'all' || project.reconciliationStatus === projectFilter.reconciliationStatus) &&
      (projectFilter.warningLevel === 'all' || project.warningLevel === projectFilter.warningLevel)
    )
  })

  return [...filtered].sort((a, b) => {
    if (sortKey.value === 'fundingDesc') {
      return b.totalFunding - a.totalFunding
    }
    if (sortKey.value === 'paymentDesc') {
      return b.paymentExecutionRate - a.paymentExecutionRate
    }
    if (sortKey.value === 'occupancyDesc') {
      return b.budgetOccupancyRate - a.budgetOccupancyRate
    }
    return a.projectCode.localeCompare(b.projectCode)
  })
})

const pagedProjects = computed(() => {
  const start = (projectPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})
const dataUpdateTime = computed(() =>
  visibleProjects.value.map((item) => item.lastSyncTime).sort((a, b) => b.localeCompare(a))[0] ?? '暂无同步数据',
)
const financeKpis = computed(() => {
  const list = visibleProjects.value
  const sum = (selector: (project: FinanceProject) => number) =>
    list.reduce((total, project) => total + selector(project), 0)

  return [
    { label: '管理项目数', value: `${list.length}`, desc: '按当前角色数据权限', icon: Files, tone: 'blue' },
    { label: '项目总经费', value: formatCurrency(sum((item) => item.totalFunding)), desc: '立项及合同经费合计', icon: Money, tone: 'blue' },
    { label: '已到账金额', value: formatCurrency(sum((item) => item.receivedAmount)), desc: '财务确认来款', icon: CircleCheck, tone: 'green' },
    { label: '已支出金额', value: formatCurrency(sum((item) => item.paidAmount)), desc: '不含应付未付', icon: DataLine, tone: 'indigo' },
    { label: '已冻结金额', value: formatCurrency(sum((item) => item.frozenAmount)), desc: '应付未付形成占用', icon: Warning, tone: 'orange' },
    { label: '可用余额', value: formatCurrency(sum((item) => item.availableBudget)), desc: '预算口径余额', icon: Bell, tone: 'green' },
  ]
})
const todoCards = computed(() => [
  { title: '待审核预算', desc: '预算编制和调整待审核', count: financeAdminScope.value ? 4 : 0, icon: Document },
  { title: '待认领来款', desc: '银行来款尚未关联项目', count: visibleReceipts.value.filter((item) => item.claimStatus === '待认领').length, icon: Money },
  { title: '对账差异', desc: '科研与财务平台存在差异', count: currentReconciliationRows.value.filter((item) => item.diffCount > 0).length, icon: Connection },
  { title: '待处理预警', desc: '需查看并填写处理说明', count: visibleWarnings.value.filter((item) => item.handlingStatus !== '已处理').length, icon: Warning },
  { title: '待审核决算', desc: '结题决算待财务审核', count: visibleSettlements.value.filter((item) => item.status === '审核中').length, icon: Tickets },
  { title: '同步异常', desc: '同步失败或延迟记录', count: displaySyncRecords.value.filter((item) => ['FAILED', 'DELAYED'].includes(item.status)).length, icon: Refresh },
])
const selectedProjectDetail = computed(() =>
  selectedProjectId.value ? getLifecycleProjectDetail(selectedProjectId.value) : null,
)
const selectedClassicFinanceSummary = computed<ClassicProjectFinanceSummary | null>(() => {
  const currentProject = selectedProjectDetail.value?.project

  if (!currentProject) {
    return null
  }

  return classicProjectFinanceSummaries.find((item) => item.projectCode === currentProject.projectCode) ?? null
})
const selectedClassicBudgetSubjects = computed<ClassicBudgetSubject[]>(() => {
  const classicSummary = selectedClassicFinanceSummary.value

  return classicSummary ? classicBudgetSubjectsByProjectId[classicSummary.projectId] ?? [] : []
})
const selectedClassicPaymentRows = computed<ClassicPaymentDetailRecord[]>(() => {
  const classicSummary = selectedClassicFinanceSummary.value

  return classicSummary ? classicPaymentDetailRecords.filter((item) => item.projectId === classicSummary.projectId) : []
})
const selectedClassicPayableRows = computed<ClassicPayableDetailRecord[]>(() => {
  const classicSummary = selectedClassicFinanceSummary.value

  return classicSummary ? classicPayableDetailRecords.filter((item) => item.projectId === classicSummary.projectId) : []
})
const selectedDetailExpenses = computed(() =>
  selectedProjectId.value ? visibleExpenses.value.filter((item) => item.projectId === selectedProjectId.value) : [],
)
const selectedDetailPaidExpenses = computed(() =>
  selectedDetailExpenses.value.filter((item) => item.paidAmount > 0 || item.status === '已付款'),
)
const selectedDetailPayableExpenses = computed(() =>
  selectedDetailExpenses.value.filter((item) => item.payableAmount > item.paidAmount || item.frozenAmount > 0),
)
const selectedDetailAdjustments = computed(() =>
  selectedProjectId.value ? visibleAdjustments.value.filter((item) => item.projectId === selectedProjectId.value) : [],
)
const selectedDetailWarnings = computed(() =>
  selectedProjectId.value ? visibleWarnings.value.filter((item) => item.projectId === selectedProjectId.value) : [],
)
const selectedDetailCorrections = computed(() =>
  selectedProjectId.value ? visibleCorrections.value.filter((item) => item.projectId === selectedProjectId.value) : [],
)
const selectedDetailSettlements = computed(() =>
  selectedProjectId.value ? visibleSettlements.value.filter((item) => item.projectId === selectedProjectId.value) : [],
)
const selectedDetailLogs = computed(() =>
  selectedProjectId.value ? operationLogs.filter((item) => item.projectId === selectedProjectId.value) : [],
)
const selectedPaymentRows = computed<FinancePaymentDisplayRow[]>(() => {
  if (selectedClassicPaymentRows.value.length) {
    return selectedClassicPaymentRows.value.map((item) => ({
      id: item.id,
      documentNo: item.paymentNo,
      paymentDate: item.paymentDate,
      targetName: item.payee,
      summary: item.summary,
      firstLevelSubject: item.primarySubject,
      secondLevelSubject: item.secondarySubject,
      amount: item.amount,
      status: item.status,
      voucherNo: item.voucherNo,
      syncTime: item.syncTime,
    }))
  }

  return selectedDetailPaidExpenses.value.map((item) => ({
    id: item.id,
    documentNo: item.expenseNo,
    paymentDate: item.paidAt ?? '-',
    targetName: item.targetName,
    summary: item.businessType,
    firstLevelSubject: item.firstLevelSubject,
    secondLevelSubject: item.secondLevelSubject,
    amount: item.paidAmount,
    status: item.status,
    voucherNo: item.voucherNo ?? '-',
    syncTime: selectedProjectDetail.value?.project.lastSyncTime ?? '-',
  }))
})
const selectedPayableRows = computed<FinancePayableDisplayRow[]>(() => {
  if (selectedClassicPayableRows.value.length) {
    return selectedClassicPayableRows.value.map((item) => ({
      id: item.id,
      documentNo: item.payableNo,
      payableType: expenseSourceLabelsByClassicPayableType[item.payableType],
      confirmDate: item.confirmDate,
      targetName: item.supplier,
      summary: item.summary,
      firstLevelSubject: item.primarySubject,
      secondLevelSubject: item.secondarySubject,
      amount: item.amount,
      freezeStatus: item.freezeStatus,
      expectedPaymentDate: item.expectedPaymentDate,
      syncTime: item.syncTime,
    }))
  }

  return selectedDetailPayableExpenses.value.map((item) => ({
    id: item.id,
    documentNo: item.expenseNo,
    payableType: expenseSourceText(item.source),
    confirmDate: item.frozenAt ?? '-',
    targetName: item.targetName,
    summary: item.businessType,
    firstLevelSubject: item.firstLevelSubject,
    secondLevelSubject: item.secondLevelSubject,
    amount: unpaidPayableAmount(item),
    freezeStatus: item.status,
    expectedPaymentDate: '待财务回传',
    syncTime: selectedProjectDetail.value?.project.lastSyncTime ?? '-',
  }))
})
const selectedBudgetExecutionTree = computed<BudgetSubjectTreeRow[]>(() =>
  buildBudgetExecutionTree(selectedProjectDetail.value?.subjects ?? []),
)
const selectedBudgetDefaultExpandedKeys = computed(() =>
  selectedBudgetExecutionTree.value.map((item) => item.id),
)

const canOperateFinance = computed(() => financeAdminScope.value)
const canStartAdjustment = computed(() => financeAdminScope.value || ownerScope.value)
const canSubmitSettlement = computed(() => financeAdminScope.value || ownerScope.value)

function tagTypeByRisk(level: RiskLevel) {
  if (level === 'WARNING') return 'danger'
  return level === 'ATTENTION' ? 'warning' : 'success'
}

function tagTypeBySync(status: SyncStatus) {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'DELAYED') return 'warning'
  return 'info'
}

function expenseSourceText(source: ExpenseSource) {
  return expenseSourceLabels[source]
}

function buildBudgetExecutionTree(subjects: BudgetSubject[]): BudgetSubjectTreeRow[] {
  if (selectedClassicBudgetSubjects.value.length) {
    return buildClassicBudgetExecutionTree(selectedClassicBudgetSubjects.value)
  }

  return buildLifecycleBudgetExecutionTree(subjects)
}

function buildClassicBudgetExecutionTree(subjects: ClassicBudgetSubject[]): BudgetSubjectTreeRow[] {
  const subjectMap = new Map<string, BudgetSubjectTreeRow>()
  const roots: BudgetSubjectTreeRow[] = []

  subjects.forEach((subject) => {
    subjectMap.set(subject.id, convertClassicBudgetSubject(subject))
  })

  subjectMap.forEach((subject) => {
    if (subject.parentId && subjectMap.has(subject.parentId)) {
      const parent = subjectMap.get(subject.parentId)
      subject.primarySubjectName = parent?.subjectName ?? subject.subjectName
      subject.secondarySubjectName = subject.subjectName
      parent?.children?.push(subject)
      return
    }

    subject.primarySubjectName = subject.subjectName
    subject.secondarySubjectName = '一级科目合计'
    roots.push(subject)
  })

  subjectMap.forEach((subject) => {
    if (subject.level !== 2) {
      return
    }

    const detailRows = createThirdLevelBudgetDetailsFromRecords(subject)

    if (detailRows.length) {
      subject.children = detailRows
    }
  })

  return roots
}

function buildLifecycleBudgetExecutionTree(subjects: BudgetSubject[]): BudgetSubjectTreeRow[] {
  const subjectMap = new Map<string, BudgetSubjectTreeRow>()
  const roots: BudgetSubjectTreeRow[] = []

  subjects.forEach((subject) => {
    subjectMap.set(subject.id, {
      ...subject,
      children: [],
      primarySubjectName: subject.level === 1 ? subject.subjectName : undefined,
      secondarySubjectName: subject.level === 2 ? subject.subjectName : undefined,
    })
  })

  subjectMap.forEach((subject) => {
    if (subject.parentId && subjectMap.has(subject.parentId)) {
      const parent = subjectMap.get(subject.parentId)
      subject.primarySubjectName = parent?.primarySubjectName ?? parent?.subjectName ?? subject.subjectName
      subject.secondarySubjectName = subject.level === 2 ? subject.subjectName : parent?.secondarySubjectName
      parent?.children?.push(subject)
      return
    }

    subject.primarySubjectName = subject.subjectName
    subject.secondarySubjectName = subject.level === 1 ? '一级科目合计' : subject.subjectName
    roots.push(subject)
  })

  subjectMap.forEach((subject) => {
    if (subject.level === 2) {
      const detailRows = createThirdLevelBudgetDetailsFromRecords(subject)

      if (detailRows.length) {
        subject.children = detailRows
      }
    }
  })

  return roots
}

function convertClassicBudgetSubject(subject: ClassicBudgetSubject): BudgetSubjectTreeRow {
  return {
    id: subject.id,
    projectId: subject.projectId,
    parentId: subject.parentId,
    level: subject.level,
    subjectName: subject.name,
    approvedAmount: subject.budgetAmount,
    adjustedAmount: subject.budgetAmount,
    paidAmount: subject.paidAmount,
    frozenAmount: subject.unpaidPayableAmount,
    availableAmount: subject.availableAmount,
    riskStatus: getRiskLevelByOccupancyRate(subject.occupancyRate),
    fundNature: subject.fundNature,
    detailCode: subject.code,
    children: [],
  }
}

function createThirdLevelBudgetDetailsFromRecords(subject: BudgetSubjectTreeRow): BudgetSubjectTreeRow[] {
  const primaryName = subject.primarySubjectName ?? ''
  const secondaryName = subject.subjectName
  const rows: BudgetSubjectTreeRow[] = []

  selectedPaymentRows.value
    .filter((item) => item.firstLevelSubject === primaryName && item.secondLevelSubject === secondaryName)
    .forEach((item, index) => {
      rows.push({
        id: `${subject.id}-paid-${item.id}`,
        projectId: subject.projectId,
        parentId: subject.id,
        level: 3,
        subjectName: item.summary || item.documentNo,
        primarySubjectName: primaryName,
        secondarySubjectName: secondaryName,
        approvedAmount: 0,
        adjustedAmount: 0,
        paidAmount: item.amount,
        frozenAmount: 0,
        availableAmount: 0,
        riskStatus: 'NORMAL',
        fundNature: subject.fundNature,
        detailCode: `${index + 1}`.padStart(2, '0'),
        detailType: '已付款',
        remark: `${item.paymentDate} · ${item.targetName}`,
        sourceDocumentNo: item.documentNo,
        targetName: item.targetName,
        expenseStatus: item.status,
      })
    })

  selectedPayableRows.value
    .filter((item) => item.firstLevelSubject === primaryName && item.secondLevelSubject === secondaryName)
    .forEach((item, index) => {
      rows.push({
        id: `${subject.id}-payable-${item.id}`,
        projectId: subject.projectId,
        parentId: subject.id,
        level: 3,
        subjectName: item.summary || item.documentNo,
        primarySubjectName: primaryName,
        secondarySubjectName: secondaryName,
        approvedAmount: 0,
        adjustedAmount: 0,
        paidAmount: 0,
        frozenAmount: item.amount,
        availableAmount: 0,
        riskStatus: 'ATTENTION',
        fundNature: subject.fundNature,
        detailCode: `${index + 1}`.padStart(2, '0'),
        detailType: item.payableType,
        remark: `${item.confirmDate} · ${item.targetName}`,
        sourceDocumentNo: item.documentNo,
        targetName: item.targetName,
        expenseStatus: item.freezeStatus,
      })
    })

  return rows
}

function getRiskLevelByOccupancyRate(occupancyRate: number): RiskLevel {
  if (occupancyRate >= 0.9) {
    return 'WARNING'
  }

  if (occupancyRate >= 0.75) {
    return 'ATTENTION'
  }

  return 'NORMAL'
}

function formatBudgetAmount(row: BudgetSubjectTreeRow, field: 'adjustedAmount' | 'paidAmount' | 'frozenAmount' | 'occupied' | 'availableAmount') {
  if (row.level === 3 && (field === 'adjustedAmount' || field === 'availableAmount')) {
    return '—'
  }

  if (field === 'occupied') {
    return formatCurrency(subjectOccupiedAmount(row))
  }

  return formatCurrency(row[field])
}

function getBudgetSubjectDescription(row: BudgetSubjectTreeRow) {
  if (row.level === 1) {
    return row.fundNature === 'INDIRECT' ? '一级科目汇总 · 间接经费' : '一级科目汇总 · 直接经费'
  }

  if (row.level === 2) {
    return row.children?.length ? '二级科目合计，可展开查看单据明细' : '二级科目合计，暂无单据明细'
  }

  return row.remark ?? row.detailType ?? '三级单据明细'
}

function getBudgetLevelLabel(row: BudgetSubjectTreeRow) {
  if (row.level === 1) {
    return row.subjectName
  }

  return row.primarySubjectName || '—'
}

function getBudgetSecondaryLabel(row: BudgetSubjectTreeRow) {
  if (row.level === 1) {
    return '一级科目合计'
  }

  return row.secondarySubjectName || row.subjectName
}

function getBudgetDetailLabel(row: BudgetSubjectTreeRow) {
  if (row.level === 1) {
    return '—'
  }

  if (row.level === 2) {
    return row.children?.length ? `${row.children.length} 条三级明细` : '暂无三级明细'
  }

  return row.sourceDocumentNo ? `${row.detailType} · ${row.sourceDocumentNo}` : row.detailType ?? '三级明细'
}

function getBudgetProgressColor(row: BudgetSubjectTreeRow) {
  if (row.riskStatus === 'WARNING') {
    return '#e5484d'
  }

  if (row.riskStatus === 'ATTENTION') {
    return '#e79a32'
  }

  return '#3478e5'
}

function detailTotalBudget(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.totalBudget ?? project.approvedBudget
}

function detailPaidAmount(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.paidAmount ?? project.paidAmount
}

function detailUnpaidPayableAmount(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.unpaidPayableAmount ?? project.frozenAmount
}

function detailOccupiedAmount(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.occupiedAmount ?? projectOccupiedAmount(project)
}

function detailAvailableAmount(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.availableAmount ?? project.availableBudget
}

function detailPaymentExecutionRate(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.actualPaymentRate ?? project.paymentExecutionRate
}

function detailBudgetOccupancyRate(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.budgetOccupancyRate ?? project.budgetOccupancyRate
}

function detailAvailableRate(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.availableRate ?? projectAvailableRate(project)
}

function detailProjectPeriod(project: FinanceProject) {
  return selectedClassicFinanceSummary.value?.projectPeriod ?? `${project.startDate} 至 ${project.endDate}`
}

const laborBudgetRate = computed(() => {
  const totalBudget = selectedProjectDetail.value ? detailTotalBudget(selectedProjectDetail.value.project) : 0
  const laborSubject = selectedBudgetExecutionTree.value.find((item) => item.level === 1 && item.subjectName.includes('劳务费'))

  return totalBudget && laborSubject ? laborSubject.adjustedAmount / totalBudget : 0
})

const outsourcingBudgetRate = computed(() => {
  const totalBudget = selectedProjectDetail.value ? detailTotalBudget(selectedProjectDetail.value.project) : 0
  const outsourcingSubject = selectedBudgetExecutionTree.value.find(
    (item) => item.level === 1 && (item.subjectName.includes('外协费') || item.subjectName.includes('外协经费')),
  )

  return totalBudget && outsourcingSubject ? outsourcingSubject.adjustedAmount / totalBudget : 0
})

function projectOccupiedAmount(project: FinanceProject) {
  return project.paidAmount + project.frozenAmount
}

function projectAvailableRate(project: FinanceProject) {
  return project.approvedBudget ? project.availableBudget / project.approvedBudget : 0
}

function subjectOccupiedAmount(subject: BudgetSubject) {
  return subject.paidAmount + subject.frozenAmount
}

function subjectOccupancyRate(subject: BudgetSubject) {
  return subject.adjustedAmount ? subjectOccupiedAmount(subject) / subject.adjustedAmount : 0
}

function unpaidPayableAmount(row: { payableAmount: number; paidAmount: number; frozenAmount: number }) {
  return Math.max(row.payableAmount - row.paidAmount, row.frozenAmount, 0)
}

function warningTagType(level: FinanceWarning['level']) {
  if (level === 'HIGH') return 'danger'
  return level === 'WARNING' ? 'warning' : 'info'
}

function tagTypeByStatus(status: string) {
  if (['已通过', '已处理', '已核实', '已认领', '已平账', '已归档', '已付款', '已结束', '已确认'].includes(status)) {
    return 'success'
  }
  if (['待处理', '审批中', '审核中', '终审中', '待认领', '待核对', '有差异', '已冻结', '处理中'].includes(status)) {
    return 'warning'
  }
  if (['同步失败', '已退回', '失败', '付款退回'].includes(status)) {
    return 'danger'
  }
  return 'info'
}

function searchProjects() {
  projectPage.value = 1
  tableLoading.value = true
  window.setTimeout(() => {
    tableLoading.value = false
    ElMessage.success('已按当前条件刷新经费项目列表')
  }, 260)
}

function resetProjects() {
  Object.assign(projectFilter, {
    keyword: '',
    projectType: 'all',
    sourceType: 'all',
    budgetMode: 'all',
    department: 'all',
    projectStatus: 'all',
    incomeStatus: 'all',
    reconciliationStatus: 'all',
    warningLevel: 'all',
  })
  sortKey.value = 'default'
  projectPage.value = 1
  ElMessage.info('已重置查询条件')
}

function exportCurrentRows() {
  ElMessage.success('原型已生成导出任务，正式环境将调用后端导出 Excel')
}

function showToast(text: string) {
  ElMessage.success(text)
}

function getFinanceProjectDetailPath(projectId: string) {
  const basePath = props.roleKey === 'projectMember' ? '/project-member/finance-overview' : '/research-project-admin/finance-workbench'

  return `${basePath}/${encodeURIComponent(projectId)}`
}

function openProject(projectId: string) {
  const matched = visibleProjects.value.find((item) => item.id === projectId || item.projectCode === projectId)
  const targetProjectId = matched?.id ?? projectId

  drawerVisible.value = false
  router.push(getFinanceProjectDetailPath(targetProjectId))
}

function normalizeQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim()
  }

  return String(value ?? '').trim()
}

function openProjectFromRouteQuery() {
  if (viewKey.value !== 'workbench') {
    return
  }

  const target = normalizeQueryValue(route.query.projectCode) || normalizeQueryValue(route.query.projectId)

  if (!target) {
    return
  }

  const matched = visibleProjects.value.find((item) => item.projectCode === target || item.id === target)

  if (!matched) {
    if (lastAutoOpenFinanceTarget.value !== target) {
      lastAutoOpenFinanceTarget.value = target
      ElMessage.warning(`未找到项目 ${target} 的经费详情，请在财务工作台列表中查看`)
    }
    return
  }

  if (lastAutoOpenFinanceTarget.value === target && route.path === getFinanceProjectDetailPath(matched.id)) {
    return
  }

  lastAutoOpenFinanceTarget.value = target
  router.replace(getFinanceProjectDetailPath(matched.id))
}

watch(
  () => [route.query.projectCode, route.query.projectId, visibleProjects.value.length, viewKey.value],
  openProjectFromRouteQuery,
  { immediate: true },
)

function openGenericDialog(title: string, text: string) {
  genericDialogTitle.value = title
  genericDialogText.value = text
  genericDialogVisible.value = true
}

function subjectsForProject(projectId: string) {
  return budgetSubjects.filter((item) => item.projectId === projectId)
}

function claimReceipt(row: FundingReceipt) {
  if (!canOperateFinance.value) {
    ElMessage.warning('当前角色没有来款认领权限')
    return
  }
  persisted.receiptClaimStatus[row.id] = '已认领'
  persisted.receiptAllocationStatus[row.id] = '待下拨'
  savePersistedState()
  ElMessage.success('已模拟认领来款，等待财务平台确认回执')
}

function markExpensePaid(rowId: string) {
  if (!canOperateFinance.value) {
    ElMessage.warning('科研平台仅展示财务平台结果，当前角色不能模拟付款回执')
    return
  }
  persisted.expenseStatus[rowId] = '已付款'
  persisted.expensePaidAt[rowId] = '2026-08-28'
  savePersistedState()
  ElMessage.success('已模拟财务平台付款回传')
}

function returnPayment(rowId: string) {
  if (!canOperateFinance.value) {
    ElMessage.warning('当前角色无权处理付款退回')
    return
  }
  persisted.expenseStatus[rowId] = '付款退回'
  savePersistedState()
  ElMessage.warning('已模拟付款退回，需等待财务平台释放冻结')
}

function releaseFreeze(rowId: string) {
  if (!canOperateFinance.value) {
    ElMessage.warning('冻结释放由财务平台执行，科研平台只展示回传结果')
    return
  }
  persisted.expenseStatus[rowId] = '释放冻结'
  savePersistedState()
  ElMessage.success('已模拟财务平台释放冻结回执')
}

function markWarningHandled(row: FinanceWarning) {
  if (memberReadOnlyScope.value) {
    ElMessage.warning('项目组成员仅可查看预警，不可处理')
    return
  }
  persisted.warningHandlingStatus[row.id] = '已处理'
  savePersistedState()
  ElMessage.success('已标记预警为已处理')
}

function submitCorrection(row: SubjectCorrection) {
  if (!financeAdminScope.value) {
    ElMessage.warning('科目纠错仅科研财务管理员可处理')
    return
  }
  persisted.correctionStatus[row.id] = '已提交更正'
  persisted.correctionPushStatus[row.id] = 'PROCESSING'
  savePersistedState()
  ElMessage.success('已模拟提交科目更正，等待财务平台确认')
}

function retrySync(row: LifecycleSyncRecord) {
  if (!canOperateFinance.value) {
    ElMessage.warning('同步重试必须调用后端接口，当前角色无权操作')
    return
  }
  if (!['FAILED', 'DELAYED'].includes(row.status)) {
    ElMessage.info('当前记录无需重试')
    return
  }
  persisted.syncStatus[row.id] = 'PROCESSING'
  persisted.syncRetryCount[row.id] = (persisted.syncRetryCount[row.id] ?? row.retryCount) + 1
  savePersistedState()
  ElMessage.success('已发起模拟重试，正式环境需调用后端重试接口')
}

function batchRetrySync() {
  const rows = displaySyncRecords.value.filter((row) => ['FAILED', 'DELAYED'].includes(row.status))
  rows.forEach((row) => {
    persisted.syncStatus[row.id] = 'PROCESSING'
    persisted.syncRetryCount[row.id] = (persisted.syncRetryCount[row.id] ?? row.retryCount) + 1
  })
  savePersistedState()
  ElMessage.success(`已模拟批量重试 ${rows.length} 条异常同步记录`)
}

function openAdjustmentDialog(projectId?: string) {
  if (!canStartAdjustment.value) {
    ElMessage.warning('当前角色只读，不能发起预算调整')
    return
  }
  adjustmentForm.projectId = projectId ?? visibleProjects.value[0]?.id ?? financeProjects[0]?.id ?? ''
  adjustmentDialogVisible.value = true
}

function submitAdjustment() {
  if (!adjustmentForm.projectId) {
    ElMessage.warning('请选择项目')
    return
  }
  if (adjustmentForm.amount <= 0) {
    ElMessage.warning('调整金额必须大于 0')
    return
  }
  if (
    ['SUBJECT_INTERNAL', 'SUBJECT_TRANSFER'].includes(adjustmentForm.adjustmentType) &&
    adjustmentForm.fromSubject === adjustmentForm.toSubject
  ) {
    ElMessage.warning('调减科目和调增科目不能相同')
    return
  }

  const project = financeProjects.find((item) => item.id === adjustmentForm.projectId)
  if (!project) return

  persisted.customAdjustments.unshift({
    id: `custom-adjust-${Date.now()}`,
    adjustmentNo: `TZ${Date.now().toString().slice(-10)}`,
    adjustmentType: adjustmentForm.adjustmentType,
    projectId: adjustmentForm.projectId,
    content:
      adjustmentForm.adjustmentType === 'BUDGET_INCREASE'
        ? '预算增加并关联来款记录'
        : `${adjustmentForm.fromSubject} 调整至 ${adjustmentForm.toSubject}`,
    amount: adjustmentForm.amount,
    applicant: props.currentUser?.displayName ?? '当前用户',
    currentNode: '科研财务管理员',
    approvalStatus: '审批中',
    financeSyncStatus: 'WAITING',
    receiptStatus: '待回执',
    beforeLaborRate: 0.22,
    afterLaborRate: persisted.financeRuleConfig.laborFeeBase === 'DIRECT_COST' ? 0.26 : 0.2,
    beforeOutsourcingRate: project.projectType === 'HORIZONTAL' ? 0.42 : 0,
    afterOutsourcingRate: project.projectType === 'HORIZONTAL' ? 0.46 : 0,
  })
  savePersistedState()
  adjustmentDialogVisible.value = false
  ElMessage.success('预算调整已保存到本地原型状态')
}

function submitNewRule() {
  if (!financeAdminScope.value) {
    ElMessage.warning('预警规则配置仅科研财务管理员可操作')
    return
  }
  if (!newRuleForm.ruleName.trim()) {
    ElMessage.warning('请输入规则名称')
    return
  }
  persisted.customRules.unshift({
    id: `custom-rule-${Date.now()}`,
    ruleName: newRuleForm.ruleName,
    enabled: true,
    projectType: newRuleForm.projectType,
    metric: newRuleForm.metric,
    operator: newRuleForm.operator,
    threshold: newRuleForm.threshold,
    level: newRuleForm.level,
    recipients: newRuleForm.recipients,
    notifyWay: '站内消息',
    scanTime: '每日 08:30',
    noRepeatIn24h: true,
  })
  savePersistedState()
  ruleDialogVisible.value = false
  ElMessage.success('已新增本地预警规则')
}

function updateRuleConfig() {
  savePersistedState()
  ElMessage.success('规则口径已保存到本地原型状态')
}

function startSettlement() {
  if (!canSubmitSettlement.value) {
    ElMessage.warning('当前角色不能发起或审核财务决算')
    return
  }
  settlementDialogVisible.value = true
}

function approveSettlement(row: FinanceSettlement) {
  if (!financeAdminScope.value) {
    ElMessage.warning('只有科研财务管理员可审核财务决算')
    return
  }
  persisted.settlementStatus[row.id] = '已通过'
  persisted.settlementNode[row.id] = '推送财务平台'
  savePersistedState()
  ElMessage.success('已模拟通过决算审核')
}

function rejectSettlement(row: FinanceSettlement) {
  if (!financeAdminScope.value) {
    ElMessage.warning('只有科研财务管理员可退回财务决算')
    return
  }
  persisted.settlementStatus[row.id] = '已退回'
  persisted.settlementNode[row.id] = '项目负责人'
  savePersistedState()
  ElMessage.warning('已模拟退回决算申请')
}
</script>

<template>
  <section class="finance-life-page">
    <header
      v-if="!['workbench', 'budget', 'alerts', 'reconciliation'].includes(viewKey)"
      class="finance-life-header"
    >
      <div>
        <p class="finance-breadcrumb">经费管理 / {{ pageTitle }}</p>
        <h1>{{ pageTitle }}</h1>
        <span>{{ pageDescription }}</span>
      </div>
      <aside>
        <strong>数据更新时间</strong>
        <em>{{ dataUpdateTime }}</em>
        <p>数据来源：科研平台预算数据 + 财务平台经费执行数据</p>
      </aside>
    </header>

    <el-alert
      v-if="!['workbench', 'budget', 'alerts', 'reconciliation'].includes(viewKey)"
      class="finance-scope-alert"
      type="info"
      :closable="false"
      show-icon
    >
      <template #title>{{ roleScopeText }}</template>
    </el-alert>

    <section v-if="viewKey === 'workbench' || viewKey === 'ledger'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>{{ viewKey === 'ledger' ? '项目经费台账' : '项目经费执行表' }}</h2>
        </div>
        <el-button :icon="Download" @click="exportCurrentRows">导出</el-button>
      </header>

      <section class="finance-filter-panel">
        <el-input v-model="projectFilter.keyword" class="finance-filter-keyword" placeholder="项目编号、项目名称、负责人" :prefix-icon="Search" @keyup.enter="searchProjects" />
        <el-select v-model="projectFilter.projectType" placeholder="项目类型">
          <el-option label="全部项目类型" value="all" />
          <el-option v-for="(label, key) in projectTypeLabels" :key="key" :label="label" :value="key" />
        </el-select>
        <el-select v-model="projectFilter.sourceType" placeholder="院内／院外">
          <el-option label="全部来源" value="all" />
          <el-option label="院内" value="院内" />
          <el-option label="院外" value="院外" />
        </el-select>
        <el-select v-model="projectFilter.budgetMode" placeholder="预算模式">
          <el-option label="全部模式" value="all" />
          <el-option label="预算制" value="BUDGET_BASED" />
          <el-option label="包干制" value="LUMP_SUM" />
        </el-select>
        <el-select v-model="projectFilter.department" placeholder="学部／部门">
          <el-option label="全部部门" value="all" />
          <el-option v-for="dept in departments" :key="dept" :label="dept" :value="dept" />
        </el-select>
        <el-select v-model="projectFilter.projectStatus" placeholder="项目状态">
          <el-option label="全部状态" value="all" />
          <el-option v-for="status in projectStatuses" :key="status" :label="status" :value="status" />
        </el-select>
        <el-select v-model="projectFilter.incomeStatus" placeholder="到账状态">
          <el-option label="全部到账" value="all" />
          <el-option v-for="status in incomeStatuses" :key="status" :label="status" :value="status" />
        </el-select>
        <el-select v-model="projectFilter.reconciliationStatus" placeholder="对账状态">
          <el-option label="全部对账" value="all" />
          <el-option v-for="status in reconciliationStatuses" :key="status" :label="status" :value="status" />
        </el-select>
        <el-select v-model="projectFilter.warningLevel" placeholder="风险等级">
          <el-option label="全部风险" value="all" />
          <el-option label="正常" value="NORMAL" />
          <el-option label="关注" value="ATTENTION" />
          <el-option label="预警" value="WARNING" />
        </el-select>
        <el-select v-model="sortKey" placeholder="排序">
          <el-option label="默认排序" value="default" />
          <el-option label="总经费从高到低" value="fundingDesc" />
          <el-option label="经费执行率从高到低" value="paymentDesc" />
          <el-option label="预算占用率从高到低" value="occupancyDesc" />
        </el-select>
        <el-button type="primary" @click="searchProjects">查询</el-button>
        <el-button @click="resetProjects">重置</el-button>
      </section>

      <el-table v-loading="tableLoading" :data="pagedProjects" row-key="id" border class="finance-wide-table">
        <el-table-column prop="projectCode" label="项目编号" min-width="120" fixed />
        <el-table-column label="项目名称" min-width="220" show-overflow-tooltip fixed>
          <template #default="{ row }">
            <button class="finance-name-button" type="button" @click="openProject(row.id)">{{ row.projectName }}</button>
          </template>
        </el-table-column>
        <el-table-column label="项目类型" min-width="120"><template #default="{ row }">{{ projectTypeLabels[row.projectType as keyof typeof projectTypeLabels] }}</template></el-table-column>
        <el-table-column label="预算模式" width="100"><template #default="{ row }">{{ budgetModeLabels[row.budgetMode as keyof typeof budgetModeLabels] }}</template></el-table-column>
        <el-table-column prop="leaderName" label="负责人" width="100" />
        <el-table-column prop="department" label="学部／部门" min-width="130" show-overflow-tooltip />
        <el-table-column label="项目总经费" min-width="130"><template #default="{ row }">{{ formatCurrency(row.totalFunding) }}</template></el-table-column>
        <el-table-column label="已到账" min-width="120"><template #default="{ row }">{{ formatCurrency(row.receivedAmount) }}</template></el-table-column>
        <el-table-column label="已支出" min-width="120"><template #default="{ row }">{{ formatCurrency(row.paidAmount) }}</template></el-table-column>
        <el-table-column label="已冻结" min-width="120"><template #default="{ row }">{{ formatCurrency(row.frozenAmount) }}</template></el-table-column>
        <el-table-column label="可用余额" min-width="120"><template #default="{ row }">{{ formatCurrency(row.availableBudget) }}</template></el-table-column>
        <el-table-column label="经费执行率" min-width="170">
          <template #default="{ row }">
            <div class="finance-progress-cell">
              <el-progress :percentage="toProgressPercent(row.paymentExecutionRate)" :stroke-width="7" :show-text="false" />
              <span>{{ formatPercent(row.paymentExecutionRate) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="预算占用率" min-width="170">
          <template #default="{ row }">
            <div class="finance-progress-cell">
              <el-progress :percentage="toProgressPercent(row.budgetOccupancyRate)" :stroke-width="7" :show-text="false" color="#7c6ce6" />
              <span>{{ formatPercent(row.budgetOccupancyRate) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="reconciliationStatus" label="对账状态" width="110">
          <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.reconciliationStatus)">{{ row.reconciliationStatus }}</el-tag></template>
        </el-table-column>
        <el-table-column label="风险状态" width="100">
          <template #default="{ row }"><el-tag :type="tagTypeByRisk(row.warningLevel)">{{ riskTextMap[row.warningLevel as RiskLevel] }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="190">
          <template #default="{ row }">
            <el-button link type="primary" @click="openProject(row.id)">查看详情</el-button>
            <el-button link type="primary" :disabled="!canStartAdjustment" @click="openAdjustmentDialog(row.id)">预算调整</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无符合条件的经费项目" />
        </template>
      </el-table>

      <footer class="finance-pagination">
        <span>共 {{ filteredProjects.length }} 个项目</span>
        <el-pagination v-model:current-page="projectPage" v-model:page-size="pageSize" layout="prev, pager, next, sizes" :page-sizes="[6, 10, 20]" :total="filteredProjects.length" />
      </footer>
    </section>

    <section v-else-if="viewKey === 'receipts'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>到账与经费分拨</h2>
          <p>来款认领、关联项目、经费下拨和财务平台确认回执。</p>
        </div>
        <el-button type="primary" :icon="Plus" :disabled="memberReadOnlyScope" @click="allocationDialogVisible = true">新增分拨</el-button>
      </header>
      <el-tabs v-model="receiptTab" class="finance-tabs">
        <el-tab-pane label="到账管理" name="receipts">
          <el-table :data="visibleReceipts" row-key="id" border class="finance-wide-table">
            <el-table-column prop="receiptNo" label="来款编号" min-width="140" />
            <el-table-column label="来款金额" min-width="130"><template #default="{ row }">{{ formatCurrency(row.amount) }}</template></el-table-column>
            <el-table-column prop="receivedAt" label="来款日期" min-width="110" />
            <el-table-column prop="payerName" label="汇款单位" min-width="180" show-overflow-tooltip />
            <el-table-column prop="receiptFileName" label="银行回单" min-width="150" show-overflow-tooltip />
            <el-table-column label="关联项目" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ row.projectId ? getProjectName(row.projectId) : '待关联' }}</template></el-table-column>
            <el-table-column prop="claimStatus" label="认领状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.claimStatus)">{{ row.claimStatus }}</el-tag></template></el-table-column>
            <el-table-column prop="allocationStatus" label="下拨状态" width="110" />
            <el-table-column prop="financeReceiptStatus" label="财务平台回执" min-width="130" />
            <el-table-column label="操作" fixed="right" width="220">
              <template #default="{ row }">
                <el-button link type="primary" @click="openGenericDialog('来款详情', `${row.receiptNo}：${row.payerName}，金额 ${formatCurrency(row.amount)}`)">详情</el-button>
                <el-button link type="primary" :disabled="row.claimStatus === '已认领' || !canOperateFinance" @click="claimReceipt(row)">认领</el-button>
                <el-button link type="primary" @click="openGenericDialog('到账历史', '已展示来款关联、认领和财务回执历史。')">历史</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="经费分拨" name="allocations">
          <el-table :data="visibleAllocations" row-key="id" border class="finance-wide-table">
            <el-table-column prop="allocationNo" label="分拨编号" min-width="140" />
            <el-table-column label="项目" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ getProjectName(row.projectId) }}</template></el-table-column>
            <el-table-column prop="topicName" label="课题" min-width="150" />
            <el-table-column prop="partnerName" label="合作单位" min-width="180" show-overflow-tooltip />
            <el-table-column label="总经费" width="130"><template #default="{ row }">{{ formatCurrency(row.totalFunding) }}</template></el-table-column>
            <el-table-column label="分拨金额" width="130"><template #default="{ row }">{{ formatCurrency(row.allocationAmount) }}</template></el-table-column>
            <el-table-column label="已拨/待拨" width="170"><template #default="{ row }">{{ formatCurrency(row.paidAllocationAmount) }} / {{ formatCurrency(row.pendingAllocationAmount) }}</template></el-table-column>
            <el-table-column label="审批状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.approvalStatus)">{{ row.approvalStatus }}</el-tag></template></el-table-column>
            <el-table-column label="同步状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeBySync(row.syncStatus)">{{ syncTextMap[row.syncStatus as SyncStatus] }}</el-tag></template></el-table-column>
            <el-table-column label="操作" fixed="right" width="210"><template #default><el-button link type="primary" @click="openGenericDialog('审批进度', '发起人 → 科研财务管理员 → 学部负责人 → 财务平台回执')">审批进度</el-button><el-button link type="primary" @click="openGenericDialog('历史版本', '已展示分拨草稿、提交审核和历史版本。')">历史版本</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section v-else-if="viewKey === 'budget'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>预算管理</h2>
        </div>
        <el-button v-if="canStartAdjustment" type="primary" :icon="Plus" @click="openAdjustmentDialog()">新增预算调整</el-button>
      </header>
      <el-tabs v-model="budgetTab" class="finance-tabs">
        <el-tab-pane label="预算编制" name="compile">
          <div class="finance-budget-template-grid">
            <article v-for="project in visibleProjects" :key="project.id" class="budget-template-card">
              <strong>{{ project.projectName }}</strong>
              <p>{{ projectTypeLabels[project.projectType] }} / {{ budgetModeLabels[project.budgetMode] }}</p>
              <el-progress :percentage="toProgressPercent(project.budgetOccupancyRate)" :stroke-width="8" />
              <span>直接费用 {{ formatCurrency(project.directCostBudget) }}，间接费用 {{ formatCurrency(project.indirectCostBudget) }}</span>
              <el-button size="small" @click="openProject(project.id)">查看预算结构</el-button>
            </article>
          </div>
        </el-tab-pane>
        <el-tab-pane label="预算审核" name="audit">
          <el-table :data="visibleAdjustments.filter((item) => item.approvalStatus !== '已通过')" row-key="id" border>
            <el-table-column prop="adjustmentNo" label="审批单号" min-width="140" />
            <el-table-column label="调整类型" width="150"><template #default="{ row }">{{ adjustmentTypeLabels[row.adjustmentType as BudgetAdjustmentType] }}</template></el-table-column>
            <el-table-column label="项目" min-width="190" show-overflow-tooltip><template #default="{ row }">{{ getProjectName(row.projectId) }}</template></el-table-column>
            <el-table-column prop="currentNode" label="当前审批节点" min-width="140" />
            <el-table-column label="审批状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.approvalStatus)">{{ row.approvalStatus }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="160"><template #default><el-button link type="primary" @click="openGenericDialog('预算审批流程', '发起人 → 科研财务管理员 → 方向负责人 → 学部负责人 → 管理办负责人 → 院领导')">查看流程</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="预算调整" name="adjustments">
          <el-table :data="visibleAdjustments" row-key="id" border class="finance-wide-table">
            <el-table-column prop="adjustmentNo" label="调整单号" min-width="140" />
            <el-table-column label="调整类型" min-width="140">
              <template #default="{ row }">{{ adjustmentTypeLabels[row.adjustmentType as BudgetAdjustmentType] }}</template>
            </el-table-column>
            <el-table-column label="项目" min-width="190" show-overflow-tooltip>
              <template #default="{ row }">{{ getProjectName(row.projectId) }}</template>
            </el-table-column>
            <el-table-column prop="content" label="调整内容" min-width="180" show-overflow-tooltip />
            <el-table-column label="调整金额" min-width="120">
              <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="applicant" label="发起人" width="100" />
            <el-table-column prop="currentNode" label="当前审批节点" min-width="130" />
            <el-table-column label="审批状态" width="110">
              <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.approvalStatus)">{{ row.approvalStatus }}</el-tag></template>
            </el-table-column>
            <el-table-column label="财务同步" width="110">
              <template #default="{ row }"><el-tag :type="tagTypeBySync(row.financeSyncStatus)">{{ syncTextMap[row.financeSyncStatus as SyncStatus] }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="receiptStatus" label="回执状态" width="110" />
            <el-table-column label="比例校验" min-width="160">
              <template #default="{ row }">劳务 {{ formatPercent(row.afterLaborRate) }} / 外协 {{ formatPercent(row.afterOutsourcingRate) }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="{ row }">
                <el-button link type="primary" @click="openGenericDialog('调整详情', `${row.adjustmentNo}：${row.content}`)">详情</el-button>
                <el-button link type="primary" @click="openGenericDialog('调整前后差异', '已展示调整前预算、调整后预算、劳务费比例和外协费比例。')">差异</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="预算版本" name="versions">
          <el-table :data="budgetVersions.filter((item) => visibleProjectIds.has(item.projectId))" row-key="id" border class="finance-wide-table">
            <el-table-column prop="versionNo" label="版本号" width="100" />
            <el-table-column label="项目" min-width="190" show-overflow-tooltip>
              <template #default="{ row }">{{ getProjectName(row.projectId) }}</template>
            </el-table-column>
            <el-table-column prop="effectiveAt" label="生效时间" width="120" />
            <el-table-column prop="reason" label="变更原因" min-width="180" show-overflow-tooltip />
            <el-table-column prop="changedBy" label="变更人" width="120" />
            <el-table-column prop="approvalNo" label="审批单号" min-width="140" />
            <el-table-column label="总预算" width="130"><template #default="{ row }">{{ formatCurrency(row.totalBudget) }}</template></el-table-column>
            <el-table-column prop="status" label="版本状态" width="110" />
            <el-table-column label="操作" width="180"><template #default><el-button link type="primary" @click="openGenericDialog('新旧版本对比', '已展示预算版本差异、审批单号和生效时间。')">版本对比</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section v-else-if="viewKey === 'expenses'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>支出与冻结</h2>
          <p>科研平台展示财务和业务平台回传结果，不直接完成真实扣款或付款。</p>
        </div>
      </header>
      <el-tabs v-model="expenseTab" class="finance-tabs">
        <el-tab-pane label="全部支出" name="all" />
        <el-tab-pane label="已付款" name="paid" />
        <el-tab-pane label="应付未付" name="payable" />
        <el-tab-pane label="冻结记录" name="frozen" />
        <el-tab-pane label="退回与释放" name="release" />
      </el-tabs>
      <el-table :data="currentExpenseRows" row-key="id" border class="finance-wide-table">
        <el-table-column prop="expenseNo" label="支出编号" min-width="140" fixed />
        <el-table-column prop="sourceSystem" label="来源系统" min-width="150" />
        <el-table-column label="业务类型" min-width="170">
          <template #default="{ row }">{{ expenseSourceText(row.source) }}</template>
        </el-table-column>
        <el-table-column label="项目" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">{{ getProjectCode(row.projectId) }} / {{ getProjectName(row.projectId) }}</template>
        </el-table-column>
        <el-table-column prop="targetName" label="支出对象" min-width="170" show-overflow-tooltip />
        <el-table-column prop="sourceDocumentNo" label="关联合同／采购单" min-width="150" />
        <el-table-column prop="firstLevelSubject" label="一级科目" min-width="110" />
        <el-table-column prop="secondLevelSubject" label="二级科目" min-width="140" />
        <el-table-column label="应付金额" min-width="120"><template #default="{ row }">{{ formatCurrency(row.payableAmount) }}</template></el-table-column>
        <el-table-column label="已付金额" min-width="120"><template #default="{ row }">{{ formatCurrency(row.paidAmount) }}</template></el-table-column>
        <el-table-column label="冻结金额" min-width="120"><template #default="{ row }">{{ formatCurrency(row.frozenAmount) }}</template></el-table-column>
        <el-table-column prop="frozenAt" label="冻结日期" width="110" />
        <el-table-column label="冻结天数" width="100"><template #default="{ row }"><span :class="{ 'freeze-danger': row.frozenDays > 90 }">{{ row.frozenDays ?? '-' }}</span></template></el-table-column>
        <el-table-column label="当前状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="voucherNo" label="财务凭证号" min-width="150" />
        <el-table-column prop="paidAt" label="付款日期" width="110" />
        <el-table-column prop="reconciliationStatus" label="对账状态" width="110" />
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGenericDialog('来源单据', `${row.sourceSystem}：${row.sourceDocumentNo}`)">来源</el-button>
            <el-button link type="primary" :disabled="!canOperateFinance || row.status === '已付款'" @click="markExpensePaid(row.id)">确认付款</el-button>
            <el-button link type="warning" :disabled="!canOperateFinance || row.status !== '已冻结'" @click="returnPayment(row.id)">退回</el-button>
            <el-button link type="primary" :disabled="!canOperateFinance || row.status !== '付款退回'" @click="releaseFreeze(row.id)">释放</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section v-else-if="viewKey === 'alerts'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>经费预警中心</h2>
        </div>
        <el-button v-if="financeAdminScope" type="primary" :icon="Plus" @click="ruleDialogVisible = true">新增规则</el-button>
      </header>
      <el-tabs v-model="alertTab" class="finance-tabs">
        <el-tab-pane label="预警记录" name="records">
          <el-table :data="visibleWarnings" row-key="id" border class="finance-wide-table">
            <el-table-column prop="warningNo" label="预警编号" min-width="140" />
            <el-table-column label="项目" min-width="190" show-overflow-tooltip>
              <template #default="{ row }">{{ getProjectName(row.projectId) }}</template>
            </el-table-column>
            <el-table-column prop="ruleName" label="规则名称" min-width="150" />
            <el-table-column label="当前指标值" width="120">
              <template #default="{ row }">{{ row.currentValue > 1 ? row.currentValue : formatPercent(row.currentValue) }}</template>
            </el-table-column>
            <el-table-column label="触发阈值" width="120">
              <template #default="{ row }">{{ row.threshold > 1 ? row.threshold : formatPercent(row.threshold) }}</template>
            </el-table-column>
            <el-table-column label="预警级别" width="110">
              <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.level)">{{ row.level }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="notifiedAt" label="触发时间" min-width="150" />
            <el-table-column prop="recipients" label="通知对象" min-width="170" show-overflow-tooltip />
            <el-table-column prop="notifyStatus" label="通知状态" width="100" />
            <el-table-column label="处理状态" width="110">
              <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.handlingStatus)">{{ row.handlingStatus }}</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="220">
              <template #default="{ row }">
                <el-button link type="primary" @click="openProject(row.projectId)">查看项目</el-button>
                <el-button link type="primary" @click="openGenericDialog('触发数据', `${row.ruleName}：当前值 ${row.currentValue}，阈值 ${row.threshold}`)">触发数据</el-button>
                <el-button link type="primary" :disabled="row.handlingStatus === '已处理'" @click="markWarningHandled(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="预警规则" name="rules">
          <section class="finance-rule-config">
            <div><span>劳务费比例</span><strong>{{ formatPercent(persisted.financeRuleConfig.laborFeeLimit) }}</strong></div>
            <div>
              <span>劳务费计算分母</span>
              <el-select v-model="persisted.financeRuleConfig.laborFeeBase" size="small" @change="updateRuleConfig">
                <el-option label="项目总预算" value="TOTAL_BUDGET" />
                <el-option label="直接费用" value="DIRECT_COST" />
              </el-select>
            </div>
            <div><span>外协费比例</span><strong>{{ formatPercent(persisted.financeRuleConfig.outsourcingFeeLimit) }}</strong></div>
            <div><span>冻结超时</span><strong>{{ persisted.financeRuleConfig.freezeTimeoutDays }} 天</strong></div>
            <div><span>余额不足</span><strong>{{ formatPercent(persisted.financeRuleConfig.balanceWarningRate) }}</strong></div>
          </section>
          <el-table :data="allRules" row-key="id" border>
            <el-table-column prop="ruleName" label="规则名称" min-width="160" />
            <el-table-column label="启用" width="90"><template #default="{ row }"><el-switch v-model="row.enabled" :disabled="!financeAdminScope" /></template></el-table-column>
            <el-table-column prop="projectType" label="适用项目类型" min-width="150" />
            <el-table-column prop="metric" label="监控指标" min-width="130" />
            <el-table-column label="阈值" width="110"><template #default="{ row }">{{ row.threshold >= 1 ? row.threshold : formatPercent(row.threshold) }}</template></el-table-column>
            <el-table-column prop="recipients" label="通知对象" min-width="170" show-overflow-tooltip />
            <el-table-column prop="scanTime" label="扫描时间" width="120" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section v-else-if="viewKey === 'reconciliation'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>科目纠错与对账</h2>
        </div>
      </header>
      <el-tabs v-model="reconciliationTab" class="finance-tabs">
        <el-tab-pane label="科目纠错" name="correction">
          <el-table :data="visibleCorrections" row-key="id" border class="finance-wide-table">
            <el-table-column prop="expenseNo" label="支出编号" min-width="140" />
            <el-table-column label="项目" min-width="190" show-overflow-tooltip><template #default="{ row }">{{ getProjectName(row.projectId) }}</template></el-table-column>
            <el-table-column prop="sourceSystem" label="来源系统" min-width="150" />
            <el-table-column prop="summary" label="业务摘要" min-width="190" show-overflow-tooltip />
            <el-table-column prop="financeSubject" label="财务平台原科目" min-width="150" />
            <el-table-column prop="matchedSubject" label="系统匹配科目" min-width="150" />
            <el-table-column prop="suggestedSubject" label="建议科目" min-width="150" />
            <el-table-column prop="reason" label="异常原因" min-width="190" show-overflow-tooltip />
            <el-table-column label="处理状态" width="120"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column label="推送状态" width="120"><template #default="{ row }"><el-tag :type="tagTypeBySync(row.pushStatus)">{{ syncTextMap[row.pushStatus as SyncStatus] }}</el-tag></template></el-table-column>
            <el-table-column prop="financeConfirmStatus" label="财务确认" width="110" />
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="{ row }">
                <el-button link type="primary" @click="openGenericDialog('纠错详情', `${row.summary}：建议调整为 ${row.suggestedSubject}`)">详情</el-button>
                <el-button link type="primary" :disabled="!financeAdminScope || row.status === '已提交更正'" @click="submitCorrection(row)">提交更正</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="日对账" name="daily">
          <el-table :data="currentReconciliationRows" row-key="id" border class="finance-wide-table">
            <el-table-column prop="batchNo" label="对账批次号" min-width="140" />
            <el-table-column prop="type" label="对账类型" width="100" />
            <el-table-column prop="date" label="对账日期" width="120" />
            <el-table-column prop="researchCount" label="科研记录数" width="110" />
            <el-table-column prop="financeCount" label="财务记录数" width="110" />
            <el-table-column label="科研平台金额" width="140"><template #default="{ row }">{{ formatCurrency(row.researchAmount) }}</template></el-table-column>
            <el-table-column label="财务平台金额" width="140"><template #default="{ row }">{{ formatCurrency(row.financeAmount) }}</template></el-table-column>
            <el-table-column prop="diffCount" label="差异笔数" width="100" />
            <el-table-column label="差异金额" width="130"><template #default="{ row }">{{ formatCurrency(row.diffAmount) }}</template></el-table-column>
            <el-table-column label="对账状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column label="操作" fixed="right" width="230"><template #default="{ row }"><el-button link type="primary" @click="openGenericDialog('差异明细', row.reason ?? '当前批次无差异。')">差异明细</el-button><el-button link type="primary" :disabled="row.diffCount === 0" @click="openGenericDialog('对账报告', '已生成对账报告并可导出差异。')">报告</el-button><el-button link type="primary" :disabled="row.diffCount === 0" @click="openGenericDialog('重新同步', '已模拟重新同步差异数据。')">重新同步</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="月对账" name="monthly">
          <el-table :data="currentReconciliationRows" row-key="id" border class="finance-wide-table">
            <el-table-column prop="batchNo" label="对账批次号" min-width="140" />
            <el-table-column prop="type" label="对账类型" width="100" />
            <el-table-column prop="date" label="对账日期" width="120" />
            <el-table-column prop="researchCount" label="科研记录数" width="110" />
            <el-table-column prop="financeCount" label="财务记录数" width="110" />
            <el-table-column label="科研平台金额" width="140"><template #default="{ row }">{{ formatCurrency(row.researchAmount) }}</template></el-table-column>
            <el-table-column label="财务平台金额" width="140"><template #default="{ row }">{{ formatCurrency(row.financeAmount) }}</template></el-table-column>
            <el-table-column prop="diffCount" label="差异笔数" width="100" />
            <el-table-column label="差异金额" width="130"><template #default="{ row }">{{ formatCurrency(row.diffAmount) }}</template></el-table-column>
            <el-table-column label="对账状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column label="操作" fixed="right" width="230"><template #default="{ row }"><el-button link type="primary" @click="openGenericDialog('差异明细', row.reason ?? '当前批次无差异。')">差异明细</el-button><el-button link type="primary" :disabled="row.diffCount === 0" @click="openGenericDialog('对账报告', '已生成对账报告并可导出差异。')">报告</el-button><el-button link type="primary" :disabled="row.diffCount === 0" @click="openGenericDialog('重新同步', '已模拟重新同步差异数据。')">重新同步</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="差异处理" name="difference">
          <el-table :data="currentReconciliationRows" row-key="id" border class="finance-wide-table">
            <el-table-column prop="batchNo" label="对账批次号" min-width="140" />
            <el-table-column prop="type" label="对账类型" width="100" />
            <el-table-column prop="date" label="对账日期" width="120" />
            <el-table-column prop="researchCount" label="科研记录数" width="110" />
            <el-table-column prop="financeCount" label="财务记录数" width="110" />
            <el-table-column label="科研平台金额" width="140"><template #default="{ row }">{{ formatCurrency(row.researchAmount) }}</template></el-table-column>
            <el-table-column label="财务平台金额" width="140"><template #default="{ row }">{{ formatCurrency(row.financeAmount) }}</template></el-table-column>
            <el-table-column prop="diffCount" label="差异笔数" width="100" />
            <el-table-column label="差异金额" width="130"><template #default="{ row }">{{ formatCurrency(row.diffAmount) }}</template></el-table-column>
            <el-table-column label="对账状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column label="操作" fixed="right" width="230"><template #default="{ row }"><el-button link type="primary" @click="openGenericDialog('差异明细', row.reason ?? '当前批次无差异。')">差异明细</el-button><el-button link type="primary" :disabled="row.diffCount === 0" @click="openGenericDialog('对账报告', '已生成对账报告并可导出差异。')">报告</el-button><el-button link type="primary" :disabled="row.diffCount === 0" @click="openGenericDialog('重新同步', '已模拟重新同步差异数据。')">重新同步</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </section>

    <section v-else-if="viewKey === 'reports'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>报表中心</h2>
          <p>本阶段使用 Toast 模拟在线预览、Excel 导出、PDF 导出和生成记录。</p>
        </div>
      </header>
      <div class="finance-report-filter">
        <el-input placeholder="项目或报表关键词" :prefix-icon="Search" />
        <el-select placeholder="项目类型"><el-option label="全部项目类型" value="all" /></el-select>
        <el-select placeholder="年度"><el-option label="2026 年" value="2026" /></el-select>
        <el-button type="primary" @click="showToast('报表筛选已刷新')">查询</el-button>
        <el-button @click="showToast('已重置报表筛选')">重置</el-button>
      </div>
      <section class="finance-report-grid">
        <article v-for="report in financeReports" :key="report.id" class="finance-report-card">
          <span>{{ report.scene }}</span>
          <h3>{{ report.title }}</h3>
          <p>{{ report.description }}</p>
          <div>
            <el-button size="small" type="primary" @click="showToast(`${report.title} 在线预览已打开`)">在线预览</el-button>
            <el-button size="small" @click="showToast(`${report.title} Excel 导出任务已创建`)">导出Excel</el-button>
            <el-button size="small" @click="showToast(`${report.title} PDF 导出任务已创建`)">导出PDF</el-button>
          </div>
        </article>
      </section>
    </section>

    <section v-else-if="viewKey === 'settlement'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>财务决算</h2>
          <p>项目负责人发起，科研财务管理员审核，推送财务平台确认后归档。</p>
        </div>
        <el-button v-if="canSubmitSettlement" type="primary" :icon="Plus" @click="startSettlement">发起结题财务决算</el-button>
      </header>
      <el-table :data="visibleSettlements" row-key="id" border class="finance-wide-table">
        <el-table-column prop="settlementNo" label="决算单号" min-width="140" />
        <el-table-column label="项目编号" width="120"><template #default="{ row }">{{ getProjectCode(row.projectId) }}</template></el-table-column>
        <el-table-column label="项目名称" min-width="190" show-overflow-tooltip><template #default="{ row }">{{ getProjectName(row.projectId) }}</template></el-table-column>
        <el-table-column label="项目负责人" width="110"><template #default="{ row }">{{ financeProjects.find((item) => item.id === row.projectId)?.leaderName }}</template></el-table-column>
        <el-table-column label="项目总经费" width="130"><template #default="{ row }">{{ formatCurrency(row.totalFunding) }}</template></el-table-column>
        <el-table-column label="已支出" width="120"><template #default="{ row }">{{ formatCurrency(row.paidAmount) }}</template></el-table-column>
        <el-table-column label="已冻结" width="120"><template #default="{ row }">{{ formatCurrency(row.frozenAmount) }}</template></el-table-column>
        <el-table-column label="剩余经费" width="120"><template #default="{ row }">{{ formatCurrency(row.remainingAmount) }}</template></el-table-column>
        <el-table-column prop="createdAt" label="发起时间" min-width="150" />
        <el-table-column prop="currentNode" label="当前审批节点" min-width="130" />
        <el-table-column label="决算状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)">{{ row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="financeConfirmStatus" label="财务确认" width="120" />
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGenericDialog('预算与决算对比', '已展示预算金额、实际支出、冻结款项和剩余经费说明。')">详情</el-button>
            <el-button link type="primary" :disabled="!financeAdminScope || row.status !== '审核中'" @click="approveSettlement(row)">通过</el-button>
            <el-button link type="danger" :disabled="!financeAdminScope || row.status !== '审核中'" @click="rejectSettlement(row)">退回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section v-else-if="viewKey === 'sync'" class="finance-card">
      <header class="finance-card-head">
        <div>
          <h2>数据同步中心</h2>
          <p>接入科研、财务、采购、算力/API、知识产权和人力实习生招聘平台。</p>
        </div>
        <el-button :icon="Refresh" :disabled="!financeAdminScope" @click="batchRetrySync">批量重试异常</el-button>
      </header>
      <el-table :data="displaySyncRecords" row-key="id" border class="finance-wide-table">
        <el-table-column prop="syncNo" label="同步编号" min-width="140" fixed />
        <el-table-column prop="sourceSystem" label="来源系统" min-width="150" />
        <el-table-column prop="targetSystem" label="目标系统" min-width="150" />
        <el-table-column prop="businessType" label="业务类型" min-width="130" />
        <el-table-column prop="businessNo" label="业务单号" min-width="150" />
        <el-table-column prop="projectCode" label="项目编号" min-width="120" />
        <el-table-column prop="direction" label="同步方向" min-width="130" />
        <el-table-column prop="pushedAt" label="推送时间" min-width="150" />
        <el-table-column prop="receiptAt" label="回执时间" min-width="150" />
        <el-table-column label="同步状态" width="110"><template #default="{ row }"><el-tag :type="tagTypeBySync(row.status)">{{ syncTextMap[row.status as SyncStatus] }}</el-tag></template></el-table-column>
        <el-table-column prop="retryCount" label="重试次数" width="100" />
        <el-table-column prop="errorReason" label="失败原因" min-width="190" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGenericDialog('同步详情', `${row.sourceSystem} → ${row.targetSystem}：${row.businessType}`)">详情</el-button>
            <el-button link type="primary" @click="openGenericDialog('原始数据', '已展示原始同步报文和财务平台回执。')">原始数据</el-button>
            <el-button link type="primary" :disabled="!financeAdminScope || !['FAILED', 'DELAYED'].includes(row.status)" @click="retrySync(row)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-drawer v-model="drawerVisible" class="finance-life-drawer classic-finance-drawer" size="78%" destroy-on-close>
      <template #header>
        <div class="drawer-title">
          <strong>项目经费详情</strong>
          <span v-if="selectedProjectDetail">{{ selectedProjectDetail.project.projectCode }} / {{ selectedProjectDetail.project.projectName }}</span>
        </div>
      </template>
      <template v-if="selectedProjectDetail">
        <section class="drawer-project-hero classic-detail-hero">
          <div>
            <h2>{{ selectedProjectDetail.project.projectName }}</h2>
            <p>
              {{ selectedProjectDetail.project.projectCode }}
              / {{ selectedProjectDetail.project.leaderName }}
              / {{ selectedProjectDetail.project.department }}
            </p>
          </div>
          <div class="drawer-tags">
            <el-tag effect="light">{{ selectedProjectDetail.project.projectStatus }}</el-tag>
            <el-tag :type="tagTypeBySync(selectedProjectDetail.project.syncStatus)" effect="light">{{ syncTextMap[selectedProjectDetail.project.syncStatus] }}</el-tag>
            <el-tag :type="tagTypeByRisk(selectedProjectDetail.project.warningLevel)" effect="light">{{ riskTextMap[selectedProjectDetail.project.warningLevel] }}</el-tag>
          </div>
        </section>

        <section class="classic-detail-metrics">
          <article>
            <span>项目总预算</span>
            <strong>{{ formatCurrency(detailTotalBudget(selectedProjectDetail.project)) }}</strong>
          </article>
          <article>
            <span>已付款</span>
            <strong>{{ formatCurrency(detailPaidAmount(selectedProjectDetail.project)) }}</strong>
          </article>
          <article>
            <span>应付未付</span>
            <strong>{{ formatCurrency(detailUnpaidPayableAmount(selectedProjectDetail.project)) }}</strong>
          </article>
          <article>
            <span>预算占用</span>
            <strong>{{ formatCurrency(detailOccupiedAmount(selectedProjectDetail.project)) }}</strong>
          </article>
          <article class="is-balance">
            <span>可用余额</span>
            <strong>{{ formatCurrency(detailAvailableAmount(selectedProjectDetail.project)) }}</strong>
          </article>
          <article>
            <span>可用余额比例</span>
            <strong>{{ formatPercent(detailAvailableRate(selectedProjectDetail.project)) }}</strong>
          </article>
        </section>

        <section class="classic-usage-panel" aria-label="剩余用量">
          <div>
            <span>实际付款执行率</span>
            <el-progress :percentage="toProgressPercent(detailPaymentExecutionRate(selectedProjectDetail.project))" :stroke-width="8" />
          </div>
          <div>
            <span>预算占用率</span>
            <el-progress :percentage="toProgressPercent(detailBudgetOccupancyRate(selectedProjectDetail.project))" :stroke-width="8" color="#7c6ce6" />
          </div>
          <div>
            <span>剩余用量</span>
            <el-progress :percentage="toProgressPercent(detailAvailableRate(selectedProjectDetail.project))" :stroke-width="8" color="#23a574" />
          </div>
        </section>

        <section class="classic-control-indicator-card">
          <div>
            <span>劳务费预算比例</span>
            <strong :class="{ warning: laborBudgetRate > 0.3 }">{{ formatPercent(laborBudgetRate) }}</strong>
            <small>控制上限 30%</small>
          </div>
          <el-progress
            :percentage="toProgressPercent(laborBudgetRate)"
            :stroke-width="8"
            :color="laborBudgetRate > 0.3 ? '#e5484d' : '#3478e5'"
          />
          <div>
            <span>外协费预算比例</span>
            <strong :class="{ warning: outsourcingBudgetRate > 0.5 }">{{ formatPercent(outsourcingBudgetRate) }}</strong>
            <small>控制上限 50%</small>
          </div>
          <el-progress
            :percentage="toProgressPercent(outsourcingBudgetRate)"
            :stroke-width="8"
            :color="outsourcingBudgetRate > 0.5 ? '#e5484d' : '#23a574'"
          />
        </section>

        <dl class="project-info-grid classic-info-grid">
          <div><dt>项目类型</dt><dd>{{ projectTypeLabels[selectedProjectDetail.project.projectType] }}</dd></div>
          <div><dt>预算模式</dt><dd>{{ budgetModeLabels[selectedProjectDetail.project.budgetMode] }}</dd></div>
          <div><dt>经费来源</dt><dd>{{ selectedProjectDetail.project.fundingSource }}</dd></div>
          <div><dt>项目周期</dt><dd>{{ detailProjectPeriod(selectedProjectDetail.project) }}</dd></div>
          <div><dt>最近同步</dt><dd>{{ selectedProjectDetail.project.lastSyncTime }}</dd></div>
        </dl>

        <el-tabs v-model="detailTab" class="finance-tabs classic-detail-tabs">
          <el-tab-pane label="预算执行" name="budget">
            <el-table
              :data="selectedBudgetExecutionTree"
              :expand-row-keys="selectedBudgetDefaultExpandedKeys"
              :indent="18"
              :tree-props="{ children: 'children' }"
              row-key="id"
              border
              class="finance-wide-table budget-execution-table"
            >
              <el-table-column label="一级科目" min-width="140" fixed>
                <template #default="{ row }">
                  <strong v-if="row.level === 1">{{ getBudgetLevelLabel(row) }}</strong>
                  <span v-else class="muted-cell">{{ getBudgetLevelLabel(row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="二级科目" min-width="190" show-overflow-tooltip>
                <template #default="{ row }">
                  <span :class="{ 'budget-secondary-name': row.level === 2 }">{{ getBudgetSecondaryLabel(row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="三级明细" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <span :class="['budget-subject-name', `level-${row.level}`]">
                    <el-tag v-if="row.level === 3" size="small" effect="plain" type="info">三级</el-tag>
                    {{ getBudgetDetailLabel(row) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="明细说明" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <span :class="{ 'muted-cell': row.level !== 3 }">{{ getBudgetSubjectDescription(row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="预算金额" width="130">
                <template #default="{ row }">{{ formatBudgetAmount(row, 'adjustedAmount') }}</template>
              </el-table-column>
              <el-table-column label="已付款" width="120">
                <template #default="{ row }">{{ formatBudgetAmount(row, 'paidAmount') }}</template>
              </el-table-column>
              <el-table-column label="应付未付" width="120">
                <template #default="{ row }">{{ formatBudgetAmount(row, 'frozenAmount') }}</template>
              </el-table-column>
              <el-table-column label="预算占用" width="120">
                <template #default="{ row }">{{ formatBudgetAmount(row, 'occupied') }}</template>
              </el-table-column>
              <el-table-column label="可用余额" width="120">
                <template #default="{ row }">{{ formatBudgetAmount(row, 'availableAmount') }}</template>
              </el-table-column>
              <el-table-column label="科目占用率" min-width="170">
                <template #default="{ row }">
                  <div class="finance-progress-cell">
                    <el-progress
                      :percentage="toProgressPercent(subjectOccupancyRate(row))"
                      :stroke-width="7"
                      :show-text="false"
                      :color="getBudgetProgressColor(row)"
                    />
                    <span>{{ formatPercent(subjectOccupancyRate(row)) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="风险状态" width="100">
                <template #default="{ row }"><el-tag :type="tagTypeByRisk(row.riskStatus)" effect="light">{{ riskTextMap[row.riskStatus as RiskLevel] }}</el-tag></template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="已付款明细" name="paid">
            <el-table :data="selectedPaymentRows" row-key="id" border class="finance-wide-table">
              <el-table-column prop="documentNo" label="付款单号" min-width="140" fixed />
              <el-table-column prop="paymentDate" label="付款日期" width="120" />
              <el-table-column prop="targetName" label="收款方" min-width="170" show-overflow-tooltip />
              <el-table-column prop="summary" label="付款摘要" min-width="170" show-overflow-tooltip />
              <el-table-column prop="firstLevelSubject" label="一级科目" width="110" />
              <el-table-column prop="secondLevelSubject" label="二级科目" min-width="140" />
              <el-table-column label="付款金额" width="120">
                <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="付款状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)" effect="light">{{ row.status }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="voucherNo" label="用友凭证号" min-width="150" />
              <el-table-column prop="syncTime" label="同步时间" min-width="150" />
              <template #empty>
                <el-empty description="暂无已付款明细" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="应付未付明细" name="payable">
            <el-table :data="selectedPayableRows" row-key="id" border class="finance-wide-table">
              <el-table-column prop="documentNo" label="应付单号" min-width="140" fixed />
              <el-table-column prop="payableType" label="应付类型" min-width="170" />
              <el-table-column prop="confirmDate" label="确认日期" width="120" />
              <el-table-column prop="targetName" label="供应商或收款对象" min-width="180" show-overflow-tooltip />
              <el-table-column prop="summary" label="摘要" min-width="170" show-overflow-tooltip />
              <el-table-column prop="firstLevelSubject" label="一级科目" width="110" />
              <el-table-column prop="secondLevelSubject" label="二级科目" min-width="140" />
              <el-table-column label="应付未付金额" width="140">
                <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="冻结状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.freezeStatus)" effect="light">{{ row.freezeStatus }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="expectedPaymentDate" label="预计付款日期" width="130" />
              <el-table-column prop="syncTime" label="同步时间" min-width="150" />
              <template #empty>
                <el-empty description="暂无应付未付明细" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="预算调整" name="adjustments">
            <el-table :data="selectedDetailAdjustments" row-key="id" border class="finance-wide-table">
              <el-table-column prop="adjustmentNo" label="调整单号" width="140" />
              <el-table-column label="调整类型" width="150">
                <template #default="{ row }">{{ adjustmentTypeLabels[row.adjustmentType as BudgetAdjustmentType] }}</template>
              </el-table-column>
              <el-table-column prop="content" label="调整内容" min-width="190" show-overflow-tooltip />
              <el-table-column label="调整金额" width="120">
                <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
              </el-table-column>
              <el-table-column prop="applicant" label="申请人" width="100" />
              <el-table-column prop="currentNode" label="当前节点" width="130" />
              <el-table-column label="审批状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.approvalStatus)" effect="light">{{ row.approvalStatus }}</el-tag></template>
              </el-table-column>
              <el-table-column label="用友同步" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeBySync(row.financeSyncStatus)" effect="light">{{ syncTextMap[row.financeSyncStatus as SyncStatus] }}</el-tag></template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无预算调整记录" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="预警记录" name="warnings">
            <el-table :data="selectedDetailWarnings" row-key="id" border class="finance-wide-table">
              <el-table-column prop="warningNo" label="预警编号" width="140" />
              <el-table-column prop="ruleName" label="预警类型" min-width="150" />
              <el-table-column label="风险等级" width="110">
                <template #default="{ row }"><el-tag :type="warningTagType(row.level)" effect="light">{{ row.level }}</el-tag></template>
              </el-table-column>
              <el-table-column label="当前值 / 阈值" width="140">
                <template #default="{ row }">{{ row.currentValue }} / {{ row.threshold }}</template>
              </el-table-column>
              <el-table-column prop="notifiedAt" label="触发时间" width="150" />
              <el-table-column prop="recipients" label="提醒对象" min-width="170" show-overflow-tooltip />
              <el-table-column prop="notifyStatus" label="提醒状态" width="110" />
              <el-table-column label="处理状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.handlingStatus)" effect="light">{{ row.handlingStatus }}</el-tag></template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无预警记录" />
              </template>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
      <el-empty v-else description="未找到项目经费详情" />
    </el-drawer>

    <el-dialog v-model="metricDialogVisible" title="经费数据口径" width="620px">
      <div class="metric-dialog-body">
        <p><strong>预算占用金额：</strong>已支出金额 + 已冻结金额。</p>
        <p><strong>可用预算：</strong>批复预算 - 已支出金额 - 已冻结金额。</p>
        <p><strong>经费执行率：</strong>已支出金额 / 批复预算。</p>
        <p><strong>预算占用率：</strong>已支出金额 + 已冻结金额 / 批复预算。</p>
        <p><strong>外部项目可用资金：</strong>已到账金额 - 已支出金额，不能与可用预算混用。</p>
      </div>
    </el-dialog>

    <el-dialog v-model="adjustmentDialogVisible" title="新增预算调整" width="720px">
      <el-form class="finance-form-grid" label-position="top">
        <el-form-item label="调整类型">
          <el-select v-model="adjustmentForm.adjustmentType">
            <el-option v-for="(label, key) in adjustmentTypeLabels" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目">
          <el-select v-model="adjustmentForm.projectId" filterable>
            <el-option v-for="project in visibleProjects" :key="project.id" :label="project.projectName" :value="project.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="调减科目"><el-select v-model="adjustmentForm.fromSubject"><el-option label="设备费" value="设备费" /><el-option label="业务费" value="业务费" /><el-option label="劳务费" value="劳务费" /><el-option label="外协经费" value="外协经费" /></el-select></el-form-item>
        <el-form-item label="调增科目"><el-select v-model="adjustmentForm.toSubject"><el-option label="设备费" value="设备费" /><el-option label="业务费" value="业务费" /><el-option label="劳务费" value="劳务费" /><el-option label="外协经费" value="外协经费" /></el-select></el-form-item>
        <el-form-item label="调整金额"><el-input-number v-model="adjustmentForm.amount" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="拟生效日期"><el-date-picker v-model="adjustmentForm.effectiveDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="关联来款记录"><el-input v-model="adjustmentForm.relatedReceipt" placeholder="可选，填写来款编号" /></el-form-item>
        <el-form-item label="批复文件或拨款附件"><el-input v-model="adjustmentForm.attachmentName" placeholder="原型中仅保存文件名" /></el-form-item>
        <el-form-item class="form-span-2" label="调整原因"><el-input v-model="adjustmentForm.reason" type="textarea" :rows="3" placeholder="请输入调整原因" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="adjustmentDialogVisible = false">取消</el-button><el-button type="primary" @click="submitAdjustment">提交审核</el-button></template>
    </el-dialog>

    <el-dialog v-model="allocationDialogVisible" title="新增经费分拨" width="640px">
      <div class="prototype-tip">原型交互：可动态增加课题和合作单位，保存草稿后写入 localStorage；正式环境需后端事务校验分拨总额。</div>
      <template #footer><el-button @click="allocationDialogVisible = false">取消</el-button><el-button @click="showToast('分拨草稿已保存到本地原型状态')">保存草稿</el-button><el-button type="primary" @click="allocationDialogVisible = false; showToast('分拨申请已提交审核')">提交审核</el-button></template>
    </el-dialog>

    <el-dialog v-model="ruleDialogVisible" title="新增预警规则" width="560px">
      <el-form label-position="top">
        <el-form-item label="规则名称"><el-input v-model="newRuleForm.ruleName" placeholder="例如：可用余额不足预警" /></el-form-item>
        <el-form-item label="适用项目类型"><el-input v-model="newRuleForm.projectType" /></el-form-item>
        <el-form-item label="监控指标"><el-input v-model="newRuleForm.metric" /></el-form-item>
        <el-form-item label="阈值"><el-input-number v-model="newRuleForm.threshold" :min="0" :step="0.01" /></el-form-item>
        <el-form-item label="预警级别"><el-select v-model="newRuleForm.level"><el-option label="提示" value="INFO" /><el-option label="关注" value="WARNING" /><el-option label="高风险" value="HIGH" /></el-select></el-form-item>
        <el-form-item label="通知对象"><el-input v-model="newRuleForm.recipients" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="ruleDialogVisible = false">取消</el-button><el-button type="primary" @click="submitNewRule">保存规则</el-button></template>
    </el-dialog>

    <el-dialog v-model="settlementDialogVisible" title="发起结题财务决算" width="620px">
      <div class="prototype-tip">系统将自动生成经费决算表，项目负责人填写剩余经费说明后提交科研财务管理员审核，再推送财务平台确认。</div>
      <template #footer><el-button @click="settlementDialogVisible = false">取消</el-button><el-button type="primary" @click="settlementDialogVisible = false; showToast('结题财务决算已提交审核')">提交决算申请</el-button></template>
    </el-dialog>

    <el-dialog v-model="genericDialogVisible" :title="genericDialogTitle" width="560px">
      <p class="generic-dialog-text">{{ genericDialogText }}</p>
    </el-dialog>
  </section>
</template>

<style scoped>
.finance-life-page {
  display: grid;
  gap: 16px;
  color: #20324f;
}

.finance-life-header,
.finance-card,
.finance-rate-strip,
.finance-kpi-card {
  border: 1px solid #dfe8f5;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(34, 64, 108, 0.07);
}

.finance-life-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 26px;
}

.finance-life-header h1 {
  margin: 7px 0 8px;
  color: #172744;
  font-size: 25px;
  font-weight: 780;
}

.finance-life-header span,
.finance-life-header p,
.finance-card-head p {
  margin: 0;
  color: #7c8aa0;
  font-size: 13px;
}

.finance-breadcrumb {
  color: #2f6fdf !important;
  font-weight: 700;
}

.finance-life-header aside {
  min-width: 310px;
  padding: 14px 18px;
  border: 1px solid #e4ecf7;
  border-radius: 13px;
  background: #f8fbff;
}

.finance-life-header aside strong,
.finance-life-header aside em {
  display: block;
}

.finance-life-header aside strong {
  color: #7c8aa0;
  font-size: 12px;
}

.finance-life-header aside em {
  margin: 5px 0;
  color: #20324f;
  font-style: normal;
  font-weight: 760;
}

.finance-scope-alert {
  border-radius: 12px;
}

.finance-kpi-grid,
.finance-todo-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.finance-kpi-card {
  display: flex;
  min-width: 0;
  gap: 12px;
  padding: 16px;
}

.finance-kpi-card .el-icon,
.finance-todo-card .el-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 12px;
  background: #eef5ff;
  color: #3478e5;
}

.finance-kpi-card .el-icon {
  width: 38px;
  height: 38px;
}

.finance-kpi-card span,
.finance-kpi-card p,
.finance-todo-card small {
  color: #7b8799;
  font-size: 12px;
}

.finance-kpi-card strong {
  display: block;
  overflow: hidden;
  margin: 6px 0 4px;
  color: #182945;
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finance-kpi-card p {
  margin: 0;
}

.tone-green .el-icon {
  background: #e8f7f1;
  color: #1c9a70;
}

.tone-orange .el-icon {
  background: #fff3e8;
  color: #ce6a2b;
}

.tone-indigo .el-icon {
  background: #f0efff;
  color: #6356d8;
}

.finance-card {
  min-width: 0;
  padding: 20px;
}

.finance-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.finance-card-head h2 {
  margin: 0 0 6px;
  color: #172744;
  font-size: 18px;
  font-weight: 760;
}

.finance-todo-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 14px;
  border: 1px solid #e3ebf6;
  border-radius: 13px;
  background: #fbfdff;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.finance-todo-card:hover {
  border-color: #bdd2f5;
  box-shadow: 0 10px 22px rgba(34, 86, 168, 0.08);
  transform: translateY(-2px);
}

.finance-todo-card .el-icon {
  width: 34px;
  height: 34px;
}

.finance-todo-card span {
  min-width: 0;
  display: grid;
  gap: 4px;
  text-align: left;
}

.finance-todo-card strong {
  color: #263653;
  font-size: 13px;
}

.finance-todo-card em {
  min-width: 28px;
  color: #3478e5;
  font-style: normal;
  font-size: 22px;
  font-weight: 800;
  text-align: right;
}

.finance-rate-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 14px;
  align-items: center;
  padding: 16px 18px;
}

.finance-rate-strip div {
  display: grid;
  gap: 4px;
}

.finance-rate-strip strong {
  color: #23334e;
  font-size: 13px;
}

.finance-rate-strip span {
  color: #7b8799;
  font-size: 12px;
}

.finance-filter-panel,
.finance-report-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.finance-filter-panel :deep(.el-select) {
  width: 150px;
}

.finance-filter-keyword {
  width: 280px;
}

.finance-wide-table {
  width: 100%;
}

.budget-execution-table :deep(.el-table__placeholder) {
  display: inline-block;
}

.budget-subject-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #20324f;
  font-weight: 720;
}

.budget-subject-name.level-2 {
  color: #42526c;
  font-weight: 650;
}

.budget-subject-name.level-3 {
  color: #64738c;
  font-size: 12px;
  font-weight: 620;
}

.budget-secondary-name {
  color: #31425c;
  font-weight: 700;
}

.muted-cell {
  color: #8a97aa;
  font-size: 12px;
}

.finance-name-button {
  display: block;
  max-width: 100%;
  overflow: hidden;
  padding: 0;
  border: 0;
  color: #20324f;
  background: transparent;
  font: inherit;
  font-weight: 700;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.finance-name-button:hover {
  color: #2f6fdf;
}

.finance-progress-cell {
  display: grid;
  grid-template-columns: minmax(96px, 1fr) 48px;
  gap: 8px;
  align-items: center;
}

.finance-progress-cell span {
  color: #60708a;
  font-size: 12px;
}

.finance-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  color: #7b8799;
  font-size: 12px;
}

.finance-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.finance-budget-template-grid,
.finance-report-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.budget-template-card,
.finance-report-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid #e3ebf6;
  border-radius: 13px;
  background: #fbfdff;
}

.budget-template-card strong,
.finance-report-card h3 {
  margin: 0;
  color: #20324f;
  font-size: 15px;
}

.budget-template-card p,
.budget-template-card span,
.finance-report-card p,
.finance-report-card span {
  margin: 0;
  color: #7b8799;
  font-size: 12px;
  line-height: 1.6;
}

.finance-rule-config {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.finance-rule-config div {
  display: grid;
  gap: 7px;
  padding: 14px;
  border: 1px solid #e5edf7;
  border-radius: 12px;
  background: #f8fbff;
}

.finance-rule-config span {
  color: #7b8799;
  font-size: 12px;
}

.finance-rule-config strong {
  color: #20324f;
  font-size: 17px;
}

.finance-report-filter .el-input {
  width: 260px;
}

.finance-report-filter .el-select {
  width: 150px;
}

.finance-report-card div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.drawer-title {
  display: grid;
  gap: 5px;
}

.drawer-title strong {
  color: #172744;
  font-size: 18px;
}

.drawer-title span {
  color: #7b8799;
  font-size: 13px;
}

.drawer-project-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
  padding: 18px;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #f8fbff;
}

.drawer-project-hero h2 {
  margin: 0 0 8px;
  color: #172744;
  font-size: 20px;
}

.drawer-project-hero p {
  margin: 0;
  color: #7b8799;
}

.drawer-tags {
  display: flex;
  gap: 8px;
}

.classic-detail-hero {
  align-items: center;
  background: linear-gradient(180deg, #fbfdff 0%, #f5f9ff 100%);
}

.classic-detail-metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.classic-detail-metrics article {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e5edf7;
  border-radius: 12px;
  background: #fff;
}

.classic-detail-metrics article.is-balance {
  border-color: #cfe6dc;
  background: #f5fcf8;
}

.classic-detail-metrics span {
  display: block;
  margin-bottom: 7px;
  color: #7b8799;
  font-size: 12px;
}

.classic-detail-metrics strong {
  color: #20324f;
  font-size: 18px;
  font-weight: 780;
}

.classic-detail-metrics article.is-balance strong {
  color: #15835c;
}

.classic-usage-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid #e4ecf7;
  border-radius: 13px;
  background: #f8fbff;
}

.classic-usage-panel div {
  min-width: 0;
  display: grid;
  gap: 8px;
}

.classic-usage-panel span {
  color: #53627a;
  font-size: 12px;
  font-weight: 700;
}

.classic-control-indicator-card {
  display: grid;
  grid-template-columns: 180px minmax(120px, 1fr) 180px minmax(120px, 1fr);
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid #e4ecf7;
  border-radius: 13px;
  background: #fff;
}

.classic-control-indicator-card div {
  display: grid;
  gap: 4px;
}

.classic-control-indicator-card span,
.classic-control-indicator-card small {
  color: #7b8799;
  font-size: 12px;
}

.classic-control-indicator-card strong {
  color: #20324f;
  font-size: 17px;
  font-weight: 780;
}

.classic-control-indicator-card strong.warning {
  color: #e5484d;
}

.classic-info-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.classic-detail-tabs {
  margin-top: 6px;
}

.drawer-stat-grid,
.project-info-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.drawer-stat-grid article,
.project-info-grid div {
  padding: 12px;
  border: 1px solid #e5edf7;
  border-radius: 12px;
  background: #fff;
}

.drawer-stat-grid span,
.project-info-grid dt {
  display: block;
  margin-bottom: 6px;
  color: #7b8799;
  font-size: 12px;
}

.drawer-stat-grid strong,
.project-info-grid dd {
  margin: 0;
  color: #20324f;
  font-weight: 740;
}

.metric-dialog-body {
  display: grid;
  gap: 10px;
  color: #526178;
  line-height: 1.7;
}

.metric-dialog-body p,
.generic-dialog-text {
  margin: 0;
}

.finance-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 16px;
}

.form-span-2 {
  grid-column: 1 / -1;
}

.prototype-tip {
  padding: 14px 16px;
  border: 1px solid #d5e6ff;
  border-radius: 12px;
  color: #2f67c8;
  background: #f1f7ff;
  line-height: 1.7;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f7faff;
  --el-table-border-color: #e3ebf6;
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  color: #637188;
  font-weight: 700;
}

:deep(.el-table .el-table__cell) {
  padding: 9px 0;
}

@media (max-width: 1280px) {
  .finance-kpi-grid,
  .finance-todo-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .finance-rule-config,
  .classic-detail-metrics,
  .classic-control-indicator-card,
  .drawer-stat-grid,
  .project-info-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .classic-usage-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .finance-life-header,
  .finance-card-head,
  .drawer-project-hero {
    flex-direction: column;
  }

  .finance-life-header aside {
    min-width: 0;
    width: 100%;
  }

  .finance-rate-strip,
  .finance-budget-template-grid,
  .finance-report-grid,
  .classic-control-indicator-card,
  .finance-form-grid {
    grid-template-columns: 1fr;
  }

  .finance-filter-panel :deep(.el-select),
  .finance-filter-panel .el-input,
  .finance-report-filter .el-input,
  .finance-report-filter .el-select {
    width: 100%;
  }
}
</style>
