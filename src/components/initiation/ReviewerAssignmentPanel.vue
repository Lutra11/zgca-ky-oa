<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, RefreshLeft, Search, UserFilled } from '@element-plus/icons-vue'
import reviewerAvatarUrl from '../../dataset/icon/学生头像.png'
import { getMockProjects, getMockReviewers } from '../../dataset/reviewerAssignmentMock'
import type { ProjectItem, ReviewerItem } from '../../dataset/reviewerAssignmentMock'


interface AssignmentProject extends ProjectItem {
  projectNo?: string
  projectType?: string
  reviewerUserId?: string | number | null
  reviewerName?: string | null
  reviewerUsername?: string | null
  assignedReviewerName?: string | null
  assignedReviewerUsername?: string | null
  reviewer?: ReviewerItem | null
  reviewers?: Array<{
    userId: string | number
    username?: string | null
    name?: string | null
    reviewerName?: string | null
  }>
}


// AN-MWUI0BEU：面板标题可按宿主阶段覆写（默认学部语义“指定子方向与评委”，PMO 复审场景传“指定复审评委”）
const props = defineProps<{
  panelTitle?: string
}>()

const projects = shallowRef<AssignmentProject[]>([])
const isProjectLoading = shallowRef(false)
const isAssigning = shallowRef(false)
const isBatchMode = shallowRef(false)
const isBatchAssigning = shallowRef(false)
const projectLoadError = shallowRef('')
const currentPage = shallowRef(1)
const pageSize = shallowRef(10)
const selectedBatchProjects = shallowRef<AssignmentProject[]>([])
const selectedBatchReviewers = shallowRef<ReviewerItem[]>([])
const assignmentTableRef = ref<{ clearSelection: () => void } | null>(null)
const allProjectPageSize = 50

const reviewerDialogVisible = ref(false)
const reviewerDialogMode = shallowRef<'single' | 'batch'>('single')
const currentProject = shallowRef<AssignmentProject | null>(null)
const reviewerList = shallowRef<ReviewerItem[]>([])
const reviewerTotal = shallowRef(0)
const reviewerPage = shallowRef(1)
const reviewerPageSize = shallowRef(16)
const reviewerKeyword = ref('')
const selectedReviewers = shallowRef<ReviewerItem[]>([])
const reviewerLoading = shallowRef(false)
const reviewerLoadError = shallowRef('')
let reviewerSearchTimer: ReturnType<typeof window.setTimeout> | undefined

// ============ 自定义评委组 ============
interface ReviewerGroup {
  id: string
  name: string
  members: ReviewerItem[]
}

const reviewerGroups = shallowRef<ReviewerGroup[]>([])
const groupDialogVisible = shallowRef(false)
const groupSelectedReviewers = shallowRef<ReviewerItem[]>([])
const groupNameDialogVisible = shallowRef(false)
const groupNameInput = ref('')
const reviewerDialogTab = shallowRef<'individual' | 'group'>('individual')

const storageGroupsKey = 'zgca-ky-oa-reviewer-groups'

function loadReviewerGroups() {
  try {
    const raw = window.localStorage.getItem(storageGroupsKey)

    if (raw) {
      reviewerGroups.value = JSON.parse(raw) as ReviewerGroup[]
    }
  } catch {
    reviewerGroups.value = []
  }
}

function persistReviewerGroups() {
  try {
    window.localStorage.setItem(storageGroupsKey, JSON.stringify(reviewerGroups.value))
  } catch {
    // 忽略存储异常，原型演示内存态即可
  }
}

function openGroupDialog() {
  groupSelectedReviewers.value = []
  groupDialogVisible.value = true
  reviewerPage.value = 1
  reviewerKeyword.value = ''
  void loadReviewerPage(1)
}

function isGroupReviewerSelected(reviewer: ReviewerItem) {
  return groupSelectedReviewers.value.some((item) => item.userId === reviewer.userId)
}

function selectGroupReviewer(reviewer: ReviewerItem) {
  if (isGroupReviewerSelected(reviewer)) {
    groupSelectedReviewers.value = groupSelectedReviewers.value.filter((item) => item.userId !== reviewer.userId)
    return
  }

  groupSelectedReviewers.value = [...groupSelectedReviewers.value, reviewer]
}

function confirmGroupSelection() {
  if (!groupSelectedReviewers.value.length) {
    ElMessage.warning('请选择评委后再组成评委组。')
    return
  }

  groupNameInput.value = ''
  groupNameDialogVisible.value = true
}

function confirmGroupName() {
  const name = groupNameInput.value.trim()

  if (!name) {
    ElMessage.warning('请输入评委组名称。')
    return
  }

  if (reviewerGroups.value.some((group) => group.name === name)) {
    ElMessage.warning('该评委组名称已存在，请更换名称。')
    return
  }

  const group: ReviewerGroup = {
    id: `group-${Date.now()}`,
    name,
    members: [...groupSelectedReviewers.value],
  }

  reviewerGroups.value = [...reviewerGroups.value, group]
  persistReviewerGroups()

  groupNameDialogVisible.value = false
  groupDialogVisible.value = false
  ElMessage.success(`评委组「${name}」已创建（${group.members.length} 位评委）。`)
}

function removeReviewerGroup(groupId: string) {
  reviewerGroups.value = reviewerGroups.value.filter((group) => group.id !== groupId)
  persistReviewerGroups()
}

function isGroupSelected(group: ReviewerGroup) {
  const memberIds = group.members.map((member) => member.userId)
  const selectedIds = selectedReviewers.value.map((member) => member.userId)

  return memberIds.length > 0 && memberIds.every((id) => selectedIds.includes(id))
}

function selectReviewerGroup(group: ReviewerGroup) {
  selectedReviewers.value = [...group.members]
  ElMessage.success(`已选择评委组「${group.name}」（${group.members.length} 位评委）。`)
}

function resetGroupDialog() {
  groupSelectedReviewers.value = []
  reviewerKeyword.value = ''
  reviewerPage.value = 1
}

function getReviewerGroupMemberNames(group: ReviewerGroup) {
  return group.members.map((member) => getReviewerCardName(member)).join('、')
}

const filters = reactive({
  keyword: '',
  faculty: '',
  subDirection: '',
  submission: '',
})

const filteredProjects = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  const faculty = filters.faculty
  const subDirection = filters.subDirection
  const submission = filters.submission

  return projects.value.filter((project) => {
    const projectFaculty = getProjectFaculty(project)
    const projectSubDirection = getProjectSubDirection(project)
    const projectSubmitted = isProjectSubmitted(project)
    const matchesKeyword = keyword
      ? [
          project.projectCode,
          project.projectNo,
          project.projectName,
          project.projectBatch,
          project.projectType,
          projectFaculty,
          projectSubDirection,
          project.projectLeader,
          project.status,
          getReviewerDisplay(project),
        ].some((value) => String(value ?? '').toLowerCase().includes(keyword))
      : true
    const matchesFaculty = faculty ? projectFaculty === faculty : true
    const matchesSubDirection = subDirection ? projectSubDirection === subDirection : true
    const matchesSubmission = submission
      ? (submission === 'submitted') === projectSubmitted
      : true

    return matchesKeyword && matchesFaculty && matchesSubDirection && matchesSubmission
  })
})

const filteredTotal = computed(() => filteredProjects.value.length)
const selectedBatchCount = computed(() => selectedBatchProjects.value.length)

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const facultyOptions = computed(() =>
  Array.from(new Set(projects.value.map(getProjectFaculty).filter((value) => value !== '-'))),
)

const subDirectionOptions = computed(() =>
  Array.from(new Set(projects.value.map(getProjectSubDirection).filter((value) => value !== '-'))),
)

const reviewerDialogProjectLabel = computed(() => {
  if (!currentProject.value) {
    return ''
  }

  return `项目：${getProjectCode(currentProject.value)}  ${currentProject.value.projectName}`
})

const selectedReviewerName = computed(() =>
  selectedReviewers.value.map(getReviewerCardName).join('、'),
)

onMounted(() => {
  void loadProjects()
  loadReviewerGroups()
})

onBeforeUnmount(() => {
  if (reviewerSearchTimer) {
    window.clearTimeout(reviewerSearchTimer)
  }
})

function loadProjects(options: { force?: boolean } = {}) {
  projects.value = getMockProjects()
  projectLoadError.value = ''
  const maxPage = Math.max(Math.ceil(filteredTotal.value / pageSize.value), 1)
  currentPage.value = Math.min(currentPage.value, maxPage)
}


async function loadReviewerPage(page = reviewerPage.value) {
  reviewerLoading.value = true
  reviewerLoadError.value = ''

  try {
    const keyword = reviewerKeyword.value.trim().toLowerCase()
    const allReviewers = getMockReviewers()
    const matchedReviewers = keyword
      ? allReviewers.filter((reviewer) =>
          [reviewer.reviewerName, reviewer.username].some((value) =>
            String(value ?? '').toLowerCase().includes(keyword),
          ),
        )
      : allReviewers
    const start = (page - 1) * reviewerPageSize.value

    reviewerList.value = matchedReviewers.slice(start, start + reviewerPageSize.value)
    reviewerTotal.value = matchedReviewers.length
    reviewerPage.value = page
    syncSelectedReviewerFromPage()
  } catch (error: unknown) {
    reviewerList.value = []
    reviewerTotal.value = 0
    reviewerLoadError.value = error instanceof Error ? error.message : '评委列表加载失败，请稍后重试。'
  } finally {
    reviewerLoading.value = false
  }
}

function loadAllReviewers() {
  return getMockReviewers()
}


function openAssignDialog(project: AssignmentProject) {
  reviewerDialogMode.value = 'single'
  currentProject.value = project
  selectedReviewers.value = getAssignedReviewersFromProject(project)
  openReviewerDialog()
}

function openBatchReviewerDialog() {
  if (!isBatchMode.value) {
    return
  }

  reviewerDialogMode.value = 'batch'
  currentProject.value = null
  selectedReviewers.value = [...selectedBatchReviewers.value]
  openReviewerDialog()
}

function openReviewerDialog() {
  reviewerDialogVisible.value = true
  reviewerDialogTab.value = 'individual'
  reviewerPage.value = 1
  reviewerKeyword.value = ''
  void loadReviewerPage(1)
}

function closeReviewerDialog() {
  reviewerDialogVisible.value = false
}

function resetReviewerDialog() {
  currentProject.value = null
  reviewerDialogTab.value = 'individual'
  reviewerKeyword.value = ''
  reviewerPage.value = 1
  reviewerList.value = []
  reviewerTotal.value = 0
  reviewerLoadError.value = ''
  selectedReviewers.value = []
}

async function confirmReviewerDialog() {
  if (!selectedReviewers.value.length) {
    ElMessage.warning('请选择评委。')
    return
  }

  if (reviewerDialogMode.value === 'batch') {
    selectedBatchReviewers.value = [...selectedReviewers.value]
    closeReviewerDialog()
    return
  }

  await confirmAssign()
}

async function confirmAssign() {
  if (isAssigning.value || isBatchAssigning.value) {
    return
  }

  if (!currentProject.value?.id) {
    ElMessage.warning('当前项目 ID 不存在。')
    return
  }

  if (!selectedReviewers.value.length) {
    ElMessage.warning('请选择评委后再确认分配。')
    return
  }

  isAssigning.value = true

  try {
    const target = projects.value.find((project) => project.id === currentProject.value?.id)

    if (target) {
      target.reviewers = selectedReviewers.value.map((reviewer) => ({
        userId: reviewer.userId,
        username: reviewer.username,
        name: reviewer.reviewerName,
      }))
    }

    ElMessage.success('评委分配成功。')
    closeReviewerDialog()
    await loadProjects({ force: true })
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '评委分配失败，请稍后重试。')
  } finally {
    isAssigning.value = false
  }
}

async function confirmBatchAssign() {
  if (isAssigning.value || isBatchAssigning.value) {
    return
  }

  if (!selectedBatchProjects.value.length) {
    ElMessage.warning('请先勾选项目。')
    return
  }

  if (!selectedBatchReviewers.value.length) {
    ElMessage.warning('请选择评委后再批量指定。')
    return
  }

  isBatchAssigning.value = true

  try {
    const targetIds = new Set(selectedBatchProjects.value.map((project) => project.id))

    projects.value = projects.value.map((project) => {
      if (!targetIds.has(project.id)) {
        return project
      }

      return {
        ...project,
        reviewers: selectedBatchReviewers.value.map((reviewer) => ({
          userId: reviewer.userId,
          username: reviewer.username,
          name: reviewer.reviewerName,
        })),
      }
    })

    ElMessage.success(`已为 ${targetIds.size} 个项目指定评委。`)
    assignmentTableRef.value?.clearSelection()
    selectedBatchProjects.value = []
    selectedBatchReviewers.value = []
    isBatchMode.value = false
    await loadProjects({ force: true })
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '批量指定评委失败，请稍后重试。')
  } finally {
    isBatchAssigning.value = false
  }
}

function changePage(page: number) {
  currentPage.value = page
}

function changeReviewerPage(page: number) {
  reviewerPage.value = page
  void loadReviewerPage(page)
}

function changeBatchSelection(selection: AssignmentProject[]) {
  selectedBatchProjects.value = selection
}

function toggleBatchMode() {
  if (isBatchAssigning.value) {
    return
  }

  isBatchMode.value = !isBatchMode.value

  if (isBatchMode.value) {
    return
  }

  assignmentTableRef.value?.clearSelection()
  selectedBatchProjects.value = []
  selectedBatchReviewers.value = []
}

function resetFilters() {
  filters.keyword = ''
  filters.faculty = ''
  filters.subDirection = ''
  filters.submission = ''
}

watch(() => [filters.keyword, filters.faculty, filters.subDirection, filters.submission], () => {
  currentPage.value = 1
})

watch(reviewerKeyword, () => {
  if (!reviewerDialogVisible.value) {
    return
  }

  if (reviewerSearchTimer) {
    window.clearTimeout(reviewerSearchTimer)
  }

  reviewerSearchTimer = window.setTimeout(() => {
    reviewerPage.value = 1
    void loadReviewerPage(1)
  }, 300)
})

function getProjectCode(project: AssignmentProject) {
  return project.projectCode || project.projectNo || '-'
}

function getProjectCategory(project: AssignmentProject) {
  return project.projectType || project.projectBatch || '-'
}

function getProjectFaculty(project: AssignmentProject) {
  return project.faculty || '-'
}

function getProjectSubDirection(project: AssignmentProject) {
  return project.subDirection?.split('-')[3] || '-'
}

function isProjectSubmitted(project: AssignmentProject) {
  return project.is_submmited_materials === 1
    || project.is_submmited_materials === true
    || String(project.is_submmited_materials) === '1'
}

function getReviewerDisplay(project: AssignmentProject) {
  if (project.reviewers?.length) {
    return project.reviewers
      .map((reviewer) => reviewer.name || reviewer.reviewerName || reviewer.username || `评委ID：${reviewer.userId}`)
      .join('、')
  }

  const reviewer = project.reviewer
  const reviewerLabel =
    reviewer?.reviewerName ??
    project.reviewerName ??
    reviewer?.username ??
    project.reviewerUsername ??
    project.assignedReviewerUsername ??
    ''
  const reviewerUserId = project.reviewerUserId

  if (reviewerLabel) {
    return reviewerLabel
  }

  if (reviewerUserId) {
    return `评委ID：${reviewerUserId}`
  }

  return '暂未分配'
}

function hasAssignedReviewer(project: AssignmentProject | null) {
  return project ? getReviewerDisplay(project) !== '暂未分配' : false
}

function getAssignedReviewersFromProject(project: AssignmentProject) {
  if (project.reviewers?.length) {
    return project.reviewers.map((reviewer) => ({
      userId: Number(reviewer.userId),
      username: reviewer.username ?? '',
      reviewerName: reviewer.name ?? reviewer.reviewerName ?? reviewer.username ?? `评委ID：${reviewer.userId}`,
    }))
  }

  if (project.reviewer) {
    return [project.reviewer]
  }

  if (project.reviewerUserId) {
    const matchedReviewer = reviewerList.value.find(
      (item) => String(item.userId) === String(project.reviewerUserId),
    )

    return [matchedReviewer ?? {
      userId: Number(project.reviewerUserId),
      username: project.reviewerUsername ?? project.assignedReviewerUsername ?? '',
      reviewerName: project.reviewerName ?? `评委ID：${project.reviewerUserId}`,
    }]
  }

  return []
}

function getReviewerCardName(reviewer: ReviewerItem) {
  return reviewer.username 
}

function getReviewerCardMeta() {
  return '评委'
}

function getSelectedReviewerUserIds(reviewers: ReviewerItem[]) {
  return reviewers
    .map((reviewer) => Number(reviewer.userId))
    .filter((userId) => Number.isInteger(userId) && userId > 0)
}

function isReviewerSelected(reviewer: ReviewerItem) {
  return selectedReviewers.value.some((item) => item.userId === reviewer.userId)
}

function selectReviewer(reviewer: ReviewerItem) {
  if (isReviewerSelected(reviewer)) {
    selectedReviewers.value = selectedReviewers.value.filter((item) => item.userId !== reviewer.userId)
    return
  }

  selectedReviewers.value = [...selectedReviewers.value, reviewer]
}

function syncSelectedReviewerFromPage() {
  if (!selectedReviewers.value.length) {
    return
  }

  selectedReviewers.value = selectedReviewers.value.map(
    (selectedReviewer) =>
      reviewerList.value.find((item) => item.userId === selectedReviewer.userId) ?? selectedReviewer,
  )
}
</script>

<template>
  <section class="attribute-page" aria-label="项目评委分配">
    <header class="attribute-header">
      <div>
        <p class="page-kicker">Reviewer Assignment</p>
        <h1>{{ props.panelTitle ?? '指定子方向与评委' }}</h1>
      </div>

      <el-button :icon="RefreshLeft" :loading="isProjectLoading" @click="loadProjects({ force: true })">
        刷新项目
      </el-button>
    </header>

    <section class="batch-bar" aria-label="批量指定评委">
      <el-button
        class="batch-toggle-button"
        :type="isBatchMode ? 'danger' : 'primary'"
        :icon="UserFilled"
        :disabled="isBatchAssigning"
        @click="toggleBatchMode"
      >
        {{ isBatchMode ? '退出批量指定' : '批量指定评委' }}
      </el-button>
      <el-button
        class="batch-group-button"
        :icon="UserFilled"
        @click="openGroupDialog"
      >
        指定评委组
      </el-button>
      <el-tag
        class="batch-count"
        :class="{ 'batch-control-hidden': !isBatchMode }"
        type="info"
        effect="light"
      >
        已选 {{ selectedBatchCount }} 项
      </el-tag>
      <el-button
        class="batch-reviewer-picker"
        :class="{ 'batch-control-hidden': !isBatchMode }"
        :disabled="isBatchAssigning"
        @click="openBatchReviewerDialog"
      >
        {{ selectedBatchReviewers.length ? `已选 ${selectedBatchReviewers.length} 位评委` : '选择评委' }}
      </el-button>
      <el-button
        class="batch-confirm-button"
        :class="{ 'batch-control-hidden': !isBatchMode }"
        type="primary"
        :icon="UserFilled"
        :loading="isBatchAssigning"
        :disabled="!selectedBatchCount || !selectedBatchReviewers.length"
        @click="confirmBatchAssign"
      >
        确认指定
      </el-button>
    </section>

    <section class="filter-bar" aria-label="项目筛选">
      <el-input
        v-model="filters.keyword"
        class="keyword-input"
        clearable
        placeholder="搜索项目编号、名称、负责人或评委"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select
        v-model="filters.faculty"
        class="filter-select"
        clearable
        placeholder="按照学部筛选"
      >
        <el-option
          v-for="faculty in facultyOptions"
          :key="faculty"
          :label="faculty"
          :value="faculty"
        />
      </el-select>
      <el-select
        v-model="filters.subDirection"
        class="filter-select"
        clearable
        placeholder="按照子方向筛选"
      >
        <el-option
          v-for="subDirection in subDirectionOptions"
          :key="subDirection"
          :label="subDirection"
          :value="subDirection"
        />
      </el-select>
      <el-select
        v-model="filters.submission"
        class="filter-select"
        clearable
        placeholder="按照是否提交筛选"
      >
        <el-option label="已提交" value="submitted" />
        <el-option label="未提交" value="unsubmitted" />
      </el-select>
      <el-button :icon="RefreshLeft" @click="resetFilters">重置</el-button>
    </section>

    <el-alert
      v-if="projectLoadError"
      :title="projectLoadError"
      type="error"
      show-icon
      :closable="false"
    >
      <template #default>
        <el-button type="primary" link @click="loadProjects({ force: true })">重新加载</el-button>
      </template>
    </el-alert>

    <section class="table-card">
      <el-table
        ref="assignmentTableRef"
        v-loading="isProjectLoading"
        :data="paginatedProjects"
        class="assignment-table"
        :class="{ 'assignment-table-batch-mode': isBatchMode }"
        empty-text="暂无项目"
        row-key="id"
        @selection-change="changeBatchSelection"
      >
        <el-table-column
          type="selection"
          width="48"
          fixed="left"
          reserve-selection
        />
        <el-table-column label="项目编号" min-width="130">
          <template #default="{ row }">
            <el-tag effect="plain">{{ getProjectCode(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="项目名称" min-width="220" show-overflow-tooltip />
        <el-table-column label="项目类型/批次" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ getProjectCategory(row) }}</template>
        </el-table-column>
        <el-table-column label="学部" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ getProjectFaculty(row) }}</template>
        </el-table-column>
        <el-table-column label="子方向" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ getProjectSubDirection(row) }}</template>
        </el-table-column>
        <el-table-column prop="projectLeader" label="项目负责人" width="130" />
        <el-table-column label="是否提交PPT" width="120">
          <template #default="{ row }">
            <el-tag :type="isProjectSubmitted(row) ? 'success' : 'info'" effect="light">
              {{ isProjectSubmitted(row) ? '已提交' : '未提交' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前评委" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="{ 'unassigned-text': !hasAssignedReviewer(row) }">
              {{ getReviewerDisplay(row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="132" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="UserFilled" @click="openAssignDialog(row)">
              {{ hasAssignedReviewer(row) ? '更换评委' : '分配评委' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <footer v-if="filteredTotal > pageSize" class="pagination-bar">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="filteredTotal"
        @current-change="changePage"
      />
    </footer>

    <el-dialog
      v-model="reviewerDialogVisible"
      class="reviewer-selector-dialog"
      width="900px"
      destroy-on-close
      :close-on-click-modal="!isAssigning"
      @closed="resetReviewerDialog"
    >
      <template #header>
        <section class="reviewer-dialog-header">
          <h2>选择评委</h2>
          <p v-if="reviewerDialogMode === 'single' && currentProject">
            {{ reviewerDialogProjectLabel }}
          </p>
          <p v-else>批量指定评委</p>
        </section>
      </template>

      <section class="reviewer-dialog-content">
        <el-tabs v-model="reviewerDialogTab" class="reviewer-dialog-tabs">
          <el-tab-pane label="选择评委" name="individual">
        <section class="reviewer-search-row" aria-label="评委搜索">
          <el-input
            v-model="reviewerKeyword"
            class="reviewer-search-input"
            clearable
            placeholder="请输入评委姓名进行搜索"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <span class="reviewer-total">共 {{ reviewerTotal }} 位评委</span>
        </section>

        <el-alert
          v-if="reviewerLoadError"
          class="reviewer-error"
          :title="reviewerLoadError"
          type="error"
          show-icon
          :closable="false"
        >
          <template #default>
            <el-button type="primary" link @click="loadReviewerPage(reviewerPage)">重新加载</el-button>
          </template>
        </el-alert>

        <section v-loading="reviewerLoading" class="reviewer-list-shell">
          <div v-if="reviewerList.length" class="reviewer-grid">
            <button
              v-for="reviewer in reviewerList"
              :key="reviewer.userId"
              class="reviewer-card"
              :class="{ 'reviewer-card-selected': isReviewerSelected(reviewer) }"
              type="button"
              @click="selectReviewer(reviewer)"
            >
              <span class="reviewer-check">
                <el-icon><Check /></el-icon>
              </span>
              <el-avatar class="reviewer-avatar" :size="46" :src="reviewerAvatarUrl" />
              <span class="reviewer-card-info">
                <strong>{{ getReviewerCardName(reviewer) }}</strong>
                <span>{{ getReviewerCardMeta() }}</span>
              </span>
            </button>
          </div>

          <el-empty
            v-else-if="!reviewerLoading && !reviewerLoadError"
            :description="reviewerKeyword.trim() ? '暂无匹配评委' : '暂无评委'"
          />
        </section>

        <footer class="reviewer-dialog-pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="reviewerPage"
            :page-size="reviewerPageSize"
            :total="reviewerTotal"
            @current-change="changeReviewerPage"
          />
        </footer>
          </el-tab-pane>

          <el-tab-pane label="选择评委组" name="group">
            <section class="group-list-shell">
              <template v-if="reviewerGroups.length">
                <article
                  v-for="group in reviewerGroups"
                  :key="group.id"
                  class="reviewer-group-card"
                  :class="{ 'reviewer-group-card-selected': isGroupSelected(group) }"
                >
                  <div class="reviewer-group-main">
                    <header class="reviewer-group-head">
                      <strong>{{ group.name }}</strong>
                      <span>{{ group.members.length }} 位评委</span>
                    </header>
                    <p class="reviewer-group-members">{{ getReviewerGroupMemberNames(group) }}</p>
                  </div>
                  <div class="reviewer-group-actions">
                    <el-button type="primary" link @click="selectReviewerGroup(group)">选择</el-button>
                    <el-button type="danger" link @click="removeReviewerGroup(group.id)">删除</el-button>
                  </div>
                </article>
              </template>
              <el-empty v-else description="暂无自定义评委组，可点击“指定评委组”创建" />
            </section>
          </el-tab-pane>
        </el-tabs>
      </section>

      <template #footer>
        <section class="reviewer-dialog-footer">
          <span class="selected-reviewer-label">
            已选择
            <strong>{{ selectedReviewerName || '-' }}</strong>
          </span>
          <div class="reviewer-dialog-actions">
            <el-button :disabled="isAssigning" @click="closeReviewerDialog">取消</el-button>
            <el-button
              type="primary"
              :loading="isAssigning"
              :disabled="!selectedReviewers.length"
              @click="confirmReviewerDialog"
            >
              {{ reviewerDialogMode === 'batch' ? '确认选择' : '确认分配' }}
            </el-button>
          </div>
        </section>
      </template>
    </el-dialog>

    <el-dialog
      v-model="groupDialogVisible"
      class="reviewer-selector-dialog reviewer-group-dialog"
      width="900px"
      destroy-on-close
      :close-on-click-modal="false"
      @closed="resetGroupDialog"
    >
      <template #header>
        <section class="reviewer-dialog-header">
          <h2>指定评委组</h2>
          <p>选择多位评委组成自定义评委组</p>
        </section>
      </template>

      <section class="reviewer-dialog-content">
        <section class="reviewer-search-row" aria-label="评委搜索">
          <el-input
            v-model="reviewerKeyword"
            class="reviewer-search-input"
            clearable
            placeholder="请输入评委姓名进行搜索"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <span class="reviewer-total">已选 {{ groupSelectedReviewers.length }} 位评委</span>
        </section>

        <el-alert
          v-if="reviewerLoadError"
          class="reviewer-error"
          :title="reviewerLoadError"
          type="error"
          show-icon
          :closable="false"
        >
          <template #default>
            <el-button type="primary" link @click="loadReviewerPage(reviewerPage)">重新加载</el-button>
          </template>
        </el-alert>

        <section v-loading="reviewerLoading" class="reviewer-list-shell">
          <div v-if="reviewerList.length" class="reviewer-grid">
            <button
              v-for="reviewer in reviewerList"
              :key="reviewer.userId"
              class="reviewer-card"
              :class="{ 'reviewer-card-selected': isGroupReviewerSelected(reviewer) }"
              type="button"
              @click="selectGroupReviewer(reviewer)"
            >
              <span class="reviewer-check">
                <el-icon><Check /></el-icon>
              </span>
              <el-avatar class="reviewer-avatar" :size="46" :src="reviewerAvatarUrl" />
              <span class="reviewer-card-info">
                <strong>{{ getReviewerCardName(reviewer) }}</strong>
                <span>{{ getReviewerCardMeta() }}</span>
              </span>
            </button>
          </div>

          <el-empty
            v-else-if="!reviewerLoading && !reviewerLoadError"
            :description="reviewerKeyword.trim() ? '暂无匹配评委' : '暂无评委'"
          />
        </section>

        <footer class="reviewer-dialog-pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :current-page="reviewerPage"
            :page-size="reviewerPageSize"
            :total="reviewerTotal"
            @current-change="changeReviewerPage"
          />
        </footer>
      </section>

      <template #footer>
        <section class="reviewer-dialog-footer">
          <span class="selected-reviewer-label">
            已选择
            <strong>{{ groupSelectedReviewers.map((reviewer) => getReviewerCardName(reviewer)).join('、') || '-' }}</strong>
          </span>
          <div class="reviewer-dialog-actions">
            <el-button @click="groupDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              :disabled="!groupSelectedReviewers.length"
              @click="confirmGroupSelection"
            >
              确认组成评委组
            </el-button>
          </div>
        </section>
      </template>
    </el-dialog>

    <el-dialog
      v-model="groupNameDialogVisible"
      class="reviewer-group-name-dialog"
      width="440px"
      destroy-on-close
      :close-on-click-modal="false"
      append-to-body
    >
      <template #header>
        <section class="reviewer-dialog-header">
          <h2>命名评委组</h2>
          <p>已选 {{ groupSelectedReviewers.length }} 位评委：{{ groupSelectedReviewers.map((reviewer) => getReviewerCardName(reviewer)).join('、') }}</p>
        </section>
      </template>

      <el-form label-width="90px" @submit.prevent>
        <el-form-item label="评委组名称">
          <el-input
            v-model="groupNameInput"
            placeholder="请输入评委组名称"
            maxlength="20"
            clearable
            @keyup.enter="confirmGroupName"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="groupNameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmGroupName">确定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.attribute-page {
  display: grid;
  gap: 16px;
  min-width: 0;
  color: #1d1d1f;
}

.attribute-header,
.batch-bar,
.filter-bar,
.table-card,
.pagination-bar {
  border: 1px solid #e3e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.attribute-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.page-kicker,
.attribute-header h1 {
  margin: 0;
}

.page-kicker {
  color: #409eff;
  font-size: 13px;
  font-weight: 760;
}

.attribute-header h1 {
  margin-top: 5px;
  font-size: 24px;
  line-height: 1.3;
  font-weight: 820;
  letter-spacing: 0;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  padding: 16px;
}

.batch-toggle-button {
  flex: 0 0 148px;
  width: 148px;
}

.batch-count {
  flex: 0 0 96px;
  width: 96px;
  justify-content: center;
}

.batch-reviewer-picker {
  flex: 0 0 100px;
  width: 220px;
  justify-content: center;
  overflow: hidden;
}

.batch-confirm-button {
  flex: 0 0 116px;
  width: 116px;
}

.batch-control-hidden {
  visibility: hidden;
  pointer-events: none;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px;
}

.keyword-input {
  width: min(360px, 100%);
}

.filter-select {
  width: 190px;
}

.filter-bar :deep(.el-button),
.batch-bar :deep(.el-button),
.attribute-header :deep(.el-button) {
  margin-left: 0;
  border-radius: 8px;
  font-weight: 720;
}

.table-card {
  padding: 12px;
}

.assignment-table {
  --el-table-border-color: #edf0f5;
  --el-table-header-bg-color: #f8fbff;
  border-radius: 8px;
  overflow: hidden;
}

.assignment-table:not(.assignment-table-batch-mode) :deep(.el-table-column--selection .cell) {
  visibility: hidden;
  pointer-events: none;
}

.unassigned-text {
  color: #909399;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 14px 16px;
}

.attribute-page :deep(.reviewer-selector-dialog) {
  max-width: calc(100vw - 52px);
  max-height: calc(100vh - 52px);
  margin-top: 26px;
  overflow: hidden;
  border-radius: 4px;
}

.attribute-page :deep(.reviewer-selector-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #edf0f5;
}

.attribute-page :deep(.reviewer-selector-dialog .el-dialog__body) {
  max-height: calc(100vh - 150px);
  overflow: auto;
  padding: 0;
}

.attribute-page :deep(.reviewer-selector-dialog .el-dialog__footer) {
  padding: 0;
}

.attribute-page :deep(.reviewer-selector-dialog .el-dialog__headerbtn) {
  top: 12px;
  right: 14px;
  width: 32px;
  height: 32px;
}

.reviewer-dialog-header {
  display: grid;
  gap: 8px;
  padding-right: 38px;
}

.reviewer-dialog-header h2,
.reviewer-dialog-header p {
  margin: 0;
}

.reviewer-dialog-header h2 {
  color: #1f2933;
  font-size: 16px;
  line-height: 1.3;
  font-weight: 760;
}

.reviewer-dialog-header p {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}

.reviewer-dialog-content {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 14px 16px 0;
}

.reviewer-search-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
}

.reviewer-search-input {
  width: 336px;
  max-width: 100%;
}

.reviewer-search-input :deep(.el-input__wrapper) {
  height: 36px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #dfe4ec inset;
}

.reviewer-total {
  color: #909399;
  font-size: 13px;
  white-space: nowrap;
}

.reviewer-error {
  margin: 0;
}

.reviewer-list-shell {
  min-height: 348px;
}

.reviewer-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.reviewer-card {
  position: relative;
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  min-height: 80px;
  padding: 12px 34px 12px 16px;
  border: 1px solid #dfe4ec;
  border-radius: 4px;
  color: #303133;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: border-color 160ms ease, background 160ms ease;
}

.reviewer-card:hover {
  border-color: #a9d3ff;
}

.reviewer-card-selected {
  border: 2px solid #409eff;
  background: #f5faff;
  padding: 11px 33px 11px 15px;
}

.reviewer-card-info {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.reviewer-card-info strong {
  max-width: 100%;
  overflow: hidden;
  color: #303133;
  font-size: 14px;
  font-weight: 760;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reviewer-card-info span {
  max-width: 100%;
  overflow: hidden;
  color: #909399;
  font-size: 12px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reviewer-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  object-fit: cover;
}

.reviewer-check {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border: 1px solid #dfe4ec;
  border-radius: 50%;
  color: transparent;
  background: #ffffff;
  font-size: 11px;
}

.reviewer-card-selected .reviewer-check {
  border-color: #409eff;
  color: #ffffff;
  background: #409eff;
}

.reviewer-dialog-pagination {
  display: flex;
  justify-content: center;
  padding: 2px 0 14px;
}

.reviewer-dialog-pagination :deep(.el-pagination) {
  --el-pagination-button-width: 28px;
  --el-pagination-button-height: 28px;
}

.reviewer-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 12px 16px;
  border-top: 1px solid #edf0f5;
  background: #fafbfc;
}

.selected-reviewer-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #909399;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-reviewer-label strong {
  margin-left: 8px;
  color: #409eff;
}

.reviewer-dialog-actions {
  display: inline-flex;
  gap: 12px;
}

.reviewer-dialog-actions :deep(.el-button) {
  min-width: 78px;
  border-radius: 4px;
}

@media (max-width: 900px) {
  .reviewer-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .attribute-header,
  .filter-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .batch-bar {
    flex-wrap: wrap;
    overflow: visible;
  }

  .keyword-input,
  .filter-select,
  .batch-toggle-button,
  .batch-count,
  .batch-confirm-button,
  .batch-reviewer-picker,
  .filter-bar :deep(.el-button),
  .batch-bar :deep(.el-button),
  .attribute-header :deep(.el-button) {
    width: 100%;
  }

  .reviewer-search-row,
  .reviewer-dialog-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .reviewer-search-input,
  .reviewer-dialog-actions,
  .reviewer-dialog-actions :deep(.el-button) {
    width: 100%;
  }

  .reviewer-grid {
    grid-template-columns: 1fr;
  }
}
.batch-group-button {
  flex: 0 0 116px;
  width: 116px;
}

.reviewer-dialog-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.reviewer-dialog-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.group-list-shell {
  display: grid;
  gap: 12px;
  min-height: 320px;
  align-content: start;
  padding-bottom: 6px;
}

.reviewer-group-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid #e3e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.reviewer-group-card-selected {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff inset;
}

.reviewer-group-main {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.reviewer-group-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reviewer-group-head strong {
  color: #1f2933;
  font-size: 14px;
  font-weight: 760;
}

.reviewer-group-head span {
  color: #909399;
  font-size: 12px;
}

.reviewer-group-members {
  margin: 0;
  color: #57606f;
  font-size: 12px;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reviewer-group-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
}
</style>
