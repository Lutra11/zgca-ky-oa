import type { LoggedInUser } from '../types/auth'
import { initiationBatchMockRows } from './initiationProjectsMock'
import type {
  ApplicationBudget,
  ApplicationParticipant,
  AnnualPlan,
  ProjectApplicationWizardState,
} from './projectApplicationWizardMock'
import { wizardTemplateVersion } from './projectApplicationWizardMock'

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

type ProjectApplicationOverride = Omit<
  Partial<ProjectApplicationWizardState>,
  'annualPlans' | 'participants' | 'budget'
> & {
  batchId: string
  projectName: string
  applicantName: string
  unitName: string
  annualPlans?: AnnualPlan[]
  participants?: ApplicationParticipant[]
  budget?: Partial<ApplicationBudget>
}

function buildApplication(override: ProjectApplicationOverride): ProjectApplicationWizardState {
  const base: ProjectApplicationWizardState = {
    batchId: override.batchId,
    status: 'SUBMITTED',
    templateVersion: wizardTemplateVersion,
    fillDate: '2026-08-25',
    projectName: override.projectName,
    projectDirection: 'AI核心',
    projectCategory: '联合培育项目',
    unitName: override.unitName,
    applicantName: override.applicantName,
    gender: '男',
    birthMonth: '1998-06',
    education: '硕士研究生',
    professionalTitle: '项目负责人',
    mobile: '13800000000',
    telephone: '010-88886666',
    email: 'member@example.edu.cn',
    researchPeriod: 2,
    firstYearBudget: 20,
    abstract:
      '项目围绕人工智能与重点应用场景融合中的关键问题，形成可验证的方法、原型系统和阶段性成果，为后续持续研究与应用转化奠定基础。',
    purposeSignificance:
      '本项目面向科研与产业应用中高质量智能模型构建需求，研究多源数据、专业知识与模型推理协同机制，提升复杂任务中的可靠性和可解释性。',
    researchStatus:
      '国内外相关研究已在大模型、知识增强和多模态学习方面取得进展，但在特定科研场景下仍存在数据稀缺、推理链不稳定和任务闭环不足等问题。',
    mainWork:
      '构建场景数据集，研究知识增强建模方法，开发原型系统，并完成实验验证与应用示范。',
    keyProblem:
      '解决跨源信息对齐、专业知识约束表达和模型推理可靠性评价问题。',
    technicalDifficulty:
      '主要难点包括多模态数据质量差异、科研知识结构化不足以及模型输出稳定性控制。',
    technicalRoute:
      '按照需求分析、数据治理、模型构建、实验验证、原型迭代和成果总结的路线推进。',
    methodInnovation:
      '引入知识约束与多任务协同训练机制，探索面向科研场景的可信智能辅助方法。',
    applicantBackground:
      '申请人长期参与人工智能相关科研训练，具备算法实现、实验设计和项目协同经验。',
    researchFoundation:
      '前期已完成部分数据整理、模型验证和文献调研，形成了可继续扩展的研究基础。',
    teamProfile:
      '团队成员覆盖算法开发、数据处理、系统实现和测试验证，分工清晰。',
    implementationExperience:
      '团队曾参与校内科研训练和横向课题支撑工作，具备按计划推进项目的组织经验。',
    annualPlans: [
      {
        yearLabel: '第1年度',
        researchTasks: '完成需求分析、数据集建设、核心算法验证和阶段性实验。',
        implementationPlan: '建立数据治理流程，完成模型基线，开展对比实验和消融实验。',
        cooperationMode: '项目负责人统筹，成员按模块协同推进，导师定期指导。',
        studentTrainingGoal: '培养学生完成文献调研、模型训练、实验分析和技术报告撰写。',
      },
      {
        yearLabel: '第2年度',
        researchTasks: '完成原型系统集成、场景验证、成果凝练和结题材料准备。',
        implementationPlan: '优化模型性能，补充应用验证，形成论文、专利或软件成果。',
        cooperationMode: '与学院平台和相关团队协作，开展应用场景联调验证。',
        studentTrainingGoal: '提升学生独立承担科研任务、工程实现和成果表达能力。',
      },
    ],
    overallGoal: '形成一套可复用的科研智能辅助方法和原型系统，支撑后续课题申报与成果产出。',
    annualGoal: '首年完成数据、算法和实验基础；第二年完成系统验证和成果总结。',
    expectedOutcomes: '预期形成论文、软件著作权、技术报告和可演示原型系统。',
    impact: '提升学院人工智能交叉科研项目的组织效率和应用示范能力。',
    talentDevelopment: '培养学生在人工智能方法、科研规范和项目协作方面的综合能力。',
    otherIndicators: '完成不少于1次阶段汇报、1套实验数据与1份项目总结报告。',
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
    budget: {
      equipment: 4,
      equipmentNote: '用于购置小型实验设备及必要外设。',
      purchase: 2,
      purchaseNote: '设备购置费属于设备费明细，不重复计入合计。',
      business: 11,
      businessNote: '用于算力服务、数据处理、测试验证、差旅和资料服务。',
      labor: 5,
      laborNote: '用于项目学生参与科研训练的劳务补助，未超过30%控制线。',
    },
    specialCompute: 'yes',
    computeScale: '约 1,000 GPU 小时',
    computePeriod: '2026.09—2027.03',
    computeEnvironment: 'Python、PyTorch、CUDA 基础环境',
    computePurposeReason: '用于模型训练、参数调优和大规模实验对比。',
    leaderIdCard: '110101199806060011',
    jointEnabled: false,
    jointName: '',
    jointIdCard: '',
    consent: true,
    leaderSignatureDataUrl: '',
    jointSignatureDataUrl: '',
    leaderSignDate: '2026-08-25',
    jointSignDate: '2026-08-25',
  }

  return {
    ...base,
    ...override,
    participants: override.participants ?? base.participants,
    annualPlans: override.annualPlans ?? base.annualPlans,
    budget: {
      ...base.budget,
      ...override.budget,
    },
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
      projectDirection: 'AI × 科学技术',
      abstract:
        '项目面向量子材料力学性能预测任务，研究深度学习模型与物理约束知识融合方法，提升小样本材料性能预测的准确性和可解释性。',
      mainWork:
        '构建量子材料样本数据集，设计物理约束特征表达，训练性能预测模型，完成实验验证和模型解释分析。',
      keyProblem: '解决小样本材料数据下模型泛化能力不足和物理一致性难以保证的问题。',
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
      projectDirection: 'AI核心',
      firstYearBudget: 20,
      overallGoal: '完成基础培育类项目的方法验证、实验平台搭建和阶段性成果产出。',
      budget: {
        equipment: 12,
        business: 28,
        labor: 10,
      },
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
      projectDirection: 'AI × 科学技术',
      abstract:
        '项目围绕多肽分子结构生成、性质预测和候选分子筛选开展研究，探索智能设计算法在生命科学交叉场景中的应用。',
      purposeSignificance:
        '多肽分子设计具有重要科研价值和产业应用潜力，智能算法可以显著提升候选分子筛选效率。',
      mainWork:
        '开展多肽分子表示学习、性质预测模型、生成式设计算法和实验验证策略研究。',
      budget: {
        equipment: 16,
        business: 42,
        labor: 18,
      },
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
