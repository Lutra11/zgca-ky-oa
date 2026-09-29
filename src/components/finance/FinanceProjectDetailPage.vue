<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  budgetSubjectsByProjectId as classicBudgetSubjectsByProjectId,
  payableDetailRecords as classicPayableDetailRecords,
  paymentDetailRecords as classicPaymentDetailRecords,
  projectFinanceSummaries as classicProjectFinanceSummaries,
  type BudgetSubject as ClassicBudgetSubject,
  type PayableDetailRecord as ClassicPayableDetailRecord,
  type PaymentDetailRecord as ClassicPaymentDetailRecord,
  type ProjectFinanceSummary as ClassicProjectFinanceSummary,
  type RiskLevel,
  type SyncStatus,
} from '../../dataset/researchFinanceMock'
import {
  adjustmentTypeLabels,
  budgetVersions,
  expenseSourceLabels,
  financeExpenses,
  financeProjects,
  getLifecycleProjectDetail,
  getLifecycleProjectsForRole,
  lifecycleSyncRecords,
  reconciliationRecords,
  riskTextMap,
  syncTextMap,
  type BudgetAdjustmentType,
  type BudgetSubject,
  type ExpenseSource,
  type FinanceProject,
  type FinanceWarning,
} from '../../dataset/researchFinanceLifecycleMock'
import type { LoggedInUser, RoleKey } from '../../types/auth'
import { formatCurrency, formatPercent, toProgressPercent } from './financeFormat'

type DetailTab =
  | 'overview'
  | 'budget'
  | 'paid'
  | 'payable'
  | 'expenses'
  | 'adjustments'
  | 'warnings'
  | 'reconciliation'
  | 'settlement'
  | 'logs'

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

const props = defineProps<{
  roleKey: RoleKey
  currentUser: LoggedInUser | null
}>()

const route = useRoute()
const router = useRouter()
const detailTab = shallowRef<DetailTab>('overview')

const routeProjectTarget = computed(() => String(route.params.projectId ?? '').trim())
const financeListPath = computed(() =>
  props.roleKey === 'projectMember' ? '/project-member/finance-overview' : '/research-project-admin/finance-workbench',
)
const visibleProjects = computed(() => getLifecycleProjectsForRole(props.roleKey, props.currentUser))
const project = computed(() => {
  const target = decodeURIComponent(routeProjectTarget.value)

  return (
    visibleProjects.value.find((item) => item.id === target || item.projectCode === target) ??
    financeProjects.find((item) => item.id === target || item.projectCode === target) ??
    null
  )
})
const projectDetail = computed(() => (project.value ? getLifecycleProjectDetail(project.value.id) : null))
const classicFinanceSummary = computed<ClassicProjectFinanceSummary | null>(() => {
  const currentProject = project.value

  return currentProject
    ? classicProjectFinanceSummaries.find((item) => item.projectCode === currentProject.projectCode) ?? null
    : null
})
const classicBudgetSubjects = computed<ClassicBudgetSubject[]>(() => {
  const classicSummary = classicFinanceSummary.value

  return classicSummary ? classicBudgetSubjectsByProjectId[classicSummary.projectId] ?? [] : []
})
const classicPaymentRows = computed<ClassicPaymentDetailRecord[]>(() => {
  const classicSummary = classicFinanceSummary.value

  return classicSummary ? classicPaymentDetailRecords.filter((item) => item.projectId === classicSummary.projectId) : []
})
const classicPayableRows = computed<ClassicPayableDetailRecord[]>(() => {
  const classicSummary = classicFinanceSummary.value

  return classicSummary ? classicPayableDetailRecords.filter((item) => item.projectId === classicSummary.projectId) : []
})
const projectExpenses = computed(() =>
  project.value ? financeExpenses.filter((item) => item.projectId === project.value?.id) : [],
)
const paidRows = computed<FinancePaymentDisplayRow[]>(() => {
  if (classicPaymentRows.value.length) {
    return classicPaymentRows.value.map((item) => ({
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

  return projectExpenses.value
    .filter((item) => item.paidAmount > 0 || item.status === '已付款')
    .map((item) => ({
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
      syncTime: project.value?.lastSyncTime ?? '-',
    }))
})
const payableRows = computed<FinancePayableDisplayRow[]>(() => {
  if (classicPayableRows.value.length) {
    return classicPayableRows.value.map((item) => ({
      id: item.id,
      documentNo: item.payableNo,
      payableType: payableTypeText(item.payableType),
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

  return projectExpenses.value
    .filter((item) => item.payableAmount > item.paidAmount || item.frozenAmount > 0)
    .map((item) => ({
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
      syncTime: project.value?.lastSyncTime ?? '-',
    }))
})
const budgetExecutionTree = computed<BudgetSubjectTreeRow[]>(() =>
  classicBudgetSubjects.value.length
    ? buildClassicBudgetExecutionTree(classicBudgetSubjects.value)
    : buildLifecycleBudgetExecutionTree(projectDetail.value?.subjects ?? []),
)
const budgetDefaultExpandedKeys = computed(() => budgetExecutionTree.value.map((item) => item.id))
const budgetVersionsForProject = computed(() =>
  project.value ? budgetVersions.filter((item) => item.projectId === project.value?.id) : [],
)
const projectSyncRecords = computed(() => {
  const currentProject = project.value

  return currentProject ? lifecycleSyncRecords.filter((item) => item.projectCode === currentProject.projectCode) : []
})
const projectReconciliationRecords = computed(() => {
  const currentProject = project.value

  if (!currentProject) {
    return []
  }

  return reconciliationRecords.filter((item) => item.reason?.includes(currentProject.projectCode) || item.id)
})
function backToList() {
  router.push(financeListPath.value)
}

function detailAvailableAmount(item: FinanceProject) {
  return classicFinanceSummary.value?.availableAmount ?? item.availableBudget
}

function subjectOccupiedAmount(subject: BudgetSubjectTreeRow) {
  return subject.paidAmount + subject.frozenAmount
}

function subjectOccupancyRate(subject: BudgetSubjectTreeRow) {
  return subject.adjustedAmount ? subjectOccupiedAmount(subject) / subject.adjustedAmount : 0
}

function unpaidPayableAmount(row: { payableAmount: number; paidAmount: number; frozenAmount: number }) {
  return Math.max(row.payableAmount - row.paidAmount, row.frozenAmount, 0)
}

function expenseSourceText(source: ExpenseSource) {
  return expenseSourceLabels[source]
}

function payableTypeText(type: ClassicPayableDetailRecord['payableType']) {
  const labels: Record<ClassicPayableDetailRecord['payableType'], string> = {
    PROCUREMENT: '采购应付未付',
    CONTRACT: '合同应付未付',
    COMPUTE_API: '算力和API应付未付',
    INTELLECTUAL_PROPERTY: '知识产权应付未付',
    INTERN_SALARY: '项目实习生工资应付未付',
  }

  return labels[type]
}

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

function getRiskLevelByOccupancyRate(occupancyRate: number): RiskLevel {
  if (occupancyRate >= 0.9) {
    return 'WARNING'
  }

  if (occupancyRate >= 0.75) {
    return 'ATTENTION'
  }

  return 'NORMAL'
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

  paidRows.value
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

  payableRows.value
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
    return row.children?.length ? '二级科目合计，可展开查看三级单据明细' : '二级科目合计，暂无单据明细'
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
</script>

<template>
  <section class="finance-project-detail-page" aria-label="项目经费详情">
    <el-result v-if="!project || !projectDetail" icon="warning" title="未找到项目经费详情" sub-title="请返回财务工作台重新选择项目">
      <template #extra>
        <el-button type="primary" @click="backToList">返回财务工作台</el-button>
      </template>
    </el-result>

    <template v-else>
      <section class="detail-card detail-tab-card">
        <el-tabs v-model="detailTab" class="finance-detail-tabs">
          <el-tab-pane label="经费概览" name="overview">
            <div class="overview-section-grid">
              <article>
                <span>已到账金额</span>
                <strong>{{ formatCurrency(project.receivedAmount) }}</strong>
                <small>外部项目同时展示可用资金口径</small>
              </article>
              <article>
                <span>税费</span>
                <strong>{{ formatCurrency(project.taxAmount) }}</strong>
                <small>由财务平台回传展示</small>
              </article>
              <article>
                <span>管理费</span>
                <strong>{{ formatCurrency(project.managementFee) }}</strong>
                <small>按项目类型与合同约定展示</small>
              </article>
              <article>
                <span>保证金</span>
                <strong>{{ formatCurrency(project.depositAmount) }}</strong>
                <small>横向项目/合作项目重点关注</small>
              </article>
              <article>
                <span>直接费用</span>
                <strong>{{ formatCurrency(project.directCostBudget) }}</strong>
                <small>预算制项目科目展开口径</small>
              </article>
              <article>
                <span>间接费用</span>
                <strong>{{ formatCurrency(project.indirectCostBudget) }}</strong>
                <small>不与直接费用重复合计</small>
              </article>
              <article>
                <span>可用预算</span>
                <strong>{{ formatCurrency(detailAvailableAmount(project)) }}</strong>
                <small>批复预算 - 已付款 - 应付未付</small>
              </article>
              <article>
                <span>可用资金</span>
                <strong>{{ formatCurrency(project.cashAvailable) }}</strong>
                <small>到账金额 - 已付款</small>
              </article>
            </div>
          </el-tab-pane>

          <el-tab-pane label="预算执行" name="budget">
            <el-table
              :data="budgetExecutionTree"
              :expand-row-keys="budgetDefaultExpandedKeys"
              :indent="18"
              :tree-props="{ children: 'children' }"
              row-key="id"
              border
              class="finance-wide-table budget-execution-table"
            >
              <el-table-column label="一级科目" min-width="145" fixed>
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
              <el-table-column label="三级明细" min-width="230" show-overflow-tooltip>
                <template #default="{ row }">
                  <span :class="['budget-subject-name', `level-${row.level}`]">
                    <el-tag v-if="row.level === 3" size="small" effect="plain" type="info">三级</el-tag>
                    {{ getBudgetDetailLabel(row) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="明细说明" min-width="230" show-overflow-tooltip>
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
              <el-table-column label="风险状态" width="105">
                <template #default="{ row }">
                  <el-tag :type="tagTypeByRisk(row.riskStatus)" effect="light">{{ riskTextMap[row.riskStatus as RiskLevel] }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="已付款明细" name="paid">
            <el-table :data="paidRows" row-key="id" border class="finance-wide-table">
              <el-table-column prop="documentNo" label="付款单号" min-width="140" fixed />
              <el-table-column prop="paymentDate" label="付款日期" width="120" />
              <el-table-column prop="targetName" label="收款方" min-width="170" show-overflow-tooltip />
              <el-table-column prop="summary" label="付款摘要" min-width="180" show-overflow-tooltip />
              <el-table-column prop="firstLevelSubject" label="一级科目" width="120" />
              <el-table-column prop="secondLevelSubject" label="二级科目" min-width="150" />
              <el-table-column label="付款金额" width="130">
                <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="付款状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)" effect="light">{{ row.status }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="voucherNo" label="用友凭证号" min-width="150" />
              <el-table-column prop="syncTime" label="同步时间" min-width="155" />
              <template #empty>
                <el-empty description="暂无已付款明细" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="应付未付明细" name="payable">
            <el-table :data="payableRows" row-key="id" border class="finance-wide-table">
              <el-table-column prop="documentNo" label="应付单号" min-width="140" fixed />
              <el-table-column prop="payableType" label="应付类型" min-width="175" />
              <el-table-column prop="confirmDate" label="确认日期" width="120" />
              <el-table-column prop="targetName" label="供应商或收款对象" min-width="180" show-overflow-tooltip />
              <el-table-column prop="summary" label="摘要" min-width="180" show-overflow-tooltip />
              <el-table-column prop="firstLevelSubject" label="一级科目" width="120" />
              <el-table-column prop="secondLevelSubject" label="二级科目" min-width="150" />
              <el-table-column label="应付未付金额" width="140">
                <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
              </el-table-column>
              <el-table-column label="冻结状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.freezeStatus)" effect="light">{{ row.freezeStatus }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="expectedPaymentDate" label="预计付款日期" width="130" />
              <el-table-column prop="syncTime" label="同步时间" min-width="155" />
              <template #empty>
                <el-empty description="暂无应付未付明细" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="支出与冻结" name="expenses">
            <el-table :data="projectExpenses" row-key="id" border class="finance-wide-table">
              <el-table-column prop="expenseNo" label="支出编号" width="145" fixed />
              <el-table-column prop="sourceSystem" label="来源系统" min-width="150" />
              <el-table-column label="业务类型" min-width="165">
                <template #default="{ row }">{{ expenseSourceLabels[row.source as ExpenseSource] }}</template>
              </el-table-column>
              <el-table-column prop="sourceDocumentNo" label="来源单据" min-width="150" />
              <el-table-column prop="targetName" label="支出对象" min-width="170" show-overflow-tooltip />
              <el-table-column prop="firstLevelSubject" label="一级科目" width="120" />
              <el-table-column prop="secondLevelSubject" label="二级科目" min-width="150" />
              <el-table-column label="应付金额" width="125"><template #default="{ row }">{{ formatCurrency(row.payableAmount) }}</template></el-table-column>
              <el-table-column label="已付金额" width="125"><template #default="{ row }">{{ formatCurrency(row.paidAmount) }}</template></el-table-column>
              <el-table-column label="冻结金额" width="125"><template #default="{ row }">{{ formatCurrency(row.frozenAmount) }}</template></el-table-column>
              <el-table-column prop="frozenAt" label="冻结日期" width="120" />
              <el-table-column prop="frozenDays" label="冻结天数" width="100" />
              <el-table-column label="当前状态" width="115">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)" effect="light">{{ row.status }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="voucherNo" label="凭证号" min-width="140" />
              <el-table-column prop="paidAt" label="付款日期" width="120" />
              <el-table-column prop="reconciliationStatus" label="对账状态" width="115" />
              <template #empty>
                <el-empty description="暂无支出与冻结明细" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="预算调整" name="adjustments">
            <el-table :data="projectDetail.adjustments" row-key="id" border class="finance-wide-table">
              <el-table-column prop="adjustmentNo" label="调整单号" width="145" fixed />
              <el-table-column label="调整类型" width="150">
                <template #default="{ row }">{{ adjustmentTypeLabels[row.adjustmentType as BudgetAdjustmentType] }}</template>
              </el-table-column>
              <el-table-column prop="content" label="调整内容" min-width="200" show-overflow-tooltip />
              <el-table-column label="调整金额" width="130"><template #default="{ row }">{{ formatCurrency(row.amount) }}</template></el-table-column>
              <el-table-column prop="applicant" label="申请人" width="105" />
              <el-table-column prop="currentNode" label="当前节点" width="135" />
              <el-table-column label="审批状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.approvalStatus)" effect="light">{{ row.approvalStatus }}</el-tag></template>
              </el-table-column>
              <el-table-column label="用友同步" width="115">
                <template #default="{ row }"><el-tag :type="tagTypeBySync(row.financeSyncStatus)" effect="light">{{ syncTextMap[row.financeSyncStatus as SyncStatus] }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="receiptStatus" label="回执状态" width="115" />
              <template #empty>
                <el-empty description="暂无预算调整记录" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="预警记录" name="warnings">
            <el-table :data="projectDetail.warnings" row-key="id" border class="finance-wide-table">
              <el-table-column prop="warningNo" label="预警编号" width="145" fixed />
              <el-table-column prop="ruleName" label="预警类型" min-width="165" />
              <el-table-column label="风险等级" width="110">
                <template #default="{ row }"><el-tag :type="warningTagType(row.level)" effect="light">{{ row.level }}</el-tag></template>
              </el-table-column>
              <el-table-column label="当前值 / 阈值" width="140">
                <template #default="{ row }">{{ row.currentValue }} / {{ row.threshold }}</template>
              </el-table-column>
              <el-table-column prop="notifiedAt" label="触发时间" width="155" />
              <el-table-column prop="recipients" label="提醒对象" min-width="170" show-overflow-tooltip />
              <el-table-column prop="notifyStatus" label="提醒状态" width="110" />
              <el-table-column label="处理状态" width="110">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.handlingStatus)" effect="light">{{ row.handlingStatus }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="handlerName" label="处理人" width="110" />
              <template #empty>
                <el-empty description="暂无预警记录" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="对账与纠错" name="reconciliation">
            <div class="two-table-grid">
              <el-table :data="projectDetail.corrections" row-key="id" border class="finance-wide-table">
                <el-table-column prop="expenseNo" label="支出编号" min-width="140" />
                <el-table-column prop="sourceSystem" label="来源系统" min-width="130" />
                <el-table-column prop="summary" label="业务摘要" min-width="170" show-overflow-tooltip />
                <el-table-column prop="financeSubject" label="财务原科目" min-width="150" />
                <el-table-column prop="suggestedSubject" label="建议科目" min-width="150" />
                <el-table-column prop="reason" label="异常原因" min-width="170" show-overflow-tooltip />
                <el-table-column label="处理状态" width="110">
                  <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)" effect="light">{{ row.status }}</el-tag></template>
                </el-table-column>
                <el-table-column label="推送状态" width="110">
                  <template #default="{ row }"><el-tag :type="tagTypeBySync(row.pushStatus)" effect="light">{{ syncTextMap[row.pushStatus as SyncStatus] }}</el-tag></template>
                </el-table-column>
                <template #empty>
                  <el-empty description="暂无科目纠错记录" />
                </template>
              </el-table>

              <el-table :data="projectReconciliationRecords" row-key="id" border class="finance-wide-table">
                <el-table-column prop="batchNo" label="对账批次号" min-width="145" />
                <el-table-column prop="type" label="对账类型" width="110" />
                <el-table-column prop="date" label="对账日期" width="120" />
                <el-table-column prop="researchCount" label="科研记录数" width="110" />
                <el-table-column prop="financeCount" label="财务记录数" width="110" />
                <el-table-column label="科研金额" width="130"><template #default="{ row }">{{ formatCurrency(row.researchAmount) }}</template></el-table-column>
                <el-table-column label="财务金额" width="130"><template #default="{ row }">{{ formatCurrency(row.financeAmount) }}</template></el-table-column>
                <el-table-column prop="diffCount" label="差异笔数" width="100" />
                <el-table-column label="差异金额" width="130"><template #default="{ row }">{{ formatCurrency(row.diffAmount) }}</template></el-table-column>
                <el-table-column label="对账状态" width="110">
                  <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)" effect="light">{{ row.status }}</el-tag></template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="财务决算" name="settlement">
            <el-table :data="projectDetail.settlements" row-key="id" border class="finance-wide-table">
              <el-table-column prop="settlementNo" label="决算单号" min-width="145" />
              <el-table-column label="项目总经费" width="130"><template #default="{ row }">{{ formatCurrency(row.totalFunding) }}</template></el-table-column>
              <el-table-column label="已支出" width="130"><template #default="{ row }">{{ formatCurrency(row.paidAmount) }}</template></el-table-column>
              <el-table-column label="已冻结" width="130"><template #default="{ row }">{{ formatCurrency(row.frozenAmount) }}</template></el-table-column>
              <el-table-column label="剩余经费" width="130"><template #default="{ row }">{{ formatCurrency(row.remainingAmount) }}</template></el-table-column>
              <el-table-column prop="createdAt" label="发起时间" width="140" />
              <el-table-column prop="currentNode" label="当前节点" min-width="130" />
              <el-table-column label="决算状态" width="115">
                <template #default="{ row }"><el-tag :type="tagTypeByStatus(row.status)" effect="light">{{ row.status }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="financeConfirmStatus" label="财务确认" width="115" />
              <template #empty>
                <el-empty description="暂无财务决算记录" />
              </template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="操作日志" name="logs">
            <el-table :data="[...projectDetail.logs, ...projectSyncRecords, ...budgetVersionsForProject]" row-key="id" border class="finance-wide-table">
              <el-table-column label="记录类型" width="120">
                <template #default="{ row }">
                  <el-tag effect="plain" type="info">{{ row.action ? '操作日志' : row.syncNo ? '同步记录' : '预算版本' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="单号/版本" min-width="145">
                <template #default="{ row }">{{ row.syncNo ?? row.versionNo ?? row.id }}</template>
              </el-table-column>
              <el-table-column label="操作/业务" min-width="170" show-overflow-tooltip>
                <template #default="{ row }">{{ row.action ?? row.businessType ?? row.reason }}</template>
              </el-table-column>
              <el-table-column label="人员/系统" min-width="150">
                <template #default="{ row }">{{ row.operator ?? row.sourceSystem ?? row.changedBy }}</template>
              </el-table-column>
              <el-table-column label="时间" min-width="150">
                <template #default="{ row }">{{ row.operatedAt ?? row.pushedAt ?? row.effectiveAt }}</template>
              </el-table-column>
              <el-table-column label="状态/备注" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark ?? row.errorReason ?? row.status }}</template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无操作日志" />
              </template>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </section>
    </template>
  </section>
</template>

<style scoped>
.finance-project-detail-page {
  display: grid;
  gap: 16px;
  color: #20324f;
}

.detail-hero,
.detail-card,
.finance-metric-grid article {
  border: 1px solid #dfe8f5;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(34, 64, 108, 0.07);
}

.detail-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 26px;
}

.back-button {
  flex: 0 0 auto;
  border-color: #d9e4f4;
}

.detail-title-block {
  flex: 1;
  min-width: 0;
}

.overview-kicker {
  position: relative;
  margin: 0 0 8px;
  padding-left: 16px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 700;
}

.overview-kicker::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 10px;
  height: 3px;
  border-radius: 999px;
  background: #3478e5;
  content: '';
  transform: translateY(-50%);
}

.detail-title-block h1 {
  margin: 0 0 8px;
  color: #172744;
  font-size: 24px;
  line-height: 1.25;
}

.detail-title-block p {
  margin: 0;
  color: #667894;
  font-size: 13px;
}

.detail-status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.detail-card {
  padding: 22px 24px;
}

.project-info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.project-info-grid div,
.overview-section-grid article {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid #edf2f9;
  border-radius: 12px;
  background: #fbfdff;
}

.project-info-grid dt,
.overview-section-grid span,
.rate-item span,
.finance-metric-grid span {
  display: block;
  color: #7a8ca7;
  font-size: 12px;
}

.project-info-grid dd {
  margin: 8px 0 0;
  overflow: hidden;
  color: #1f3354;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finance-metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.finance-metric-grid article {
  padding: 16px;
}

.finance-metric-grid strong,
.overview-section-grid strong,
.rate-item strong {
  display: block;
  margin-top: 8px;
  color: #172744;
  font-size: 20px;
}

.finance-metric-grid article:nth-child(5) strong {
  color: #168f66;
}

.rate-card {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.rate-item {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.rate-item small {
  margin-left: 8px;
  color: #95a5bb;
  font-size: 12px;
  font-weight: 500;
}

.rate-item strong.warning {
  color: #e5484d;
}

.detail-tab-card {
  overflow: hidden;
}

.finance-detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.finance-detail-tabs :deep(.el-tabs__item) {
  color: #657793;
  font-weight: 700;
}

.finance-detail-tabs :deep(.el-tabs__item.is-active) {
  color: #3478e5;
}

.overview-section-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-section-grid strong {
  font-size: 18px;
}

.overview-section-grid small {
  display: block;
  margin-top: 8px;
  overflow: hidden;
  color: #8b9bb1;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finance-wide-table {
  width: 100%;
}

.finance-wide-table :deep(.el-table__header th) {
  background: #f4f7fc;
  color: #5f718c;
  font-weight: 700;
}

.finance-wide-table :deep(.el-table__cell) {
  padding: 9px 0;
}

.finance-wide-table :deep(.cell) {
  line-height: 1.45;
}

.budget-execution-table :deep(.el-table__indent) {
  padding-left: 10px !important;
}

.budget-subject-name {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: 100%;
}

.budget-subject-name.level-3 {
  color: #60718d;
}

.budget-secondary-name {
  color: #1f3354;
  font-weight: 700;
}

.muted-cell {
  color: #8a9ab1;
}

.finance-progress-cell {
  display: grid;
  grid-template-columns: minmax(70px, 1fr) 48px;
  align-items: center;
  gap: 9px;
  color: #5f718c;
  font-size: 12px;
}

.two-table-grid {
  display: grid;
  gap: 16px;
}

@media (max-width: 1440px) {
  .project-info-grid,
  .overview-section-grid,
  .rate-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .finance-metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .detail-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .project-info-grid,
  .overview-section-grid,
  .rate-card,
  .finance-metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
