<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, CircleCheckFilled, UserFilled, WarningFilled } from '@element-plus/icons-vue'
import templateDataset from '../../../../dataset/template.json'
import ReviewerAssignDialog from './ReviewerAssignDialog.vue'
import ReviewTimeDialog from './ReviewTimeDialog.vue'
import type {
  ReviewerCandidate,
  ReviewProjectFilters,
  SubdirectionReviewProject,
  SubdirectionReviewTask,
} from '../types'

interface TemplateItem {
  id: string
  name: string
  templateNo: string
  category: string
  status: string
  description: string
  fields?: string[]
  workflowNodes?: string[]
}

const props = defineProps<{
  task: SubdirectionReviewTask | null
  reviewerCandidates: ReviewerCandidate[]
}>()

const emit = defineEmits<{
  updateTask: [task: SubdirectionReviewTask, message: string]
  viewProject: [project: SubdirectionReviewProject]
  editTemplate: [templateId: string, taskId: string]
}>()

const templates = templateDataset as TemplateItem[]
const pageSize = shallowRef(10)
const currentPage = shallowRef(1)
const selectedProjectIds = shallowRef<string[]>([])
const reviewerDialogVisible = shallowRef(false)
const timeDialogVisible = shallowRef(false)
const editingProjectIds = shallowRef<string[]>([])
const previewTemplate = shallowRef<TemplateItem | null>(null)
const previewDialogVisible = shallowRef(false)

const draftFilters = reactive<ReviewProjectFilters>({
  batch: '',
  faculty: '',
  subDirection: '',
  projectType: '',
  keyword: '',
})

const appliedFilters = reactive<ReviewProjectFilters>({
  batch: '',
  faculty: '',
  subDirection: '',
  projectType: '',
  keyword: '',
})

const projects = computed(() => props.task?.projects ?? [])
const reviewTemplate = computed(() => getTemplate(props.task?.reviewTemplateId ?? ''))
const noticeTemplate = computed(() => getTemplate(props.task?.noticeTemplateId ?? ''))

const batchOptions = computed(() => unique(projects.value.map((project) => project.batch)))
const facultyOptions = computed(() => unique(projects.value.map((project) => project.faculty)))
const subDirectionOptions = computed(() => unique(projects.value.map((project) => project.subDirection)))
const projectTypeOptions = computed(() => unique(projects.value.map((project) => project.projectType)))

const completedProjectCount = computed(
  () => projects.value.filter((project) => isProjectConfigured(project)).length,
)
const missingReviewerCount = computed(
  () => projects.value.filter((project) => project.assignedReviewerIds.length === 0).length,
)
const missingTimeCount = computed(
  () => projects.value.filter((project) => !project.reviewStartAt || !project.reviewEndAt).length,
)
const materialSubmittedCount = computed(
  () => projects.value.filter((project) => project.materialSubmitted).length,
)

const statCards = computed(() => [
  { label: '总项目数', value: projects.value.length, tone: 'blue', icon: UserFilled },
  { label: '已配置项目数', value: completedProjectCount.value, tone: 'green', icon: CircleCheckFilled },
  { label: '未指定评委', value: missingReviewerCount.value, tone: 'orange', icon: WarningFilled },
  { label: '未设置时间', value: missingTimeCount.value, tone: 'purple', icon: Calendar },
])

const filteredProjects = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return projects.value.filter((project) => {
    const matchesBatch = appliedFilters.batch ? project.batch === appliedFilters.batch : true
    const matchesFaculty = appliedFilters.faculty ? project.faculty === appliedFilters.faculty : true
    const matchesSubDirection = appliedFilters.subDirection
      ? project.subDirection === appliedFilters.subDirection
      : true
    const matchesProjectType = appliedFilters.projectType
      ? project.projectType === appliedFilters.projectType
      : true
    const matchesKeyword = keyword
      ? [project.projectCode, project.projectName, project.principal].some((value) =>
          value.toLowerCase().includes(keyword),
        )
      : true

    return matchesBatch && matchesFaculty && matchesSubDirection && matchesProjectType && matchesKeyword
  })
})

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const selectedProjects = computed(() => {
  const selectedSet = new Set(selectedProjectIds.value)
  return projects.value.filter((project) => selectedSet.has(project.id))
})

const hasSelectedProjects = computed(() => selectedProjects.value.length > 0)

const editingInitialReviewerIds = computed(() => {
  if (!props.task || editingProjectIds.value.length !== 1) {
    return []
  }

  return props.task.projects.find((project) => project.id === editingProjectIds.value[0])?.assignedReviewerIds ?? []
})

const editingInitialTimeRange = computed<[string, string]>(() => {
  if (!props.task || editingProjectIds.value.length !== 1) {
    return ['', '']
  }

  const project = props.task.projects.find((item) => item.id === editingProjectIds.value[0])
  return [project?.reviewStartAt ?? '', project?.reviewEndAt ?? '']
})

watch(
  () => props.task?.id,
  () => {
    resetFilters()
    selectedProjectIds.value = []
  },
)

function applyFilters() {
  appliedFilters.batch = draftFilters.batch
  appliedFilters.faculty = draftFilters.faculty
  appliedFilters.subDirection = draftFilters.subDirection
  appliedFilters.projectType = draftFilters.projectType
  appliedFilters.keyword = draftFilters.keyword
  currentPage.value = 1
}

function resetFilters() {
  draftFilters.batch = ''
  draftFilters.faculty = ''
  draftFilters.subDirection = ''
  draftFilters.projectType = ''
  draftFilters.keyword = ''
  appliedFilters.batch = ''
  appliedFilters.faculty = ''
  appliedFilters.subDirection = ''
  appliedFilters.projectType = ''
  appliedFilters.keyword = ''
  currentPage.value = 1
}

function toggleProjectSelection(projectId: string, checked: boolean) {
  const nextSet = new Set(selectedProjectIds.value)

  if (checked) {
    nextSet.add(projectId)
  } else {
    nextSet.delete(projectId)
  }

  selectedProjectIds.value = Array.from(nextSet)
}

function handleProjectSelectionChange(projectId: string, checked: string | number | boolean) {
  toggleProjectSelection(projectId, Boolean(checked))
}

function openBatchReviewerDialog() {
  if (!selectedProjectIds.value.length) {
    ElMessage.warning('请先勾选需要指定评委的项目')
    return
  }

  editingProjectIds.value = [...selectedProjectIds.value]
  reviewerDialogVisible.value = true
}

function openSingleReviewerDialog(project: SubdirectionReviewProject) {
  editingProjectIds.value = [project.id]
  reviewerDialogVisible.value = true
}

function openBatchTimeDialog() {
  if (!selectedProjectIds.value.length) {
    ElMessage.warning('请先勾选需要指定时间的项目')
    return
  }

  editingProjectIds.value = [...selectedProjectIds.value]
  timeDialogVisible.value = true
}

function openSingleTimeDialog(project: SubdirectionReviewProject) {
  editingProjectIds.value = [project.id]
  timeDialogVisible.value = true
}

async function assignReviewers(reviewerIds: string[]) {
  await updateProjectsWithConfirmation('评委信息已更新', (project) => ({
    ...project,
    assignedReviewerIds: Array.from(new Set([...project.assignedReviewerIds, ...reviewerIds])),
  }))
}

async function assignTime(range: [string, string]) {
  await updateProjectsWithConfirmation('评审时间已更新', (project) => ({
    ...project,
    reviewStartAt: range[0],
    reviewEndAt: range[1],
  }))
}

async function updateProjectsWithConfirmation(
  message: string,
  updater: (project: SubdirectionReviewProject) => SubdirectionReviewProject,
) {
  const task = props.task

  if (!task) {
    return
  }

  if (task.status === '进行中') {
    try {
      await ElMessageBox.confirm('当前评审已进行中，修改关键信息将记录操作日志，是否继续？', '确认修改', {
        type: 'warning',
        confirmButtonText: '继续修改',
        cancelButtonText: '取消',
        autofocus: false,
      })
    } catch {
      return
    }
  }

  const editingSet = new Set(editingProjectIds.value)
  const nextTask = {
    ...task,
    projects: task.projects.map((project) => (editingSet.has(project.id) ? updater(project) : project)),
    operationLogs: [
      {
        operator: task.subDirectionLeaderName,
        content: message,
        time: formatNow(),
      },
      ...task.operationLogs,
    ],
  }

  emit('updateTask', nextTask, message)
}

function saveDraft() {
  if (!props.task) {
    return
  }

  emit('updateTask', props.task, '草稿已保存')
}

async function confirmStartReview() {
  const task = props.task

  if (!task) {
    return
  }

  const missingReviewers = task.projects.filter((project) => !project.assignedReviewerIds.length).length
  const missingTimes = task.projects.filter((project) => !project.reviewStartAt || !project.reviewEndAt).length

  if (missingReviewers || missingTimes) {
    ElMessage.warning(`仍有 ${missingReviewers} 个项目未指定评委，${missingTimes} 个项目未设置评审时间`)
    return
  }

  if (!reviewTemplate.value || !noticeTemplate.value) {
    ElMessage.warning('评审模板或通知模板无效，请先完善模板信息')
    return
  }

  try {
    await ElMessageBox.confirm('确认开始本次评审吗？开始后评委将按配置进入评审阶段。', '确认开始评审', {
      type: 'info',
      confirmButtonText: '确认开始',
      cancelButtonText: '取消',
      autofocus: false,
    })
  } catch {
    return
  }

  emit(
    'updateTask',
    {
      ...task,
      status: '进行中',
      operationLogs: [
        {
          operator: task.subDirectionLeaderName,
          content: '确认开始评审',
          time: formatNow(),
        },
        ...task.operationLogs,
      ],
    },
    '评审已开始',
  )
}

function openTemplatePreview(template: TemplateItem | null) {
  if (!template) {
    return
  }

  previewTemplate.value = template
  previewDialogVisible.value = true
}

function editTemplate(templateId: string) {
  if (!props.task) {
    return
  }

  emit('editTemplate', templateId, props.task.id)
}

function getTemplate(templateId: string) {
  return templates.find((template) => template.id === templateId) ?? null
}

function getReviewerNames(project: SubdirectionReviewProject) {
  const names = project.assignedReviewerIds
    .map((id) => props.reviewerCandidates.find((candidate) => candidate.id === id)?.name)
    .filter(Boolean) as string[]

  return names
}

function getReviewerText(project: SubdirectionReviewProject) {
  const names = getReviewerNames(project)

  if (!names.length) {
    return '未指定'
  }

  if (names.length > 3) {
    return `${names.slice(0, 2).join('、')}等${names.length}人`
  }

  return names.join('、')
}

function isProjectConfigured(project: SubdirectionReviewProject) {
  return Boolean(project.assignedReviewerIds.length && project.reviewStartAt && project.reviewEndAt)
}

function getProjectIndex(index: number) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean)
}

function formatNow() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}
</script>

<template>
  <article class="task-detail-card">
    <el-empty v-if="!task" description="暂无评审任务" :image-size="112" />

    <template v-else>
      <section class="basic-card">
        <div class="basic-info">
          <h3>评审基本信息</h3>
          <div class="info-grid">
            <div>
              <span>评审名称</span>
              <strong>{{ task.reviewName }}</strong>
            </div>
            <div>
              <span>评审周期</span>
              <strong>{{ task.reviewPeriod[0] }} 至 {{ task.reviewPeriod[1] }}</strong>
            </div>
            <div>
              <span>学生绩效和360评审周期</span>
              <strong>{{ task.performancePeriod[0] }} 至 {{ task.performancePeriod[1] }}</strong>
            </div>
            <div>
              <span>发起人 / 审批人</span>
              <strong>{{ task.initiator }} / {{ task.approver }}</strong>
            </div>
            <div>
              <span>审批通过时间</span>
              <strong>{{ task.approvedAt }}</strong>
            </div>
            <div>
              <span>参评项目数量</span>
              <strong>{{ task.projects.length }} 个</strong>
            </div>
          </div>
        </div>

        <div class="template-panel">
          <div class="template-row">
            <span>评审模板</span>
            <strong>{{ reviewTemplate?.name ?? task.reviewTemplateId }}</strong>
            <el-button size="small" plain type="primary" @click="openTemplatePreview(reviewTemplate)">
              预览
            </el-button>
            <el-button size="small" type="primary" @click="editTemplate(task.reviewTemplateId)">
              编辑
            </el-button>
          </div>
          <div class="template-row">
            <span>通知模板</span>
            <strong>{{ noticeTemplate?.name ?? task.noticeTemplateId }}</strong>
            <el-button size="small" plain type="primary" @click="openTemplatePreview(noticeTemplate)">
              预览
            </el-button>
            <el-button size="small" type="primary" @click="editTemplate(task.noticeTemplateId)">
              编辑
            </el-button>
          </div>
        </div>
      </section>

      <section class="stat-grid" aria-label="配置统计">
        <article v-for="stat in statCards" :key="stat.label" class="stat-card" :class="`stat-${stat.tone}`">
          <span class="stat-icon">
            <el-icon><component :is="stat.icon" /></el-icon>
          </span>
          <div>
            <p>{{ stat.label }}</p>
            <strong>{{ stat.value }}</strong>
          </div>
        </article>
        <article class="stat-card stat-orange">
          <span class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></span>
          <div>
            <p>材料已提交</p>
            <strong>{{ materialSubmittedCount }}/{{ projects.length }}</strong>
          </div>
        </article>
      </section>

      <section class="project-config-card">
        <div class="filter-panel">
          <el-select v-model="draftFilters.batch" placeholder="项目批次" clearable>
            <el-option v-for="item in batchOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select v-model="draftFilters.faculty" placeholder="所属学部" clearable>
            <el-option v-for="item in facultyOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select v-model="draftFilters.subDirection" placeholder="所属子方向" clearable>
            <el-option v-for="item in subDirectionOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select v-model="draftFilters.projectType" placeholder="项目类型" clearable>
            <el-option v-for="item in projectTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-input v-model="draftFilters.keyword" placeholder="项目名称 / 编号 / 负责人" clearable />
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>

        <div class="table-actions">
          <div class="selection-summary">
            <span class="selection-count">{{ selectedProjects.length }}</span>
            <span>项已选择</span>
          </div>
          <div class="batch-actions">
            <el-tooltip
              :disabled="hasSelectedProjects"
              content="请先勾选需要配置的项目"
              placement="top"
            >
              <span>
                <el-button
                  :icon="UserFilled"
                  type="primary"
                  plain
                  :disabled="!hasSelectedProjects"
                  @click="openBatchReviewerDialog"
                >
                  批量指定评委
                </el-button>
              </span>
            </el-tooltip>
            <el-tooltip
              :disabled="hasSelectedProjects"
              content="请先勾选需要配置的项目"
              placement="top"
            >
              <span>
                <el-button
                  :icon="Calendar"
                  type="primary"
                  plain
                  :disabled="!hasSelectedProjects"
                  @click="openBatchTimeDialog"
                >
                  批量指定时间
                </el-button>
              </span>
            </el-tooltip>
          </div>
        </div>

        <el-table :data="paginatedProjects" class="project-table" height="430">
          <el-table-column width="54" align="center">
            <template #default="{ row }">
              <el-checkbox
                :model-value="selectedProjectIds.includes(row.id)"
                @change="handleProjectSelectionChange(row.id, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="序号" width="64" align="center">
            <template #default="{ $index }">{{ getProjectIndex($index) }}</template>
          </el-table-column>
          <el-table-column label="项目编号" width="128">
            <template #default="{ row }">
              <button class="project-code" type="button" @click="emit('viewProject', row)">
                {{ row.projectCode }}
              </button>
            </template>
          </el-table-column>
          <el-table-column label="项目名称" min-width="220">
            <template #default="{ row }">
              <el-tooltip :content="row.projectName" placement="top" effect="light">
                <span class="project-name">{{ row.projectName }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="projectType" label="项目类型" width="112" />
          <el-table-column prop="faculty" label="所属学部" width="120" />
          <el-table-column prop="subDirection" label="所属子方向" width="112" />
          <el-table-column prop="principal" label="项目负责人" width="112" />
          <el-table-column label="已指定评委" width="150">
            <template #default="{ row }">
              <span v-if="!row.assignedReviewerIds.length" class="muted-text">未指定</span>
              <el-tooltip v-else :content="getReviewerNames(row).join('、')" placement="top" effect="light">
                <span class="reviewer-text">{{ getReviewerText(row) }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="评审开始时间" width="150">
            <template #default="{ row }">{{ row.reviewStartAt || '未设置' }}</template>
          </el-table-column>
          <el-table-column label="评审截止时间" width="150">
            <template #default="{ row }">{{ row.reviewEndAt || '未设置' }}</template>
          </el-table-column>
          <el-table-column label="配置状态" width="105" align="center">
            <template #default="{ row }">
              <el-tag :type="isProjectConfigured(row) ? 'success' : 'warning'" effect="light">
                {{ isProjectConfigured(row) ? '已完成' : '待配置' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="286" fixed="right" class-name="operation-column" align="center">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button
                  class="row-action-button action-reviewer"
                  :icon="UserFilled"
                  size="small"
                  @click="openSingleReviewerDialog(row)"
                >
                  指定评委
                </el-button>
                <el-button
                  class="row-action-button action-time"
                  :icon="Calendar"
                  size="small"
                  @click="openSingleTimeDialog(row)"
                >
                  指定时间
                </el-button>
                <el-button
                  class="row-detail-button"
                  link
                  type="primary"
                  @click="emit('viewProject', row)"
                >
                  查看详情
                </el-button>
              </div>
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
            layout="sizes, prev, pager, next"
            background
          />
        </div>
      </section>

      <footer class="detail-actions">
        <el-tag v-if="task.status === '进行中'" type="success" effect="light">评审进行中</el-tag>
        <span v-else></span>
        <div>
          <el-button @click="saveDraft">保存草稿</el-button>
          <el-button type="primary" @click="confirmStartReview">确认开始评审</el-button>
        </div>
      </footer>
    </template>

    <ReviewerAssignDialog
      v-model="reviewerDialogVisible"
      :candidates="reviewerCandidates"
      :initial-selected-ids="editingInitialReviewerIds"
      @confirm="assignReviewers"
    />

    <ReviewTimeDialog
      v-if="task"
      v-model="timeDialogVisible"
      :review-period="task.reviewPeriod"
      :initial-range="editingInitialTimeRange"
      @confirm="assignTime"
    />

    <el-dialog v-model="previewDialogVisible" title="模板预览" width="660px" append-to-body>
      <article v-if="previewTemplate" class="template-preview">
        <h3>{{ previewTemplate.name }}</h3>
        <p>{{ previewTemplate.templateNo }} · {{ previewTemplate.category }} · {{ previewTemplate.status }}</p>
        <section>
          <h4>模板正文</h4>
          <p>{{ previewTemplate.description }}</p>
        </section>
        <section v-if="previewTemplate.fields?.length">
          <h4>模板字段</h4>
          <el-tag v-for="field in previewTemplate.fields" :key="field" effect="light">{{ field }}</el-tag>
        </section>
        <section v-if="previewTemplate.workflowNodes?.length">
          <h4>流程节点</h4>
          <el-tag v-for="node in previewTemplate.workflowNodes" :key="node" type="info" effect="light">
            {{ node }}
          </el-tag>
        </section>
      </article>
    </el-dialog>
  </article>
</template>

<style scoped>
.task-detail-card {
  min-width: 0;
  display: grid;
  gap: 14px;
}

.basic-card,
.project-config-card,
.detail-actions {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.basic-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  padding: 16px;
}

.basic-info h3,
.template-preview h3,
.template-preview h4,
.template-preview p {
  margin: 0;
}

.basic-info h3 {
  margin-bottom: 14px;
  border-left: 4px solid #0a84ff;
  padding-left: 10px;
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 840;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px 18px;
}

.info-grid div {
  display: grid;
  gap: 6px;
}

.info-grid span,
.template-row span {
  color: #86868b;
  font-size: 12px;
  font-weight: 760;
}

.info-grid strong,
.template-row strong {
  color: #1d1d1f;
  font-size: 13px;
}

.template-panel {
  display: grid;
  gap: 10px;
  align-content: start;
}

.template-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr) auto auto;
  gap: 8px;
  align-items: center;
  border-radius: 10px;
  padding: 10px;
  background: #f8fbff;
}

.template-row strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 86px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.05);
}

.stat-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 20px;
}

.stat-card p,
.stat-card strong {
  margin: 0;
}

.stat-card p {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 760;
}

.stat-card strong {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  font-weight: 860;
}

.stat-blue .stat-icon,
.stat-blue strong {
  color: #0a84ff;
}

.stat-blue .stat-icon {
  background: #e8f3ff;
}

.stat-green .stat-icon,
.stat-green strong {
  color: #1fbd72;
}

.stat-green .stat-icon {
  background: #e9f8ef;
}

.stat-orange .stat-icon,
.stat-orange strong {
  color: #ff8a1f;
}

.stat-orange .stat-icon {
  background: #fff3e8;
}

.stat-purple .stat-icon,
.stat-purple strong {
  color: #7c3aed;
}

.stat-purple .stat-icon {
  background: #f1edff;
}

.project-config-card {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(130px, 1fr)) minmax(220px, 1.35fr) auto auto;
  gap: 10px;
  align-items: center;
}

.table-actions,
.table-footer,
.detail-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.table-actions {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 760;
}

.selection-summary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  border: 1px solid rgba(10, 132, 255, 0.14);
  border-radius: 10px;
  padding: 0 12px;
  color: #424245;
  background: #f8fbff;
}

.selection-count {
  color: #0a84ff;
  font-size: 18px;
  font-weight: 860;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.batch-actions > span {
  display: inline-flex;
}

.batch-actions :deep(.el-button) {
  height: 36px;
  border-radius: 10px;
  font-weight: 780;
}

.project-table {
  --el-table-header-bg-color: #f8fbff;
  border-radius: 10px;
  overflow: hidden;
}

.project-table :deep(.el-table__header th) {
  color: #424245;
  font-size: 12px;
  font-weight: 820;
}

.project-table :deep(.el-table__row) {
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.project-table :deep(.el-table__row:hover > td) {
  background: #f3f8ff;
}

.project-table :deep(.operation-column .cell) {
  display: flex;
  justify-content: center;
  padding: 0 10px;
}

.project-code {
  border: 0;
  color: #0a84ff;
  background: transparent;
  cursor: pointer;
  font-weight: 760;
}

.project-code:hover {
  color: #006edb;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 252px;
  white-space: nowrap;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.row-action-button {
  min-width: 82px;
  height: 30px;
  border-radius: 999px;
  border-color: transparent;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 780;
  box-shadow: none;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.row-action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(10, 132, 255, 0.12);
}

.action-reviewer {
  color: #0a84ff;
  background: #edf6ff;
}

.action-reviewer:hover {
  border-color: rgba(10, 132, 255, 0.28);
  color: #006edb;
  background: #e3f1ff;
}

.action-time {
  color: #1f8f5f;
  background: #ebf9f1;
}

.action-time:hover {
  border-color: rgba(31, 189, 114, 0.28);
  color: #15764c;
  background: #def5e8;
}

.row-detail-button {
  min-width: 58px;
  height: 30px;
  border-radius: 999px;
  padding: 0 2px;
  font-size: 12px;
  font-weight: 780;
}

.row-detail-button:hover {
  background: rgba(10, 132, 255, 0.08);
}

.project-name {
  display: block;
  overflow: hidden;
  color: #1d1d1f;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 720;
}

.muted-text {
  color: #a1a1aa;
}

.reviewer-text {
  color: #424245;
  font-weight: 720;
}

.table-footer {
  color: #6e6e73;
  font-size: 13px;
}

.detail-actions {
  position: sticky;
  bottom: 0;
  z-index: 6;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px);
}

.detail-actions > div {
  display: flex;
  gap: 10px;
}

.detail-actions :deep(.el-button) {
  min-width: 126px;
  height: 42px;
  border-radius: 10px;
  font-weight: 780;
}

.template-preview {
  display: grid;
  gap: 12px;
}

.template-preview section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-preview section h4 {
  width: 100%;
}

@media (max-width: 1440px) {
  .basic-card,
  .info-grid,
  .filter-panel {
    grid-template-columns: 1fr 1fr;
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .basic-card,
  .info-grid,
  .filter-panel,
  .stat-grid {
    grid-template-columns: 1fr;
  }

  .table-actions,
  .table-footer,
  .detail-actions,
  .detail-actions > div {
    align-items: stretch;
    flex-direction: column;
  }

  .batch-actions,
  .row-actions {
    flex-wrap: wrap;
  }

  .row-actions {
    min-width: 0;
  }
}
</style>
