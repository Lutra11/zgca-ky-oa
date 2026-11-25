import type { LoggedInUser } from '../types/auth'
import { initiationBatchMockRows } from './initiationProjectsMock'
import type {
  AnnualAllocation,
  ApplicationParticipant,
  ProjectApplicationWizardState,
} from './projectApplicationWizardMock'
import {
  createAnnualAllocations,
  wizardPresetTotalBudget,
  wizardTemplateVersion,
} from './projectApplicationWizardMock'

export type ProjectMemberProjectStatus = '申报评审中' | '已立项' | '在研' | '结题中'

export interface ProjectMemberProjectRow {
  id: string
  projectId: string
  projectCode: string
  projectName: string
  batchId: string
  batchName: string
  projectCategory: string
  leaderId: string
  leaderName: string
  departmentName: string
  submitTime: string
  projectStatus: ProjectMemberProjectStatus
  currentNode: string
  researchPeriod: string
  totalBudget: number
  firstYearBudget: number
  sourceWordName: string
  generatedPdfName: string
  financeProjectId?: string
  application: ProjectApplicationWizardState
  isOwnerDemo?: boolean
}

const defaultBatch = initiationBatchMockRows.find((batch) => batch.id === 'batch-2026-q3') ?? initiationBatchMockRows[0]

type ProjectApplicationOverride = Partial<Omit<ProjectApplicationWizardState, 'participants' | 'annualAllocations'>> & {
  batchId: string
  projectName: string
  applicantName: string
  unitName: string
  participants?: ApplicationParticipant[]
  annualAllocations?: AnnualAllocation[]
}

function buildApplication(override: ProjectApplicationOverride): ProjectApplicationWizardState {
  const base: ProjectApplicationWizardState = {
    batchId: override.batchId,
    status: 'SUBMITTED',
    templateVersion: wizardTemplateVersion,
    fillDate: '2026-08-25',
    projectName: override.projectName,
    department: '人工智能学部',
    subdirection: 'AI核心',
    projectCategory: '联合培育项目',
    researchPeriod: 2,
    firstYearBudget: 20,
    firstYearBudgetNote: '',
    abstract:
      '项目围绕人工智能与重点应用场景融合中的关键问题，形成可验证的方法、原型系统和阶段性成果，为后续持续研究与应用转化奠定基础。',
    defensePptName: `${override.projectName}答辩PPT.pdf`,
    unitName: override.unitName,
    applicantName: override.applicantName,
    gender: '男',
    birthMonth: '1998-06',
    education: '硕士研究生',
    professionalTitle: '项目负责人',
    mobile: '13800000000',
    email: 'member@example.edu.cn',
    researchPurpose:
      '本项目面向科研与产业应用中高质量智能模型构建需求，研究多源数据、专业知识与模型推理协同机制，提升复杂任务中的可靠性和可解释性。',
    mainResearchContent:
      '构建场景数据集，研究知识增强建模方法，明确关键科学问题、技术难点、技术路线与方法创新，开发原型系统并完成实验验证与应用示范。',
    researchFoundation:
      '申请人长期参与人工智能相关科研训练，具备算法实现、实验设计和项目协同经验；团队覆盖算法开发、数据处理、系统实现和测试验证。',
    annualTasks:
      '第1年度：完成需求分析、数据集建设、核心算法验证和阶段性实验；第2年度：完成原型系统集成、场景验证、成果凝练和结题材料准备。',
    assessmentIndicators:
      '总目标：形成可复用的科研智能辅助方法与原型系统；年度目标：首年完成数据、算法和实验基础，次年完成系统验证与成果总结；预期成果：论文、软件著作权、技术报告与可演示原型。',
    participants: [
      {
        category: '项目负责人',
        name: override.applicantName,
        unit: override.unitName,
        gender: '男',
        major: '人工智能',
        title: '项目负责人',
        responsibility: '项目总体负责、研究方案设计与成果凝练',
      },
      {
        category: '成员',
        name: '李思远',
        unit: '北京中关村学院',
        gender: '男',
        major: '计算机科学与技术',
        title: '学生成员',
        responsibility: '模型训练与实验分析',
      },
      {
        category: '成员',
        name: '王欣然',
        unit: '北京中关村学院',
        gender: '女',
        major: '人工智能',
        title: '学生成员',
        responsibility: '数据整理与原型测试',
      },
    ],
    totalBudget: wizardPresetTotalBudget,
    annualAllocations: [
      { yearLabel: '第1年度', amount: 30 },
      { yearLabel: '第2年度', amount: 20 },
    ],
    packageNote: '经费按包干制管理，按年度考评与财政到位情况拨付。',
    consent: true,
    consentConfirmedAt: '2026年08月（系统记录）',
    jointEnabled: false,
    jointLeaderName: '',
  }

  return {
    ...base,
    ...override,
    participants: override.participants ?? base.participants,
    annualAllocations: override.annualAllocations ?? base.annualAllocations,
  }
}

export const projectMemberProjectRows: ProjectMemberProjectRow[] = [
  {
    id: 'owner-project-001',
    projectId: 'owner-project-001',
    projectCode: 'PMJ240402',
    projectName: '基于深度学习的量子材料力学性能预测方法研究',
    batchId: 'batch-2026-q3',
    batchName: defaultBatch.batch_name ?? defaultBatch.batchName,
    projectCategory: '联合培育项目',
    leaderId: 'u006',
    leaderName: '赵同学',
    departmentName: '项目组成员',
    submitTime: '2026-08-18 14:20',
    projectStatus: '申报评审中',
    currentNode: '评审中',
    researchPeriod: '2026.09—2028.08',
    totalBudget: 200000,
    firstYearBudget: 200000,
    sourceWordName: '基于深度学习的量子材料力学性能预测方法研究申报书.docx',
    generatedPdfName: '基于深度学习的量子材料力学性能预测方法研究申报书.pdf',
    application: buildApplication({
      batchId: 'batch-2026-q3',
      projectName: '基于深度学习的量子材料力学性能预测方法研究',
      applicantName: '赵同学',
      unitName: '北京中关村学院',
      subdirection: 'AI × 科学技术',
      abstract:
        '项目面向量子材料力学性能预测任务，研究深度学习模型与物理约束知识融合方法，提升小样本材料性能预测的准确性和可解释性。',
      mainResearchContent:
        '构建量子材料样本数据集，设计物理约束特征表达，训练性能预测模型，完成实验验证和模型解释分析。',
    }),
    isOwnerDemo: true,
  },
  {
    id: 'owner-project-002',
    projectId: 'finance-prj-001',
    projectCode: 'JC2608005',
    projectName: '基础培育类项目经费执行示例',
    batchId: 'batch-2026-q2',
    batchName: '2026 年第 2 季度科研项目立项批次',
    projectCategory: '基础培育项目',
    leaderId: 'u006',
    leaderName: '赵同学',
    departmentName: '人工智能学院',
    submitTime: '2026-05-16 10:08',
    projectStatus: '在研',
    currentNode: '已立项',
    researchPeriod: '2026.07—2027.06',
    totalBudget: 500000,
    firstYearBudget: 200000,
    sourceWordName: '基础培育类项目经费执行示例申报书.docx',
    generatedPdfName: '基础培育类项目经费执行示例申报书.pdf',
    financeProjectId: 'finance-prj-001',
    application: buildApplication({
      batchId: 'batch-2026-q2',
      projectName: '基础培育类项目经费执行示例',
      applicantName: '赵同学',
      unitName: '人工智能学院',
      fillDate: '2026-05-16',
      subdirection: 'AI核心',
      firstYearBudget: 20,
      assessmentIndicators:
        '完成基础培育类项目的方法验证、实验平台搭建和阶段性成果产出。',
      annualAllocations: createAnnualAllocations(1).map((item) => ({
        ...item,
        amount: 50,
      })),
    }),
    isOwnerDemo: true,
  },
  {
    id: 'owner-project-003',
    projectId: 'finance-prj-002',
    projectCode: 'ZX2608001',
    projectName: '多肽分子预测和设计算法研究',
    batchId: 'batch-2026-q2',
    batchName: '2026 年第 2 季度科研项目立项批次',
    projectCategory: '横向项目',
    leaderId: 'u006',
    leaderName: '赵同学',
    departmentName: '生命科学中心',
    submitTime: '2026-05-20 09:35',
    projectStatus: '在研',
    currentNode: '已立项',
    researchPeriod: '2026.04—2027.03',
    totalBudget: 900000,
    firstYearBudget: 300000,
    sourceWordName: '多肽分子预测和设计算法研究申报书.docx',
    generatedPdfName: '多肽分子预测和设计算法研究申报书.pdf',
    financeProjectId: 'finance-prj-002',
    application: buildApplication({
      batchId: 'batch-2026-q2',
      projectName: '多肽分子预测和设计算法研究',
      applicantName: '赵同学',
      unitName: '生命科学中心',
      fillDate: '2026-05-20',
      subdirection: 'AI × 科学技术',
      abstract:
        '项目围绕多肽分子结构生成、性质预测和候选分子筛选开展研究，探索智能设计算法在生命科学交叉场景中的应用。',
      researchPurpose:
        '多肽分子设计具有重要科研价值和产业应用潜力，智能算法可以显著提升候选分子筛选效率。',
      mainResearchContent:
        '开展多肽分子表示学习、性质预测模型、生成式设计算法和实验验证策略研究。',
    }),
    isOwnerDemo: true,
  },
]

export function getProjectMemberProjects(currentUser: LoggedInUser | null) {
  const ownProjects = projectMemberProjectRows.filter(
    (project) =>
      (currentUser && (project.leaderId === currentUser.id || project.leaderName === currentUser.displayName)) ||
      project.isOwnerDemo,
  )

  return ownProjects.length > 0 ? ownProjects : projectMemberProjectRows.filter((project) => project.isOwnerDemo)
}

export function getProjectMemberProjectDetail(projectId: string, currentUser: LoggedInUser | null) {
  return (
    getProjectMemberProjects(currentUser).find(
      (project) =>
        project.projectId === projectId ||
        project.projectCode === projectId ||
        project.id === projectId,
    ) ?? null
  )
}
