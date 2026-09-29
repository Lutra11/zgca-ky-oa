<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import type { LoggedInUser } from '../../../types/auth'
import {
  buildRecruitmentShareText,
  closeRecruitment,
  getDisplayRecruitmentStatus,
  getLeaderRecruitments,
  getRecruitmentPendingCount,
  loadProjectRecruitmentState,
  recruitmentStatusLabelMap,
  type ProjectRecruitment,
  type RecruitmentStatus,
} from '../../../dataset/projectRecruitmentMock'
import ProjectRecruitmentDetailDrawer from './ProjectRecruitmentDetailDrawer.vue'
import ProjectRecruitmentFormDialog from './ProjectRecruitmentFormDialog.vue'

const props = defineProps<{
  currentUser: LoggedInUser | null
}>()

const router = useRouter()
const state = reactive(loadProjectRecruitmentState())

const filters = reactive({
  keyword: '',
  status: 'all' as RecruitmentStatus | 'all',
})
const appliedFilters = reactive({ ...filters })
const page = shallowRef(1)
const pageSize = shallowRef(6)
const detailDrawerVisible = shallowRef(false)
const formDialogVisible = shallowRef(false)
const selectedRecruitment = shallowRef<ProjectRecruitment | null>(null)
const editingRecruitment = shallowRef<ProjectRecruitment | null>(null)

const allRecruitments = computed(() => getLeaderRecruitments(state, props.currentUser))

const filteredRecruitments = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return allRecruitments.value.filter((recruitment) => {
    const status = getDisplayRecruitmentStatus(recruitment)
    const matchedKeyword =
      !keyword ||
      recruitment.project_code.toLowerCase().includes(keyword) ||
      recruitment.project_name.toLowerCase().includes(keyword) ||
      recruitment.position_name.toLowerCase().includes(keyword)
    const matchedStatus = appliedFilters.status === 'all' || status === appliedFilters.status

    return matchedKeyword && matchedStatus
  })
})

const pagedRecruitments = computed(() => {
  const start = (page.value - 1) * pageSize.value

  return filteredRecruitments.value.slice(start, start + pageSize.value)
})

const publishedRecruitment = computed(
  () => allRecruitments.value.find((recruitment) => getDisplayRecruitmentStatus(recruitment) === 'PUBLISHED') ?? null,
)

const draftRecruitment = computed(
  () => allRecruitments.value.find((recruitment) => getDisplayRecruitmentStatus(recruitment) === 'DRAFT') ?? null,
)

const changeEntryRecruitment = computed(() => publishedRecruitment.value ?? draftRecruitment.value)

function queryRecruitments() {
  Object.assign(appliedFilters, filters)
  page.value = 1
}

function resetRecruitments() {
  filters.keyword = ''
  filters.status = 'all'
  Object.assign(appliedFilters, filters)
  page.value = 1
}

function openCreateDialog() {
  editingRecruitment.value = null
  formDialogVisible.value = true
}

function openChangeDialog(recruitment?: ProjectRecruitment | null) {
  const target = recruitment ?? changeEntryRecruitment.value

  if (!target) {
    ElMessage.info('暂无可变更的招募信息，请先发布项目招募')
    return
  }

  if (['CLOSED', 'EXPIRED'].includes(getDisplayRecruitmentStatus(target))) {
    ElMessage.warning('已结束或已过期的招募信息暂不支持变更')
    return
  }

  editingRecruitment.value = target
  formDialogVisible.value = true
}

function openEditDialog(recruitment: ProjectRecruitment) {
  editingRecruitment.value = recruitment
  formDialogVisible.value = true
}

function openDetail(recruitment: ProjectRecruitment) {
  selectedRecruitment.value = recruitment
  detailDrawerVisible.value = true
}

function viewApplications() {
  router.push('/project-member/project-recruitment-applications?type=join')
}

async function closeRecruitmentById(recruitment: ProjectRecruitment) {
  if (getDisplayRecruitmentStatus(recruitment) !== 'PUBLISHED') {
    ElMessage.info('只有招募中的记录可以提前结束')
    return
  }

  try {
    await ElMessageBox.confirm('提前结束后学生将不能继续申请该岗位，是否确认？', '关闭招募', {
      type: 'warning',
      confirmButtonText: '确认关闭',
      cancelButtonText: '取消',
      autofocus: false,
    })
    closeRecruitment(state, recruitment.id)
    ElMessage.success('已关闭招募')
  } catch {
    // 用户取消时不处理。
  }
}

async function copyRecruitment(recruitment: ProjectRecruitment) {
  const text = buildRecruitmentShareText(recruitment)

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('招募信息已复制')
  } catch {
    ElMessage.warning('当前浏览器不允许直接写入剪贴板，请在详情中手动复制')
  }
}

function getStatusType(status: RecruitmentStatus) {
  if (status === 'PUBLISHED') {
    return 'success'
  }

  if (status === 'DRAFT') {
    return 'warning'
  }

  return 'info'
}
</script>

<template>
  <section class="recruitment-page" aria-label="项目招募管理">
    <section class="recruitment-hero">
      <div>
        <p>项目负责人 / 项目管理</p>
        <h1>项目招募管理</h1>
        <span>发布招募需求，审批学生加入与退出，维护项目成员关系。</span>
      </div>
      <div class="recruitment-hero-actions">
        <el-button @click="router.push('/project-member/project-recruitment-members')">成员管理</el-button>
        <el-button
          v-if="changeEntryRecruitment"
          type="primary"
          @click="openChangeDialog(changeEntryRecruitment)"
        >
          变更招募信息
        </el-button>
        <el-button v-else type="primary" :icon="Plus" @click="openCreateDialog">发布项目招募</el-button>
      </div>
    </section>

    <section class="recruitment-flow" aria-label="学生加入项目流程">
      <article>
        <strong>1</strong>
        <span>发布招募</span>
        <small>发布招募需求</small>
      </article>
      <article>
        <strong>2</strong>
        <span>学生申请</span>
        <small>提交加入申请</small>
      </article>
      <article>
        <strong>3</strong>
        <span>项目负责人面试</span>
        <small>负责人沟通确认</small>
      </article>
      <article>
        <strong>4</strong>
        <span>学院导师审批</span>
        <small>导师确认意见</small>
      </article>
      <article>
        <strong>5</strong>
        <span>入组</span>
        <small>形成成员关系</small>
      </article>
    </section>

    <section class="recruitment-panel">
      <header class="recruitment-panel-head">
        <div>
          <h2>我的招募项目</h2>
          <p>共 {{ filteredRecruitments.length }} 条招募记录</p>
        </div>
        <div class="recruitment-panel-actions">
          <el-button
            v-if="changeEntryRecruitment"
            type="primary"
            plain
            @click="openChangeDialog(changeEntryRecruitment)"
          >
            变更招募信息
          </el-button>
          <el-button v-else type="primary" plain :icon="Plus" @click="openCreateDialog">发布项目招募</el-button>
          <el-button type="primary" plain @click="viewApplications">待我审批</el-button>
        </div>
      </header>

      <section class="recruitment-filter">
        <el-input
          v-model="filters.keyword"
          class="recruitment-keyword"
          clearable
          :prefix-icon="Search"
          placeholder="搜索项目编号、项目名称或招募岗位"
          @keyup.enter="queryRecruitments"
        />
        <el-select v-model="filters.status" class="recruitment-select">
          <el-option label="全部招募状态" value="all" />
          <el-option
            v-for="(label, value) in recruitmentStatusLabelMap"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
        <el-button type="primary" @click="queryRecruitments">查询</el-button>
        <el-button @click="resetRecruitments">重置</el-button>
      </section>

      <el-table class="recruitment-table" :data="pagedRecruitments" row-key="id" stripe>
        <el-table-column prop="project_code" label="项目编号" width="130" fixed="left" />
        <el-table-column label="项目名称" min-width="260" fixed="left" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="project-cell">
              <strong>{{ row.project_name }}</strong>
              <span>{{ row.department_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="requirements" label="招募方向及要求" min-width="190" show-overflow-tooltip />
        <el-table-column label="计划人数" width="100" align="center">
          <template #default="{ row }">{{ row.planned_count }} 人</template>
        </el-table-column>
        <el-table-column label="已录用" width="92" align="center">
          <template #default="{ row }">{{ row.admitted_count }} 人</template>
        </el-table-column>
        <el-table-column label="待审批" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="getRecruitmentPendingCount(state, row.id)" type="warning" effect="light">
              {{ getRecruitmentPendingCount(state, row.id) }} 条
            </el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column prop="application_deadline" label="截止时间" width="130" />
        <el-table-column label="状态" width="104" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="getStatusType(getDisplayRecruitmentStatus(row))">
              {{ recruitmentStatusLabelMap[getDisplayRecruitmentStatus(row)] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link @click="openDetail(row)">查看详情</el-button>
              <el-button
                v-if="getDisplayRecruitmentStatus(row) === 'PUBLISHED'"
                type="primary"
                link
                @click="openChangeDialog(row)"
              >
                变更信息
              </el-button>
              <el-button
                v-else-if="getDisplayRecruitmentStatus(row) === 'DRAFT'"
                type="primary"
                link
                @click="openEditDialog(row)"
              >
                继续编辑
              </el-button>
              <el-button type="primary" link @click="viewApplications">查看申请</el-button>
              <el-button type="primary" link @click="copyRecruitment(row)">复制</el-button>
              <el-button type="danger" link @click="closeRecruitmentById(row)">关闭</el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="没有匹配的招募记录" />
        </template>
      </el-table>

      <footer class="recruitment-pagination">
        <span>显示 {{ pagedRecruitments.length }} 条，共 {{ filteredRecruitments.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="sizes, prev, pager, next"
          :page-sizes="[6, 10, 20]"
          :total="filteredRecruitments.length"
        />
      </footer>
    </section>

    <ProjectRecruitmentFormDialog
      v-model="formDialogVisible"
      :state="state"
      :current-user="currentUser"
      :recruitment="editingRecruitment"
    />

    <ProjectRecruitmentDetailDrawer
      v-model="detailDrawerVisible"
      :state="state"
      :recruitment="selectedRecruitment"
    />
  </section>
</template>

<style scoped>
.recruitment-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.recruitment-hero,
.recruitment-flow,
.recruitment-panel {
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(40, 72, 120, 0.06);
}

.recruitment-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 28px;
}

.recruitment-hero p {
  margin: 0 0 8px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 800;
}

.recruitment-hero h1 {
  margin: 0;
  color: #142849;
  font-size: 28px;
}

.recruitment-hero span {
  display: inline-block;
  margin-top: 8px;
  color: #637185;
  font-size: 14px;
}

.recruitment-hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.recruitment-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  padding: 16px;
}

.recruitment-flow article {
  position: relative;
  min-width: 0;
  display: grid;
  justify-items: center;
  gap: 6px;
  text-align: center;
}

.recruitment-flow article:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 15px;
  left: 56%;
  right: -44%;
  height: 2px;
  background: #dce7f5;
}

.recruitment-flow strong {
  position: relative;
  z-index: 1;
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #3478e5;
  background: #eaf3ff;
  font-size: 12px;
}

.recruitment-flow span {
  color: #243955;
  font-size: 13px;
  font-weight: 760;
}

.recruitment-flow small {
  color: #98a5b6;
  font-size: 11px;
}

.recruitment-panel {
  overflow: hidden;
}

.recruitment-panel-head {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid #edf1f6;
}

.recruitment-panel-head h2 {
  margin: 0;
  color: #1c2c46;
  font-size: 17px;
  font-weight: 760;
}

.recruitment-panel-head p {
  margin: 4px 0 0;
  color: #98a5b8;
  font-size: 12px;
}

.recruitment-panel-actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.recruitment-panel-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.recruitment-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid #edf1f6;
}

.recruitment-keyword {
  width: 300px;
}

.recruitment-select {
  width: 170px;
}

.recruitment-table {
  --el-table-header-bg-color: #f8fafd;
  --el-table-header-text-color: #6f7d93;
  --el-table-row-hover-bg-color: #f9fbfe;
}

.project-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.project-cell strong {
  overflow: hidden;
  color: #263750;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-cell span {
  color: #8a98ab;
  font-size: 12px;
}

.table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  white-space: nowrap;
}

.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.recruitment-pagination {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 18px;
  color: #8996aa;
  font-size: 12px;
}

@media (max-width: 1180px) {
  .recruitment-flow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .recruitment-flow article::after {
    display: none;
  }
}

@media (max-width: 820px) {
  .recruitment-hero,
  .recruitment-panel-head,
  .recruitment-pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .recruitment-keyword,
  .recruitment-select,
  .recruitment-filter :deep(.el-button) {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .recruitment-flow {
    grid-template-columns: 1fr;
  }
}
</style>
