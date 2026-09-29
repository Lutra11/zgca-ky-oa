export type ParticipantRole = 'PROJECT_STUDENT' | 'PROJECT_MENTOR'
export type RecruitTarget = ParticipantRole | 'ALL'
export type RecruitmentStatus = 'RECRUITING' | 'ENDED'
export type ParticipantApplicationType = 'JOIN' | 'EXIT'
export type ParticipantApplicationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
export type ParticipantMembershipStatus = 'ACTIVE' | 'EXIT_PENDING' | 'EXITED'

export interface ParticipantProfile {
  role: ParticipantRole
  roleName: string
  name: string
  userCode: string
  organization: string
  avatarText: string
  phone: string
  email: string
  permissionText: string
}

export interface RecruitmentProject {
  id: string
  projectCode: string
  projectName: string
  direction: string
  description: string
  leaderId: string
  leaderName: string
  department: string
  recruitTarget: RecruitTarget
  positionName: string
  workContent: string
  requirements: string
  targetCondition: string
  plannedCount: number
  hiredCount: number
  applicationDeadline: string
  status: RecruitmentStatus
}

export interface ParticipantApplication {
  id: string
  applicationType: ParticipantApplicationType
  projectId: string
  projectCode: string
  projectName: string
  positionOrReason: string
  applicantRole: ParticipantRole
  submittedAt: string
  status: ParticipantApplicationStatus
  step: 1 | 2 | 3
  approvalComment?: string
  attachmentName?: string
}

export interface ParticipantMembership {
  id: string
  projectId: string
  projectCode: string
  projectName: string
  projectStatus: string
  applicantRole: ParticipantRole
  leaderName: string
  department: string
  joinedAt: string
  roleInProject: string
  responsibility: string
  status: ParticipantMembershipStatus
  memberAvatars: string[]
}

export interface ParticipantJoinDraft {
  phone: string
  email: string
  currentGrade?: string
  major?: string
  availableTime?: string
  skills?: string
  organization?: string
  title?: string
  researchDirection?: string
  supportOptions?: string[]
  experience: string
  reason: string
  expectedContribution: string
  attachmentName?: string
  truthConfirmed: boolean
}

export interface ParticipantRecruitmentState {
  applications: Record<ParticipantRole, ParticipantApplication[]>
  memberships: Record<ParticipantRole, ParticipantMembership[]>
  drafts: Record<ParticipantRole, Record<string, ParticipantJoinDraft>>
}

const STORAGE_KEY = 'zgca_project_participant_recruitment_mock_state_v1'
const PROTOTYPE_NOW = new Date('2026-08-27T09:00:00')

export const participantRoleOptions: Array<{ value: ParticipantRole; label: string }> = [
  { value: 'PROJECT_STUDENT', label: '项目学生视角' },
  { value: 'PROJECT_MENTOR', label: '项目导师视角' },
]

export const recruitTargetLabels: Record<RecruitTarget, string> = {
  PROJECT_STUDENT: '项目学生',
  PROJECT_MENTOR: '项目导师',
  ALL: '不限类型',
}

export const participantRoleLabels: Record<ParticipantRole, string> = {
  PROJECT_STUDENT: '项目学生',
  PROJECT_MENTOR: '项目导师',
}

export const applicationStatusLabels: Record<ParticipantApplicationStatus, string> = {
  DRAFT: '草稿',
  PENDING: '审批中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  WITHDRAWN: '已撤回',
}

export const applicationTypeLabels: Record<ParticipantApplicationType, string> = {
  JOIN: '加入申请',
  EXIT: '退出申请',
}

export const membershipStatusLabels: Record<ParticipantMembershipStatus, string> = {
  ACTIVE: '在项目',
  EXIT_PENDING: '退出审批中',
  EXITED: '已退出',
}

export const participantProfiles: Record<ParticipantRole, ParticipantProfile> = {
  PROJECT_STUDENT: {
    role: 'PROJECT_STUDENT',
    roleName: '项目学生',
    name: '林思远',
    userCode: 'S20260028',
    organization: '北京中关村学院',
    avatarText: '林',
    phone: '138 0000 2861',
    email: 'lin.siyuan@zgca.edu.cn',
    permissionText: '仅可查看面向项目学生或不限类型的招募，提交本人加入与退出申请。',
  },
  PROJECT_MENTOR: {
    role: 'PROJECT_MENTOR',
    roleName: '项目导师',
    name: '陈知行',
    userCode: 'M20260016',
    organization: '中关村人工智能研究院',
    avatarText: '陈',
    phone: '139 0000 3816',
    email: 'chen.zhixing@zgca.edu.cn',
    permissionText: '仅可查看面向项目导师或不限类型的招募，参与项目指导并提交本人加入与退出申请。',
  },
}

export const recruitmentProjects: RecruitmentProject[] = [
  {
    id: 'R260801',
    projectCode: 'ZX2608001',
    projectName: '多肽分子预测和设计算法',
    direction: 'AI × 科学技术',
    leaderId: 'L001',
    leaderName: '周旷奇',
    department: '智能科学技术',
    recruitTarget: 'PROJECT_STUDENT',
    positionName: '算法研究助理',
    targetCondition: '博士研究生',
    plannedCount: 2,
    hiredCount: 1,
    applicationDeadline: '2026-09-20',
    status: 'RECRUITING',
    description: '围绕多肽结构表征与活性预测，研究生成式模型和结构约束下的分子设计方法。',
    requirements: '熟悉 Python、PyTorch 或生物信息学；每周可稳定投入不少于 12 小时。',
    workContent: '参与数据预处理、模型实验、结果分析与阶段性研究材料撰写。',
  },
  {
    id: 'R260802',
    projectCode: 'JC2608003',
    projectName: '生成式语言模型水印加密技术研究',
    direction: 'AI 核心',
    leaderId: 'L002',
    leaderName: '刘畅',
    department: '人工智能核心',
    recruitTarget: 'ALL',
    positionName: '模型安全研究成员',
    targetCondition: '不限条件',
    plannedCount: 3,
    hiredCount: 1,
    applicationDeadline: '2026-09-25',
    status: 'RECRUITING',
    description: '研究生成式语言模型内容标识、水印嵌入与鲁棒检测，形成可验证的模型安全方案。',
    requirements: '具有自然语言处理、密码学、模型评测或科研指导相关经验。',
    workContent: '开展技术调研、方案设计、算法验证和安全评测。',
  },
  {
    id: 'R260803',
    projectCode: 'YY2607005',
    projectName: '产业级应用后训练关键技术研究',
    direction: 'AI × 科学技术',
    leaderId: 'L003',
    leaderName: '张逸远',
    department: '产业研究中心',
    recruitTarget: 'PROJECT_MENTOR',
    positionName: '产业应用指导导师',
    targetCondition: '副高级及以上',
    plannedCount: 1,
    hiredCount: 0,
    applicationDeadline: '2026-09-18',
    status: 'RECRUITING',
    description: '面向真实产业场景研究大模型后训练、知识注入和能力评估方法，提升行业应用落地效率。',
    requirements: '具有大模型后训练、产业项目交付或相关研究经验，可参与技术路线评审。',
    workContent: '指导技术路线、阶段评审、产业场景对接和成果质量把关。',
  },
  {
    id: 'R260804',
    projectCode: 'JC2608005',
    projectName: '面向多种慢病预测的毫米波雷达感知',
    direction: 'AI × 科学技术',
    leaderId: 'L004',
    leaderName: '李刚',
    department: '智能科学技术',
    recruitTarget: 'PROJECT_STUDENT',
    positionName: '数据分析与实验助理',
    targetCondition: '硕士研究生',
    plannedCount: 2,
    hiredCount: 0,
    applicationDeadline: '2026-10-08',
    status: 'RECRUITING',
    description: '利用毫米波雷达非接触感知数据开展慢病风险预测与跨人群模型泛化研究。',
    requirements: '掌握信号处理、机器学习或统计分析基础，有实验研究经历优先。',
    workContent: '参与数据清洗、特征工程、模型训练和实验记录。',
  },
  {
    id: 'R260805',
    projectCode: 'HX2608001',
    projectName: '多模态大语言模型驱动的教育智能体',
    direction: 'AI × 人文社科',
    leaderId: 'L005',
    leaderName: '赵鉴',
    department: '软件智能研究所',
    recruitTarget: 'ALL',
    positionName: '教育智能体研究成员',
    targetCondition: '不限条件',
    plannedCount: 3,
    hiredCount: 2,
    applicationDeadline: '2026-10-12',
    status: 'RECRUITING',
    description: '研究多模态大模型在个性化学习支持、过程评估与教学智能体中的可信应用。',
    requirements: '具有大模型应用、教育技术、交互设计或学习科学相关背景。',
    workContent: '参与需求分析、智能体原型设计、用户研究与模型评测。',
  },
  {
    id: 'R260806',
    projectCode: 'JC2608002',
    projectName: '训练景观驱动的大模型优化器研究',
    direction: 'AI 核心',
    leaderId: 'L006',
    leaderName: '袁坤',
    department: '人工智能核心',
    recruitTarget: 'PROJECT_MENTOR',
    positionName: '优化理论指导导师',
    targetCondition: '副高级及以上',
    plannedCount: 1,
    hiredCount: 0,
    applicationDeadline: '2026-10-01',
    status: 'RECRUITING',
    description: '从训练景观和动态优化视角研究大模型优化器设计，提升训练效率与稳定性。',
    requirements: '具有机器学习优化、数值计算或大模型训练研究经历。',
    workContent: '指导理论建模、实验设计、论文研讨与阶段成果评审。',
  },
]

const initialState: ParticipantRecruitmentState = {
  applications: {
    PROJECT_STUDENT: [
      {
        id: 'JA20260826001',
        applicationType: 'JOIN',
        projectId: 'R260805',
        projectCode: 'HX2608001',
        projectName: '多模态大语言模型驱动的教育智能体',
        positionOrReason: '教育智能体研究成员',
        applicantRole: 'PROJECT_STUDENT',
        submittedAt: '2026-08-26 15:20',
        status: 'PENDING',
        step: 2,
      },
      {
        id: 'JA20260615003',
        applicationType: 'JOIN',
        projectId: 'R260801',
        projectCode: 'ZX2608001',
        projectName: '多肽分子预测和设计算法',
        positionOrReason: '算法研究助理',
        applicantRole: 'PROJECT_STUDENT',
        submittedAt: '2026-06-15 10:36',
        status: 'APPROVED',
        step: 3,
        approvalComment: '同意加入项目组，请按负责人安排参与模型实验。',
      },
    ],
    PROJECT_MENTOR: [
      {
        id: 'JA20260825006',
        applicationType: 'JOIN',
        projectId: 'R260803',
        projectCode: 'YY2607005',
        projectName: '产业级应用后训练关键技术研究',
        positionOrReason: '产业应用指导导师',
        applicantRole: 'PROJECT_MENTOR',
        submittedAt: '2026-08-25 09:45',
        status: 'PENDING',
        step: 2,
      },
      {
        id: 'JA20260510002',
        applicationType: 'JOIN',
        projectId: 'R260802',
        projectCode: 'JC2608003',
        projectName: '生成式语言模型水印加密技术研究',
        positionOrReason: '模型安全研究成员',
        applicantRole: 'PROJECT_MENTOR',
        submittedAt: '2026-05-10 14:12',
        status: 'APPROVED',
        step: 3,
        approvalComment: '同意作为学术指导导师参与项目。',
      },
    ],
  },
  memberships: {
    PROJECT_STUDENT: [
      {
        id: 'MS260801',
        projectId: 'R260801',
        projectCode: 'ZX2608001',
        projectName: '多肽分子预测和设计算法',
        projectStatus: '在研',
        applicantRole: 'PROJECT_STUDENT',
        leaderName: '周旷奇',
        department: '智能科学技术',
        joinedAt: '2026-06-18',
        roleInProject: '算法研究成员',
        responsibility: '负责训练数据整理、基线模型复现与实验结果分析。',
        status: 'ACTIVE',
        memberAvatars: ['周', '林', '王', '李'],
      },
    ],
    PROJECT_MENTOR: [
      {
        id: 'MM260802',
        projectId: 'R260802',
        projectCode: 'JC2608003',
        projectName: '生成式语言模型水印加密技术研究',
        projectStatus: '在研',
        applicantRole: 'PROJECT_MENTOR',
        leaderName: '刘畅',
        department: '人工智能核心',
        joinedAt: '2026-05-12',
        roleInProject: '学术指导导师',
        responsibility: '负责研究路线指导、阶段成果评审与学术质量把关。',
        status: 'ACTIVE',
        memberAvatars: ['刘', '陈', '赵'],
      },
    ],
  },
  drafts: {
    PROJECT_STUDENT: {},
    PROJECT_MENTOR: {},
  },
}

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function normalizeState(value: Partial<ParticipantRecruitmentState> | null): ParticipantRecruitmentState {
  const base = cloneState(initialState)

  return {
    applications: {
      PROJECT_STUDENT: value?.applications?.PROJECT_STUDENT ?? base.applications.PROJECT_STUDENT,
      PROJECT_MENTOR: value?.applications?.PROJECT_MENTOR ?? base.applications.PROJECT_MENTOR,
    },
    memberships: {
      PROJECT_STUDENT: value?.memberships?.PROJECT_STUDENT ?? base.memberships.PROJECT_STUDENT,
      PROJECT_MENTOR: value?.memberships?.PROJECT_MENTOR ?? base.memberships.PROJECT_MENTOR,
    },
    drafts: {
      PROJECT_STUDENT: value?.drafts?.PROJECT_STUDENT ?? base.drafts.PROJECT_STUDENT,
      PROJECT_MENTOR: value?.drafts?.PROJECT_MENTOR ?? base.drafts.PROJECT_MENTOR,
    },
  }
}

export function createInitialParticipantRecruitmentState(): ParticipantRecruitmentState {
  return cloneState(initialState)
}

export function loadParticipantRecruitmentState(): ParticipantRecruitmentState {
  if (typeof window === 'undefined') {
    return createInitialParticipantRecruitmentState()
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return createInitialParticipantRecruitmentState()
  }

  try {
    return normalizeState(JSON.parse(stored) as Partial<ParticipantRecruitmentState>)
  } catch {
    return createInitialParticipantRecruitmentState()
  }
}

export function saveParticipantRecruitmentState(state: ParticipantRecruitmentState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resetParticipantRecruitmentState() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function canParticipantApply(project: RecruitmentProject, role: ParticipantRole) {
  return project.recruitTarget === 'ALL' || project.recruitTarget === role
}

export function isRecruitmentExpired(project: RecruitmentProject) {
  return new Date(`${project.applicationDeadline}T23:59:59`).getTime() < PROTOTYPE_NOW.getTime()
}

export function isRecruitmentOpen(project: RecruitmentProject) {
  return project.status === 'RECRUITING' && !isRecruitmentExpired(project)
}

export function createParticipantApplicationId(type: ParticipantApplicationType) {
  const prefix = type === 'JOIN' ? 'JA' : 'EA'
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
  const random = Math.floor(Math.random() * 90 + 10)
  return `${prefix}${timestamp}${random}`
}

export function formatPrototypeDateTime(date = PROTOTYPE_NOW) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
