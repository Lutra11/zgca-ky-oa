<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type TableInstance } from 'element-plus'
import {
  Download,
  Filter,
  Refresh,
  Search,
  Sort,
  View,
} from '@element-plus/icons-vue'
import {
  projectLedgerRows,
  type LedgerValue,
  type ProjectLedgerProject,
} from '../../dataset/projectLedgerMock'
import leaderAvatarUrl from '../../dataset/img/touxiang.png'

type FilterKind = 'status' | 'projectType' | 'department'
type SortField = 'code' | 'projectType' | 'name' | 'leader' | 'department' | 'endDate'
type SortDirection = 'asc' | 'desc'

interface ActiveFilterChip {
  kind: FilterKind | 'keyword'
  value: string
  label: string
}

const router = useRouter()
const projects = shallowRef<ProjectLedgerProject[]>(projectLedgerRows.map((project) => ({ ...project })))
const tableRef = shallowRef<TableInstance>()
const keyword = shallowRef('')
const filters = reactive<Record<FilterKind, string[]>>({
  status: [],
  projectType: [],
  department: [],
})
const filterDraft = reactive<Record<FilterKind, string[]>>({
  status: [],
  projectType: [],
  department: [],
})
const sortField = shallowRef<SortField>('code')
const sortDirection = shallowRef<SortDirection>('desc')
const sortDraft = reactive<{ field: SortField; direction: SortDirection }>({
  field: 'code',
  direction: 'desc',
})
const page = shallowRef(1)
const pageSize = shallowRef(20)
const filterDialogOpen = shallowRef(false)
const sortDialogOpen = shallowRef(false)
const selectedProjectKeys = shallowRef<string[]>([])

const filterLabels: Record<FilterKind, string> = {
  status: '状态',
  projectType: '项目类型',
  department: '学部/部门',
}

const projectLifecycleSteps = ['项目启动', '过程实施', '项目变更', '过程监管', '结项验收 / 归档']

const sortFieldOptions: Array<{ label: string; value: SortField }> = [
  { label: '项目编号', value: 'code' },
  { label: '项目类型', value: 'projectType' },
  { label: '项目名称', value: 'name' },
  { label: '项目负责人', value: 'leader' },
  { label: '学部/部门', value: 'department' },
  { label: '终止时间', value: 'endDate' },
]

const optionGroups = computed(() => ({
  status: uniqueValues('status'),
  projectType: uniqueValues('projectType'),
  department: uniqueValues('department'),
}))

const filteredProjects = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase()

  return projects.value
    .filter((project) => {
      const keywordMatched =
        !normalizedKeyword ||
        [project.code, project.projectType, project.name, project.leader, project.department, project.subDirection]
          .map((item) => text(item).toLowerCase())
          .some((item) => item.includes(normalizedKeyword))

      return (
        keywordMatched &&
        matchesFilter(project.status, filters.status) &&
        matchesFilter(project.projectType, filters.projectType) &&
        matchesFilter(project.department, filters.department)
      )
    })
    .sort((left, right) => compareProject(left, right))
})

const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const selectedProjects = computed(() => {
  const selectedSet = new Set(selectedProjectKeys.value)
  return filteredProjects.value.filter((project) => selectedSet.has(getProjectKey(project)))
})

const activeFilterChips = computed<ActiveFilterChip[]>(() => {
  const chips: ActiveFilterChip[] = []

  if (keyword.value.trim()) {
    chips.push({ kind: 'keyword', value: keyword.value.trim(), label: `关键词：${keyword.value.trim()}` })
  }

  ;(Object.keys(filters) as FilterKind[]).forEach((kind) => {
    filters[kind].forEach((value) => {
      chips.push({ kind, value, label: `${filterLabels[kind]}：${value}` })
    })
  })

  return chips
})

watch(
  () => filteredProjects.value.length,
  () => {
    page.value = 1
  },
)

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

function uniqueValues(key: FilterKind) {
  return Array.from(new Set(projects.value.map((project) => text(project[key])).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, 'zh-Hans-CN'),
  )
}

function matchesFilter(value: LedgerValue, selected: string[]) {
  return selected.length === 0 || selected.includes(text(value))
}

function compareProject(left: ProjectLedgerProject, right: ProjectLedgerProject) {
  const leftValue = text(left[sortField.value])
  const rightValue = text(right[sortField.value])

  if (!leftValue && rightValue) {
    return 1
  }
  if (leftValue && !rightValue) {
    return -1
  }

  const result = leftValue.localeCompare(rightValue, 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base',
  })

  return sortDirection.value === 'asc' ? result : -result
}

function statusTagType(status: LedgerValue) {
  if (text(status) === '在研') {
    return 'success'
  }
  if (text(status) === '终止') {
    return 'danger'
  }
  return 'info'
}

function sortLabel(field = sortField.value) {
  return sortFieldOptions.find((item) => item.value === field)?.label ?? field
}

function openFilterDialog() {
  ;(Object.keys(filters) as FilterKind[]).forEach((kind) => {
    filterDraft[kind] = [...filters[kind]]
  })
  filterDialogOpen.value = true
}

function applyFilters() {
  ;(Object.keys(filters) as FilterKind[]).forEach((kind) => {
    filters[kind] = [...filterDraft[kind]]
  })
  page.value = 1
  filterDialogOpen.value = false
}

function resetFilterDraft() {
  ;(Object.keys(filterDraft) as FilterKind[]).forEach((kind) => {
    filterDraft[kind] = []
  })
}

function clearAllFilters() {
  keyword.value = ''
  ;(Object.keys(filters) as FilterKind[]).forEach((kind) => {
    filters[kind] = []
    filterDraft[kind] = []
  })
  page.value = 1
}

function removeFilterChip(chip: ActiveFilterChip) {
  if (chip.kind === 'keyword') {
    keyword.value = ''
    return
  }

  filters[chip.kind] = filters[chip.kind].filter((item) => item !== chip.value)
  filterDraft[chip.kind] = filterDraft[chip.kind].filter((item) => item !== chip.value)
}

function openSortDialog() {
  sortDraft.field = sortField.value
  sortDraft.direction = sortDirection.value
  sortDialogOpen.value = true
}

function applySort() {
  sortField.value = sortDraft.field
  sortDirection.value = sortDraft.direction
  page.value = 1
  sortDialogOpen.value = false
}

function handleTableSortChange({ prop, order }: { prop?: SortField; order?: 'ascending' | 'descending' | null }) {
  if (!prop || !order) {
    return
  }

  sortField.value = prop
  sortDirection.value = order === 'ascending' ? 'asc' : 'desc'
  page.value = 1
}

function handleSelectionChange(selection: ProjectLedgerProject[]) {
  selectedProjectKeys.value = selection.map((project) => getProjectKey(project))
}

function clearSelection() {
  selectedProjectKeys.value = []
  tableRef.value?.clearSelection()
}

function refreshData() {
  projects.value = projectLedgerRows.map((project) => ({ ...project }))
  clearSelection()
  ElMessage.success('项目台账数据已刷新')
}

function openDetail(project: ProjectLedgerProject) {
  router.push({
    name: 'research-project-admin-project-library-detail',
    params: {
      projectId: getProjectKey(project),
    },
  })
}

function escapeCsvCell(value: LedgerValue | number | undefined) {
  return `"${shown(value).replace(/"/g, '""')}"`
}

function exportData() {
  const records = selectedProjects.value.length ? selectedProjects.value : filteredProjects.value

  if (!records.length) {
    ElMessage.warning('当前没有可导出的项目')
    return
  }

  const headers = [
    '状态',
    '项目编号',
    '项目类型',
    '项目名称',
    '项目负责人',
    '学部/部门',
    '子方向',
    '终止时间',
    '管理部门',
    '部门负责人',
    '方向负责人',
    '是否兼职导师',
    '项目负责人职称',
    '项目负责人工作单位',
    '手机号',
    '邮箱',
    'PM',
    'PM邮箱',
    '当前算力额度',
    '经费',
    '项目成员数',
    '项目导师数',
    '实例标题',
    '提交人',
    '提交人组织',
    '创建时间',
    '修改时间',
    '实例ID',
  ]
  const keys: Array<keyof ProjectLedgerProject> = [
    'status',
    'code',
    'projectType',
    'name',
    'leader',
    'department',
    'subDirection',
    'endDate',
    'managementDepartment',
    'departmentLeader',
    'directionLeader',
    'isPartTimeMentor',
    'leaderTitle',
    'leaderOrganization',
    'phone',
    'email',
    'pm',
    'pmEmail',
    'computeQuota',
    'funding',
  ]
  const rows = records.map((project) =>
    [
      ...keys.map((key) => project[key] as LedgerValue),
      project.members.length,
      project.mentors.length,
      project.instanceTitle,
      project.submitter,
      project.submitterOrganization,
      project.createdAt,
      project.updatedAt,
      project.instanceId,
    ]
      .map(escapeCsvCell)
      .join(','),
  )
  const blob = new Blob(['\ufeff', headers.map(escapeCsvCell).join(','), '\n', rows.join('\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `项目台账_${selectedProjects.value.length ? '已选' : '筛选结果'}_${records.length}条.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(link.href), 0)
  ElMessage.success(`已导出 ${records.length} 个项目，可使用 Excel 打开`)
}
</script>

<template>
  <section class="project-ledger-page" aria-label="项目库">
    <section class="project-lifecycle-flow" aria-label="项目管理流程">
      <article v-for="(step, index) in projectLifecycleSteps" :key="step" class="lifecycle-step">
        <span class="lifecycle-index">{{ index + 1 }}</span>
        <strong>{{ step }}</strong>
      </article>
    </section>

    <section class="ledger-card">
      <div class="ledger-toolbar">
        <div class="toolbar-left">
          <el-button :icon="Download" @click="exportData">导出</el-button>
          <el-button v-if="selectedProjectKeys.length" plain @click="clearSelection">取消选择</el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="keyword"
            class="ledger-search"
            clearable
            :prefix-icon="Search"
            placeholder="搜索项目名称、编号、负责人或部门"
          />
          <el-button :icon="Filter" :type="activeFilterChips.length ? 'primary' : 'default'" plain @click="openFilterDialog">
            筛选
            <span v-if="activeFilterChips.length" class="mini-count">{{ activeFilterChips.length }}</span>
          </el-button>
          <el-button :icon="Sort" @click="openSortDialog">
            排序
          </el-button>
          <el-tooltip content="刷新静态台账数据" placement="top">
            <el-button :icon="Refresh" circle @click="refreshData" />
          </el-tooltip>
        </div>
      </div>

      <div v-if="activeFilterChips.length" class="active-filters">
        <span>当前条件</span>
        <el-tag
          v-for="chip in activeFilterChips"
          :key="`${chip.kind}-${chip.value}`"
          closable
          effect="light"
          @close="removeFilterChip(chip)"
        >
          {{ chip.label }}
        </el-tag>
        <el-button link type="info" @click="clearAllFilters">清除全部</el-button>
      </div>

      <el-table
        ref="tableRef"
        class="ledger-table"
        :data="pagedProjects"
        :row-key="getProjectKey"
        stripe
        @selection-change="handleSelectionChange"
        @sort-change="handleTableSortChange"
      >
        <el-table-column type="selection" width="46" reserve-selection fixed="left" />
        <el-table-column label="序号" width="64" fixed="left">
          <template #default="{ $index }">
            <span class="row-index">{{ (page - 1) * pageSize + $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="96">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>{{ shown(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="项目编号" width="128" sortable="custom">
          <template #default="{ row }">
            <span class="project-code">{{ shown(row.code) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="projectType" label="项目类型" width="144" sortable="custom">
          <template #default="{ row }">{{ shown(row.projectType) }}</template>
        </el-table-column>
        <el-table-column prop="name" label="项目名称" min-width="300" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button class="project-name-link" link type="primary" @click="openDetail(row)">
              {{ shown(row.name) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="leader" label="项目负责人" width="170" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="person-chip">
              <img :src="leaderAvatarUrl" alt="项目负责人头像">
              {{ shown(row.leader) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="学部/部门" width="160" sortable="custom" show-overflow-tooltip>
          <template #default="{ row }">{{ shown(row.department) }}</template>
        </el-table-column>
        <el-table-column prop="subDirection" label="子方向" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">{{ shown(row.subDirection) }}</template>
        </el-table-column>
        <el-table-column prop="endDate" label="终止时间" width="126" sortable="custom">
          <template #default="{ row }">{{ shown(row.endDate) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="132" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="没有找到符合条件的项目">
            <el-button v-if="activeFilterChips.length" type="primary" plain @click="clearAllFilters">清除条件</el-button>
          </el-empty>
        </template>
      </el-table>

      <footer class="pagination-bar">
        <span>共 {{ filteredProjects.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="filteredProjects.length"
          background
          layout="total, sizes, prev, pager, next, jumper"
        />
        <span class="sort-status">当前按{{ sortLabel() }}{{ sortDirection === 'asc' ? '升序' : '降序' }}排列</span>
      </footer>
    </section>

    <el-dialog v-model="filterDialogOpen" class="ledger-dialog" title="筛选项目" width="720px" destroy-on-close>
      <p class="dialog-desc">可多选状态、项目类型和学部/部门，条件之间按“且”组合。</p>
      <div class="filter-groups">
        <fieldset v-for="kind in (Object.keys(filterLabels) as FilterKind[])" :key="kind" class="filter-group">
          <legend>{{ filterLabels[kind] }}</legend>
          <el-checkbox-group v-model="filterDraft[kind]" class="filter-option-grid">
            <el-checkbox-button v-for="item in optionGroups[kind]" :key="item" :label="item">
              {{ item }}
            </el-checkbox-button>
          </el-checkbox-group>
        </fieldset>
      </div>
      <template #footer>
        <el-button @click="resetFilterDraft">重置筛选</el-button>
        <el-button type="primary" @click="applyFilters">应用筛选</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="sortDialogOpen" class="ledger-dialog sort-dialog" title="排序设置" width="440px" destroy-on-close>
      <el-form label-position="top" class="sort-form">
        <el-form-item label="排序字段">
          <el-select v-model="sortDraft.field" class="full-field">
            <el-option v-for="item in sortFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序方向">
          <el-radio-group v-model="sortDraft.direction" class="direction-choice">
            <el-radio-button label="asc">升序</el-radio-button>
            <el-radio-button label="desc">降序</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="applySort">应用排序</el-button>
      </template>
    </el-dialog>

  </section>
</template>

<style scoped>
.project-ledger-page {
  --ledger-blue: #3478e5;
  --ledger-text: #263a55;
  --ledger-muted: #7d8da5;
  --ledger-border: #e1e8f2;
  --ledger-soft: #f4f7fc;
  display: grid;
  gap: 16px;
  min-width: 0;
}

.ledger-card {
  border: 1px solid var(--ledger-border);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(37 68 116 / 5.5%);
}

.ledger-card {
  overflow: hidden;
}

.project-lifecycle-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: stretch;
  gap: 0;
  overflow: hidden;
  border: 1px solid var(--ledger-border);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(37 68 116 / 5.5%);
}

.lifecycle-step {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 62px;
  padding: 14px 22px;
  color: #243a58;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.lifecycle-step:not(:last-child)::after {
  position: absolute;
  top: 50%;
  right: -7px;
  z-index: 1;
  width: 14px;
  height: 14px;
  border-top: 1px solid #dce6f4;
  border-right: 1px solid #dce6f4;
  background: #ffffff;
  content: '';
  transform: translateY(-50%) rotate(45deg);
}

.lifecycle-index {
  flex: 0 0 auto;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 10px;
  color: var(--ledger-blue);
  background: #eaf3ff;
  font-size: 12px;
  font-weight: 800;
}

.lifecycle-step strong {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 760;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-card-head,
.ledger-toolbar,
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
}

.ledger-card-head {
  min-height: 74px;
  border-bottom: 1px solid #edf1f6;
}

.ledger-card-head h2 {
  margin: 0;
  color: #243a58;
  font-size: 17px;
  font-weight: 760;
}

.ledger-card-head p,
.data-source-note,
.sort-status {
  margin: 4px 0 0;
  color: #8a99ad;
  font-size: 12px;
}

.ledger-toolbar {
  min-height: 64px;
  border-bottom: 1px solid #edf1f6;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.toolbar-right {
  justify-content: flex-end;
  flex: 1;
}

.ledger-search {
  width: min(360px, 34vw);
}

.mini-count {
  display: inline-grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  margin-left: 2px;
  padding: 0 5px;
  border-radius: 9px;
  color: #ffffff;
  background: var(--ledger-blue);
  font-size: 10px;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 46px;
  padding: 8px 16px;
  border-bottom: 1px solid #edf1f6;
  background: #fbfcfe;
}

.active-filters > span {
  color: #8b99ac;
  font-size: 12px;
}

.ledger-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
  --el-table-row-hover-bg-color: #f5f8fd;
}

.ledger-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.ledger-table :deep(.cell) {
  line-height: 1.36;
}

.row-index {
  color: #8e9caf;
}

.project-code {
  color: #345f98;
  font-family: Arial, sans-serif;
  font-weight: 700;
}

.project-name-link {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.person-chip {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-chip > img {
  display: block;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border: 1px solid #d6e3f4;
  border-radius: 50%;
  background: #eef5ff;
  object-fit: cover;
}

.pagination-bar {
  min-height: 64px;
  border-top: 1px solid #edf1f6;
}

.dialog-desc {
  margin: 0 0 16px;
  color: #7d8da5;
  font-size: 13px;
}

.filter-groups {
  display: grid;
  gap: 18px;
}

.filter-group {
  margin: 0;
  padding: 0;
  border: 0;
}

.filter-group legend {
  margin-bottom: 10px;
  color: #344a68;
  font-size: 13px;
  font-weight: 700;
}

.filter-option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-option-grid :deep(.el-checkbox-button__inner) {
  border: 1px solid #e0e7f0;
  border-radius: 8px;
  box-shadow: none;
}

.sort-form,
.full-field,
.direction-choice {
  width: 100%;
}

:deep(.ledger-dialog) {
  border-radius: 15px;
}

:deep(.ledger-dialog .el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #edf2f9;
}

:deep(.ledger-dialog .el-dialog__body) {
  padding: 18px 24px 20px;
}

:deep(.ledger-dialog .el-dialog__footer) {
  padding: 14px 24px 20px;
  border-top: 1px solid #edf2f9;
}

@media (max-width: 1360px) {
  .project-lifecycle-flow {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .lifecycle-step:nth-child(3)::after {
    display: none;
  }

  .toolbar-right {
    flex-wrap: wrap;
  }

  .ledger-search {
    width: 320px;
  }
}

@media (max-width: 1180px) {
  .project-lifecycle-flow {
    grid-template-columns: 1fr;
  }

  .lifecycle-step:not(:last-child)::after {
    display: none;
  }

  .ledger-card-head,
  .ledger-toolbar,
  .pagination-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-right,
  .ledger-search {
    width: 100%;
  }
}
</style>
