import type { InitiationBatchMockRow } from './initiationProjectsMock'
import type { LoggedInUser } from '../types/auth'

export type StepStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'INVALID'

export type ProjectDirection = 'AI核心' | 'AI × 科学技术' | 'AI × 人文社科'

export type SpecialComputeDemand = '' | 'no' | 'yes'

export interface WizardStageDefinition {
  name: string
  note: string
  steps: number[]
}

export interface WizardStepDefinition {
  short: string
  title: string
  guide: string
}

export interface AnnualPlan {
  yearLabel: string
  researchTasks: string
  implementationPlan: string
  cooperationMode: string
  studentTrainingGoal: string
}

export interface ApplicationParticipant {
  category: '项目负责人' | '成员'
  name: string
  unit: string
  gender: string
  major: string
  title: string
  responsibility: string
}

export interface ApplicationBudget {
  equipment: number
  equipmentNote: string
  purchase: number
  purchaseNote: string
  business: number
  businessNote: string
  labor: number
  laborNote: string
}

export interface ProjectApplicationWizardState {
  batchId: string
  status: 'DRAFT' | 'SUBMITTED'
  templateVersion: string
  fillDate: string
  projectName: string
  projectDirection: ProjectDirection | ''
  projectCategory: string
  unitName: string
  applicantName: string
  gender: string
  birthMonth: string
  education: string
  professionalTitle: string
  mobile: string
  telephone: string
  email: string
  researchPeriod: number
  firstYearBudget: number
  abstract: string
  purposeSignificance: string
  researchStatus: string
  mainWork: string
  keyProblem: string
  technicalDifficulty: string
  technicalRoute: string
  methodInnovation: string
  applicantBackground: string
  researchFoundation: string
  teamProfile: string
  implementationExperience: string
  annualPlans: AnnualPlan[]
  overallGoal: string
  annualGoal: string
  expectedOutcomes: string
  impact: string
  talentDevelopment: string
  otherIndicators: string
  participants: ApplicationParticipant[]
  budget: ApplicationBudget
  specialCompute: SpecialComputeDemand
  computeScale: string
  computePeriod: string
  computeEnvironment: string
  computePurposeReason: string
  leaderIdCard: string
  jointEnabled: boolean
  jointName: string
  jointIdCard: string
  consent: boolean
  leaderSignatureDataUrl: string
  jointSignatureDataUrl: string
  leaderSignDate: string
  jointSignDate: string
}

const WIZARD_DRAFT_STORAGE_KEY = 'zgci_ky_oa_project_application_wizard_drafts'

export const wizardTemplateVersion = '2026年3月修订版'

export const wizardStages: WizardStageDefinition[] = [
  {
    name: '基础资料',
    note: '基本信息',
    steps: [0],
  },
  {
    name: '研究方案',
    note: '第一至三章',
    steps: [1, 2, 3],
  },
  {
    name: '任务与指标',
    note: '第四至五章',
    steps: [4, 5],
  },
  {
    name: '团队与资源',
    note: '第六至八章',
    steps: [6, 7, 8],
  },
  {
    name: '承诺提交',
    note: '第九章',
    steps: [9],
  },
]

export const wizardSteps: WizardStepDefinition[] = [
  {
    short: '基本信息',
    title: '基本信息表',
    guide: '填写项目、申请人、研究周期、首年预算及内容摘要。项目名称、负责人和填报时间会自动同步到申报书封面。',
  },
  {
    short: '一、目的与意义',
    title: '一、研究目的和意义简述',
    guide: '说明立项必要性、研究目的和意义，以及国内外研究现状。两部分合计不超过 1500 字。',
  },
  {
    short: '二、研究内容',
    title: '二、主要研究内容',
    guide: '填写主要工作内容，并明确关键科学问题、技术难点、技术路线和方法创新。合计不超过 1500 字。',
  },
  {
    short: '三、研究基础',
    title: '三、研究基础',
    guide: '说明申请人工作背景与研究基础、科研团队情况以及科研项目组织实施经验。合计不超过 1000 字。',
  },
  {
    short: '四、年度任务',
    title: '四、年度研究任务和实施方案',
    guide: '根据项目执行年限逐年度填写研究任务、实施方案、合作方式和项目学生培养目标。',
  },
  {
    short: '五、考核指标',
    title: '五、总体考核指标',
    guide: '考核指标应尽量量化，覆盖总体目标、年度目标、成果、影响力和人才队伍建设。',
  },
  {
    short: '六、参加人员',
    title: '六、参加人员名单',
    guide: '填写项目负责人及团队成员。项目负责人作为第一行，并与基本信息自动同步。',
  },
  {
    short: '七、经费预算',
    title: '七、经费预算表',
    guide: '填报首年经费预算，包含设备费、业务费和劳务费，并说明测算依据。劳务费原则上不超过总经费的 30%。',
  },
  {
    short: '八、算力说明',
    title: '八、算力说明',
    guide: '学院提供基础算力。如项目存在超过基础配额的特殊算力需求，请说明需求及原因。',
  },
  {
    short: '九、承诺签名',
    title: '九、项目经费使用承诺书',
    guide: '补充承诺书所需身份信息，阅读并确认承诺内容，最后完成项目负责人和联合项目负责人签名。',
  },
]

export function createDefaultWizardState(
  batch: InitiationBatchMockRow,
  currentUser: LoggedInUser | null,
): ProjectApplicationWizardState {
  const leaderName = currentUser?.displayName ?? '项目负责人'
  const unitName = currentUser?.department ?? '北京中关村学院'
  const today = formatDateInputValue(new Date())

  return {
    batchId: batch.id,
    status: 'DRAFT',
    templateVersion: wizardTemplateVersion,
    fillDate: today,
    projectName: '基于多模态大模型的科研知识协同方法研究',
    projectDirection: 'AI核心',
    projectCategory: '联合培育项目',
    unitName,
    applicantName: leaderName,
    gender: '男',
    birthMonth: '1992-06',
    education: '博士研究生',
    professionalTitle: '',
    mobile: '13800000000',
    telephone: '',
    email: 'lisi@example.edu.cn',
    researchPeriod: 2,
    firstYearBudget: 20,
    abstract: '',
    purposeSignificance: '',
    researchStatus: '',
    mainWork: '',
    keyProblem: '',
    technicalDifficulty: '',
    technicalRoute: '',
    methodInnovation: '',
    applicantBackground: '',
    researchFoundation: '',
    teamProfile: '',
    implementationExperience: '',
    annualPlans: [createAnnualPlan(1)],
    overallGoal: '',
    annualGoal: '',
    expectedOutcomes: '',
    impact: '',
    talentDevelopment: '',
    otherIndicators: '',
    participants: [
      {
        category: '项目负责人',
        name: leaderName,
        unit: unitName,
        gender: '男',
        major: '',
        title: '',
        responsibility: '项目总体负责',
      },
      {
        category: '成员',
        name: '',
        unit: '',
        gender: '',
        major: '',
        title: '',
        responsibility: '',
      },
    ],
    budget: {
      equipment: 0,
      equipmentNote: '',
      purchase: 0,
      purchaseNote: '',
      business: 0,
      businessNote: '',
      labor: 0,
      laborNote: '',
    },
    specialCompute: '',
    computeScale: '',
    computePeriod: '',
    computeEnvironment: '',
    computePurposeReason: '',
    leaderIdCard: '',
    jointEnabled: false,
    jointName: '',
    jointIdCard: '',
    consent: false,
    leaderSignatureDataUrl: '',
    jointSignatureDataUrl: '',
    leaderSignDate: today,
    jointSignDate: today,
  }
}

export function createAnnualPlan(index: number): AnnualPlan {
  return {
    yearLabel: `第${index}年度`,
    researchTasks: '',
    implementationPlan: '',
    cooperationMode: '',
    studentTrainingGoal: '',
  }
}

export function createParticipantRow(): ApplicationParticipant {
  return {
    category: '成员',
    name: '',
    unit: '',
    gender: '',
    major: '',
    title: '',
    responsibility: '',
  }
}

export function loadWizardDraft(
  batch: InitiationBatchMockRow,
  currentUser: LoggedInUser | null,
): ProjectApplicationWizardState {
  const storedDrafts = readStoredDrafts()
  const draft = storedDrafts[getDraftKey(batch.id, currentUser)]

  if (!draft) {
    return createDefaultWizardState(batch, currentUser)
  }

  return normalizeWizardState(draft, batch, currentUser)
}

export function saveWizardDraft(
  batchId: string,
  currentUser: LoggedInUser | null,
  draft: ProjectApplicationWizardState,
) {
  const storedDrafts = readStoredDrafts()

  storedDrafts[getDraftKey(batchId, currentUser)] = cloneWizardState(draft)
  window.localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(storedDrafts))
}

export function cloneWizardState(state: ProjectApplicationWizardState): ProjectApplicationWizardState {
  return {
    ...state,
    annualPlans: state.annualPlans.map((plan) => ({ ...plan })),
    participants: state.participants.map((participant) => ({ ...participant })),
    budget: {
      ...state.budget,
    },
  }
}

export function formatFillMonth(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '尚未填写'
  }

  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${date.getFullYear()}年${month}月`
}

export function formatDateInputValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

function normalizeWizardState(
  draft: Partial<ProjectApplicationWizardState>,
  batch: InitiationBatchMockRow,
  currentUser: LoggedInUser | null,
): ProjectApplicationWizardState {
  const defaultState = createDefaultWizardState(batch, currentUser)

  return syncLeaderRow({
    ...defaultState,
    ...draft,
    batchId: batch.id,
    status: draft.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT',
    templateVersion: draft.templateVersion || wizardTemplateVersion,
    projectCategory: draft.projectCategory || defaultState.projectCategory,
    annualPlans: Array.isArray(draft.annualPlans) && draft.annualPlans.length > 0
      ? draft.annualPlans.map((plan, index) => ({
          ...createAnnualPlan(index + 1),
          ...plan,
        }))
      : defaultState.annualPlans,
    participants: Array.isArray(draft.participants) && draft.participants.length > 0
      ? draft.participants.map((participant, index) => ({
          ...createParticipantRow(),
          ...participant,
          category: index === 0 ? '项目负责人' : participant.category === '项目负责人' ? '成员' : participant.category ?? '成员',
        }))
      : defaultState.participants,
    budget: {
      ...defaultState.budget,
      ...draft.budget,
    },
  })
}

function syncLeaderRow(state: ProjectApplicationWizardState) {
  const leaderRow = state.participants[0] ?? createParticipantRow()

  state.participants[0] = {
    ...leaderRow,
    category: '项目负责人',
    name: state.applicantName,
    unit: state.unitName,
    gender: state.gender,
    title: state.professionalTitle,
    responsibility: leaderRow.responsibility || '项目总体负责',
  }

  return state
}

function getDraftKey(batchId: string, currentUser: LoggedInUser | null) {
  return `${currentUser?.id ?? 'anonymous'}::${batchId}`
}

function readStoredDrafts(): Record<string, ProjectApplicationWizardState> {
  const rawValue = window.localStorage.getItem(WIZARD_DRAFT_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    return JSON.parse(rawValue) as Record<string, ProjectApplicationWizardState>
  } catch {
    return {}
  }
}
