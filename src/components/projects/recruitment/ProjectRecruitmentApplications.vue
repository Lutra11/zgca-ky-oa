<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import type { LoggedInUser } from '../../../types/auth'
import {
  applicationStatusLabelMap,
  applicationTypeLabelMap,
  approveProjectApplication,
  getLeaderApplications,
  getLeaderMemberships,
  getProjectCodeById,
  getProjectNameById,
  loadProjectRecruitmentState,
  projectMemberStatusLabelMap,
  type ProjectApplication,
  type ProjectApplicationType,
} from '../../../dataset/projectRecruitmentMock'

const props = defineProps<{
  currentUser: LoggedInUser | null
}>()

const route = useRoute()
const router = useRouter()
const state = reactive(loadProjectRecruitmentState())
const activeTab = shallowRef<ProjectApplicationType>(route.query.type === 'exit' ? 'EXIT' : 'JOIN')
const detailDialogVisible = shallowRef(false)
const approvalDialogVisible = shallowRef(false)
const selectedApplication = shallowRef<ProjectApplication | null>(null)
const approvalAction = shallowRef<'APPROVE' | 'REJECT'>('APPROVE')
const approvalComment = shallowRef('')
const submitting = shallowRef(false)

const applications = computed(() =>
  getLeaderApplications(state, props.currentUser, activeTab.value).sort((a, b) => b.created_at.localeCompare(a.created_at)),
)

const pendingApplications = computed(() => applications.value.filter((application) => application.status === 'PENDING'))

function getMembership(application: ProjectApplication) {
  return getLeaderMemberships(state, props.currentUser).find((member) => member.id === application.membership_id)
}

function openDetail(application: ProjectApplication) {
  selectedApplication.value = application
  detailDialogVisible.value = true
}

function openApproval(application: ProjectApplication, action: 'APPROVE' | 'REJECT') {
  selectedApplication.value = application
  approvalAction.value = action
  approvalComment.value = ''
  approvalDialogVisible.value = true
}

function submitApproval() {
  if (!selectedApplication.value || submitting.value) {
    return
  }

  if (approvalAction.value === 'REJECT' && !approvalComment.value.trim()) {
    ElMessage.warning('驳回审批时必须填写审批意见')
    return
  }

  submitting.value = true

  window.setTimeout(() => {
    const updated = approveProjectApplication(
      state,
      selectedApplication.value?.id ?? '',
      approvalAction.value === 'APPROVE',
      approvalComment.value.trim() || '同意',
      props.currentUser?.displayName ?? '项目负责人',
    )

    submitting.value = false

    if (!updated) {
      ElMessage.warning('该申请已处理或不存在')
      return
    }

    approvalDialogVisible.value = false
    ElMessage.success(
      `${updated.student_name}的${applicationTypeLabelMap[updated.application_type]}已${
        approvalAction.value === 'APPROVE' ? '通过' : '驳回'
      }`,
    )
  }, 260)
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

function getApplicationStatusLabel(status: string) {
  return applicationStatusLabelMap[status as keyof typeof applicationStatusLabelMap] ?? status
}

function getApplicationTypeLabel(type: string) {
  return applicationTypeLabelMap[type as keyof typeof applicationTypeLabelMap] ?? type
}

function getMemberStatusLabel(application: ProjectApplication) {
  const membership = getMembership(application)

  return membership ? projectMemberStatusLabelMap[membership.status] : '未匹配'
}

watch(
  () => route.query.type,
  (type) => {
    activeTab.value = type === 'exit' ? 'EXIT' : 'JOIN'
  },
)
</script>

<template>
  <section class="approval-page" aria-label="加入与退出审批">
    <section class="approval-hero">
      <el-button :icon="Back" circle aria-label="返回项目招募管理" @click="router.push('/project-member/project-recruitments')" />
      <div>
        <p>项目负责人 / 项目管理</p>
        <h1>加入与退出审批</h1>
        <span>集中处理学生申请，审批结果将同步更新项目成员关系。</span>
      </div>
      <el-button @click="router.push('/project-member/project-recruitments')">返回招募管理</el-button>
    </section>

    <el-alert
      type="info"
      show-icon
      :closable="false"
      title="审批规则：加入申请通过后创建项目成员关系；退出申请通过后结束成员关系。正式环境由后端事务处理。"
    />

    <section class="approval-panel">
      <header class="approval-panel-head">
        <div>
          <h2>待处理申请</h2>
          <p>当前标签共 {{ applications.length }} 条，其中 {{ pendingApplications.length }} 条待审批</p>
        </div>
        <el-tabs v-model="activeTab" class="approval-tabs">
          <el-tab-pane label="加入申请" name="JOIN" />
          <el-tab-pane label="退出申请" name="EXIT" />
        </el-tabs>
      </header>

      <el-table class="approval-table" :data="applications" row-key="id" stripe>
        <el-table-column label="学生" min-width="150" fixed="left">
          <template #default="{ row }">
            <div class="student-cell">
              <strong>{{ row.student_name }}</strong>
              <span>{{ row.student_no }} · {{ row.college }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="申请项目" min-width="230" show-overflow-tooltip>
          <template #default="{ row }">{{ getProjectNameById(state, row.project_id) }}</template>
        </el-table-column>

        <template v-if="activeTab === 'JOIN'">
          <el-table-column prop="position_name" label="申请岗位" min-width="140" show-overflow-tooltip />
          <el-table-column prop="grade" label="年级" width="110" />
          <el-table-column prop="experience" label="相关能力与经历" min-width="230" show-overflow-tooltip />
          <el-table-column prop="application_reason" label="申请理由" min-width="190" show-overflow-tooltip />
          <el-table-column prop="available_time" label="每周投入" width="110" />
          <el-table-column label="个人材料" width="100" align="center">
            <template #default="{ row }">
              <el-button v-if="row.attachment_file_id" type="primary" link @click="ElMessage.info('原型阶段仅保留材料文件ID')">
                查看
              </el-button>
              <span v-else class="muted">无</span>
            </template>
          </el-table-column>
        </template>

        <template v-else>
          <el-table-column label="项目分工" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">{{ getMembership(row)?.responsibility ?? '未匹配成员关系' }}</template>
          </el-table-column>
          <el-table-column prop="application_reason" label="退出原因" min-width="130" show-overflow-tooltip />
          <el-table-column prop="description" label="情况说明" min-width="230" show-overflow-tooltip />
          <el-table-column prop="expected_exit_date" label="预计退出日期" width="130" />
          <el-table-column label="当前成员状态" width="126" align="center">
            <template #default="{ row }">
            <el-tag size="small" effect="light" type="warning">
                {{ getMemberStatusLabel(row) }}
              </el-tag>
            </template>
          </el-table-column>
        </template>

        <el-table-column prop="created_at" label="申请时间" width="150" />
        <el-table-column label="状态" width="104" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="light" :type="getApplicationStatusType(row.status)">
              {{ getApplicationStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link @click="openDetail(row)">查看详情</el-button>
              <el-button
                type="success"
                link
                :disabled="row.status !== 'PENDING'"
                @click="openApproval(row, 'APPROVE')"
              >
                通过
              </el-button>
              <el-button
                type="danger"
                link
                :disabled="row.status !== 'PENDING'"
                @click="openApproval(row, 'REJECT')"
              >
                驳回
              </el-button>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty :description="activeTab === 'JOIN' ? '暂无加入申请' : '暂无退出申请'" />
        </template>
      </el-table>
    </section>

    <el-dialog v-model="detailDialogVisible" title="申请详情" width="720px" append-to-body>
      <template v-if="selectedApplication">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号">{{ selectedApplication.id }}</el-descriptions-item>
          <el-descriptions-item label="申请类型">{{ getApplicationTypeLabel(selectedApplication.application_type) }}</el-descriptions-item>
          <el-descriptions-item label="学生姓名">{{ selectedApplication.student_name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ selectedApplication.student_no }}</el-descriptions-item>
          <el-descriptions-item label="所属单位">{{ selectedApplication.college }}</el-descriptions-item>
          <el-descriptions-item label="申请项目">{{ getProjectNameById(state, selectedApplication.project_id) }}</el-descriptions-item>
          <el-descriptions-item label="项目编号">{{ getProjectCodeById(state, selectedApplication.project_id) }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ selectedApplication.created_at }}</el-descriptions-item>
          <el-descriptions-item v-if="selectedApplication.application_type === 'JOIN'" label="申请岗位">
            {{ selectedApplication.position_name }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedApplication.application_type === 'JOIN'" label="每周投入">
            {{ selectedApplication.available_time }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedApplication.application_type === 'EXIT'" label="退出原因">
            {{ selectedApplication.application_reason }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedApplication.application_type === 'EXIT'" label="预计退出日期">
            {{ selectedApplication.expected_exit_date }}
          </el-descriptions-item>
          <el-descriptions-item label="相关能力/说明" :span="2">
            {{ selectedApplication.experience || selectedApplication.description || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="申请理由" :span="2">{{ selectedApplication.application_reason }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">{{ getApplicationStatusLabel(selectedApplication.status) }}</el-descriptions-item>
          <el-descriptions-item label="审批意见">{{ selectedApplication.approval_comment || '暂无' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <el-dialog
      v-model="approvalDialogVisible"
      :title="approvalAction === 'APPROVE' ? '通过审批确认' : '驳回审批确认'"
      width="560px"
      append-to-body
    >
      <template v-if="selectedApplication">
        <el-alert
          :type="approvalAction === 'APPROVE' ? 'success' : 'warning'"
          show-icon
          :closable="false"
          :title="`${approvalAction === 'APPROVE' ? '通过' : '驳回'} ${selectedApplication.student_name} 的${getApplicationTypeLabel(selectedApplication.application_type)}`"
        />
        <el-input
          v-model.trim="approvalComment"
          class="approval-comment"
          type="textarea"
          :rows="4"
          maxlength="300"
          show-word-limit
          :placeholder="approvalAction === 'APPROVE' ? '可填写审批意见，默认同意' : '驳回审批时必须填写理由'"
        />
      </template>

      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button
          :type="approvalAction === 'APPROVE' ? 'primary' : 'danger'"
          :loading="submitting"
          @click="submitApproval"
        >
          确认{{ approvalAction === 'APPROVE' ? '通过' : '驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.approval-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.approval-hero,
.approval-panel {
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(40, 72, 120, 0.06);
}

.approval-hero {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 22px 26px;
}

.approval-hero p {
  margin: 0 0 8px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 800;
}

.approval-hero h1 {
  margin: 0;
  color: #142849;
  font-size: 26px;
}

.approval-hero span {
  display: inline-block;
  margin-top: 8px;
  color: #637185;
  font-size: 14px;
}

.approval-panel {
  overflow: hidden;
}

.approval-panel-head {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 18px;
  border-bottom: 1px solid #edf1f6;
}

.approval-panel-head h2 {
  margin: 0;
  color: #1c2c46;
  font-size: 17px;
}

.approval-panel-head p {
  margin: 5px 0 0;
  color: #98a5b8;
  font-size: 12px;
}

.approval-tabs {
  min-width: 224px;
}

.approval-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.approval-table {
  --el-table-header-bg-color: #f8fafd;
  --el-table-header-text-color: #6f7d93;
  --el-table-row-hover-bg-color: #f9fbfe;
}

.student-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.student-cell strong {
  color: #263750;
  font-weight: 730;
}

.student-cell span,
.muted {
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

.approval-comment {
  margin-top: 14px;
}

@media (max-width: 820px) {
  .approval-hero {
    grid-template-columns: 1fr;
  }

  .approval-panel-head {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px 18px;
  }
}
</style>
