<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type TableInstance } from 'element-plus'
import {
  Check,
  Close,
  DocumentChecked,
  MagicStick,
  Search,
  View,
} from '@element-plus/icons-vue'
import {
  initiationBatchMockRows,
  initiationProjectMockRows,
  type InitiationBatchMockRow,
  type InitiationProjectMockRow,
} from '../../dataset/initiationProjectsMock'

type ReviewStatus = '待审查' | '已通过' | '已驳回'

interface DeclarationReviewState {
  status: ReviewStatus
  reason?: string
  operator?: string
  reviewedAt?: string
}

interface DeclarationReviewRow extends InitiationProjectMockRow {
  batch?: InitiationBatchMockRow | null
}

interface AiDiagnosisRow {
  code: string
  projectName: string
  identity: string
  scope: string
  quantity: string
  libraryLink: string
  opinion: string
  hasIssue: boolean
}

const aiDiagnosisMockRows: AiDiagnosisRow[] = [
  {
    code: 'PMJ240401',
    projectName: '多模态脑影像在阿尔茨海默病早期诊断中的应用研究',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议通过：申报人身份、申报范围、申报数量与项目库联动四项检查均符合要求。',
    hasIssue: false,
  },
  {
    code: 'PMJ240405',
    projectName: '药物靶标识别深度挖掘与验证研究',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '超限（同名负责人在研项目已达上限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议退回修改：申报数量超限，请负责人核实在研项目数量后调整申报。其余三项检查符合要求。',
    hasIssue: true,
  },
  {
    code: 'PMJ240402',
    projectName: '基于深度学习的量子材料力学性能预测方法研究',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议通过：四项形式审查要点均符合要求，可进入评审环节。',
    hasIssue: false,
  },
  {
    code: 'PMJ240403',
    projectName: '肿瘤微环境调控机制研究',
    identity: '符合（在职教研人员）',
    scope: '偏离（子方向与批次指南不一致）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议人工复核：申报范围与批次指南的子方向存在偏离，请形式审查人员确认是否受理。',
    hasIssue: true,
  },
  {
    code: 'PMJ240404',
    projectName: '工业机器人精密装配控制方法',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议通过：申报人身份、申报范围、申报数量与项目库联动四项检查均符合要求。',
    hasIssue: false,
  },
  {
    code: 'PMJ240406',
    projectName: '固态电池电解质界面优化研究',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议通过：四项形式审查要点均符合要求，可进入评审环节。',
    hasIssue: false,
  },
  {
    code: 'PMJ240407',
    projectName: '医学知识图谱辅助诊断模型研究',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '重复（与项目库在研项目研究方向高度重叠）',
    opinion: 'AI 建议人工复核：项目库联动检查发现与在研项目研究方向高度重叠，请形式审查人员核实是否重复申报。',
    hasIssue: true,
  },
  {
    code: 'PMJ240408',
    projectName: '物理约束神经网络在复杂场景中的泛化研究',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议通过：四项形式审查要点均符合要求，可进入评审环节。',
    hasIssue: false,
  },
  {
    code: 'PMJ240409',
    projectName: '细胞免疫应答多组学分析平台构建',
    identity: '符合（在职教研人员）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议通过：申报人身份、申报范围、申报数量与项目库联动四项检查均符合要求。',
    hasIssue: false,
  },
  {
    code: 'PMJ240410',
    projectName: '高端制造设备状态感知与预测维护系统研究',
    identity: '超龄（申报人年龄超出批次指南要求）',
    scope: '符合（面向重点申报方向）',
    quantity: '符合（在研项目未超限）',
    libraryLink: '未发现与项目库重复申报',
    opinion: 'AI 建议退回修改：申报人身份检查发现年龄超出批次指南要求，请核实后调整申报人或补充特批材料。',
    hasIssue: true,
  },
]

interface MachineCheckRow {
  code: string
  passed: boolean
  note: string
}

const machineCheckMockRows: MachineCheckRow[] = [
  { code: 'PMJ240401', passed: true, note: '机器校验通过：必填字段完整、编号格式正确、申报附件齐全。' },
  { code: 'PMJ240402', passed: true, note: '机器校验通过：必填字段完整、编号格式正确、申报附件齐全。' },
  { code: 'PMJ240403', passed: true, note: '机器校验通过：必填字段完整、编号格式正确、申报附件齐全。' },
  { code: 'PMJ240404', passed: false, note: '机器校验不通过：缺少盖章版申报书扫描件，请退回申报人补齐材料。' },
  { code: 'PMJ240405', passed: true, note: '机器校验通过：必填字段完整、编号格式正确、申报附件齐全。' },
  { code: 'PMJ240406', passed: true, note: '机器校验通过：必填字段完整、编号格式正确、申报附件齐全。' },
  { code: 'PMJ240407', passed: true, note: '机器校验通过：必填字段完整、编号格式正确、申报附件齐全。' },
  { code: 'PMJ240408', passed: true, note: '机器校验通过：必填字段完整、编号格式正确、申报附件齐全。' },
  { code: 'PMJ240409', passed: false, note: '机器校验不通过：劳务费预算占比 35%，超过批次指南规定的 30% 上限。' },
  { code: 'PMJ240410', passed: false, note: '机器校验不通过：负责人联系电话未填写，必填字段缺失。' },
]

const declarationFlowSteps = [
  '立项指南发布',
  '形式审查',
  '初审阶段',
  '复审阶段',
  '立项入库',
] as const

const STORAGE_KEY = 'zgca_ky_oa_initiation_declaration_review_state'

const router = useRouter()
const props = defineProps<{
  initialBatchId?: string
  /** 嵌入管理办负责人视角时隐藏组件内部流转线（外层已有） */
  hideFlowStrip?: boolean
}>()

/** 原型要求：流转线各环节均可点击，点击通知父级跳转对应环节 */
const emit = defineEmits<{
  (e: 'flow-step', index: number): void
}>()

const keyword = shallowRef('')
const batchFilter = shallowRef<string>(props.initialBatchId ?? 'all')
const statusFilter = shallowRef<ReviewStatus | 'all'>('all')
const page = shallowRef(1)
const pageSize = shallowRef(10)
const selectedRows = shallowRef<DeclarationReviewRow[]>([])
const tableRef = shallowRef<TableInstance>()
const detailVisible = shallowRef(false)
const detailActiveTab = shallowRef('application')
const rejectVisible = shallowRef(false)
const reviewStateMap = shallowRef<Record<string, DeclarationReviewState>>(loadReviewState())
const activeRow = shallowRef<DeclarationReviewRow | null>(null)
const submitting = shallowRef(false)
const rejectForm = reactive({
  reason: '',
})

const submittedProjects = computed<DeclarationReviewRow[]>(() =>
  initiationProjectMockRows
    .filter((project) => project.submitStatus === '已提交')
    .map((project) => ({
      ...project,
      batch: findBatch(project),
    })),
)

// AN-MWUG1BOX：批次筛选下拉已删除，batchOptions 不再需要（批次上下文由 initialBatchId 锁定）

const activeBatch = computed(
  () => initiationBatchMockRows.find((batch) => batch.id === props.initialBatchId) ?? null,
)

const filteredRows = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return submittedProjects.value.filter((project) => {
    const state = getReviewState(project)
    const keywordMatched =
      !normalizedKeyword ||
      [
        project.projectName,
        project.projectCode,
        project.leader,
        project.department,
        project.batch?.batchName,
        project.batch?.batchCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedKeyword))

    const batchMatched = batchFilter.value === 'all' || project.batch?.id === batchFilter.value
    const statusMatched = statusFilter.value === 'all' || state.status === statusFilter.value

    return keywordMatched && batchMatched && statusMatched
  })
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value

  return filteredRows.value.slice(start, start + pageSize.value)
})

const pendingRows = computed(() => filteredRows.value.filter((row) => canReview(row)))

watch([keyword, batchFilter, statusFilter], () => {
  page.value = 1
  selectedRows.value = []
})

watch(
  () => props.initialBatchId,
  (batchId) => {
    batchFilter.value = batchId ?? 'all'
  },
)

function loadReviewState() {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)

    return rawValue ? (JSON.parse(rawValue) as Record<string, DeclarationReviewState>) : {}
  } catch {
    return {}
  }
}

function persistReviewState(nextState: Record<string, DeclarationReviewState>) {
  reviewStateMap.value = nextState
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

function findBatch(project: InitiationProjectMockRow) {
  return (
    initiationBatchMockRows.find((batch) => batch.year === project.year && batch.quarter === project.quarter) ?? null
  )
}

function getReviewState(project: InitiationProjectMockRow): DeclarationReviewState {
  const saved = reviewStateMap.value[project.id]

  if (saved) {
    return saved
  }

  if (project.currentNode === '待形式审查') {
    return { status: '待审查' }
  }

  return {
    status: '已通过',
    operator: '系统流转',
    reviewedAt: project.submitTime,
  }
}

function canReview(project: DeclarationReviewRow) {
  return getReviewState(project).status === '待审查'
}

function selectable(row: DeclarationReviewRow) {
  return canReview(row)
}

function getStatusTagType(status: ReviewStatus) {
  if (status === '已通过') {
    return 'success'
  }

  if (status === '已驳回') {
    return 'danger'
  }

  return 'warning'
}

function getMachineCheck(project: DeclarationReviewRow) {
  return machineCheckMockRows.find((row) => row.code === project.projectCode) ?? null
}

function getAiCheck(project: DeclarationReviewRow) {
  return aiDiagnosisMockRows.find((row) => row.code === project.projectCode) ?? null
}

function getReviewProgress(project: DeclarationReviewRow) {
  if (!project.reviewTotal) {
    return '尚未开始'
  }

  return `${project.reviewFinished}/${project.reviewTotal}`
}

function getApplicationDescription(project: DeclarationReviewRow) {
  return `本项目围绕“${project.projectName}”开展研究，申报材料已由项目负责人提交，当前用于申报审查和后续评审流转。`
}

function updateProjectReviewState(projects: DeclarationReviewRow[], state: DeclarationReviewState) {
  const nextState = { ...reviewStateMap.value }
  const reviewedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')

  projects.forEach((project) => {
    nextState[project.id] = {
      ...state,
      operator: 'PMO',
      reviewedAt,
    }
  })

  persistReviewState(nextState)
}

const activeAiDiagnosisRow = computed(
  () => aiDiagnosisMockRows.find((row) => row.code === activeRow.value?.projectCode) ?? null,
)

const aiDiagnosisItems = computed(() => {
  const row = activeAiDiagnosisRow.value

  if (!row) {
    return []
  }

  return [
    { label: '单号', value: row.code, pass: true },
    { label: '项目名称', value: row.projectName, pass: true },
    { label: '①申报人身份', value: row.identity, pass: !isIssue(row.identity) },
    { label: '②申报范围', value: row.scope, pass: !isIssue(row.scope) },
    { label: '③申报数量', value: row.quantity, pass: !isIssue(row.quantity) },
    { label: '④项目库联动', value: row.libraryLink, pass: !isIssue(row.libraryLink) },
  ]
})

function isIssue(value: string) {
  return value.includes('超限') || value.includes('偏离')
}

function openDetail(project: DeclarationReviewRow) {
  activeRow.value = project
  detailActiveTab.value = 'application'
  detailVisible.value = true
}

function openProjectDetail(project: DeclarationReviewRow) {
  const batchId = project.batch?.id

  if (!batchId) {
    ElMessage.warning('未匹配到该项目所属批次')
    return
  }

  router.push(`/research-project-admin/initiation-batches/${batchId}/projects/${project.projectId}`)
}

/** AN-MWVFK53B：行内下拉二选一——选「通过」直接下结论，选「驳回」弹必填理由（取消则回退待审查） */
function handleResultSelect(project: DeclarationReviewRow, status: ReviewStatus) {
  if (status === '已通过') {
    approveProject(project)
    return
  }
  if (status === '已驳回') {
    openReject(project)
  }
}

function approveProject(project: DeclarationReviewRow) {
  if (!canReview(project)) {
    ElMessage.info('该项目当前不需要重复审查')
    return
  }

  updateProjectReviewState([project], { status: '已通过' })
  selectedRows.value = selectedRows.value.filter((row) => row.id !== project.id)
  ElMessage.success(`已通过“${project.projectName}”的申报审查`)
}

async function batchApprove() {
  const rows = selectedRows.value.filter((row) => canReview(row))

  if (!rows.length) {
    ElMessage.warning('请先选择待审查项目')
    return
  }

  try {
    await ElMessageBox.confirm(`确认批量通过已选择的 ${rows.length} 个项目申报审查吗？`, '批量通过确认', {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'warning',
    })
    updateProjectReviewState(rows, { status: '已通过' })
    selectedRows.value = []
    tableRef.value?.clearSelection()
    ElMessage.success(`已批量通过 ${rows.length} 个项目`)
  } catch {
    // 用户取消，不需要提示。
  }
}

async function batchReject() {
  const rows = selectedRows.value.filter((row) => canReview(row))

  if (!rows.length) {
    ElMessage.warning('请先选择待审查项目')
    return
  }

  try {
    const { value } = await ElMessageBox.prompt(
      `确认驳回已选择的 ${rows.length} 个项目申报吗？请填写统一驳回理由（必填，项目负责人将据此修改申报材料）`,
      '批量驳回确认',
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        type: 'warning',
        inputType: 'textarea',
        inputPlaceholder: '请填写驳回理由',
        inputValidator: (input: string) => (input && input.trim() ? true : '驳回理由不能为空'),
      },
    )
    updateProjectReviewState(rows, { status: '已驳回', reason: value.trim() })
    selectedRows.value = []
    tableRef.value?.clearSelection()
    ElMessage.success(`已批量驳回 ${rows.length} 个项目`)
  } catch {
    // 用户取消，不需要提示。
  }
}

function openReject(project: DeclarationReviewRow) {
  if (!canReview(project)) {
    ElMessage.info('该项目当前不需要重复审查')
    return
  }

  activeRow.value = project
  rejectForm.reason = ''
  rejectVisible.value = true
}

function confirmReject() {
  if (!activeRow.value) {
    return
  }

  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请填写驳回理由')
    return
  }

  submitting.value = true
  window.setTimeout(() => {
    if (!activeRow.value) {
      submitting.value = false
      return
    }

    updateProjectReviewState([activeRow.value], {
      status: '已驳回',
      reason: rejectForm.reason.trim(),
    })
    selectedRows.value = selectedRows.value.filter((row) => row.id !== activeRow.value?.id)
    tableRef.value?.clearSelection()
    ElMessage.success(`已驳回“${activeRow.value.projectName}”的申报审查`)
    rejectVisible.value = false
    submitting.value = false
  }, 260)
}

function handleSelectionChange(rows: DeclarationReviewRow[]) {
  selectedRows.value = rows
}

function resetFilters() {
  keyword.value = ''
  batchFilter.value = 'all'
  statusFilter.value = 'all'
  selectedRows.value = []
  tableRef.value?.clearSelection()
}

function handleQuery() {
  page.value = 1
  selectedRows.value = []
  tableRef.value?.clearSelection()
}
</script>

<template>
  <section class="declaration-review-page" aria-label="申报审查">
    <nav v-if="!hideFlowStrip" class="approval-flow-steps" aria-label="项目流转线">
      <button
        v-for="(step, index) in declarationFlowSteps"
        :key="step"
        class="approval-flow-step"
        :class="{ active: index === 1, done: index < 1 }"
        @click="emit('flow-step', index)"
      >
        <span class="approval-flow-index">{{ index + 1 }}</span>
        <span class="approval-flow-label">{{ step }}</span>
      </button>
    </nav>

    <section class="declaration-review-card">
      <header class="review-page-head">
        <div>
          <h1>申报审查</h1>
          <p v-if="activeBatch" class="review-batch-hint">
            当前批次：{{ activeBatch.batchName }}（{{ activeBatch.batchCode }}）
          </p>
        </div>
        <div class="review-head-actions">
          <el-button
            type="primary"
            :icon="Check"
            :disabled="!selectedRows.filter((row) => canReview(row)).length"
            @click="batchApprove"
          >
            批量通过
          </el-button>
          <el-button
            type="danger"
            :icon="Close"
            :disabled="!selectedRows.filter((row) => canReview(row)).length"
            @click="batchReject"
          >
            批量驳回
          </el-button>
        </div>
      </header>

      <section class="review-filter-row" aria-label="申报审查筛选">
        <el-input
          v-model="keyword"
          class="review-search"
          clearable
          :prefix-icon="Search"
          placeholder="搜索项目名称、编号、负责人、部门或批次"
        />
        <!-- AN-MWUG1BOX：批次筛选下拉删除——批次上下文由进入批次时确定（initialBatchId），行内不再重复筛选 -->
        <el-select v-model="statusFilter" class="review-filter-select" aria-label="形式审查结果筛选">
          <el-option label="全部状态" value="all" />
          <el-option label="待审查" value="待审查" />
          <el-option label="已通过" value="已通过" />
          <el-option label="已驳回" value="已驳回" />
        </el-select>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </section>

      <div class="review-table-summary">
        <span>共 {{ filteredRows.length }} 条已提交申报</span>
        <span>当前待审查 {{ pendingRows.length }} 条</span>
        <span v-if="selectedRows.length">已选择 {{ selectedRows.length }} 条</span>
      </div>

      <el-table
        ref="tableRef"
        class="declaration-review-table"
        :data="pagedRows"
        row-key="id"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="46" :selectable="selectable" />
        <el-table-column label="项目信息" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="review-project-cell">
              <strong>{{ row.projectName }}</strong>
              <span>{{ row.projectCode }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="负责人/部门" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="review-person-cell">
              <strong>{{ row.leader }}</strong>
              <span>{{ row.department }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="机器校验" width="110">
          <template #default="{ row }">
            <el-tooltip v-if="getMachineCheck(row)" :content="getMachineCheck(row)!.note" placement="top">
              <el-tag :type="getMachineCheck(row)!.passed ? 'success' : 'danger'" effect="light">
                {{ getMachineCheck(row)!.passed ? '通过' : '不通过' }}
              </el-tag>
            </el-tooltip>
            <span v-else class="review-check-empty">—</span>
          </template>
        </el-table-column>
        <el-table-column label="AI校验" width="110">
          <template #default="{ row }">
            <el-tooltip v-if="getAiCheck(row)" :content="getAiCheck(row)!.opinion" placement="top">
              <el-tag :type="getAiCheck(row)!.hasIssue ? 'danger' : 'success'" effect="light">
                {{ getAiCheck(row)!.hasIssue ? '不通过' : '通过' }}
              </el-tag>
            </el-tooltip>
            <span v-else class="review-check-empty">—</span>
          </template>
        </el-table-column>
        <el-table-column label="形式审查结果" width="150">
          <template #default="{ row }">
            <el-select
              v-if="getReviewState(row).status === '待审查'"
              :model-value="getReviewState(row).status"
              size="small"
              class="review-result-select"
              placeholder="待审查"
              aria-label="形式审查结果"
              @change="handleResultSelect(row, $event)"
            >
              <el-option label="通过" value="已通过" />
              <el-option label="驳回" value="已驳回" />
            </el-select>
            <el-tooltip
              v-else-if="getReviewState(row).status === '已驳回'"
              :content="getReviewState(row).reason || '未填写驳回理由'"
              placement="top"
            >
              <el-tag type="danger" effect="light">已驳回</el-tag>
            </el-tooltip>
            <el-tag v-else type="success" effect="light">已通过</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <div class="review-action-cell">
              <el-button link type="primary" :icon="View" @click="openDetail(row)">查看信息</el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无已提交的项目申报信息" />
        </template>
      </el-table>

      <footer class="review-pagination-bar">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredRows.length"
          background
          layout="total, sizes, prev, pager, next, jumper"
        />
      </footer>
    </section>

    <el-dialog
      v-model="detailVisible"
      class="declaration-review-dialog"
      title="查看申报信息"
      width="880px"
      destroy-on-close
    >
      <template v-if="activeRow">
        <el-tabs v-model="detailActiveTab" class="review-detail-tabs">
          <el-tab-pane label="申报书" name="application">
        <section class="application-info-panel">
          <header>
            <span class="application-info-icon">
              <el-icon><DocumentChecked /></el-icon>
            </span>
            <div>
              <h2>{{ activeRow.projectName }}</h2>
              <p>{{ activeRow.projectCode }} · {{ activeRow.leader }} · {{ activeRow.department }}</p>
            </div>
            <el-tag :type="getStatusTagType(getReviewState(activeRow).status)" effect="light">
              {{ getReviewState(activeRow).status }}
            </el-tag>
          </header>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="申报批次">{{ activeRow.batch?.batchName ?? '未匹配批次' }}</el-descriptions-item>
            <el-descriptions-item label="批次编号">{{ activeRow.batch?.batchCode ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="项目类别">{{ activeRow.batch?.project_category ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ activeRow.submitTime }}</el-descriptions-item>
            <el-descriptions-item label="当前节点">{{ activeRow.currentNode }}</el-descriptions-item>
            <el-descriptions-item label="评审进度">{{ getReviewProgress(activeRow) }}</el-descriptions-item>
            <el-descriptions-item label="项目描述" :span="2">
              {{ getApplicationDescription(activeRow) }}
            </el-descriptions-item>
            <el-descriptions-item label="项目成员" :span="2">
              {{ activeRow.leader }}课题组成员，后续接入申报书成员明细接口后展示完整名单。
            </el-descriptions-item>
            <el-descriptions-item label="导师信息" :span="2">
              当前原型暂以所属部门导师库匹配，正式环境从项目申报表单读取。
            </el-descriptions-item>
            <el-descriptions-item label="Word申报书">
              {{ activeRow.projectName }}申报书.docx
            </el-descriptions-item>
            <el-descriptions-item label="PDF预览件">
              {{ activeRow.projectName }}申报书.pdf
            </el-descriptions-item>
          </el-descriptions>

          <section class="application-material-row">
            <article>
              <strong>申报书 PDF</strong>
              <span>已生成，用于形式审查</span>
              <el-button link type="primary">预览</el-button>
            </article>
            <article>
              <strong>签名确认</strong>
              <span>项目负责人已完成签名</span>
              <el-tag type="success" effect="light">已确认</el-tag>
            </article>
          </section>
        </section>
          </el-tab-pane>

          <el-tab-pane label="AI诊断" name="ai">
            <section class="ai-diagnosis-panel">
              <header class="ai-diagnosis-head">
                <span class="ai-diagnosis-icon"><el-icon><MagicStick /></el-icon></span>
                <div>
                  <h3>AI 形式审查诊断</h3>
                  <p>AI 从申报人身份、申报范围、申报数量与项目库联动四个维度给出预审意见，供形式审查参考。</p>
                </div>
              </header>

              <template v-if="activeAiDiagnosisRow">
                <section class="ai-diagnosis-list">
                  <div v-for="item in aiDiagnosisItems" :key="item.label" class="ai-diagnosis-item">
                    <span class="ai-diagnosis-label">{{ item.label }}</span>
                    <span :class="['ai-diagnosis-value', item.pass ? 'pass' : 'issue']">{{ item.value }}</span>
                  </div>
                  <div class="ai-diagnosis-item">
                    <span class="ai-diagnosis-label">形式审查综合意见</span>
                    <span :class="['ai-diagnosis-value', 'ai-opinion', activeAiDiagnosisRow.hasIssue ? 'issue' : 'pass']">
                      {{ activeAiDiagnosisRow.opinion }}
                    </span>
                  </div>
                </section>
              </template>
              <el-empty v-else description="暂无 AI 诊断记录" />

              <p class="ai-diagnosis-tip">以上意见由 AI 预审生成，最终形式审查结论以管理员人工审核为准。</p>
            </section>
          </el-tab-pane>
        </el-tabs>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="activeRow" :icon="View" @click="openProjectDetail(activeRow)">进入项目详情</el-button>
        <el-button
          v-if="activeRow"
          type="success"
          :disabled="!canReview(activeRow)"
          @click="approveProject(activeRow); detailVisible = false"
        >
          通过
        </el-button>
        <el-button
          v-if="activeRow"
          type="danger"
          :disabled="!canReview(activeRow)"
          @click="detailVisible = false; openReject(activeRow)"
        >
          驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="rejectVisible"
      class="declaration-review-dialog"
      title="驳回申报审查"
      width="560px"
      destroy-on-close
    >
      <section v-if="activeRow" class="reject-target-card">
        <strong>{{ activeRow.projectName }}</strong>
        <span>{{ activeRow.projectCode }} · {{ activeRow.leader }}</span>
      </section>

      <el-form label-position="top">
        <el-form-item label="驳回理由" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            maxlength="300"
            show-word-limit
            :rows="5"
            placeholder="请填写驳回理由，项目负责人将据此修改申报材料"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.declaration-review-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.review-detail-tabs :deep(.el-tabs__header) {
  margin-bottom: 14px;
}

.ai-diagnosis-panel {
  display: grid;
  gap: 12px;
}

.ai-diagnosis-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e3ecf7;
  border-radius: 10px;
  background: #f6faff;
}

.ai-diagnosis-icon {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  color: #3478e5;
  background: #e8f1ff;
  font-size: 20px;
}

.ai-diagnosis-head h3 {
  margin: 0 0 4px;
  color: #152b4f;
  font-size: 15px;
}

.ai-diagnosis-head p {
  margin: 0;
  color: #7b8ba4;
  font-size: 12px;
}

.ai-diagnosis-list {
  display: grid;
  gap: 0;
  border: 1px solid #e3ecf7;
  border-radius: 10px;
  overflow: hidden;
}

.ai-diagnosis-item {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  align-items: stretch;
}

.ai-diagnosis-item + .ai-diagnosis-item {
  border-top: 1px solid #edf2f9;
}

.ai-diagnosis-label {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  color: #5f6f86;
  background: #f7fafd;
  font-size: 13px;
  font-weight: 600;
}

.ai-diagnosis-value {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  color: #3a4a63;
  font-size: 13px;
}

.ai-diagnosis-value.pass {
  color: #237a4e;
  font-weight: 600;
}

.ai-diagnosis-value.issue {
  color: #d04550;
  font-weight: 600;
}

.ai-opinion {
  line-height: 1.7;
}

.ai-diagnosis-tip {
  margin: 0;
  color: #98a6bb;
  font-size: 12px;
}

.declaration-review-card {
  border: 1px solid #dce6f3;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgb(45 76 124 / 6%);
  padding: 18px;
  min-width: 0;
}

.review-page-head,
.review-filter-row,
.review-table-summary,
.review-pagination-bar,
.application-info-panel header,
.application-material-row,
.review-action-cell {
  display: flex;
  align-items: center;
}

.review-page-head {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.review-page-head h1 {
  margin: 0;
  color: #162a46;
  font-size: 22px;
  font-weight: 700;
}

.review-batch-hint {
  margin: 6px 0 0;
  color: #64738a;
  font-size: 13px;
}

.review-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.review-filter-row {
  gap: 10px;
  flex-wrap: wrap;
  padding: 14px;
  margin-bottom: 12px;
  border: 1px solid #e2eaf5;
  border-radius: 12px;
  background: #f8fbff;
}

.review-search {
  width: min(360px, 100%);
}

.review-filter-select {
  width: 280px;
}

.review-filter-select.small {
  width: 148px;
}

.review-table-summary {
  justify-content: flex-start;
  gap: 18px;
  min-height: 32px;
  color: #6b7d95;
  font-size: 13px;
}

.declaration-review-table {
  width: 100%;
}

.declaration-review-table :deep(.el-table__header th) {
  background: #f5f8fc;
  color: #566985;
  font-weight: 700;
}

.declaration-review-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: #f8fbff;
}

.review-project-cell,
.review-person-cell,
.review-record-cell {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.review-check-empty {
  color: #b6bfcc;
  font-size: 12.5px;
}

.review-result-select {
  width: 116px;
}

.review-project-cell strong,
.review-person-cell strong {
  overflow: hidden;
  color: #182f4f;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-project-cell span,
.review-person-cell span,
.review-record-cell span,
.review-record-cell small {
  overflow: hidden;
  color: #7d8da4;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-action-cell {
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.review-action-cell :deep(.el-button + .el-button) {
  margin-left: 0;
}

.review-pagination-bar {
  justify-content: flex-end;
  padding-top: 16px;
}

.application-info-panel {
  display: grid;
  gap: 16px;
}

.application-info-panel header {
  gap: 12px;
  padding: 14px;
  border: 1px solid #e2eaf5;
  border-radius: 12px;
  background: #f8fbff;
}

.application-info-panel header > div {
  min-width: 0;
  flex: 1;
}

.application-info-panel h2 {
  margin: 0 0 6px;
  color: #172b49;
  font-size: 18px;
}

.application-info-panel p {
  margin: 0;
  color: #7d8da4;
  font-size: 13px;
}

.application-info-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  color: #3478e5;
  background: #eef5ff;
}

.application-material-row {
  gap: 12px;
  flex-wrap: wrap;
}

.application-material-row article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  align-items: center;
  flex: 1;
  min-width: 260px;
  padding: 12px 14px;
  border: 1px solid #e2eaf5;
  border-radius: 12px;
  background: #ffffff;
}

.application-material-row strong {
  color: #1b3457;
}

.application-material-row span {
  color: #8291a6;
  font-size: 12px;
}

.reject-target-card {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid #f6c7c7;
  border-radius: 12px;
  background: #fff7f7;
}

.reject-target-card strong {
  color: #172b49;
}

.reject-target-card span {
  color: #7d8da4;
  font-size: 13px;
}

@media (max-width: 1280px) {
  .review-search,
  .review-filter-select,
  .review-filter-select.small {
    width: 100%;
  }
}
.approval-flow-steps {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.approval-flow-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid #e7eaf0;
  background: #ffffff;
  color: #8a93a6;
  font-size: 13px;
  font-weight: 600;
}

.approval-flow-step--clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.approval-flow-step--clickable:hover {
  border-color: #409eff;
  color: #2f6ad9;
  transform: translateY(-1px);
}

.approval-flow-step.done {
  border-color: #bfe3d2;
  background: #f2faf6;
  color: #237a4e;
}

.approval-flow-step.active {
  border-color: #409eff;
  background: #409eff;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.35);
}

.approval-flow-index {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: currentColor;
  color: #ffffff;
  font-size: 12px;
  font-weight: 780;
}

.approval-flow-step.done .approval-flow-index {
  background: #237a4e;
}

.approval-flow-step.active .approval-flow-index {
  background: rgba(255, 255, 255, 0.92);
  color: #409eff;
}

.approval-flow-step + .approval-flow-step::before {
  content: '›';
  order: -1;
  margin-right: 4px;
  color: #c0c7d4;
  font-size: 15px;
  font-weight: 700;
}
</style>
