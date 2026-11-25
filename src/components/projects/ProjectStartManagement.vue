<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type TableInstance } from 'element-plus'
import { Finished, Refresh, Search, View } from '@element-plus/icons-vue'
import {
  projectLedgerRows,
  type LedgerValue,
  type ProjectLedgerProject,
} from '../../dataset/projectLedgerMock'

type StartStatus = 'PENDING' | 'STARTED' | 'DISABLED'
type StartStatusFilter = 'ALL' | StartStatus

interface StartRecord {
  startedAt: string
  operator: string
}

const STORAGE_KEY = 'zgca_ky_oa_project_start_records_v1'

const router = useRouter()
const tableRef = shallowRef<TableInstance>()
const projects = shallowRef<ProjectLedgerProject[]>(projectLedgerRows.map((project) => ({ ...project })))
const keyword = shallowRef('')
const selectedProjectType = shallowRef('')
const selectedDepartment = shallowRef('')
const startStatusFilter = shallowRef<StartStatusFilter>('ALL')
const page = shallowRef(1)
const pageSize = shallowRef(12)
const selectedProjects = shallowRef<ProjectLedgerProject[]>([])
const startDialogVisible = shallowRef(false)
const starting = shallowRef(false)
const pendingStartProjects = shallowRef<ProjectLedgerProject[]>([])
const startRecords = shallowRef<Record<string, StartRecord>>(loadStartRecords())

const statusMeta: Record<StartStatus, { label: string; type: 'primary' | 'success' | 'info'; hint: string }> = {
  PENDING: {
    label: '待启动',
    type: 'primary',
    hint: '可执行启动',
  },
  STARTED: {
    label: '已启动',
    type: 'success',
    hint: '已生成启动记录',
  },
  DISABLED: {
    label: '不可启动',
    type: 'info',
    hint: '项目状态不满足启动条件',
  },
}

const filterForm = reactive({
  keyword: '',
  projectType: '',
  department: '',
  startStatus: 'ALL' as StartStatusFilter,
})

const projectTypeOptions = computed(() => uniqueValues('projectType'))
const departmentOptions = computed(() => uniqueValues('department'))

const filteredProjects = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return projects.value.filter((project) => {
    const keywordMatched =
      !normalizedKeyword ||
      [project.code, project.name, project.leader, project.department, project.projectType, project.subDirection]
        .map((item) => text(item).toLowerCase())
        .some((item) => item.includes(normalizedKeyword))
    const typeMatched = !selectedProjectType.value || text(project.projectType) === selectedProjectType.value
    const departmentMatched = !selectedDepartment.value || text(project.department) === selectedDepartment.value
    const statusMatched =
      startStatusFilter.value === 'ALL' || getStartStatus(project) === startStatusFilter.value

    return keywordMatched && typeMatched && departmentMatched && statusMatched
  })
})

const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const selectedStartableProjects = computed(() => selectedProjects.value.filter(canStartProject))

watch([keyword, selectedProjectType, selectedDepartment, startStatusFilter], () => {
  page.value = 1
})

function text(value: LedgerValue | number | undefined) {
  return value === null || value === undefined || value === '' ? '' : String(value)
}

function shown(value: LedgerValue | number | undefined) {
  return text(value) || '--'
}

function getProjectKey(project?: ProjectLedgerProject | null) {
  if (!project) {
    return ''
  }

  return text(project.code) || text(project.instanceId) || text(project.name)
}

function uniqueValues(key: keyof Pick<ProjectLedgerProject, 'projectType' | 'department'>) {
  return Array.from(new Set(projects.value.map((project) => text(project[key])).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, 'zh-Hans-CN'),
  )
}

function isDisabledProject(project: ProjectLedgerProject) {
  const status = text(project.status)
  return ['终止', '已终止', '结题', '已结题'].includes(status)
}

function getStartStatus(project: ProjectLedgerProject): StartStatus {
  if (startRecords.value[getProjectKey(project)]) {
    return 'STARTED'
  }

  if (isDisabledProject(project)) {
    return 'DISABLED'
  }

  return 'PENDING'
}

function canStartProject(project: ProjectLedgerProject) {
  return getStartStatus(project) === 'PENDING'
}

function originalStatusTagType(status: LedgerValue) {
  if (text(status) === '在研') {
    return 'success'
  }
  if (['终止', '已终止'].includes(text(status))) {
    return 'danger'
  }
  return 'info'
}

function getStartTime(project: ProjectLedgerProject) {
  return startRecords.value[getProjectKey(project)]?.startedAt ?? '--'
}

function formatNow() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
    now.getMinutes(),
  )}`
}

function loadStartRecords(): Record<string, StartRecord> {
  if (typeof window === 'undefined') {
    return {}
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, StartRecord>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return {}
  }
}

function saveStartRecords(records: Record<string, StartRecord>) {
  startRecords.value = records
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function applyFilters() {
  keyword.value = filterForm.keyword
  selectedProjectType.value = filterForm.projectType
  selectedDepartment.value = filterForm.department
  startStatusFilter.value = filterForm.startStatus
}

function resetFilters() {
  filterForm.keyword = ''
  filterForm.projectType = ''
  filterForm.department = ''
  filterForm.startStatus = 'ALL'
  applyFilters()
}

function refreshData() {
  projects.value = projectLedgerRows.map((project) => ({ ...project }))
  clearSelection()
  ElMessage.success('项目库数据已刷新')
}

function handleSelectionChange(selection: ProjectLedgerProject[]) {
  selectedProjects.value = selection
}

function clearSelection() {
  selectedProjects.value = []
  tableRef.value?.clearSelection()
}

function isRowSelectable(project: ProjectLedgerProject) {
  return canStartProject(project)
}

function openBatchStart() {
  if (!selectedProjects.value.length) {
    ElMessage.warning('请先选择需要启动的项目')
    return
  }

  if (!selectedStartableProjects.value.length) {
    ElMessage.warning('当前选择的项目均不满足启动条件')
    return
  }

  pendingStartProjects.value = selectedStartableProjects.value
  startDialogVisible.value = true
}

function openSingleStart(project: ProjectLedgerProject) {
  if (!canStartProject(project)) {
    ElMessage.warning('该项目当前不满足启动条件')
    return
  }

  pendingStartProjects.value = [project]
  startDialogVisible.value = true
}

function confirmStart() {
  const records = { ...startRecords.value }
  const startedAt = formatNow()

  starting.value = true
  pendingStartProjects.value.forEach((project) => {
    records[getProjectKey(project)] = {
      startedAt,
      operator: 'PMO',
    }
  })
  saveStartRecords(records)
  starting.value = false
  startDialogVisible.value = false
  ElMessage.success(`已启动 ${pendingStartProjects.value.length} 个项目`)
  pendingStartProjects.value = []
  clearSelection()
}

function openDetail(project: ProjectLedgerProject) {
  router.push({
    name: 'research-project-admin-project-library-detail',
    params: {
      projectId: getProjectKey(project),
    },
  })
}
</script>

<template>
  <section class="project-start-page" aria-label="项目启动">
    <section class="start-list-card">
      <header class="start-list-head">
        <div>
          <h3>项目启动列表</h3>
          <p>
            共 {{ filteredProjects.length }} 个项目
            <span v-if="selectedProjects.length">，已选 {{ selectedProjects.length }} 项</span>
          </p>
        </div>
        <div class="head-actions">
          <el-button plain :icon="Refresh" @click="refreshData">刷新</el-button>
          <el-button type="primary" :icon="Finished" :disabled="!selectedStartableProjects.length" @click="openBatchStart">
            批量启动
          </el-button>
        </div>
      </header>

      <div class="start-filter-bar">
        <el-input
          v-model="filterForm.keyword"
          class="start-search"
          clearable
          :prefix-icon="Search"
          placeholder="搜索项目编号、项目名称、负责人或部门"
          @keyup.enter="applyFilters"
        />
        <el-select v-model="filterForm.projectType" clearable placeholder="全部项目类型">
          <el-option v-for="item in projectTypeOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="filterForm.department" clearable filterable placeholder="全部学部/部门">
          <el-option v-for="item in departmentOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="filterForm.startStatus" placeholder="全部启动状态">
          <el-option label="全部启动状态" value="ALL" />
          <el-option label="待启动" value="PENDING" />
          <el-option label="已启动" value="STARTED" />
          <el-option label="不可启动" value="DISABLED" />
        </el-select>
        <el-button type="primary" @click="applyFilters">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <div v-if="selectedProjects.length" class="selection-strip">
        <span>已选择 {{ selectedProjects.length }} 个项目，其中 {{ selectedStartableProjects.length }} 个可启动</span>
        <el-button link type="primary" @click="clearSelection">取消选择</el-button>
      </div>

      <el-table
        ref="tableRef"
        class="start-table"
        :data="pagedProjects"
        :row-key="getProjectKey"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="46" :selectable="isRowSelectable" reserve-selection fixed="left" />
        <el-table-column label="序号" width="64" fixed="left">
          <template #default="{ $index }">
            <span class="row-index">{{ (page - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="项目编号" width="132" fixed="left" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="project-code">{{ shown(row.code) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="项目名称" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="project-cell">
              <strong>{{ shown(row.name) }}</strong>
              <span>{{ shown(row.projectType) }} · {{ shown(row.subDirection) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="leader" label="项目负责人" width="170" show-overflow-tooltip>
          <template #default="{ row }">
            {{ shown(row.leader) }}
          </template>
        </el-table-column>
        <el-table-column prop="department" label="学部/部门" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ shown(row.department) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="项目状态" width="104">
          <template #default="{ row }">
            <el-tag :type="originalStatusTagType(row.status)" effect="light" round>
              {{ shown(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启动状态" width="116">
          <template #default="{ row }">
            <el-tooltip :content="statusMeta[getStartStatus(row)].hint" placement="top">
              <el-tag :type="statusMeta[getStartStatus(row)].type" effect="light" round>
                {{ statusMeta[getStartStatus(row)].label }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="启动时间" width="150">
          <template #default="{ row }">
            {{ getStartTime(row) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" :icon="View" @click="openDetail(row)">查看详情</el-button>
              <el-button link type="primary" :icon="Finished" :disabled="!canStartProject(row)" @click="openSingleStart(row)">
                启动
              </el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="没有找到符合条件的项目">
            <el-button type="primary" plain @click="resetFilters">重置筛选</el-button>
          </el-empty>
        </template>
      </el-table>

      <footer class="pagination-bar">
        <span>共 {{ filteredProjects.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[12, 20, 50]"
          :total="filteredProjects.length"
          background
          layout="total, sizes, prev, pager, next, jumper"
        />
      </footer>
    </section>

    <el-dialog v-model="startDialogVisible" title="确认启动项目" width="540px" destroy-on-close>
      <div class="start-confirm">
        <p>
          本次将启动
          <strong>{{ pendingStartProjects.length }}</strong>
          个项目。启动后该项目会进入“已启动”状态，并记录本次启动时间。
        </p>
        <div class="confirm-project-list">
          <div v-for="project in pendingStartProjects.slice(0, 6)" :key="getProjectKey(project)">
            <span>{{ shown(project.code) }}</span>
            <strong>{{ shown(project.name) }}</strong>
          </div>
          <p v-if="pendingStartProjects.length > 6" class="more-tip">还有 {{ pendingStartProjects.length - 6 }} 个项目未展示</p>
        </div>
        <el-alert
          title="当前为前端原型操作，暂只更新本地启动状态；正式系统需对接项目启动接口并生成启动记录。"
          type="info"
          show-icon
          :closable="false"
        />
      </div>
      <template #footer>
        <el-button @click="startDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="starting" @click="confirmStart">确认启动</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.project-start-page {
  --start-blue: #3478e5;
  --start-text: #263a55;
  --start-muted: #7d8da5;
  --start-border: #e1e8f2;
  --start-soft: #f4f7fc;
  display: grid;
  gap: 16px;
  min-width: 0;
}

.start-list-card {
  border: 1px solid var(--start-border);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(37 68 116 / 5.5%);
}

.start-list-card {
  overflow: hidden;
}

.start-list-head,
.start-filter-bar,
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
}

.start-list-head {
  min-height: 74px;
  border-bottom: 1px solid #edf1f6;
}

.start-list-head h3 {
  margin: 0;
  color: #243a58;
  font-size: 17px;
  font-weight: 760;
}

.start-list-head p,
.pagination-bar > span {
  margin: 5px 0 0;
  color: #8a99ad;
  font-size: 12px;
}

.head-actions,
.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.start-filter-bar {
  justify-content: flex-start;
  border-bottom: 1px solid #edf1f6;
  background: #fbfcfe;
}

.start-filter-bar .el-select {
  width: 158px;
}

.start-search {
  width: min(380px, 34vw);
}

.selection-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  padding: 8px 18px;
  border-bottom: 1px solid #edf1f6;
  color: #52657f;
  background: #f5f9ff;
  font-size: 13px;
}

.start-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
  --el-table-row-hover-bg-color: #f5f8fd;
}

.start-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.start-table :deep(.cell) {
  line-height: 1.34;
}

.row-index {
  color: #8e9caf;
}

.project-code {
  color: #345f98;
  font-family: Arial, sans-serif;
  font-weight: 700;
}

.project-cell {
  min-width: 0;
}

.project-cell strong,
.project-cell span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-cell strong {
  color: #213857;
  font-weight: 760;
}

.project-cell span {
  margin-top: 4px;
  color: #8a98ab;
  font-size: 12px;
}

.pagination-bar {
  min-height: 64px;
  border-top: 1px solid #edf1f6;
}

.start-confirm {
  display: grid;
  gap: 14px;
}

.start-confirm > p {
  margin: 0;
  color: #52657f;
  line-height: 1.7;
}

.start-confirm strong {
  color: #172b4d;
}

.confirm-project-list {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e4ecf7;
  border-radius: 12px;
  background: #f8fbff;
}

.confirm-project-list > div {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 10px;
  color: #536781;
  font-size: 13px;
}

.confirm-project-list span,
.confirm-project-list strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-tip {
  margin: 0;
  color: #8391a5;
  font-size: 12px;
}

@media (max-width: 1280px) {
  .start-filter-bar {
    flex-wrap: wrap;
  }

  .start-search {
    width: 100%;
  }
}
</style>
