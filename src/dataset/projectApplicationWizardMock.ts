import type { InitiationBatchMockRow } from './initiationProjectsMock'
import type { LoggedInUser } from '../types/auth'

export type StepStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'INVALID'

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

export interface ApplicationParticipant {
  category: '项目负责人' | '成员'
  name: string
  unit: string
  gender: string
  major: string
  title: string
  responsibility: string
}

export interface AnnualAllocation {
  yearLabel: string
  amount: number
}

export interface ProjectApplicationWizardState {
  batchId: string
  status: 'DRAFT' | 'SUBMITTED'
  templateVersion: string
  fillDate: string
  /** 表7(a) 项目基本信息 */
  projectName: string
  department: string
  subdirection: string
  projectCategory: string
  researchPeriod: number
  firstYearBudget: number
  firstYearBudgetNote: string
  abstract: string
  defensePptName: string
  /** 表7(b) 申请人信息（主数据带出，允许补充） */
  unitName: string
  applicantName: string
  gender: string
  birthMonth: string
  education: string
  professionalTitle: string
  mobile: string
  email: string
  /** 表7(c) 项目研究内容信息 */
  researchPurpose: string
  mainResearchContent: string
  researchFoundation: string
  annualTasks: string
  assessmentIndicators: string
  /** 表7(d) 参加人员名单（子表） */
  participants: ApplicationParticipant[]
  /** 表7(e) 项目预算明细（包干制） */
  totalBudget: number
  annualAllocations: AnnualAllocation[]
  packageNote: string
  /** 表7(f) 项目经费使用承诺书 */
  consent: boolean
  consentConfirmedAt: string
  jointEnabled: boolean
  jointLeaderName: string
}

const WIZARD_DRAFT_STORAGE_KEY = 'zgci_ky_oa_project_application_wizard_drafts'

export const wizardTemplateVersion = '2026年3月修订版'

/** PMO 预设项目总预算（万元，原型固定值） */
export const wizardPresetTotalBudget = 50

export const wizardStages: WizardStageDefinition[] = [
  {
    name: '基础资料',
    note: '',
    steps: [0, 1],
  },
  {
    name: '研究方案',
    note: '',
    steps: [2, 3],
  },
  {
    name: '预算与承诺',
    note: '',
    steps: [4, 5, 6],
  },
]

export const wizardSteps: WizardStepDefinition[] = [
  {
    short: '基本信息',
    title: '项目基本信息',
    guide: '填写项目名称、所属学部与子方向、研究周期及内容摘要。类别与批次信息同步，不可修改。',
  },
  {
    short: '申请人信息',
    title: '申请人信息',
    guide: '单位、姓名、性别、出生年月、学历、职称由人员主数据自动带出；手机/电话与邮箱可修改，用于联络。',
  },
  {
    short: '研究内容',
    title: '项目研究内容',
    guide: '按一至五章填写：研究目的和意义（≤1500字）、主要研究内容（≤1500字）、研究基础（≤1000字）、年度研究任务和实施方案、总体考核指标。',
  },
  {
    short: '参加人员',
    title: '参加人员名单',
    guide: '内部人员从组织架构/学籍名单选择自动带出，外单位人员可直接手动输入。项目负责人行与申请人信息自动同步。',
  },
  {
    short: '预算明细',
    title: '项目预算明细',
    guide: '本批次按包干制管理，项目总预算由 PMO 预设（固定），申请人无需填写预算明细，阅读包干说明即可。',
  },
  {
    short: '答辩材料',
    title: '答辩材料',
    guide: '上传答辩 PPT 附件（复审必填），支持 PPT/PPTX/PDF，不超过 100MB。',
  },
  {
    short: '承诺书',
    title: '项目经费使用承诺书',
    guide: '阅读系统预置承诺书全文并在线确认，系统记录确认人与确认时间；如存在联合项目负责人可补充填写。',
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
    department: '人工智能学部',
    subdirection: 'AI核心',
    projectCategory: batch.project_category ?? '联合培育项目',
    researchPeriod: 2,
    firstYearBudget: 20,
    firstYearBudgetNote: '',
    abstract: '',
    defensePptName: '',
    unitName,
    applicantName: leaderName,
    gender: '男',
    birthMonth: '1992-06',
    education: '博士研究生',
    professionalTitle: '副研究员',
    mobile: '13800000000',
    email: 'lisi@example.edu.cn',
    researchPurpose: '',
    mainResearchContent: '',
    researchFoundation: '',
    annualTasks: '',
    assessmentIndicators: '',
    participants: [
      {
        category: '项目负责人',
        name: leaderName,
        unit: unitName,
        gender: '男',
        major: '',
        title: '副研究员',
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
    totalBudget: wizardPresetTotalBudget,
    annualAllocations: createAnnualAllocations(2),
    packageNote: '',
    consent: false,
    consentConfirmedAt: '',
    jointEnabled: false,
    jointLeaderName: '',
  }
}

export function createAnnualAllocation(index: number): AnnualAllocation {
  return {
    yearLabel: `第${index}年度`,
    amount: 0,
  }
}

export function createAnnualAllocations(period: number): AnnualAllocation[] {
  const count = Math.max(1, Math.min(5, Math.round(period) || 1))

  return Array.from({ length: count }, (_item, index) => createAnnualAllocation(index + 1))
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
    participants: state.participants.map((participant) => ({ ...participant })),
    annualAllocations: state.annualAllocations.map((allocation) => ({ ...allocation })),
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
    projectCategory: batch.project_category ?? defaultState.projectCategory,
    totalBudget: defaultState.totalBudget,
    annualAllocations:
      Array.isArray(draft.annualAllocations) && draft.annualAllocations.length > 0
        ? draft.annualAllocations.map((allocation, index) => ({
            ...createAnnualAllocation(index + 1),
            ...allocation,
          }))
        : defaultState.annualAllocations,
    participants: Array.isArray(draft.participants) && draft.participants.length > 0
      ? draft.participants.map((participant, index) => ({
          ...createParticipantRow(),
          ...participant,
          category: index === 0 ? '项目负责人' : participant.category === '项目负责人' ? '成员' : participant.category ?? '成员',
        }))
      : defaultState.participants,
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
