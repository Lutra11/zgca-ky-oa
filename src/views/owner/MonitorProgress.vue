<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import {
  CircleCheckFilled,
  CircleCloseFilled,
  Clock,
  DataLine,
  Document,
  Download,
  FolderOpened,
  Search,
  View,
  WarningFilled,
} from '@element-plus/icons-vue'
import monitorProgressDataset from '../../dataset/monitor_progress.json'

interface MonitorProject {
  id: string
  projectCode: string
  batch: string
  projectType: string
  subDirection: string
  faculty: string
  projectName: string
  principal: string
  reviewers: string[]
  evaluationRequired: number
  evaluationCompleted: number
  materialSubmitted: boolean
  reviewCompleted: boolean
  materialSubmittedAt: string
  reviewerAssignedAt: string
  evaluationUpdatedAt: string
  reviewCompletedAt: string
}

interface ProgressFilters {
  batch: string
  facultyDirection: string
  materialStatus: '' | 'submitted' | 'unsubmitted'
  keyword: string
}

type FlowStatus = 'done' | 'active' | 'pending'

interface FlowNode {
  key: string
  label: string
  status: FlowStatus
  statusLabel: string
  time: string
}

const route = useRoute()
const router = useRouter()
const projects = monitorProgressDataset as MonitorProject[]
const props = withDefaults(
  defineProps<{
    queryPath?: string
    allowProjectDetail?: boolean
    projectDetailRouteName?: string
  }>(),
  {
    queryPath: '/research-project-admin/project-management',
    allowProjectDetail: true,
    projectDetailRouteName: 'research-project-admin-project-management-detail',
  },
)

const draftFilters = reactive<ProgressFilters>({
  batch: getQueryString('batch'),
  facultyDirection: getQueryString('facultyDirection'),
  materialStatus: getMaterialStatusQuery(),
  keyword: getQueryString('keyword'),
})

const appliedFilters = reactive<ProgressFilters>({
  batch: draftFilters.batch,
  facultyDirection: draftFilters.facultyDirection,
  materialStatus: draftFilters.materialStatus,
  keyword: draftFilters.keyword,
})

const selectedProjectId = shallowRef(getQueryString('selected') || projects[0]?.id || '')
const currentPage = shallowRef(getPositiveNumberQuery('page', 1))
const pageSize = shallowRef(getPageSizeQuery())

const batchOptions = computed(() => unique(projects.map((project) => project.batch)))

const facultyDirectionOptions = computed(() =>
  unique(projects.map((project) => `${project.faculty}/${project.subDirection}`)),
)

const filteredProjects = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return projects.filter((project) => {
    const matchesBatch = appliedFilters.batch ? project.batch === appliedFilters.batch : true
    const matchesFacultyDirection = appliedFilters.facultyDirection
      ? `${project.faculty}/${project.subDirection}` === appliedFilters.facultyDirection
      : true
    const matchesMaterial =
      appliedFilters.materialStatus === 'submitted'
        ? project.materialSubmitted
        : appliedFilters.materialStatus === 'unsubmitted'
          ? !project.materialSubmitted
          : true
    const matchesKeyword = keyword
      ? [project.projectName, project.projectCode, project.principal].some((value) =>
          value.toLowerCase().includes(keyword),
        )
      : true

    return matchesBatch && matchesFacultyDirection && matchesMaterial && matchesKeyword
  })
})

const paginatedProjects = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(startIndex, startIndex + pageSize.value)
})

const selectedProject = computed(
  () =>
    projects.find((project) => project.id === selectedProjectId.value) ??
    paginatedProjects.value[0] ??
    filteredProjects.value[0],
)

const unlaunchedSubDirectionCount = computed(
  () => new Set(projects.filter((project) => project.reviewers.length === 0).map((project) => project.subDirection)).size,
)

const completedReviewCount = computed(
  () => projects.filter((project) => project.reviewCompleted).length,
)

const unsubmittedMaterialCount = computed(
  () => projects.filter((project) => !project.materialSubmitted).length,
)

const metricCards = computed(() => [
  {
    key: 'unlaunched',
    label: '未发起评审的子方向',
    value: unlaunchedSubDirectionCount.value,
    tone: 'purple',
    icon: WarningFilled,
  },
  {
    key: 'total',
    label: '总项目数',
    value: projects.length,
    tone: 'blue',
    icon: Document,
  },
  {
    key: 'completed',
    label: '已完成评审',
    value: completedReviewCount.value,
    tone: 'green',
    icon: CircleCheckFilled,
  },
  {
    key: 'unsubmitted',
    label: '材料未提交',
    value: unsubmittedMaterialCount.value,
    tone: 'orange',
    icon: FolderOpened,
  },
])

const selectedEvaluationPercent = computed(() =>
  selectedProject.value ? getEvaluationPercent(selectedProject.value) : 0,
)

const selectedFlowNodes = computed(() =>
  selectedProject.value ? getProjectFlowNodes(selectedProject.value) : [],
)

function applyFilters() {
  appliedFilters.batch = draftFilters.batch
  appliedFilters.facultyDirection = draftFilters.facultyDirection
  appliedFilters.materialStatus = draftFilters.materialStatus
  appliedFilters.keyword = draftFilters.keyword
  currentPage.value = 1
  ensureSelectedProject()
  syncListQuery()
}

function resetFilters() {
  draftFilters.batch = ''
  draftFilters.facultyDirection = ''
  draftFilters.materialStatus = ''
  draftFilters.keyword = ''
  appliedFilters.batch = ''
  appliedFilters.facultyDirection = ''
  appliedFilters.materialStatus = ''
  appliedFilters.keyword = ''
  currentPage.value = 1
  ensureSelectedProject()
  syncListQuery()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  ensureSelectedProject()
  syncListQuery()
}

function handlePageChange(page: number) {
  currentPage.value = page
  ensureSelectedProject()
  syncListQuery()
}

function selectProject(project: MonitorProject) {
  selectedProjectId.value = project.id
  syncListQuery()
}

function ensureSelectedProject() {
  const selectedVisible = filteredProjects.value.some((project) => project.id === selectedProjectId.value)

  if (!selectedVisible) {
    selectedProjectId.value = filteredProjects.value[0]?.id ?? ''
    return
  }

  if (!paginatedProjects.value.some((project) => project.id === selectedProjectId.value)) {
    selectedProjectId.value = paginatedProjects.value[0]?.id ?? filteredProjects.value[0]?.id ?? ''
  }
}

function rowClassName({ row }: { row: MonitorProject }) {
  return row.id === selectedProjectId.value ? 'monitor-row-active' : ''
}

function getReviewersText(project: MonitorProject) {
  if (!project.reviewers.length) {
    return '未指定评委'
  }

  if (project.reviewers.length > 3) {
    return `${project.reviewers.slice(0, 3).join('、')}...`
  }

  return project.reviewers.join('、')
}

function getEvaluationPercent(project: MonitorProject) {
  if (!project.evaluationRequired) {
    return 0
  }

  return Math.round((project.evaluationCompleted / project.evaluationRequired) * 100)
}

function getEvaluationClass(project: MonitorProject) {
  const percent = getEvaluationPercent(project)

  return {
    'evaluation-complete': percent >= 100,
    'evaluation-warning': percent > 0 && percent < 100,
    'evaluation-danger': percent === 0,
  }
}

function getEvaluationProgressStatus(project: MonitorProject) {
  const percent = getEvaluationPercent(project)

  if (percent >= 100) {
    return 'success'
  }

  if (percent === 0) {
    return 'exception'
  }

  return 'warning'
}

function getBooleanTooltip(type: 'material' | 'review', value: boolean) {
  if (type === 'material') {
    return value ? '已提交' : '未提交'
  }

  return value ? '已完成评审' : '未完成评审'
}

function getProjectFlowNodes(project: MonitorProject): FlowNode[] {
  const hasReviewers = project.reviewers.length > 0
  const evaluationComplete = project.evaluationRequired > 0 && project.evaluationCompleted >= project.evaluationRequired

  return [
    {
      key: 'material',
      label: '材料提交',
      status: project.materialSubmitted ? 'done' : 'active',
      statusLabel: project.materialSubmitted ? '已完成' : '进行中',
      time: project.materialSubmittedAt || '待提交',
    },
    {
      key: 'reviewers',
      label: '分配评委',
      status: hasReviewers ? 'done' : project.materialSubmitted ? 'active' : 'pending',
      statusLabel: hasReviewers ? '已完成' : project.materialSubmitted ? '进行中' : '未开始',
      time: project.reviewerAssignedAt || '待分配',
    },
    {
      key: 'evaluation',
      label: '360环评',
      status: evaluationComplete ? 'done' : hasReviewers ? 'active' : 'pending',
      statusLabel: evaluationComplete ? '已完成' : hasReviewers ? '进行中' : '未开始',
      time: project.evaluationUpdatedAt || '待更新',
    },
    {
      key: 'review',
      label: '完成评审',
      status: project.reviewCompleted ? 'done' : evaluationComplete ? 'active' : 'pending',
      statusLabel: project.reviewCompleted ? '已完成' : evaluationComplete ? '进行中' : '未开始',
      time: project.reviewCompletedAt || '待完成',
    },
  ]
}

function viewProjectDetail() {
  if (!selectedProject.value) {
    return
  }

  if (!props.allowProjectDetail) {
    ElMessage.info(`${selectedProject.value.projectCode} 项目详情入口已预留`)
    return
  }

  router.push({
    name: props.projectDetailRouteName,
    params: {
      projectId: selectedProject.value.projectCode,
    },
    query: route.query,
  })
}

function exportProgress() {
  const project = selectedProject.value

  if (!project) {
    ElMessage.warning('请先选择项目')
    return
  }

  const rows = [
    ['项目编号', '项目批次', '所在子方向', '所属学部', '项目名称', '项目负责人', '评审名单', '360环评', '材料提交', '评审完成'],
    [
      project.projectCode,
      project.batch,
      project.subDirection,
      project.faculty,
      project.projectName,
      project.principal,
      project.reviewers.join('、') || '未指定评委',
      `${project.evaluationCompleted}/${project.evaluationRequired}`,
      project.materialSubmitted ? '已提交' : '未提交',
      project.reviewCompleted ? '已完成评审' : '未完成评审',
    ],
  ]
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `${project.projectCode}-进度.csv`
  link.click()
  window.URL.revokeObjectURL(downloadUrl)
  ElMessage.success('当前项目进度已导出')
}

function escapeCsvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean)
}

function getQueryString(key: string) {
  const value = route.query[key]

  return typeof value === 'string' ? value : ''
}

function getMaterialStatusQuery(): ProgressFilters['materialStatus'] {
  const value = getQueryString('materialStatus')

  return value === 'submitted' || value === 'unsubmitted' ? value : ''
}

function getPositiveNumberQuery(key: string, fallback: number) {
  const value = Number(getQueryString(key))

  return Number.isInteger(value) && value > 0 ? value : fallback
}

function getPageSizeQuery() {
  const value = getPositiveNumberQuery('pageSize', 10)

  return [10, 20, 50].includes(value) ? value : 10
}

function syncListQuery() {
  const query: Record<string, string> = {}

  if (appliedFilters.batch) {
    query.batch = appliedFilters.batch
  }

  if (appliedFilters.facultyDirection) {
    query.facultyDirection = appliedFilters.facultyDirection
  }

  if (appliedFilters.materialStatus) {
    query.materialStatus = appliedFilters.materialStatus
  }

  if (appliedFilters.keyword) {
    query.keyword = appliedFilters.keyword
  }

  if (currentPage.value > 1) {
    query.page = String(currentPage.value)
  }

  if (pageSize.value !== 10) {
    query.pageSize = String(pageSize.value)
  }

  if (selectedProjectId.value) {
    query.selected = selectedProjectId.value
  }

  router.replace({
    path: props.queryPath,
    query,
  })
}
</script>

<template>
  <section class="monitor-progress" aria-label="监控进度">
    <header class="monitor-heading">
      <div>
      </div>
    </header>

    <section class="monitor-metrics" aria-label="进度统计">
      <article
        v-for="metric in metricCards"
        :key="metric.key"
        class="monitor-metric-card"
        :class="`metric-${metric.tone}`"
      >
        <span class="metric-accent"></span>
        <div>
          <p>{{ metric.label }}</p>
          <strong>{{ metric.value }}</strong>
        </div>
        <span class="metric-icon">
          <el-icon><component :is="metric.icon" /></el-icon>
        </span>
      </article>
    </section>

    <section class="monitor-filter-panel" aria-label="项目筛选">
      <label class="filter-field">
        <span>项目批次</span>
        <el-select v-model="draftFilters.batch" placeholder="全部批次" clearable>
          <el-option v-for="batch in batchOptions" :key="batch" :label="batch" :value="batch" />
        </el-select>
      </label>

      <label class="filter-field">
        <span>学部/子方向</span>
        <el-select v-model="draftFilters.facultyDirection" placeholder="全部" clearable>
          <el-option
            v-for="item in facultyDirectionOptions"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </label>

      <label class="filter-field">
        <span>材料提交</span>
        <el-select v-model="draftFilters.materialStatus" placeholder="全部" clearable>
          <el-option label="已提交" value="submitted" />
          <el-option label="未提交" value="unsubmitted" />
        </el-select>
      </label>

      <label class="filter-field search-field">
        <span>搜索</span>
        <el-input
          v-model="draftFilters.keyword"
          :prefix-icon="Search"
          placeholder="请输入项目名称 / 项目编号 / 负责人"
          clearable
        />
      </label>

      <div class="filter-actions">
        <el-button type="primary" @click="applyFilters">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </section>

    <section class="monitor-workbench">
      <article class="project-list-panel">
        <div class="panel-header">
          <h3>项目列表</h3>
          <span>共 {{ filteredProjects.length }} 项</span>
        </div>

        <el-table
          class="monitor-table"
          :data="paginatedProjects"
          :row-class-name="rowClassName"
          height="560"
          @row-click="selectProject"
        >
          <el-table-column label="序号" width="64" align="center">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>

          <el-table-column label="项目编号" width="120">
            <template #default="{ row }">
              <button class="project-code-link" type="button" @click.stop="selectProject(row)">
                {{ row.projectCode }}
              </button>
            </template>
          </el-table-column>

          <el-table-column prop="subDirection" label="所在子方向" width="112" />
          <el-table-column prop="faculty" label="所属学部" width="118" />

          <el-table-column label="项目名称" min-width="230">
            <template #default="{ row }">
              <el-tooltip :content="row.projectName" placement="top" effect="light">
                <span class="project-name-cell">{{ row.projectName }}</span>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column prop="principal" label="项目负责人" width="106" />

          <el-table-column label="评审名单" width="142">
            <template #default="{ row }">
              <span v-if="row.reviewers.length === 0" class="muted-text">未指定评委</span>
              <el-tooltip
                v-else-if="row.reviewers.length > 3"
                :content="row.reviewers.join('、')"
                placement="top"
                effect="light"
              >
                <span class="reviewer-text">{{ getReviewersText(row) }}</span>
              </el-tooltip>
              <span v-else class="reviewer-text">{{ getReviewersText(row) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="360环评" width="92" align="center">
            <template #default="{ row }">
              <span class="evaluation-text" :class="getEvaluationClass(row)">
                {{ row.evaluationCompleted }}/{{ row.evaluationRequired }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="材料提交" width="94" align="center">
            <template #default="{ row }">
              <el-tooltip :content="getBooleanTooltip('material', row.materialSubmitted)" placement="top">
                <el-icon
                  class="boolean-icon"
                  :class="row.materialSubmitted ? 'boolean-success' : 'boolean-danger'"
                >
                  <CircleCheckFilled v-if="row.materialSubmitted" />
                  <CircleCloseFilled v-else />
                </el-icon>
              </el-tooltip>
            </template>
          </el-table-column>

          <el-table-column label="是否完成评审" width="118" align="center">
            <template #default="{ row }">
              <el-tooltip :content="getBooleanTooltip('review', row.reviewCompleted)" placement="top">
                <el-icon
                  class="boolean-icon"
                  :class="row.reviewCompleted ? 'boolean-success' : 'boolean-danger'"
                >
                  <CircleCheckFilled v-if="row.reviewCompleted" />
                  <CircleCloseFilled v-else />
                </el-icon>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-footer">
          <span>共 {{ filteredProjects.length }} 项</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredProjects.length"
            layout="sizes, prev, pager, next, jumper"
            background
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </article>

      <aside v-if="selectedProject" class="project-preview-panel" aria-label="项目预览">
        <div class="preview-header">
          <h3>项目预览</h3>
          <el-tag type="primary" effect="light">{{ selectedProject.batch }}</el-tag>
        </div>

        <div class="preview-title-block">
          <h4>{{ selectedProject.projectName }}</h4>
          <p>{{ selectedProject.projectCode }} · {{ selectedProject.projectType }}</p>
        </div>

        <dl class="preview-info-list">
          <div>
            <dt>所在子方向</dt>
            <dd>{{ selectedProject.subDirection }}</dd>
          </div>
          <div>
            <dt>所属学部</dt>
            <dd>{{ selectedProject.faculty }}</dd>
          </div>
          <div>
            <dt>项目负责人</dt>
            <dd>{{ selectedProject.principal }}</dd>
          </div>
          <div>
            <dt>评审名单</dt>
            <dd>{{ selectedProject.reviewers.join('、') || '未指定评委' }}</dd>
          </div>
        </dl>

        <section class="preview-section">
          <div class="progress-title-row">
            <h4>360环评进度</h4>
            <strong>
              {{ selectedProject.evaluationCompleted }}/{{ selectedProject.evaluationRequired }}
              <span>{{ selectedEvaluationPercent }}%</span>
            </strong>
          </div>
          <el-progress
            :percentage="selectedEvaluationPercent"
            :stroke-width="10"
            :status="getEvaluationProgressStatus(selectedProject)"
          />
        </section>

        <section class="preview-state-tags">
          <div>
            <span>材料提交</span>
            <el-tag :type="selectedProject.materialSubmitted ? 'success' : 'danger'" effect="light">
              {{ selectedProject.materialSubmitted ? '已提交' : '未提交' }}
            </el-tag>
          </div>
          <div>
            <span>评审完成</span>
            <el-tag :type="selectedProject.reviewCompleted ? 'success' : 'danger'" effect="light">
              {{ selectedProject.reviewCompleted ? '已完成评审' : '未完成评审' }}
            </el-tag>
          </div>
        </section>

        <section class="preview-section">
          <h4>项目评审流程</h4>
          <div class="flow-line">
            <div
              v-for="(node, index) in selectedFlowNodes"
              :key="node.key"
              class="flow-node"
              :class="`flow-${node.status}`"
            >
              <div class="flow-marker">
                <el-icon v-if="node.status === 'done'"><CircleCheckFilled /></el-icon>
                <el-icon v-else-if="node.status === 'active'"><Clock /></el-icon>
                <span v-else></span>
              </div>
              <div class="flow-content">
                <strong>{{ node.label }}</strong>
                <span>{{ node.statusLabel }}</span>
                <small>{{ node.time }}</small>
              </div>
              <i v-if="index < selectedFlowNodes.length - 1" class="flow-connector"></i>
            </div>
          </div>
        </section>

        <div class="preview-actions">
          <el-button :icon="View" plain @click="viewProjectDetail">查看详情</el-button>
          <el-button :icon="Download" type="primary" @click="exportProgress">导出进度</el-button>
        </div>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.monitor-progress {
  display: grid;
  gap: 16px;
  color: #1d1d1f;
}

.monitor-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.monitor-title,
.monitor-summary,
.monitor-metric-card p,
.panel-header h3,
.preview-header h3,
.preview-title-block h4,
.preview-title-block p,
.preview-section h4,
.preview-info-list,
.preview-info-list dd {
  margin: 0;
}

.monitor-title {
  font-size: 30px;
  font-weight: 820;
  letter-spacing: 0;
}

.monitor-summary {
  margin-top: 8px;
  color: #6e6e73;
  font-size: 14px;
}

.monitor-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 14px;
}

.monitor-metric-card,
.monitor-filter-panel,
.project-list-panel,
.project-preview-panel {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.monitor-metric-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 92px;
  gap: 16px;
  padding: 18px 20px 18px 28px;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.monitor-metric-card:hover,
.project-list-panel:hover,
.project-preview-panel:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 48px rgba(26, 39, 68, 0.08);
}

.metric-accent {
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 4px;
  border-radius: 999px;
}

.monitor-metric-card p {
  color: #424245;
  font-size: 14px;
  font-weight: 760;
}

.monitor-metric-card strong {
  display: block;
  margin-top: 8px;
  font-size: 34px;
  line-height: 1;
  font-weight: 840;
}

.metric-icon {
  width: 54px;
  height: 54px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  font-size: 25px;
}

.metric-purple .metric-accent {
  background: #8b5cf6;
}

.metric-purple strong,
.metric-purple .metric-icon {
  color: #8b5cf6;
}

.metric-purple .metric-icon {
  background: #f1edff;
}

.metric-blue .metric-accent {
  background: #0a84ff;
}

.metric-blue strong,
.metric-blue .metric-icon {
  color: #0a84ff;
}

.metric-blue .metric-icon {
  background: #e8f3ff;
}

.metric-green .metric-accent {
  background: #1fbd72;
}

.metric-green strong,
.metric-green .metric-icon {
  color: #1fbd72;
}

.metric-green .metric-icon {
  background: #e9f8ef;
}

.metric-orange .metric-accent {
  background: #ff8a1f;
}

.metric-orange strong,
.metric-orange .metric-icon {
  color: #ff8a1f;
}

.metric-orange .metric-icon {
  background: #fff3e8;
}

.monitor-filter-panel {
  display: grid;
  grid-template-columns: minmax(150px, 0.85fr) minmax(180px, 1fr) minmax(150px, 0.85fr) minmax(280px, 1.4fr) auto;
  gap: 14px;
  align-items: end;
  padding: 16px 18px;
}

.filter-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.filter-field span {
  color: #424245;
  font-size: 13px;
  font-weight: 760;
}

.filter-field :deep(.el-select),
.filter-field :deep(.el-input) {
  width: 100%;
}

.filter-field :deep(.el-select__wrapper),
.filter-field :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(29, 29, 31, 0.08);
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.filter-actions :deep(.el-button) {
  min-width: 82px;
  height: 42px;
  border-radius: 10px;
  font-weight: 760;
}

.monitor-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 14px;
  align-items: start;
}

.project-list-panel,
.project-preview-panel {
  min-width: 0;
  padding: 16px;
}

.panel-header,
.preview-header,
.progress-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-header h3,
.preview-header h3 {
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 800;
}

.panel-header span {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 720;
}

.monitor-table {
  margin-top: 12px;
  --el-table-border-color: rgba(29, 29, 31, 0.06);
  --el-table-header-bg-color: #f8fbff;
  border-radius: 10px;
  overflow: hidden;
}

.monitor-table :deep(.el-table__header th) {
  color: #424245;
  font-size: 12px;
  font-weight: 800;
}

.monitor-table :deep(.el-table__row) {
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.monitor-table :deep(.el-table__row:hover),
.monitor-table :deep(.monitor-row-active) {
  background: #eef6ff;
}

.project-code-link,
.table-footer {
  font-weight: 760;
}

.project-code-link {
  border: 0;
  color: #0a84ff;
  background: transparent;
  cursor: pointer;
}

.project-code-link:hover {
  color: #006edb;
}

.project-name-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1d1d1f;
  font-weight: 720;
}

.reviewer-text,
.muted-text,
.evaluation-text {
  font-size: 13px;
  font-weight: 760;
}

.muted-text {
  color: #a1a1aa;
}

.reviewer-text {
  color: #424245;
}

.evaluation-complete {
  color: #1fbd72;
}

.evaluation-warning {
  color: #ff8a1f;
}

.evaluation-danger,
.boolean-danger {
  color: #ff3b30;
}

.boolean-icon {
  font-size: 18px;
}

.boolean-success {
  color: #1fbd72;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 14px;
  color: #6e6e73;
  font-size: 13px;
}

.project-preview-panel {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 18px;
}

.preview-title-block {
  display: grid;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
}

.preview-title-block h4 {
  color: #1d1d1f;
  font-size: 18px;
  line-height: 1.5;
  font-weight: 820;
}

.preview-title-block p {
  color: #86868b;
  font-size: 13px;
}

.preview-info-list {
  display: grid;
  gap: 12px;
}

.preview-info-list div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 12px;
}

.preview-info-list dt {
  color: #86868b;
  font-size: 13px;
}

.preview-info-list dd {
  color: #424245;
  font-size: 13px;
  font-weight: 720;
}

.preview-section {
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(29, 29, 31, 0.08);
}

.preview-section h4,
.progress-title-row h4 {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 800;
}

.progress-title-row strong {
  color: #424245;
  font-size: 13px;
}

.progress-title-row strong span {
  margin-left: 4px;
  color: #6e6e73;
}

.preview-state-tags {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preview-state-tags div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 10px;
  padding: 10px 12px;
  background: #f8fbff;
}

.preview-state-tags span {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 760;
}

.flow-line {
  display: grid;
  gap: 0;
}

.flow-node {
  position: relative;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  min-height: 72px;
}

.flow-marker {
  position: relative;
  z-index: 1;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff;
  font-size: 18px;
}

.flow-done .flow-marker {
  color: #1fbd72;
}

.flow-active .flow-marker {
  color: #ff8a1f;
}

.flow-pending .flow-marker span {
  width: 14px;
  height: 14px;
  border: 2px solid #c8d0dc;
  border-radius: 50%;
}

.flow-connector {
  position: absolute;
  left: 13px;
  top: 30px;
  bottom: 4px;
  width: 2px;
  background: #dce4ef;
}

.flow-done .flow-connector {
  background: #a7e6c6;
}

.flow-content {
  display: grid;
  gap: 4px;
  padding-bottom: 14px;
}

.flow-content strong {
  color: #1d1d1f;
  font-size: 13px;
}

.flow-content span,
.flow-content small {
  color: #86868b;
  font-size: 12px;
}

.flow-done .flow-content span {
  color: #1fbd72;
}

.flow-active .flow-content span {
  color: #ff8a1f;
}

.preview-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.preview-actions :deep(.el-button) {
  height: 42px;
  border-radius: 10px;
  font-weight: 780;
}

@media (max-width: 1440px) {
  .monitor-workbench {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}

@media (max-width: 1280px) {
  .monitor-metrics,
  .monitor-filter-panel,
  .monitor-workbench {
    grid-template-columns: 1fr;
  }

  .project-preview-panel {
    position: static;
  }

  .filter-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 760px) {
  .table-footer,
  .preview-state-tags,
  .preview-actions {
    align-items: stretch;
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .preview-info-list div {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
