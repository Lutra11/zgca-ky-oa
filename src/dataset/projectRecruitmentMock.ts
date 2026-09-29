import type { LoggedInUser } from '../types/auth'
import { getProjectMemberProjects, type ProjectMemberProjectRow } from './projectMemberProjectsMock'

export type RecruitmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'EXPIRED'
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
export type ProjectMemberStatus = 'ACTIVE' | 'EXIT_PENDING' | 'EXITED'
export type ProjectApplicationType = 'JOIN' | 'EXIT'
export type ProjectMemberType = 'LEADER' | 'STUDENT' | 'OTHER'

export interface ProjectRecruitmentForm {
  project_id: string
  project_code: string
  project_name: string
  leader_introduction: string
  project_description: string
  position_name: string
  planned_count: number
  target_grade: string
  application_deadline: string
  requirements: string
  work_content: string
  status: RecruitmentStatus
}

export interface ProjectRecruitment {
  id: string
  project_id: string
  project_code: string
  project_name: string
  leader_id: string
  leader_name: string
  department_name: string
  research_direction: string
  leader_introduction?: string
  project_description: string
  project_status: string
  position_name: string
  planned_count: number
  admitted_count: number
  pending_count: number
  target_grade: string
  requirements: string
  work_content: string
  application_deadline: string
  status: RecruitmentStatus
  created_at: string
  updated_at: string
}

export interface ProjectApplication {
  id: string
  application_type: ProjectApplicationType
  project_id: string
  recruitment_id?: string
  membership_id?: string
  student_id: string
  student_no: string
  student_name: string
  college: string
  grade?: string
  position_name?: string
  available_time?: string
  experience?: string
  application_reason: string
  description?: string
  expected_exit_date?: string
  attachment_file_id?: string
  status: ApplicationStatus
  approval_comment?: string
  approved_by?: string
  approved_at?: string
  created_at: string
}

export interface ProjectMembership {
  id: string
  project_id: string
  user_id: string
  user_no: string
  user_name: string
  member_type: ProjectMemberType
  organization: string
  responsibility: string
  joined_at: string
  exited_at?: string
  status: ProjectMemberStatus
}

export interface ProjectRecruitmentState {
  recruitments: ProjectRecruitment[]
  applications: ProjectApplication[]
  memberships: ProjectMembership[]
}

export interface RecruitmentLeaderProject {
  project_id: string
  project_code: string
  project_name: string
  leader_id: string
  leader_name: string
  department_name: string
  research_direction: string
  project_description: string
  project_status: string
}

const STORAGE_KEY = 'zgca_project_recruitment_mock_state_v1'

export const recruitmentStatusLabelMap: Record<RecruitmentStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '招募中',
  CLOSED: '已结束',
  EXPIRED: '已过期',
}

export const applicationStatusLabelMap: Record<ApplicationStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  WITHDRAWN: '已撤回',
}

export const applicationTypeLabelMap: Record<ProjectApplicationType, string> = {
  JOIN: '加入申请',
  EXIT: '退出申请',
}

export const projectMemberStatusLabelMap: Record<ProjectMemberStatus, string> = {
  ACTIVE: '在项目',
  EXIT_PENDING: '退出申请中',
  EXITED: '已退出',
}

export const projectMemberTypeLabelMap: Record<ProjectMemberType, string> = {
  LEADER: '项目负责人',
  STUDENT: '学生成员',
  OTHER: '其他成员',
}

export const targetGradeOptions = ['博士一年级', '博士二年级', '硕士研究生', '不限年级']

const initialRecruitments: ProjectRecruitment[] = [
  {
    id: 'R202608001',
    project_id: 'owner-project-003',
    project_code: 'ZX2608001',
    project_name: '多肽分子预测和设计算法研究',
    leader_id: 'u006',
    leader_name: '赵同学',
    department_name: '生命科学中心',
    research_direction: 'AI × 科学技术',
    project_description: '面向多肽分子性质预测与生成设计，探索深度学习算法在生物医药研发中的应用。',
    project_status: '在研',
    position_name: '算法研究助理',
    planned_count: 2,
    admitted_count: 1,
    pending_count: 2,
    target_grade: '博士一年级',
    requirements: '熟悉 Python，了解深度学习或生物信息学，能够稳定参与项目研究。',
    work_content: '参与数据整理、算法实验、结果分析和阶段性材料撰写。',
    application_deadline: '2026-09-15',
    status: 'PUBLISHED',
    created_at: '2026-08-20 09:30',
    updated_at: '2026-08-27 09:20',
  },
  {
    id: 'R202608002',
    project_id: 'owner-project-002',
    project_code: 'JC2608005',
    project_name: '基础培育类项目经费执行示例',
    leader_id: 'u006',
    leader_name: '赵同学',
    department_name: '人工智能学院',
    research_direction: 'AI核心',
    project_description: '围绕基础培育类科研任务开展算法验证、实验平台搭建和阶段性成果产出。',
    project_status: '在研',
    position_name: '安全算法研究助理',
    planned_count: 3,
    admitted_count: 2,
    pending_count: 1,
    target_grade: '博士二年级',
    requirements: '具备自然语言处理或信息安全基础，熟悉大语言模型。',
    work_content: '参与文献调研、模型水印实验、攻击防御测试和评估报告撰写。',
    application_deadline: '2026-09-25',
    status: 'PUBLISHED',
    created_at: '2026-08-18 11:10',
    updated_at: '2026-08-26 15:42',
  },
  {
    id: 'R202607006',
    project_id: 'owner-project-001',
    project_code: 'PMJ240402',
    project_name: '基于深度学习的量子材料力学性能预测方法研究',
    leader_id: 'u006',
    leader_name: '赵同学',
    department_name: '北京中关村学院',
    research_direction: 'AI × 科学技术',
    project_description: '研究深度学习模型与物理约束知识融合方法，提升小样本材料性能预测准确性。',
    project_status: '申报评审中',
    position_name: '材料数据分析助理',
    planned_count: 2,
    admitted_count: 2,
    pending_count: 0,
    target_grade: '硕士研究生',
    requirements: '了解材料计算、机器学习或数据分析基础。',
    work_content: '参与数据清洗、模型训练和实验结果整理。',
    application_deadline: '2026-08-20',
    status: 'CLOSED',
    created_at: '2026-07-12 10:00',
    updated_at: '2026-08-20 18:00',
  },
  {
    id: 'R202608009',
    project_id: 'owner-project-003',
    project_code: 'ZX2608001',
    project_name: '多肽分子预测和设计算法研究',
    leader_id: 'u006',
    leader_name: '赵同学',
    department_name: '生命科学中心',
    research_direction: 'AI × 科学技术',
    project_description: '面向多肽分子性质预测与生成设计，探索深度学习算法在生物医药研发中的应用。',
    project_status: '在研',
    position_name: '系统研发助理',
    planned_count: 1,
    admitted_count: 0,
    pending_count: 0,
    target_grade: '不限年级',
    requirements: '熟悉 Linux、Python 及基础调度算法。',
    work_content: '支撑实验环境搭建、任务调度脚本和数据处理流程维护。',
    application_deadline: '2026-10-10',
    status: 'DRAFT',
    created_at: '2026-08-24 16:45',
    updated_at: '2026-08-24 16:45',
  },
]

const initialApplications: ProjectApplication[] = [
  {
    id: 'JA20260827001',
    application_type: 'JOIN',
    project_id: 'owner-project-003',
    recruitment_id: 'R202608001',
    student_id: 'stu-20260018',
    student_no: '20260018',
    student_name: '林思远',
    college: '北京中关村学院',
    grade: '博士一年级',
    position_name: '算法研究助理',
    available_time: '10—15小时',
    experience: '熟悉 Python、PyTorch，参与过蛋白质结构预测课程项目。',
    application_reason: '希望参与真实生物医药算法研究。',
    attachment_file_id: 'resume-lsy.pdf',
    status: 'PENDING',
    created_at: '2026-08-27 09:20',
  },
  {
    id: 'JA20260826009',
    application_type: 'JOIN',
    project_id: 'owner-project-003',
    recruitment_id: 'R202608001',
    student_id: 'stu-20260031',
    student_no: '20260031',
    student_name: '陈雨桐',
    college: '北京中关村学院',
    grade: '博士一年级',
    position_name: '算法研究助理',
    available_time: '8—10小时',
    experience: '具备生物信息学背景，熟悉序列数据处理。',
    application_reason: '希望深化 AI 与生命科学交叉研究。',
    attachment_file_id: 'resume-cyt.docx',
    status: 'PENDING',
    created_at: '2026-08-26 15:42',
  },
  {
    id: 'JA20260825006',
    application_type: 'JOIN',
    project_id: 'owner-project-002',
    recruitment_id: 'R202608002',
    student_id: 'stu-20250022',
    student_no: '20250022',
    student_name: '王子墨',
    college: '中关村人工智能研究院',
    grade: '博士二年级',
    position_name: '安全算法研究助理',
    available_time: '15小时以上',
    experience: '研究方向为大模型安全，发表相关论文 1 篇。',
    application_reason: '希望参与水印攻防实验。',
    attachment_file_id: 'resume-wzm.pdf',
    status: 'PENDING',
    created_at: '2026-08-25 11:08',
  },
  {
    id: 'EA20260826003',
    application_type: 'EXIT',
    project_id: 'owner-project-003',
    membership_id: 'M20260620001',
    student_id: 'stu-20250013',
    student_no: '20250013',
    student_name: '赵清妍',
    college: '北京中关村学院',
    application_reason: '研究方向调整',
    description: '拟转向大模型安全方向，已完成数据清洗工作交接。',
    expected_exit_date: '2026-09-10',
    status: 'PENDING',
    created_at: '2026-08-26 18:06',
  },
]

const initialMemberships: ProjectMembership[] = [
  {
    id: 'M20260601001',
    project_id: 'owner-project-003',
    user_id: 'u006',
    user_no: '000063',
    user_name: '赵同学',
    member_type: 'LEADER',
    organization: '生命科学中心',
    responsibility: '总体方案与项目管理',
    joined_at: '2026-06-01',
    status: 'ACTIVE',
  },
  {
    id: 'M20260620001',
    project_id: 'owner-project-003',
    user_id: 'stu-20250013',
    user_no: '20250013',
    user_name: '赵清妍',
    member_type: 'STUDENT',
    organization: '北京中关村学院',
    responsibility: '数据清洗与实验支持',
    joined_at: '2026-06-20',
    status: 'EXIT_PENDING',
  },
  {
    id: 'M20260702001',
    project_id: 'owner-project-003',
    user_id: 'stu-20250027',
    user_no: '20250027',
    user_name: '苏晓晨',
    member_type: 'STUDENT',
    organization: '北京中关村学院',
    responsibility: '模型训练与结果分析',
    joined_at: '2026-07-02',
    status: 'ACTIVE',
  },
  {
    id: 'M20260808001',
    project_id: 'owner-project-003',
    user_id: 'stu-20260009',
    user_no: '20260009',
    user_name: '徐明哲',
    member_type: 'STUDENT',
    organization: '北京中关村学院',
    responsibility: '文献调研与数据标注',
    joined_at: '2026-08-08',
    status: 'ACTIVE',
  },
]

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getNowString() {
  const now = new Date()
  const date = getTodayString()
  const hour = `${now.getHours()}`.padStart(2, '0')
  const minute = `${now.getMinutes()}`.padStart(2, '0')

  return `${date} ${hour}:${minute}`
}

function isRecruitmentState(value: unknown): value is ProjectRecruitmentState {
  if (!value || typeof value !== 'object') {
    return false
  }

  const state = value as ProjectRecruitmentState

  return Array.isArray(state.recruitments) && Array.isArray(state.applications) && Array.isArray(state.memberships)
}

function createInitialProjectRecruitmentState(): ProjectRecruitmentState {
  return {
    recruitments: deepClone(initialRecruitments),
    applications: deepClone(initialApplications),
    memberships: deepClone(initialMemberships),
  }
}

export function loadProjectRecruitmentState(): ProjectRecruitmentState {
  if (typeof window === 'undefined') {
    return createInitialProjectRecruitmentState()
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return createInitialProjectRecruitmentState()
  }

  try {
    const parsed = JSON.parse(stored)

    return isRecruitmentState(parsed) ? parsed : createInitialProjectRecruitmentState()
  } catch {
    return createInitialProjectRecruitmentState()
  }
}

export function saveProjectRecruitmentState(state: ProjectRecruitmentState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function toLeaderProject(project: ProjectMemberProjectRow, currentUser: LoggedInUser | null): RecruitmentLeaderProject {
  return {
    project_id: project.projectId,
    project_code: project.projectCode,
    project_name: project.projectName,
    leader_id: currentUser?.id ?? project.leaderId,
    leader_name: currentUser?.displayName ?? project.leaderName,
    department_name: project.departmentName,
    research_direction: project.application.projectDirection || project.projectCategory,
    project_description: project.application.abstract || project.projectName,
    project_status: project.projectStatus,
  }
}

export function getRecruitmentLeaderProjects(currentUser: LoggedInUser | null): RecruitmentLeaderProject[] {
  return getProjectMemberProjects(currentUser)
    .filter((project) => project.projectStatus === '在研')
    .map((project) => toLeaderProject(project, currentUser))
}

export function getLeaderProjectIds(currentUser: LoggedInUser | null): Set<string> {
  return new Set(getRecruitmentLeaderProjects(currentUser).map((project) => project.project_id))
}

export function getLeaderRecruitments(
  state: ProjectRecruitmentState,
  currentUser: LoggedInUser | null,
): ProjectRecruitment[] {
  const projectIds = getLeaderProjectIds(currentUser)

  if (!projectIds.size) {
    return state.recruitments
  }

  return state.recruitments.filter((recruitment) => projectIds.has(recruitment.project_id))
}

export function getLeaderApplications(
  state: ProjectRecruitmentState,
  currentUser: LoggedInUser | null,
  type?: ProjectApplicationType,
): ProjectApplication[] {
  const projectIds = getLeaderProjectIds(currentUser)

  return state.applications.filter((application) => {
    const matchedProject = projectIds.size ? projectIds.has(application.project_id) : true
    const matchedType = type ? application.application_type === type : true

    return matchedProject && matchedType
  })
}

export function getLeaderMemberships(
  state: ProjectRecruitmentState,
  currentUser: LoggedInUser | null,
): ProjectMembership[] {
  const projectIds = getLeaderProjectIds(currentUser)

  return state.memberships.filter((member) => (projectIds.size ? projectIds.has(member.project_id) : true))
}

export function getRecruitmentPendingCount(state: ProjectRecruitmentState, recruitmentId: string) {
  return state.applications.filter(
    (application) =>
      application.application_type === 'JOIN' &&
      application.recruitment_id === recruitmentId &&
      application.status === 'PENDING',
  ).length
}

export function getRecruitmentAdmittedCount(state: ProjectRecruitmentState, projectId: string) {
  return state.memberships.filter(
    (member) => member.project_id === projectId && member.member_type === 'STUDENT' && member.status === 'ACTIVE',
  ).length
}

export function getProjectNameById(state: ProjectRecruitmentState, projectId: string) {
  return state.recruitments.find((recruitment) => recruitment.project_id === projectId)?.project_name ?? projectId
}

export function getProjectCodeById(state: ProjectRecruitmentState, projectId: string) {
  return state.recruitments.find((recruitment) => recruitment.project_id === projectId)?.project_code ?? projectId
}

export function isRecruitmentExpired(recruitment: ProjectRecruitment) {
  if (recruitment.status !== 'PUBLISHED') {
    return false
  }

  return recruitment.application_deadline < getTodayString()
}

export function getDisplayRecruitmentStatus(recruitment: ProjectRecruitment): RecruitmentStatus {
  return isRecruitmentExpired(recruitment) ? 'EXPIRED' : recruitment.status
}

export function buildRecruitmentShareText(recruitment: ProjectRecruitment) {
  return [
    `项目招募：${recruitment.project_name}`,
    `项目编号：${recruitment.project_code}`,
    `项目负责人：${recruitment.leader_name}`,
    `项目负责人介绍：${recruitment.leader_introduction ?? '暂无'}`,
    `项目简介：${recruitment.project_description}`,
    `计划人数：${recruitment.planned_count} 人`,
    `招募方向及要求：${recruitment.requirements}`,
  ].join('\n')
}

export function buildRecruitmentFromForm(
  form: ProjectRecruitmentForm,
  project: RecruitmentLeaderProject,
  currentUser: LoggedInUser | null,
  existing?: ProjectRecruitment,
): ProjectRecruitment {
  const now = getNowString()

  return {
    id: existing?.id ?? `R${Date.now()}`,
    project_id: project.project_id,
    project_code: project.project_code,
    project_name: project.project_name,
    leader_id: currentUser?.id ?? project.leader_id,
    leader_name: currentUser?.displayName ?? project.leader_name,
    department_name: project.department_name,
    research_direction: project.research_direction,
    leader_introduction: form.leader_introduction,
    project_description: form.project_description || project.project_description,
    project_status: project.project_status,
    position_name: form.position_name || '项目学生招募',
    planned_count: form.planned_count,
    admitted_count: existing?.admitted_count ?? 0,
    pending_count: existing?.pending_count ?? 0,
    target_grade: form.target_grade || '不限年级',
    requirements: form.requirements,
    work_content: form.work_content || form.requirements,
    application_deadline: form.application_deadline || existing?.application_deadline || getTodayString(),
    status: form.status,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  }
}

export function upsertRecruitment(state: ProjectRecruitmentState, recruitment: ProjectRecruitment) {
  const index = state.recruitments.findIndex((item) => item.id === recruitment.id)

  if (index >= 0) {
    state.recruitments.splice(index, 1, recruitment)
  } else {
    state.recruitments.unshift(recruitment)
  }

  saveProjectRecruitmentState(state)
}

export function closeRecruitment(state: ProjectRecruitmentState, recruitmentId: string) {
  const recruitment = state.recruitments.find((item) => item.id === recruitmentId)

  if (!recruitment) {
    return
  }

  recruitment.status = 'CLOSED'
  recruitment.updated_at = getNowString()
  saveProjectRecruitmentState(state)
}

export function approveProjectApplication(
  state: ProjectRecruitmentState,
  applicationId: string,
  approved: boolean,
  approvalComment: string,
  approverName: string,
) {
  const application = state.applications.find((item) => item.id === applicationId)

  if (!application || application.status !== 'PENDING') {
    return null
  }

  const now = getNowString()

  application.status = approved ? 'APPROVED' : 'REJECTED'
  application.approval_comment = approvalComment
  application.approved_by = approverName
  application.approved_at = now

  if (approved && application.application_type === 'JOIN') {
    const recruitment = state.recruitments.find((item) => item.id === application.recruitment_id)
    const existingActiveMember = state.memberships.some(
      (member) =>
        member.project_id === application.project_id &&
        member.user_id === application.student_id &&
        member.status !== 'EXITED',
    )

    if (!existingActiveMember) {
      state.memberships.push({
        id: `M${Date.now()}`,
        project_id: application.project_id,
        user_id: application.student_id,
        user_no: application.student_no,
        user_name: application.student_name,
        member_type: 'STUDENT',
        organization: application.college,
        responsibility: application.position_name ?? '项目成员',
        joined_at: getTodayString(),
        status: 'ACTIVE',
      })

      if (recruitment) {
        recruitment.admitted_count += 1
        recruitment.updated_at = now
      }
    }
  }

  if (application.application_type === 'EXIT') {
    const membership = state.memberships.find((member) => member.id === application.membership_id)

    if (membership) {
      membership.status = approved ? 'EXITED' : 'ACTIVE'
      membership.exited_at = approved ? application.expected_exit_date || getTodayString() : undefined
    }
  }

  saveProjectRecruitmentState(state)

  return application
}

export function updateMembershipResponsibility(
  state: ProjectRecruitmentState,
  membershipId: string,
  responsibility: string,
) {
  const membership = state.memberships.find((item) => item.id === membershipId)

  if (!membership) {
    return null
  }

  membership.responsibility = responsibility
  saveProjectRecruitmentState(state)

  return membership
}
