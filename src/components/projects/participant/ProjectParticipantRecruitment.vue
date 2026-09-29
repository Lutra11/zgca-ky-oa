<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  type UploadProps,
  type UploadUserFile,
} from 'element-plus'
import {
  Search,
  Upload,
  User,
} from '@element-plus/icons-vue'
import {
  applicationStatusLabels,
  applicationTypeLabels,
  canParticipantApply,
  createParticipantApplicationId,
  formatPrototypeDateTime,
  isRecruitmentOpen,
  loadParticipantRecruitmentState,
  membershipStatusLabels,
  participantProfiles,
  participantRoleLabels,
  recruitmentProjects,
  recruitTargetLabels,
  saveParticipantRecruitmentState,
  type ParticipantApplication,
  type ParticipantApplicationStatus,
  type ParticipantApplicationType,
  type ParticipantJoinDraft,
  type ParticipantMembership,
  type ParticipantMembershipStatus,
  type ParticipantRole,
  type RecruitTarget,
  type RecruitmentProject,
} from '../../../dataset/projectParticipantRecruitmentMock'
import type { LoggedInUser, RoleKey } from '../../../types/auth'

type ParticipantView = 'square' | 'applications' | 'projects'
type FilterValue = string | 'all'

interface JoinFormModel {
  phone: string
  email: string
  currentGrade: string
  major: string
  availableTime: string
  skills: string
  organization: string
  title: string
  researchDirection: string
  supportOptions: string[]
  experience: string
  reason: string
  expectedContribution: string
  attachmentName: string
  truthConfirmed: boolean
}

interface ExitFormModel {
  exitReason: string
  plannedExitDate: string
  communicatedWithLeader: boolean
  handoverDescription: string
  ruleConfirmed: boolean
}

const props = defineProps<{
  roleKey: RoleKey
  currentUser: LoggedInUser | null
  view: ParticipantView
}>()

const router = useRouter()
const state = reactive(loadParticipantRecruitmentState())

const squareFilters = reactive({
  keyword: '',
  direction: 'all' as FilterValue,
  recruitTarget: 'all' as RecruitTarget | 'all',
  condition: 'all' as FilterValue,
  quota: 'all' as 'all' | 'available' | 'full',
})

const applicationFilters = reactive({
  type: 'all' as ParticipantApplicationType | 'all',
  status: 'all' as ParticipantApplicationStatus | 'all',
})

const squarePagination = reactive({
  page: 1,
  pageSize: 8,
})

const selectedProject = shallowRef<RecruitmentProject | null>(null)
const detailDrawerVisible = shallowRef(false)
const projectDrawerVisible = shallowRef(false)
const joinDialogVisible = shallowRef(false)
const applicationDetailVisible = shallowRef(false)
const exitDialogVisible = shallowRef(false)
const previewParticipantRole = shallowRef<ParticipantRole>(
  props.roleKey === 'projectMentor' ? 'PROJECT_MENTOR' : 'PROJECT_STUDENT',
)
const selectedApplication = shallowRef<ParticipantApplication | null>(null)
const selectedMembership = shallowRef<ParticipantMembership | null>(null)
const selectedProjectTab = shallowRef<'detail' | 'members'>('detail')
const submittingJoin = shallowRef(false)
const submittingExit = shallowRef(false)

const joinUploadFiles = shallowRef<UploadUserFile[]>([])
const joinForm = reactive<JoinFormModel>({
  phone: '',
  email: '',
  currentGrade: '',
  major: '',
  availableTime: '',
  skills: '',
  organization: '',
  title: '',
  researchDirection: '',
  supportOptions: [],
  experience: '',
  reason: '',
  expectedContribution: '',
  attachmentName: '',
  truthConfirmed: false,
})

const exitForm = reactive<ExitFormModel>({
  exitReason: '',
  plannedExitDate: '',
  communicatedWithLeader: false,
  handoverDescription: '',
  ruleConfirmed: false,
})

const currentParticipantRole = computed<ParticipantRole>(() => previewParticipantRole.value)

const profile = computed(() => participantProfiles[currentParticipantRole.value])

const roleApplications = computed(() => state.applications[currentParticipantRole.value])

const roleMemberships = computed(() => state.memberships[currentParticipantRole.value])

const availableRecruitments = computed(() =>
  recruitmentProjects.filter(
    (project) =>
      isRecruitmentOpen(project) &&
      canParticipantApply(project, currentParticipantRole.value),
  ),
)

const directionOptions = computed(() => Array.from(new Set(availableRecruitments.value.map((project) => project.direction))))

const conditionOptions = computed(() =>
  Array.from(new Set(availableRecruitments.value.map((project) => project.targetCondition))),
)

const recruitTargetOptions = computed(() =>
  Array.from(new Set(availableRecruitments.value.map((project) => project.recruitTarget))),
)

const filteredRecruitments = computed(() => {
  const keyword = squareFilters.keyword.trim().toLowerCase()

  return availableRecruitments.value.filter((project) => {
    const matchesKeyword =
      !keyword ||
      [
        project.projectCode,
        project.projectName,
        project.direction,
        project.description,
        project.leaderName,
        project.positionName,
      ].some((value) => value.toLowerCase().includes(keyword))
    const matchesDirection = squareFilters.direction === 'all' || project.direction === squareFilters.direction
    const matchesRecruitTarget =
      squareFilters.recruitTarget === 'all' || project.recruitTarget === squareFilters.recruitTarget
    const matchesCondition = squareFilters.condition === 'all' || project.targetCondition === squareFilters.condition
    const matchesQuota =
      squareFilters.quota === 'all' ||
      (squareFilters.quota === 'available' && getRemainingQuota(project) > 0) ||
      (squareFilters.quota === 'full' && getRemainingQuota(project) === 0)

    return matchesKeyword && matchesDirection && matchesRecruitTarget && matchesCondition && matchesQuota
  })
})

const pagedRecruitments = computed(() => {
  const start = (squarePagination.page - 1) * squarePagination.pageSize

  return filteredRecruitments.value.slice(start, start + squarePagination.pageSize)
})

const filteredApplications = computed(() =>
  roleApplications.value.filter((application) => {
    const matchesType = applicationFilters.type === 'all' || application.applicationType === applicationFilters.type
    const matchesStatus = applicationFilters.status === 'all' || application.status === applicationFilters.status

    return matchesType && matchesStatus
  }),
)

const currentViewTitle = computed(() => {
  if (props.view === 'applications') {
    return '我的申请'
  }

  if (props.view === 'projects') {
    return '我的项目'
  }

  return '招募广场'
})

const processSteps = [
  '查看项目详情',
  '填写加入申请',
  '学院导师审批',
  '项目负责人审批',
  '加入项目或退出项目',
]

const supportOptions = [
  '学术研究指导',
  '产业资源与场景支持',
  '技术路线与阶段评审',
  '综合指导',
]

const exitReasonOptions = [
  '研究方向调整',
  '时间安排冲突',
  '个人学业或工作计划调整',
  '项目分工协商调整',
  '其他原因',
]

const studentApplicantCommitment =
  '我保证如实填写申请书各项内容。如果获准加入项目，我承诺遵守学术道德和规范，认真开展研究工作，取得预期研究成果。'

function persistState() {
  saveParticipantRecruitmentState(state)
}

function hasRouteAccess(role: ParticipantRole) {
  const targetRoleKey = role === 'PROJECT_MENTOR' ? 'projectMentor' : 'projectStudent'
  return props.currentUser?.roles.some((item) => item.key === targetRoleKey) ?? false
}

function getFallbackRouteRole(role: ParticipantRole) {
  if (hasRouteAccess(role)) {
    return role
  }

  return props.roleKey === 'projectMentor' ? 'PROJECT_MENTOR' : 'PROJECT_STUDENT'
}

function routeFor(view: ParticipantView, role = currentParticipantRole.value) {
  const routeRole = getFallbackRouteRole(role)
  const basePath = routeRole === 'PROJECT_MENTOR' ? '/project-mentor' : '/project-student'
  const segmentMap: Record<ParticipantView, string> = {
    square: 'recruitment-square',
    applications: 'recruitment-applications',
    projects: 'recruitment-projects',
  }

  return `${basePath}/${segmentMap[view]}`
}

function goToView(view: ParticipantView) {
  if (view === props.view) {
    return
  }

  router.push(routeFor(view))
}

function resetSquareFilters() {
  squareFilters.keyword = ''
  squareFilters.direction = 'all'
  squareFilters.recruitTarget = 'all'
  squareFilters.condition = 'all'
  squareFilters.quota = 'all'
  squarePagination.page = 1
}

function queryRecruitments() {
  squarePagination.page = 1
  ElMessage.success(`已查询到 ${filteredRecruitments.value.length} 个招募项目`)
}

function resetApplicationFilters() {
  applicationFilters.type = 'all'
  applicationFilters.status = 'all'
}

function openRecruitmentDetail(project: RecruitmentProject) {
  selectedProject.value = project
  detailDrawerVisible.value = true
}

function openJoinedProjectDetail(membership: ParticipantMembership) {
  selectedMembership.value = membership
  selectedProjectTab.value = 'detail'
  projectDrawerVisible.value = true
}

function isAlreadyJoined(project: RecruitmentProject) {
  return roleMemberships.value.some(
    (membership) => membership.projectId === project.id && membership.status !== 'EXITED',
  )
}

function hasPendingJoin(project: RecruitmentProject) {
  return roleApplications.value.some(
    (application) =>
      application.applicationType === 'JOIN' &&
      application.projectId === project.id &&
      application.status === 'PENDING',
  )
}

function getApplyDisabledReason(project: RecruitmentProject) {
  if (!isRecruitmentOpen(project)) {
    return '项目招募已截止'
  }

  if (!canParticipantApply(project, currentParticipantRole.value)) {
    return `当前身份不符合招募对象：${recruitTargetLabels[project.recruitTarget]}`
  }

  if (isAlreadyJoined(project)) {
    return '已是该项目成员，不能重复申请'
  }

  if (hasPendingJoin(project)) {
    return '已存在审批中的加入申请'
  }

  return ''
}

function applyProject(project: RecruitmentProject) {
  const disabledReason = getApplyDisabledReason(project)

  if (disabledReason) {
    ElMessage.warning(disabledReason)
    return
  }

  selectedProject.value = project
  restoreJoinForm(project)
  joinDialogVisible.value = true
}

function getRemainingQuota(project: RecruitmentProject) {
  return Math.max(project.plannedCount - project.hiredCount, 0)
}

function getQuotaTagType(project: RecruitmentProject) {
  return getRemainingQuota(project) > 0 ? 'success' : 'warning'
}

function getRecruitmentStatusLabel(project: RecruitmentProject) {
  return isRecruitmentOpen(project) ? '招募中' : '已结束'
}

function getRecruitmentStatusTagType(project: RecruitmentProject) {
  return isRecruitmentOpen(project) ? 'success' : 'info'
}

function resetJoinForm() {
  const currentProfile = profile.value

  joinForm.phone = currentProfile.phone
  joinForm.email = currentProfile.email
  joinForm.currentGrade = currentParticipantRole.value === 'PROJECT_STUDENT' ? '研二' : ''
  joinForm.major = currentParticipantRole.value === 'PROJECT_STUDENT' ? '人工智能' : ''
  joinForm.availableTime = currentParticipantRole.value === 'PROJECT_STUDENT' ? '每周 12 小时' : ''
  joinForm.skills = currentParticipantRole.value === 'PROJECT_STUDENT' ? 'Python、PyTorch、数据分析' : ''
  joinForm.organization = currentParticipantRole.value === 'PROJECT_MENTOR' ? currentProfile.organization : ''
  joinForm.title = currentParticipantRole.value === 'PROJECT_MENTOR' ? '副研究员' : ''
  joinForm.researchDirection = currentParticipantRole.value === 'PROJECT_MENTOR' ? '大模型安全与可信评测' : ''
  joinForm.supportOptions = currentParticipantRole.value === 'PROJECT_MENTOR' ? ['学术研究指导'] : []
  joinForm.experience = ''
  joinForm.reason = ''
  joinForm.expectedContribution = ''
  joinForm.attachmentName = ''
  joinForm.truthConfirmed = false
  joinUploadFiles.value = []
}

function restoreJoinForm(project: RecruitmentProject) {
  resetJoinForm()

  const draft = state.drafts[currentParticipantRole.value][project.id]

  if (!draft) {
    return
  }

  Object.assign(joinForm, {
    ...draft,
    supportOptions: draft.supportOptions ?? [],
    attachmentName: draft.attachmentName ?? '',
  })
  joinUploadFiles.value = joinForm.attachmentName ? [{ name: joinForm.attachmentName, url: '' }] : []
}

function getJoinDraftFromForm(): ParticipantJoinDraft {
  return {
    phone: joinForm.phone,
    email: joinForm.email,
    currentGrade: joinForm.currentGrade,
    major: joinForm.major,
    availableTime: joinForm.availableTime,
    skills: joinForm.skills,
    organization: joinForm.organization,
    title: joinForm.title,
    researchDirection: joinForm.researchDirection,
    supportOptions: joinForm.supportOptions,
    experience: joinForm.experience,
    reason: joinForm.reason,
    expectedContribution: joinForm.expectedContribution,
    attachmentName: joinForm.attachmentName,
    truthConfirmed: joinForm.truthConfirmed,
  }
}

function saveJoinDraft() {
  if (!selectedProject.value) {
    return
  }

  state.drafts[currentParticipantRole.value][selectedProject.value.id] = getJoinDraftFromForm()
  persistState()
  ElMessage.success('申请草稿已保存到本地')
}

function validateJoinForm() {
  const missingFields: string[] = []

  if (currentParticipantRole.value === 'PROJECT_STUDENT') {
    if (!joinForm.reason.trim()) missingFields.push('个人情况简介/项目相关研究背景/申请理由')
    if (!joinForm.truthConfirmed) missingFields.push('申请人承诺')

    return missingFields
  }

  if (!joinForm.phone.trim()) missingFields.push('联系电话')
  if (!joinForm.email.trim()) missingFields.push('联系邮箱')
  if (!joinForm.experience.trim()) missingFields.push('相关经历')
  if (!joinForm.reason.trim()) missingFields.push('申请理由')
  if (!joinForm.expectedContribution.trim()) missingFields.push('预期贡献')

  if (currentParticipantRole.value === 'PROJECT_MENTOR') {
    if (!joinForm.organization.trim()) missingFields.push('工作单位')
    if (!joinForm.title.trim()) missingFields.push('职称/职务')
    if (!joinForm.researchDirection.trim()) missingFields.push('研究方向')
    if (joinForm.supportOptions.length === 0) missingFields.push('可提供的项目支持')
  }

  if (!joinForm.truthConfirmed) missingFields.push('信息真实性确认')

  return missingFields
}

async function submitJoinApplication() {
  if (!selectedProject.value || submittingJoin.value) {
    return
  }

  const disabledReason = getApplyDisabledReason(selectedProject.value)

  if (disabledReason) {
    ElMessage.warning(disabledReason)
    return
  }

  const missingFields = validateJoinForm()

  if (missingFields.length > 0) {
    ElMessage.warning(`请完善：${missingFields.join('、')}`)
    return
  }

  submittingJoin.value = true

  try {
    roleApplications.value.unshift({
      id: createParticipantApplicationId('JOIN'),
      applicationType: 'JOIN',
      projectId: selectedProject.value.id,
      projectCode: selectedProject.value.projectCode,
      projectName: selectedProject.value.projectName,
      positionOrReason: selectedProject.value.positionName,
      applicantRole: currentParticipantRole.value,
      submittedAt: formatPrototypeDateTime(),
      status: 'PENDING',
      step: 2,
      attachmentName: joinForm.attachmentName || undefined,
    })
    delete state.drafts[currentParticipantRole.value][selectedProject.value.id]
    persistState()
    joinDialogVisible.value = false
    detailDrawerVisible.value = false
    ElMessage.success('加入申请已提交')
    router.push(routeFor('applications'))
  } finally {
    submittingJoin.value = false
  }
}

const beforeJoinAttachmentUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  const lowerName = rawFile.name.toLowerCase()

  if (!allowedTypes.includes(rawFile.type) && !/\.(pdf|doc|docx)$/.test(lowerName)) {
    ElMessage.warning('个人材料仅支持 PDF、DOC、DOCX 文件')
    return false
  }

  joinForm.attachmentName = rawFile.name
  joinUploadFiles.value = [{ name: rawFile.name, url: '' }]
  return false
}

function removeJoinAttachment() {
  joinForm.attachmentName = ''
  joinUploadFiles.value = []
}

function openApplicationDetail(application: ParticipantApplication) {
  selectedApplication.value = application
  applicationDetailVisible.value = true
}

async function withdrawApplication(application: ParticipantApplication) {
  if (application.status !== 'PENDING') {
    return
  }

  try {
    await ElMessageBox.confirm('撤回后该申请不再进入审批，是否确认撤回？', '撤回申请', {
      confirmButtonText: '确认撤回',
      cancelButtonText: '取消',
      type: 'warning',
      autofocus: false,
    })
    application.status = 'WITHDRAWN'
    application.step = 1

    if (application.applicationType === 'EXIT') {
      const membership = roleMemberships.value.find((item) => item.projectId === application.projectId)
      if (membership && membership.status === 'EXIT_PENDING') {
        membership.status = 'ACTIVE'
      }
    }

    persistState()
    ElMessage.success('申请已撤回')
  } catch {
    // 用户取消撤回，不需要额外处理。
  }
}

function openExitDialog(membership: ParticipantMembership) {
  if (membership.status !== 'ACTIVE') {
    ElMessage.warning('当前项目已有退出申请或成员状态不可操作')
    return
  }

  selectedMembership.value = membership
  exitForm.exitReason = ''
  exitForm.plannedExitDate = ''
  exitForm.communicatedWithLeader = false
  exitForm.handoverDescription = ''
  exitForm.ruleConfirmed = false
  exitDialogVisible.value = true
}

function validateExitForm() {
  const missingFields: string[] = []

  if (!exitForm.exitReason) missingFields.push('退出原因')
  if (!exitForm.plannedExitDate) missingFields.push('计划退出日期')
  if (!exitForm.communicatedWithLeader) missingFields.push('已与项目负责人沟通')
  if (!exitForm.handoverDescription.trim()) missingFields.push('工作交接说明')
  if (!exitForm.ruleConfirmed) missingFields.push('退出规则确认')

  return missingFields
}

async function submitExitApplication() {
  if (!selectedMembership.value || submittingExit.value) {
    return
  }

  const missingFields = validateExitForm()

  if (missingFields.length > 0) {
    ElMessage.warning(`请完善：${missingFields.join('、')}`)
    return
  }

  submittingExit.value = true

  try {
    roleApplications.value.unshift({
      id: createParticipantApplicationId('EXIT'),
      applicationType: 'EXIT',
      projectId: selectedMembership.value.projectId,
      projectCode: selectedMembership.value.projectCode,
      projectName: selectedMembership.value.projectName,
      positionOrReason: exitForm.exitReason,
      applicantRole: currentParticipantRole.value,
      submittedAt: formatPrototypeDateTime(),
      status: 'PENDING',
      step: 2,
    })
    selectedMembership.value.status = 'EXIT_PENDING'
    persistState()
    exitDialogVisible.value = false
    projectDrawerVisible.value = false
    ElMessage.success('退出申请已提交，审批通过前仍保留项目成员关系')
    router.push(routeFor('applications'))
  } finally {
    submittingExit.value = false
  }
}

function getStatusTagType(status: ParticipantApplicationStatus) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'danger'
  if (status === 'PENDING') return 'warning'
  if (status === 'WITHDRAWN') return 'info'
  return ''
}

function getMemberStatusTagType(status: ParticipantMembershipStatus) {
  if (status === 'ACTIVE') return 'success'
  if (status === 'EXIT_PENDING') return 'warning'
  return 'info'
}

function getApplicationActiveStep(application: ParticipantApplication) {
  if (application.status === 'WITHDRAWN') {
    return 0
  }

  if (application.status === 'APPROVED') {
    return 4
  }

  if (application.status === 'REJECTED') {
    return 3
  }

  return application.step
}

function previewUploadOnly() {
  ElMessage.info('原型阶段仅记录文件名称，不执行真实上传')
}

watch(
  () => [
    squareFilters.keyword,
    squareFilters.direction,
    squareFilters.recruitTarget,
    squareFilters.condition,
    squareFilters.quota,
    currentParticipantRole.value,
  ],
  () => {
    squarePagination.page = 1
  },
)

watch(
  () => [filteredRecruitments.value.length, squarePagination.pageSize],
  () => {
    const maxPage = Math.max(1, Math.ceil(filteredRecruitments.value.length / squarePagination.pageSize))

    if (squarePagination.page > maxPage) {
      squarePagination.page = maxPage
    }
  },
)

watch(
  () => props.roleKey,
  (roleKey) => {
    previewParticipantRole.value = roleKey === 'projectMentor' ? 'PROJECT_MENTOR' : 'PROJECT_STUDENT'
    resetSquareFilters()
    detailDrawerVisible.value = false
    joinDialogVisible.value = false
    applicationDetailVisible.value = false
    exitDialogVisible.value = false
  },
)
</script>

<template>
  <section class="participant-page" :aria-label="currentViewTitle">
    <section class="participant-tabs" aria-label="项目管理二级入口">
      <button :class="{ active: view === 'square' }" type="button" @click="goToView('square')">
        招募广场
      </button>
      <button :class="{ active: view === 'applications' }" type="button" @click="goToView('applications')">
        我的申请
      </button>
      <button :class="{ active: view === 'projects' }" type="button" @click="goToView('projects')">
        我的项目
      </button>
    </section>

    <template v-if="view === 'square'">
      <section class="square-overview">
        <article class="flow-card">
          <span v-for="(step, index) in processSteps" :key="step">
            <i>{{ index + 1 }}</i>{{ step }}
          </span>
        </article>
      </section>

      <section class="participant-panel recruitment-list-panel">
        <header class="panel-head">
          <div>
            <h3>招募项目列表</h3>
          </div>
        </header>

        <section class="participant-filter recruitment-list-filter">
          <el-input
            v-model="squareFilters.keyword"
            class="filter-keyword"
            :prefix-icon="Search"
            placeholder="搜索项目名称、负责人或关键词"
            clearable
            @keyup.enter="queryRecruitments"
          />
          <el-select v-model="squareFilters.direction" placeholder="研究方向">
            <el-option label="全部方向" value="all" />
            <el-option v-for="direction in directionOptions" :key="direction" :label="direction" :value="direction" />
          </el-select>
          <el-select v-model="squareFilters.recruitTarget" placeholder="招募对象">
            <el-option label="全部对象" value="all" />
            <el-option
              v-for="target in recruitTargetOptions"
              :key="target"
              :label="recruitTargetLabels[target]"
              :value="target"
            />
          </el-select>
          <el-select v-model="squareFilters.condition" placeholder="面向条件">
            <el-option label="全部条件" value="all" />
            <el-option v-for="condition in conditionOptions" :key="condition" :label="condition" :value="condition" />
          </el-select>
          <el-select v-model="squareFilters.quota" placeholder="名额状态">
            <el-option label="全部名额" value="all" />
            <el-option label="仍有名额" value="available" />
            <el-option label="名额已满" value="full" />
          </el-select>
          <el-button type="primary" @click="queryRecruitments">查询</el-button>
          <el-button @click="resetSquareFilters">重置</el-button>
        </section>

        <el-table
          v-if="filteredRecruitments.length"
          :data="pagedRecruitments"
          class="participant-table recruitment-list-table"
          row-key="id"
          stripe
        >
          <el-table-column prop="projectCode" label="项目编号" width="126" fixed="left" />
          <el-table-column label="项目名称" min-width="260" fixed="left" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="list-project-name">
                <button type="button" @click="openRecruitmentDetail(row)">
                  {{ row.projectName }}
                </button>
                <span>{{ row.description }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="direction" label="研究方向" width="138" />
          <el-table-column label="项目负责人/部门" width="150">
            <template #default="{ row }">
              <div class="leader-cell">
                <strong>{{ row.leaderName }}</strong>
                <span>{{ row.department }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="招募对象" width="112">
            <template #default="{ row }">
              <el-tag effect="light" type="primary">{{ recruitTargetLabels[row.recruitTarget as RecruitTarget] }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="positionName" label="招募岗位" min-width="168" show-overflow-tooltip />
          <el-table-column prop="targetCondition" label="面向条件" width="118" />
          <el-table-column label="计划/已录用/剩余" width="148">
            <template #default="{ row }">
              <div class="quota-cell">
                <strong>{{ row.plannedCount }} / {{ row.hiredCount }} / {{ getRemainingQuota(row) }}</strong>
                <el-tag size="small" effect="light" :type="getQuotaTagType(row)">
                  {{ getRemainingQuota(row) > 0 ? '仍有名额' : '名额已满' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="applicationDeadline" label="申请截止" width="116" />
          <el-table-column label="招募状态" width="100">
            <template #default="{ row }">
              <el-tag effect="light" :type="getRecruitmentStatusTagType(row)">
                {{ getRecruitmentStatusLabel(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="206" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button type="primary" link @click="openRecruitmentDetail(row)">查看详情</el-button>
                <el-button type="primary" link :disabled="Boolean(getApplyDisabledReason(row))" @click="applyProject(row)">
                  申请加入
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else class="participant-empty list-empty" description="暂无符合当前身份和筛选条件的招募项目">
          <el-button type="primary" @click="resetSquareFilters">重置筛选</el-button>
        </el-empty>

        <footer v-if="filteredRecruitments.length" class="participant-pagination">
          <span>显示 {{ pagedRecruitments.length }} 条，共 {{ filteredRecruitments.length }} 条</span>
          <el-pagination
            v-model:current-page="squarePagination.page"
            v-model:page-size="squarePagination.pageSize"
            :page-sizes="[6, 8, 10, 20]"
            :total="filteredRecruitments.length"
            background
            layout="total, sizes, prev, pager, next"
            @size-change="squarePagination.page = 1"
          />
        </footer>
      </section>

    </template>

    <template v-else-if="view === 'applications'">
      <section class="participant-panel">
        <header class="panel-head">
          <div>
            <h3>我的申请</h3>
          </div>
          <div class="panel-actions">
            <el-select v-model="applicationFilters.type" placeholder="申请类型">
              <el-option label="全部类型" value="all" />
              <el-option label="加入申请" value="JOIN" />
              <el-option label="退出申请" value="EXIT" />
            </el-select>
            <el-select v-model="applicationFilters.status" placeholder="申请状态">
              <el-option label="全部状态" value="all" />
              <el-option
                v-for="(label, status) in applicationStatusLabels"
                :key="status"
                :label="label"
                :value="status"
              />
            </el-select>
            <el-button @click="resetApplicationFilters">重置</el-button>
          </div>
        </header>

        <el-table v-if="filteredApplications.length" :data="filteredApplications" class="participant-table">
          <el-table-column prop="id" label="申请编号" width="168" />
          <el-table-column label="申请类型" width="110">
            <template #default="{ row }">
              <el-tag :type="row.applicationType === 'JOIN' ? 'primary' : 'warning'" effect="light">
                {{ applicationTypeLabels[row.applicationType as ParticipantApplicationType] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="projectName" label="项目名称" min-width="240" show-overflow-tooltip />
          <el-table-column prop="projectCode" label="项目编号" width="132" />
          <el-table-column prop="positionOrReason" label="申请岗位或退出原因" min-width="170" show-overflow-tooltip />
          <el-table-column prop="submittedAt" label="提交时间" width="150" />
          <el-table-column label="当前状态" width="110">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" effect="light">
                {{ applicationStatusLabels[row.status as ParticipantApplicationStatus] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="168" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button type="primary" link @click="openApplicationDetail(row)">查看详情</el-button>
                <el-button
                  v-if="row.status === 'PENDING'"
                  type="danger"
                  link
                  @click="withdrawApplication(row)"
                >
                  撤回
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-else class="participant-empty" description="暂无申请记录">
          <el-button type="primary" @click="goToView('square')">前往招募广场</el-button>
        </el-empty>
      </section>
    </template>

    <template v-else>
      <section v-if="roleMemberships.length" class="participant-panel my-project-list-panel">
        <el-table :data="roleMemberships" class="participant-table my-project-table" row-key="id">
          <el-table-column prop="projectCode" label="项目编号" width="128" fixed="left" />
          <el-table-column label="项目名称" min-width="260" fixed="left" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="strong-project-name">{{ row.projectName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="projectStatus" label="项目状态" width="110" />
          <el-table-column label="当前身份" width="116">
            <template #default="{ row }">{{ participantRoleLabels[row.applicantRole as ParticipantRole] }}</template>
          </el-table-column>
          <el-table-column prop="leaderName" label="项目负责人" width="120" />
          <el-table-column prop="department" label="所属部门" min-width="150" show-overflow-tooltip />
          <el-table-column prop="joinedAt" label="加入时间" width="120" />
          <el-table-column prop="roleInProject" label="项目角色" min-width="150" show-overflow-tooltip />
          <el-table-column prop="responsibility" label="当前分工" min-width="220" show-overflow-tooltip />
          <el-table-column label="成员状态" width="126">
            <template #default="{ row }">
              <el-tag :type="getMemberStatusTagType(row.status as ParticipantMembershipStatus)" effect="light">
                {{ membershipStatusLabels[row.status as ParticipantMembershipStatus] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目成员" width="132">
            <template #default="{ row }">
              <div class="member-avatars table-member-avatars">
                <span v-for="avatar in row.memberAvatars" :key="avatar">{{ avatar }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button type="primary" link @click="openJoinedProjectDetail(row)">查看详情</el-button>
                <el-button
                  type="primary"
                  link
                  :disabled="row.status !== 'ACTIVE'"
                  @click="openExitDialog(row)"
                >
                  申请退出
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>

      <el-empty v-else class="participant-empty" description="当前身份暂未加入项目">
        <el-button type="primary" @click="goToView('square')">前往招募广场</el-button>
      </el-empty>
    </template>

    <el-drawer v-model="detailDrawerVisible" size="540px" class="participant-drawer">
      <template #header>
        <div class="drawer-title">
          <span>项目详情</span>
          <strong>{{ selectedProject?.projectName }}</strong>
        </div>
      </template>

      <template v-if="selectedProject">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="项目编号">{{ selectedProject.projectCode }}</el-descriptions-item>
          <el-descriptions-item label="研究方向">{{ selectedProject.direction }}</el-descriptions-item>
          <el-descriptions-item label="项目负责人">{{ selectedProject.leaderName }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ selectedProject.department }}</el-descriptions-item>
          <el-descriptions-item label="招募对象">{{ recruitTargetLabels[selectedProject.recruitTarget] }}</el-descriptions-item>
          <el-descriptions-item label="招募岗位">{{ selectedProject.positionName }}</el-descriptions-item>
          <el-descriptions-item label="面向条件">{{ selectedProject.targetCondition }}</el-descriptions-item>
          <el-descriptions-item label="计划人数">{{ selectedProject.plannedCount }} 人</el-descriptions-item>
          <el-descriptions-item label="已录用人数">{{ selectedProject.hiredCount }} 人</el-descriptions-item>
          <el-descriptions-item label="申请截止时间">{{ selectedProject.applicationDeadline }}</el-descriptions-item>
        </el-descriptions>

        <section class="drawer-section">
          <h4>项目简介</h4>
          <p>{{ selectedProject.description }}</p>
        </section>
        <section class="drawer-section">
          <h4>主要工作内容</h4>
          <p>{{ selectedProject.workContent }}</p>
        </section>
        <section class="drawer-section">
          <h4>能力要求</h4>
          <p>{{ selectedProject.requirements }}</p>
        </section>
      </template>

      <template #footer>
        <el-button @click="detailDrawerVisible = false">关闭</el-button>
        <el-button
          v-if="selectedProject"
          type="primary"
          :disabled="Boolean(getApplyDisabledReason(selectedProject))"
          @click="applyProject(selectedProject)"
        >
          填写信息并申请加入
        </el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="projectDrawerVisible" size="560px" class="participant-drawer">
      <template #header>
        <div class="drawer-title">
          <span>我的项目详情</span>
          <strong>{{ selectedMembership?.projectName }}</strong>
        </div>
      </template>

      <template v-if="selectedMembership">
        <el-tabs v-model="selectedProjectTab">
          <el-tab-pane label="项目概况" name="detail">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="项目编号">{{ selectedMembership.projectCode }}</el-descriptions-item>
              <el-descriptions-item label="项目状态">{{ selectedMembership.projectStatus }}</el-descriptions-item>
              <el-descriptions-item label="当前用户身份">{{ participantRoleLabels[selectedMembership.applicantRole] }}</el-descriptions-item>
              <el-descriptions-item label="项目负责人">{{ selectedMembership.leaderName }}</el-descriptions-item>
              <el-descriptions-item label="所属部门">{{ selectedMembership.department }}</el-descriptions-item>
              <el-descriptions-item label="加入时间">{{ selectedMembership.joinedAt }}</el-descriptions-item>
              <el-descriptions-item label="本人项目角色">{{ selectedMembership.roleInProject }}</el-descriptions-item>
              <el-descriptions-item label="当前成员状态">
                {{ membershipStatusLabels[selectedMembership.status] }}
              </el-descriptions-item>
            </el-descriptions>
            <section class="drawer-section">
              <h4>当前工作分工</h4>
              <p>{{ selectedMembership.responsibility }}</p>
            </section>
          </el-tab-pane>
          <el-tab-pane label="成员信息" name="members">
            <div class="drawer-members">
              <span v-for="avatar in selectedMembership.memberAvatars" :key="avatar">{{ avatar }}</span>
            </div>
            <p class="drawer-tip">原型仅展示成员头像缩写，真实成员明细由后端项目成员接口提供。</p>
          </el-tab-pane>
        </el-tabs>
      </template>

      <template #footer>
        <el-button @click="projectDrawerVisible = false">关闭</el-button>
        <el-button
          v-if="selectedMembership"
          type="primary"
          :disabled="selectedMembership.status !== 'ACTIVE'"
          @click="openExitDialog(selectedMembership)"
        >
          申请退出项目
        </el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="joinDialogVisible" width="760px" class="participant-dialog" title="填写加入申请">
      <template v-if="selectedProject">
        <el-form v-if="currentParticipantRole === 'PROJECT_STUDENT'" class="join-form student-join-form" label-position="top">
          <el-form-item label="个人情况简介/项目相关研究背景/申请理由：">
            <el-input
              v-model="joinForm.reason"
              type="textarea"
              :rows="8"
              maxlength="800"
              show-word-limit
              placeholder="请填写个人情况简介、项目相关研究背景或申请加入该项目的理由"
            />
          </el-form-item>

          <section class="student-commitment">
            <h4>申请人承诺：</h4>
            <p>{{ studentApplicantCommitment }}</p>
          </section>

          <el-checkbox v-model="joinForm.truthConfirmed" class="student-agreement">同意</el-checkbox>
        </el-form>

        <el-form v-else class="join-form" label-position="top">
          <section class="form-grid">
            <el-form-item label="申请人姓名">
              <el-input :model-value="profile.name" readonly />
            </el-form-item>
            <el-form-item label="用户编号">
              <el-input :model-value="profile.userCode" readonly />
            </el-form-item>
            <el-form-item label="申请身份">
              <el-input :model-value="profile.roleName" readonly />
            </el-form-item>
            <el-form-item label="申请项目">
              <el-input :model-value="selectedProject.projectName" readonly />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="joinForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item label="联系邮箱">
              <el-input v-model="joinForm.email" placeholder="请输入联系邮箱" />
            </el-form-item>
            <el-form-item label="申请岗位">
              <el-input :model-value="selectedProject.positionName" readonly />
            </el-form-item>
          </section>

          <section class="form-grid">
            <el-form-item label="工作单位">
              <el-input v-model="joinForm.organization" placeholder="请输入工作单位" />
            </el-form-item>
            <el-form-item label="职称/职务">
              <el-input v-model="joinForm.title" placeholder="请输入职称或职务" />
            </el-form-item>
            <el-form-item label="研究方向">
              <el-input v-model="joinForm.researchDirection" placeholder="请输入研究方向" />
            </el-form-item>
            <el-form-item label="可提供的项目支持">
              <el-select v-model="joinForm.supportOptions" multiple placeholder="请选择支持类型">
                <el-option v-for="item in supportOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </section>

          <el-form-item label="科研、产业及项目指导经历">
            <el-input
              v-model="joinForm.experience"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="请填写与项目相关的经历"
            />
          </el-form-item>
          <el-form-item label="申请理由">
            <el-input
              v-model="joinForm.reason"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="请说明申请加入该项目的原因"
            />
          </el-form-item>
          <el-form-item label="预期贡献">
            <el-input
              v-model="joinForm.expectedContribution"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="请说明可为项目提供的贡献"
            />
          </el-form-item>
          <el-form-item label="个人简历或相关成果材料">
            <el-upload
              v-model:file-list="joinUploadFiles"
              :auto-upload="false"
              :limit="1"
              :before-upload="beforeJoinAttachmentUpload"
              :on-remove="removeJoinAttachment"
            >
              <el-button :icon="Upload" @click="previewUploadOnly">选择文件</el-button>
              <template #tip>
                <div class="upload-tip">支持 PDF、DOC、DOCX。原型阶段仅保存文件名，不执行真实上传。</div>
              </template>
            </el-upload>
          </el-form-item>
          <el-checkbox v-model="joinForm.truthConfirmed">
            我确认以上信息真实有效，并同意项目负责人按流程进行审核。
          </el-checkbox>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="joinDialogVisible = false">取消</el-button>
        <el-button v-if="currentParticipantRole !== 'PROJECT_STUDENT'" @click="saveJoinDraft">保存草稿</el-button>
        <el-button type="primary" :loading="submittingJoin" @click="submitJoinApplication">提交加入申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="applicationDetailVisible" width="620px" title="申请详情">
      <template v-if="selectedApplication">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号">{{ selectedApplication.id }}</el-descriptions-item>
          <el-descriptions-item label="申请类型">
            {{ applicationTypeLabels[selectedApplication.applicationType] }}
          </el-descriptions-item>
          <el-descriptions-item label="项目名称" :span="2">{{ selectedApplication.projectName }}</el-descriptions-item>
          <el-descriptions-item label="项目编号">{{ selectedApplication.projectCode }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            {{ applicationStatusLabels[selectedApplication.status] }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ selectedApplication.submittedAt }}</el-descriptions-item>
          <el-descriptions-item label="审批意见">
            {{ selectedApplication.approvalComment || '暂无审批意见' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-steps class="application-steps" :active="getApplicationActiveStep(selectedApplication)" finish-status="success">
          <el-step title="提交申请" />
          <el-step title="学院导师审批" description="原型展示节点，暂不触发真实审批" />
          <el-step title="项目负责人审批" />
          <el-step :title="selectedApplication.applicationType === 'JOIN' ? '加入项目' : '结束成员关系'" />
        </el-steps>
      </template>
    </el-dialog>

    <el-dialog v-model="exitDialogVisible" width="680px" title="申请退出项目">
      <template v-if="selectedMembership">
        <el-form class="join-form" label-position="top">
          <section class="form-grid">
            <el-form-item label="退出项目">
              <el-input :model-value="selectedMembership.projectName" readonly />
            </el-form-item>
            <el-form-item label="当前身份">
              <el-input :model-value="profile.roleName" readonly />
            </el-form-item>
            <el-form-item label="当前项目职责" class="form-span-2">
              <el-input :model-value="selectedMembership.responsibility" readonly />
            </el-form-item>
            <el-form-item label="退出原因">
              <el-select v-model="exitForm.exitReason" placeholder="请选择退出原因">
                <el-option v-for="reason in exitReasonOptions" :key="reason" :label="reason" :value="reason" />
              </el-select>
            </el-form-item>
            <el-form-item label="计划退出日期">
              <el-date-picker
                v-model="exitForm.plannedExitDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择计划退出日期"
              />
            </el-form-item>
          </section>

          <el-form-item label="工作交接说明">
            <el-input
              v-model="exitForm.handoverDescription"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              placeholder="请说明当前工作、资料交接和后续影响"
            />
          </el-form-item>

          <div class="confirm-stack">
            <el-checkbox v-model="exitForm.communicatedWithLeader">已与项目负责人沟通退出事项</el-checkbox>
            <el-checkbox v-model="exitForm.ruleConfirmed">我了解审批通过前仍属于项目成员，不能立即删除成员关系</el-checkbox>
          </div>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="exitDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingExit" @click="submitExitApplication">提交退出申请</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.participant-page {
  display: grid;
  gap: 18px;
}

.participant-panel,
.participant-filter,
.square-overview,
.participant-tabs {
  border: 1px solid #dbe6f5;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(45, 88, 148, 0.08);
}

.member-avatars span,
.drawer-members span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eaf2ff;
  color: #3478e5;
  font-weight: 700;
}

.participant-tabs {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.participant-tabs button {
  min-width: 110px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #65758e;
  font-weight: 700;
  cursor: pointer;
  padding: 10px 18px;
  transition: all 0.18s ease;
}

.participant-tabs button:hover {
  background: #f4f7fc;
  color: #3478e5;
}

.participant-tabs button.active {
  background: #3478e5;
  color: #fff;
  box-shadow: 0 8px 18px rgba(52, 120, 229, 0.2);
}

.square-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  padding: 16px;
}

.flow-card {
  border: 1px solid #e2eaf6;
  border-radius: 12px;
  background: #f8fbff;
}

.flow-card {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: center;
  gap: 10px;
  padding: 14px;
}

.flow-card span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #41516a;
  font-size: 13px;
  white-space: nowrap;
}

.flow-card i {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #3478e5;
  color: #fff;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}

.participant-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
}

.filter-keyword {
  width: 320px;
}

.participant-filter :deep(.el-select) {
  width: 170px;
}

.recruitment-list-panel {
  overflow: hidden;
  padding: 20px;
}

.recruitment-list-filter {
  display: grid;
  grid-template-columns: minmax(260px, 1.4fr) repeat(4, minmax(128px, 0.75fr)) auto auto;
  align-items: center;
  margin-bottom: 16px;
  border-color: #e4edf8;
  padding: 14px;
  background: #f8fbff;
  box-shadow: none;
}

.recruitment-list-filter :deep(.el-select) {
  width: 100%;
}

.recruitment-list-table {
  overflow: hidden;
  border: 1px solid #e3ebf6;
  border-radius: 12px;
}

.recruitment-list-table :deep(.el-table__header th) {
  color: #60718a;
  background: #f6f9fe;
  font-weight: 800;
}

.recruitment-list-table :deep(.el-table__cell) {
  padding: 9px 0;
}

.list-project-name,
.leader-cell,
.quota-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.list-project-name button {
  overflow: hidden;
  border: 0;
  padding: 0;
  color: #12284a;
  background: transparent;
  cursor: pointer;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 800;
}

.list-project-name button:hover {
  color: #3478e5;
}

.list-project-name span,
.leader-cell span {
  overflow: hidden;
  color: #7b8ba1;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.leader-cell strong,
.quota-cell strong {
  color: #253a59;
  font-size: 13px;
  font-weight: 760;
}

.quota-cell :deep(.el-tag) {
  width: fit-content;
}

.participant-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #edf2f8;
}

.participant-pagination > span {
  color: #7b8ba1;
  font-size: 13px;
}

.list-empty {
  min-height: 260px;
  border-style: dashed;
  box-shadow: none;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.code {
  color: #7e8da3;
  font-size: 12px;
}

.panel-head h3 {
  margin: 6px 0 0;
  color: #12284a;
  font-size: 17px;
}

.project-desc,
.responsibility {
  min-height: 48px;
  margin: 14px 0;
  color: #60718a;
  line-height: 1.7;
}

.project-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
}

.project-meta span {
  min-width: 0;
  color: #253a59;
  font-size: 13px;
}

.project-meta b {
  display: block;
  margin-bottom: 4px;
  color: #8a98ad;
  font-size: 12px;
  font-weight: 500;
}

.project-meta.compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.deadline {
  color: #d9822b;
  font-size: 13px;
}

.participant-panel {
  padding: 20px;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-head p {
  margin: 6px 0 0;
  color: #7b8ba1;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-actions :deep(.el-select) {
  width: 150px;
}

.participant-table {
  width: 100%;
}

.table-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.member-avatars {
  display: flex;
  align-items: center;
}

.member-avatars span {
  width: 30px;
  height: 30px;
  margin-left: -8px;
  border: 2px solid #fff;
  background: #f0f6ff;
}

.member-avatars span:first-child {
  margin-left: 0;
}

.participant-empty {
  min-height: 280px;
  border: 1px solid #dbe6f5;
  border-radius: 14px;
  background: #fff;
}

.drawer-title span,
.drawer-title strong {
  display: block;
}

.drawer-title span {
  color: #7b8ba1;
  font-size: 12px;
}

.drawer-title strong {
  margin-top: 4px;
  color: #12284a;
  font-size: 18px;
}

.drawer-section {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #e1e9f5;
  border-radius: 12px;
  background: #f9fbff;
}

.drawer-section h4 {
  margin: 0 0 8px;
  color: #12284a;
}

.drawer-section p {
  margin: 0;
  color: #60718a;
  line-height: 1.8;
}

.drawer-members {
  display: flex;
  gap: 12px;
  padding: 18px 0;
}

.drawer-members span {
  width: 46px;
  height: 46px;
}

.drawer-tip {
  color: #7c8aa0;
}

.join-form {
  max-height: 62vh;
  overflow: auto;
  padding-right: 6px;
}

.student-join-form {
  display: grid;
  gap: 14px;
  max-height: none;
  overflow: visible;
  padding-right: 0;
}

.student-commitment {
  min-height: 116px;
  padding: 14px 16px;
  border: 1px solid #d8e2ef;
  border-radius: 10px;
  background: #fbfdff;
}

.student-commitment h4 {
  margin: 0 0 12px;
  color: #1e3352;
  font-size: 15px;
  font-weight: 760;
}

.student-commitment p {
  margin: 0;
  color: #26384f;
  font-size: 15px;
  line-height: 2;
  text-indent: 2em;
}

.student-agreement {
  width: fit-content;
  padding: 8px 14px;
  border: 1px solid #dbe6f3;
  border-radius: 999px;
  background: #f6f9fe;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-span-2 {
  grid-column: 1 / -1;
}

.upload-tip {
  color: #8a98ad;
  font-size: 12px;
  line-height: 1.6;
}

.confirm-stack {
  display: grid;
  gap: 8px;
}

.application-steps {
  margin-top: 24px;
}

:deep(.participant-drawer .el-drawer__footer) {
  border-top: 1px solid #edf2f8;
}

@media (max-width: 1440px) {
  .recruitment-list-filter {
    grid-template-columns: minmax(260px, 1fr) repeat(2, minmax(150px, 0.6fr)) auto auto;
  }
}

@media (max-width: 1100px) {
  .participant-filter,
  .panel-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-keyword,
  .participant-filter :deep(.el-select),
  .panel-actions,
  .panel-actions :deep(.el-select) {
    width: 100%;
  }

  .participant-filter,
  .panel-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .participant-pagination {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
