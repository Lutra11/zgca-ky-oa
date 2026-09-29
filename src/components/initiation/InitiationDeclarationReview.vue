<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type TableInstance } from 'element-plus'
import {
  Check,
  Close,
  DocumentChecked,
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

const STORAGE_KEY = 'zgca_ky_oa_initiation_declaration_review_state'

const router = useRouter()
const keyword = shallowRef('')
const batchFilter = shallowRef('all')
const statusFilter = shallowRef<ReviewStatus | 'all'>('all')
const page = shallowRef(1)
const pageSize = shallowRef(10)
const selectedRows = shallowRef<DeclarationReviewRow[]>([])
const tableRef = shallowRef<TableInstance>()
const detailVisible = shallowRef(false)
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

const batchOptions = computed(() =>
  initiationBatchMockRows
    .filter((batch) =>
      submittedProjects.value.some((project) => project.year === batch.year && project.quarter === batch.quarter),
    )
    .map((batch) => ({
      label: `${batch.batchName}（${batch.batchCode}）`,
      value: batch.id,
    })),
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

function getNodeTagType(node: string) {
  if (node === '已立项') {
    return 'success'
  }

  if (node === '评审中') {
    return 'primary'
  }

  if (node === '待确认立项' || node === '待配置评审') {
    return 'warning'
  }

  return 'info'
}

function getReviewProgress(project: DeclarationReviewRow) {
  if (!project.reviewTotal) {
    return '尚未开始'
  }

  return `${project.reviewFinished}/${project.reviewTotal}`
}

function formatBatch(project: DeclarationReviewRow) {
  return project.batch ? `${project.batch.batchName}（${project.batch.batchCode}）` : '未匹配批次'
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
      operator: '科研项目管理员',
      reviewedAt,
    }
  })

  persistReviewState(nextState)
}

function openDetail(project: DeclarationReviewRow) {
  activeRow.value = project
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
    <section class="declaration-review-card">
      <header class="review-page-head">
        <div>
          <h1>申报审查</h1>
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
        <el-select v-model="batchFilter" class="review-filter-select" aria-label="批次筛选">
          <el-option label="全部批次" value="all" />
          <el-option v-for="batch in batchOptions" :key="batch.value" :label="batch.label" :value="batch.value" />
        </el-select>
        <el-select v-model="statusFilter" class="review-filter-select small" aria-label="审查状态筛选">
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
        <el-table-column label="申报批次" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">{{ formatBatch(row) }}</template>
        </el-table-column>
        <el-table-column label="负责人/部门" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="review-person-cell">
              <strong>{{ row.leader }}</strong>
              <span>{{ row.department }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="158" />
        <el-table-column label="当前节点" width="128">
          <template #default="{ row }">
            <el-tag :type="getNodeTagType(row.currentNode)" effect="light" round>{{ row.currentNode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评审进度" width="118">
          <template #default="{ row }">{{ getReviewProgress(row) }}</template>
        </el-table-column>
        <el-table-column label="审查状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(getReviewState(row).status)" effect="light">
              {{ getReviewState(row).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审查记录" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="review-record-cell">
              <span>{{ getReviewState(row).operator ?? '待处理' }}</span>
              <small>{{ getReviewState(row).reviewedAt ?? '暂无审查时间' }}</small>
              <small v-if="getReviewState(row).reason">驳回理由：{{ getReviewState(row).reason }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="248" fixed="right" align="center">
          <template #default="{ row }">
            <div class="review-action-cell">
              <el-button link type="primary" :icon="View" @click="openDetail(row)">填写信息</el-button>
              <el-button link type="success" :icon="Check" :disabled="!canReview(row)" @click="approveProject(row)">
                通过
              </el-button>
              <el-button link type="danger" :icon="Close" :disabled="!canReview(row)" @click="openReject(row)">
                驳回
              </el-button>
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
      title="申报填写信息"
      width="860px"
      destroy-on-close
    >
      <template v-if="activeRow">
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
</style>
