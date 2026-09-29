<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Search } from '@element-plus/icons-vue'
import type { LoggedInUser } from '../../types/auth'
import {
  getProjectMemberProjects,
  type ProjectMemberProjectRow,
  type ProjectMemberProjectStatus,
} from '../../dataset/projectMemberProjectsMock'
import { formatCurrency } from '../finance/financeFormat'

const props = defineProps<{
  currentUser: LoggedInUser | null
}>()

const router = useRouter()

const filters = reactive({
  keyword: '',
  status: 'all' as ProjectMemberProjectStatus | 'all',
  batchId: 'all',
})
const appliedFilters = reactive({ ...filters })
const page = shallowRef(1)
const pageSize = shallowRef(6)

const projects = computed(() => getProjectMemberProjects(props.currentUser))

const batchOptions = computed(() =>
  Array.from(new Map(projects.value.map((project) => [project.batchId, project.batchName])).entries()).map(
    ([value, label]) => ({ value, label }),
  ),
)

const statusOptions = computed(() => Array.from(new Set(projects.value.map((project) => project.projectStatus))))

const filteredProjects = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return projects.value.filter((project) => {
    const matchedKeyword =
      !keyword ||
      project.projectCode.toLowerCase().includes(keyword) ||
      project.projectName.toLowerCase().includes(keyword) ||
      project.batchName.toLowerCase().includes(keyword)
    const matchedStatus = appliedFilters.status === 'all' || project.projectStatus === appliedFilters.status
    const matchedBatch = appliedFilters.batchId === 'all' || project.batchId === appliedFilters.batchId

    return matchedKeyword && matchedStatus && matchedBatch
  })
})

const pagedProjects = computed(() => {
  const start = (page.value - 1) * pageSize.value

  return filteredProjects.value.slice(start, start + pageSize.value)
})

const projectStats = computed(() => ({
  total: projects.value.length,
  reviewing: projects.value.filter((project) => project.projectStatus === '申报评审中').length,
  ongoing: projects.value.filter((project) => project.projectStatus === '在研').length,
  established: projects.value.filter((project) => project.currentNode === '已立项').length,
}))

function queryProjects() {
  Object.assign(appliedFilters, filters)
  page.value = 1
}

function resetProjects() {
  filters.keyword = ''
  filters.status = 'all'
  filters.batchId = 'all'
  Object.assign(appliedFilters, filters)
  page.value = 1
}

function openProjectDetail(project: ProjectMemberProjectRow) {
  router.push(`/project-member/my-projects/${project.projectId}`)
}

function getStatusType(status: ProjectMemberProjectStatus) {
  if (status === '在研' || status === '已立项') {
    return 'success'
  }

  if (status === '结题中') {
    return 'warning'
  }

  return 'primary'
}
</script>

<template>
  <section class="member-project-page" aria-label="项目负责人我的项目">
    <section class="member-project-hero">
      <div>
        <p>项目负责人</p>
        <h1>我的项目</h1>
        <span>查看本人负责项目的申报内容、立项状态、团队成员和材料信息。</span>
      </div>
      <div class="member-project-hero-icon" aria-hidden="true">
        <el-icon><Document /></el-icon>
      </div>
    </section>

    <section class="member-project-stats" aria-label="我的项目统计">
      <article>
        <span>项目总数</span>
        <strong>{{ projectStats.total }}</strong>
      </article>
      <article>
        <span>申报评审中</span>
        <strong>{{ projectStats.reviewing }}</strong>
      </article>
      <article>
        <span>在研项目</span>
        <strong>{{ projectStats.ongoing }}</strong>
      </article>
      <article>
        <span>已立项</span>
        <strong>{{ projectStats.established }}</strong>
      </article>
    </section>

    <section class="member-project-filter">
      <el-input
        v-model="filters.keyword"
        class="member-project-keyword"
        clearable
        :prefix-icon="Search"
        placeholder="项目编号、项目名称或立项批次"
        @keyup.enter="queryProjects"
      />
      <el-select v-model="filters.batchId" class="member-project-select" placeholder="立项批次">
        <el-option label="全部批次" value="all" />
        <el-option v-for="item in batchOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="filters.status" class="member-project-select" placeholder="项目状态">
        <el-option label="全部状态" value="all" />
        <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button type="primary" @click="queryProjects">查询</el-button>
      <el-button @click="resetProjects">重置</el-button>
    </section>

    <section class="member-project-table-card">
      <el-table class="member-project-table" :data="pagedProjects" row-key="projectId" stripe>
        <el-table-column prop="projectCode" label="项目编号" width="132" fixed="left" />
        <el-table-column label="项目名称" min-width="300" fixed="left" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="project-name-cell">
              <strong>{{ row.projectName }}</strong>
              <span>{{ row.projectCategory }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="batchName" label="立项批次" min-width="220" show-overflow-tooltip />
        <el-table-column prop="departmentName" label="所属单位" min-width="150" show-overflow-tooltip />
        <el-table-column prop="researchPeriod" label="研究周期" width="150" />
        <el-table-column prop="submitTime" label="提交时间" width="150" />
        <el-table-column label="项目状态" width="116" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="getStatusType(row.projectStatus)">
              {{ row.projectStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentNode" label="当前节点" width="120" align="center" />
        <el-table-column label="项目预算" width="132" align="right">
          <template #default="{ row }">{{ formatCurrency(row.totalBudget) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="112" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="openProjectDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无符合条件的我的项目" />
        </template>
      </el-table>

      <footer class="member-project-pagination">
        <span>共 {{ filteredProjects.length }} 个项目</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          background
          layout="sizes, prev, pager, next"
          :page-sizes="[6, 10, 20]"
          :total="filteredProjects.length"
        />
      </footer>
    </section>
  </section>
</template>

<style scoped>
.member-project-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.member-project-hero,
.member-project-filter,
.member-project-table-card,
.member-project-stats article {
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(40, 72, 120, 0.06);
}

.member-project-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
}

.member-project-hero p {
  margin: 0 0 8px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 800;
}

.member-project-hero h1 {
  margin: 0;
  color: #142849;
  font-size: 28px;
}

.member-project-hero span {
  display: inline-block;
  margin-top: 8px;
  color: #637185;
  font-size: 14px;
}

.member-project-hero-icon {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 22px;
  color: #3478e5;
  background: #eef5ff;
  font-size: 32px;
}

.member-project-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.member-project-stats article {
  display: grid;
  gap: 6px;
  padding: 16px;
}

.member-project-stats span {
  color: #7b8ba4;
  font-size: 13px;
}

.member-project-stats strong {
  color: #152b4f;
  font-size: 24px;
}

.member-project-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 16px;
}

.member-project-keyword {
  width: 300px;
}

.member-project-select {
  width: 180px;
}

.member-project-table-card {
  min-width: 0;
  overflow: hidden;
}

.member-project-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
  --el-table-row-hover-bg-color: #f5f8fd;
}

.member-project-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.project-name-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.project-name-cell strong {
  overflow: hidden;
  color: #152b4f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-name-cell span {
  color: #91a0b6;
  font-size: 12px;
}

.member-project-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #edf2f8;
  color: #7b8ba4;
  font-size: 13px;
}

@media (max-width: 1280px) {
  .member-project-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
