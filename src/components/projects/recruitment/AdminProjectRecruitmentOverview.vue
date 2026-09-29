<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, View } from '@element-plus/icons-vue'
import {
  applicationStatusLabelMap,
  applicationTypeLabelMap,
  getDisplayRecruitmentStatus,
  getProjectCodeById,
  getProjectNameById,
  getRecruitmentPendingCount,
  loadProjectRecruitmentState,
  projectMemberStatusLabelMap,
  projectMemberTypeLabelMap,
  recruitmentStatusLabelMap,
  type ApplicationStatus,
  type ProjectApplication,
  type ProjectApplicationType,
  type ProjectMembership,
  type ProjectRecruitment,
  type ProjectRecruitmentState,
  type RecruitmentStatus,
} from '../../../dataset/projectRecruitmentMock'

type AdminRecruitmentTab = 'recruitments' | 'applications' | 'results'

type DetailPayload =
  | {
      kind: 'recruitment'
      data: ProjectRecruitment
    }
  | {
      kind: 'application'
      data: ProjectApplication
    }
  | {
      kind: 'member'
      data: ProjectMembership
    }

const state = reactive<ProjectRecruitmentState>(loadProjectRecruitmentState())
const activeTab = ref<AdminRecruitmentTab>('recruitments')
const currentPage = ref(1)
const pageSize = ref(6)
const detailVisible = ref(false)
const selectedDetail = shallowRef<DetailPayload | null>(null)

const filterForm = reactive<{
  keyword: string
  recruitmentStatus: RecruitmentStatus | 'all'
  applicationStatus: ApplicationStatus | 'all'
  applicationType: ProjectApplicationType | 'all'
}>({
  keyword: '',
  recruitmentStatus: 'all',
  applicationStatus: 'all',
  applicationType: 'all',
})

const recruitmentStatusOptions = computed(() =>
  (Object.entries(recruitmentStatusLabelMap) as Array<[RecruitmentStatus, string]>).map(([value, label]) => ({
    value,
    label,
  })),
)

const applicationStatusOptions = computed(() =>
  (Object.entries(applicationStatusLabelMap) as Array<[ApplicationStatus, string]>).map(([value, label]) => ({
    value,
    label,
  })),
)

const applicationTypeOptions = computed(() =>
  (Object.entries(applicationTypeLabelMap) as Array<[ProjectApplicationType, string]>).map(([value, label]) => ({
    value,
    label,
  })),
)

const normalizedKeyword = computed(() => filterForm.keyword.trim().toLowerCase())

const filteredRecruitments = computed(() =>
  state.recruitments.filter((recruitment) => {
    const displayStatus = getDisplayRecruitmentStatus(recruitment)
    const matchedStatus =
      filterForm.recruitmentStatus === 'all' || displayStatus === filterForm.recruitmentStatus

    if (!matchedStatus) {
      return false
    }

    if (!normalizedKeyword.value) {
      return true
    }

    return [
      recruitment.id,
      recruitment.project_code,
      recruitment.project_name,
      recruitment.leader_name,
      recruitment.department_name,
      recruitment.position_name,
      recruitment.research_direction,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  }),
)

const filteredApplications = computed(() =>
  state.applications.filter((application) => {
    const matchedType =
      filterForm.applicationType === 'all' || application.application_type === filterForm.applicationType
    const matchedStatus =
      filterForm.applicationStatus === 'all' || application.status === filterForm.applicationStatus

    if (!matchedType || !matchedStatus) {
      return false
    }

    if (!normalizedKeyword.value) {
      return true
    }

    const recruitment = getRecruitmentById(application.recruitment_id)

    return [
      application.id,
      application.student_name,
      application.student_no,
      application.college,
      application.position_name,
      application.application_reason,
      application.description,
      getProjectNameById(state, application.project_id),
      getProjectCodeById(state, application.project_id),
      recruitment?.leader_name,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  }),
)

const filteredApprovalResults = computed(() =>
  filteredApplications.value
    .slice()
    .sort((first, second) => second.created_at.localeCompare(first.created_at)),
)

const filteredMemberships = computed(() =>
  state.memberships.filter((member) => {
    if (!normalizedKeyword.value) {
      return true
    }

    return [
      member.user_name,
      member.user_no,
      member.organization,
      member.responsibility,
      getProjectNameById(state, member.project_id),
      getProjectCodeById(state, member.project_id),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedKeyword.value)
  }),
)

const pagedRecruitments = computed(() => paginateRows(filteredRecruitments.value))
const pagedApplications = computed(() => paginateRows(filteredApplications.value))
const pagedApprovalResults = computed(() => paginateRows(filteredApprovalResults.value))

const activeTotal = computed(() => {
  if (activeTab.value === 'recruitments') {
    return filteredRecruitments.value.length
  }

  if (activeTab.value === 'applications') {
    return filteredApplications.value.length
  }

  return filteredApprovalResults.value.length
})

const detailDialogTitle = computed(() => {
  if (selectedDetail.value?.kind === 'recruitment') {
    return '招募详情'
  }

  if (selectedDetail.value?.kind === 'application') {
    return '申请与审批详情'
  }

  if (selectedDetail.value?.kind === 'member') {
    return '成员关系详情'
  }

  return '详情'
})

const selectedRecruitment = computed<ProjectRecruitment | null>(() =>
  selectedDetail.value?.kind === 'recruitment' ? selectedDetail.value.data : null,
)

const selectedApplication = computed<ProjectApplication | null>(() =>
  selectedDetail.value?.kind === 'application' ? selectedDetail.value.data : null,
)

const selectedMember = computed<ProjectMembership | null>(() =>
  selectedDetail.value?.kind === 'member' ? selectedDetail.value.data : null,
)

watch(
  () => [
    activeTab.value,
    filterForm.keyword,
    filterForm.recruitmentStatus,
    filterForm.applicationStatus,
    filterForm.applicationType,
  ],
  () => {
    currentPage.value = 1
  },
)

function paginateRows<T>(rows: T[]): T[] {
  const start = (currentPage.value - 1) * pageSize.value

  return rows.slice(start, start + pageSize.value)
}

function handleQuery() {
  currentPage.value = 1
  ElMessage.success('已按当前条件筛选项目招募情况')
}

function handleReset() {
  filterForm.keyword = ''
  filterForm.recruitmentStatus = 'all'
  filterForm.applicationStatus = 'all'
  filterForm.applicationType = 'all'
  currentPage.value = 1
  ElMessage.info('已重置筛选条件')
}

function openDetail(payload: DetailPayload) {
  selectedDetail.value = payload
  detailVisible.value = true
}

function switchToApplications(recruitment: ProjectRecruitment) {
  activeTab.value = 'applications'
  filterForm.keyword = recruitment.project_code
  filterForm.applicationStatus = 'all'
  filterForm.applicationType = 'all'
  ElMessage.info(`已定位到 ${recruitment.project_code} 的申报记录`)
}

function switchToResults(recruitment: ProjectRecruitment) {
  activeTab.value = 'results'
  filterForm.keyword = recruitment.project_code
  filterForm.applicationStatus = 'all'
  filterForm.applicationType = 'all'
  ElMessage.info(`已查看 ${recruitment.project_code} 的审批与成员结果`)
}

function getRecruitmentById(recruitmentId?: string) {
  if (!recruitmentId) {
    return undefined
  }

  return state.recruitments.find((recruitment) => recruitment.id === recruitmentId)
}

function getRecruitmentByProjectId(projectId: string) {
  return state.recruitments.find((recruitment) => recruitment.project_id === projectId)
}

function getRecruitmentStats(recruitment: ProjectRecruitment) {
  return {
    admitted: recruitment.admitted_count,
    pending: getRecruitmentPendingCount(state, recruitment.id),
  }
}

function getRecruitmentProgress(recruitment: ProjectRecruitment) {
  if (!recruitment.planned_count) {
    return 0
  }

  const admitted = getRecruitmentStats(recruitment).admitted

  return Math.min(100, Math.round((admitted / recruitment.planned_count) * 100))
}

function getRecruitmentTagType(status: RecruitmentStatus) {
  if (status === 'PUBLISHED') {
    return 'primary'
  }

  if (status === 'CLOSED') {
    return 'success'
  }

  if (status === 'EXPIRED') {
    return 'warning'
  }

  return 'info'
}

function getApplicationTypeLabel(type: ProjectApplicationType) {
  return applicationTypeLabelMap[type]
}

function getApplicationStatusLabel(status: ApplicationStatus) {
  return applicationStatusLabelMap[status]
}

function getProjectMemberTypeLabel(type: ProjectMembership['member_type']) {
  return projectMemberTypeLabelMap[type]
}

function getProjectMemberStatusLabel(status: ProjectMembership['status']) {
  return projectMemberStatusLabelMap[status]
}

function getApplicationTagType(status: ApplicationStatus) {
  if (status === 'PENDING') {
    return 'warning'
  }

  if (status === 'APPROVED') {
    return 'success'
  }

  if (status === 'REJECTED') {
    return 'danger'
  }

  return 'info'
}

function getMemberTagType(status: ProjectMembership['status']) {
  if (status === 'ACTIVE') {
    return 'success'
  }

  if (status === 'EXIT_PENDING') {
    return 'warning'
  }

  return 'info'
}

function getApprovalResult(application: ProjectApplication) {
  if (application.status === 'PENDING') {
    return '等待学院导师审批与项目负责人审批'
  }

  if (application.status === 'APPROVED') {
    return '学院导师与项目负责人已通过'
  }

  if (application.status === 'REJECTED') {
    return '项目负责人已驳回'
  }

  return '申请人已撤回'
}

function getApprovalUser(application: ProjectApplication) {
  if (application.approved_by) {
    return application.approved_by
  }

  const recruitment = getRecruitmentById(application.recruitment_id) ?? getRecruitmentByProjectId(application.project_id)

  return recruitment?.leader_name ?? '项目负责人'
}

function getApplicationTarget(application: ProjectApplication) {
  return application.application_type === 'JOIN'
    ? application.position_name || '项目成员'
    : application.application_reason || '退出项目'
}

function getMemberForApplication(application: ProjectApplication) {
  if (application.membership_id) {
    return state.memberships.find((member) => member.id === application.membership_id)
  }

  return state.memberships.find(
    (member) =>
      member.project_id === application.project_id &&
      member.user_id === application.student_id &&
      member.status !== 'EXITED',
  )
}

function getMemberResult(application: ProjectApplication) {
  const member = getMemberForApplication(application)

  if (member) {
    return projectMemberStatusLabelMap[member.status]
  }

  if (application.status === 'PENDING') {
    return '审批后更新'
  }

  return '未建立成员关系'
}

function getApplicationActiveStep(application: ProjectApplication) {
  if (application.status === 'PENDING') {
    return 2
  }

  if (application.status === 'APPROVED') {
    return 4
  }

  return 3
}

function getApplicationFinalStepTitle(application: ProjectApplication) {
  return application.application_type === 'JOIN' ? '创建项目成员关系' : '结束项目成员关系'
}

function getApplicationFinalStepDescription(application: ProjectApplication) {
  if (application.status === 'APPROVED') {
    return application.application_type === 'JOIN'
      ? '审批通过后创建成员记录，并计入已招募学生。'
      : '审批通过后成员状态变为已退出，保留退出记录。'
  }

  if (application.status === 'PENDING') {
    return '等待学院导师审批与项目负责人审批完成后同步更新。'
  }

  if (application.status === 'REJECTED') {
    return '审批未通过，项目成员关系保持不变。'
  }

  return '申请已撤回，不再进入后续成员关系变更。'
}
</script>

<template>
  <section class="admin-recruitment-overview">
    <section class="recruitment-panel">
      <div class="panel-header">
        <div>
          <h3>招募监管台账</h3>
        </div>
        <el-tabs v-model="activeTab" class="admin-recruitment-tabs">
          <el-tab-pane label="招募总览" name="recruitments" />
          <el-tab-pane label="学生申报情况" name="applications" />
          <el-tab-pane label="审批与成员结果" name="results" />
        </el-tabs>
      </div>

      <div class="filter-bar">
        <el-input
          v-model="filterForm.keyword"
          class="keyword-input"
          :prefix-icon="Search"
          clearable
          placeholder="搜索项目编号、项目名称、负责人、学生或申请编号"
          @keyup.enter="handleQuery"
        />
        <el-select
          v-if="activeTab === 'recruitments'"
          v-model="filterForm.recruitmentStatus"
          class="filter-select"
          placeholder="招募状态"
        >
          <el-option label="全部状态" value="all" />
          <el-option
            v-for="option in recruitmentStatusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <template v-else>
          <el-select v-model="filterForm.applicationType" class="filter-select" placeholder="申请类型">
            <el-option label="全部类型" value="all" />
            <el-option
              v-for="option in applicationTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-select v-model="filterForm.applicationStatus" class="filter-select" placeholder="审批状态">
            <el-option label="全部状态" value="all" />
            <el-option
              v-for="option in applicationStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </template>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <div v-if="activeTab === 'recruitments'" class="table-shell">
        <el-table :data="pagedRecruitments" row-key="id" class="recruitment-table">
          <el-table-column label="项目编号 / 名称" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="primary-cell">
                <strong>{{ row.project_name }}</strong>
                <span>{{ row.project_code }} · {{ row.id }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="负责人 / 部门" min-width="170">
            <template #default="{ row }">
              <div class="primary-cell">
                <strong>{{ row.leader_name }}</strong>
                <span>{{ row.department_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="研究方向" prop="research_direction" min-width="140" show-overflow-tooltip />
          <el-table-column label="招募岗位" prop="position_name" min-width="150" show-overflow-tooltip />
          <el-table-column label="招募进度" min-width="210">
            <template #default="{ row }">
              <div class="progress-cell">
                <div class="progress-meta">
                  <span>{{ getRecruitmentStats(row).admitted }} / {{ row.planned_count }} 人</span>
                  <strong>{{ getRecruitmentProgress(row) }}%</strong>
                </div>
                <el-progress
                  :percentage="getRecruitmentProgress(row)"
                  :stroke-width="6"
                  :show-text="false"
                  :color="getDisplayRecruitmentStatus(row) === 'PUBLISHED' ? '#3478E5' : '#42b883'"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="待审批" min-width="92" align="center">
            <template #default="{ row }">
              <strong class="pending-count">{{ getRecruitmentStats(row).pending }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="截止时间" prop="application_deadline" min-width="120" />
          <el-table-column label="招募状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="getRecruitmentTagType(getDisplayRecruitmentStatus(row))" effect="light" round>
                {{ recruitmentStatusLabelMap[getDisplayRecruitmentStatus(row)] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="220" fixed="right">
            <template #default="{ row }">
              <div class="action-row">
                <el-button link type="primary" @click="openDetail({ kind: 'recruitment', data: row })">
                  查看详情
                </el-button>
                <el-button link type="primary" @click="switchToApplications(row)">查看申报</el-button>
                <el-button link type="primary" @click="switchToResults(row)">成员结果</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else-if="activeTab === 'applications'" class="table-shell">
        <el-table :data="pagedApplications" row-key="id" class="recruitment-table">
          <el-table-column label="申请编号" prop="id" min-width="150" fixed="left" />
          <el-table-column label="申请类型" min-width="110">
            <template #default="{ row }">
              <el-tag effect="light" :type="row.application_type === 'JOIN' ? 'primary' : 'warning'" round>
                {{ getApplicationTypeLabel(row.application_type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="申请学生" min-width="190">
            <template #default="{ row }">
              <div class="primary-cell">
                <strong>{{ row.student_name }}</strong>
                <span>{{ row.student_no }} · {{ row.college }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="申请项目" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="primary-cell">
                <strong>{{ getProjectNameById(state, row.project_id) }}</strong>
                <span>{{ getProjectCodeById(state, row.project_id) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="岗位 / 原因" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">{{ getApplicationTarget(row) }}</template>
          </el-table-column>
          <el-table-column label="投入 / 退出时间" min-width="140">
            <template #default="{ row }">{{ row.available_time || row.expected_exit_date || '—' }}</template>
          </el-table-column>
          <el-table-column label="提交时间" prop="created_at" min-width="150" />
          <el-table-column label="当前状态" min-width="110">
            <template #default="{ row }">
              <el-tag :type="getApplicationTagType(row.status)" effect="light" round>
                {{ getApplicationStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" :icon="View" @click="openDetail({ kind: 'application', data: row })">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="result-grid">
        <section class="result-card">
          <div class="result-card-header">
            <div>
              <h4>项目负责人审批结果</h4>
              <p>展示加入、退出申请的审批节点、意见和处理结果。</p>
            </div>
            <el-tag effect="light">共 {{ filteredApprovalResults.length }} 条</el-tag>
          </div>
          <el-table :data="pagedApprovalResults" row-key="id" class="recruitment-table compact-table">
            <el-table-column label="申请编号" prop="id" min-width="145" />
            <el-table-column label="申请人" min-width="150">
              <template #default="{ row }">
                <div class="primary-cell">
                  <strong>{{ row.student_name }}</strong>
                  <span>{{ getApplicationTypeLabel(row.application_type) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="项目" min-width="240" show-overflow-tooltip>
              <template #default="{ row }">{{ getProjectNameById(state, row.project_id) }}</template>
            </el-table-column>
            <el-table-column label="审批结果" min-width="160">
              <template #default="{ row }">
                <el-tag :type="getApplicationTagType(row.status)" effect="light" round>
                  {{ getApprovalResult(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="审批人 / 时间" min-width="180">
              <template #default="{ row }">
                <div class="primary-cell">
                  <strong>{{ getApprovalUser(row) }}</strong>
                  <span>{{ row.approved_at || '待审批' }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="审批意见" min-width="240" show-overflow-tooltip>
              <template #default="{ row }">{{ row.approval_comment || '暂无审批意见' }}</template>
            </el-table-column>
            <el-table-column label="成员结果" min-width="120">
              <template #default="{ row }">{{ getMemberResult(row) }}</template>
            </el-table-column>
            <el-table-column label="操作" min-width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDetail({ kind: 'application', data: row })">
                  查看链路
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section class="result-card">
          <div class="result-card-header">
            <div>
              <h4>项目成员关系快照</h4>
              <p>展示审批后形成的项目成员、退出申请中和已退出状态。</p>
            </div>
            <el-tag effect="light">共 {{ filteredMemberships.length }} 人</el-tag>
          </div>
          <el-table :data="filteredMemberships" row-key="id" class="recruitment-table compact-table" max-height="320">
            <el-table-column label="成员" min-width="180">
              <template #default="{ row }">
                <div class="primary-cell">
                  <strong>{{ row.user_name }}</strong>
                  <span>{{ row.user_no }} · {{ getProjectMemberTypeLabel(row.member_type) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="项目" min-width="260" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="primary-cell">
                  <strong>{{ getProjectNameById(state, row.project_id) }}</strong>
                  <span>{{ getProjectCodeById(state, row.project_id) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="单位" prop="organization" min-width="150" />
            <el-table-column label="项目分工" prop="responsibility" min-width="190" show-overflow-tooltip />
            <el-table-column label="加入 / 退出" min-width="170">
              <template #default="{ row }">{{ row.joined_at }} / {{ row.exited_at || '—' }}</template>
            </el-table-column>
            <el-table-column label="成员状态" min-width="120">
              <template #default="{ row }">
                <el-tag :type="getMemberTagType(row.status)" effect="light" round>
                  {{ getProjectMemberStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="110" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openDetail({ kind: 'member', data: row })">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>

      <div class="table-footer">
        <span>共 {{ activeTotal }} 条记录</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[6, 10, 20]"
          :total="activeTotal"
          layout="sizes, prev, pager, next"
          small
        />
      </div>
    </section>

    <el-dialog v-model="detailVisible" :title="detailDialogTitle" width="780px" class="admin-recruitment-dialog">
      <template v-if="selectedRecruitment">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="招募编号">{{ selectedRecruitment.id }}</el-descriptions-item>
          <el-descriptions-item label="招募状态">
            <el-tag
              :type="getRecruitmentTagType(getDisplayRecruitmentStatus(selectedRecruitment))"
              effect="light"
              round
            >
              {{ recruitmentStatusLabelMap[getDisplayRecruitmentStatus(selectedRecruitment)] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="项目编号">{{ selectedRecruitment.project_code }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ selectedRecruitment.project_name }}</el-descriptions-item>
          <el-descriptions-item label="项目负责人">{{ selectedRecruitment.leader_name }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ selectedRecruitment.department_name }}</el-descriptions-item>
          <el-descriptions-item label="研究方向">{{ selectedRecruitment.research_direction }}</el-descriptions-item>
          <el-descriptions-item label="招募岗位">{{ selectedRecruitment.position_name }}</el-descriptions-item>
          <el-descriptions-item label="计划招募">{{ selectedRecruitment.planned_count }} 人</el-descriptions-item>
          <el-descriptions-item label="已录用">{{ getRecruitmentStats(selectedRecruitment).admitted }} 人</el-descriptions-item>
          <el-descriptions-item label="待审批">{{ getRecruitmentStats(selectedRecruitment).pending }} 条</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ selectedRecruitment.application_deadline }}</el-descriptions-item>
          <el-descriptions-item label="面向年级" :span="2">{{ selectedRecruitment.target_grade }}</el-descriptions-item>
          <el-descriptions-item label="能力要求" :span="2">{{ selectedRecruitment.requirements }}</el-descriptions-item>
          <el-descriptions-item label="工作内容" :span="2">{{ selectedRecruitment.work_content }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <template v-else-if="selectedApplication">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号">{{ selectedApplication.id }}</el-descriptions-item>
          <el-descriptions-item label="申请类型">
            {{ applicationTypeLabelMap[selectedApplication.application_type] }}
          </el-descriptions-item>
          <el-descriptions-item label="申请人">{{ selectedApplication.student_name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ selectedApplication.student_no }}</el-descriptions-item>
          <el-descriptions-item label="所属单位">{{ selectedApplication.college }}</el-descriptions-item>
          <el-descriptions-item label="申请项目">
            {{ getProjectNameById(state, selectedApplication.project_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="岗位 / 原因" :span="2">
            {{ getApplicationTarget(selectedApplication) }}
          </el-descriptions-item>
          <el-descriptions-item label="相关经历" :span="2">
            {{ selectedApplication.experience || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="申请理由" :span="2">
            {{ selectedApplication.application_reason }}
          </el-descriptions-item>
          <el-descriptions-item label="情况说明" :span="2">
            {{ selectedApplication.description || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ selectedApplication.created_at }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getApplicationTagType(selectedApplication.status)" effect="light" round>
              {{ applicationStatusLabelMap[selectedApplication.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批人">{{ getApprovalUser(selectedApplication) }}</el-descriptions-item>
          <el-descriptions-item label="审批时间">{{ selectedApplication.approved_at || '待审批' }}</el-descriptions-item>
          <el-descriptions-item label="审批意见" :span="2">
            {{ selectedApplication.approval_comment || '暂无审批意见' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="operation-flow">
          <h4>操作链路</h4>
          <el-steps
            :active="getApplicationActiveStep(selectedApplication)"
            direction="vertical"
            finish-status="success"
          >
            <el-step title="学生提交申请" :description="`提交时间：${selectedApplication.created_at}`" />
            <el-step title="学院导师审批" description="原型展示节点，暂不触发真实审批" />
            <el-step
              title="项目负责人审批"
              :description="`${getApprovalResult(selectedApplication)}；审批人：${getApprovalUser(selectedApplication)}`"
            />
            <el-step
              :title="getApplicationFinalStepTitle(selectedApplication)"
              :description="getApplicationFinalStepDescription(selectedApplication)"
            />
          </el-steps>
        </div>
      </template>

      <template v-else-if="selectedMember">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="成员编号">{{ selectedMember.id }}</el-descriptions-item>
          <el-descriptions-item label="成员状态">
            <el-tag :type="getMemberTagType(selectedMember.status)" effect="light" round>
              {{ projectMemberStatusLabelMap[selectedMember.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="成员姓名">{{ selectedMember.user_name }}</el-descriptions-item>
          <el-descriptions-item label="工号 / 学号">{{ selectedMember.user_no }}</el-descriptions-item>
          <el-descriptions-item label="成员类型">{{ projectMemberTypeLabelMap[selectedMember.member_type] }}</el-descriptions-item>
          <el-descriptions-item label="所属单位">{{ selectedMember.organization }}</el-descriptions-item>
          <el-descriptions-item label="所属项目" :span="2">
            {{ getProjectNameById(state, selectedMember.project_id) }}
          </el-descriptions-item>
          <el-descriptions-item label="项目分工" :span="2">{{ selectedMember.responsibility }}</el-descriptions-item>
          <el-descriptions-item label="加入时间">{{ selectedMember.joined_at }}</el-descriptions-item>
          <el-descriptions-item label="退出时间">{{ selectedMember.exited_at || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.admin-recruitment-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #14243d;
}

.recruitment-panel,
.result-card {
  border: 1px solid rgba(198, 211, 231, 0.78);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(29, 78, 137, 0.07);
}

.recruitment-panel {
  padding: 20px;
}

.panel-header,
.result-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.panel-header h3,
.result-card-header h4,
.operation-flow h4 {
  margin: 0;
  color: #10213c;
  font-size: 20px;
}

.result-card-header p {
  margin: 6px 0 0;
  color: #7a879a;
  font-size: 13px;
}

.admin-recruitment-tabs {
  min-width: 360px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(205, 216, 235, 0.72);
  border-radius: 14px;
  background: #f8fbff;
}

.keyword-input {
  width: min(440px, 100%);
}

.filter-select {
  width: 150px;
}

.table-shell {
  overflow-x: auto;
}

.recruitment-table {
  width: 100%;
  border-radius: 12px;
}

.recruitment-table :deep(.el-table__header th) {
  background: #f5f8fd;
  color: #51647f;
  font-weight: 700;
}

.recruitment-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.primary-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.primary-cell strong {
  overflow: hidden;
  color: #14243d;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.primary-cell span {
  overflow: hidden;
  color: #8190a6;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-cell {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #7b8a9f;
  font-size: 12px;
}

.progress-meta strong,
.pending-count {
  color: #3478e5;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-card {
  padding: 18px;
  box-shadow: none;
}

.compact-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  color: #7b8a9f;
  font-size: 13px;
}

.operation-flow {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #dbe6f5;
  border-radius: 14px;
  background: #f8fbff;
}

.operation-flow h4 {
  margin-bottom: 14px;
  font-size: 16px;
}

@media (max-width: 960px) {
  .panel-header,
  .result-card-header,
  .filter-bar,
  .table-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-recruitment-tabs,
  .keyword-input,
  .filter-select {
    width: 100%;
    min-width: 0;
  }
}
</style>
