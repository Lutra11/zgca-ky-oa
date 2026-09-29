<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Delete, Download, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ReviewLaunchConfigDialog from './ReviewLaunchConfigDialog.vue'
import projectDataset from '../../dataset/projects.json'
import {
  createReviewConfigDraftFromBase,
  generateReviewId,
  normalizeSelectedProject,
} from './review-config/reviewConfigStorage'

interface ProjectItem {
  id: string
  index: number
  projectCode: string
  projectType: string
  faculty: string
  subDirection: string
  subDirectionLeader: string
  batch: string
  projectName: string
  principal: string
}

interface ProjectFilters {
  batch: string
  facultyDirection: string
  projectType: string
  keyword: string
  subDirectionLeader: string
  principal: string
}

interface ReviewLaunchConfigPayload {
  reviewName: string
  reviewPeriod: [string, string]
  performanceReviewPeriod: [string, string]
  reviewTemplateId: string
  noticeTemplateId: string
}

const router = useRouter()
const route = useRoute()
const projects = projectDataset as ProjectItem[]

const draftFilters = reactive<ProjectFilters>({
  batch: '',
  facultyDirection: '',
  projectType: '',
  keyword: '',
  subDirectionLeader: '',
  principal: '',
})

const appliedFilters = reactive<ProjectFilters>({
  batch: '',
  facultyDirection: '',
  projectType: '',
  keyword: '',
  subDirectionLeader: '',
  principal: '',
})

const selectedProjectIds = shallowRef<string[]>(projects[0] ? [projects[0].id] : [])
const previewProjectId = shallowRef(projects[0]?.id ?? '')
const isExpanded = shallowRef(false)
const isLaunchConfigVisible = shallowRef(false)

const batchOptions = computed(() => unique(projects.map((project) => project.batch)))

const projectTypeOptions = computed(() => unique(projects.map((project) => project.projectType)))

const facultyDirectionOptions = computed(() =>
  unique(projects.map((project) => `${project.faculty}/${project.subDirection}`)),
)

const leaderOptions = computed(() => unique(projects.map((project) => project.subDirectionLeader)))

const principalOptions = computed(() => unique(projects.map((project) => project.principal)))

const filteredProjects = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return projects.filter((project) => {
    const matchesBatch = appliedFilters.batch ? project.batch === appliedFilters.batch : true
    const matchesProjectType = appliedFilters.projectType
      ? project.projectType === appliedFilters.projectType
      : true
    const matchesFacultyDirection = appliedFilters.facultyDirection
      ? `${project.faculty}/${project.subDirection}` === appliedFilters.facultyDirection
      : true
    const matchesLeader = appliedFilters.subDirectionLeader
      ? project.subDirectionLeader === appliedFilters.subDirectionLeader
      : true
    const matchesPrincipal = appliedFilters.principal
      ? project.principal === appliedFilters.principal
      : true
    const matchesKeyword = keyword
      ? [project.projectName, project.projectCode, project.principal, project.subDirectionLeader]
          .some((value) => value.toLowerCase().includes(keyword))
      : true

    return (
      matchesBatch &&
      matchesProjectType &&
      matchesFacultyDirection &&
      matchesLeader &&
      matchesPrincipal &&
      matchesKeyword
    )
  })
})

const selectedProjects = computed(() =>
  projects.filter((project) => selectedProjectIds.value.includes(project.id)),
)

const selectedProjectIdSet = computed(() => new Set(selectedProjectIds.value))

const previewProject = computed(
  () =>
    projects.find((project) => project.id === previewProjectId.value) ??
    selectedProjects.value[0] ??
    filteredProjects.value[0],
)

const isAllFilteredSelected = computed(
  () =>
    filteredProjects.value.length > 0 &&
    filteredProjects.value.every((project) => selectedProjectIdSet.value.has(project.id)),
)

const isPartiallySelected = computed(() => {
  const selectedCount = filteredProjects.value.filter((project) =>
    selectedProjectIdSet.value.has(project.id),
  ).length

  return selectedCount > 0 && selectedCount < filteredProjects.value.length
})

function applyFilters() {
  appliedFilters.batch = draftFilters.batch
  appliedFilters.facultyDirection = draftFilters.facultyDirection
  appliedFilters.projectType = draftFilters.projectType
  appliedFilters.keyword = draftFilters.keyword
  appliedFilters.subDirectionLeader = draftFilters.subDirectionLeader
  appliedFilters.principal = draftFilters.principal
  ensureDefaultSelection()
}

function resetFilters() {
  draftFilters.batch = ''
  draftFilters.facultyDirection = ''
  draftFilters.projectType = ''
  draftFilters.keyword = ''
  draftFilters.subDirectionLeader = ''
  draftFilters.principal = ''
  applyFilters()
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function toggleProject(projectId: string, checked: boolean) {
  const nextSelectedIds = new Set(selectedProjectIds.value)

  if (checked) {
    nextSelectedIds.add(projectId)
    previewProjectId.value = projectId
  } else {
    nextSelectedIds.delete(projectId)
  }

  selectedProjectIds.value = Array.from(nextSelectedIds)

  if (!checked && previewProjectId.value === projectId) {
    previewProjectId.value = selectedProjectIds.value[0] ?? filteredProjects.value[0]?.id ?? ''
  }
}

function toggleAllFiltered(checked: boolean) {
  const nextSelectedIds = new Set(selectedProjectIds.value)

  filteredProjects.value.forEach((project) => {
    if (checked) {
      nextSelectedIds.add(project.id)
    } else {
      nextSelectedIds.delete(project.id)
    }
  })

  selectedProjectIds.value = Array.from(nextSelectedIds)
  previewProjectId.value = checked
    ? filteredProjects.value[0]?.id ?? ''
    : selectedProjectIds.value[0] ?? filteredProjects.value[0]?.id ?? ''
}

function clearSelection() {
  selectedProjectIds.value = []
  previewProjectId.value = filteredProjects.value[0]?.id ?? ''
}

function exportList() {
  ElMessage.success('项目列表已导出（原型模拟）')
}

function launchReview() {
  if (!selectedProjects.value.length) {
    ElMessage.warning('请先选择参评项目')
    return
  }

  isLaunchConfigVisible.value = true
}

function handleReviewConfigured(payload: ReviewLaunchConfigPayload) {
  const reviewId = generateReviewId()

  createReviewConfigDraftFromBase({
    reviewId,
    reviewName: payload.reviewName,
    reviewPeriod: payload.reviewPeriod,
    performanceReviewPeriod: payload.performanceReviewPeriod,
    reviewTemplateId: payload.reviewTemplateId,
    noticeTemplateId: payload.noticeTemplateId,
    selectedProjects: selectedProjects.value.map(normalizeSelectedProject),
  })

  ElMessage.success(`${payload.reviewName} 已生成详情配置草稿`)
  const dataMaintenancePath = route.path.replace(/\/review-launch\/?$/, '/review-data-maintenance')
  router.push(`${dataMaintenancePath}/${reviewId}/config-detail`)
}

function goBack() {
  router.back()
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean)
}

function ensureDefaultSelection() {
  const firstFilteredProject = filteredProjects.value[0]

  if (!firstFilteredProject) {
    selectedProjectIds.value = []
    previewProjectId.value = ''
    return
  }

  const selectedVisibleProject = filteredProjects.value.find((project) =>
    selectedProjectIdSet.value.has(project.id),
  )

  if (!selectedVisibleProject) {
    selectedProjectIds.value = [firstFilteredProject.id]
    previewProjectId.value = firstFilteredProject.id
    return
  }

  if (!filteredProjects.value.some((project) => project.id === previewProjectId.value)) {
    previewProjectId.value = selectedVisibleProject.id
  }
}
</script>

<template>
  <section class="review-launch" aria-label="发起评审">
    <div class="review-workbench">
      <header class="review-heading">
        <div>
          <!-- <h3 class="review-title">发起评审</h3> -->
          <!-- <p class="review-summary">选择参评项目并创建评审流程</p> -->
        </div>
      </header>

      <section class="filter-panel" aria-label="项目筛选">
        <label class="filter-field">
          <span>项目批次</span>
          <el-select v-model="draftFilters.batch" placeholder="全部批次" clearable>
            <el-option
              v-for="batch in batchOptions"
              :key="batch"
              :label="batch"
              :value="batch"
            />
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
          <span>项目类型</span>
          <el-select v-model="draftFilters.projectType" placeholder="全部" clearable>
            <el-option
              v-for="type in projectTypeOptions"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </label>

        <label class="filter-field search-field">
          <span>搜索</span>
          <el-input
            v-model="draftFilters.keyword"
            :prefix-icon="Search"
            placeholder="请输入项目名称/项目编号/负责人"
            clearable
          />
        </label>

        <Transition name="filter-expand">
          <div v-if="isExpanded" class="expanded-filters">
            <label class="filter-field">
              <span>子方向负责人</span>
              <el-select v-model="draftFilters.subDirectionLeader" placeholder="全部" clearable>
                <el-option
                  v-for="leader in leaderOptions"
                  :key="leader"
                  :label="leader"
                  :value="leader"
                />
              </el-select>
            </label>

            <label class="filter-field">
              <span>项目负责人</span>
              <el-select v-model="draftFilters.principal" placeholder="全部" clearable>
                <el-option
                  v-for="principal in principalOptions"
                  :key="principal"
                  :label="principal"
                  :value="principal"
                />
              </el-select>
            </label>
          </div>
        </Transition>

        <div class="filter-actions">
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <button class="expand-button" type="button" @click="toggleExpanded">
            {{ isExpanded ? '收起' : '展开' }}
            <span :class="{ 'expand-icon-open': isExpanded }">⌄</span>
          </button>
        </div>
      </section>

      <section class="project-panel" aria-label="参评项目列表">
        <div class="project-toolbar">
          <strong>
            已选择
            <span>{{ selectedProjects.length }}</span>
            项
          </strong>
          <div class="project-toolbar-actions">
            <el-button :icon="Delete" @click="clearSelection">清空选择</el-button>
            <el-button :icon="Download" @click="exportList">导出列表</el-button>
          </div>
        </div>

        <div class="project-table-wrap">
          <table class="project-table">
            <thead>
              <tr>
                <th class="selection-cell">
                  <el-checkbox
                    :model-value="isAllFilteredSelected"
                    :indeterminate="isPartiallySelected"
                    @change="toggleAllFiltered"
                  />
                </th>
                <th>编号</th>
                <th>项目编号</th>
                <th>项目类型</th>
                <th>所属学部</th>
                <th>所属子方向</th>
                <th>子方向负责人</th>
                <th>项目批次</th>
                <th>项目名称</th>
                <th>项目负责人</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="project in filteredProjects"
                :key="project.id"
                :class="{ 'project-row-selected': selectedProjectIdSet.has(project.id) }"
                @click="toggleProject(project.id, !selectedProjectIdSet.has(project.id))"
              >
                <td class="selection-cell" @click.stop>
                  <el-checkbox
                    :model-value="selectedProjectIdSet.has(project.id)"
                    @change="(checked: boolean) => toggleProject(project.id, checked)"
                  />
                </td>
                <td>{{ project.index }}</td>
                <td>{{ project.projectCode }}</td>
                <td>{{ project.projectType }}</td>
                <td>{{ project.faculty }}</td>
                <td>{{ project.subDirection }}</td>
                <td>{{ project.subDirectionLeader }}</td>
                <td>{{ project.batch }}</td>
                <td class="project-name">{{ project.projectName }}</td>
                <td>{{ project.principal }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="filteredProjects.length === 0" class="empty-text">暂无符合条件的参评项目。</p>
      </section>

      <footer class="launch-footer">
        <div class="selection-summary">
          <span class="summary-icon">i</span>
          当前已选择
          <strong>{{ selectedProjects.length }}</strong>
          个参评项目
        </div>

        <div class="launch-actions">
          <el-button @click="goBack">返回</el-button>
          <el-button type="primary" @click="launchReview">发起评审</el-button>
        </div>
      </footer>
    </div>

    <aside v-if="previewProject" class="project-preview" aria-label="项目预览">
      <div class="project-preview-header">
        <h3 class="panel-title">项目预览</h3>
        <span class="preview-tag">{{ previewProject.projectType }}</span>
      </div>

      <div class="project-preview-identity">
        <div class="project-card-icon">
          <img style="width: 100%;" src="../../dataset/img/project.png" alt="">
        </div>
        <div>
          <strong>{{ previewProject.projectName }}</strong>
          <p>{{ previewProject.projectCode }} · {{ previewProject.batch }}</p>
        </div>
      </div>

      <div class="project-preview-section">
        <h4>项目信息</h4>
        <dl class="project-info-list">
          <div>
            <dt>所属学部</dt>
            <dd>{{ previewProject.faculty }}</dd>
          </div>
          <div>
            <dt>所属子方向</dt>
            <dd>{{ previewProject.subDirection }}</dd>
          </div>
          <div>
            <dt>子方向负责人</dt>
            <dd>{{ previewProject.subDirectionLeader }}</dd>
          </div>
          <div>
            <dt>项目负责人</dt>
            <dd>{{ previewProject.principal }}</dd>
          </div>
          <div>
            <dt>列表编号</dt>
            <dd>{{ previewProject.index }}</dd>
          </div>
        </dl>
      </div>

      <div class="project-preview-section">
        <h4>评审准备</h4>
        <p class="preview-text">
          当前项目将作为参评项目进入评审流程，后续可继续配置评审模板、评委分配与流程节点。
        </p>
      </div>

      <div class="preview-summary-card">
        <span>当前已选择</span>
        <strong>{{ selectedProjects.length }}</strong>
        <span>个参评项目</span>
      </div>

      <!-- <el-button class="preview-action" type="primary" plain @click="launchReview">
        发起评审
      </el-button> -->
    </aside>

    <ReviewLaunchConfigDialog
      v-model="isLaunchConfigVisible"
      :selected-count="selectedProjects.length"
      @confirm="handleReviewConfigured"
    />
  </section>
</template>

<style scoped>
.review-launch {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
  padding-bottom: 0;
}

.review-workbench {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.review-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.review-title,
.review-summary,
.empty-text {
  margin: 0;
}

.review-title {
  color: #1d1d1f;
  font-size: 32px;
  font-weight: 780;
  letter-spacing: 0;
}

.review-summary {
  margin-top: 8px;
  color: #6e6e73;
  font-size: 15px;
}

.filter-panel,
.project-panel,
.project-preview,
.launch-footer {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.filter-panel {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(190px, 1fr) minmax(170px, 1fr) minmax(260px, 1.8fr) auto;
  gap: 16px;
  align-items: end;
  padding: 20px;
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
  min-height: 44px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(29, 29, 31, 0.08);
}

.expanded-filters {
  grid-column: 1 / 4;
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 16px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-actions :deep(.el-button) {
  min-width: 82px;
  height: 44px;
  border-radius: 8px;
  font-weight: 760;
}

.expand-button {
  height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  color: #0071e3;
  background: transparent;
  cursor: pointer;
  font-weight: 760;
}

.expand-button span {
  display: inline-block;
  transition: transform 0.2s ease;
}

.expand-icon-open {
  transform: rotate(180deg);
}

.filter-expand-enter-active,
.filter-expand-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.project-panel {
  overflow: hidden;
}

.project-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px 14px;
}

.project-toolbar strong {
  color: #1d1d1f;
  font-size: 18px;
}

.project-toolbar strong span {
  margin: 0 5px;
  color: #0071e3;
  font-size: 24px;
}

.project-toolbar-actions {
  display: flex;
  gap: 10px;
}

.project-toolbar-actions :deep(.el-button) {
  height: 40px;
  border-radius: 8px;
  font-weight: 760;
}

.project-table-wrap {
  max-height: 548px;
  overflow: auto;
  padding: 0 16px 16px;
}

.project-table {
  width: 100%;
  min-width: 1260px;
  border-collapse: separate;
  border-spacing: 0;
}

.project-table th,
.project-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
  color: #424245;
  text-align: left;
  white-space: nowrap;
  font-size: 14px;
}

.project-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  color: #1d1d1f;
  background: #f8fbff;
  font-weight: 780;
}

.project-table tbody tr {
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.project-table tbody tr:hover,
.project-row-selected {
  background: #eef6ff;
}

.selection-cell {
  width: 54px;
  text-align: center;
}

.project-name {
  min-width: 340px;
  color: #1d1d1f;
  font-weight: 700;
}

.empty-text {
  padding: 26px 18px;
  color: #6e6e73;
  text-align: center;
}

.project-preview {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 20px;
  padding: 20px;
}

.project-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  margin: 0;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 800;
}

.preview-tag {
  flex: none;
  border-radius: 999px;
  padding: 4px 10px;
  color: #0071e3;
  background: #e8f3ff;
  font-size: 12px;
  font-weight: 760;
}

.project-preview-identity {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}

.project-card-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #ffffff;
  /* background: linear-gradient(145deg, #0a84ff, #006edb); */
  /* box-shadow: 0 12px 22px rgba(0, 113, 227, 0.2); */
  font-size: 15px;
  font-weight: 800;
}

.project-preview-identity strong {
  display: block;
  color: #1d1d1f;
  font-size: 16px;
  line-height: 1.45;
}

.project-preview-identity p {
  margin: 6px 0 0;
  color: #86868b;
  font-size: 13px;
}

.project-preview-section {
  display: grid;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(29, 29, 31, 0.08);
}

.project-preview-section h4 {
  margin: 0;
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 800;
}

.project-info-list {
  display: grid;
  gap: 12px;
  margin: 0;
}

.project-info-list div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
}

.project-info-list dt {
  color: #86868b;
  font-size: 13px;
}

.project-info-list dd {
  margin: 0;
  color: #424245;
  font-size: 13px;
  font-weight: 720;
}

.preview-text {
  margin: 0;
  color: #6e6e73;
  font-size: 13px;
  line-height: 1.8;
}

.preview-summary-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: 8px;
  border-radius: 8px;
  padding: 14px 16px;
  color: #6e6e73;
  background: #f5f9ff;
  font-size: 13px;
}

.preview-summary-card strong {
  color: #0071e3;
  font-size: 28px;
  line-height: 1;
  text-align: center;
}

.preview-action {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-weight: 800;
}

.launch-footer {
  position: sticky;
  bottom: 18px;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 24px;
  background: rgba(255, 255, 255, 0.94);
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #424245;
  font-size: 15px;
  font-weight: 700;
}

.selection-summary strong {
  color: #0071e3;
  font-size: 22px;
}

.summary-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #0071e3;
  background: #e8f3ff;
  font-weight: 800;
}

.launch-actions {
  display: flex;
  gap: 14px;
}

.launch-actions :deep(.el-button) {
  min-width: 148px;
  height: 46px;
  border-radius: 8px;
  font-weight: 780;
}

@media (max-width: 1240px) {
  .review-launch {
    grid-template-columns: 1fr;
  }

  .project-preview {
    position: static;
  }

  .filter-panel {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }

  .search-field,
  .expanded-filters,
  .filter-actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .filter-panel,
  .expanded-filters {
    grid-template-columns: 1fr;
  }

  .project-toolbar,
  .launch-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .launch-actions {
    width: 100%;
  }

  .launch-actions :deep(.el-button) {
    flex: 1;
    min-width: 0;
  }
}
</style>
