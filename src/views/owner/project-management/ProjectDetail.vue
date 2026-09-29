<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Back,
  Calendar,
  CircleCheckFilled,
  Clock,
  Document,
  Download,
  Edit,
  User,
  VideoPlay,
  View,
  WarningFilled,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import projectDetailsDataset from '../../../dataset/project_details.json'
import monitorProgressDataset from '../../../dataset/monitor_progress.json'
import reviewResultsDataset from '../../../dataset/review_results.json'
import subdirectionReviewDataset from '../../../dataset/subdirection_review_management.json'

type ProjectStatus = '申报中' | '评审中' | '执行中' | '已结项' | '已终止'
type StageStatus = 'done' | 'active' | 'pending'
type RiskLevel = 'danger' | 'warning' | 'info' | 'success'

interface ProjectDescription {
  goal: string
  content: string
  applicationValue: string
}

interface ProjectMember {
  name: string
  role: string
  department: string
  title: string
  phone: string
  email: string
  joinedAt: string
}

interface ReviewInfo {
  launched: boolean
  reviewName: string
  reviewPeriod: string
  reviewers: string[]
  assignedCount: number
  submittedCount: number
  evaluationRequired: number
  evaluationCompleted: number
  result: string
  comments: string
}

interface ProjectMaterial {
  name: string
  type: string
  format: string
  uploader: string
  uploadedAt: string
  status: string
}

interface ProgressStage {
  key: string
  label: string
  startTime: string
  endTime: string
  owner: string
  status: StageStatus
  result: string
}

interface TimelineItem {
  date: string
  title: string
  operator: string
  note: string
  status: StageStatus
}

interface RiskItem {
  id: string
  level: RiskLevel
  title: string
  description: string
  action: string
}

interface OperationLog {
  operator: string
  type: string
  content: string
  time: string
}

interface ContactInfo {
  projectSource: string
  researchField: string
  keywords: string
  resultForms: string
  partner: string
  partnerStartDate: string
  partnerEndDate: string
  remark: string
  department: string
  contactPerson: string
  phone: string
  email: string
}

interface ProjectDetail {
  id: string
  projectCode: string
  projectName: string
  projectType: string
  projectBatch: string
  status: ProjectStatus
  faculty: string
  subDirection: string
  projectLeader: string
  subDirectionLeader: string
  establishmentDate: string
  plannedStartDate: string
  plannedEndDate: string
  description: ProjectDescription
  budget: number
  usedBudget: number
  expectedResults: number
  completedResults: number
  paperCount: number
  tags: string[]
  members: ProjectMember[]
  reviewInfo: ReviewInfo
  materials: ProjectMaterial[]
  progressStages: ProgressStage[]
  timeline: TimelineItem[]
  risks: RiskItem[]
  operationLogs: OperationLog[]
  contactInfo: ContactInfo
}

interface MonitorProject {
  id: string
  projectCode: string
  batch: string
  projectType: string
  subDirection: string
  faculty: string
  projectName: string
  principal: string
  reviewers: string[]
  evaluationRequired: number
  evaluationCompleted: number
  materialSubmitted: boolean
  reviewCompleted: boolean
  materialSubmittedAt: string
  reviewerAssignedAt: string
  evaluationUpdatedAt: string
  reviewCompletedAt: string
}

interface ReviewResultProject {
  id: string
  projectCode: string
  projectName: string
  principal: string
  subDirection: string
  score: number
  recommendedLevel: 'A' | 'B' | 'C' | 'D'
  finalLevel: 'A' | 'B' | 'C' | 'D'
  subDirectionComment: string
  facultyComment: string
  adjustReason: string
}

interface FacultyReviewResult {
  faculty: string
  status: string
  submittedAt: string
  summary: string
  projects: ReviewResultProject[]
}

interface SubdirectionReviewProject {
  id: string
  projectCode: string
  projectName: string
  projectType: string
  faculty: string
  subDirection: string
  principal: string
  batch: string
  assignedReviewerIds: string[]
  reviewStartAt: string
  reviewEndAt: string
  materialSubmitted: boolean
}

interface SubdirectionReviewTask {
  reviewName: string
  reviewPeriod: [string, string]
  subDirectionLeaderName: string
  projects: SubdirectionReviewProject[]
}

interface SubdirectionReviewDataset {
  tasks: SubdirectionReviewTask[]
}

interface DescriptionItem {
  label: string
  value: string
}

interface MetricCard {
  key: string
  label: string
  value: string
  tone: string
  icon: Component
}

const route = useRoute()
const router = useRouter()
const activeTab = shallowRef('overview')
const projectDetails = projectDetailsDataset as ProjectDetail[]
const monitorProjects = monitorProgressDataset as MonitorProject[]
const reviewResults = reviewResultsDataset as FacultyReviewResult[]
const subdirectionReviews = subdirectionReviewDataset as unknown as SubdirectionReviewDataset
const isResearchDepartmentLeaderRoute = computed(
  () => route.meta.roleKey === 'researchDepartmentLeader',
)
const isSubdirectionLeaderRoute = computed(() => route.meta.roleKey === 'projectLeader')
const isResearchProjectAdminRoute = computed(() => route.meta.roleKey === 'researchProjectAdmin')
const listPath = computed(() =>
  isResearchDepartmentLeaderRoute.value
    ? '/research-dept-leader/review-projects'
    : isSubdirectionLeaderRoute.value
      ? '/sub-direction-leader/review-management'
    : '/research-project-admin/project-management',
)

const tabItems = [
  { name: 'overview', label: '项目概览' },
  { name: 'members', label: '项目成员' },
  { name: 'review', label: '评审信息' },
  { name: 'materials', label: '项目材料' },
  { name: 'progress', label: '项目进度' },
  { name: 'logs', label: '操作记录' },
]

const projectId = computed(() => decodeURIComponent(String(route.params.projectId ?? '')))

const detailProject = computed(() =>
  projectDetails.find((item) => item.projectCode === projectId.value || item.id === projectId.value),
)

const monitorProject = computed(() =>
  monitorProjects.find((item) => item.projectCode === projectId.value || item.id === projectId.value),
)

const reviewResultProject = computed(() => {
  for (const result of reviewResults) {
    const project = result.projects.find((item) => item.projectCode === projectId.value || item.id === projectId.value)

    if (project) {
      return {
        faculty: result.faculty,
        submittedAt: result.submittedAt,
        project,
      }
    }
  }

  return null
})

const subdirectionReviewProject = computed(() => {
  for (const task of subdirectionReviews.tasks) {
    const project = task.projects.find((item) => item.projectCode === projectId.value || item.id === projectId.value)

    if (project) {
      return {
        task,
        project,
      }
    }
  }

  return null
})

const project = computed<ProjectDetail | null>(() => {
  if (detailProject.value) {
    return detailProject.value
  }

  if (monitorProject.value) {
    return createProjectDetailFromMonitor(monitorProject.value)
  }

  if (subdirectionReviewProject.value) {
    return createProjectDetailFromSubdirection(
      subdirectionReviewProject.value.project,
      subdirectionReviewProject.value.task,
    )
  }

  return reviewResultProject.value
    ? createProjectDetailFromReviewResult(reviewResultProject.value.project, reviewResultProject.value.faculty)
    : null
})

const baseInfoItems = computed<DescriptionItem[]>(() => {
  if (!project.value) {
    return []
  }

  return [
    { label: '所属学部', value: project.value.faculty },
    { label: '所属子方向', value: project.value.subDirection },
    { label: '项目负责人', value: project.value.projectLeader },
    { label: '子方向负责人', value: project.value.subDirectionLeader },
    { label: '立项时间', value: project.value.establishmentDate },
    { label: '计划开始时间', value: project.value.plannedStartDate },
    { label: '计划结束时间', value: project.value.plannedEndDate },
    { label: '当前状态', value: project.value.status },
  ]
})

const supplementItems = computed<DescriptionItem[]>(() => {
  if (!project.value) {
    return []
  }

  const contact = project.value.contactInfo

  return [
    { label: '项目来源', value: contact.projectSource },
    { label: '研究领域', value: contact.researchField },
    { label: '项目关键词', value: contact.keywords },
    { label: '成果形式', value: contact.resultForms },
    { label: '合作单位', value: contact.partner },
    { label: '合作开始时间', value: contact.partnerStartDate },
    { label: '合作结束时间', value: contact.partnerEndDate },
    { label: '备注', value: contact.remark },
    { label: '项目所在部门', value: contact.department },
    { label: '项目联系人', value: contact.contactPerson },
    { label: '联系电话', value: contact.phone },
    { label: '联系邮箱', value: contact.email },
  ]
})

const budgetUsageRate = computed(() => {
  if (!project.value?.budget) {
    return 0
  }

  return Number(((project.value.usedBudget / project.value.budget) * 100).toFixed(2))
})

const overviewMetrics = computed<MetricCard[]>(() => {
  if (!project.value) {
    return []
  }

  return [
    {
      key: 'budget',
      label: '项目预算',
      value: `${formatAmount(project.value.budget)} 万元`,
      tone: 'orange',
      icon: Calendar,
    },
    {
      key: 'usedBudget',
      label: '已使用预算',
      value: `${formatAmount(project.value.usedBudget)} 万元`,
      tone: 'blue',
      icon: Document,
    },
    {
      key: 'budgetRate',
      label: '预算使用率',
      value: `${budgetUsageRate.value}%`,
      tone: 'indigo',
      icon: Clock,
    },
    {
      key: 'expectedResults',
      label: '预期成果',
      value: `${project.value.expectedResults} 项`,
      tone: 'purple',
      icon: User,
    },
    {
      key: 'completedResults',
      label: '已完成成果',
      value: `${project.value.completedResults} 项`,
      tone: 'green',
      icon: CircleCheckFilled,
    },
    {
      key: 'paperCount',
      label: '论文发表',
      value: `${project.value.paperCount} 篇`,
      tone: 'violet',
      icon: Document,
    },
  ]
})

const currentStageIndex = computed(() => {
  const stages = project.value?.progressStages ?? []
  const activeIndex = stages.findIndex((stage) => stage.status === 'active')

  if (activeIndex >= 0) {
    return activeIndex
  }

  const lastDoneIndex = stages.map((stage) => stage.status).lastIndexOf('done')
  return lastDoneIndex >= 0 ? lastDoneIndex + 1 : 0
})

const overallProgress = computed(() => {
  const stages = project.value?.progressStages ?? []

  if (!stages.length) {
    return 0
  }

  const weight = stages.reduce((total, stage) => {
    if (stage.status === 'done') {
      return total + 1
    }

    if (stage.status === 'active') {
      return total + 0.25
    }

    return total
  }, 0)

  return Math.min(100, Math.round((weight / stages.length) * 100))
})

const nextTimelineNode = computed(() => {
  const timeline = project.value?.timeline ?? []
  return timeline.find((item) => item.status !== 'done') ?? timeline[timeline.length - 1]
})

const remainingTimeLabel = computed(() => {
  if (!nextTimelineNode.value) {
    return '-'
  }

  const targetTime = new Date(nextTimelineNode.value.date.replace(/-/g, '/')).getTime()
  const diffDays = Math.ceil((targetTime - Date.now()) / 86400000)

  if (Number.isNaN(targetTime)) {
    return '-'
  }

  if (diffDays < 0) {
    return '已到期'
  }

  if (diffDays === 0) {
    return '今日截止'
  }

  return `${diffDays}天`
})

const reviewMetrics = computed(() => {
  const reviewInfo = project.value?.reviewInfo

  if (!reviewInfo) {
    return []
  }

  return [
    {
      label: '评委分配',
      value: `${reviewInfo.assignedCount}/${reviewInfo.reviewers.length || reviewInfo.assignedCount}`,
      percent: reviewInfo.reviewers.length ? getPercent(reviewInfo.assignedCount, reviewInfo.reviewers.length) : 100,
    },
    {
      label: '评审提交',
      value: `${reviewInfo.submittedCount}/${reviewInfo.assignedCount}`,
      percent: getPercent(reviewInfo.submittedCount, reviewInfo.assignedCount),
    },
    {
      label: '360 环评',
      value: `${reviewInfo.evaluationCompleted}/${reviewInfo.evaluationRequired}`,
      percent: getPercent(reviewInfo.evaluationCompleted, reviewInfo.evaluationRequired),
    },
  ]
})

function createProjectDetailFromSubdirection(
  project: SubdirectionReviewProject,
  task: SubdirectionReviewTask,
): ProjectDetail {
  const detail = createProjectDetailFromMonitor({
    id: project.id,
    projectCode: project.projectCode,
    batch: project.batch,
    projectType: project.projectType,
    subDirection: project.subDirection,
    faculty: project.faculty,
    projectName: project.projectName,
    principal: project.principal,
    reviewers: project.assignedReviewerIds,
    evaluationRequired: Math.max(1, project.assignedReviewerIds.length || 3),
    evaluationCompleted: project.assignedReviewerIds.length,
    materialSubmitted: project.materialSubmitted,
    reviewCompleted: false,
    materialSubmittedAt: project.materialSubmitted ? '2026-03-01 09:00' : '',
    reviewerAssignedAt: project.reviewStartAt,
    evaluationUpdatedAt: project.reviewStartAt,
    reviewCompletedAt: '',
  })

  return {
    ...detail,
    projectBatch: project.batch,
    subDirectionLeader: task.subDirectionLeaderName,
    reviewInfo: {
      ...detail.reviewInfo,
      reviewName: task.reviewName,
      reviewPeriod: `${task.reviewPeriod[0]} 至 ${task.reviewPeriod[1]}`,
      result: project.reviewStartAt && project.reviewEndAt ? '评审中' : '待配置',
      comments: '该项目来自子方向负责人评审管理配置，评委与评审时间可在评审管理中继续调整。',
    },
    operationLogs: [
      {
        operator: task.subDirectionLeaderName,
        type: '评审配置',
        content: project.reviewStartAt && project.reviewEndAt ? '已设置评审时间' : '评审时间待设置',
        time: project.reviewStartAt || task.reviewPeriod[0],
      },
      ...detail.operationLogs,
    ],
  }
}

function createProjectDetailFromReviewResult(project: ReviewResultProject, faculty: string): ProjectDetail {
  const detail = createProjectDetailFromMonitor({
    id: project.id,
    projectCode: project.projectCode,
    batch: '评审结果批次',
    projectType: '科研评审项目',
    subDirection: project.subDirection,
    faculty,
    projectName: project.projectName,
    principal: project.principal,
    reviewers: ['评审专家组'],
    evaluationRequired: 10,
    evaluationCompleted: 10,
    materialSubmitted: true,
    reviewCompleted: true,
    materialSubmittedAt: '2026-03-01 09:00',
    reviewerAssignedAt: '2026-03-05 09:00',
    evaluationUpdatedAt: '2026-03-20 16:00',
    reviewCompletedAt: '2026-03-24 16:30',
  })

  return {
    ...detail,
    status: '执行中',
    reviewInfo: {
      ...detail.reviewInfo,
      result: `最终评级 ${project.finalLevel}`,
      comments: `${project.subDirectionComment} ${project.facultyComment}`.trim(),
    },
    tags: [...detail.tags, `推荐评级${project.recommendedLevel}`, `最终评级${project.finalLevel}`],
    operationLogs: [
      {
        operator: '学部负责人',
        type: '确认评级',
        content: `项目最终评级为 ${project.finalLevel}，得分 ${project.score}`,
        time: '2026-03-24 16:30',
      },
      ...detail.operationLogs,
    ],
  }
}

function createProjectDetailFromMonitor(item: MonitorProject): ProjectDetail {
  const status = getStatusFromMonitor(item)
  const hasReviewers = item.reviewers.length > 0
  const evaluationDone = item.evaluationRequired > 0 && item.evaluationCompleted >= item.evaluationRequired

  return {
    id: `detail-${item.projectCode}`,
    projectCode: item.projectCode,
    projectName: item.projectName,
    projectType: item.projectType,
    projectBatch: item.batch,
    status,
    faculty: item.faculty,
    subDirection: item.subDirection,
    projectLeader: item.principal,
    subDirectionLeader: item.reviewers[0] ?? '未指定',
    establishmentDate: item.materialSubmittedAt ? item.materialSubmittedAt.slice(0, 10) : '2026-04-10',
    plannedStartDate: '2026-04-15',
    plannedEndDate: '2027-04-14',
    description: {
      goal: `围绕${item.subDirection}方向开展科研项目建设，形成可评价、可追踪、可沉淀的阶段成果。`,
      content: `项目聚焦“${item.projectName}”，结合项目申报、材料提交、专家评审和阶段执行过程开展研究。`,
      applicationValue: '为科研项目管理、成果转化和跨学科协同提供可复用的研究经验与管理数据。'
    },
    budget: 100,
    usedBudget: item.reviewCompleted ? 76.8 : item.materialSubmitted ? 42.6 : 18.4,
    expectedResults: 3,
    completedResults: item.reviewCompleted ? 3 : item.materialSubmitted ? 1 : 0,
    paperCount: item.reviewCompleted ? 2 : 0,
    tags: [item.subDirection, item.projectType, item.faculty, '科研项目', '阶段评审'],
    members: [
      {
        name: item.principal,
        role: '项目负责人',
        department: item.faculty,
        title: '研究员',
        phone: '138-0000-0000',
        email: `${item.projectCode.toLowerCase()}@ai-institute.edu.cn`,
        joinedAt: '2026-04-10',
      },
      {
        name: item.reviewers[0] ?? '待指定成员',
        role: '项目成员',
        department: item.subDirection,
        title: '工程师',
        phone: '137-0000-0000',
        email: 'member@ai-institute.edu.cn',
        joinedAt: '2026-04-12',
      },
    ],
    reviewInfo: {
      launched: hasReviewers,
      reviewName: `${item.batch}项目评审`,
      reviewPeriod: '2026-07-12 09:00 至 2026-07-25 18:00',
      reviewers: item.reviewers,
      assignedCount: item.reviewers.length,
      submittedCount: item.reviewCompleted ? item.reviewers.length : Math.min(item.reviewers.length, Math.max(0, item.evaluationCompleted - 1)),
      evaluationRequired: item.evaluationRequired,
      evaluationCompleted: item.evaluationCompleted,
      result: item.reviewCompleted ? '通过' : hasReviewers ? '评审中' : '未发起',
      comments: item.reviewCompleted ? '项目已完成评审，材料与评审记录完整。' : '项目仍在评审推进中，请持续跟进材料和专家提交情况。',
    },
    materials: [
      {
        name: '项目申请书',
        type: '申报材料',
        format: 'PDF',
        uploader: item.principal,
        uploadedAt: item.materialSubmittedAt || '-',
        status: item.materialSubmitted ? '已提交' : '未提交',
      },
      {
        name: '项目预算表',
        type: '预算材料',
        format: 'XLSX',
        uploader: item.principal,
        uploadedAt: item.materialSubmittedAt || '-',
        status: item.materialSubmitted ? '已提交' : '未提交',
      },
      {
        name: '研究计划书',
        type: '研究材料',
        format: 'DOCX',
        uploader: item.principal,
        uploadedAt: item.materialSubmittedAt || '-',
        status: item.materialSubmitted ? '已提交' : '待补充',
      },
      {
        name: '阶段成果材料',
        type: '阶段材料',
        format: 'PDF',
        uploader: '-',
        uploadedAt: '-',
        status: item.reviewCompleted ? '已提交' : '待补充',
      },
      {
        name: '验收材料',
        type: '验收材料',
        format: 'DOCX',
        uploader: '-',
        uploadedAt: '-',
        status: item.reviewCompleted ? '已提交' : '未提交',
      },
    ],
    progressStages: [
      {
        key: 'apply',
        label: '项目申报',
        startTime: '2026-04-10',
        endTime: item.materialSubmittedAt ? item.materialSubmittedAt.slice(0, 10) : '2026-04-10',
        owner: item.principal,
        status: item.materialSubmitted ? 'done' : 'active',
        result: item.materialSubmitted ? '申报材料已提交' : '等待材料提交',
      },
      {
        key: 'formalReview',
        label: '形式审核',
        startTime: '2026-04-11',
        endTime: '2026-04-15',
        owner: '科研项目管理员',
        status: item.materialSubmitted ? 'done' : 'pending',
        result: item.materialSubmitted ? '形式审核通过' : '未开始',
      },
      {
        key: 'review',
        label: '项目评审',
        startTime: item.reviewerAssignedAt ? item.reviewerAssignedAt.slice(0, 10) : '2026-07-12',
        endTime: '2026-07-25',
        owner: '科研项目管理员',
        status: item.reviewCompleted ? 'done' : hasReviewers ? 'active' : 'pending',
        result: item.reviewCompleted ? '评审完成' : hasReviewers ? '评审进行中' : '未分配评委',
      },
      {
        key: 'execution',
        label: '项目执行',
        startTime: '2026-07-26',
        endTime: '2027-03-31',
        owner: item.principal,
        status: item.reviewCompleted ? 'active' : 'pending',
        result: item.reviewCompleted ? '进入执行阶段' : '未开始',
      },
      {
        key: 'acceptance',
        label: '验收结项',
        startTime: '2027-04-01',
        endTime: '2027-04-14',
        owner: '科研项目管理员',
        status: evaluationDone && item.reviewCompleted ? 'pending' : 'pending',
        result: '未开始',
      },
    ],
    timeline: [
      {
        date: '2026-04-10',
        title: '项目申报',
        operator: item.principal,
        note: item.materialSubmitted ? '已提交项目材料' : '等待项目材料',
        status: item.materialSubmitted ? 'done' : 'active',
      },
      {
        date: '2026-04-15',
        title: '形式审核通过',
        operator: '科研项目管理员',
        note: item.materialSubmitted ? '材料完整' : '未开始审核',
        status: item.materialSubmitted ? 'done' : 'pending',
      },
      {
        date: '2026-07-12',
        title: '发起项目评审',
        operator: '系统',
        note: hasReviewers ? `已分配${item.reviewers.length}名评委` : '尚未分配评委',
        status: hasReviewers ? 'done' : 'pending',
      },
      {
        date: '2026-07-25 18:00',
        title: '评审截止',
        operator: '科研项目管理员',
        note: item.reviewCompleted ? '评审已完成' : '等待评审提交',
        status: item.reviewCompleted ? 'done' : 'active',
      },
      {
        date: '2026-08-05',
        title: '季度推进会',
        operator: '科研部',
        note: '项目成果汇报',
        status: 'pending',
      },
    ],
    risks: buildFallbackRisks(item),
    operationLogs: [
      {
        operator: item.principal,
        type: '提交材料',
        content: item.materialSubmitted ? '上传了项目申请书' : '项目材料等待提交',
        time: item.materialSubmittedAt || '2026-04-10 09:00',
      },
      {
        operator: '系统',
        type: '分配评委',
        content: hasReviewers ? `系统分配了${item.reviewers.length}名评委` : '尚未分配评委',
        time: item.reviewerAssignedAt || '2026-07-12 09:00',
      },
      {
        operator: '系统',
        type: '更新进度',
        content: `360 环评进度更新为 ${item.evaluationCompleted}/${item.evaluationRequired}`,
        time: item.evaluationUpdatedAt || '2026-07-15 10:00',
      },
    ],
    contactInfo: {
      projectSource: '院级科研项目',
      researchField: item.subDirection,
      keywords: `${item.subDirection}、${item.projectType}、科研管理`,
      resultForms: '论文、研究报告、阶段成果材料',
      partner: '校内联合团队',
      partnerStartDate: '2026-05-01',
      partnerEndDate: '2027-04-14',
      remark: item.reviewCompleted ? '评审完成，进入后续执行跟踪' : '需要持续跟进评审和材料提交',
      department: item.faculty,
      contactPerson: item.principal,
      phone: '138-0000-0000',
      email: `${item.projectCode.toLowerCase()}@ai-institute.edu.cn`,
    },
  }
}

function buildFallbackRisks(item: MonitorProject): RiskItem[] {
  const risks: RiskItem[] = []

  if (!item.materialSubmitted) {
    risks.push({
      id: `${item.projectCode}-material`,
      level: 'warning',
      title: '项目材料尚未提交',
      description: '请联系项目负责人补充项目材料',
      action: '去处理',
    })
  }

  if (!item.reviewers.length) {
    risks.push({
      id: `${item.projectCode}-reviewers`,
      level: 'danger',
      title: '评委名单未分配',
      description: '需尽快完成评委分配',
      action: '去查看',
    })
  }

  if (item.evaluationCompleted < item.evaluationRequired) {
    risks.push({
      id: `${item.projectCode}-evaluation`,
      level: 'info',
      title: '360 环评尚未完成',
      description: `已完成 ${item.evaluationCompleted}/${item.evaluationRequired}`,
      action: '去催办',
    })
  }

  return risks
}

function getStatusFromMonitor(item: MonitorProject): ProjectStatus {
  if (item.reviewCompleted) {
    return '执行中'
  }

  if (item.reviewers.length) {
    return '评审中'
  }

  return '申报中'
}

function getPercent(value: number, total: number) {
  if (!total) {
    return 0
  }

  return Math.min(100, Math.round((value / total) * 100))
}

function formatAmount(value: number) {
  return value.toFixed(2)
}

function getStatusTagType(status: string) {
  if (['已结项', '通过', '已提交', '已完成'].includes(status)) {
    return 'success'
  }

  if (['评审中', '执行中', '待补充', '申报中'].includes(status)) {
    return 'warning'
  }

  if (['已终止', '未提交', '审核不通过'].includes(status)) {
    return 'danger'
  }

  return 'info'
}

function getTimelineType(status: StageStatus) {
  if (status === 'done') {
    return 'success'
  }

  if (status === 'active') {
    return 'warning'
  }

  return 'info'
}

function getStepStatus(status: StageStatus) {
  if (status === 'done') {
    return 'success'
  }

  if (status === 'active') {
    return 'process'
  }

  return 'wait'
}

function getRiskIcon(level: RiskLevel) {
  if (level === 'success') {
    return CircleCheckFilled
  }

  if (level === 'info') {
    return Clock
  }

  return WarningFilled
}

function goBackToList() {
  router.push({
    path: listPath.value,
    query: route.query,
  })
}

function editProject() {
  if (!isResearchProjectAdminRoute.value) {
    ElMessage.info('项目编辑功能正在建设中')
    return
  }

  const targetRoute = router.resolve({
    name: 'research-project-admin-project-management-edit',
    params: { projectId: projectId.value },
    query: route.query,
  })
  void targetRoute
  ElMessage.info('项目编辑功能正在建设中')
}

function viewQuarterlyReviewMeeting() {
  if (!isResearchProjectAdminRoute.value) {
    ElMessage.info('请从当前角色的季度评审会进入相关操作')
    return
  }

  router.push('/research-project-admin/quarterly-review-meeting')
}

function handleRiskAction(action: string) {
  if (action === '-') {
    return
  }

  ElMessage.info(`${action}功能正在建设中`)
}

function previewMaterial(material: ProjectMaterial) {
  ElMessage.info(`${material.name}预览功能正在建设中`)
}

function downloadMaterial(material: ProjectMaterial) {
  ElMessage.success(`${material.name}下载功能已预留`)
}
</script>

<template>
  <section class="project-detail-page" aria-label="项目详情">
    <el-result v-if="!project" icon="warning" title="未找到对应项目" sub-title="请返回项目列表重新选择项目">
      <template #extra>
        <el-button type="primary" @click="goBackToList">返回项目列表</el-button>
      </template>
    </el-result>

    <template v-else>
      <header class="detail-hero card-shell">
        <div class="title-block">
          <div class="title-row">
            <h1>{{ project.projectName }}</h1>
            <el-tag :type="getStatusTagType(project.status)" effect="light" round>
              {{ project.status }}
            </el-tag>
          </div>
          <p class="project-meta">
            <span>项目编号：{{ project.projectCode }}</span>
            <span>项目批次：{{ project.projectBatch }}</span>
            <span>项目类型：{{ project.projectType }}</span>
          </p>
        </div>

        <div class="hero-actions">
          <el-button :icon="Back" @click="goBackToList">返回列表</el-button>
          <el-button :icon="Edit" type="primary" @click="editProject">编辑项目</el-button>
        </div>
      </header>

      <section class="top-card-grid">
        <article class="card-shell base-card">
          <div class="section-heading">
            <h2>基础信息</h2>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item v-for="item in baseInfoItems" :key="item.label" :label="item.label">
              <el-tag v-if="item.label === '当前状态'" :type="getStatusTagType(item.value)" effect="light">
                {{ item.value }}
              </el-tag>
              <span v-else>{{ item.value }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </article>

        <article class="card-shell progress-card">
          <div class="progress-card-header">
            <div class="section-heading">
              <h2>项目进度</h2>
            </div>
            <div class="overall-progress">
              <span>整体进度</span>
              <strong>{{ overallProgress }}%</strong>
              <el-progress :percentage="overallProgress" :show-text="false" />
            </div>
          </div>

          <el-steps class="detail-steps" :active="currentStageIndex" align-center>
            <el-step
              v-for="stage in project.progressStages"
              :key="stage.key"
              :title="stage.label"
              :description="stage.status === 'done' ? '已完成' : stage.status === 'active' ? '进行中' : '未开始'"
              :status="getStepStatus(stage.status)"
            />
          </el-steps>

          <div class="next-node">
            <span>下一关键节点：{{ nextTimelineNode?.title ?? '-' }}</span>
            <span>剩余时间：{{ remainingTimeLabel }}</span>
            <span>截止时间：{{ nextTimelineNode?.date ?? '-' }}</span>
          </div>
        </article>
      </section>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane v-for="tab in tabItems" :key="tab.name" :label="tab.label" :name="tab.name" />
      </el-tabs>

      <Transition name="tab-fade" mode="out-in">
        <section v-if="activeTab === 'overview'" key="overview" class="overview-layout">
          <div class="overview-left">
            <article class="card-shell detail-card">
              <div class="section-heading">
                <h2>项目概述</h2>
              </div>
              <div class="description-list">
                <p><strong>研究目标：</strong>{{ project.description.goal }}</p>
                <p><strong>研究内容：</strong>{{ project.description.content }}</p>
                <p><strong>应用价值：</strong>{{ project.description.applicationValue }}</p>
              </div>
            </article>

            <article class="card-shell detail-card">
              <div class="section-heading">
                <h2>关键指标</h2>
              </div>
              <div class="metric-grid">
                <div
                  v-for="metric in overviewMetrics"
                  :key="metric.key"
                  class="overview-metric"
                  :class="`metric-${metric.tone}`"
                >
                  <span class="metric-icon">
                    <el-icon><component :is="metric.icon" /></el-icon>
                  </span>
                  <div>
                    <p>{{ metric.label }}</p>
                    <strong>{{ metric.value }}</strong>
                  </div>
                </div>
              </div>
            </article>

            <article class="card-shell detail-card">
              <div class="section-heading">
                <h2>标签</h2>
              </div>
              <div class="tag-list">
                <el-tag v-for="tag in project.tags" :key="tag" effect="light" round>
                  {{ tag }}
                </el-tag>
              </div>
            </article>
          </div>

          <article class="card-shell timeline-card">
            <div class="section-heading">
              <h2>重要时间节点</h2>
            </div>
            <el-timeline>
              <el-timeline-item
                v-for="item in project.timeline"
                :key="`${item.date}-${item.title}`"
                :timestamp="item.date"
                :type="getTimelineType(item.status)"
              >
                <strong>{{ item.title }}</strong>
                <p>{{ item.operator }} · {{ item.note }}</p>
              </el-timeline-item>
            </el-timeline>
          </article>

          <article class="card-shell risk-card">
            <div class="section-heading">
              <h2>风险与异常提醒</h2>
            </div>
            <div v-if="project.risks.length" class="risk-list">
              <div v-for="risk in project.risks" :key="risk.id" class="risk-item" :class="`risk-${risk.level}`">
                <span class="risk-icon">
                  <el-icon><component :is="getRiskIcon(risk.level)" /></el-icon>
                </span>
                <div>
                  <strong>{{ risk.title }}</strong>
                  <p>{{ risk.description }}</p>
                </div>
                <button class="text-button" type="button" @click="handleRiskAction(risk.action)">
                  {{ risk.action }}
                </button>
              </div>
            </div>
            <div v-else class="empty-success">
              <el-icon><CircleCheckFilled /></el-icon>
              <span>当前项目暂无异常</span>
            </div>
          </article>

          <article class="card-shell supplement-card">
            <div class="section-heading">
              <h2>项目信息补充</h2>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item
                v-for="item in supplementItems"
                :key="item.label"
                :label="item.label"
              >
                {{ item.value }}
              </el-descriptions-item>
            </el-descriptions>
          </article>
        </section>

        <section v-else-if="activeTab === 'members'" key="members" class="single-tab-panel card-shell">
          <el-table :data="project.members" class="detail-table">
            <el-table-column prop="name" label="成员姓名" min-width="110" />
            <el-table-column label="项目角色" width="130">
              <template #default="{ row }">
                <el-tag :type="row.role === '项目负责人' ? 'primary' : 'info'" effect="light">
                  {{ row.role }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="所属部门" min-width="150" />
            <el-table-column prop="title" label="职务/职称" width="120" />
            <el-table-column prop="phone" label="联系电话" width="150" />
            <el-table-column prop="email" label="邮箱" min-width="220" />
            <el-table-column prop="joinedAt" label="加入时间" width="120" />
          </el-table>
        </section>

        <section v-else-if="activeTab === 'review'" key="review" class="single-tab-panel card-shell">
          <template v-if="project.reviewInfo.launched">
            <div class="review-summary">
              <div class="review-copy">
                <h2>{{ project.reviewInfo.reviewName }}</h2>
                <p>{{ project.reviewInfo.reviewPeriod }}</p>
                <p>评审结果：{{ project.reviewInfo.result }}</p>
              </div>
              <el-tag :type="getStatusTagType(project.reviewInfo.result)" effect="light">
                {{ project.reviewInfo.result }}
              </el-tag>
            </div>

            <div class="review-metric-grid">
              <div v-for="item in reviewMetrics" :key="item.label" class="review-metric">
                <div>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
                <el-progress :percentage="item.percent" :stroke-width="9" />
              </div>
            </div>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="评委名单">
                {{ project.reviewInfo.reviewers.join('、') || '未指定评委' }}
              </el-descriptions-item>
              <el-descriptions-item label="评审意见">
                {{ project.reviewInfo.comments }}
              </el-descriptions-item>
            </el-descriptions>
          </template>

          <el-empty v-else description="该项目尚未发起评审">
            <el-button :icon="VideoPlay" type="primary" @click="viewQuarterlyReviewMeeting">查看季度评审会</el-button>
          </el-empty>
        </section>

        <section v-else-if="activeTab === 'materials'" key="materials" class="single-tab-panel card-shell">
          <el-table :data="project.materials" class="detail-table">
            <el-table-column prop="name" label="材料名称" min-width="170" />
            <el-table-column prop="type" label="材料类型" width="120" />
            <el-table-column prop="format" label="文件格式" width="100" />
            <el-table-column prop="uploader" label="上传人员" width="120" />
            <el-table-column prop="uploadedAt" label="上传时间" width="170" />
            <el-table-column label="材料状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" effect="light">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" :icon="View" @click="previewMaterial(row)">预览</el-button>
                <el-button link type="primary" :icon="Download" @click="downloadMaterial(row)">下载</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section v-else-if="activeTab === 'progress'" key="progress" class="progress-tab-grid">
          <article v-for="stage in project.progressStages" :key="stage.key" class="card-shell stage-card">
            <div class="stage-card-top">
              <h3>{{ stage.label }}</h3>
              <el-tag :type="getStepStatus(stage.status) === 'success' ? 'success' : stage.status === 'active' ? 'warning' : 'info'" effect="light">
                {{ stage.status === 'done' ? '已完成' : stage.status === 'active' ? '进行中' : '未开始' }}
              </el-tag>
            </div>
            <el-progress
              :percentage="stage.status === 'done' ? 100 : stage.status === 'active' ? 45 : 0"
              :status="stage.status === 'done' ? 'success' : undefined"
            />
            <dl>
              <div>
                <dt>开始时间</dt>
                <dd>{{ stage.startTime }}</dd>
              </div>
              <div>
                <dt>结束时间</dt>
                <dd>{{ stage.endTime }}</dd>
              </div>
              <div>
                <dt>负责人</dt>
                <dd>{{ stage.owner }}</dd>
              </div>
              <div>
                <dt>阶段成果</dt>
                <dd>{{ stage.result }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-else key="logs" class="single-tab-panel card-shell">
          <el-timeline>
            <el-timeline-item v-for="log in project.operationLogs" :key="`${log.time}-${log.content}`" :timestamp="log.time">
              <strong>{{ log.operator }} · {{ log.type }}</strong>
              <p>{{ log.content }}</p>
            </el-timeline-item>
          </el-timeline>
        </section>
      </Transition>
    </template>
  </section>
</template>

<style scoped>
.project-detail-page {
  display: grid;
  gap: 16px;
  color: #1d1d1f;
}

.card-shell {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.detail-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 22px;
}

.title-block {
  min-width: 0;
}

.title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.title-row h1,
.section-heading h2,
.description-list p,
.project-meta,
.risk-item p,
.review-copy h2,
.review-copy p,
.stage-card h3,
.stage-card dl,
.stage-card dd {
  margin: 0;
}

.title-row h1 {
  max-width: 980px;
  color: #1d1d1f;
  font-size: 26px;
  line-height: 1.32;
  font-weight: 820;
  letter-spacing: 0;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-top: 10px;
  color: #6e6e73;
  font-size: 13px;
  font-weight: 680;
}

.hero-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 10px;
}

.hero-actions :deep(.el-button) {
  height: 40px;
  border-radius: 10px;
  font-weight: 760;
}

.top-card-grid {
  display: grid;
  grid-template-columns: minmax(420px, 0.85fr) minmax(620px, 1.15fr);
  gap: 14px;
}

.base-card,
.progress-card,
.detail-card,
.timeline-card,
.risk-card,
.supplement-card,
.single-tab-panel,
.stage-card {
  padding: 18px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-heading h2 {
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 820;
}

.base-card :deep(.el-descriptions__label),
.supplement-card :deep(.el-descriptions__label),
.single-tab-panel :deep(.el-descriptions__label) {
  width: 118px;
  color: #6e6e73;
  font-weight: 760;
}

.progress-card {
  display: grid;
  gap: 14px;
}

.progress-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.overall-progress {
  width: 220px;
  display: grid;
  gap: 6px;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 760;
}

.overall-progress strong {
  color: #0a84ff;
  font-size: 18px;
}

.detail-steps {
  padding: 8px 6px 2px;
}

.detail-steps :deep(.el-step__title) {
  font-size: 13px;
  font-weight: 780;
}

.detail-steps :deep(.el-step__description) {
  font-size: 12px;
}

.next-node {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  border-radius: 10px;
  padding: 10px 12px;
  color: #424245;
  background: #f8fbff;
  font-size: 13px;
  font-weight: 700;
}

.detail-tabs {
  border-bottom: 1px solid rgba(29, 29, 31, 0.06);
}

.detail-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.detail-tabs :deep(.el-tabs__item) {
  height: 44px;
  color: #6e6e73;
  font-weight: 780;
}

.detail-tabs :deep(.el-tabs__item.is-active) {
  color: #0a84ff;
}

.detail-tabs :deep(.el-tabs__active-bar) {
  background: #0a84ff;
}

.overview-layout {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(320px, 0.65fr) minmax(360px, 0.78fr);
  gap: 14px;
}

.overview-left {
  display: grid;
  gap: 14px;
}

.description-list {
  display: grid;
  gap: 10px;
  color: #424245;
  font-size: 14px;
  line-height: 1.7;
}

.description-list strong {
  color: #1d1d1f;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.overview-metric {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 74px;
  border-radius: 10px;
  padding: 12px;
  background: #f8fbff;
}

.metric-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 18px;
}

.overview-metric p {
  margin: 0 0 5px;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 760;
}

.overview-metric strong {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 820;
}

.metric-orange .metric-icon {
  color: #ff8a1f;
  background: #fff3e8;
}

.metric-blue .metric-icon {
  color: #0a84ff;
  background: #e8f3ff;
}

.metric-indigo .metric-icon,
.metric-purple .metric-icon,
.metric-violet .metric-icon {
  color: #6e56cf;
  background: #f1edff;
}

.metric-green .metric-icon {
  color: #1fbd72;
  background: #e9f8ef;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline-card :deep(.el-timeline),
.single-tab-panel :deep(.el-timeline) {
  padding-left: 4px;
}

.timeline-card strong,
.single-tab-panel strong {
  color: #1d1d1f;
  font-size: 14px;
}

.timeline-card p,
.single-tab-panel p {
  margin: 5px 0 0;
  color: #6e6e73;
  font-size: 13px;
}

.risk-list {
  display: grid;
  gap: 8px;
}

.risk-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  padding: 10px 12px;
  background: #f8fbff;
}

.risk-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 17px;
}

.risk-warning .risk-icon {
  color: #ff8a1f;
  background: #fff3e8;
}

.risk-danger .risk-icon {
  color: #ff3b30;
  background: #fff0ef;
}

.risk-info .risk-icon {
  color: #0a84ff;
  background: #e8f3ff;
}

.risk-success .risk-icon,
.empty-success {
  color: #1fbd72;
  background: #e9f8ef;
}

.risk-item strong {
  color: #1d1d1f;
  font-size: 13px;
}

.risk-item p {
  margin-top: 4px;
  color: #6e6e73;
  font-size: 12px;
}

.text-button {
  border: 0;
  color: #0a84ff;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 780;
}

.empty-success {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 18px;
  font-weight: 780;
}

.supplement-card {
  grid-column: 1 / -1;
}

.single-tab-panel {
  min-width: 0;
}

.detail-table {
  --el-table-border-color: rgba(29, 29, 31, 0.06);
  --el-table-header-bg-color: #f8fbff;
  border-radius: 10px;
  overflow: hidden;
}

.review-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.review-copy h2 {
  font-size: 18px;
  font-weight: 820;
}

.review-copy p {
  margin-top: 8px;
  color: #6e6e73;
  font-size: 13px;
}

.review-metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.review-metric {
  display: grid;
  gap: 10px;
  border-radius: 10px;
  padding: 14px;
  background: #f8fbff;
}

.review-metric div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.review-metric span {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 760;
}

.review-metric strong {
  color: #0a84ff;
  font-size: 20px;
}

.progress-tab-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 12px;
}

.stage-card {
  display: grid;
  gap: 14px;
}

.stage-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.stage-card h3 {
  font-size: 16px;
  font-weight: 820;
}

.stage-card dl {
  display: grid;
  gap: 10px;
}

.stage-card dl div {
  display: grid;
  gap: 4px;
}

.stage-card dt {
  color: #86868b;
  font-size: 12px;
  font-weight: 760;
}

.stage-card dd {
  color: #424245;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 720;
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 1440px) {
  .top-card-grid,
  .overview-layout {
    grid-template-columns: 1fr;
  }

  .progress-tab-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 920px) {
  .detail-hero,
  .progress-card-header,
  .review-summary {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-actions,
  .overall-progress {
    width: 100%;
  }

  .metric-grid,
  .review-metric-grid,
  .progress-tab-grid {
    grid-template-columns: 1fr;
  }

  .risk-item {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .risk-item .text-button {
    grid-column: 2;
    width: fit-content;
  }
}
</style>
