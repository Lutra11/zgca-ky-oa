<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, Search } from '@element-plus/icons-vue'
import type { LoggedInUser } from '../../../types/auth'
import {
  applicationStatusLabelMap,
  applicationTypeLabelMap,
  getLeaderApplications,
  getLeaderMemberships,
  getProjectNameById,
  loadProjectRecruitmentState,
  projectMemberStatusLabelMap,
  projectMemberTypeLabelMap,
  updateMembershipResponsibility,
  type ProjectMembership,
  type ProjectMemberStatus,
} from '../../../dataset/projectRecruitmentMock'

const props = defineProps<{
  currentUser: LoggedInUser | null
}>()

const router = useRouter()
const state = reactive(loadProjectRecruitmentState())
const filters = reactive({
  keyword: '',
  status: 'all' as ProjectMemberStatus | 'all',
})
const appliedFilters = reactive({ ...filters })
const detailDialogVisible = shallowRef(false)
const editDialogVisible = shallowRef(false)
const selectedMember = shallowRef<ProjectMembership | null>(null)
const editResponsibility = shallowRef('')
const submitting = shallowRef(false)

const members = computed(() => getLeaderMemberships(state, props.currentUser))
const filteredMembers = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return members.value.filter((member) => {
    const matchedKeyword =
      !keyword ||
      member.user_name.toLowerCase().includes(keyword) ||
      member.user_no.toLowerCase().includes(keyword) ||
      member.responsibility.toLowerCase().includes(keyword) ||
      getProjectNameById(state, member.project_id).toLowerCase().includes(keyword)
    const matchedStatus = appliedFilters.status === 'all' || member.status === appliedFilters.status

    return matchedKeyword && matchedStatus
  })
})

const memberRecords = computed(() => {
  if (!selectedMember.value) {
    return []
  }

  return getLeaderApplications(state, props.currentUser).filter(
    (application) =>
      application.project_id === selectedMember.value?.project_id &&
      (application.student_id === selectedMember.value.user_id ||
        application.student_no === selectedMember.value.user_no ||
        application.membership_id === selectedMember.value.id),
  )
})

function queryMembers() {
  Object.assign(appliedFilters, filters)
}

function resetMembers() {
  filters.keyword = ''
  filters.status = 'all'
  Object.assign(appliedFilters, filters)
}

function openDetail(member: ProjectMembership) {
  selectedMember.value = member
  detailDialogVisible.value = true
}

function openEdit(member: ProjectMembership) {
  if (member.member_type === 'LEADER') {
    ElMessage.info('项目负责人本人不需要编辑成员分工')
    return
  }

  selectedMember.value = member
  editResponsibility.value = member.responsibility
  editDialogVisible.value = true
}

function submitResponsibility() {
  if (!selectedMember.value || submitting.value) {
    return
  }

  if (!editResponsibility.value.trim()) {
    ElMessage.warning('请填写项目分工')
    return
  }

  submitting.value = true

  window.setTimeout(() => {
    updateMembershipResponsibility(state, selectedMember.value?.id ?? '', editResponsibility.value.trim())
    submitting.value = false
    editDialogVisible.value = false
    ElMessage.success('项目分工已更新')
  }, 220)
}

function getMemberStatusType(status: ProjectMemberStatus) {
  if (status === 'ACTIVE') {
    return 'success'
  }

  if (status === 'EXIT_PENDING') {
    return 'warning'
  }

  return 'info'
}

function getApplicationStatusType(status: string) {
  if (status === 'APPROVED') {
    return 'success'
  }

  if (status === 'REJECTED') {
    return 'danger'
  }

  if (status === 'PENDING') {
    return 'warning'
  }

  return 'info'
}

function getMemberTypeLabel(type: string) {
  return projectMemberTypeLabelMap[type as keyof typeof projectMemberTypeLabelMap] ?? type
}

function getMemberStatusLabel(status: string) {
  return projectMemberStatusLabelMap[status as keyof typeof projectMemberStatusLabelMap] ?? status
}

function getApplicationTypeLabel(type: string) {
  return applicationTypeLabelMap[type as keyof typeof applicationTypeLabelMap] ?? type
}

function getApplicationStatusLabel(status: string) {
  return applicationStatusLabelMap[status as keyof typeof applicationStatusLabelMap] ?? status
}
</script>

<template>
  <section class="member-manage-page" aria-label="项目成员管理">
    <section class="member-manage-hero">
      <el-button :icon="Back" circle aria-label="返回项目招募管理" @click="router.push('/project-member/project-recruitments')" />
      <div>
        <p>项目负责人 / 项目管理</p>
        <h1>项目成员管理</h1>
        <span>查看成员状态、项目分工、加入时间和成员关系变更记录。</span>
      </div>
      <el-button @click="router.push('/project-member/project-recruitments')">返回招募管理</el-button>
    </section>

    <section class="member-manage-panel">
      <header class="member-manage-head">
        <div>
          <h2>项目成员列表</h2>
          <p>共 {{ filteredMembers.length }} 名成员，成员关系变更必须基于申请审批记录。</p>
        </div>
      </header>

      <section class="member-filter">
        <el-input
          v-model="filters.keyword"
          class="member-keyword"
          clearable
          :prefix-icon="Search"
          placeholder="搜索姓名、学号、项目或分工"
          @keyup.enter="queryMembers"
        />
        <el-select v-model="filters.status" class="member-select">
          <el-option label="全部成员状态" value="all" />
          <el-option label="在项目" value="ACTIVE" />
          <el-option label="退出申请中" value="EXIT_PENDING" />
          <el-option label="已退出" value="EXITED" />
        </el-select>
        <el-button type="primary" @click="queryMembers">查询</el-button>
        <el-button @click="resetMembers">重置</el-button>
      </section>

      <el-table class="member-table" :data="filteredMembers" row-key="id" stripe>
        <el-table-column label="姓名" min-width="150" fixed="left">
          <template #default="{ row }">
            <div class="member-cell">
              <strong>{{ row.user_name }}</strong>
              <span>{{ row.user_no }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成员类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="row.member_type === 'LEADER' ? 'primary' : 'success'">
              {{ getMemberTypeLabel(row.member_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="organization" label="所属单位" min-width="170" show-overflow-tooltip />
        <el-table-column label="所在项目" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">{{ getProjectNameById(state, row.project_id) }}</template>
        </el-table-column>
        <el-table-column prop="responsibility" label="项目分工" min-width="220" show-overflow-tooltip />
        <el-table-column prop="joined_at" label="加入时间" width="120" />
        <el-table-column prop="exited_at" label="退出时间" width="120">
          <template #default="{ row }">{{ row.exited_at || '—' }}</template>
        </el-table-column>
        <el-table-column label="成员状态" width="116" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="getMemberStatusType(row.status)">
              {{ getMemberStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link @click="openDetail(row)">查看详情</el-button>
              <el-button
                type="primary"
                link
                :disabled="row.member_type === 'LEADER' || row.status === 'EXITED'"
                @click="openEdit(row)"
              >
                编辑分工
              </el-button>
              <el-button type="primary" link @click="openDetail(row)">记录</el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无项目成员" />
        </template>
      </el-table>
    </section>

    <el-dialog v-model="detailDialogVisible" title="成员详情与变更记录" width="760px" append-to-body>
      <template v-if="selectedMember">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ selectedMember.user_name }}</el-descriptions-item>
          <el-descriptions-item label="工号或学号">{{ selectedMember.user_no }}</el-descriptions-item>
          <el-descriptions-item label="成员类型">{{ getMemberTypeLabel(selectedMember.member_type) }}</el-descriptions-item>
          <el-descriptions-item label="成员状态">{{ getMemberStatusLabel(selectedMember.status) }}</el-descriptions-item>
          <el-descriptions-item label="所属单位">{{ selectedMember.organization }}</el-descriptions-item>
          <el-descriptions-item label="所在项目">{{ getProjectNameById(state, selectedMember.project_id) }}</el-descriptions-item>
          <el-descriptions-item label="加入时间">{{ selectedMember.joined_at }}</el-descriptions-item>
          <el-descriptions-item label="退出时间">{{ selectedMember.exited_at || '—' }}</el-descriptions-item>
          <el-descriptions-item label="项目分工" :span="2">{{ selectedMember.responsibility }}</el-descriptions-item>
        </el-descriptions>

        <section class="record-panel">
          <header>加入与退出记录</header>
          <el-table :data="memberRecords" row-key="id">
            <el-table-column prop="id" label="申请编号" min-width="160" />
            <el-table-column label="申请类型" width="110">
              <template #default="{ row }">{{ getApplicationTypeLabel(row.application_type) }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" width="150" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="light" :type="getApplicationStatusType(row.status)">
                  {{ getApplicationStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="approval_comment" label="审批意见" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ row.approval_comment || '暂无' }}</template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无变更记录" />
            </template>
          </el-table>
        </section>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑项目分工" width="520px" append-to-body>
      <el-input
        v-model.trim="editResponsibility"
        type="textarea"
        :rows="4"
        maxlength="200"
        show-word-limit
        placeholder="请填写该成员在项目中的具体分工"
      />
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitResponsibility">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.member-manage-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.member-manage-hero,
.member-manage-panel {
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(40, 72, 120, 0.06);
}

.member-manage-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 22px 26px;
}

.member-manage-hero p {
  margin: 0 0 8px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 800;
}

.member-manage-hero h1 {
  margin: 0;
  color: #142849;
  font-size: 26px;
}

.member-manage-hero span {
  display: inline-block;
  margin-top: 8px;
  color: #637185;
  font-size: 14px;
}

.member-manage-panel {
  overflow: hidden;
}

.member-manage-head {
  min-height: 58px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  border-bottom: 1px solid #edf1f6;
}

.member-manage-head h2 {
  margin: 0;
  color: #1c2c46;
  font-size: 17px;
}

.member-manage-head p {
  margin: 5px 0 0;
  color: #98a5b8;
  font-size: 12px;
}

.member-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid #edf1f6;
}

.member-keyword {
  width: 310px;
}

.member-select {
  width: 170px;
}

.member-table {
  --el-table-header-bg-color: #f8fafd;
  --el-table-header-text-color: #6f7d93;
  --el-table-row-hover-bg-color: #f9fbfe;
}

.member-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.member-cell strong {
  color: #263750;
  font-weight: 730;
}

.member-cell span {
  color: #8a98ab;
  font-size: 12px;
}

.table-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.record-panel {
  overflow: hidden;
  margin-top: 16px;
  border: 1px solid #e3ebf6;
  border-radius: 12px;
}

.record-panel header {
  padding: 12px 15px;
  border-bottom: 1px solid #edf1f6;
  color: #1c2c46;
  font-size: 15px;
  font-weight: 760;
}

@media (max-width: 820px) {
  .member-manage-hero {
    grid-template-columns: 1fr;
  }

  .member-keyword,
  .member-select,
  .member-filter :deep(.el-button) {
    width: 100%;
  }
}
</style>
