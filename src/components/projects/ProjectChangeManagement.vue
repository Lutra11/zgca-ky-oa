<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue'
import type { LedgerValue, ProjectLedgerProject } from '../../dataset/projectLedgerMock'
import {
  cloneProjectLedgerRows,
  loadProjectChangeProjects,
  saveProjectChangeProjects,
} from '../../dataset/projectChangeStore'

type ProjectChangeDialogMode = 'create' | 'edit'

interface ProjectChangeFormModel {
  status: string
  type: string
  code: string
  projectType: string
  name: string
  leader: string
  department: string
  subDirection: string
  endDate: string
  managementDepartment: string
  departmentLeader: string
  directionLeader: string
  phone: string
  email: string
  funding: string
  computeQuota: string
}

const router = useRouter()
const formRef = shallowRef<FormInstance>()
const projects = shallowRef<ProjectLedgerProject[]>(loadProjectChangeProjects())
const keyword = shallowRef('')
const selectedProjectType = shallowRef('')
const selectedDepartment = shallowRef('')
const selectedStatus = shallowRef('')
const page = shallowRef(1)
const pageSize = shallowRef(12)
const dialogVisible = shallowRef(false)
const dialogMode = shallowRef<ProjectChangeDialogMode>('create')
const editingProjectKey = shallowRef('')
const saving = shallowRef(false)

const filterForm = reactive({
  keyword: '',
  projectType: '',
  department: '',
  status: '',
})

const projectForm = reactive<ProjectChangeFormModel>({
  status: '在研',
  type: '科研项目',
  code: '',
  projectType: '',
  name: '',
  leader: '',
  department: '',
  subDirection: '',
  endDate: '',
  managementDepartment: '',
  departmentLeader: '',
  directionLeader: '',
  phone: '',
  email: '',
  funding: '',
  computeQuota: '',
})

const formRules: FormRules<ProjectChangeFormModel> = {
  status: [{ required: true, message: '请选择项目状态', trigger: 'change' }],
  type: [{ required: true, message: '请输入类型', trigger: 'blur' }],
  code: [{ required: true, message: '请输入项目编号', trigger: 'blur' }],
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  leader: [{ required: true, message: '请输入项目负责人', trigger: 'blur' }],
  department: [{ required: true, message: '请选择学部/部门', trigger: 'change' }],
}

const statusOptions = computed(() => uniqueValues('status'))
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
    const statusMatched = !selectedStatus.value || text(project.status) === selectedStatus.value

    return keywordMatched && typeMatched && departmentMatched && statusMatched
  })
})

const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

const dialogTitle = computed(() => (dialogMode.value === 'create' ? '新增项目' : '编辑项目'))

watch([keyword, selectedProjectType, selectedDepartment, selectedStatus], () => {
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

function uniqueValues(key: keyof Pick<ProjectLedgerProject, 'status' | 'projectType' | 'department'>) {
  return Array.from(new Set(projects.value.map((project) => text(project[key])).filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, 'zh-Hans-CN'),
  )
}

function statusTagType(status: LedgerValue) {
  const value = text(status)

  if (value === '在研') {
    return 'success'
  }

  if (['终止', '已终止'].includes(value)) {
    return 'danger'
  }

  if (['结题', '已结题'].includes(value)) {
    return 'info'
  }

  return 'primary'
}

function applyFilters() {
  keyword.value = filterForm.keyword
  selectedProjectType.value = filterForm.projectType
  selectedDepartment.value = filterForm.department
  selectedStatus.value = filterForm.status
}

function resetFilters() {
  filterForm.keyword = ''
  filterForm.projectType = ''
  filterForm.department = ''
  filterForm.status = ''
  applyFilters()
}

function reloadProjects() {
  projects.value = loadProjectChangeProjects()
  ElMessage.success('项目变更数据已刷新')
}

async function resetPrototypeData() {
  try {
    await ElMessageBox.confirm('将恢复为项目库初始台账数据，当前新增、编辑和删除的原型记录会被清空。是否继续？', '重置原型数据', {
      type: 'warning',
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
    })
    const initialProjects = cloneProjectLedgerRows()
    projects.value = initialProjects
    saveProjectChangeProjects(initialProjects)
    page.value = 1
    ElMessage.success('已恢复项目库初始台账数据')
  } catch {
    // 用户取消时不处理。
  }
}

function resetProjectForm() {
  projectForm.status = '在研'
  projectForm.type = '科研项目'
  projectForm.code = generateProjectCode()
  projectForm.projectType = projectTypeOptions.value[0] ?? '纵向项目'
  projectForm.name = ''
  projectForm.leader = ''
  projectForm.department = departmentOptions.value[0] ?? ''
  projectForm.subDirection = ''
  projectForm.endDate = ''
  projectForm.managementDepartment = ''
  projectForm.departmentLeader = ''
  projectForm.directionLeader = ''
  projectForm.phone = ''
  projectForm.email = ''
  projectForm.funding = ''
  projectForm.computeQuota = ''
}

function fillProjectForm(project: ProjectLedgerProject) {
  projectForm.status = text(project.status)
  projectForm.type = text(project.type)
  projectForm.code = text(project.code)
  projectForm.projectType = text(project.projectType)
  projectForm.name = text(project.name)
  projectForm.leader = text(project.leader)
  projectForm.department = text(project.department)
  projectForm.subDirection = text(project.subDirection)
  projectForm.endDate = text(project.endDate)
  projectForm.managementDepartment = text(project.managementDepartment)
  projectForm.departmentLeader = text(project.departmentLeader)
  projectForm.directionLeader = text(project.directionLeader)
  projectForm.phone = text(project.phone)
  projectForm.email = text(project.email)
  projectForm.funding = text(project.funding)
  projectForm.computeQuota = text(project.computeQuota)
}

function generateProjectCode() {
  const now = new Date()
  const year = String(now.getFullYear()).slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const suffix = String(projects.value.length + 1).padStart(3, '0')

  return `BG${year}${month}${suffix}`
}

function formatNow() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(
    now.getMinutes(),
  )}:${pad(now.getSeconds())}`
}

function openCreateDialog() {
  dialogMode.value = 'create'
  editingProjectKey.value = ''
  resetProjectForm()
  dialogVisible.value = true
  window.setTimeout(() => formRef.value?.clearValidate(), 0)
}

function openEditDialog(project: ProjectLedgerProject) {
  dialogMode.value = 'edit'
  editingProjectKey.value = getProjectKey(project)
  fillProjectForm(project)
  dialogVisible.value = true
  window.setTimeout(() => formRef.value?.clearValidate(), 0)
}

function buildProjectFromForm(source?: ProjectLedgerProject): ProjectLedgerProject {
  const now = formatNow()

  return {
    status: projectForm.status,
    type: projectForm.type,
    code: projectForm.code.trim(),
    projectType: projectForm.projectType,
    name: projectForm.name.trim(),
    leader: projectForm.leader.trim(),
    department: projectForm.department,
    subDirection: projectForm.subDirection.trim(),
    endDate: projectForm.endDate || null,
    managementDepartment: projectForm.managementDepartment.trim() || null,
    departmentLeader: projectForm.departmentLeader.trim() || null,
    directionLeader: projectForm.directionLeader.trim() || null,
    isPartTimeMentor: source?.isPartTimeMentor ?? null,
    leaderTitle: source?.leaderTitle ?? null,
    leaderOrganization: source?.leaderOrganization ?? null,
    phone: projectForm.phone.trim() || null,
    email: projectForm.email.trim() || null,
    pm: source?.pm ?? null,
    pmEmail: source?.pmEmail ?? null,
    computeQuota: projectForm.computeQuota.trim() || null,
    funding: projectForm.funding.trim() || null,
    members: source?.members.map((member) => ({ ...member })) ?? [],
    mentors: source?.mentors.map((mentor) => ({ ...mentor })) ?? [],
    instanceTitle: source?.instanceTitle ?? `${projectForm.leader.trim() || '科研项目管理员'}发起的项目台账`,
    submitter: source?.submitter ?? '科研项目管理员',
    submitterOrganization: source?.submitterOrganization ?? '中关村两院',
    createdAt: source?.createdAt ?? now,
    updatedAt: now,
    instanceId: source?.instanceId ?? `FINST-PROJECT-CHANGE-${Date.now()}`,
  }
}

function hasDuplicatedCode(code: string) {
  const normalizedCode = code.trim()

  return projects.value.some((project) => {
    const projectKey = getProjectKey(project)
    return text(project.code) === normalizedCode && projectKey !== editingProjectKey.value
  })
}

async function submitProjectForm() {
  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  if (hasDuplicatedCode(projectForm.code)) {
    ElMessage.error('项目编号已存在，请更换后再保存')
    return
  }

  saving.value = true

  const nextProjects = [...projects.value]

  if (dialogMode.value === 'create') {
    nextProjects.unshift(buildProjectFromForm())
  } else {
    const index = nextProjects.findIndex((project) => getProjectKey(project) === editingProjectKey.value)

    if (index === -1) {
      saving.value = false
      ElMessage.error('未找到需要编辑的项目')
      return
    }

    nextProjects[index] = buildProjectFromForm(nextProjects[index])
  }

  projects.value = nextProjects
  saveProjectChangeProjects(nextProjects)
  saving.value = false
  dialogVisible.value = false
  page.value = 1
  ElMessage.success(dialogMode.value === 'create' ? '项目已新增' : '项目变更已保存')
}

async function deleteProject(project: ProjectLedgerProject) {
  try {
    await ElMessageBox.confirm(`确认删除项目“${shown(project.name)}”吗？删除后仅影响当前前端原型数据。`, '删除项目', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    const projectKey = getProjectKey(project)
    const nextProjects = projects.value.filter((item) => getProjectKey(item) !== projectKey)
    projects.value = nextProjects
    saveProjectChangeProjects(nextProjects)
    ElMessage.success('项目已删除')
  } catch {
    // 用户取消时不处理。
  }
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
  <section class="project-change-page" aria-label="项目变更">
    <section class="change-list-card">
      <div class="change-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增项目</el-button>
          <el-button plain :icon="Refresh" @click="reloadProjects">刷新</el-button>
          <el-button link type="info" @click="resetPrototypeData">重置原型数据</el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="filterForm.keyword"
            class="change-search"
            clearable
            :prefix-icon="Search"
            placeholder="搜索项目编号、项目名称、负责人或部门"
            @keyup.enter="applyFilters"
          />
          <el-select v-model="filterForm.projectType" clearable filterable placeholder="全部项目类型">
            <el-option v-for="item in projectTypeOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select v-model="filterForm.department" clearable filterable placeholder="全部学部/部门">
            <el-option v-for="item in departmentOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select v-model="filterForm.status" clearable placeholder="全部状态">
            <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
          </el-select>
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>

      <el-table class="change-table" :data="pagedProjects" :row-key="getProjectKey" stripe>
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
        <el-table-column prop="name" label="项目名称" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button class="project-name-link" link type="primary" @click="openDetail(row)">
              {{ shown(row.name) }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="projectType" label="项目类型" width="142" show-overflow-tooltip>
          <template #default="{ row }">{{ shown(row.projectType) }}</template>
        </el-table-column>
        <el-table-column prop="leader" label="负责人" width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ shown(row.leader) }}</template>
        </el-table-column>
        <el-table-column prop="department" label="学部/部门" width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ shown(row.department) }}</template>
        </el-table-column>
        <el-table-column prop="subDirection" label="子方向" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">{{ shown(row.subDirection) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="项目状态" width="106">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>{{ shown(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="152">
          <template #default="{ row }">{{ shown(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button link type="primary" :icon="View" @click="openDetail(row)">详情</el-button>
              <el-button link type="primary" :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="deleteProject(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" class="project-change-dialog" :title="dialogTitle" width="860px" destroy-on-close>
      <el-form ref="formRef" :model="projectForm" :rules="formRules" label-position="top">
        <div class="form-grid">
          <el-form-item label="项目编号" prop="code">
            <el-input v-model="projectForm.code" clearable placeholder="请输入项目编号" />
          </el-form-item>
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="projectForm.name" clearable placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目状态" prop="status">
            <el-select v-model="projectForm.status" class="full-field" allow-create filterable default-first-option>
              <el-option label="在研" value="在研" />
              <el-option label="结题" value="结题" />
              <el-option label="终止" value="终止" />
              <el-option label="待启动" value="待启动" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型" prop="type">
            <el-input v-model="projectForm.type" clearable placeholder="请输入类型" />
          </el-form-item>
          <el-form-item label="项目类型" prop="projectType">
            <el-select v-model="projectForm.projectType" class="full-field" allow-create filterable default-first-option>
              <el-option v-for="item in projectTypeOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="学部/部门" prop="department">
            <el-select v-model="projectForm.department" class="full-field" allow-create filterable default-first-option>
              <el-option v-for="item in departmentOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="项目负责人" prop="leader">
            <el-input v-model="projectForm.leader" clearable placeholder="请输入项目负责人" />
          </el-form-item>
          <el-form-item label="终止时间">
            <el-date-picker
              v-model="projectForm.endDate"
              class="full-field"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择终止时间"
            />
          </el-form-item>
          <el-form-item label="管理部门">
            <el-input v-model="projectForm.managementDepartment" clearable placeholder="请输入管理部门" />
          </el-form-item>
          <el-form-item label="部门负责人">
            <el-input v-model="projectForm.departmentLeader" clearable placeholder="请输入部门负责人" />
          </el-form-item>
          <el-form-item label="方向负责人">
            <el-input v-model="projectForm.directionLeader" clearable placeholder="请输入方向负责人" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="projectForm.phone" clearable placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="projectForm.email" clearable placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="经费">
            <el-input v-model="projectForm.funding" clearable placeholder="请输入经费信息" />
          </el-form-item>
          <el-form-item label="算力额度">
            <el-input v-model="projectForm.computeQuota" clearable placeholder="请输入算力额度" />
          </el-form-item>
          <el-form-item class="form-wide" label="子方向">
            <el-input v-model="projectForm.subDirection" clearable placeholder="请输入子方向或研究方向路径" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitProjectForm">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.project-change-page {
  --change-blue: #3478e5;
  --change-text: #263a55;
  --change-muted: #7d8da5;
  --change-border: #e1e8f2;
  display: grid;
  min-width: 0;
}

.change-list-card {
  overflow: hidden;
  border: 1px solid var(--change-border);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(37 68 116 / 5.5%);
}

.change-toolbar,
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
}

.change-toolbar {
  min-height: 64px;
  border-bottom: 1px solid #edf1f6;
}

.toolbar-left,
.toolbar-right,
.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.toolbar-right {
  flex: 1;
  justify-content: flex-end;
}

.change-search {
  width: min(360px, 30vw);
}

.change-toolbar :deep(.el-select) {
  width: 150px;
}

.change-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
  --el-table-row-hover-bg-color: #f5f8fd;
}

.change-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.change-table :deep(.cell) {
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

.row-actions {
  justify-content: center;
}

.pagination-bar {
  min-height: 64px;
  border-top: 1px solid #edf1f6;
  color: var(--change-muted);
  font-size: 13px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 24px;
}

.form-wide {
  grid-column: 1 / -1;
}

.full-field {
  width: 100%;
}

:deep(.project-change-dialog) {
  border-radius: 15px;
}

:deep(.project-change-dialog .el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #edf2f9;
}

:deep(.project-change-dialog .el-dialog__body) {
  padding: 18px 24px 8px;
}

:deep(.project-change-dialog .el-dialog__footer) {
  padding: 14px 24px 20px;
  border-top: 1px solid #edf2f9;
}

@media (max-width: 1280px) {
  .change-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .change-search {
    width: min(100%, 420px);
  }
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
