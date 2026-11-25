<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import type { Component } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules,
  type UploadFile,
  type UploadInstance,
  type UploadRawFile,
} from 'element-plus'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Back,
  Calendar,
  Collection,
  Connection,
  DataAnalysis,
  Document,
  DocumentAdd,
  Finished,
  FolderOpened,
  Medal,
  Money,
  Operation,
  PieChart,
  Plus,
  Search,
  TrendCharts,
  Upload,
  UploadFilled,
  User,
} from '@element-plus/icons-vue'
import AppTopBar from '../components/AppTopBar.vue'
import InitiationBatchCard from '../components/initiation/InitiationBatchCard.vue'
import InitiationBatchDetail from '../components/initiation/InitiationBatchDetail.vue'
import InitiationBatchFilter from '../components/initiation/InitiationBatchFilter.vue'
import LaunchPlanGantt from '../components/initiation/LaunchPlanGantt.vue'
import InitiationDeclarationReview from '../components/initiation/InitiationDeclarationReview.vue'
import recheckPptUrl from '../dataset/img/test.pdf'
import ReviewerAssignmentPanel from '../components/initiation/ReviewerAssignmentPanel.vue'
import MyReviewTasks from '../components/reviewer/MyReviewTasks.vue'
import ReviewTaskDetail from '../components/reviewer/ReviewTaskDetail.vue'
import ApplicationPdfPreview from '../components/initiation/ApplicationPdfPreview.vue'
import ProjectApplicationFormPanel from '../components/initiation/ProjectApplicationFormPanel.vue'
import ProjectApplicationWizard from '../components/initiation/ProjectApplicationWizard.vue'
import FinanceOverview from '../components/finance/FinanceOverview.vue'
import FinanceProjectDetailPage from '../components/finance/FinanceProjectDetailPage.vue'
import PaperOutcomesManagement from '../components/outcomes/PaperOutcomesManagement.vue'
import ProjectMemberPaperCreate from '../components/outcomes/ProjectMemberPaperCreate.vue'
import ProjectMemberMyPapers from '../components/outcomes/ProjectMemberMyPapers.vue'
import ProjectLibraryDetail from '../components/projects/ProjectLibraryDetail.vue'
import ProjectLibraryLedger from '../components/projects/ProjectLibraryLedger.vue'
import ProjectChangeManagement from '../components/projects/ProjectChangeManagement.vue'
import ProjectStartManagement from '../components/projects/ProjectStartManagement.vue'
import ProjectMemberMyProjects from '../components/projects/ProjectMemberMyProjects.vue'
import ProjectApplicationProjects from '../components/projects/ProjectApplicationProjects.vue'
import ProjectMemberProjectDetail from '../components/projects/ProjectMemberProjectDetail.vue'
import ProjectParticipantRecruitment from '../components/projects/participant/ProjectParticipantRecruitment.vue'
import AdminProjectRecruitmentOverview from '../components/projects/recruitment/AdminProjectRecruitmentOverview.vue'
import ProjectRecruitmentApplications from '../components/projects/recruitment/ProjectRecruitmentApplications.vue'
import ProjectRecruitmentManagement from '../components/projects/recruitment/ProjectRecruitmentManagement.vue'
import ProjectRecruitmentMembers from '../components/projects/recruitment/ProjectRecruitmentMembers.vue'
import ApprovalWorkflowSettings from '../components/workflow/ApprovalWorkflowSettings.vue'
import QuarterlyReviewMeeting from './common/QuarterlyReviewMeeting.vue'
import KyownerAnnouncementPublish from './kyowner/AnnouncementPublish.vue'
import KyownerReviewProjects from './kyowner/ReviewProjects.vue'
import AnnouncementPublish from './owner/announcement/AnnouncementPublish.vue'
import OwnerMonitorProgress from './owner/MonitorProgress.vue'
import OwnerProjectDetail from './owner/project-management/ProjectDetail.vue'
import ReviewConfigDetail from './owner/review-config/ReviewConfigDetail.vue'
import OwnerReviewLaunch from './owner/ReviewLaunch.vue'
import OwnerTemplate from './owner/Template.vue'
import OwnerTemplateBuilder from './owner/TemplateBuilder.vue'
import SubdirectionReviewManagement from './subdirection/ReviewManagement.vue'
import {
  clearCurrentUser,
  getCurrentUser,
  getRoleFeatureConfigs,
  getRoleFeaturePath,
  getRoleRouteConfig,
  roleRouteConfigs,
} from '../utils/auth'
import {
  initiationBatchMockRows,
  initiationProjectMockRows,
  initiationQuarterOptions,
  initiationYearOptions,
  type InitiationBatchMockRow,
  type InitiationProjectMockRow,
  type InitiationProjectNode,
  type InitiationToolKey,
} from '../dataset/initiationProjectsMock'
import { getProjectMemberProjects } from '../dataset/projectMemberProjectsMock'
import { officeLaunchFeedback, setOfficeLaunchRejected, resetOfficeLaunchFeedback } from '../utils/office-feedback'
import {
  finalReviewReport,
  finalReviewRows as finalReviewRowsSource,
  type FinalReviewSummaryRow,
} from '../dataset/finalReviewReportMock'
import FinalScoreDetailDialog, { type ScoreDetailTarget } from '../components/initiation/FinalScoreDetailDialog.vue'
import {
  pmoFinalFacultySummaries as pmoFinalFacultySummariesSource,
  pmoRecheckMonitorRows,
  type PMORecheckMonitorRow,
} from '../dataset/pmoFinalReviewMock'
import {
  facultyRecommendReport,
  notRecommendedRows,
  recommendRows,
} from '../dataset/facultyRecommendReportMock'
import { isWorkflowBatchConfigured, readWorkflowDraft, type WorkflowMeta } from '../dataset/initiationWorkflowMock'
import {
  createWorkflowConfigRow,
  getWorkflowConfigRow,
  loadWorkflowConfigRows,
  toWorkflowMeta,
  updateWorkflowConfigRowFromMeta,
  upsertWorkflowConfigRow,
  type WorkflowConfigMockRow,
} from '../dataset/workflowConfigMock'
import type { FinanceViewKey } from '../dataset/researchFinanceMock'
import {
  createDefaultProjectApplicationForm,
  createGeneratedPdfId,
  createSignatureFileState,
  createWordFileState,
  loadProjectApplicationDraft,
  saveProjectApplicationDraft,
  type ApplicationPreviewStatus,
  type ApplicationWordFileState,
  type ProjectApplicationDraftRecord,
  type ProjectApplicationForm,
} from '../dataset/projectApplicationMock'
import type { LoggedInUser, RoleFeatureKey, RoleKey } from '../types/auth'

interface BreadcrumbItem {
  label: string
  to?: string
  /** 点击回调（优先于 to：用于不改 URL、仅重置组件内视图状态的返回，如批次流转线返回批次列表） */
  action?: () => void
}

interface PrimaryMenuItem {
  key: string
  label: string
  icon: string
}

interface PrimaryMenuGroup {
  label: string
  items: PrimaryMenuItem[]
}

interface LandingCard {
  title: string
  desc: string
  role: string
  iconText: string
  routeSegment?: string
  /** 字段说明（FD 固化）：卡片标题旁 ℹ 角标 hover 显示 */
  hint?: string
  path?: string
  iconUrl?: string
  accent: string
  soft: string
}

interface LandingModule {
  title: string
  eyebrow: string
  desc: string
  tip: string
  items: Omit<LandingCard, 'accent' | 'soft'>[]
}

interface LaunchInitiationForm {
  /** 项目归属组织（组织多选） */
  owner_organizations: string[]
  /** 科研项目类别（单选文本） */
  project_category: string
  /** 批次编码（自动，全局唯一） */
  batch_code: string
  /** 批次名称（≤50字） */
  batch_name: string
  /** 项目经费来源（单选） */
  funding_source: string
  /** 项目预算方式（单选+配置） */
  budget_mode: string
  /** 绑定流程模板（下拉） */
  workflow_template: string
  /** 绑定申报表单模板（下拉） */
  form_template: string
  /** 项目批次说明（富文本，≤2000字） */
  batch_introduction: string
  /** 申报起止时间 */
  batch_apply_start: string
  batch_apply_deadline: string
  /** 立项指南附件（PDF/DOCX ≤100MB） */
  batch_guide_file: string
  /** 目标群体（组织/人员多选） */
  target_groups: string[]
  /** 发起人（自动，不可改） */
  launch_owner: string
  /** 申报项目限制（是/否） */
  declaration_limit: string
}

interface LaunchBatchSeed {
  year: number
  quarter: number
  code: string
  name: string
  applyStart: string
  applyDeadline: string
}

type WorkbenchNewsTab = 'notice' | 'news'

interface WorkbenchShortcut {
  title: string
  desc: string
  action: string
  icon: Component
}

interface WorkbenchNewsItem {
  title: string
  category: string
  date: string
  isNew: boolean
}

type WorkbenchTodoPriority = 'urgent' | 'high' | 'normal'

interface WorkbenchTodoItem {
  taskId: string
  title: string
  module: string
  taskType: string
  deadline: string
  targetUrl: string
}

interface WorkbenchTodoDisplayItem extends WorkbenchTodoItem {
  urgency: WorkbenchTodoPriority
  urgencyLabel: string
  urgencyReason: string
  sortTime: number
  hasDeadline: boolean
}

interface WorkbenchMetric {
  label: string
  value: number
  unit: string
  delta?: string
}

interface WorkbenchStatusItem {
  name: string
  value: number
  color: string
}

interface WorkbenchBoardData {
  metrics: WorkbenchMetric[]
  trend: number[]
  status: WorkbenchStatusItem[]
}

type BatchStatusView = 'active' | 'history'
type LeaderBatchTimeStatus = '未开始' | '申报中' | '已结束'
type ApprovalRoleInitiationView = 'self' | 'projectMember' | 'projectApproval'

/** 批次详情两条审查线: '' 选择 / 'formal' 形式审查审批 / 'final' 学部推荐立项终审 */
type ApprovalRoleBatchStage = '' | 'formal' | 'final' | 'guide' | 'recheck' | 'archive'

/** 管理办负责人项目审批五步流转线: '' 首页(直接展示流转线) / guide 发布 / formal 形式审查 / final 初审 / recheck 复审 / archive 立项入库 */
type OfficeApprovalStage = '' | 'guide' | 'formal' | 'final' | 'recheck' | 'archive'

const approvalRoleBatchStage = shallowRef<ApprovalRoleBatchStage>('')

/** 学部批次初审阶段两步：assign 指定子方向与评委（评委分配已并入批次流转线） / report 评审结果报告 */
type ApprovalRoleFinalSubStep = 'assign' | 'report'
const approvalRoleFinalSubStep = shallowRef<ApprovalRoleFinalSubStep>('assign')

function selectApprovalRoleFinalSubStep(sub: ApprovalRoleFinalSubStep) {
  approvalRoleFinalSubStep.value = sub
}

/** 从批次内进入「指定子方向与评委」（AN 融合：不再跳出批次，直接切到初审阶段 assign 子步） */
function openApprovalRoleAssignReviewers() {
  approvalRoleBatchStage.value = 'final'
  approvalRoleFinalSubStep.value = 'assign'
}

const officeApprovalFlowSteps = [
  '立项指南发布',
  '形式审查',
  '初审阶段',
  '复审阶段',
  '立项入库',
] as const

const officeApprovalStageMeta: Record<Exclude<OfficeApprovalStage, ''>, { title: string; desc: string }> = {
  guide: {
    title: '立项指南发布',
    desc: '本环节为流转线第 1 步「立项指南发布」：PMO 发布立项指南与批次信息，管理办负责人可查看指南发布情况。',
  },
  formal: {
    title: '形式审查',
    desc: '本环节为流转线第 2 步「形式审查」：PMO 按立项批次开展形式审查、材料核验和退回修改，管理办负责人可跟踪审查进度。',
  },
  final: {
    title: '初审阶段',
    desc: '本环节为流转线第 3 步「初审阶段」：学部组织专家评审并形成学部初审结果汇总，管理办负责人可查看初审汇总情况。',
  },
  recheck: {
    title: '复审阶段',
    desc: '本环节为流转线第 4 步「复审阶段」：学部确认推荐名单并组织复审，管理办负责人可跟踪复审进展。',
  },
  archive: {
    title: '立项入库',
    desc: '本环节为流转线第 5 步「立项入库」：管理办负责人审定学部推荐立项名单，审定通过后项目正式立项入库。',
  },
}

// 复审阶段子步骤（1 专家评委审核 / 2 形式审查）
const officeRecheckSubStep = shallowRef<'expert' | 'pptReview'>('expert')
const recheckPptPreviewVisible = shallowRef(false)

function openRecheckPptPreview() {
  recheckPptPreviewVisible.value = true
}

/** AN-MWVIPNLL：答辩PPT材料复审按项目逐项给结论——通过直接下结论，不通过弹必填理由（取消则回退待复审） */
function handleRecheckPptConclusion(row: RecheckPptRow, value: string) {
  if (value === '通过') {
    row.conclusion = '通过'
    ElMessage.success(`已通过“${row.projectName}”的材料复审`)
    return
  }
  ElMessageBox.prompt('不通过的项目将退回申报人补充材料，理由会反馈给申报人。', '材料复审不通过', {
    confirmButtonText: '确认不通过',
    cancelButtonText: '取消',
    type: 'warning',
    inputType: 'textarea',
    inputPlaceholder: '请填写不通过理由（如：答辩PPT缺少技术路线页，请补充后重新上传）',
    inputValidator: (value: string) =>
      value && value.trim().length >= 5 ? true : '不通过理由至少 5 个字',
  })
    .then(({ value: reason }) => {
      row.conclusion = '不通过'
      row.reason = reason.trim()
      ElMessage.success(`已记录“${row.projectName}”材料复审不通过`)
    })
    .catch(() => {})
}

/** AN-MWVIPNLL：全部项目给出材料复审结论后方可提交，提交后流转至「立项入库」 */
function handleSubmitRecheckResult() {
  const pending = recheckPptRows.filter((row) => !row.conclusion)
  if (pending.length) {
    ElMessage.warning(`还有 ${pending.length} 个项目未给出材料复审结论`)
    return
  }
  officeApprovalStage.value = 'archive'
  ElMessage.success('材料复审结果已提交，已流转至「立项入库」')
}

interface RecheckPptRow {
  projectName: string
  leader: string
  pptFile: string
  fileSize: string
  submitTime: string
  /** AN-MWVIPNLL：材料复审结论（通过 / 不通过），未给结论时不显示结论态 */
  conclusion?: string
  /** 不通过时的必填理由 */
  reason?: string
}

const recheckPptRows = reactive<RecheckPptRow[]>([
  { projectName: '面向稀疏感知的多模态大模型高效推理系统', leader: '张骁庆', pptFile: '答辩PPT_张骁庆_面向稀疏感知的多模态大模型高效推理系统.pdf', fileSize: '8.6MB', submitTime: '2026-10-28 14:32' },
  { projectName: '具身智能机器人自主决策与安全控制关键技术研究', leader: '唐郁钰', pptFile: '答辩PPT_唐郁钰_具身智能机器人自主决策与安全控制关键技术.pdf', fileSize: '12.4MB', submitTime: '2026-10-28 15:07' },
  { projectName: '大规模异构算力集群智能调度与能效优化平台', leader: '胡耀清', pptFile: '答辩PPT_胡耀清_大规模异构算力集群智能调度与能效优化平台.pdf', fileSize: '9.8MB', submitTime: '2026-10-28 16:21' },
  { projectName: '垂直领域大模型数据治理与评测体系建设', leader: '徐枭云', pptFile: '答辩PPT_徐枭云_垂直领域大模型数据治理与评测体系.pdf', fileSize: '7.2MB', submitTime: '2026-10-29 09:14' },
  { projectName: '复杂工业场景小样本缺陷检测算法与应用', leader: '宋佳颖', pptFile: '答辩PPT_宋佳颖_复杂工业场景小样本缺陷检测算法与应用.pdf', fileSize: '11.3MB', submitTime: '2026-10-29 10:42' },
  { projectName: '科学计算大模型驱动的高性能模拟仿真平台', leader: '罗子谦', pptFile: '答辩PPT_罗子谦_科学计算大模型驱动的高性能模拟仿真平台.pdf', fileSize: '10.6MB', submitTime: '2026-10-29 11:05' },
  { projectName: '模型轻量化与端侧部署优化关键技术研究', leader: '高煜彤', pptFile: '答辩PPT_高煜彤_模型轻量化与端侧部署优化关键技术研究.pdf', fileSize: '6.9MB', submitTime: '2026-10-29 13:58' },
  { projectName: '可信人工智能：对齐、安全与隐私计算一体化框架', leader: '李承轩', pptFile: '答辩PPT_李承轩_可信人工智能对齐安全与隐私计算一体化框架.pdf', fileSize: '13.1MB', submitTime: '2026-10-29 15:26' },
])

interface OfficeArchiveRow {
  projectName: string
  leader: string
  subDirection: string
  score: string
  strategic: boolean
  batchCode: string
}

const officeArchiveRows: OfficeArchiveRow[] = [
  { projectName: '面向稀疏感知的多模态大模型高效推理系统', leader: '张骁庆', subDirection: '大模型系统与算力优化', score: '92.33', strategic: true, batchCode: 'LXB-2026-Q4' },
  { projectName: '具身智能机器人自主决策与安全控制关键技术研究', leader: '唐郁钰', subDirection: '具身智能与智能体系统', score: '89.67', strategic: true, batchCode: 'LXB-2026-Q4' },
  { projectName: '大规模异构算力集群智能调度与能效优化平台', leader: '胡耀清', subDirection: '大模型系统与算力优化', score: '86.00', strategic: true, batchCode: 'LXB-2026-Q4' },
  { projectName: '垂直领域大模型数据治理与评测体系建设', leader: '宋佳颖', subDirection: '数据智能与评测治理', score: '85.33', strategic: false, batchCode: 'LXB-2026-Q4' },
  { projectName: '复杂工业场景小样本缺陷检测算法与应用', leader: '罗子谦', subDirection: '机器学习与工业智能', score: '83.67', strategic: false, batchCode: 'LXB-2026-Q4' },
  { projectName: '科学计算大模型驱动的高性能模拟仿真平台', leader: '李承轩', subDirection: '大模型系统与算力优化', score: '82.33', strategic: true, batchCode: 'LXB-2026-Q4' },
  { projectName: '模型轻量化与端侧部署优化关键技术研究', leader: '高煜彤', subDirection: '机器学习与工业智能', score: '80.00', strategic: false, batchCode: 'LXB-2026-Q4' },
  { projectName: '可信人工智能：对齐、安全与隐私计算一体化框架', leader: '吴桐雨', subDirection: '可信人工智能与安全', score: '78.67', strategic: true, batchCode: 'LXB-2026-Q4' },
]

function selectOfficeRecheckSubStep(step: 'expert' | 'pptReview') {
  officeRecheckSubStep.value = step
}

const officeActiveStage = computed<Exclude<OfficeApprovalStage, ''>>(() => officeApprovalStage.value || 'formal')

const officeActiveStageIndex = computed(() => {
  const stages: Exclude<OfficeApprovalStage, ''>[] = ['guide', 'formal', 'final', 'recheck', 'archive']
  return stages.indexOf(officeActiveStage.value)
})
const officeApprovalStage = shallowRef<OfficeApprovalStage>('')

const facultyRecommendReportVisible = shallowRef(false)

// AN-MWUFAJRV：汇总表数据改响应式——mock 导出的是普通数组，行交换/属性编辑不会触发视图更新
const finalReviewRows = reactive(finalReviewRowsSource)

const finalSelectedRows = shallowRef<{ seq: number }[]>([])

function handleFinalSelectionChange(rows: { seq: number }[]) {
  finalSelectedRows.value = rows
}

function batchSetFinalRecommendation(recommended: boolean) {
  const selectedSeqs = new Set(finalSelectedRows.value.map((row) => row.seq))

  finalReviewRows.forEach((row) => {
    if (selectedSeqs.has(row.seq)) {
      row.recommended = recommended
    }
  })

  ElMessage.success(recommended ? '已批量推荐所选项目' : '已批量不推荐所选项目')
}

watch(
  officeApprovalStage,
  () => {
    if (officeApprovalStage.value) {
      nextTick(() => wireFinalSummaryTableDrag())
    }
  },
)

onMounted(() => {
  watch(
    () => approvalRoleBatchStage.value === 'final',
    (isFinal) => {
      if (isFinal) {
        nextTick(() => wireFinalSummaryTableDrag())
      }
    },
    { immediate: true },
  )
})

const officeGuideRejected = shallowRef<{ reason: string; at: string } | null>(null)

// 管理办审批入口层：先选批次，再进入五阶段审批流（batch_code 为空 = 批次浏览态）
const officeApprovalSelectedBatchCode = shallowRef('')
const officeApprovalSelectedBatch = computed(() =>
  initiationBatchMockRows.find(
    row => (row.batch_code ?? row.id) === officeApprovalSelectedBatchCode.value,
  ),
)

function enterOfficeBatchApproval(batch: InitiationBatchMockRow) {
  officeApprovalSelectedBatchCode.value = batch.batch_code ?? batch.id
  officeApprovalStage.value = 'guide'
  officeGuideRejected.value = null
}

function backToOfficeBatchPick() {
  officeApprovalSelectedBatchCode.value = ''
  officeApprovalStage.value = 'guide'
  officeGuideRejected.value = null
}

/**
 * PMO 立项管理流转线（AN-MWUCRLIL：合并「立项指南发布」+「形式审查」入口，以批次为轴）：
 * 先选批次，再按五阶段流转线处理：guide 指南发布 / formal 形式审查 / final 初审 / recheck 复审 / archive 立项入库
 */
const adminInitiationFlowStageOrder = ['guide', 'formal', 'final', 'recheck', 'archive'] as const
type AdminInitiationFlowStage = (typeof adminInitiationFlowStageOrder)[number]

const adminInitiationFlowBatchCode = shallowRef('')
const adminInitiationFlowBatch = computed(() =>
  initiationBatchMockRows.find(
    (row) => (row.batch_code ?? row.id) === adminInitiationFlowBatchCode.value,
  ),
)
const adminInitiationFlowStage = shallowRef<AdminInitiationFlowStage>('guide')
const adminInitiationFlowStageIndex = computed(() =>
  adminInitiationFlowStageOrder.indexOf(adminInitiationFlowStage.value),
)

/** AN-MWUF30LW：批次实际所处流转阶段（mock flowStage），驱动步骤条 done 判定——不同批次分布不同阶段 */
const adminInitiationFlowBatchStageIndex = computed(() => {
  const stage = adminInitiationFlowBatch.value?.flowStage

  if (!stage) {
    return -1
  }

  return adminInitiationFlowStageOrder.indexOf(stage)
})


/** FD-MWVNYLE8：学部批次流转线当前阶段索引（流转靠页脚提交流转，阶段即实际进度） */
const approvalRoleBatchStageIndex = computed(() =>
  ['guide', 'formal', 'final', 'recheck', 'archive'].indexOf(approvalRoleBatchStage.value),
)

/** 批次流转阶段中文标签（批次卡片与流转线上下文共用） */
const batchFlowStageLabels: Record<AdminInitiationFlowStage, string> = {
  guide: '指南发布',
  formal: '形式审查中',
  final: '初审中',
  recheck: '复审中',
  archive: '已入库',
}

// AN-MWUG2PQ5/AN-MWUG3BER：PMO 初审阶段（三学部结果汇总）与复审阶段（指派评委+过程监控）状态
// 学部复议会修改 recommended/recommendedCount，mock 导出的普通数组须 reactive 包装才能触发视图更新
const pmoFinalFacultySummaries = reactive(pmoFinalFacultySummariesSource)
const pmoFinalActiveAcademy = shallowRef(pmoFinalFacultySummaries[0]?.academy ?? '')
const pmoRecheckSubStep = shallowRef<'assign' | 'monitor'>('assign')
const pmoFinalDeclaredTotal = computed(() =>
  pmoFinalFacultySummaries.reduce((sum, item) => sum + item.declaredCount, 0),
)
const pmoFinalRecommendedTotal = computed(() =>
  pmoFinalFacultySummaries.reduce((sum, item) => sum + item.recommendedCount, 0),
)
const pmoRecheckMonitorDoneCount = computed(
  () => pmoRecheckMonitorRows.filter((row) => row.status === '已完成').length,
)
const pmoRecheckMonitorOngoingCount = computed(
  () => pmoRecheckMonitorRows.filter((row) => row.status === '进行中').length,
)
const pmoRecheckMonitorPendingCount = computed(
  () => pmoRecheckMonitorRows.filter((row) => row.status === '待启动').length,
)

function getRecheckMonitorStatusType(status: PMORecheckMonitorRow['status']) {
  if (status === '已完成') return 'success'
  if (status === '进行中') return 'warning'
  return 'info'
}

// 学部复议（线下合议会）：会后由 PMO 在此登记对各学部推荐项目的剔除结论
const pmoRecheckDialogVisible = shallowRef(false)
const pmoRecheckExcludedKeys = ref<string[]>([])
const pmoRecheckDialogNote = ref('')

function getPmoFinalRowKey(academy: string, projectName: string) {
  return `${academy}::${projectName}`
}

/** 各学部推荐且尚未被复议剔除的项目（供复议登记勾选） */
const pmoRecheckRegisterOptions = computed(() =>
  pmoFinalFacultySummaries.map((faculty) => ({
    academy: faculty.academy,
    rows: faculty.rows.filter((row) => row.recommended && !row.recheckExcluded),
  })),
)

function openPmoRecheckDialog() {
  pmoRecheckExcludedKeys.value = []
  pmoRecheckDialogNote.value = ''
  pmoRecheckDialogVisible.value = true
}

/** 确认登记：勾选项目标记为「复议剔除」，进入复审的项目数与统计自动联动 */
function submitPmoRecheckRegistration() {
  if (!pmoRecheckExcludedKeys.value.length) {
    ElMessage.warning('请先勾选复议决定剔除的项目，或点取消')
    return
  }
  let excluded = 0
  for (const key of pmoRecheckExcludedKeys.value) {
    const separator = key.indexOf('::')
    const academy = key.slice(0, separator)
    const projectName = key.slice(separator + 2)
    const faculty = pmoFinalFacultySummaries.find((item) => item.academy === academy)
    const row = faculty?.rows.find((item) => item.projectName === projectName)
    if (row) {
      row.recheckExcluded = true
      excluded += 1
    }
  }
  pmoRecheckDialogVisible.value = false
  ElMessage.success(`学部复议结论已登记：共剔除 ${excluded} 个项目，其余项目进入复审`)
}

/** 学部复议后真正进入复审的项目数 */
const pmoRecheckAdmittedTotal = computed(() =>
  pmoFinalFacultySummaries.reduce(
    (sum, faculty) => sum + faculty.rows.filter((row) => row.recommended && !row.recheckExcluded).length,
    0,
  ),
)

/** 学部复议剔除的项目数 */
const pmoRecheckExcludedTotal = computed(() =>
  pmoFinalFacultySummaries.reduce(
    (sum, faculty) => sum + faculty.rows.filter((row) => row.recommended && row.recheckExcluded).length,
    0,
  ),
)

function getFinalRecommendTag(row: FinalReviewSummaryRow): { type: 'danger' | 'success' | 'info'; text: string } {
  if (row.recommended && row.recheckExcluded) return { type: 'danger', text: '复议剔除' }
  if (row.recommended) return { type: 'success', text: '推荐复审' }
  return { type: 'info', text: '不推荐' }
}

/** AN-MWVFPQVT：项目评审详情 — 点击终审表/通过清单表项目名称打开，展示评委打分明细（类型见 FinalScoreDetailDialog） */
const finalScoreDetailVisible = shallowRef(false)
const finalScoreDetailTarget = shallowRef<ScoreDetailTarget | null>(null)

function openFinalScoreDetail(row: FinalReviewSummaryRow) {
  const tag = getFinalRecommendTag(row)
  finalScoreDetailTarget.value = {
    projectName: row.projectName,
    metaText: `${row.leader} · ${row.subDirection} · 推荐次序 ${row.seq}`,
    score: { label: '最终得分', value: row.score },
    tag: { type: tag.type, text: tag.text },
  }
  finalScoreDetailVisible.value = true
}

/** 形式审查报告页通过清单 → 项目评审详情（三评委打分） */
function openFormalPassedScoreDetail(row: { projectName: string; leader?: string; code?: string }) {
  finalScoreDetailTarget.value = {
    projectName: row.projectName,
    metaText: `${row.code ?? '-'} · ${row.leader ?? '-'} · 形式审查已通过`,
  }
  finalScoreDetailVisible.value = true
}

/** AN-MWVFRNN7：复审报告 → 项目评审详情（按复审评委名单展示打分） */
function openFacultyRecheckScoreDetail(row: PMORecheckMonitorRow) {
  finalScoreDetailTarget.value = {
    projectName: row.projectName,
    metaText: `${row.leader} · ${row.academy} · 复审评审（${row.recheckReviewers.length} 位评委）`,
    score: { label: '初审得分', value: row.finalScore },
    reviewers: row.recheckReviewers,
  }
  finalScoreDetailVisible.value = true
}

/** AN-MWVINCCJ：PMO 立项入库 — 复审入选项目 → 项目评审详情 */
function openOfficeArchiveScoreDetail(row: OfficeArchiveRow) {
  finalScoreDetailTarget.value = {
    projectName: row.projectName,
    metaText: `${row.leader} · ${row.subDirection} · 复审通过（待管理办审定）`,
    score: { label: '评审得分', value: row.score },
  }
  finalScoreDetailVisible.value = true
}

/** AN-MWVFRNN7/S94C：学部负责人视角只看本学部（人工智能核心学部）数据 */
const facultyLeaderAcademy = '人工智能核心学部'
const facultyRecheckMonitorRows = computed(() =>
  pmoRecheckMonitorRows.filter((row) => row.academy === facultyLeaderAcademy),
)
/** 立项入库：本学部最终复审通过（复审已完成）的项目 */
const facultyArchiveRows = computed(() =>
  facultyRecheckMonitorRows.value.filter((row) => row.status === '已完成'),
)

function getBatchFlowStageLabel(batch: InitiationBatchMockRow): string {
  return batch.flowStage ? batchFlowStageLabels[batch.flowStage] : ''
}

function enterAdminInitiationFlow(batch: InitiationBatchMockRow) {
  adminInitiationFlowBatchCode.value = batch.batch_code ?? batch.id
  // AN-MWUF30LW：进入流转线直接定位到批次当前所处阶段，而不是固定从第 1 步开始
  adminInitiationFlowStage.value = batch.flowStage ?? 'guide'
}

function backToAdminInitiationFlowPick() {
  adminInitiationFlowBatchCode.value = ''
  adminInitiationFlowStage.value = 'guide'
}

function handleAdminFlowWorkflowSettings() {
  if (adminInitiationFlowBatch.value) {
    openBatchWorkflowSettings(adminInitiationFlowBatch.value)
  }
}

function previewAdminFlowGuideFile() {
  const batch = adminInitiationFlowBatch.value

  if (!batch?.batch_guide_file) {
    ElMessage.warning('该批次暂无立项指南文件')
    return
  }

  revokeLeaderGuidePreviewUrl()
  leaderGuidePreviewTitle.value = batch.batch_guide_file.name
  leaderGuidePreviewUrl.value = createLeaderGuideFileUrl(batch)
  leaderGuidePreviewVisible.value = true
}

function downloadAdminFlowGuideFile() {
  const batch = adminInitiationFlowBatch.value

  if (!batch?.batch_guide_file) {
    ElMessage.warning('该批次暂无可下载的立项指南')
    return
  }

  const fileUrl = createLeaderGuideFileUrl(batch)
  const anchor = document.createElement('a')

  anchor.href = fileUrl
  anchor.download = batch.batch_guide_file.name
  anchor.click()
}

/** 管理办审批页展示的立项指南：优先取当前选中批次，其次与 PMO 批次编码匹配，最后取第一个带指南的批次 */
const officeGuideBatch = computed(
  () =>
    officeApprovalSelectedBatch.value ??
    initiationBatchMockRows.find(row => row.batch_code === launchForm.batch_code) ??
    initiationBatchMockRows.find(row => row.batch_guide_file),
)

function previewOfficeGuideFile() {
  const batch = officeGuideBatch.value
  if (!batch || !batch.batch_guide_file) {
    ElMessage.warning('PMO 尚未上传立项指南文件')
    return
  }
  revokeLaunchGuidePreviewUrl()
  launchGuidePreviewUrl.value = createLeaderGuideFileUrl(batch)
  launchGuidePreviewVisible.value = true
}

function handleOfficeGuideApprove() {
  officeApprovalStage.value = 'formal'
  officeGuideRejected.value = null
  resetOfficeLaunchFeedback()
  ElMessage.success('立项指南发布审批已通过，已流转至「形式审查」')
}

/** AN-MWVFLWS6：形式审查环节提交——行内已逐项下结论，此处提交结果、生成形式审查报告并流转至「初审阶段」 */
function handleSubmitFormalReport() {
  officeApprovalStage.value = 'final'
  resetOfficeLaunchFeedback()
  ElMessage.success('形式审查结果已提交，形式审查报告已生成，已流转至「初审阶段」')
}

function handleOfficeGuideReject() {
  ElMessageBox.prompt('驳回后立项指南将退回 PMO 修改，驳回理由会反馈给 PMO。', '驳回确认', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
    type: 'warning',
    inputType: 'textarea',
    inputPlaceholder: '请填写驳回理由（如：申报时间设置有误，请调整后重新发起）',
    inputValidator: (value: string) =>
      value && value.trim().length >= 5 ? true : '驳回理由至少 5 个字',
  })
    .then(({ value }) => {
      const reason = value.trim()
      const at = new Date().toLocaleString('zh-CN')
      officeGuideRejected.value = { reason, at }
      setOfficeLaunchRejected(reason, at)
      ElMessage.success('已驳回，驳回理由已反馈至 PMO')
    })
    .catch(() => {})
}

function toggleStrategicStar(row: FinalReviewSummaryRow) {
  row.strategicStar = !row.strategicStar
}

const finalSummaryTableRef = shallowRef<{
  $el: HTMLElement
}>()
let finalSummaryTableWired = false

function injectFinalRowDragAttrs() {
  const table = finalSummaryTableRef.value?.$el as HTMLElement | undefined
  if (!table) {
    return
  }

  const bodyRows = table.querySelectorAll<HTMLElement>('.el-table__body tbody tr')
  bodyRows.forEach((tr, index) => {
    tr.setAttribute('data-final-row-index', String(index))
    tr.setAttribute('draggable', 'true')
    tr.classList.add('final-row--draggable')
  })
}

function wireFinalSummaryTableDrag() {
  if (finalSummaryTableWired || !finalSummaryTableRef.value) {
    return
  }

  const el = finalSummaryTableRef.value.$el as HTMLElement
  injectFinalRowDragAttrs()
  el.addEventListener('dragstart', (event) => {
    const row = (event.target as HTMLElement).closest('tr[data-final-row-index]')
    const index = Number(row?.getAttribute('data-final-row-index'))

    finalDragIndex = Number.isFinite(index) ? index : -1
    if (event instanceof DragEvent && event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  })
  el.addEventListener('dragover', (event) => {
    event.preventDefault()
  })
  el.addEventListener('drop', (event) => {
    event.preventDefault()
    const row = (event.target as HTMLElement).closest('tr[data-final-row-index]')
    const index = Number(row?.getAttribute('data-final-row-index'))

    if (row && Number.isFinite(index)) {
      handleFinalRowDrop(index)
      nextTick(() => injectFinalRowDragAttrs())
    }
  })
  finalSummaryTableWired = true
}

let finalDragIndex = -1

function handleFinalRowDragStart(index: number, event: DragEvent) {
  finalDragIndex = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function handleFinalRowDrop(index: number) {
  if (finalDragIndex < 0 || finalDragIndex === index) {
    return
  }

  const [moved] = finalReviewRows.splice(finalDragIndex, 1)
  finalReviewRows.splice(index, 0, moved)
  refreshFinalReviewOrder()
  finalDragIndex = -1
  ElMessage.success('已调整推荐次序')
}

function moveFinalReviewRow(row: FinalReviewSummaryRow, direction: -1 | 1) {
  // AN-MWUFAJRV：slot 的 row 是响应式代理，与原数组元素引用不等，用 seq 值定位
  const index = finalReviewRows.findIndex((item) => item.seq === row.seq)
  const target = index + direction

  if (index < 0 || target < 0 || target >= finalReviewRows.length) {
    return
  }

  const rows = finalReviewRows
  ;[rows[index], rows[target]] = [rows[target], rows[index]]
  refreshFinalReviewOrder()
}

/** AN-MWUFAJRV：推荐次序直接输入目标名次调序（比连续点上移/下移更贴近实际操作） */
function moveFinalReviewRowTo(row: FinalReviewSummaryRow, targetSeq: number) {
  const from = finalReviewRows.findIndex((item) => item.seq === row.seq)
  const clamped = Math.max(1, Math.min(finalReviewRows.length, Math.round(targetSeq)))

  if (from < 0 || from === clamped - 1) {
    row.seq = from + 1
    return
  }

  const [moved] = finalReviewRows.splice(from, 1)
  finalReviewRows.splice(clamped - 1, 0, moved)
  refreshFinalReviewOrder()
  ElMessage.success(`已调整至第 ${clamped} 名`)
}

/** AN-MWUFAJRV：推荐报告行内字段编辑（外部重大项目 / 具体评审意见） */
function saveFinalReviewRowField(row: FinalReviewSummaryRow, field: 'majorProject' | 'reviewComment', value: string) {
  row[field] = value
  ElMessage.success(field === 'majorProject' ? '已更新外部重大项目信息' : '已更新评审意见')
}

function refreshFinalReviewOrder() {
  finalReviewRows.forEach((row, index) => {
    const newSeq = index + 1

    if (row.originalSeq !== newSeq) {
      row.rankChange = newSeq < row.originalSeq ? 'up' : 'down'
    } else {
      row.rankChange = '-'
    }

    row.seq = newSeq
  })
}

const facultyApprovalFlowSteps = [
  '立项指南发布',
  '形式审查',
  '初审阶段',
  '复审阶段',
  '立项入库',
] as const

function selectFacultyApprovalFlowStep(index: number) {
  const stages: ApprovalRoleBatchStage[] = ['guide', 'formal', 'final', 'recheck', 'archive']
  approvalRoleBatchStage.value = stages[index] ?? 'formal'
}

const approvalFlowSteps = [
  '发起项目批次',
  '形式审查',
  '管理办审批',
  '专家评委评审',
  '学部推荐立项',
  '管理办审批',
] as const
type ApprovalDecision = 'APPROVE' | 'REJECT'
type ProjectParticipantRecruitmentView = 'square' | 'applications' | 'projects'

interface LeaderBatchFilterModel {
  keyword: string
  year: number | 'all'
  projectCategory: string | 'all'
  status: LeaderBatchTimeStatus | 'all'
}

interface ProjectApplicationFormPanelExpose {
  validate: () => Promise<boolean>
  clearValidate: () => void
}

type InitiationProjectStepState = 'done' | 'active' | 'waiting'

interface InitiationProjectProcessStep {
  title: string
  description: string
  state: InitiationProjectStepState
}

const route = useRoute()
const router = useRouter()
const currentUser = shallowRef<LoggedInUser | null>(getCurrentUser())
const initiationApprovalRoleKeys: RoleKey[] = ['projectLeader', 'facultyLeader']
const projectParticipantRoleKeys: RoleKey[] = ['projectStudent', 'projectMentor']

function isInitiationApprovalRole(roleKey: RoleKey | undefined): roleKey is 'projectLeader' | 'facultyLeader' {
  return Boolean(roleKey && initiationApprovalRoleKeys.includes(roleKey))
}

function isProjectParticipantRole(roleKey: RoleKey | undefined): roleKey is 'projectStudent' | 'projectMentor' {
  return Boolean(roleKey && projectParticipantRoleKeys.includes(roleKey))
}

const selectedPrimaryMenuKey = shallowRef(
  isProjectParticipantRole(route.meta.roleKey as RoleKey | undefined)
    ? 'projects'
    : route.query.batchId ||
        route.query.initiationAction === 'launch' ||
        route.query.applicationView === 'project-application' ||
        route.query.applicationView === 'declaration-review'
      ? 'application'
      : 'dashboard',
)
const featureIconModules = import.meta.glob<string>('../dataset/icon/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const landingCardIconFileMap: Record<string, string> = {
  申报批次管理: 'batch-management.png',
  立项指南发布: 'project-application.png',
  立项管理: 'project-application.png',
  形式审查: 'declaration-review.png',
  项目申报: 'project-application.png',
  申报审查: 'declaration-review.png',
  评审组织: 'review-organization.png',
  专家评审: 'expert-review.png',
  项目立项: 'project-approval.png',
  外部项目建档: 'external-project-archive.png',
  申报与立项查询: 'application-query.png',
  发起立项: 'initiation-launch.png',
  立项申请: 'project-application.png',
  组织评审: 'review-organization.png',
  外部项目导入: 'external-import.png',
  项目库: 'project-library.png',
  项目启动: 'project-launch.png',
  项目变更: 'project-config.png',
  项目招募情况: 'project-recruitment-overview.png',
  我的项目: 'my-project.png',
  项目招募管理: 'recruitment-management.png',
  加入与退出审批: 'application-approval.png',
  项目成员管理: 'member-management.png',
  招募广场: 'recruitment-square.png',
  我的申请: 'my-application.png',
  财务工作台: 'finance-workbench.png',
  预算管理: 'budget-management.png',
  经费预警中心: 'finance-alert.png',
  科目纠错与对账: 'reconciliation.png',
  我的经费: 'my-finance.png',
  论文成果管理: 'paper-outcomes.png',
  开源管理: 'open-source.png',
  知识产权管理: 'intellectual-property.png',
  我的论文: 'my-paper.png',
  我的知识产权: 'my-ip.png',
  我的专利: 'my-patent.png',
  科研管理驾驶舱: 'analytics-dashboard.png',
  申报与立项分析: 'initiation-analysis.png',
  在研项目分析: 'ongoing-project-analysis.png',
  季度推进分析: 'quarter-analysis.png',
  科研经费分析: 'finance-analysis.png',
  科研成果分析: 'outcome-analysis.png',
  人员与团队分析: 'team-analysis.png',
  组织机构管理: 'organization-management.png',
  人员库管理: 'people-library.png',
  专家库管理: 'expert-library.png',
  项目基础配置: 'project-config.png',
  评审指标管理: 'review-index.png',
  模板管理: 'template-management.png',
  公告发布: 'announcement-publishing.png',
  审批流配置: 'workflow-config.png',
  用户与账号: 'user-account.png',
  角色与权限: 'role-permission.png',
  审批流程: 'approval-process.png',
  消息与提醒: 'message-reminder.png',
  数据接口与同步: 'data-sync.png',
  文件与存储: 'file-storage.png',
  操作日志与审计: 'audit-log.png',
  季度评审会: 'quarterly-review.png',
  数据维护: 'data-maintenance.png',
  模板搭建: 'template-build.png',
  项目管理: 'project-library.png',
  评审项目: 'review-projects.png',
  评审管理: 'review-management.png',
  评审材料提交: 'review-material.png',
  材料成果维护: 'material-achievement.png',
  项目评审: 'review-projects.png',
  评审结果: 'review-results.png',
  '360 环评': 'evaluation-360.png',
}

const sidebarIcons = {
  dashboard:
    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="3" width="7" height="7" rx="2"></rect><rect x="3" y="14" width="7" height="7" rx="2"></rect><rect x="14" y="14" width="7" height="7" rx="2"></rect></svg>',
  application:
    '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6M8 13h8M8 17h6"></path></svg>',
  projects:
    '<svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2"></path></svg>',
  quarterly:
    '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"></rect><path d="M8 2v4M16 2v4M3 9h18M8 13h3M13 13h3M8 17h3"></path></svg>',
  finance:
    '<svg viewBox="0 0 24 24"><path d="M3 10h18M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18M12 3 3 8h18z"></path></svg>',
  outcomes:
    '<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"></path><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"></path></svg>',
  analytics:
    '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"></path></svg>',
  base:
    '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path></svg>',
  system:
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.22.34.4.7.6 1 .1.35.1.7.1 1.1h.1v2h-.1c0 .36 0 .72-.1 1.1-.2.28-.38.54-.6.8z"></path></svg>',
} as const

const primaryMenuGroups: PrimaryMenuGroup[] = [
  {
    label: '',
    items: [
      {
        key: 'dashboard',
        label: '我的首页',
        icon: sidebarIcons.dashboard,
      },
    ],
  },
  {
    label: '核心业务',
    items: [
      {
        key: 'application',
        label: '项目申报与立项',
        icon: sidebarIcons.application,
      },
      {
        key: 'projects',
        label: '项目管理',
        icon: sidebarIcons.projects,
      },
      {
        key: 'quarterly',
        label: '季度推进会',
        icon: sidebarIcons.quarterly,
      },
      {
        key: 'finance',
        label: '经费管理',
        icon: sidebarIcons.finance,
      },
      {
        key: 'outcomes',
        label: '成果管理',
        icon: sidebarIcons.outcomes,
      },
    ],
  },
  {
    label: '分析管理',
    items: [
      {
        key: 'analytics',
        label: '统计分析',
        icon: sidebarIcons.analytics,
      },
    ],
  },
  {
    label: '后台配置',
    items: [
      {
        key: 'base',
        label: '科研数据',
        icon: sidebarIcons.base,
      },
      {
        key: 'system',
        label: '系统管理',
        icon: sidebarIcons.system,
      },
    ],
  },
]

const moduleCardThemes = [
  ['#2a66d9', '#eaf2ff'],
  ['#198b65', '#e8f7f1'],
  ['#d06a2b', '#fff1e7'],
  ['#317fba', '#eaf5fc'],
  ['#b4547d', '#faedf3'],
  ['#637185', '#eef2f6'],
  ['#29879a', '#e7f6f8'],
  ['#7a55d8', '#f2edff'],
] as const

const moduleDefinitions: Record<string, LandingModule> = {
  application: {
    title: '项目申报与立项',
    eyebrow: '业务办理中心',
    desc: '覆盖申报发布、项目填报、形式审查、专家评审和项目立项全过程。',
    tip: '未接入的二级功能先作为入口占位',
    items: [
      { title: '申报批次管理', desc: '配置申报指南、限制条件、模板和评审方案', role: 'PMO / 科研部', iconText: '批' },
      {
        title: '项目申报',
        desc: '填写项目信息、成员、预算并提交申报材料',
        role: '项目负责人',
        iconText: '申',
        routeSegment: 'initiation-batches',
      },
      { title: '申报审查', desc: '开展形式审查、材料核验和退回修改', role: '科研部 / 审批人', iconText: '审' },
      { title: '评审组织', desc: '专家遴选、任务指派和进度跟踪', role: 'PMO / 科研部', iconText: '组' },
      { title: '专家评审', desc: '查看申报材料并完成评分、评级和评审意见', role: '评委', iconText: '评' },
      { title: '项目立项', desc: '完成立项决策、公示、合同备案和项目建档', role: 'PMO / 科研部', iconText: '立' },
      { title: '外部项目建档', desc: '导入纵向项目和其他非系统申报项目', role: 'PMO / 科研部', iconText: '档' },
      { title: '申报与立项查询', desc: '统一查询历史申报、未立项和已立项项目', role: '按数据权限', iconText: '查' },
    ],
  },
  projects: {
    title: '项目管理',
    eyebrow: '项目过程管理',
    desc: '以二级功能入口进入项目列表、启动和招募监管等项目过程管理能力。',
    tip: '项目管理能力暂以入口形式呈现',
    items: [
      {
        title: '项目库',
        desc: '查看项目概览、团队、进展、经费、成果和档案',
        role: '按数据权限',
        iconText: '库',
        routeSegment: 'project-library',
      },
      {
        title: '项目启动',
        desc: '从项目库选择单个或多个项目，完成项目启动操作',
        role: 'PMO',
        iconText: '启',
        routeSegment: 'project-start',
      },
      {
        title: '项目变更',
        desc: '基于项目库台账进行项目新增、编辑、删除、查询和详情查看',
        role: 'PMO',
        iconText: '变',
        routeSegment: 'project-change',
      },
      {
        title: '项目招募情况',
        desc: '查看全院项目招募、学生申报、负责人审批和成员关系结果',
        role: 'PMO',
        iconText: '招',
        routeSegment: 'project-recruitment-overview',
      },
    ],
  },
  finance: {
    title: '经费管理',
    eyebrow: '科研经费全生命周期',
    desc: '覆盖项目立项、到账分拨、预算编制、支出冻结、预警对账、决算和数据同步。',
    tip: '科研平台负责编制、申请、审核、查询、预警和对账，正式预算控制仍由财务平台执行',
    items: [
      {
        title: '财务工作台',
        desc: '查看核心指标、待办风险和项目经费执行表',
        role: '科研财务',
        iconText: '台',
        routeSegment: 'finance-workbench',
      },
      {
        title: '预算管理',
        desc: '预算编制、审核、调整和版本管理',
        role: '财务 / 负责人',
        iconText: '预',
        routeSegment: 'finance-budget',
      },
      {
        title: '经费预警中心',
        desc: '处理预警记录并配置预警规则',
        role: '财务 / 项目',
        iconText: '警',
        routeSegment: 'finance-alerts',
      },
      {
        title: '科目纠错与对账',
        desc: '处理科目匹配异常、日对账、月对账和差异',
        role: '科研财务',
        iconText: '纠',
        routeSegment: 'finance-reconciliation',
      },
    ],
  },
  outcomes: {
    title: '成果管理',
    eyebrow: '成果数据资产',
    desc: '统一进入论文成果、开源成果和知识产权成果的管理入口。',
    tip: '一级菜单仅展示二级入口，具体业务从入口进入',
    items: [
      {
        title: '论文成果管理',
        desc: '查看论文成果列表，维护成果详情、编辑和删除记录',
        role: '科研管理人员',
        iconText: '论',
        routeSegment: 'paper-outcomes-management',
      },
      {
        title: '开源管理',
        desc: '管理开源项目、代码仓库、版本发布和成果归属信息',
        role: '科研管理人员',
        iconText: '源',
      },
      {
        title: '知识产权管理',
        desc: '管理专利、软著、知识产权登记和成果转化记录',
        role: '科研管理人员',
        iconText: '知',
      },
    ],
  },
  analytics: {
    title: '统计分析',
    eyebrow: '管理驾驶舱',
    desc: '围绕项目、经费、成果和团队形成多维度分析视图。',
    tip: '分析页面暂以统一入口展示',
    items: [
      { title: '申报与立项分析', desc: '分析申报规模、立项率和专家评审结果', role: '科研管理人员', iconText: '申' },
      { title: '在研项目分析', desc: '分析项目进度、里程碑、变更和风险情况', role: '科研管理人员', iconText: '项' },
      { title: '季度推进分析', desc: '分析材料提交、项目评级和整改完成情况', role: '科研管理人员', iconText: '季' },
      { title: '科研经费分析', desc: '分析到账、预算执行、支出结构和经费预警', role: '财务 / 管理层', iconText: '费' },
      { title: '科研成果分析', desc: '分析成果类型、质量、归属和年度趋势', role: '科研管理人员', iconText: '果' },
      { title: '人员与团队分析', desc: '分析科研人员、团队规模和协作关系', role: '科研管理人员', iconText: '人' },
    ],
  },
  base: {
    title: '科研数据',
    eyebrow: '数据底座',
    desc: '维护组织、人员、专家和项目基础配置，为各业务提供统一数据。',
    tip: '基础数据能力会逐步接入真实页面',
    items: [
      { title: '人员库管理', desc: '维护教师、学生和项目负责人人员数据', role: '管理员 / 科研部', iconText: '人' },
      { title: '项目基础配置', desc: '维护项目类型、来源、状态和编码规则', role: 'PMO / 科研部', iconText: '配' },
      { title: '评审指标管理', desc: '维护评分指标、权重、等级和配额规则', role: 'PMO / 科研部', iconText: '指' },
      { title: '模板管理', desc: '统一管理申报、评审、季度和结题模板', role: 'PMO / 科研部', iconText: '模' },
      {
        title: '公告发布',
        desc: '复用季度推进会公告发布能力，统一发布评审结果与通知公告',
        role: 'PMO',
        iconText: '告',
        routeSegment: 'base-announcement-publishing',
      },
      {
        title: '审批流配置',
        desc: '统一维护季度推进会、立项等公共审批流程',
        role: '科研管理人员',
        iconText: '流',
        routeSegment: 'workflow-config',
      },
    ],
  },
  system: {
    title: '系统管理',
    eyebrow: '平台配置',
    desc: '配置用户权限、审批流程、消息提醒、接口和审计日志。',
    tip: '系统配置先保留为二级入口',
    items: [
      { title: '用户与账号', desc: '管理用户账号、状态、登录记录和人员关联', role: '系统管理员', iconText: '户' },
      { title: '角色与权限', desc: '配置菜单权限、操作权限和数据范围', role: '系统管理员', iconText: '权' },
      { title: '审批流程', desc: '配置审批节点、条件分支、退回和保密流程', role: '系统管理员', iconText: '流' },
      { title: '消息与提醒', desc: '配置站内消息、到期提醒和催办规则', role: '系统管理员', iconText: '醒' },
      { title: '数据接口与同步', desc: '管理财务、采购、认证及外部成果接口', role: '系统管理员', iconText: '接' },
      { title: '文件与存储', desc: '管理文件格式、版本、预览和存储空间', role: '系统管理员', iconText: '存' },
      { title: '操作日志与审计', desc: '查询登录、审批、导出和数据修改记录', role: '系统管理员', iconText: '审' },
    ],
  },
}

const roleModuleDefinitions: Partial<Record<RoleKey, Partial<Record<string, LandingModule>>>> = {
  reviewer: {
    application: {
      title: '项目申报与立项',
      eyebrow: '评委',
      desc: '查看并处理分配给当前评委的立项评审任务。',
      tip: '仅展示评委可办理功能',
      items: [
        {
          title: '我的评审任务',
          desc: '进入项目评审列表，查看待评审项目并完成评分与意见',
          role: '评委',
          iconText: '评',
          routeSegment: 'project-review',
        },
      ],
    },
  },
  researchDepartmentLeader: {
    application: {
      title: '项目申报与立项',
      eyebrow: '管理办负责人',
      desc: '查看并处理需要管理办负责人审批的项目批次事项。',
      tip: '仅展示管理办负责人可办理功能',
      items: [
        {
          title: '项目审批',
          desc: '进入管理办项目审批页面，处理批次内项目的审批事项',
          role: '管理办负责人',
          iconText: '批',
          routeSegment: 'office-project-approval',
        },
      ],
    },
  },
  researchProjectAdmin: {
    application: {
      title: '项目申报与立项',
      eyebrow: 'PMO',
      desc: '面向PMO，聚焦立项批次、申报审查和评审组织。',
      tip: '仅展示PMO可办理功能',
      items: [
        {
          title: '立项管理',
          desc: '以批次为轴处理立项全流程：立项指南发布、申报跟踪与形式审查',
          role: 'PMO',
          iconText: '申',
          hint: 'test',
          routeSegment: 'initiation-batches',
        },
        {
          title: '审批流配置',
          desc: '组织专家评审，配置评审任务并跟踪评审进度',
          role: 'PMO',
          iconText: '组',
        },
      ],
    },
  },
  projectMember: {
    application: {
      title: '项目申报与立项',
      eyebrow: '项目负责人',
      desc: '查看可申报的科研项目立项批次，阅读申报要求并提交项目申报材料。',
      tip: '项目负责人从立项申请入口进入批次列表和填写申报流程',
      items: [
        {
          title: '立项申请',
          desc: '查看正在申报中的立项批次，已提交申报的批次可直接查看我的申请',
          role: '项目负责人',
          iconText: '立',
          routeSegment: 'initiation-batches',
        },
      ],
    },
    projects: {
      title: '项目管理',
      eyebrow: '项目负责人',
      desc: '集中查看本人负责的科研项目、申报内容、团队信息和材料状态。',
      tip: '项目负责人项目管理仅展示本人项目',
      items: [
        {
          title: '我的项目',
          desc: '查看本人负责项目列表，并进入项目申报内容详情',
          role: '项目负责人',
          iconText: '我',
          routeSegment: 'my-projects',
        },
        {
          title: '项目变更',
          desc: '发起或查看本人负责项目的内容、成员、周期和预算变更',
          role: '项目负责人',
          iconText: '变',
        },
        {
          title: '项目招募管理',
          desc: '发布项目招募岗位，维护招募要求、人数和截止时间',
          role: '项目负责人',
          iconText: '招',
          routeSegment: 'project-recruitments',
        },
        {
          title: '加入与退出审批',
          desc: '审批学生加入项目和退出项目申请，更新成员关系',
          role: '项目负责人',
          iconText: '审',
          routeSegment: 'project-recruitment-applications',
        },
        {
          title: '项目成员管理',
          desc: '查看成员状态、项目分工和加入退出记录',
          role: '项目负责人',
          iconText: '员',
          routeSegment: 'project-recruitment-members',
        },
      ],
    },
    finance: {
      title: '经费管理',
      eyebrow: '项目负责人',
      desc: '查看本人负责项目的经费预算、付款执行、应付未付、占用和余额。',
      tip: '仅展示本人项目经费，真实环境由后端进行数据权限校验',
      items: [
        {
          title: '我的经费',
          desc: '进入本人项目经费列表，查看每个项目的经费执行总览',
          role: '项目负责人',
          iconText: '费',
          routeSegment: 'finance-overview',
        },
      ],
    },
    outcomes: {
      title: '成果管理',
      eyebrow: '项目负责人',
      desc: '面向项目负责人查看和维护本人项目相关论文、知识产权和专利成果。',
      tip: '仅展示本人负责项目相关成果，真实环境由后端进行数据权限校验',
      items: [
        {
          title: '我的论文',
          desc: '查看本人项目关联论文成果、发表状态和成果归属',
          role: '项目负责人',
          iconText: '论',
          routeSegment: 'my-papers',
        },
        {
          title: '我的知识产权',
          desc: '查看本人项目的软件著作权、成果转化和知识产权记录',
          role: '项目负责人',
          iconText: '知',
        },
        {
          title: '我的专利',
          desc: '查看本人项目相关专利申请、授权和维护状态',
          role: '项目负责人',
          iconText: '专',
        },
      ],
    },
  },
  projectStudent: {
    projects: {
      title: '项目管理',
      eyebrow: '项目学生',
      desc: '查看面向项目学生的科研项目招募，提交加入申请，并管理本人项目和退出申请。',
      tip: '项目学生项目管理下展示招募广场、我的申请、我的项目三个入口',
      items: [
        {
          title: '招募广场',
          desc: '查看正在招募的科研项目，阅读项目要求并填写加入申请',
          role: '项目学生',
          iconText: '招',
          routeSegment: 'recruitment-square',
        },
        {
          title: '我的申请',
          desc: '查看加入与退出申请进度，审批中申请可撤回',
          role: '项目学生',
          iconText: '申',
          routeSegment: 'recruitment-applications',
        },
        {
          title: '我的项目',
          desc: '查看已加入项目、本人分工和退出申请状态',
          role: '项目学生',
          iconText: '项',
          routeSegment: 'recruitment-projects',
        },
      ],
    },
    outcomes: {
      title: '成果管理',
      eyebrow: '项目学生',
      desc: '查看本人参与项目相关论文、知识产权和专利成果。',
      tip: '复用项目负责人端个人成果入口样式与交互',
      items: [
        {
          title: '我的论文',
          desc: '查看本人项目关联论文成果、发表状态和成果归属',
          role: '项目学生',
          iconText: '论',
          routeSegment: 'my-papers',
        },
        {
          title: '我的知识产权',
          desc: '查看本人项目的软件著作权、成果转化和知识产权记录',
          role: '项目学生',
          iconText: '知',
        },
        {
          title: '我的专利',
          desc: '查看本人项目相关专利申请、授权和维护状态',
          role: '项目学生',
          iconText: '专',
        },
      ],
    },
  },
  projectMentor: {
    projects: {
      title: '项目管理',
      eyebrow: '项目导师',
      desc: '查看面向项目导师的科研项目招募，提交加入申请，并管理本人指导项目和退出申请。',
      tip: '项目导师项目管理下展示招募广场、我的申请、我的项目三个入口',
      items: [
        {
          title: '招募广场',
          desc: '查看正在招募导师的项目，阅读指导要求并填写加入申请',
          role: '项目导师',
          iconText: '招',
          routeSegment: 'recruitment-square',
        },
        {
          title: '我的申请',
          desc: '查看加入与退出申请进度，审批中申请可撤回',
          role: '项目导师',
          iconText: '申',
          routeSegment: 'recruitment-applications',
        },
        {
          title: '我的项目',
          desc: '查看已参与项目、指导分工和退出申请状态',
          role: '项目导师',
          iconText: '项',
          routeSegment: 'recruitment-projects',
        },
      ],
    },
    outcomes: {
      title: '成果管理',
      eyebrow: '项目导师',
      desc: '查看本人指导项目相关论文、知识产权和专利成果。',
      tip: '复用项目负责人端个人成果入口样式与交互',
      items: [
        {
          title: '我的论文',
          desc: '查看本人项目关联论文成果、发表状态和成果归属',
          role: '项目导师',
          iconText: '论',
          routeSegment: 'my-papers',
        },
        {
          title: '我的知识产权',
          desc: '查看本人项目的软件著作权、成果转化和知识产权记录',
          role: '项目导师',
          iconText: '知',
        },
        {
          title: '我的专利',
          desc: '查看本人项目相关专利申请、授权和维护状态',
          role: '项目导师',
          iconText: '专',
        },
      ],
    },
  },
}

const featureDescriptions: Record<string, string> = {
  'quarterly-review-meeting': '进入季度推进会全流程页面，查看当前与历史推进会内容',
  'review-data-maintenance': '维护评审周期、评价规则、等级配置和材料节点',
  'template-create': '管理通知、评审、材料等业务模板并进入模板编辑器',
  'project-management': '查看季度推进会参评项目、材料进度、评审状态和项目详情',
  'project-library': '查看项目概览、团队、进展、经费、成果和档案',
  'project-library-detail': '查看项目库项目详情、成员、经费、算力、成果和加速信息',
  'project-start': '从项目库选择项目并执行单个或批量启动操作',
  'project-change': '基于项目库台账进行项目新增、编辑、删除、查询和详情查看',
  'announcement-publishing': '面向项目、学部或负责人发布评审结果公告',
  'review-projects': '审批评审申请、查看评审进度并管理评审结果',
  'review-management': '配置评审人员和时间，跟踪子方向评审任务',
  'review-material-submission': '提交或维护学部评审材料和支撑成果',
  'material-achievement-maintenance': '维护材料成果、佐证文件和成果归属信息',
  'project-review': '查看分配项目材料并完成评分、评级和意见填写',
  'review-results': '查看本人参与评审的结果与历史意见',
  'initiation-batches': '查看可申报立项批次，阅读指南并进入项目申报',
  'application-projects': '查看本人已提交申报书的项目列表',
  'application-project-detail': '查看申报书填写内容（不含承诺书）',
  'initiation-project-detail': '查看申报立项项目详情、材料、评审进度和当前办理节点',
  'initiation-workflow-settings': '配置当前立项批次的审批节点、人员和流转规则',
  'workflow-config': '统一维护季度推进会、立项等公共审批流程模板',
  'workflow-config-detail': '编辑公共审批流节点、人员、连线和适用业务备注',
  'base-announcement-publishing': '复用季度推进会公告发布能力，统一发布评审结果与通知公告',
  'finance-workbench': '集中查看科研经费指标、待办风险和项目经费执行情况',
  'finance-project-detail': '查看项目预算、付款、应付未付、支出冻结、调整、预警和同步明细',
  'finance-receipts': '管理来款认领、经费分拨和财务平台回执',
  'finance-budget': '进行预算编制、审核、调整和版本管理',
  'finance-alerts': '集中处理经费到期、余额、预算占用和同步延迟等预警',
  'finance-reconciliation': '处理科目纠错、日对账、月对账和差异闭环',
  'finance-settlement': '发起、审核并归档结题财务决算',
  'finance-overview': '兼容旧入口：进入财务工作台或我的经费',
  'finance-budget-adjustments': '兼容旧入口：进入预算管理',
  'finance-sync-records': '兼容旧入口：进入财务工作台',
  'paper-outcomes-management': '查看论文成果列表，并通过弹窗查看完整详情',
  'my-papers': '按本人负责项目查看项目论文成果、发表状态和成果归属',
  'my-paper-create': '填写论文基本信息、项目关联信息并上传论文 PDF',
  'my-projects': '查看本人负责项目、申报内容、材料状态和项目进展',
  'my-project-detail': '查看本人项目的完整申报内容、团队、经费预算和承诺材料',
  'project-recruitment-overview': '查看全院项目招募、学生申报、项目负责人审批和成员关系结果',
  'project-recruitments': '发布招募岗位、编辑招募要求并查看学生申请',
  'project-recruitment-applications': '审批学生加入项目和退出项目申请',
  'project-recruitment-members': '维护本人负责项目的成员分工和变更记录',
  'recruitment-square': '查看可申请科研项目招募，阅读要求并填写加入申请',
  'recruitment-applications': '查看本人加入和退出申请进度，审批中申请可撤回',
  'recruitment-projects': '查看本人已加入或指导项目，并发起退出申请',
  '360-evaluation': '填写项目成员互评、协作反馈和个人绩效信息',
}

const featurePrimaryMap: Record<string, string> = {
  'quarterly-review-meeting': 'quarterly',
  'review-data-maintenance': 'quarterly',
  'template-create': 'quarterly',
  'template-new': 'quarterly',
  'project-management': 'quarterly',
  'project-library': 'projects',
  'project-library-detail': 'projects',
  'project-start': 'projects',
  'project-change': 'projects',
  'project-detail': 'quarterly',
  'project-edit': 'quarterly',
  'announcement-publishing': 'quarterly',
  'announcement-publish': 'quarterly',
  'base-announcement-publishing': 'base',
  'finance-workbench': 'finance',
  'finance-project-detail': 'finance',
  'finance-receipts': 'finance',
  'finance-budget': 'finance',
  'finance-alerts': 'finance',
  'finance-reconciliation': 'finance',
  'finance-settlement': 'finance',
  'finance-overview': 'finance',
  'finance-budget-adjustments': 'finance',
  'finance-sync-records': 'finance',
  'paper-outcomes-management': 'outcomes',
  'my-papers': 'outcomes',
  'my-paper-create': 'outcomes',
  'review-projects': 'quarterly',
  'review-management': 'quarterly',
  'review-material-submission': 'quarterly',
  'material-achievement-maintenance': 'quarterly',
  'project-review': 'application',
  'review-results': 'quarterly',
  'initiation-batches': 'application',
  'application-projects': 'application',
  'application-project-detail': 'application',
  'reviewer-project-review-detail': 'application',
  'initiation-batch-detail': 'application',
  'initiation-apply': 'application',
  'initiation-project-detail': 'application',
  'initiation-workflow-settings': 'application',
  'workflow-config': 'base',
  'workflow-config-detail': 'base',
  'my-projects': 'projects',
  'my-project-detail': 'projects',
  'project-recruitment-overview': 'projects',
  'project-recruitments': 'projects',
  'project-recruitment-applications': 'projects',
  'project-recruitment-members': 'projects',
  'recruitment-square': 'projects',
  'recruitment-applications': 'projects',
  'recruitment-projects': 'projects',
  '360-evaluation': 'quarterly',
  'review-launch': 'quarterly',
  'review-config-detail': 'quarterly',
  'office-project-approval': 'application',
}

const primaryBreadcrumbLabels: Record<string, string> = {
  dashboard: '我的首页',
  application: '项目申报与立项',
  quarterly: '季度推进会',
  projects: '项目管理',
  base: '科研数据',
  system: '系统管理',
  analytics: '统计分析',
  finance: '经费管理',
  outcomes: '成果管理',
}

const featureBreadcrumbLabels: Record<string, string> = {
  'quarterly-review-meeting': '季度评审会',
  'review-data-maintenance': '数据维护',
  'template-create': '模板搭建',
  'project-management': '项目管理',
  'project-library': '项目库',
  'project-library-detail': '项目详情',
  'project-start': '项目启动',
  'project-change': '项目变更',
  'announcement-publishing': '公告发布',
  'announcement-publish': '公告发布',
  'base-announcement-publishing': '公告发布',
  'finance-workbench': '财务工作台',
  'finance-project-detail': '项目经费详情',
  'finance-receipts': '到账与经费分拨',
  'finance-budget': '预算管理',
  'finance-alerts': '经费预警中心',
  'finance-reconciliation': '科目纠错与对账',
  'finance-settlement': '财务决算',
  'finance-overview': '财务工作台',
  'finance-budget-adjustments': '预算管理',
  'finance-sync-records': '财务工作台',
  'paper-outcomes-management': '论文成果管理',
  'my-papers': '我的论文',
  'my-paper-create': '新增论文',
  'review-projects': '评审项目',
  'review-management': '评审管理',
  'review-material-submission': '评审材料提交',
  'material-achievement-maintenance': '材料成果维护',
  'project-review': '项目评审',
  'review-results': '评审结果',
  'initiation-batches': '项目申报与立项',
  'application-projects': '我的项目',
  'application-project-detail': '项目详情',
  'reviewer-project-review-detail': '评审打分',
  'initiation-batch-detail': '批次详情',
  'initiation-apply': '填写申报',
  'initiation-project-detail': '项目详情',
  'initiation-workflow-settings': '审批流设置',
  'workflow-config': '审批流配置',
  'workflow-config-detail': '审批流编辑',
  'my-projects': '我的项目',
  'my-project-detail': '项目详情',
  'project-recruitment-overview': '项目招募情况',
  'project-recruitments': '项目招募管理',
  'project-recruitment-applications': '加入与退出审批',
  'project-recruitment-members': '项目成员管理',
  'recruitment-square': '招募广场',
  'recruitment-applications': '我的申请',
  'recruitment-projects': '我的项目',
  '360-evaluation': '360 环评',
  'review-launch': '发起评审',
  'office-project-approval': '项目审批',
}

const researchWorkbenchShortcuts: WorkbenchShortcut[] = [
  { title: '发起立项', desc: '新建立项批次', action: '发起立项', icon: DocumentAdd },
  { title: '申报审查', desc: '核验申报材料', action: '申报审查', icon: Finished },
  { title: '评审设置', desc: '配置专家与指标', action: '评审设置', icon: Operation },
  { title: '审批流设置', desc: '配置串并行流程', action: '审批流设置', icon: Connection },
  { title: '外部项目导入', desc: '批量导入项目', action: '外部项目导入', icon: UploadFilled },
  { title: '项目台账', desc: '查看全量项目', action: '项目台账', icon: Collection },
  { title: '在研项目管理', desc: '跟踪执行进度', action: '在研项目管理', icon: FolderOpened },
  { title: '季度推进会', desc: '管理会议材料', action: '季度推进会', icon: Calendar },
  { title: '经费管理', desc: '经费执行管理', action: '经费管理', icon: Money },
  { title: '成果登记', desc: '汇总科研成果', action: '成果登记', icon: Medal },
  { title: '评审专家库', desc: '维护专家信息', action: '评审专家库', icon: User },
  { title: '基础数据', desc: '维护字典数据', action: '基础数据', icon: DataAnalysis },
]

const workbenchNoticeRows: WorkbenchNewsItem[] = [
  { title: '《2026年第3季度科研项目申报指南》正式发布', category: '科研项目管理', date: '2026-08-26', isNew: true },
  { title: '关于开展科研项目经费使用规范专题培训的通知', category: '科研财务', date: '2026-08-25', isNew: true },
  { title: '2026年第二季度科研项目立项结果公示', category: '项目申报', date: '2026-08-22', isNew: true },
  { title: '科研项目评审专家库信息更新说明', category: '评审管理', date: '2026-08-18', isNew: false },
  { title: '科研项目批次审批流配置功能上线通知', category: '系统公告', date: '2026-08-15', isNew: false },
]

const workbenchNewsRows: WorkbenchNewsItem[] = [
  { title: '学院召开2026年第三季度科研工作推进会', category: '学院动态', date: '2026-08-24', isNew: true },
  { title: '人工智能交叉学科联合研究中心正式成立', category: '科研平台', date: '2026-08-20', isNew: false },
  { title: '三项青年科研项目完成中期检查', category: '项目进展', date: '2026-08-16', isNew: false },
  { title: '本年度高水平科研成果集中展示', category: '成果展示', date: '2026-08-12', isNew: false },
  { title: '科研团队赴中关村企业开展联合调研', category: '合作交流', date: '2026-08-08', isNew: false },
]

const workbenchTodoRows: WorkbenchTodoItem[] = [
  {
    taskId: 'todo-application-review-2026-free',
    title: '请完成“2026年度自由探索项目申报批次”中3个项目的形式审查。',
    module: '项目申报与立项',
    taskType: '申报审查',
    deadline: '2026-09-01 18:00',
    targetUrl: '/research-project-admin/dashboard?applicationView=project-application',
  },
  {
    taskId: 'todo-ledger-import-ai-post-training',
    title: '请确认“AI大模型后训练项目”的项目台账导入结果是否准确。',
    module: '项目管理',
    taskType: '数据确认',
    deadline: '2026-09-02 12:00',
    targetUrl: '/research-project-admin/project-library',
  },
  {
    taskId: 'todo-quarterly-review-config-2026-q3',
    title: '请为“2026年第三季度科研项目推进会”中的2个项目完成评委配置。',
    module: '评审组织',
    taskType: '评委配置',
    deadline: '2026-09-03 17:30',
    targetUrl: '/research-project-admin/review-data-maintenance',
  },
  {
    taskId: 'todo-quarterly-material-brain-computing',
    title: '请审核“类脑智能计算平台项目”负责人李明提交的4项季度推进会材料。',
    module: '季度推进会',
    taskType: '材料审核',
    deadline: '2026-09-04 12:00',
    targetUrl: '/research-project-admin/quarterly-review-meeting',
  },
  {
    taskId: 'todo-recruitment-application-multimodal',
    title: '请审批“多模态科研助手项目”中张明提交的加入项目申请。',
    module: '项目招募',
    taskType: '学生加入审批',
    deadline: '2026-09-05 18:00',
    targetUrl: '/research-project-admin/project-recruitment-overview',
  },
  {
    taskId: 'todo-paper-verify-compute-cluster',
    title: '请在截止时间前核验“高性能智算集群项目”的2篇论文成果信息。',
    module: '成果管理',
    taskType: '论文成果核验',
    deadline: '2026-09-07 17:00',
    targetUrl: '/research-project-admin/paper-outcomes-management',
  },
]

const workbenchBoardData: Record<number, WorkbenchBoardData> = {
  2026: {
    metrics: [
      { label: '在研项目', value: 12, unit: '项', delta: '+9.1%' },
      { label: '本季度申报', value: 10, unit: '项', delta: '+25.0%' },
      { label: '待处理事项', value: 5, unit: '项' },
      { label: '本年科研成果', value: 28, unit: '项', delta: '+16.7%' },
    ],
    trend: [8, 13, 10, 17],
    status: [
      { name: '已立项', value: 12, color: '#3478e5' },
      { name: '评审中', value: 4, color: '#806fe8' },
      { name: '申报审查', value: 3, color: '#23a574' },
      { name: '待结项', value: 2, color: '#e79a32' },
    ],
  },
  2025: {
    metrics: [
      { label: '在研项目', value: 11, unit: '项', delta: '+10.0%' },
      { label: '本季度申报', value: 8, unit: '项', delta: '+12.5%' },
      { label: '待处理事项', value: 3, unit: '项' },
      { label: '本年科研成果', value: 24, unit: '项', delta: '+14.3%' },
    ],
    trend: [7, 9, 8, 12],
    status: [
      { name: '已立项', value: 15, color: '#3478e5' },
      { name: '评审中', value: 3, color: '#806fe8' },
      { name: '申报审查', value: 2, color: '#23a574' },
      { name: '待结项', value: 1, color: '#e79a32' },
    ],
  },
  2024: {
    metrics: [
      { label: '在研项目', value: 9, unit: '项', delta: '+5.9%' },
      { label: '本季度申报', value: 7, unit: '项', delta: '+7.1%' },
      { label: '待处理事项', value: 2, unit: '项' },
      { label: '本年科研成果', value: 21, unit: '项', delta: '+10.5%' },
    ],
    trend: [6, 8, 7, 9],
    status: [
      { name: '已立项', value: 13, color: '#3478e5' },
      { name: '评审中', value: 2, color: '#806fe8' },
      { name: '申报审查', value: 1, color: '#23a574' },
      { name: '待结项', value: 1, color: '#e79a32' },
    ],
  },
}

const workbenchBoardYearOptions = [2026, 2025, 2024]

const currentRoleKey = computed(() => route.meta.roleKey as RoleKey)

const currentRole = computed(() => getRoleRouteConfig(currentRoleKey.value))

const visiblePrimaryMenuGroups = computed<PrimaryMenuGroup[]>(() => {
  if (!isProjectParticipantRole(currentRoleKey.value)) {
    return primaryMenuGroups
  }

  return [
    {
      label: '核心业务',
      items: primaryMenuGroups
        .flatMap((group) => group.items)
        .filter((item) => item.key === 'projects' || item.key === 'outcomes'),
    },
  ]
})

const functionLinks = computed(() => {
  const role = currentRole.value

  return role
    ? getRoleFeatureConfigs(role.key).map((feature) => ({
        ...feature,
        path: getRoleFeaturePath(role, feature),
        iconUrl: resolveFeatureIcon(feature.icon),
      }))
    : []
})

const roleFeatureCards = computed<LandingCard[]>(() =>
  functionLinks.value
    .filter((feature) => feature.routeSegment !== 'dashboard')
    .filter((feature) => feature.routeSegment !== 'application-projects')
    .map((feature, index) => {
      const [accent, soft] = moduleCardThemes[index % moduleCardThemes.length]

      return {
        title: feature.name,
        desc: featureDescriptions[feature.routeSegment] ?? '进入当前角色可办理的业务页面，查看相关项目和任务。',
        role: currentRole.value?.name ?? '当前角色',
        iconText: feature.name.slice(0, 1),
        routeSegment: feature.routeSegment,
        path: feature.path,
        iconUrl: feature.iconUrl || resolveLandingCardIcon(feature.name),
        accent,
        soft,
      }
    }),
)

const activePrimaryMenuKey = computed(() => {
  if (currentFeatureKey.value === 'dashboard') {
    return selectedPrimaryMenuKey.value
  }

  return featurePrimaryMap[currentFeatureKey.value] ?? 'dashboard'
})

watch(
  () => route.query.primary,
  () => {
    const primaryKey = normalizePrimaryMenuQuery(route.query.primary)

    if (primaryKey) {
      selectedPrimaryMenuKey.value = primaryKey
    }
  },
  { immediate: true },
)

const activeLandingModule = computed<LandingModule>(() => {
  if (activePrimaryMenuKey.value === 'dashboard') {
    return {
      title: currentRole.value?.name ? `${currentRole.value.name}工作台` : '工作台',
      eyebrow: '业务办理中心',
      desc: '聚合当前角色可访问功能，未展开的能力先以入口卡片呈现。',
      tip: '根据当前角色和数据权限展示',
      items: roleFeatureCards.value.map(({ accent: _accent, soft: _soft, ...item }) => item),
    }
  }

  const roleSpecificModule = roleModuleDefinitions[currentRoleKey.value]?.[activePrimaryMenuKey.value]

  if (roleSpecificModule) {
    return roleSpecificModule
  }

  return moduleDefinitions[activePrimaryMenuKey.value] ?? moduleDefinitions.application
})

const activeLandingCards = computed<LandingCard[]>(() =>
  activeLandingModule.value.items.map((item, index) => {
    const [accent, soft] = moduleCardThemes[index % moduleCardThemes.length]
    const path = item.path ?? (item.routeSegment ? getFeaturePathBySegment(item.routeSegment) : undefined)

    return {
      ...item,
      path,
      iconUrl: item.iconUrl || resolveLandingCardIcon(item.title),
      accent,
      soft,
    }
  }),
)

const showModuleLanding = computed(() => isDashboardFeature.value)

const currentFeature = computed(
  () => {
    const matchedFeature = functionLinks.value.find((feature) => feature.router === route.path)

    if (matchedFeature) {
      return matchedFeature
    }

    const routeFeatureKey = route.meta.featureKey as RoleFeatureKey | undefined

    if (routeFeatureKey) {
      return {
        key: routeFeatureKey,
        name: String(route.meta.featureName ?? routeFeatureKey),
        routeSegment: routeFeatureKey,
        router: route.path,
        icon: '',
      }
    }

    return functionLinks.value.find((feature) => feature.key === 'dashboard')
  },
)

const currentFeatureKey = computed(
  () => currentFeature.value?.key ?? ((route.meta.featureKey as RoleFeatureKey | undefined) || 'dashboard'),
)

const isDashboardFeature = computed(() => currentFeatureKey.value === 'dashboard')

const isResearchAdminWorkbench = computed(
  () => showModuleLanding.value && activePrimaryMenuKey.value === 'dashboard',
)

watch(
  [currentRoleKey, isDashboardFeature],
  ([roleKey, isDashboard]) => {
    if (
      isDashboard &&
      isProjectParticipantRole(roleKey) &&
      !['projects', 'outcomes'].includes(selectedPrimaryMenuKey.value)
    ) {
      selectedPrimaryMenuKey.value = 'projects'
    }
  },
  { immediate: true },
)

const isResearchAdminApplicationLanding = computed(
  () =>
    showModuleLanding.value &&
    currentRoleKey.value === 'researchProjectAdmin' &&
    activePrimaryMenuKey.value === 'application',
)

const isApprovalRoleApplicationLanding = computed(
  () =>
    showModuleLanding.value &&
    isInitiationApprovalRole(currentRoleKey.value) &&
    activePrimaryMenuKey.value === 'application',
)

const standardModuleLandingKeys = new Set(['application', 'projects', 'finance', 'outcomes', 'base', 'system'])

const isStandardModuleLanding = computed(
  () => showModuleLanding.value && standardModuleLandingKeys.has(activePrimaryMenuKey.value),
)

const isPaperOutcomesManagementFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'paper-outcomes-management',
)

const isProjectMemberMyPapersFeature = computed(
  () =>
    (currentRoleKey.value === 'projectMember' ||
      currentRoleKey.value === 'projectStudent' ||
      currentRoleKey.value === 'projectMentor') &&
    currentFeatureKey.value === 'my-papers',
)

const isProjectMemberPaperCreateFeature = computed(
  () =>
    (currentRoleKey.value === 'projectMember' ||
      currentRoleKey.value === 'projectStudent' ||
      currentRoleKey.value === 'projectMentor') &&
    currentFeatureKey.value === 'my-paper-create',
)

const financeFeatureViewMap: Record<string, FinanceViewKey> = {
  'finance-workbench': 'workbench',
  'finance-receipts': 'receipts',
  'finance-budget': 'budget',
  'finance-alerts': 'alerts',
  'finance-reconciliation': 'reconciliation',
  'finance-settlement': 'settlement',
  'finance-overview': 'overview',
  'finance-budget-adjustments': 'budget-adjustments',
  'finance-sync-records': 'overview',
}

const isFinanceFeature = computed(() => currentFeatureKey.value in financeFeatureViewMap)
const isFinanceProjectDetailFeature = computed(() => currentFeatureKey.value === 'finance-project-detail')

const financeViewKey = computed<FinanceViewKey>(() => {
  return financeFeatureViewMap[currentFeatureKey.value] ?? 'overview'
})

const isInitiationLaunchPage = computed(() => route.query.initiationAction === 'launch')
const isAdminDeclarationReviewLanding = computed(
  () =>
    currentRoleKey.value === 'researchProjectAdmin' &&
    route.query.applicationView === 'declaration-review',
)
const isAdminDeclarationReviewBatchPage = computed(
  () => isAdminDeclarationReviewLanding.value && !route.query.batchId,
)
const isAdminApplicationReviewPage = computed(
  () => isAdminDeclarationReviewLanding.value && Boolean(route.query.batchId),
)
const isAdminApplicationProjectPage = computed(
  () =>
    currentRoleKey.value === 'researchProjectAdmin' &&
    (route.query.applicationView === 'project-application' ||
      (route.query.applicationView !== 'declaration-review' && Boolean(route.query.batchId)) ||
      route.query.initiationAction === 'launch'),
)
const workbenchShortcutPage = shallowRef(0)
const workbenchNewsTab = shallowRef<WorkbenchNewsTab>('notice')
const workbenchBoardYear = shallowRef(2026)
const initiationSelectedYear = shallowRef(2026)
const initiationSelectedQuarter = shallowRef(3)
const initiationPage = shallowRef(1)
const initiationPageSize = shallowRef(6)
const initiationLoading = shallowRef(false)
const workflowStatusVersion = shallowRef(0)
const workflowConfigVersion = shallowRef(0)
const activeInitiationNodeFilter = shallowRef<InitiationProjectNode | ''>('')
const batchKeywordInput = shallowRef('')
const batchYearInput = shallowRef<number | 'all'>('all')
const batchQuarterInput = shallowRef<number | 'all'>('all')
const batchStatusView = shallowRef<BatchStatusView>('active')
const appliedBatchKeyword = shallowRef('')
const appliedBatchYear = shallowRef<number | 'all'>('all')
const appliedBatchQuarter = shallowRef<number | 'all'>('all')
const batchPage = shallowRef(1)
const batchPageSize = shallowRef(4)
const leaderBatchFilter = reactive<LeaderBatchFilterModel>({
  keyword: '',
  year: 'all',
  projectCategory: 'all',
  status: 'all',
})
const appliedLeaderBatchFilter = reactive<LeaderBatchFilterModel>({
  keyword: '',
  year: 'all',
  projectCategory: 'all',
  status: 'all',
})
const leaderBatchPage = shallowRef(1)
const leaderBatchPageSize = shallowRef(4)
const leaderBatchLoading = shallowRef(false)
const leaderBatchError = shallowRef('')
const approvalRoleInitiationView = shallowRef<ApprovalRoleInitiationView>(
  route.query.batchId && route.meta.roleKey === 'facultyLeader'
    ? 'projectApproval'
    : 'self',
)
const approvalRoleProjectPage = shallowRef(1)
const approvalRoleProjectPageSize = shallowRef(6)
const approvalDialogVisible = shallowRef(false)
const approvalTargetProject = shallowRef<InitiationProjectMockRow | null>(null)
const approvalDecision = shallowRef<ApprovalDecision>('APPROVE')
const approvalRejectReason = shallowRef('')
const approvalSubmitting = shallowRef(false)
const reviewReportVisible = shallowRef(false)

interface FormalReviewPassedRow {
  code: string
  projectName: string
  leader: string
  external: boolean
}

interface FormalReviewRejectedRow {
  projectName: string
  leader: string
  reason: string
}

const formalReviewReport = {
  title: 'AI 核心学部・2026 年第一批・基础培育类',
  version: '已定版 V1.0',
  head: [
    { label: '批次名称', value: '2026 年第一批，基础培育类项目申报' },
    { label: '学部名称', value: 'AI 核心学部' },
    { label: '报告版本号', value: 'V1.0' },
    { label: '定版时间', value: '2026-11-06 14:32' },
    { label: '审查单位', value: '科研管理办公室（PMO）' },
  ],
  submittedCount: 12,
  passedCount: 9,
  passedRate: '75.0%',
  externalPassedCount: 2,
  rejectedCount: 3,
  passedRows: [
    { code: 'AP-2026-B1-001', projectName: '面向具身智能的可信对齐关键技术研究', leader: '王赫', external: false },
    { code: 'AP-2026-B1-004', projectName: '机器人操作技能的模仿学习泛化', leader: '闵耀森', external: false },
    { code: 'AP-2026-B1-008', projectName: '多智能体协同决策与安全验证', leader: '杨耀东', external: false },
    { code: 'AP-2026-B1-011', projectName: '大模型推理加速与显存优化', leader: '陈宇轩', external: false },
    { code: 'AP-2026-B1-013', projectName: '世界模型与具身导航基础研究', leader: '李雨桐', external: false },
    { code: 'AP-2026-B1-015', projectName: '面向边缘设备的轻量化模型压缩', leader: '赵文博', external: false },
    { code: 'AP-2026-B1-017', projectName: '联邦学习隐私保护关键技术研究', leader: '闵耀森', external: false },
    { code: 'AP-2026-B1-019', projectName: '面向工业质检的视觉大模型微调平台', leader: '周建国', external: true },
    { code: 'AP-2026-B1-021', projectName: '开源大模型推理服务优化实践', leader: '顾一凡', external: true },
  ] as FormalReviewPassedRow[],
  rejectedRows: [
    {
      projectName: '面向教育场景的知识追踪算法研究',
      leader: '孙浩然',
      reason: '申报范围不符：申请人所属研究方向不在本次批次支持范围内',
    },
    {
      projectName: '基于图神经网络的药物分子生成方法研究',
      leader: '吴沛霖',
      reason: '申报数量超限：同一项目负责人本次已立项 1 项',
    },
    {
      projectName: '跨模态检索与推荐系统联合优化',
      leader: '郑一鸣',
      reason: '申报人身份不符：不在本批次申报面向的目标群体内',
    },
  ] as FormalReviewRejectedRow[],
}
const leaderGuidePreviewVisible = shallowRef(false)
const leaderGuidePreviewUrl = shallowRef('')
const leaderGuidePreviewTitle = shallowRef('')
const projectApplicationFormPanelRef = shallowRef<ProjectApplicationFormPanelExpose>()
const projectApplicationForm = reactive<ProjectApplicationForm>(createDefaultProjectApplicationForm('', currentUser.value))
const projectApplicationWordFile = shallowRef<ApplicationWordFileState | null>(null)
const projectApplicationSignatureDataUrl = shallowRef('')
const projectApplicationPreviewStatus = shallowRef<ApplicationPreviewStatus>('STALE')
const projectApplicationActiveTab = shallowRef<'form' | 'preview'>('form')
const projectApplicationSaving = shallowRef(false)
const projectApplicationSubmitting = shallowRef(false)
const projectApplicationPreviewGenerating = shallowRef(false)
const launchProjectCategoryOptions = [
  '基础培育类',
  '院内重大专项',
  '学生自主立项',
  '预研项目',
  '未来实验室项目',
] as const
const launchOwnerOrganizationOptions = [
  '北京中关村学院',
  '中关村人工智能研究院',
  '科研管理办公室',
  'AI&IT 学部',
  '未来实验室',
] as const
const launchFundingSourceOptions = ['院拨经费', '纵向配套经费', '横向合作经费', '自筹经费'] as const
const launchBudgetModeOptions = [
  '标准预算模板',
  '人工成本预算模板',
  '设备与材料预算模板',
  '自定义预算模板',
] as const
const launchWorkflowTemplateOptions = ['立项审批流（默认）', '立项审批流（加学部复核）', '立项审批流（预研简版）'] as const
const launchFormTemplateOptions = ['基础培育类申报表单', '重大专项申报表单', '学生自主立项申报表单', '通用申报表单'] as const
const launchTargetGroupOptions = [
  '北京中关村学院',
  '中关村人工智能研究院',
  'AI&IT 学部',
  '全体科研人员',
  '项目导师',
  '学生',
] as const
const launchDeclarationLimitOptions = ['否', '是'] as const
const launchFormRef = shallowRef<FormInstance>()
const launchGuideUploadRef = shallowRef<UploadInstance>()
const launchGuideFile = shallowRef<UploadFile | null>(null)
const launchGuidePreviewVisible = shallowRef(false)
const launchGuidePreviewUrl = shallowRef('')
const initialLaunchBatchSeed = getNextAvailableLaunchBatchSeed()
const launchForm = reactive<LaunchInitiationForm>({
  owner_organizations: ['北京中关村学院'],
  project_category: '基础培育类',
  batch_code: initialLaunchBatchSeed.code,
  batch_name: initialLaunchBatchSeed.name,
  funding_source: '院拨经费',
  budget_mode: '标准预算模板',
  workflow_template: '立项审批流（默认）',
  form_template: '基础培育类申报表单',
  batch_introduction: '',
  batch_apply_start: initialLaunchBatchSeed.applyStart,
  batch_apply_deadline: initialLaunchBatchSeed.applyDeadline,
  batch_guide_file: '',
  target_groups: ['北京中关村学院'],
  launch_owner: currentUser.value?.displayName ?? '张晓明',
  declaration_limit: '否',
})
const launchFormRules = computed<FormRules<LaunchInitiationForm>>(() => ({
  owner_organizations: [{ required: true, type: 'array', min: 1, message: '请选择项目归属组织', trigger: 'change' }],
  project_category: [{ required: true, message: '请选择科研项目类别', trigger: 'change' }],
  batch_code: [
    { required: true, message: '请输入批次编码', trigger: 'blur' },
    { validator: validateBatchCodeUnique, trigger: 'blur' },
  ],
  batch_name: [
    { required: true, message: '请输入批次名称', trigger: 'blur' },
    { max: 50, message: '批次名称不能超过 50 字', trigger: 'blur' },
  ],
  funding_source: [{ required: true, message: '请选择项目经费来源', trigger: 'change' }],
  budget_mode: [{ required: true, message: '请选择项目预算方式', trigger: 'change' }],
  workflow_template: [{ required: true, message: '请选择绑定流程模板', trigger: 'change' }],
  form_template: [{ required: true, message: '请选择绑定申报表单模板', trigger: 'change' }],
  batch_apply_start: [{ required: true, message: '请选择申报开始时间', trigger: 'change' }],
  batch_apply_deadline: [
    { required: true, message: '请选择申报截止时间', trigger: 'change' },
    { validator: validateApplyDeadline, trigger: 'change' },
  ],
  batch_guide_file: [{ required: true, message: '请上传立项指南附件', trigger: 'change' }],
  target_groups: [{ required: true, type: 'array', min: 1, message: '请选择目标群体', trigger: 'change' }],
  declaration_limit: [{ required: true, message: '请选择是否限制申报项目', trigger: 'change' }],
}))

const workbenchShortcutPages = computed(() => {
  const pageSize = 6
  const pages: WorkbenchShortcut[][] = []

  for (let index = 0; index < researchWorkbenchShortcuts.length; index += pageSize) {
    pages.push(researchWorkbenchShortcuts.slice(index, index + pageSize))
  }

  return pages
})

const workbenchShortcutTransform = computed(() => `translateX(-${workbenchShortcutPage.value * 50}%)`)

const activeWorkbenchNewsRows = computed(() =>
  workbenchNewsTab.value === 'news' ? workbenchNewsRows : workbenchNoticeRows,
)

const workbenchNoticeNewCount = computed(() => workbenchNoticeRows.filter((item) => item.isNew).length)

const workbenchTodoItems = computed<WorkbenchTodoDisplayItem[]>(() =>
  workbenchTodoRows
    .map((item) => {
      const deadlineDate = parseWorkbenchTodoDeadline(item.deadline)

      return {
        ...item,
        urgency: getWorkbenchTodoUrgency(deadlineDate),
        urgencyLabel: getWorkbenchTodoUrgencyLabel(deadlineDate),
        urgencyReason: getWorkbenchTodoUrgencyReason(item, deadlineDate),
        sortTime: deadlineDate?.getTime() ?? Number.POSITIVE_INFINITY,
        hasDeadline: Boolean(deadlineDate),
      }
    })
    .sort((left, right) => left.sortTime - right.sortTime),
)

const workbenchTodoTotal = computed(() => workbenchTodoItems.value.length)

const currentWorkbenchBoard = computed(() => workbenchBoardData[workbenchBoardYear.value] ?? workbenchBoardData[2026])

const workbenchTrendChart = computed(() => {
  const width = 720
  const height = 176
  const left = 42
  const right = 18
  const top = 16
  const bottom = 33
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const values = currentWorkbenchBoard.value.trend
  const maxValue = Math.max(20, Math.ceil(Math.max(...values) / 5) * 5)
  const points = values.map((value, index) => {
    const x = left + index * (chartWidth / Math.max(1, values.length - 1))
    const y = top + chartHeight - (value / maxValue) * chartHeight

    return {
      x,
      y,
      value,
      label: `第${index + 1}季度`,
    }
  })
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = `${left},${top + chartHeight} ${linePoints} ${left + chartWidth},${top + chartHeight}`
  const guideLines = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: top + chartHeight * fraction,
    value: Math.round(maxValue * (1 - fraction)),
  }))

  return {
    width,
    height,
    chartEndX: left + chartWidth,
    linePoints,
    areaPoints,
    guideLines,
    points,
  }
})

const workbenchDonutTotal = computed(() =>
  currentWorkbenchBoard.value.status.reduce((sum, item) => sum + item.value, 0),
)

const workbenchDonutSegments = computed(() => {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return currentWorkbenchBoard.value.status.map((item) => {
    const length = workbenchDonutTotal.value ? (item.value / workbenchDonutTotal.value) * circumference : 0
    const segment = {
      ...item,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -offset,
    }

    offset += length

    return segment
  })
})

const activeInitiationBatch = computed(() => {
  const batchId = route.query.batchId

  if (!batchId || Array.isArray(batchId)) {
    return null
  }

  return initiationBatchMockRows.find((batch) => batch.id === batchId) ?? null
})

const activeApprovalRoleInitiationBatch = computed(() => {
  const view = approvalRoleInitiationView.value
  const viewAllowsBatch =
    view === 'projectApproval' ||
    (view === 'self' && currentRoleKey.value !== 'facultyLeader')

  if (!isApprovalRoleApplicationLanding.value || !viewAllowsBatch) {
    return null
  }

  const batchId = route.query.batchId

  if (!batchId || Array.isArray(batchId)) {
    return null
  }

  return initiationBatchMockRows.find((batch) => batch.id === batchId) ?? null
})


const facultyEntryCards = computed(() => [
  {
    key: 'projectApproval' as const,
    title: '项目审批',
    desc: '按批次查看需要当前角色审批的申报项目；指定子方向与评委已并入批次初审阶段，点开批次即可处理',
    iconText: '批',
    hint: undefined as string | undefined,
    accent: '#317fba',
    soft: '#eaf5fc',
  },
])

const activeWorkflowInitiationBatch = computed(() => {
  const batchId = route.params.batchId

  if (!batchId || Array.isArray(batchId)) {
    return null
  }

  return initiationBatchMockRows.find((batch) => batch.id === batchId) ?? null
})

const workflowConfigRows = computed(() => {
  workflowConfigVersion.value

  return loadWorkflowConfigRows()
})

const activeWorkflowConfig = computed(() => {
  const workflowId = route.params.workflowId

  if (!workflowId || Array.isArray(workflowId)) {
    return null
  }

  workflowConfigVersion.value

  return getWorkflowConfigRow(workflowId)
})

const activeWorkflowDesignerContext = computed(() => {
  const workflow = activeWorkflowConfig.value

  if (!workflow) {
    return null
  }

  return {
    id: workflow.id,
    template: workflow.template,
    ...toWorkflowMeta(workflow),
  }
})

const filteredInitiationBatches = computed(() => {
  const keyword = appliedBatchKeyword.value.trim().toLowerCase()

  return initiationBatchMockRows.filter((batch) => {
    const matchedKeyword =
      !keyword ||
      batch.batchName.toLowerCase().includes(keyword) ||
      batch.batchCode.toLowerCase().includes(keyword)
    const matchedYear = appliedBatchYear.value === 'all' || batch.year === appliedBatchYear.value
    const matchedQuarter = appliedBatchQuarter.value === 'all' || batch.quarter === appliedBatchQuarter.value
    const matchedStatus =
      batchStatusView.value === 'active' ? batch.status === '申报中' : batch.status === '已结束'

    return matchedKeyword && matchedYear && matchedQuarter && matchedStatus
  })
})

const pagedInitiationBatches = computed(() => {
  const start = (batchPage.value - 1) * batchPageSize.value

  return filteredInitiationBatches.value.slice(start, start + batchPageSize.value)
})

const batchEmptyDescription = computed(() =>
  batchStatusView.value === 'active' ? '暂无正在申报中的立项批次' : '暂无匹配的历史立项批次',
)

const leaderProjectCategoryOptions = computed(() =>
  Array.from(
    new Set(
      initiationBatchMockRows
        .map((batch) => batch.project_category)
        .filter((category): category is string => Boolean(category)),
    ),
  ),
)

const filteredLeaderInitiationBatches = computed(() => {
  const keyword = appliedLeaderBatchFilter.keyword.trim().toLowerCase()

  // 原型约定：项目负责人（申请人）视角不再区分「正在进行中 / 已结束」，批次平铺展示（AN-MWUAU6TC）
  return [...initiationBatchMockRows]
    .filter((batch) => {
      const batchName = getBatchDisplayName(batch).toLowerCase()
      const batchCode = getBatchDisplayCode(batch).toLowerCase()
      const matchedKeyword = !keyword || batchName.includes(keyword) || batchCode.includes(keyword)
      const matchedYear = appliedLeaderBatchFilter.year === 'all' || batch.year === appliedLeaderBatchFilter.year
      const matchedCategory =
        appliedLeaderBatchFilter.projectCategory === 'all' ||
        (batch.project_category ?? '') === appliedLeaderBatchFilter.projectCategory

      return matchedKeyword && matchedYear && matchedCategory
    })
    .sort((a, b) => b.year - a.year || b.quarter - a.quarter)
})

// 负责人视角批次列表：申报中的批次优先展示（点开「项目申报与立项」即可见正在申请中的批次），其余按年/季降序排在后面
const projectMemberInitiationBatches = computed(() =>
  [...filteredLeaderInitiationBatches.value].sort(
    (a, b) =>
      (a.status === '申报中' ? 0 : 1) - (b.status === '申报中' ? 0 : 1) ||
      b.year - a.year ||
      b.quarter - a.quarter,
  ),
)

const pagedProjectMemberInitiationBatches = computed(() => {
  const start = (leaderBatchPage.value - 1) * leaderBatchPageSize.value

  return projectMemberInitiationBatches.value.slice(start, start + leaderBatchPageSize.value)
})

const pagedLeaderInitiationBatches = computed(() => {
  const start = (leaderBatchPage.value - 1) * leaderBatchPageSize.value

  return filteredLeaderInitiationBatches.value.slice(start, start + leaderBatchPageSize.value)
})

// 负责人已提交申报的批次（「我的申请」入口的数据依据：本人项目行 batchId 集合）
const projectMemberAppliedProjects = computed(() =>
  getProjectMemberProjects(currentUser.value).filter((project) => !!project.batchId),
)

function hasProjectMemberApplied(batchId: string) {
  return projectMemberAppliedProjects.value.some((project) => project.batchId === batchId)
}

function getProjectMemberAppliedProjectLabel(batchId: string) {
  const project = projectMemberAppliedProjects.value.find((row) => row.batchId === batchId)

  return project ? project.projectName ?? '' : ''
}

const activeLeaderInitiationBatch = computed(() => {
  const batchId = route.params.batchId

  if (!batchId || Array.isArray(batchId)) {
    return null
  }

  return initiationBatchMockRows.find((batch) => batch.id === batchId) ?? null
})

// 原型约定：项目负责人（申请人）视角下，批次统一按「申报中」展示（AN-MWUAUVPS / AN-MWUAWSX8 / AN-MWUAX24P）
const projectMemberBatchDisplayStatus: LeaderBatchTimeStatus = '申报中'

/** 已结束的批次不再显示「剩余 N 天」角标，其余沿用真实剩余时间文案 */
function getProjectMemberBatchRemainingText(batch: InitiationBatchMockRow) {
  return getLeaderBatchTimeStatus(batch) === '已结束' ? '' : getLeaderBatchRemainingText(batch)
}

const activeInitiationProject = computed(() => {
  const projectId = route.params.projectId

  if (!projectId || Array.isArray(projectId)) {
    return null
  }

  return (
    initiationProjectMockRows.find(
      (project) =>
        project.id === projectId ||
        project.projectId === projectId ||
        project.projectCode === projectId,
    ) ?? null
  )
})

function getInitiationBatchByProject(project: InitiationProjectMockRow) {
  return (
    initiationBatchMockRows.find((batch) => batch.year === project.year && batch.quarter === project.quarter) ?? null
  )
}

const activeInitiationProjectBatch = computed(() => {
  const batchId = route.params.batchId

  if (batchId && !Array.isArray(batchId)) {
    const matchedBatch = initiationBatchMockRows.find((batch) => batch.id === batchId)

    if (matchedBatch) {
      return matchedBatch
    }
  }

  return activeInitiationProject.value ? getInitiationBatchByProject(activeInitiationProject.value) : null
})

// 原型约定：项目负责人（申请人）的批次详情统一展示「申报中」，申报入口保持开放

const isProjectApplicationSubmitted = computed(() => projectApplicationForm.status === 'SUBMITTED')

const projectApplicationStatusLabel = computed(() =>
  isProjectApplicationSubmitted.value ? '已提交' : '草稿',
)

const projectApplicationStepActive = computed(() => {
  if (projectApplicationForm.status === 'SUBMITTED') {
    return 4
  }

  if (projectApplicationForm.signature_file_id) {
    return 3
  }

  if (projectApplicationForm.source_docx_file_id) {
    return 2
  }

  if (projectApplicationForm.project_name && projectApplicationForm.project_description) {
    return 1
  }

  return 0
})

function hasApplicationText(value: string | undefined) {
  return Boolean(value?.trim())
}

function isProjectApplicationMemberCompleted(member: ProjectApplicationForm['project_members'][number]) {
  return (
    hasApplicationText(member.name) &&
    hasApplicationText(member.student_no) &&
    hasApplicationText(member.school) &&
    hasApplicationText(member.college)
  )
}

function isProjectApplicationMentorCompleted(mentor: ProjectApplicationForm['project_mentors'][number]) {
  return (
    hasApplicationText(mentor.name) &&
    hasApplicationText(mentor.mentor_no) &&
    hasApplicationText(mentor.school) &&
    hasApplicationText(mentor.college)
  )
}

const projectApplicationParticipantsCompleted = computed(
  () =>
    projectApplicationForm.project_members.length > 0 &&
    projectApplicationForm.project_members.every(isProjectApplicationMemberCompleted) &&
    projectApplicationForm.project_mentors.length > 0 &&
    projectApplicationForm.project_mentors.every(isProjectApplicationMentorCompleted),
)

const projectApplicationRequiredCompleted = computed(
  () =>
    Boolean(projectApplicationForm.project_name.trim()) &&
    Boolean(projectApplicationForm.project_description.trim()) &&
    Boolean(projectApplicationForm.project_leader_id) &&
    Boolean(projectApplicationForm.fill_date) &&
    projectApplicationParticipantsCompleted.value &&
    Boolean(projectApplicationForm.source_docx_file_id) &&
    projectApplicationWordFile.value?.convert_status === 'CONVERTED' &&
    Boolean(projectApplicationForm.signature_file_id) &&
    projectApplicationPreviewStatus.value === 'SYNCED',
)

const projectApplicationFooterTip = computed(() =>
  projectApplicationRequiredCompleted.value ? '必填信息、附件和签名均已完成' : '请完善必填信息、附件、签名并生成最新预览',
)

const submittedInitiationProjects = computed(() =>
  initiationProjectMockRows.filter(
    (project) =>
      project.year === (activeInitiationBatch.value?.year ?? initiationSelectedYear.value) &&
      project.quarter === (activeInitiationBatch.value?.quarter ?? initiationSelectedQuarter.value) &&
      project.submitStatus === '已提交',
  ),
)

const initiationStats = computed(() => ({
  total: submittedInitiationProjects.value.length,
  pendingReview: submittedInitiationProjects.value.filter((project) => project.currentNode === '待形式审查').length,
  reviewing: submittedInitiationProjects.value.filter((project) => project.currentNode === '评审中').length,
  pendingApproval: submittedInitiationProjects.value.filter((project) => project.currentNode === '待确认立项').length,
}))

const filteredInitiationProjects = computed(() => {
  if (!activeInitiationNodeFilter.value) {
    return submittedInitiationProjects.value
  }

  return submittedInitiationProjects.value.filter((project) => project.currentNode === activeInitiationNodeFilter.value)
})

const pagedInitiationProjects = computed(() => {
  const start = (initiationPage.value - 1) * initiationPageSize.value

  return filteredInitiationProjects.value.slice(start, start + initiationPageSize.value)
})

const approvalRoleReviewingProjects = computed(() => {
  const batch = activeApprovalRoleInitiationBatch.value

  if (!batch) {
    return []
  }

  return initiationProjectMockRows.filter(
    (project) =>
      project.year === batch.year &&
      project.quarter === batch.quarter &&
      project.submitStatus === '已提交' &&
      project.currentNode === '评审中' &&
      isProjectInApprovalRoleScope(project),
  )
})

const pagedApprovalRoleReviewingProjects = computed(() => {
  const start = (approvalRoleProjectPage.value - 1) * approvalRoleProjectPageSize.value

  return approvalRoleReviewingProjects.value.slice(start, start + approvalRoleProjectPageSize.value)
})

const isTemplateListFeature = computed(() => currentFeatureKey.value === 'template-create')

const isTemplateNewFeature = computed(() => currentFeatureKey.value === 'template-new')

const isReviewLaunchFeature = computed(() => currentFeatureKey.value === 'review-launch')

const isReviewConfigDetailFeature = computed(() => currentFeatureKey.value === 'review-config-detail')

const isReviewDataMaintenanceFeature = computed(() =>
  currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'review-data-maintenance',
)

const isQuarterlyReviewMeetingFeature = computed(() => currentFeatureKey.value === 'quarterly-review-meeting')

const isOfficeApprovalFeature = computed(
  () => currentRoleKey.value === 'researchDepartmentLeader' && currentFeatureKey.value === 'office-project-approval',
)

const isReviewerProjectReviewFeature = computed(
  () => currentRoleKey.value === 'reviewer' && currentFeatureKey.value === 'project-review',
)

const isReviewerProjectReviewDetailFeature = computed(
  () => currentRoleKey.value === 'reviewer' && currentFeatureKey.value === 'reviewer-project-review-detail',
)

const isKyownerProjectReviewFeature = computed(
  () => currentRoleKey.value === 'researchDepartmentLeader' && currentFeatureKey.value === 'review-projects',
)

const isSubdirectionReviewManagementFeature = computed(
  () => currentRoleKey.value === 'projectLeader' && currentFeatureKey.value === 'review-management',
)

const canUseProjectMemberInitiationFlow = computed(
  () => currentRoleKey.value === 'projectMember' || isInitiationApprovalRole(currentRoleKey.value),
)

const isProjectMemberInitiationBatchListFeature = computed(
  () => canUseProjectMemberInitiationFlow.value && currentFeatureKey.value === 'initiation-batches',
)

const isProjectMemberInitiationBatchDetailFeature = computed(
  () => canUseProjectMemberInitiationFlow.value && currentFeatureKey.value === 'initiation-batch-detail',
)

const isProjectMemberInitiationApplyFeature = computed(
  () => canUseProjectMemberInitiationFlow.value && currentFeatureKey.value === 'initiation-apply',
)

const isInitiationWorkflowSettingsFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'initiation-workflow-settings',
)

const isWorkflowConfigListFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'workflow-config',
)

const isWorkflowConfigDetailFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'workflow-config-detail',
)

const isInitiationProjectDetailFeature = computed(() => currentFeatureKey.value === 'initiation-project-detail')

const isProjectMemberMyProjectsFeature = computed(
  () => currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'my-projects',
)

const isProjectMemberMyProjectDetailFeature = computed(
  () => currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'my-project-detail',
)

const isProjectApplicationProjectsFeature = computed(
  () => currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'application-projects',
)

const isProjectApplicationProjectDetailFeature = computed(
  () => currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'application-project-detail',
)

const isAdminProjectRecruitmentOverviewFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-recruitment-overview',
)

const isProjectRecruitmentManagementFeature = computed(
  () => currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'project-recruitments',
)

const isProjectRecruitmentApplicationsFeature = computed(
  () => currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'project-recruitment-applications',
)

const isProjectRecruitmentMembersFeature = computed(
  () => currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'project-recruitment-members',
)

const isProjectParticipantRecruitmentFeature = computed(
  () =>
    isProjectParticipantRole(currentRoleKey.value) &&
    ['recruitment-square', 'recruitment-applications', 'recruitment-projects'].includes(currentFeatureKey.value),
)

const projectParticipantRecruitmentView = computed<ProjectParticipantRecruitmentView>(() => {
  if (currentFeatureKey.value === 'recruitment-applications') {
    return 'applications'
  }

  if (currentFeatureKey.value === 'recruitment-projects') {
    return 'projects'
  }

  return 'square'
})

const isOwnerProjectManagementFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-management',
)

const isProjectLibraryFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-library',
)

const isProjectStartFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-start',
)

const isProjectChangeFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-change',
)

const isProjectLibraryDetailFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-library-detail',
)

const isOwnerProjectDetailFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-detail',
)

const isKyownerProjectDetailFeature = computed(
  () => currentRoleKey.value === 'researchDepartmentLeader' && currentFeatureKey.value === 'project-detail',
)

const isSubdirectionProjectDetailFeature = computed(
  () => currentRoleKey.value === 'projectLeader' && currentFeatureKey.value === 'project-detail',
)

const isProjectDetailFeature = computed(
  () =>
    isOwnerProjectDetailFeature.value ||
    isKyownerProjectDetailFeature.value ||
    isSubdirectionProjectDetailFeature.value,
)

const isOwnerProjectEditFeature = computed(
  () => currentRoleKey.value === 'researchProjectAdmin' && currentFeatureKey.value === 'project-edit',
)

const isAnnouncementPublishFeature = computed(
  () =>
    currentFeatureKey.value === 'announcement-publishing' ||
    currentFeatureKey.value === 'announcement-publish' ||
    currentFeatureKey.value === 'base-announcement-publishing',
)

const isKyownerAnnouncementPublishFeature = computed(
  () => currentRoleKey.value === 'researchDepartmentLeader' && isAnnouncementPublishFeature.value,
)

const isProgressMonitoringFeature = computed(
  () => currentFeatureKey.value === 'progress-monitoring' || isOwnerProjectManagementFeature.value,
)

const currentRouteLabel = computed(() => {
  if (isDashboardFeature.value) {
    return '我的首页'
  }

  if (isTemplateListFeature.value) {
    return '模板列表'
  }

  if (isTemplateNewFeature.value) {
    return currentRoleKey.value === 'projectLeader' ? '模板编辑' : '模板搭建界面'
  }

  if (isProjectDetailFeature.value) {
    return '项目详情'
  }

  if (isOwnerProjectEditFeature.value) {
    return '编辑项目'
  }

  if (isAnnouncementPublishFeature.value) {
    return '公告发布'
  }

  if (isReviewConfigDetailFeature.value) {
    return '详情配置'
  }

  if (isQuarterlyReviewMeetingFeature.value) {
    return '季度评审会'
  }

  if (isProjectMemberInitiationBatchListFeature.value) {
    return '项目申报与立项'
  }

  if (isProjectMemberInitiationBatchDetailFeature.value) {
    return '批次详情'
  }

  if (isProjectMemberInitiationApplyFeature.value) {
    return '填写申报'
  }

  if (isInitiationProjectDetailFeature.value) {
    return '项目详情'
  }

  if (isProjectMemberMyProjectDetailFeature.value) {
    return '项目详情'
  }

  if (isProjectLibraryDetailFeature.value) {
    return '项目详情'
  }

  return currentFeature.value?.name ?? String(route.meta.featureName ?? '当前页面')
})

function getPrimaryBreadcrumbLabel(primaryKey: string) {
  const matchedPrimaryItem = primaryMenuGroups
    .flatMap((group) => group.items)
    .find((item) => item.key === primaryKey)

  return primaryBreadcrumbLabels[primaryKey] ?? matchedPrimaryItem?.label ?? '我的首页'
}

function normalizePrimaryMenuQuery(value: unknown) {
  const primaryKey = Array.isArray(value) ? value[0] : value

  if (typeof primaryKey !== 'string') {
    return ''
  }

  return primaryMenuGroups.flatMap((group) => group.items).some((item) => item.key === primaryKey) ? primaryKey : ''
}

function getPrimaryLandingPath(primaryKey: string) {
  const dashboardPath = currentRole.value?.dashboardPath ?? '/login'

  if (!primaryKey || primaryKey === 'dashboard') {
    return dashboardPath
  }

  return `${dashboardPath}?primary=${encodeURIComponent(primaryKey)}`
}

function getFeaturePathBySegment(routeSegment: string) {
  if (routeSegment === 'initiation-review' && currentRoleKey.value === 'researchProjectAdmin') {
    return `${currentRole.value?.dashboardPath ?? '/research-project-admin/dashboard'}?applicationView=declaration-review`
  }

  if (routeSegment === 'initiation-batches' && currentRoleKey.value === 'researchProjectAdmin') {
    return `${currentRole.value?.dashboardPath ?? '/research-project-admin/dashboard'}?applicationView=project-application`
  }

  if (routeSegment === 'workflow-config' && currentRoleKey.value === 'researchProjectAdmin') {
    return `${currentRole.value?.basePath ?? '/research-project-admin'}/workflow-config`
  }

  if (routeSegment === 'base-announcement-publishing' && currentRoleKey.value === 'researchProjectAdmin') {
    return `${currentRole.value?.basePath ?? '/research-project-admin'}/base-announcement-publishing`
  }

  return functionLinks.value.find((feature) => feature.routeSegment === routeSegment)?.path
}

function getRoleScopedPath(routeSegment: string) {
  return currentRole.value ? `${currentRole.value.basePath}/${routeSegment}` : undefined
}

function getRoleScopedRouteName(routeSegment: string) {
  return currentRole.value ? `${currentRole.value.routeName}-${routeSegment}` : undefined
}

function getBatchDisplayName(batch: InitiationBatchMockRow) {
  return batch.batch_name ?? batch.batchName
}

function getBatchDisplayCode(batch: InitiationBatchMockRow) {
  return batch.batch_code ?? batch.batchCode
}

function getBatchApplyStart(batch: InitiationBatchMockRow) {
  return batch.batch_apply_start ?? ''
}

function getBatchApplyDeadline(batch: InitiationBatchMockRow) {
  return batch.batch_apply_deadline ?? ''
}

function parseBatchDateTime(value?: string) {
  if (!value) {
    return Number.NaN
  }

  return new Date(value.replace(' ', 'T')).getTime()
}

function getLeaderBatchTimeStatus(batch: InitiationBatchMockRow): LeaderBatchTimeStatus {
  const now = Date.now()
  const startTime = parseBatchDateTime(getBatchApplyStart(batch))
  const deadlineTime = parseBatchDateTime(getBatchApplyDeadline(batch))

  if (Number.isFinite(startTime) && now < startTime) {
    return '未开始'
  }

  if (Number.isFinite(deadlineTime) && now <= deadlineTime) {
    return '申报中'
  }

  return '已结束'
}

function getLeaderBatchRemainingText(batch: InitiationBatchMockRow) {
  const status = getLeaderBatchTimeStatus(batch)
  const now = Date.now()
  const dayMilliseconds = 24 * 60 * 60 * 1000

  if (status === '未开始') {
    const startTime = parseBatchDateTime(getBatchApplyStart(batch))
    const remainingDays = Number.isFinite(startTime) ? Math.max(0, Math.floor((startTime - now) / dayMilliseconds)) : 0

    return `${remainingDays} 天后开始`
  }

  if (status === '申报中') {
    const deadlineTime = parseBatchDateTime(getBatchApplyDeadline(batch))
    const remainingDays = Number.isFinite(deadlineTime)
      ? Math.max(0, Math.floor((deadlineTime - now) / dayMilliseconds))
      : 0

    return `剩余 ${remainingDays} 天`
  }

  return '已截止'
}

function getLaunchQuarterDateRange(year: number, quarter: number) {
  const startMonth = (quarter - 1) * 3 + 1
  const deadlineMonth = startMonth + 2
  const padMonth = (month: number) => String(month).padStart(2, '0')

  return {
    applyStart: `${year}-${padMonth(startMonth)}-01 09:00`,
    applyDeadline: `${year}-${padMonth(deadlineMonth)}-20 18:00`,
  }
}

function createLaunchBatchSeed(year: number, quarter: number): LaunchBatchSeed {
  const { applyStart, applyDeadline } = getLaunchQuarterDateRange(year, quarter)

  return {
    year,
    quarter,
    code: `LXB-${year}-Q${quarter}`,
    name: `${year} 年第 ${quarter} 季度科研项目立项批次`,
    applyStart,
    applyDeadline,
  }
}

function getNextAvailableLaunchBatchSeed(): LaunchBatchSeed {
  const orderedBatches = [...initiationBatchMockRows].sort((a, b) => b.year - a.year || b.quarter - a.quarter)
  const usedCodes = new Set(initiationBatchMockRows.map((batch) => batch.batchCode.toUpperCase()))
  let year = orderedBatches[0]?.year ?? 2026
  let quarter = (orderedBatches[0]?.quarter ?? 2) + 1

  if (quarter > 4) {
    year += 1
    quarter = 1
  }

  while (usedCodes.has(`LXB-${year}-Q${quarter}`)) {
    quarter += 1
    if (quarter > 4) {
      year += 1
      quarter = 1
    }
  }

  return createLaunchBatchSeed(year, quarter)
}

function parseLaunchDateTime(value: string) {
  return new Date(value.replace(' ', 'T')).getTime()
}

function validateBatchCodeUnique(_: unknown, value: string, callback: (error?: Error) => void) {
  const normalizedValue = value.trim().toUpperCase()

  if (!normalizedValue) {
    callback()
    return
  }

  const isDuplicated = initiationBatchMockRows.some((batch) => batch.batchCode.toUpperCase() === normalizedValue)

  callback(isDuplicated ? new Error('批次编码已存在，请修改或重新生成') : undefined)
}

function validateApplyDeadline(_: unknown, value: string, callback: (error?: Error) => void) {
  if (!value || !launchForm.batch_apply_start) {
    callback()
    return
  }

  const startTime = parseLaunchDateTime(launchForm.batch_apply_start)
  const deadlineTime = parseLaunchDateTime(value)

  if (!Number.isFinite(startTime) || !Number.isFinite(deadlineTime)) {
    callback(new Error('请选择有效的申报时间'))
    return
  }

  callback(deadlineTime > startTime ? undefined : new Error('截止时间必须晚于开始时间'))
}

function resetLaunchInitiationForm() {
  const seed = getNextAvailableLaunchBatchSeed()

  closeLaunchGuidePreview()
  Object.assign(launchForm, {
    owner_organizations: ['北京中关村学院'],
    project_category: '基础培育类',
    batch_code: seed.code,
    batch_name: seed.name,
    funding_source: '院拨经费',
    budget_mode: '标准预算模板',
    workflow_template: '立项审批流（默认）',
    form_template: '基础培育类申报表单',
    batch_introduction: '',
    batch_apply_start: seed.applyStart,
    batch_apply_deadline: seed.applyDeadline,
    batch_guide_file: '',
    target_groups: ['北京中关村学院'],
    launch_owner: currentUser.value?.displayName ?? '张晓明',
    declaration_limit: '否',
  })
  launchGuideFile.value = null
  launchGuideUploadRef.value?.clearFiles()
  launchFormRef.value?.clearValidate()
}

function generateLaunchBatchCode() {
  const seed = getNextAvailableLaunchBatchSeed()

  launchForm.batch_code = seed.code

  if (!launchForm.batch_name.trim()) {
    launchForm.batch_name = seed.name
  }

  launchFormRef.value?.clearValidate('batch_code')
}

function handleConfigureBudgetTemplate() {
  // TODO: 接入预算模板配置界面后，跳转或打开对应的配置弹窗。
  ElMessage.info(`原型演示：配置「${launchForm.budget_mode}」预算模板，申请人将按该模板填报预算`)
}

function handleConfigureWorkflowTemplate() {
  // TODO: 接入流程模板配置界面后，跳转或打开对应的配置弹窗。
  ElMessage.info(`原型演示：配置「${launchForm.workflow_template || '流程'}」流程模板，该批次申报将按此流程审批`)
}

function handleConfigureFormTemplate() {
  // TODO: 接入表单模板配置界面后，跳转或打开对应的配置弹窗。
  ElMessage.info(`原型演示：配置「${launchForm.form_template || '申报表单'}」表单模板，申请人将按该表单填报`)
}

function revokeLaunchGuidePreviewUrl() {
  if (launchGuidePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(launchGuidePreviewUrl.value)
  }

  launchGuidePreviewUrl.value = ''
}

function closeLaunchGuidePreview() {
  launchGuidePreviewVisible.value = false
  revokeLaunchGuidePreviewUrl()
}

function validateGuideUploadFile(file: UploadRawFile) {
  const lowerName = file.name.toLowerCase()
  const isAllowedType =
    file.type === 'application/pdf' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword' ||
    lowerName.endsWith('.pdf') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc')
  const isLt100M = file.size / 1024 / 1024 <= 100

  if (!isAllowedType) {
    ElMessage.error('立项指南仅支持上传 PDF 或 DOCX 文件')
    return false
  }

  if (!isLt100M) {
    ElMessage.error('立项指南文件不能超过 100MB')
    return false
  }

  return true
}

function beforeGuideUpload(file: UploadRawFile) {
  return validateGuideUploadFile(file)
}

function handleGuideFileChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw

  if (!rawFile || !validateGuideUploadFile(rawFile)) {
    launchGuideFile.value = null
    launchForm.batch_guide_file = ''
    launchGuideUploadRef.value?.clearFiles()
    return
  }

  closeLaunchGuidePreview()
  launchGuideFile.value = uploadFile
  launchForm.batch_guide_file = uploadFile.name
}

function previewLaunchGuideFile() {
  const guideFile = launchGuideFile.value
  const rawFile = guideFile?.raw

  if (!guideFile || !rawFile) {
    ElMessage.warning('请先上传立项指南 PDF')
    return
  }

  if (!validateGuideUploadFile(rawFile)) {
    return
  }

  revokeLaunchGuidePreviewUrl()
  launchGuidePreviewUrl.value = URL.createObjectURL(rawFile)
  launchGuidePreviewVisible.value = true
}

function removeLaunchGuideFile() {
  closeLaunchGuidePreview()
  launchGuideFile.value = null
  launchForm.batch_guide_file = ''
  launchGuideUploadRef.value?.clearFiles()
}

onBeforeUnmount(() => {
  closeLaunchGuidePreview()
  closeLeaderGuidePreview()
})

function handleCancelLaunchInitiation() {
  returnToInitiationBatchList()
}

function handleSaveLaunchDraft() {
  // TODO: 接入真实保存草稿接口后，在这里提交 launchForm 与 batch_guide_file。
  ElMessage.success('草稿已保存，待发布前可继续完善')
}

async function handleConfirmLaunch() {
  if (!launchFormRef.value) {
    return
  }

  try {
    await launchFormRef.value.validate()
    // PMO 修改后重新发起，管理办的驳回反馈随之清零
    resetOfficeLaunchFeedback()
    // TODO: 接入真实创建并发布接口后，在这里提交 launchForm 与 batch_guide_file。
    ElMessage.success('发起立项成功，待管理办负责人审批后生效')
    returnToInitiationBatchList()
  } catch (invalidFields) {
    // validate() reject 时带回 { 字段: 规则[] }，用真实失败原因替代固定文案
    const fields = (invalidFields || {}) as Record<string, { message?: string }[]>
    const messages = Object.values(fields)
      .flat()
      .map(rule => rule?.message)
      .filter((m): m is string => Boolean(m))
    const unique = [...new Set(messages)]
    ElMessage.error(
      unique.length
        ? `请完善以下内容：${unique.slice(0, 3).join('；')}${unique.length > 3 ? ` 等 ${unique.length} 项` : ''}`
        : '请先完善必填项',
    )
  }
}

function handleBatchQuery() {
  appliedBatchKeyword.value = batchKeywordInput.value
  appliedBatchYear.value = batchYearInput.value
  appliedBatchQuarter.value = batchQuarterInput.value
  batchPage.value = 1
}

function handleBatchReset() {
  batchKeywordInput.value = ''
  batchYearInput.value = 'all'
  batchQuarterInput.value = 'all'
  appliedBatchKeyword.value = ''
  appliedBatchYear.value = 'all'
  appliedBatchQuarter.value = 'all'
  batchPage.value = 1
}

function setBatchStatusView(view: BatchStatusView) {
  batchStatusView.value = view
  batchPage.value = 1
}

function updateLeaderBatchFilter(nextValue: {
  keyword: string
  year: number | 'all'
  projectCategory?: string | 'all'
  status?: string | 'all'
}) {
  Object.assign(leaderBatchFilter, {
    keyword: nextValue.keyword,
    year: nextValue.year,
    projectCategory: nextValue.projectCategory ?? 'all',
    status: (nextValue.status ?? 'all') as LeaderBatchTimeStatus | 'all',
  })
}

function handleLeaderBatchQuery() {
  Object.assign(appliedLeaderBatchFilter, leaderBatchFilter)
  leaderBatchPage.value = 1
  leaderBatchError.value = ''
}

function handleLeaderBatchReset() {
  Object.assign(leaderBatchFilter, {
    keyword: '',
    year: 'all',
    projectCategory: 'all',
    status: 'all',
  } satisfies LeaderBatchFilterModel)
  Object.assign(appliedLeaderBatchFilter, leaderBatchFilter)
  leaderBatchPage.value = 1
  leaderBatchError.value = ''
}

function getBatchCardClass(batch: InitiationBatchMockRow) {
  return {
    current: batch.status === '申报中',
    finished: batch.status === '已结束',
  }
}

function getBatchStatusClass(batch: InitiationBatchMockRow) {
  return ['batch-status', batch.status === '申报中' ? 'batch-status-active' : 'batch-status-finished']
}

function getLeaderBatchStatusClass(status: LeaderBatchTimeStatus) {
  const statusClassMap: Record<LeaderBatchTimeStatus, string> = {
    未开始: 'batch-status-pending',
    申报中: 'batch-status-active',
    已结束: 'batch-status-finished',
  }

  return ['batch-status', statusClassMap[status]]
}

function getBatchProgressStyle(batch: InitiationBatchMockRow) {
  return {
    width: `${getBatchProgressValue(batch)}%`,
  }
}

function getBatchProgressValue(batch: InitiationBatchMockRow) {
  return Math.min(100, Math.max(0, batch.progress))
}

function openDeclarationReviewBatch(batch: InitiationBatchMockRow) {
  const nextQuery = { ...route.query }
  delete nextQuery.initiationAction

  router.push({
    path: route.path,
    query: {
      ...nextQuery,
      applicationView: 'declaration-review',
      batchId: batch.id,
    },
  })
}

function openBatchWorkflowSettings(batch: InitiationBatchMockRow) {
  router.push({
    name: 'research-project-admin-initiation-workflow-settings',
    params: {
      batchId: batch.id,
    },
  })
}

function clearDashboardInitiationQuery() {
  const nextQuery = { ...route.query }
  delete nextQuery.batchId
  delete nextQuery.initiationAction
  delete nextQuery.initiationView
  delete nextQuery.applicationView

  return nextQuery
}

function setApprovalRoleInitiationView(view: ApprovalRoleInitiationView) {
  if (!isInitiationApprovalRole(currentRoleKey.value)) {
    return
  }

  approvalRoleInitiationView.value = view
  approvalRoleProjectPage.value = 1

  if (view === 'self' && !isDashboardFeature.value) {
    selectedPrimaryMenuKey.value = 'application'
    router.push(currentRole.value?.dashboardPath ?? '/login')
    return
  }

  if (view === 'projectApproval' && !isDashboardFeature.value) {
    selectedPrimaryMenuKey.value = 'application'
    router.push(currentRole.value?.dashboardPath ?? '/login')
    return
  }

  if (
    isDashboardFeature.value &&
    (route.query.batchId || route.query.initiationAction || route.query.applicationView === 'project-application')
  ) {
    router.replace({
      path: route.path,
      query: clearDashboardInitiationQuery(),
    })
  }
}

function openApprovalRoleInitiationBatchDetail(batch: InitiationBatchMockRow) {
  if (!isInitiationApprovalRole(currentRoleKey.value)) {
    return
  }

  approvalRoleInitiationView.value =
    currentRoleKey.value === 'facultyLeader' ? 'projectApproval' : 'self'
  approvalRoleBatchStage.value = currentRoleKey.value === 'facultyLeader' ? 'formal' : ''
  approvalRoleFinalSubStep.value = 'assign'
  approvalRoleProjectPage.value = 1
  selectedPrimaryMenuKey.value = 'application'

  const nextQuery = clearDashboardInitiationQuery()

  router.push({
    path: currentRole.value?.dashboardPath ?? route.path,
    query: {
      ...nextQuery,
      batchId: batch.id,
    },
  })
}

function returnToApprovalRoleInitiationBatchList() {
  approvalRoleProjectPage.value = 1
  approvalDecision.value = 'APPROVE'
  approvalRejectReason.value = ''
  approvalTargetProject.value = null
  approvalDialogVisible.value = false
  selectedPrimaryMenuKey.value = 'application'

  router.push({
    path: currentRole.value?.dashboardPath ?? route.path,
    query: clearDashboardInitiationQuery(),
  })
}

function returnToAdminInitiationBatchDetail() {
  const batch = activeWorkflowInitiationBatch.value
  const adminDashboardPath = currentRole.value?.dashboardPath ?? '/research-project-admin/dashboard'

  selectedPrimaryMenuKey.value = 'application'

  router.push(batch ? `${adminDashboardPath}?batchId=${encodeURIComponent(batch.id)}` : adminDashboardPath)
}

function handleWorkflowStatusChange() {
  workflowStatusVersion.value += 1
}

function openWorkflowConfig(workflow: WorkflowConfigMockRow) {
  selectedPrimaryMenuKey.value = 'base'
  router.push({
    name: 'research-project-admin-workflow-config-detail',
    params: {
      workflowId: workflow.id,
    },
  })
}

function createWorkflowConfig() {
  const workflow = createWorkflowConfigRow()

  upsertWorkflowConfigRow(workflow)
  workflowConfigVersion.value += 1
  openWorkflowConfig(workflow)
}

function returnToWorkflowConfigList() {
  selectedPrimaryMenuKey.value = 'base'
  router.push({
    name: 'research-project-admin-workflow-config',
  })
}

function handleCommonWorkflowStatusChange(_configured: boolean, meta?: WorkflowMeta) {
  const workflow = activeWorkflowConfig.value

  if (!workflow || !meta) {
    workflowConfigVersion.value += 1
    return
  }

  const draft = readWorkflowDraft(workflow.id)
  const status = draft?.published ? '已发布' : '草稿'

  upsertWorkflowConfigRow(updateWorkflowConfigRowFromMeta(workflow, meta, status))
  workflowConfigVersion.value += 1
}

function getWorkflowConfigStatusTagType(status: WorkflowConfigMockRow['status']) {
  if (status === '已发布') {
    return 'success'
  }

  if (status === '草稿') {
    return 'warning'
  }

  return 'info'
}

function getBatchWorkflowStatusLabel(batch: InitiationBatchMockRow) {
  workflowStatusVersion.value

  return isWorkflowBatchConfigured(batch.id) ? '已配置' : '未配置'
}

function getBatchWorkflowStatusTagType(batch: InitiationBatchMockRow) {
  return getBatchWorkflowStatusLabel(batch) === '已配置' ? 'primary' : 'warning'
}

function openProjectMemberInitiationBatchDetail(batch: InitiationBatchMockRow) {
  router.push({
    name: getRoleScopedRouteName('initiation-batch-detail') ?? 'project-member-initiation-batch-detail',
    params: {
      batchId: batch.id,
    },
  })
}

function returnToProjectMemberInitiationBatchList() {
  router.push({
    name: getRoleScopedRouteName('initiation-batches') ?? 'project-member-initiation-batches',
  })
}

function getInitiationProjectBatchReturnPath(batch: InitiationBatchMockRow | null) {
  if (isInitiationApprovalRole(currentRoleKey.value) && route.query.initiationView === 'approval') {
    const dashboardPath = currentRole.value?.dashboardPath ?? '/sub-direction-leader/dashboard'

    return batch ? `${dashboardPath}?batchId=${encodeURIComponent(batch.id)}` : dashboardPath
  }

  if (canUseProjectMemberInitiationFlow.value && currentFeatureKey.value !== 'dashboard') {
    const batchListPath = getRoleScopedPath('initiation-batches') ?? '/project-member/initiation-batches'

    return batch ? `${batchListPath}/${batch.id}` : batchListPath
  }

  if (isInitiationApprovalRole(currentRoleKey.value)) {
    const dashboardPath = currentRole.value?.dashboardPath ?? '/sub-direction-leader/dashboard'

    return batch ? `${dashboardPath}?batchId=${encodeURIComponent(batch.id)}` : dashboardPath
  }

  const adminDashboardPath = currentRole.value?.dashboardPath ?? '/research-project-admin/dashboard'

  return batch ? `${adminDashboardPath}?batchId=${encodeURIComponent(batch.id)}` : adminDashboardPath
}

function returnToInitiationProjectBatchDetail() {
  selectedPrimaryMenuKey.value = 'application'
  router.push(getInitiationProjectBatchReturnPath(activeInitiationProjectBatch.value))
}

function returnToInitiationBatchList() {
  const nextQuery = { ...route.query }
  delete nextQuery.batchId
  delete nextQuery.initiationAction
  initiationPage.value = 1
  activeInitiationNodeFilter.value = ''

  router.push({
    path: route.path,
    query: nextQuery,
  })
}

function handleInitiationBatchChange() {
  initiationPage.value = 1
  activeInitiationNodeFilter.value = ''
}

function setInitiationNodeFilter(node: InitiationProjectNode | '') {
  initiationPage.value = 1
  activeInitiationNodeFilter.value = activeInitiationNodeFilter.value === node ? '' : node
}

function getInitiationNodeTagClass(node: InitiationProjectNode) {
  const nodeClassMap: Record<InitiationProjectNode, string> = {
    待形式审查: 'node-tag-orange',
    待配置评审: 'node-tag-purple',
    评审中: 'node-tag-blue',
    待确认立项: 'node-tag-orange',
    已立项: 'node-tag-green',
  }

  return ['node-tag', nodeClassMap[node]]
}

function getReviewProgressPercentage(project: InitiationProjectMockRow) {
  if (project.reviewTotal <= 0) {
    return 0
  }

  return Math.round((project.reviewFinished / project.reviewTotal) * 100)
}

function getReviewProgressText(project: InitiationProjectMockRow) {
  if (project.currentNode === '已立项') {
    return '已完成'
  }

  if (project.currentNode === '待配置评审') {
    return '待配置'
  }

  if (project.reviewTotal <= 0) {
    return '尚未开始'
  }

  return `${project.reviewFinished}/${project.reviewTotal}`
}

function getInitiationProjectStepState(
  project: InitiationProjectMockRow,
  stepIndex: number,
): InitiationProjectStepState {
  const nodeStepMap: Record<InitiationProjectNode, number> = {
    待形式审查: 1,
    待配置评审: 2,
    评审中: 3,
    待确认立项: 4,
    已立项: 5,
  }
  const activeStep = nodeStepMap[project.currentNode]

  if (project.currentNode === '已立项') {
    return 'done'
  }

  if (stepIndex < activeStep) {
    return 'done'
  }

  return stepIndex === activeStep ? 'active' : 'waiting'
}

function getInitiationProjectProcessSteps(project: InitiationProjectMockRow): InitiationProjectProcessStep[] {
  const stepDefinitions = [
    {
      title: '提交申报',
      description: `${project.leader} 已于 ${project.submitTime || '待提交'} 提交申报材料`,
    },
    {
      title: '形式审查',
      description: '核验申报书、附件材料和申报资格',
    },
    {
      title: '评审配置',
      description: '配置评审规则、指标权重和评委任务',
    },
    {
      title: '专家评审',
      description: '跟踪专家评分、意见填写和评审完成情况',
    },
    {
      title: '立项确认',
      description: '确认立项结果，生成项目档案并进入在研管理',
    },
  ]

  return stepDefinitions.map((step, index) => ({
    ...step,
    state: getInitiationProjectStepState(project, index + 1),
  }))
}

const activeInitiationProjectProcessSteps = computed(() =>
  activeInitiationProject.value ? getInitiationProjectProcessSteps(activeInitiationProject.value) : [],
)

function getInitiationProjectStepClass(step: InitiationProjectProcessStep) {
  return ['initiation-project-step', `is-${step.state}`]
}

/** 原型要求：形式审查页流转线点击可跳转 PMO 立项管理对应环节（保留批次上下文） */
function handleDeclarationFlowStep(index: number) {
  adminInitiationFlowStage.value = adminInitiationFlowStageOrder[index] ?? 'guide'

  const nextQuery = { ...route.query }
  nextQuery.applicationView = 'project-application'
  delete nextQuery.batchId

  router.push({ path: route.path, query: nextQuery })
}

function handleLaunchInitiation() {
  resetLaunchInitiationForm()
  selectedPrimaryMenuKey.value = 'application'

  const nextQuery = { ...route.query }
  delete nextQuery.batchId

  router.push({
    path: route.path,
    query: {
      ...nextQuery,
      initiationAction: 'launch',
    },
  })
}

function escapePdfText(value: string) {
  return value.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, ' ')
}

function createMockGuidePdfBlob(batch: InitiationBatchMockRow) {
  const lines = [
    'Research Project Initiation Guide',
    `Batch Code: ${getBatchDisplayCode(batch)}`,
    `Project Category: ${batch.project_category ?? 'N/A'}`,
    `Apply Start: ${getBatchApplyStart(batch)}`,
    `Apply Deadline: ${getBatchApplyDeadline(batch)}`,
    'This preview is mock data and should be replaced by backend file URL.',
  ]
  const textCommands = lines
    .map((line, index) => `${index === 0 ? '' : '0 -24 Td\n'}(${escapePdfText(line)}) Tj`)
    .join('\n')
  const stream = `BT\n/F1 14 Tf\n72 720 Td\n${textCommands}\nET`
  const objectDefinitions = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  const offsets: number[] = []
  let pdf = '%PDF-1.4\n'

  objectDefinitions.forEach((definition, index) => {
    offsets[index + 1] = pdf.length
    pdf += `${index + 1} 0 obj\n${definition}\nendobj\n`
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objectDefinitions.length + 1}\n0000000000 65535 f \n`
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  pdf += `trailer\n<< /Size ${objectDefinitions.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

function createLeaderGuideFileUrl(batch: InitiationBatchMockRow) {
  return batch.batch_guide_file?.url ?? URL.createObjectURL(createMockGuidePdfBlob(batch))
}

function revokeLeaderGuidePreviewUrl() {
  if (leaderGuidePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(leaderGuidePreviewUrl.value)
  }

  leaderGuidePreviewUrl.value = ''
}

function closeLeaderGuidePreview() {
  leaderGuidePreviewVisible.value = false
  revokeLeaderGuidePreviewUrl()
}

function previewProjectMemberGuide(batch: InitiationBatchMockRow) {
  if (!batch.batch_guide_file) {
    ElMessage.warning('该批次暂无立项指南文件')
    return
  }

  revokeLeaderGuidePreviewUrl()
  leaderGuidePreviewTitle.value = batch.batch_guide_file.name
  leaderGuidePreviewUrl.value = createLeaderGuideFileUrl(batch)
  leaderGuidePreviewVisible.value = true
}

function downloadProjectMemberGuide(batch: InitiationBatchMockRow) {
  if (!batch.batch_guide_file) {
    ElMessage.warning('该批次暂无可下载的立项指南')
    return
  }

  const fileUrl = createLeaderGuideFileUrl(batch)
  const anchor = document.createElement('a')

  anchor.href = fileUrl
  anchor.download = batch.batch_guide_file.name
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  if (fileUrl.startsWith('blob:')) {
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0)
  }
}

function copyApplicationDraftToState(batchId: string, draft: ProjectApplicationDraftRecord) {
  Object.assign(projectApplicationForm, {
    ...createDefaultProjectApplicationForm(batchId, currentUser.value),
    ...draft.form,
    batch_id: batchId,
    project_leader_id: currentUser.value?.id ?? draft.form.project_leader_id,
    project_leader_name: currentUser.value?.displayName ?? draft.form.project_leader_name,
  })
  projectApplicationWordFile.value = draft.source_docx_file ?? null
  projectApplicationSignatureDataUrl.value = draft.signature_file?.data_url ?? ''
  projectApplicationPreviewStatus.value = draft.preview.preview_status
  projectApplicationActiveTab.value = 'form'
  projectApplicationForm.generated_pdf_file_id = draft.preview.generated_pdf_file_id
  projectApplicationFormPanelRef.value?.clearValidate()
}

function loadActiveProjectApplicationDraft() {
  const batchId = route.params.batchId

  if (!batchId || Array.isArray(batchId)) {
    return
  }

  const draft = loadProjectApplicationDraft(batchId, currentUser.value)

  copyApplicationDraftToState(batchId, draft)
}

function buildCurrentProjectApplicationDraft(): ProjectApplicationDraftRecord {
  const signatureFile = projectApplicationForm.signature_file_id
    ? {
        file_id: projectApplicationForm.signature_file_id,
        data_url: projectApplicationSignatureDataUrl.value,
        uploaded_at: new Date().toISOString(),
      }
    : undefined

  return {
    form: { ...projectApplicationForm },
    source_docx_file: projectApplicationWordFile.value ? { ...projectApplicationWordFile.value } : undefined,
    signature_file: signatureFile,
    preview: {
      generated_pdf_file_id: projectApplicationForm.generated_pdf_file_id,
      preview_status: projectApplicationPreviewStatus.value,
      synced_at: projectApplicationPreviewStatus.value === 'SYNCED' ? new Date().toISOString() : undefined,
    },
  }
}

function markProjectApplicationPreviewStale() {
  if (projectApplicationPreviewStatus.value === 'SYNCED') {
    projectApplicationPreviewStatus.value = 'STALE'
  }
}

function updateProjectApplicationForm(nextValue: ProjectApplicationForm) {
  Object.assign(projectApplicationForm, nextValue)
  markProjectApplicationPreviewStale()
}

function updateProjectApplicationSignatureDataUrl(dataUrl: string) {
  projectApplicationSignatureDataUrl.value = dataUrl
}

function validateProjectApplicationWordFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const isAllowedWord = extension === 'doc' || extension === 'docx'
  const isDocm = extension === 'docm'
  const isLt20M = file.size / 1024 / 1024 <= 20

  if (isDocm) {
    ElMessage.error('不允许上传带宏的 DOCM 文件')
    return false
  }

  if (!isAllowedWord) {
    ElMessage.error('仅支持上传 DOC 或 DOCX 申报书')
    return false
  }

  if (!isLt20M) {
    ElMessage.error('申报书文件不能超过 20MB')
    return false
  }

  return true
}

function handleProjectApplicationWordUpload(file: File) {
  if (!validateProjectApplicationWordFile(file)) {
    return
  }

  const fileState = createWordFileState(file)

  // TODO: 接入真实 multipart/form-data 上传接口，携带 Bearer Token，并由后端保存原始 Word。
  projectApplicationWordFile.value = fileState
  projectApplicationForm.source_docx_file_id = fileState.file_id
  projectApplicationForm.generated_pdf_file_id = undefined
  markProjectApplicationPreviewStale()
  ElMessage.success('申报书已上传，并已模拟转换为 PDF')
}

function handleProjectApplicationSignatureSaved(_: Blob, dataUrl: string) {
  // TODO: 接入真实签名 PNG 上传接口，上传透明背景 PNG Blob，不保存 Base64 作为最终文件。
  const signatureFile = createSignatureFileState(dataUrl)

  projectApplicationSignatureDataUrl.value = dataUrl
  projectApplicationForm.signature_file_id = signatureFile.file_id
  markProjectApplicationPreviewStale()
}

function handleProjectApplicationSignatureCleared() {
  projectApplicationSignatureDataUrl.value = ''
  projectApplicationForm.signature_file_id = ''
  markProjectApplicationPreviewStale()
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

async function generateProjectApplicationPreview() {
  if (!projectApplicationWordFile.value || !projectApplicationForm.source_docx_file_id) {
    ElMessage.warning('请先上传项目申报书 Word 文件')
    return
  }

  if (projectApplicationWordFile.value.convert_status !== 'CONVERTED') {
    ElMessage.warning('请等待 Word 转换为 PDF 后再预览')
    return
  }

  projectApplicationPreviewGenerating.value = true

  try {
    // TODO: 调用后端“表单数据写入 Word 模板副本 + LibreOffice Headless 转 PDF”接口。
    await delay(420)
    projectApplicationForm.generated_pdf_file_id = createGeneratedPdfId(projectApplicationForm.batch_id)
    projectApplicationPreviewStatus.value = 'SYNCED'
    projectApplicationActiveTab.value = 'preview'
    saveCurrentProjectApplicationDraft()
    ElMessage.success('PDF 预览已同步')
  } catch {
    ElMessage.error('PDF 生成失败，请稍后重试')
  } finally {
    projectApplicationPreviewGenerating.value = false
  }
}

function saveCurrentProjectApplicationDraft() {
  saveProjectApplicationDraft(projectApplicationForm.batch_id, currentUser.value, buildCurrentProjectApplicationDraft())
}

async function handleSaveProjectApplicationDraft() {
  projectApplicationSaving.value = true

  try {
    projectApplicationForm.status = 'DRAFT'
    saveCurrentProjectApplicationDraft()
    await delay(220)
    ElMessage.success('申报草稿已保存')
  } catch {
    ElMessage.error('草稿保存失败，请稍后重试')
  } finally {
    projectApplicationSaving.value = false
  }
}

function createProjectApplicationPdfBlob() {
  const batch = activeLeaderInitiationBatch.value
  const lines = [
    'ZGCI Research Project Application',
    `Batch: ${batch ? getBatchDisplayCode(batch) : projectApplicationForm.batch_id}`,
    `Project: ${projectApplicationForm.project_name}`,
    `Leader: ${projectApplicationForm.project_leader_name}`,
    `Fill Date: ${projectApplicationForm.fill_date}`,
    `Generated PDF ID: ${projectApplicationForm.generated_pdf_file_id ?? ''}`,
  ]
  const stream = `BT\n/F1 14 Tf\n72 720 Td\n${lines
    .map((line, index) => `${index === 0 ? '' : '0 -24 Td\n'}(${escapePdfText(line)}) Tj`)
    .join('\n')}\nET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  const offsets: number[] = []
  let pdf = '%PDF-1.4\n'

  objects.forEach((definition, index) => {
    offsets[index + 1] = pdf.length
    pdf += `${index + 1} 0 obj\n${definition}\nendobj\n`
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

function downloadProjectApplicationPdf() {
  if (projectApplicationPreviewStatus.value !== 'SYNCED' || !projectApplicationForm.generated_pdf_file_id) {
    ElMessage.warning('请先生成最新 PDF 预览')
    return
  }

  const fileUrl = URL.createObjectURL(createProjectApplicationPdfBlob())
  const anchor = document.createElement('a')

  anchor.href = fileUrl
  anchor.download = `${projectApplicationForm.project_name || 'project-application'}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 0)
}

function returnToProjectMemberBatchDetail() {
  const batchId = route.params.batchId

  if (!batchId || Array.isArray(batchId)) {
    returnToProjectMemberInitiationBatchList()
    return
  }

  router.push({
    name: getRoleScopedRouteName('initiation-batch-detail') ?? 'project-member-initiation-batch-detail',
    params: {
      batchId,
    },
  })
}

async function handleSubmitProjectApplication() {
  if (projectApplicationSubmitting.value || projectApplicationForm.status === 'SUBMITTED') {
    return
  }

  try {
    await projectApplicationFormPanelRef.value?.validate()
  } catch {
    projectApplicationActiveTab.value = 'form'
    ElMessage.error('请先完善项目申报必填信息')
    return
  }

  if (!projectApplicationParticipantsCompleted.value) {
    projectApplicationActiveTab.value = 'form'
    ElMessage.error('请完整填写项目成员与导师信息')
    return
  }

  if (!projectApplicationWordFile.value || projectApplicationWordFile.value.convert_status !== 'CONVERTED') {
    ElMessage.error('请上传 Word 申报书，并确认已成功转换为 PDF')
    return
  }

  if (!projectApplicationForm.signature_file_id || !projectApplicationSignatureDataUrl.value) {
    ElMessage.error('提交申报前必须完成手写签名')
    return
  }

  if (projectApplicationPreviewStatus.value !== 'SYNCED' || !projectApplicationForm.generated_pdf_file_id) {
    ElMessage.error('请先点击预览，生成最新 PDF')
    return
  }

  try {
    await ElMessageBox.confirm('提交后将进入申报审查流程，是否确认提交？', '提交申报', {
      confirmButtonText: '确认提交',
      cancelButtonText: '取消',
      type: 'warning',
      autofocus: false,
    })
  } catch {
    return
  }

  projectApplicationSubmitting.value = true

  try {
    // TODO: 接入真实提交接口，后端需校验 Bearer Token 用户只能提交自己的申报。
    await delay(480)
    projectApplicationForm.status = 'SUBMITTED'
    saveCurrentProjectApplicationDraft()
    ElMessage.success('项目申报已提交')
    returnToProjectMemberBatchDetail()
  } catch {
    ElMessage.error('提交失败，请稍后重试')
  } finally {
    projectApplicationSubmitting.value = false
  }
}

function handleProjectMemberInitiationApply() {
  const batch = activeLeaderInitiationBatch.value

  if (!batch) {
    ElMessage.warning('未找到当前立项批次')
    return
  }

  // 已在该批次提交申报：不再进入填写申报，直接跳转「我的申请」申报详情
  const appliedProject = projectMemberAppliedProjects.value.find((project) => project.batchId === batch.id)

  if (appliedProject) {
    router.push(`/project-member/application-projects/${appliedProject.projectId}`)
    return
  }

  router.push({
    name: getRoleScopedRouteName('initiation-apply') ?? 'project-member-initiation-apply',
    params: {
      batchId: batch.id,
    },
  })
}

function openInitiationProjectDetail(project: InitiationProjectMockRow) {
  if (
    currentRoleKey.value === 'facultyLeader' &&
    approvalRoleInitiationView.value === 'projectApproval'
  ) {
    reviewReportVisible.value = true
    return
  }

  const batch = getInitiationBatchByProject(project)
  const shouldReturnToApprovalDashboard =
    isDashboardFeature.value &&
    isInitiationApprovalRole(currentRoleKey.value) &&
    approvalRoleInitiationView.value === 'self'
  const routeName =
    canUseProjectMemberInitiationFlow.value
      ? getRoleScopedRouteName('initiation-project-detail') ?? 'project-member-initiation-project-detail'
      : 'research-project-admin-initiation-project-detail'

  router.push({
    name: routeName,
    params: {
      batchId: batch?.id ?? `${project.year}-q${project.quarter}`,
      projectId: project.id,
    },
    query: shouldReturnToApprovalDashboard
      ? {
          initiationView: 'approval',
        }
      : undefined,
  })
}

function handleProjectProcessEntry(action: 'review' | 'settings', project: InitiationProjectMockRow) {
  const actionTextMap = {
    review: '形式审查',
    settings: '评审设置',
  } as const

  ElMessage.info(`${project.projectName}的${actionTextMap[action]}入口待接入项目办理中心`)
}

function canFormalReview(project: InitiationProjectMockRow) {
  return project.currentNode === '待形式审查'
}

function canReviewSettings(project: InitiationProjectMockRow) {
  return project.currentNode === '待配置评审'
}

function isProjectInApprovalRoleScope(project: InitiationProjectMockRow) {
  if (currentRoleKey.value === 'projectLeader') {
    return ['应用研究部', '智能制造中心', '新能源材料中心', 'AI 医疗研究部', 'AI 物理研究部'].includes(
      project.department,
    )
  }

  if (currentRoleKey.value === 'facultyLeader') {
    return ['生命与医学学部', '应用研究部', '智能制造中心', '新能源材料中心', 'AI 医疗研究部', 'AI 物理研究部'].includes(
      project.department,
    )
  }

  return false
}

function openApprovalProjectDialog(project: InitiationProjectMockRow) {
  if (project.currentNode !== '评审中') {
    ElMessage.warning('当前仅评审中的项目可以进入项目审批')
    return
  }

  approvalTargetProject.value = project
  approvalDecision.value = 'APPROVE'
  approvalRejectReason.value = ''
  approvalDialogVisible.value = true
}

function closeApprovalProjectDialog() {
  approvalDialogVisible.value = false
  approvalSubmitting.value = false
  approvalTargetProject.value = null
  approvalDecision.value = 'APPROVE'
  approvalRejectReason.value = ''
}

async function confirmApprovalProject() {
  const project = approvalTargetProject.value

  if (!project) {
    return
  }

  if (approvalDecision.value === 'REJECT' && !approvalRejectReason.value.trim()) {
    ElMessage.error('驳回审批时必须填写驳回理由')
    return
  }

  approvalSubmitting.value = true

  try {
    // 原型阶段仅模拟当前审批人的办理结果，不调用真实审批接口。
    await delay(360)
    ElMessage.success(
      approvalDecision.value === 'APPROVE'
        ? `已通过「${project.projectName}」审批`
        : `已驳回「${project.projectName}」审批`,
    )
    closeApprovalProjectDialog()
  } catch {
    ElMessage.error('审批操作失败，请稍后重试')
  } finally {
    approvalSubmitting.value = false
  }
}

function handleInitiationToolClick(toolKey: InitiationToolKey) {
  if (toolKey === 'review') {
    setInitiationNodeFilter('待形式审查')
    ElMessage.info('已筛选待形式审查项目')
    return
  }

  if (toolKey === 'settings') {
    setInitiationNodeFilter('待配置评审')
    ElMessage.info('评审配置页面待接入，已筛选待配置评审项目')
    return
  }

  // TODO: 接入现有 Excel 上传、文件校验和导入结果反馈组件。
  ElMessage.info('外部项目导入入口已保留，待接入导入组件')
}

watch(
  () => [route.params.batchId, currentUser.value?.id, currentFeatureKey.value],
  () => {
    if (isProjectMemberInitiationApplyFeature.value) {
      loadActiveProjectApplicationDraft()
    }
  },
  { immediate: true },
)

watch(
  () => [currentFeatureKey.value, route.query.batchId, route.query.initiationAction, route.query.applicationView],
  () => {
    if (
      isDashboardFeature.value &&
      (route.query.batchId ||
        route.query.initiationAction ||
        route.query.applicationView === 'project-application' ||
        route.query.applicationView === 'declaration-review')
    ) {
      selectedPrimaryMenuKey.value = 'application'
    }
  },
  { immediate: true },
)

const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
  const primaryKey = activePrimaryMenuKey.value
  const primaryPath = getPrimaryLandingPath(primaryKey)

  const items: BreadcrumbItem[] = [
    {
      label: getPrimaryBreadcrumbLabel(primaryKey),
      to:
        !isDashboardFeature.value ||
        (isResearchAdminApplicationLanding.value &&
          (isInitiationLaunchPage.value ||
            isAdminDeclarationReviewBatchPage.value ||
            isAdminApplicationReviewPage.value))
          ? primaryPath
          : undefined,
    },
  ]

  if (isDashboardFeature.value) {
    if (isResearchAdminApplicationLanding.value && adminInitiationFlowBatchCode.value) {
      // AN-MWUF20S9：批次流转线面包屑——「立项管理」可点击返回批次列表（原 office-batch-context 内返回按钮上移至此）
      items.push({
        label: '立项管理',
        action: backToAdminInitiationFlowPick,
      })
      items.push({
        label:
          adminInitiationFlowBatch.value?.batchName ??
          adminInitiationFlowBatchCode.value,
      })
      // 面包屑统一（整盘）：批次详情第三级为批次名，第四级为当前流转阶段
      items.push({
        label: officeApprovalFlowSteps[adminInitiationFlowStageOrder.indexOf(adminInitiationFlowStage.value)],
      })
      return items
    }

    if (
      currentRoleKey.value === 'researchDepartmentLeader' &&
      isOfficeApprovalFeature.value &&
      officeApprovalSelectedBatchCode.value
    ) {
      // 管理办负责人批次审批面包屑——「项目审批」可点击返回批次选择
      items.push({
        label: '项目审批',
        action: backToOfficeBatchPick,
      })
      items.push({
        label:
          officeApprovalSelectedBatch.value?.batchName ??
          officeApprovalSelectedBatchCode.value,
      })
      return items
    }

    if (isResearchAdminApplicationLanding.value && isInitiationLaunchPage.value) {
      items.push({ label: '发起立项' })
    }

    if (isResearchAdminApplicationLanding.value && isAdminDeclarationReviewBatchPage.value) {
      items.push({ label: '形式审查' })
    }

    if (isResearchAdminApplicationLanding.value && isAdminApplicationReviewPage.value) {
      items.push({
        label: '形式审查',
        to: `${currentRole.value?.dashboardPath ?? '/research-project-admin/dashboard'}?applicationView=declaration-review`,
      })
      items.push({ label: '申报审查' })
    }

    if (isApprovalRoleApplicationLanding.value) {
      if (
        currentRoleKey.value === 'facultyLeader' &&
        approvalRoleInitiationView.value === 'projectApproval'
      ) {
        items.push({
          label: '项目审批',
          to: undefined,
          action: activeApprovalRoleInitiationBatch.value
            ? backToFacultyBatchPick
            : undefined,
        })

        if (
          approvalRoleInitiationView.value === 'projectApproval' &&
          activeApprovalRoleInitiationBatch.value
        ) {
          // 面包屑统一（整盘）：批次详情第三级为批次名，第四级为当前流转阶段（子步骤见页内导航）
          items.push({
            label:
              activeApprovalRoleInitiationBatch.value.batchName ??
              '批次详情',
          })
          items.push({
            label: officeApprovalFlowSteps[
              ['guide', 'formal', 'final', 'recheck', 'archive'].indexOf(
                approvalRoleBatchStage.value || 'guide',
              )
            ],
          })
        }
      }
    }

    return items
  }

  if (isProjectMemberInitiationBatchListFeature.value) {
    return items
  }

  if (isProjectMemberInitiationBatchDetailFeature.value) {
    // 面包屑统一（整盘）：批次详情——一级返回批次列表，第三级批次名
    if (items[0]) {
      items[0] = { ...items[0], to: getRoleScopedPath('initiation-batches') }
    }
    items.push({
      label: activeLeaderInitiationBatch.value?.batchName ?? '当前批次',
    })
    items.push({ label: '批次详情' })
    return items
  }

  if (isProjectMemberInitiationApplyFeature.value) {
    // 面包屑统一（整盘）：填写申报——[一级(→批次列表) / 批次名(→批次详情) / 填写申报]
    if (items[0]) {
      items[0] = { ...items[0], to: getRoleScopedPath('initiation-batches') }
    }
    items.push({
      label: activeLeaderInitiationBatch.value?.batchName ?? '当前批次',
      to: activeLeaderInitiationBatch.value
        ? `${getRoleScopedPath('initiation-batches')}/${activeLeaderInitiationBatch.value.id}`
        : getRoleScopedPath('initiation-batches'),
    })
    items.push({ label: '填写申报' })
    return items
  }

  if (isInitiationWorkflowSettingsFeature.value) {
    items.push({
      label: activeWorkflowInitiationBatch.value?.batchName ?? '批次详情',
      to: activeWorkflowInitiationBatch.value
        ? getInitiationProjectBatchReturnPath(activeWorkflowInitiationBatch.value)
        : currentRole.value?.dashboardPath,
    })
    items.push({ label: '审批流设置' })
    return items
  }

  if (isWorkflowConfigListFeature.value) {
    items.push({ label: '审批流配置' })
    return items
  }

  if (isWorkflowConfigDetailFeature.value) {
    items.push({
      label: '审批流配置',
      to: `${currentRole.value?.basePath ?? '/research-project-admin'}/workflow-config`,
    })
    items.push({ label: activeWorkflowConfig.value?.name ?? '审批流编辑' })
    return items
  }

  if (isInitiationProjectDetailFeature.value) {
    items.push({
      label: '批次详情',
      to: getInitiationProjectBatchReturnPath(activeInitiationProjectBatch.value),
    })
    items.push({ label: '项目详情' })
    return items
  }

  if (isProjectMemberMyProjectDetailFeature.value) {
    items.push({
      label: '我的项目',
      to: getFeaturePathBySegment('my-projects') ?? getRoleScopedPath('my-projects'),
    })
    items.push({ label: '项目详情' })
    return items
  }

  if (isProjectLibraryDetailFeature.value) {
    items.push({
      label: '项目库',
      to: getFeaturePathBySegment('project-library') ?? getRoleScopedPath('project-library'),
    })
    items.push({ label: '项目详情' })
    return items
  }

  if (isOwnerProjectDetailFeature.value || isOwnerProjectEditFeature.value) {
    items.push({
      label: '项目管理',
      to: getFeaturePathBySegment('project-management') ?? getRoleScopedPath('project-management'),
    })
    items.push({
      label: isOwnerProjectEditFeature.value ? '编辑项目' : '项目详情',
    })
    return items
  }

  if (isKyownerProjectDetailFeature.value) {
    items.push({
      label: '评审项目',
      to: getFeaturePathBySegment('review-projects') ?? getRoleScopedPath('review-projects'),
    })
    items.push({ label: '项目详情' })
    return items
  }

  if (isSubdirectionProjectDetailFeature.value) {
    items.push({
      label: '评审管理',
      to: getFeaturePathBySegment('review-management') ?? getRoleScopedPath('review-management'),
    })
    items.push({ label: '项目详情' })
    return items
  }

  if (isReviewConfigDetailFeature.value) {
    items.push({
      label: '数据维护',
      to: getFeaturePathBySegment('review-data-maintenance') ?? getRoleScopedPath('review-data-maintenance'),
    })
    items.push({ label: '详情配置' })
    return items
  }

  if (isTemplateNewFeature.value) {
    if (currentRoleKey.value === 'projectLeader') {
      items.push({
        label: '评审管理',
        to: getFeaturePathBySegment('review-management') ?? getRoleScopedPath('review-management'),
      })
      items.push({ label: '模板编辑' })
      return items
    }

    items.push({
      label: '模板搭建',
      to: getFeaturePathBySegment('template-create') ?? getRoleScopedPath('template-create'),
    })
    items.push({ label: currentRouteLabel.value })
    return items
  }

  if (isFinanceProjectDetailFeature.value) {
    const financeListSegment = currentRoleKey.value === 'projectMember' ? 'finance-overview' : 'finance-workbench'

    items.push({
      label: currentRoleKey.value === 'projectMember' ? '我的经费' : '财务工作台',
      to: getFeaturePathBySegment(financeListSegment) ?? getRoleScopedPath(financeListSegment),
    })
    items.push({ label: '项目经费详情' })
    return items
  }

  if (isOfficeApprovalFeature.value) {
    // 面包屑统一（整盘）：管理办项目审批——批次选择态只到「项目审批」；进入批次后为 [项目审批(可点返回) / 批次名 / 当前阶段]
    if (officeApprovalSelectedBatchCode.value) {
      items.push({
        label: '项目审批',
        action: backToOfficeBatchPick,
      })
      items.push({
        label: officeApprovalSelectedBatch.value?.batchName ?? officeApprovalSelectedBatchCode.value,
      })
      items.push({ label: officeApprovalStageMeta[officeActiveStage.value].title })
      return items
    }
    items.push({ label: '项目审批' })
    return items
  }

  if (isFinanceFeature.value) {
    items.push({
      label:
        currentRoleKey.value === 'projectMember' && currentFeatureKey.value === 'finance-overview'
          ? '我的经费'
          : featureBreadcrumbLabels[currentFeatureKey.value] ?? currentRouteLabel.value,
    })
    return items
  }

  if (isProjectMemberPaperCreateFeature.value) {
    items.push({
      label: '我的论文',
      to: getFeaturePathBySegment('my-papers') ?? getRoleScopedPath('my-papers'),
    })
    items.push({ label: '新增论文' })
    return items
  }

  items.push({
    label: featureBreadcrumbLabels[currentFeatureKey.value] ?? currentRouteLabel.value,
  })

  return items
})

const breadcrumbBackTarget = computed(() => {
  const parentItem = [...breadcrumbItems.value]
    .slice(0, -1)
    .reverse()
    .find((item) => item.to)

  if (parentItem?.to) {
    return parentItem.to
  }

  if (!isDashboardFeature.value) {
    return getPrimaryLandingPath(activePrimaryMenuKey.value)
  }

  if (activePrimaryMenuKey.value !== 'dashboard') {
    return getPrimaryLandingPath('dashboard')
  }

  return currentRole.value?.dashboardPath ?? '/login'
})

const visibleRoleRoutes = computed(() => {
  const userRoleKeys = new Set(currentUser.value?.roles.map((role) => role.key) ?? [])
  return roleRouteConfigs.filter((role) => userRoleKeys.has(role.key))
})

function switchRole(event: Event) {
  const targetRoleKey = (event.target as HTMLSelectElement).value as RoleKey
  const targetRole = visibleRoleRoutes.value.find((role) => role.key === targetRoleKey)

  if (!targetRole) {
    return
  }

  selectedPrimaryMenuKey.value = isProjectParticipantRole(targetRole.key) ? 'projects' : 'dashboard'
  router.push(targetRole.dashboardPath)
}

function openPrimaryMenu(item: PrimaryMenuItem) {
  selectedPrimaryMenuKey.value = item.key

  if (
    isDashboardFeature.value &&
    (route.query.batchId || route.query.initiationAction || route.query.applicationView === 'project-application')
  ) {
    router.replace({
      path: route.path,
      query: clearDashboardInitiationQuery(),
    })
  }

  if (item.key === 'quarterly') {
    router.push(`${currentRole.value?.basePath ?? ''}/quarterly-review-meeting`)
    return
  }

  // 项目负责人：「项目申报与立项」直达批次列表（原「立项申请 / 我的项目」两入口合并，申报进度在批次列表/详情内直接查看）
  if (item.key === 'application' && currentRoleKey.value === 'projectMember') {
    router.push(`${currentRole.value?.basePath ?? ''}/initiation-batches`)
    return
  }

  if (item.key === 'application' && isInitiationApprovalRole(currentRoleKey.value)) {
    approvalRoleInitiationView.value = 'self'
  }

  if (isDashboardFeature.value) {
    router.replace(getPrimaryLandingPath(item.key))
    return
  }

  if (!isDashboardFeature.value) {
    router.push(currentRole.value?.dashboardPath ?? '/login')
  }
}

function handlePendingEntry(entry: LandingCard) {
  ElMessage.info(`${entry.title}功能正在建设中`)
}

function setWorkbenchShortcutPage(page: number) {
  const lastPageIndex = Math.max(0, workbenchShortcutPages.value.length - 1)

  workbenchShortcutPage.value = Math.min(lastPageIndex, Math.max(0, page))
}

function switchWorkbenchShortcutPage(direction: 'prev' | 'next') {
  const lastPageIndex = Math.max(0, workbenchShortcutPages.value.length - 1)

  if (lastPageIndex === 0) {
    return
  }

  const nextPage =
    direction === 'prev'
      ? workbenchShortcutPage.value === 0
        ? lastPageIndex
        : workbenchShortcutPage.value - 1
      : workbenchShortcutPage.value === lastPageIndex
        ? 0
        : workbenchShortcutPage.value + 1

  setWorkbenchShortcutPage(nextPage)
}

function setWorkbenchNewsTab(tab: WorkbenchNewsTab) {
  workbenchNewsTab.value = tab
}

function handleWorkbenchAction(action: string) {
  ElMessage.info(`原型展示：点击了“${action}”，此处可接入对应业务页面`)
}

function parseWorkbenchTodoDeadline(deadline: string) {
  const matched = deadline
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:\s|T)(\d{2}):(\d{2})$/)

  if (!matched) {
    return null
  }

  const [, year, month, day, hour, minute] = matched
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function getWorkbenchTodoUrgency(deadlineDate: Date | null): WorkbenchTodoPriority {
  if (!deadlineDate) {
    return 'normal'
  }

  const remainingDays = (deadlineDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)

  if (remainingDays <= 1) {
    return 'urgent'
  }

  if (remainingDays <= 3) {
    return 'high'
  }

  return 'normal'
}

function getWorkbenchTodoUrgencyLabel(deadlineDate: Date | null) {
  const urgency = getWorkbenchTodoUrgency(deadlineDate)

  if (urgency === 'urgent') {
    return '紧急'
  }

  if (urgency === 'high') {
    return '较急'
  }

  return '普通'
}

function formatWorkbenchTodoTimeDistance(distanceMs: number) {
  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs

  if (distanceMs < hourMs) {
    return `${Math.max(1, Math.ceil(distanceMs / minuteMs))}分钟`
  }

  if (distanceMs <= dayMs) {
    return `${Math.max(1, Math.ceil(distanceMs / hourMs))}小时`
  }

  return `${Math.ceil(distanceMs / dayMs)}天`
}

function getWorkbenchTodoUrgencyReason(item: WorkbenchTodoItem, deadlineDate: Date | null) {
  if (!deadlineDate) {
    return `AI提示：该待办暂无明确截止时间，已放在列表最后，建议结合${item.module}办理节奏安排处理。`
  }

  const remainingMs = deadlineDate.getTime() - Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  if (remainingMs <= 0) {
    return `AI提示：该待办已逾期${formatWorkbenchTodoTimeDistance(
      Math.abs(remainingMs),
    )}，可能影响${item.module}的${item.taskType}进度，建议优先处理。`
  }

  if (remainingMs <= dayMs) {
    return `AI提示：距离截止仅剩${formatWorkbenchTodoTimeDistance(
      remainingMs,
    )}，处理窗口很短，因此标记为紧急。`
  }

  if (remainingMs <= 3 * dayMs) {
    return `AI提示：距离截止约${formatWorkbenchTodoTimeDistance(
      remainingMs,
    )}，需要尽快安排${item.taskType}，因此标记为较急。`
  }

  return `AI提示：距离截止还有${formatWorkbenchTodoTimeDistance(
    remainingMs,
  )}，当前风险可控，但建议提前处理避免临近堆积。`
}

function handleWorkbenchTodoClick(item: WorkbenchTodoDisplayItem) {
  if (!item.targetUrl) {
    ElMessage.info(`原型展示：进入“${item.taskType}”处理`)
    return
  }

  router.push(item.targetUrl)
}

function handleWorkbenchNoticeClick(item: WorkbenchNewsItem) {
  ElMessage.info(`原型展示：打开公告“${item.title}”`)
}

function handleWorkbenchYearChange(year: number | string) {
  workbenchBoardYear.value = Number(year)
  ElMessage.success(`已切换为 ${workbenchBoardYear.value} 年数据`)
}

function getAvatarLetter(name?: string) {
  return name?.trim().slice(0, 1) || '用'
}

/** 学部批次审批面包屑「项目审批」点击：返回批次列表（AN-MWUF20S9 与 PMO/管理办一致） */
function backToFacultyBatchPick() {
  approvalRoleBatchStage.value = ''
  approvalRoleFinalSubStep.value = 'assign'
  router.replace({
    path: route.path,
    query: clearDashboardInitiationQuery(),
  })
}

/** 面包屑点击（AN-MWUF20S9）：带 action 的项（批次流转线「立项管理/项目审批」）点击仅重置组件内状态，不改 URL */
function handleBreadcrumbClick(item: BreadcrumbItem) {
  if (item.action) {
    item.action()
  }
}

function goBack() {
  if (
    currentRoleKey.value === 'facultyLeader' &&
    isApprovalRoleApplicationLanding.value &&
    approvalRoleInitiationView.value === 'projectApproval'
  ) {
    if (approvalRoleBatchStage.value) {
      approvalRoleBatchStage.value = ''
      approvalRoleFinalSubStep.value = 'assign'
      return
    }

    if (activeApprovalRoleInitiationBatch.value) {
      approvalRoleBatchStage.value = ''
      approvalRoleFinalSubStep.value = 'assign'
      router.replace({
        path: route.path,
        query: clearDashboardInitiationQuery(),
      })
      return
    }

    setApprovalRoleInitiationView('self')
    return
  }

  // 面包屑统一（整盘）：PMO 批次流转线内圆返回 = 返回批次网格（与「立项管理」crumb 一致）
  if (
    currentRoleKey.value === 'researchProjectAdmin' &&
    isResearchAdminApplicationLanding.value &&
    adminInitiationFlowBatchCode.value
  ) {
    backToAdminInitiationFlowPick()
    return
  }

  // 面包屑统一（整盘）：管理办批次审批内圆返回 = 返回批次选择（与「项目审批」crumb 一致）
  if (
    currentRoleKey.value === 'researchDepartmentLeader' &&
    isOfficeApprovalFeature.value &&
    officeApprovalSelectedBatchCode.value
  ) {
    backToOfficeBatchPick()
    return
  }

  router.push(breadcrumbBackTarget.value)
}

function logout() {
  clearCurrentUser()
  currentUser.value = null
  router.replace({ name: 'login' })
}

async function confirmLogout() {
  try {
    await ElMessageBox.confirm('退出后需要重新登录，是否确认退出系统？', '退出系统', {
      confirmButtonText: '确认退出',
      cancelButtonText: '取消',
      type: 'warning',
      autofocus: false,
    })
    logout()
  } catch {
    // 用户取消退出时不需要额外处理。
  }
}

function resolveFeatureIcon(icon?: string) {
  if (!icon) {
    return ''
  }

  const normalizedIcon = icon
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^src\/dataset\//, '')

  return featureIconModules[`../dataset/${normalizedIcon}`] ?? ''
}

function resolveLandingCardIcon(title: string) {
  const iconFileName = landingCardIconFileMap[title]

  return iconFileName ? resolveFeatureIcon(`icon/${iconFileName}`) : ''
}
</script>

<template>
  <main class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo-shell">
          <img class="brand-logo" src="../dataset/img/logo.png" alt="北京中关村学院与中关村人工智能研究院">
        </div>
      
      </div>

      <nav class="nav-scroll" aria-label="一级导航">
        <section v-for="group in visiblePrimaryMenuGroups" :key="group.label || 'workbench'" class="nav-group">
          <p v-if="group.label" class="nav-label">{{ group.label }}</p>
          <button
            v-for="item in group.items"
            :key="item.key"
            class="nav-item"
            :class="{ active: activePrimaryMenuKey === item.key }"
            type="button"
            @click="openPrimaryMenu(item)"
          >
            <span class="nav-icon" aria-hidden="true" v-html="item.icon"></span>
            <span class="nav-text">{{ item.label }}</span>
            <span class="nav-arrow" aria-hidden="true">›</span>
          </button>
        </section>

        <section class="nav-group role-group" aria-labelledby="role-section-title">
          <label id="role-section-title" class="nav-label role-select-label" for="sidebar-role-select">我的角色</label>
          <div class="role-select-shell">
            <select
              id="sidebar-role-select"
              class="role-select"
              :value="currentRoleKey"
              aria-label="切换当前角色"
              @change="switchRole"
            >
              <option v-for="role in visibleRoleRoutes" :key="role.key" :value="role.key">
                {{ role.name }}
              </option>
            </select>
            <span class="role-select-arrow" aria-hidden="true">›</span>
          </div>
        </section>
      </nav>

      <div v-if="currentUser" class="sidebar-user">
        <div class="avatar">{{ getAvatarLetter(currentUser.displayName) }}</div>
        <div class="user-meta">
          <strong>{{ currentUser.displayName }}</strong>
          <span>{{ currentRole?.name ?? currentUser.department }}</span>
        </div>
      </div>
    </aside>

    <section class="workspace">
      <AppTopBar class="workspace-topbar" :user="currentUser" :role-name="currentRole?.name" @logout="confirmLogout" />

      <section class="workspace-content">
        <header class="workspace-header">
          <div class="breadcrumb-shell">
            <el-button
              class="breadcrumb-back-button"
              :icon="Back"
              circle
              aria-label="返回上一级"
              @click="goBack"
            />
            <el-breadcrumb class="workspace-breadcrumb" separator="/">
              <el-breadcrumb-item
                v-for="(item, index) in breadcrumbItems"
                :key="`${item.label}-${index}`"
                :to="index < breadcrumbItems.length - 1 && item.to ? item.to : undefined"
                :class="{ 'breadcrumb-action-item': !!item.action }"
                @click="handleBreadcrumbClick(item)"
              >
                {{ item.label }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </header>

        <Transition name="content-shift" mode="out-in">
          <div :key="`${currentRoleKey}-${currentFeatureKey}-${activePrimaryMenuKey}`" class="dashboard-body">
            <section v-if="showModuleLanding" class="module-landing" aria-label="功能入口">
              <template v-if="isResearchAdminWorkbench">
                <section class="workbench-page" aria-label="PMO我的工作台">
                  <section class="workbench-card workbench-shortcut-card" aria-label="常用功能">
                    <header class="workbench-card-head">
                      <span aria-hidden="true"></span>
                      <el-button type="primary" link @click="handleWorkbenchAction('管理')">
                        管理
                      </el-button>
                    </header>

                    <el-button
                      class="workbench-carousel-arrow prev"
                      :icon="ArrowLeft"
                      circle
                      aria-label="上一组常用功能"
                      @click="switchWorkbenchShortcutPage('prev')"
                    />
                    <el-button
                      class="workbench-carousel-arrow next"
                      :icon="ArrowRight"
                      circle
                      aria-label="下一组常用功能"
                      @click="switchWorkbenchShortcutPage('next')"
                    />

                    <div class="workbench-shortcut-window">
                      <div class="workbench-shortcut-track" :style="{ transform: workbenchShortcutTransform }">
                        <div
                          v-for="(page, pageIndex) in workbenchShortcutPages"
                          :key="pageIndex"
                          class="workbench-shortcut-page"
                        >
                          <button
                            v-for="entry in page"
                            :key="entry.title"
                            class="workbench-shortcut-item"
                            type="button"
                            @click="handleWorkbenchAction(entry.action)"
                          >
                            <span class="workbench-shortcut-icon">
                              <el-icon><component :is="entry.icon" /></el-icon>
                            </span>
                            <span class="workbench-shortcut-name">{{ entry.title }}</span>
                            <span class="workbench-shortcut-note">{{ entry.desc }}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div class="workbench-carousel-dots" aria-label="常用功能分页">
                      <button
                        v-for="(_, index) in workbenchShortcutPages"
                        :key="index"
                        class="workbench-carousel-dot"
                        :class="{ active: workbenchShortcutPage === index }"
                        type="button"
                        :aria-label="`切换到第 ${index + 1} 组常用功能`"
                        @click="setWorkbenchShortcutPage(index)"
                      ></button>
                    </div>
                  </section>

                  <section class="workbench-middle-grid" aria-label="通知与待办">
                    <section class="workbench-card workbench-news-card" aria-labelledby="workbenchNewsTitle">
                      <header class="workbench-card-head">
                        <div class="workbench-tabs" role="tablist" aria-label="新闻公告类型">
                          <button
                            id="workbenchNewsTitle"
                            class="workbench-tab-button"
                            :class="{ active: workbenchNewsTab === 'notice' }"
                            type="button"
                            @click="setWorkbenchNewsTab('notice')"
                          >
                            通知公告
                            <span class="workbench-new-count">{{ workbenchNoticeNewCount }}</span>
                          </button>
                          <button
                            class="workbench-tab-button"
                            :class="{ active: workbenchNewsTab === 'news' }"
                            type="button"
                            @click="setWorkbenchNewsTab('news')"
                          >
                            科研动态
                          </button>
                        </div>
                        <el-button type="primary" link @click="handleWorkbenchAction('查看全部公告')">
                          查看全部
                        </el-button>
                      </header>

                      <div class="workbench-news-list">
                        <button
                          v-for="item in activeWorkbenchNewsRows"
                          :key="`${item.title}-${item.date}`"
                          class="workbench-news-row"
                          type="button"
                          @click="handleWorkbenchNoticeClick(item)"
                        >
                          <span class="workbench-news-dot" :class="{ fresh: item.isNew }"></span>
                          <span class="workbench-news-title">
                            {{ item.title }}
                            <em v-if="item.isNew">NEW</em>
                          </span>
                          <span class="workbench-news-category">【{{ item.category }}】</span>
                          <time>{{ item.date }}</time>
                        </button>
                      </div>
                    </section>

                    <section class="workbench-card workbench-todo-card" aria-labelledby="workbenchTodoTitle">
                      <header class="workbench-card-head">
                        <div>
                          <h2 id="workbenchTodoTitle">我的待办</h2>
                          <p>当前共有 {{ workbenchTodoTotal }} 项待处理事项</p>
                        </div>
                        <div class="workbench-todo-tools">
                          <span>截止时间正序</span>
                          <el-tooltip content="1天内为紧急，3天内为较急，7天内为普通" placement="top">
                            <button class="workbench-todo-rule" type="button">
                              <span>?</span>
                              紧急程度规则
                            </button>
                          </el-tooltip>
                        </div>
                      </header>

                      <div class="workbench-todo-list">
                        <button
                          v-for="item in workbenchTodoItems"
                          :key="item.taskId"
                          class="workbench-todo-item"
                          type="button"
                          @click="handleWorkbenchTodoClick(item)"
                        >
                          <el-tooltip
                            :content="item.urgencyReason"
                            placement="top"
                            popper-class="workbench-todo-ai-tooltip"
                          >
                            <el-tag
                              class="workbench-todo-priority"
                              :class="`priority-${item.urgency}`"
                              effect="light"
                              round
                            >
                              {{ item.urgencyLabel }}
                            </el-tag>
                          </el-tooltip>
                          <span class="workbench-todo-copy" :title="item.title">
                            {{ item.title }}
                          </span>
                          <span class="workbench-todo-meta">{{ item.module }} · {{ item.taskType }}</span>
                          <time class="workbench-todo-deadline">
                            {{ item.hasDeadline ? `截止时间 ${item.deadline}` : '无截止时间' }}
                          </time>
                          <span class="workbench-todo-entry">去处理</span>
                        </button>
                      </div>
                    </section>
                  </section>

                  <section class="workbench-card workbench-board-card" aria-labelledby="workbenchBoardTitle">
                    <header class="workbench-card-head">
                      <div>
                        <h2 id="workbenchBoardTitle">科研项目运行看板</h2>
                        <p>查看项目规模、申报趋势与当前状态分布</p>
                      </div>
                      <el-select
                        v-model="workbenchBoardYear"
                        class="workbench-year-select"
                        aria-label="年度选择"
                        @change="handleWorkbenchYearChange"
                      >
                        <el-option
                          v-for="year in workbenchBoardYearOptions"
                          :key="year"
                          :label="`${year} 年`"
                          :value="year"
                        />
                      </el-select>
                    </header>

                    <div class="workbench-dashboard-grid">
                      <section class="workbench-trend-panel" aria-label="季度申报趋势">
                        <div class="workbench-metric-row">
                          <article
                            v-for="metric in currentWorkbenchBoard.metrics"
                            :key="metric.label"
                            class="workbench-metric-item"
                          >
                            <span>{{ metric.label }}</span>
                            <strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong>
                            <em v-if="metric.delta">{{ metric.delta }}</em>
                          </article>
                        </div>

                        <div class="workbench-chart-heading">
                          <h3>
                            <el-icon><TrendCharts /></el-icon>
                            季度申报趋势
                          </h3>
                          <span>单位：项</span>
                        </div>

                        <svg
                          class="workbench-trend-svg"
                          :viewBox="`0 0 ${workbenchTrendChart.width} ${workbenchTrendChart.height}`"
                          role="img"
                          aria-label="季度申报趋势折线图"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="workbenchTrendArea" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stop-color="#3478e5" stop-opacity="0.16" />
                              <stop offset="100%" stop-color="#3478e5" stop-opacity="0.02" />
                            </linearGradient>
                          </defs>
                          <g
                            v-for="guide in workbenchTrendChart.guideLines"
                            :key="guide.y"
                            class="workbench-guide-line"
                          >
                            <line x1="42" :x2="workbenchTrendChart.chartEndX" :y1="guide.y" :y2="guide.y" />
                            <text x="0" :y="guide.y + 4">{{ guide.value }}</text>
                          </g>
                          <polygon :points="workbenchTrendChart.areaPoints" fill="url(#workbenchTrendArea)" />
                          <polyline :points="workbenchTrendChart.linePoints" />
                          <g v-for="point in workbenchTrendChart.points" :key="point.label" class="workbench-trend-point">
                            <circle :cx="point.x" :cy="point.y" r="4" />
                            <text class="value" :x="point.x" :y="point.y - 10">{{ point.value }}</text>
                            <text class="label" :x="point.x" y="165">{{ point.label }}</text>
                          </g>
                        </svg>
                      </section>

                      <section class="workbench-status-panel" aria-label="项目状态分布">
                        <div class="workbench-status-heading">
                          <h3>
                            <el-icon><PieChart /></el-icon>
                            项目状态分布
                          </h3>
                          <span>数据实时更新</span>
                        </div>

                        <div class="workbench-status-body">
                          <div class="workbench-donut-wrap">
                            <svg class="workbench-donut-svg" viewBox="0 0 120 120" aria-hidden="true">
                              <circle class="workbench-donut-bg" cx="60" cy="60" r="46" />
                              <circle
                                v-for="item in workbenchDonutSegments"
                                :key="item.name"
                                class="workbench-donut-segment"
                                cx="60"
                                cy="60"
                                r="46"
                                :stroke="item.color"
                                :stroke-dasharray="item.dashArray"
                                :stroke-dashoffset="item.dashOffset"
                              />
                            </svg>
                            <div class="workbench-donut-center">
                              <strong>{{ workbenchDonutTotal }}</strong>
                              <span>项目总数</span>
                            </div>
                          </div>

                          <div class="workbench-status-list">
                            <div v-for="item in currentWorkbenchBoard.status" :key="item.name" class="workbench-status-row">
                              <span>
                                <i :style="{ backgroundColor: item.color }"></i>
                                {{ item.name }}
                              </span>
                              <strong>{{ item.value }} 项</strong>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </section>
                </section>
              </template>

              <template v-else-if="isResearchAdminApplicationLanding">
                <section
                  v-if="!isAdminApplicationProjectPage && !isAdminApplicationReviewPage && !isAdminDeclarationReviewBatchPage"
                  class="module-entry-card-grid"
                  aria-label="项目申报与立项二级功能入口"
                >
                  <section class="card-grid" aria-label="二级功能入口">
                    <RouterLink
                      v-for="entry in activeLandingCards.filter((item) => item.path)"
                      :key="entry.title"
                      class="function-card"
                      :style="{ '--accent': entry.accent, '--soft': entry.soft }"
                      :to="entry.path ?? currentRole?.dashboardPath ?? '/login'"
                    >
                      <span class="card-top">
                        <span class="function-icon">
                          <img
                            v-if="entry.iconUrl"
                            class="function-icon-image"
                            :src="entry.iconUrl"
                            :alt="`${entry.title}图标`"
                          >
                          <span v-else>{{ entry.iconText }}</span>
                        </span>
                      </span>
                      <span class="card-title">{{ entry.title }}<span v-if="entry.hint" class="field-doc-hint" :title="entry.hint">ℹ</span></span>
                      <span class="enter">进入{{ entry.title }} <span aria-hidden="true">›</span></span>
                    </RouterLink>

                    <button
                      v-for="entry in activeLandingCards.filter((item) => !item.path)"
                      :key="entry.title"
                      class="function-card"
                      :style="{ '--accent': entry.accent, '--soft': entry.soft }"
                      type="button"
                      @click="handlePendingEntry(entry)"
                    >
                      <span class="card-top">
                        <span class="function-icon">
                          <img
                            v-if="entry.iconUrl"
                            class="function-icon-image"
                            :src="entry.iconUrl"
                            :alt="`${entry.title}图标`"
                          >
                          <span v-else>{{ entry.iconText }}</span>
                        </span>
                      </span>
                      <span class="card-title">{{ entry.title }}<span v-if="entry.hint" class="field-doc-hint" :title="entry.hint">ℹ</span></span>
                      <span class="enter">进入{{ entry.title }} <span aria-hidden="true">›</span></span>
                    </button>
                  </section>
                </section>

                <InitiationDeclarationReview
                  v-else-if="isAdminApplicationReviewPage"
                  :initial-batch-id="activeInitiationBatch?.id"
                  @flow-step="handleDeclarationFlowStep"
                />

                <section
                  v-if="isAdminApplicationProjectPage && !activeInitiationBatch && !isInitiationLaunchPage && !adminInitiationFlowBatchCode"
                  class="module-hero admin-application-hero"
                >
                  <div class="hero-copy">
                    <h1>项目申报与立项</h1>
                  </div>

                  <div class="admin-batch-panel" aria-label="项目申报与立项操作">
                    <el-button type="primary" :icon="Plus" @click="handleLaunchInitiation">发起立项</el-button>
                    <el-button @click="handleInitiationToolClick('import')">外部项目导入</el-button>
                  </div>
                </section>

                <template v-if="(isAdminApplicationProjectPage || isAdminDeclarationReviewBatchPage) && !activeInitiationBatch && !isInitiationLaunchPage && !adminInitiationFlowBatchCode">
                  <section class="initiation-batch-filter-panel" aria-label="立项批次筛选">
                    <div class="batch-filter-row">
                      <div class="batch-filter-controls">
                        <el-input
                          v-model="batchKeywordInput"
                          class="batch-keyword-input"
                          clearable
                          :prefix-icon="Search"
                          placeholder="输入批次名称或批次编号"
                          @keyup.enter="handleBatchQuery"
                        />
                        <el-select v-model="batchYearInput" class="batch-filter-select" aria-label="年份筛选">
                          <el-option label="全部年份" value="all" />
                          <el-option
                            v-for="year in initiationYearOptions"
                            :key="year"
                            :label="`${year} 年`"
                            :value="year"
                          />
                        </el-select>
                        <el-select v-model="batchQuarterInput" class="batch-filter-select" aria-label="季度筛选">
                          <el-option label="全部季度" value="all" />
                          <el-option
                            v-for="quarter in initiationQuarterOptions"
                            :key="quarter"
                            :label="`第 ${quarter} 季度`"
                            :value="quarter"
                          />
                        </el-select>
                        <el-button type="primary" @click="handleBatchQuery">查询</el-button>
                        <el-button @click="handleBatchReset">重置</el-button>
                      </div>

                      <div class="batch-status-toggle" aria-label="批次状态切换">
                        <el-button
                          :type="batchStatusView === 'active' ? 'primary' : 'default'"
                          @click="setBatchStatusView('active')"
                        >
                          正在申报中
                        </el-button>
                        <el-button
                          :type="batchStatusView === 'history' ? 'primary' : 'default'"
                          @click="setBatchStatusView('history')"
                        >
                          历史记录
                        </el-button>
                      </div>
                    </div>
                  </section>

                  <section class="initiation-batch-grid" aria-label="立项批次">
                    <article
                      v-for="batch in pagedInitiationBatches"
                      :key="batch.id"
                      class="initiation-batch-card"
                      :class="getBatchCardClass(batch)"
                    >
                      <div class="batch-quarter-badge">
                        <strong>{{ batch.year }}</strong>
                        <span>第 {{ batch.quarter }} 季度</span>
                      </div>

                      <div class="batch-main-block">
                        <header class="batch-card-header">
                          <div class="batch-title-block">
                            <el-tooltip :content="batch.batchName" placement="top" :show-after="300">
                              <h2>{{ batch.batchName }}</h2>
                            </el-tooltip>
                            <p>批次编号：{{ batch.batchCode }}</p>
                          </div>
                        </header>

                        <div class="batch-progress-row" :class="{ finished: batch.status === '已结束' }">
                          <span>立项进度</span>
                          <div
                            class="batch-progress-track"
                            :class="{ finished: batch.status === '已结束' }"
                            :aria-label="`立项进度 ${getBatchProgressValue(batch)}%`"
                          >
                            <span class="batch-progress-fill" :style="getBatchProgressStyle(batch)"></span>
                          </div>
                          <strong>{{ getBatchProgressValue(batch) }}%</strong>
                        </div>
                      </div>

                      <div class="batch-row-meta">
                        <div>
                          <span>申报周期</span>
                          <strong>{{ batch.applyPeriod }}</strong>
                        </div>
                        <div>
                          <span>已提交项目</span>
                          <strong>{{ batch.submittedProjectCount }}</strong>
                        </div>
                        <div>
                          <span>已立项项目</span>
                          <strong>{{ batch.establishedCount }}</strong>
                        </div>
                      </div>

                      <div class="batch-row-status">
                        <el-tag
                          v-if="batch.flowStage && batch.status !== '已结束'"
                          size="small"
                          effect="plain"
                          type="warning"
                        >
                          {{ getBatchFlowStageLabel(batch) }}
                        </el-tag>
                        <span v-else :class="getBatchStatusClass(batch)">{{ batch.status }}</span>
                      </div>

                      <footer class="batch-card-footer">
                        <el-button
                          class="batch-detail-button"
                          :type="batch.status === '申报中' ? 'primary' : 'default'"
                          @click="
                            isAdminDeclarationReviewBatchPage
                              ? openDeclarationReviewBatch(batch)
                              : enterAdminInitiationFlow(batch)
                          "
                        >
                          查看详情
                          <span aria-hidden="true">›</span>
                        </el-button>
                      </footer>
                    </article>

                    <el-empty
                      v-if="pagedInitiationBatches.length === 0"
                      class="batch-empty"
                      :description="batchEmptyDescription"
                    />
                  </section>

                  <footer class="batch-pagination">
                    <span>
                      共 {{ filteredInitiationBatches.length }}
                      个{{ batchStatusView === 'active' ? '正在申报批次' : '历史批次' }}
                    </span>
                    <el-pagination
                      v-model:current-page="batchPage"
                      v-model:page-size="batchPageSize"
                      background
                      layout="prev, pager, next"
                      :total="filteredInitiationBatches.length"
                    />
                  </footer>
                </template>

                <template v-else-if="isAdminApplicationProjectPage && adminInitiationFlowBatchCode && !isInitiationLaunchPage && !activeInitiationBatch">
                  <header class="office-batch-context">
                    <div class="office-batch-context-main">
                      <h2>{{ adminInitiationFlowBatch?.batchName }}</h2>
                      <p>
                        批次编号：{{ adminInitiationFlowBatch?.batchCode }} ·
                        {{ adminInitiationFlowBatch?.project_category }} · 申报周期
                        {{ adminInitiationFlowBatch?.applyPeriod }}
                      </p>
                    </div>
                    <div class="admin-initiation-flow-actions">
                      <el-button size="small" @click="handleAdminFlowWorkflowSettings">审批流设置</el-button>
                      <el-tag v-if="adminInitiationFlowBatch?.flowStage" size="small" effect="plain" type="warning">
                        {{ getBatchFlowStageLabel(adminInitiationFlowBatch) }}
                      </el-tag>
                      <el-tag
                        :type="adminInitiationFlowBatch?.status === '申报中' ? 'success' : 'info'"
                        effect="light"
                      >
                        {{ adminInitiationFlowBatch?.status }}
                      </el-tag>
                    </div>
                  </header>

                  <nav
                    class="approval-flow-steps"
                    aria-label="项目立项流转线"
                    title="原型演示：流转线各环节均可点击查看对应界面"
                  >
                    <button
                      v-for="(step, index) in officeApprovalFlowSteps"
                      :key="step"
                      type="button"
                      class="approval-flow-step approval-flow-step--clickable"
                      :class="{
                        active: index === adminInitiationFlowStageIndex,
                        done: index < adminInitiationFlowBatchStageIndex || (adminInitiationFlowBatchStageIndex === -1 && index < adminInitiationFlowStageIndex),
                      }"
                      @click="adminInitiationFlowStage = adminInitiationFlowStageOrder[index]"
                    >
                      <span class="approval-flow-index">{{ index + 1 }}</span>
                      <span class="approval-flow-label">{{ step }}</span>
                    </button>
                  </nav>

                  <template v-if="adminInitiationFlowStage === 'guide'">
                    <section class="office-guide-form-wrap" aria-label="立项指南发布">
                      <section class="launch-initiation-page" aria-label="立项指南发布">
                        <header class="launch-page-titlebar">
                          <div>
                            <h1>立项指南发布</h1>
                          </div>
                          <span class="launch-status-pill">已发布</span>
                        </header>

                        <section class="launch-form-card">
                          <section class="launch-form-section">
                            <div class="launch-section-title">
                              <span class="launch-section-index">01</span>
                              <div>
                                <h2>立项指南</h2>
                                <p>展示指南发布批次的全部字段；指南已发布并同步至项目负责人端，如需调整请通过「发起立项」重新提交。</p>
                              </div>
                            </div>

                            <el-descriptions class="admin-guide-field-grid" :column="2" border>
                              <el-descriptions-item label="批次名称" :span="2">
                                {{ adminInitiationFlowBatch?.batch_name ?? '—' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="批次编号">
                                {{ adminInitiationFlowBatch?.batch_code ?? '—' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="项目类别">
                                {{ adminInitiationFlowBatch?.project_category ?? '—' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="申报开始时间">
                                {{ adminInitiationFlowBatch?.batch_apply_start ?? '—' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="申报截止时间">
                                {{ adminInitiationFlowBatch?.batch_apply_deadline ?? '—' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="立项名额">
                                {{ adminInitiationFlowBatch?.batch_limit_count
                                  ? `${adminInitiationFlowBatch?.batch_limit_count} 项`
                                  : '不限' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="批次状态">
                                {{ adminInitiationFlowBatch?.status ?? '—' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="批次介绍" :span="2">
                                {{ adminInitiationFlowBatch?.batch_introduction ?? '—' }}
                              </el-descriptions-item>
                              <el-descriptions-item label="内部备注" :span="2">
                                {{ adminInitiationFlowBatch?.remark ?? '—' }}
                              </el-descriptions-item>
                            </el-descriptions>

                            <div class="launch-form-grid">
                              <div class="launch-guide-file office-guide-file-view">
                                <span class="launch-guide-file-icon">
                                  <el-icon><Document /></el-icon>
                                </span>
                                <span class="launch-guide-file-name">
                                  {{ adminInitiationFlowBatch?.batch_guide_file?.name ?? '立项指南.pdf' }}
                                </span>
                                <span class="office-guide-file-meta">
                                  PMO 上传 · {{ adminInitiationFlowBatch?.batch_guide_file?.size ?? '—' }}
                                </span>
                                <el-button type="primary" link @click.stop="previewAdminFlowGuideFile">
                                  预览
                                </el-button>
                              </div>
                            </div>

                            <div class="admin-initiation-guide-actions">
                              <el-button @click="downloadAdminFlowGuideFile">下载指南文件</el-button>
                            </div>
                          </section>
                        </section>
                      </section>
                    </section>
                  </template>

                  <template v-else-if="adminInitiationFlowStage === 'formal'">
                    <section class="office-guide-form-wrap" aria-label="形式审查">
                      <InitiationDeclarationReview
                        hide-flow-strip
                        :initial-batch-id="adminInitiationFlowBatch?.id"
                      />
                    </section>
                  </template>

                  <!-- AN-MWUG2PQ5：PMO 初审阶段展示三个学部各项目评审结果 -->
                  <template v-else-if="adminInitiationFlowStage === 'final'">
                    <section class="office-guide-form-wrap pmo-final-stage-wrap" aria-label="初审阶段">
                      <header class="pmo-stage-head">
                        <div>
                          <h2>学部初审结果汇总</h2>
                          <p>三个学部对本批次申报项目的初审评审结果（{{ adminInitiationFlowBatch?.batchName ?? '当前批次' }}）</p>
                        </div>
                        <div class="pmo-stage-head-tags">
                          <el-tag type="info" effect="plain">申报 {{ pmoFinalDeclaredTotal }} 项</el-tag>
                          <el-tag type="success" effect="plain">学部推荐 {{ pmoFinalRecommendedTotal }} 项</el-tag>
                          <el-tag v-if="pmoRecheckExcludedTotal > 0" type="danger" effect="plain">复议剔除 {{ pmoRecheckExcludedTotal }} 项</el-tag>
                          <el-button type="primary" size="small" title="初审阶段会有一个三大学部复议的工作：各学部提交推荐立项的项目后，由管理办组织线下复议会议剔除部分成果。剔除动作由 PMO 录入后各学部审批确认。" @click="openPmoRecheckDialog">登记学部复议结果</el-button>
                        </div>
                      </header>
                      <el-tabs v-model="pmoFinalActiveAcademy" class="pmo-final-faculty-tabs">
                        <el-tab-pane
                          v-for="faculty in pmoFinalFacultySummaries"
                          :key="faculty.academy"
                          :name="faculty.academy"
                        >
                          <template #label>
                            <span class="pmo-final-faculty-tab-label">
                              {{ faculty.academy }}
                              <span class="pmo-final-faculty-tab-count">{{ faculty.recommendedCount }}/{{ faculty.rows.length }}</span>
                            </span>
                          </template>
                          <div class="pmo-final-faculty-meta">
                            <span>申报 {{ faculty.declaredCount }} 项</span>
                            <span>拟推荐复审 {{ faculty.recommendedCount }} 项</span>
                            <span>平均分 {{ faculty.averageScore }}</span>
                          </div>
                          <el-table
                            :data="faculty.rows"
                            class="pmo-final-faculty-table"
                            border
                            size="small"
                          >
                            <el-table-column prop="seq" label="推荐次序" width="78" align="center" />
                            <el-table-column prop="projectName" label="项目名称" min-width="210" show-overflow-tooltip />
                            <el-table-column prop="leader" label="项目负责人" width="92" align="center" />
                            <el-table-column prop="subDirection" label="所属子方向" width="110" align="center" />
                            <el-table-column label="评分结果" width="128" align="center">
                              <template #default="{ row }">
                                <div class="pmo-final-score-cell">
                                  <span class="pmo-final-score">{{ row.score }}</span>
                                  <span class="pmo-final-zscore">Z {{ row.zScore }}</span>
                                </div>
                              </template>
                            </el-table-column>
                            <el-table-column label="战略相关标注" width="104" align="center">
                              <template #default="{ row }">
                                <el-tag
                                  v-if="row.strategicStar"
                                  type="warning"
                                  size="small"
                                  effect="light"
                                >
                                  ★ 战略相关
                                </el-tag>
                                <span v-else class="pmo-final-muted">——</span>
                              </template>
                            </el-table-column>
                            <el-table-column prop="reviewComment" label="具体评审意见" min-width="220" show-overflow-tooltip />
                            <el-table-column label="是否推荐复审" width="108" align="center">
                              <template #default="{ row }">
                                <el-tag :type="getFinalRecommendTag(row).type" size="small">
                                  {{ getFinalRecommendTag(row).text }}
                                </el-tag>
                              </template>
                            </el-table-column>
                          </el-table>
                        </el-tab-pane>
                      </el-tabs>

                      <el-dialog
                        v-model="pmoRecheckDialogVisible"
                        append-to-body
                        destroy-on-close
                        class="pmo-recheck-dialog"
                        title="登记学部复议结果"
                        width="560px"
                      >
                        <div class="pmo-recheck-dialog-tip">
                          学部复议为线下合议会，会后由 PMO 在此登记结论：勾选合议决定从推荐名单中剔除的项目，其余项目进入复审。
                        </div>
                        <div class="pmo-recheck-register-list">
                          <section
                            v-for="group in pmoRecheckRegisterOptions"
                            :key="group.academy"
                            class="pmo-recheck-register-group"
                          >
                            <h4>{{ group.academy }}（推荐 {{ group.rows.length }} 项）</h4>
                            <el-checkbox-group v-model="pmoRecheckExcludedKeys">
                              <el-checkbox
                                v-for="row in group.rows"
                                :key="getPmoFinalRowKey(group.academy, row.projectName)"
                                :value="getPmoFinalRowKey(group.academy, row.projectName)"
                              >
                                {{ row.projectName }}（{{ row.leader }} · {{ row.score }} 分）
                              </el-checkbox>
                            </el-checkbox-group>
                          </section>
                        </div>
                        <el-input
                          v-model="pmoRecheckDialogNote"
                          type="textarea"
                          :rows="2"
                          placeholder="复议备注（可选）：合议会时间、地点、参会学部负责人等"
                        />
                        <template #footer>
                          <el-button @click="pmoRecheckDialogVisible = false">取消</el-button>
                          <el-button type="primary" @click="submitPmoRecheckRegistration">确认登记</el-button>
                        </template>
                      </el-dialog>
                    </section>
                  </template>

                  <!-- AN-MWUG3BER：PMO 复审阶段基于初审通过项目指派复审评委并监控复审过程 -->
                  <template v-else-if="adminInitiationFlowStage === 'recheck'">
                    <section class="office-guide-form-wrap pmo-recheck-stage-wrap" aria-label="复审阶段">
                      <header class="pmo-stage-head">
                        <div>
                          <h2>复审组织与过程监控</h2>
                          <p>学部推荐 {{ pmoFinalRecommendedTotal }} 个项目，经学部复议剔除 {{ pmoRecheckExcludedTotal }} 个后，{{ pmoRecheckAdmittedTotal }} 个项目进入复审——在此指派复审评委并跟踪评分进度</p>
                        </div>
                        <div class="pmo-stage-head-tags">
                          <el-tag type="success" effect="plain">已完成 {{ pmoRecheckMonitorDoneCount }}</el-tag>
                          <el-tag type="warning" effect="plain">进行中 {{ pmoRecheckMonitorOngoingCount }}</el-tag>
                          <el-tag type="info" effect="plain">待启动 {{ pmoRecheckMonitorPendingCount }}</el-tag>
                        </div>
                      </header>
                      <nav class="recheck-sub-steps" aria-label="复审子步骤">
                        <button
                          type="button"
                          class="recheck-sub-step"
                          :class="{ active: pmoRecheckSubStep === 'assign' }"
                          @click="pmoRecheckSubStep = 'assign'"
                        >
                          <span class="recheck-sub-index">1</span>
                          <span class="recheck-sub-label">指派复审评委</span>
                        </button>
                        <button
                          type="button"
                          class="recheck-sub-step"
                          :class="{ active: pmoRecheckSubStep === 'monitor' }"
                          @click="pmoRecheckSubStep = 'monitor'"
                        >
                          <span class="recheck-sub-index">2</span>
                          <span class="recheck-sub-label">复审过程监控</span>
                        </button>
                      </nav>
                      <template v-if="pmoRecheckSubStep === 'assign'">
                        <div class="pmo-recheck-intro">
                          学部推荐 {{ pmoFinalRecommendedTotal }} 个项目，经学部复议剔除 {{ pmoRecheckExcludedTotal }} 个后，{{ pmoRecheckAdmittedTotal }} 个项目进入复审。请为项目指派复审评委（支持单项目指派与批量指派）。
                        </div>
                        <section class="subdirection-assign-page">
                          <ReviewerAssignmentPanel panel-title="指定复审评委" />
                        </section>
                      </template>
                      <template v-else>
                        <el-table
                          :data="pmoRecheckMonitorRows"
                          class="pmo-recheck-monitor-table"
                          border
                          size="small"
                        >
                          <el-table-column prop="projectName" label="项目名称" min-width="210" show-overflow-tooltip />
                          <el-table-column prop="academy" label="所属学部" width="150" show-overflow-tooltip />
                          <el-table-column prop="leader" label="项目负责人" width="92" align="center" />
                          <el-table-column prop="finalScore" label="初审得分" width="88" align="center" />
                          <el-table-column label="复审评委" min-width="150">
                            <template #default="{ row }">
                              <div class="pmo-recheck-reviewer-tags">
                                <el-tag
                                  v-for="reviewer in row.recheckReviewers"
                                  :key="reviewer"
                                  size="small"
                                  effect="plain"
                                >
                                  {{ reviewer }}
                                </el-tag>
                              </div>
                            </template>
                          </el-table-column>
                          <el-table-column label="评分进度" width="150">
                            <template #default="{ row }">
                              <el-progress
                                :percentage="Math.round((row.submittedCount / row.totalCount) * 100)"
                                :status="row.submittedCount === row.totalCount ? 'success' : undefined"
                              />
                              <span class="pmo-recheck-progress-text">{{ row.submittedCount }}/{{ row.totalCount }} 已提交</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="状态" width="88" align="center">
                            <template #default="{ row }">
                              <el-tag :type="getRecheckMonitorStatusType(row.status)" size="small">
                                {{ row.status }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="latestUpdate" label="最近更新" width="140" align="center" />
                        </el-table>
                      </template>
                    </section>
                  </template>

                  <!-- AN-MWVINCCJ：PMO 立项入库阶段 — 补充复审入选项目清单 -->
                  <template v-else-if="adminInitiationFlowStage === 'archive'">
                    <section class="office-guide-form-wrap" aria-label="立项入库">
                      <header class="pmo-stage-head">
                        <div>
                          <h2>复审入选项目清单</h2>
                          <p>
                            复审通过 {{ officeArchiveRows.length }} 个项目入选立项名单，管理办负责人审定通过后项目正式立项入库——在此跟踪审定与入库进度
                          </p>
                        </div>
                        <div class="pmo-stage-head-tags">
                          <el-tag type="success" effect="plain">复审通过 {{ officeArchiveRows.length }}</el-tag>
                          <el-tag type="warning" effect="plain">待审定 {{ officeArchiveRows.length }}</el-tag>
                        </div>
                      </header>

                      <section class="formal-report-section">
                        <h3>复审入选项目清单 {{ officeArchiveRows.length }} 项・待管理办审定</h3>
                        <el-table :data="officeArchiveRows" border size="small">
                          <el-table-column type="index" label="序号" width="60" align="center" />
                          <el-table-column label="项目名称" min-width="240">
                            <template #default="{ row }">
                              <el-button
                                link
                                type="primary"
                                class="final-project-link"
                                @click="openOfficeArchiveScoreDetail(row)"
                              >
                                {{ row.projectName }}
                              </el-button>
                            </template>
                          </el-table-column>
                          <el-table-column prop="leader" label="项目负责人" width="100" align="center" />
                          <el-table-column prop="subDirection" label="所属子方向" width="150" show-overflow-tooltip />
                          <el-table-column prop="score" label="评审得分" width="90" align="center" />
                          <el-table-column label="战略相关" width="96" align="center">
                            <template #default="{ row }">
                              <span class="strategic-star" :class="{ 'is-active': row.strategic }">战略相关</span>
                            </template>
                          </el-table-column>
                          <el-table-column prop="batchCode" label="所属批次" width="130" align="center" />
                          <el-table-column label="入库状态" width="100" align="center" fixed="right">
                            <template #default>
                              <el-tag type="warning" effect="light">待审定</el-tag>
                            </template>
                          </el-table-column>
                        </el-table>
                      </section>

                      <p class="formal-report-note">
                        说明：清单为学部复审通过的项目；点击项目名称可查看评委打分明细。审定动作在管理办负责人「立项入库」环节完成。
                      </p>
                    </section>
                  </template>

                  <el-dialog
                    v-model="leaderGuidePreviewVisible"
                    append-to-body
                    class="launch-guide-preview-dialog"
                    destroy-on-close
                    :title="leaderGuidePreviewTitle || '立项指南 PDF 预览'"
                    width="72vw"
                    top="6vh"
                    @closed="revokeLeaderGuidePreviewUrl"
                  >
                    <div class="launch-guide-preview-body">
                      <iframe
                        v-if="leaderGuidePreviewUrl"
                        class="launch-guide-preview-frame"
                        :src="leaderGuidePreviewUrl"
                        title="立项指南 PDF 预览"
                      ></iframe>
                      <el-empty v-else description="暂无可预览的指南文件" />
                    </div>

                    <template #footer>
                      <el-button @click="closeLeaderGuidePreview">关闭</el-button>
                    </template>
                  </el-dialog>

                  <!-- AN-MWVINCCJ：PMO 流转线共用的项目评审详情弹窗（复审入选清单项目名点击） -->
                  <FinalScoreDetailDialog v-model="finalScoreDetailVisible" :target="finalScoreDetailTarget" />
                </template>

                <template v-else-if="isAdminApplicationProjectPage && isInitiationLaunchPage">
                  <section class="launch-initiation-page" aria-label="发起立项表单">
                    <header class="launch-page-titlebar">
                      <div>
                        <h1>发起立项</h1>
                      </div>
                      <span class="launch-status-pill">未发布</span>
                    </header>

                    <div v-if="officeLaunchFeedback.rejected" class="launch-reject-banner" role="alert">
                      <strong>管理办负责人已驳回本次立项发起</strong>
                      <span>驳回理由：{{ officeLaunchFeedback.reason }}（{{ officeLaunchFeedback.at }}）</span>
                      <em>请按驳回理由修改后，重新点击「确认发起」</em>
                    </div>

                    <el-form
                      ref="launchFormRef"
                      class="launch-form-card"
                      :model="launchForm"
                      :rules="launchFormRules"
                      label-position="top"
                      status-icon
                    >
                      <section class="launch-form-section">
                        <div class="launch-section-title">
                          <span class="launch-section-index">01</span>
                          <div>
                            <h2>批次基本信息</h2>
                          </div>
                        </div>

                        <div class="launch-form-grid">
                          <el-form-item label="项目归属组织" prop="owner_organizations">
                            <el-select
                              v-model="launchForm.owner_organizations"
                              multiple
                              collapse-tags
                              collapse-tags-tooltip
                              placeholder="请按组织架构选择归属组织"
                            >
                              <el-option
                                v-for="org in launchOwnerOrganizationOptions"
                                :key="org"
                                :label="org"
                                :value="org"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item prop="project_category">
                            <template #label>
                              <span class="field-doc-label">科研项目类别
                                <span class="field-doc-hint" title="不同科研类别对应不同的审批流程、申请表单和预算形式">ℹ</span>
                              </span>
                            </template>
                            <el-select v-model="launchForm.project_category" placeholder="请选择科研项目类别">
                              <el-option
                                v-for="category in launchProjectCategoryOptions"
                                :key="category"
                                :label="category"
                                :value="category"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="批次编码" prop="batch_code">
                            <el-input
                              v-model.trim="launchForm.batch_code"
                              maxlength="40"
                              disabled
                              placeholder="系统自动生成，全局唯一"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="批次名称" prop="batch_name">
                            <el-input
                              v-model.trim="launchForm.batch_name"
                              maxlength="50"
                              show-word-limit
                              placeholder="请输入批次名称（≤50字）"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="项目经费来源" prop="funding_source">
                            <el-select v-model="launchForm.funding_source" placeholder="请选择项目经费来源">
                              <el-option
                                v-for="source in launchFundingSourceOptions"
                                :key="source"
                                :label="source"
                                :value="source"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="项目预算方式" prop="budget_mode">
                            <div class="launch-budget-mode-field">
                              <el-select v-model="launchForm.budget_mode" placeholder="请选择项目预算方式">
                                <el-option
                                  v-for="mode in launchBudgetModeOptions"
                                  :key="mode"
                                  :label="mode"
                                  :value="mode"
                                />
                              </el-select>
                              <el-tooltip content="自定义配置预算模板，申请人按该批次指定模板填报" placement="top">
                                <el-button class="launch-budget-config-btn" @click="handleConfigureBudgetTemplate">
                                  配置模板
                                </el-button>
                              </el-tooltip>
                            </div>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="绑定流程模板" prop="workflow_template">
                            <div class="launch-budget-mode-field">
                              <el-select v-model="launchForm.workflow_template" placeholder="请选择已发布的流程模板">
                                <el-option
                                  v-for="tpl in launchWorkflowTemplateOptions"
                                  :key="tpl"
                                  :label="tpl"
                                  :value="tpl"
                                />
                              </el-select>
                              <el-tooltip content="自定义配置流程模板，该批次申报按此流程走审批" placement="top">
                                <el-button class="launch-budget-config-btn" @click="handleConfigureWorkflowTemplate">
                                  配置模板
                                </el-button>
                              </el-tooltip>
                            </div>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="绑定申报表单模板" prop="form_template">
                            <div class="launch-budget-mode-field">
                              <el-select v-model="launchForm.form_template" placeholder="请选择已发布的表单模板">
                                <el-option
                                  v-for="tpl in launchFormTemplateOptions"
                                  :key="tpl"
                                  :label="tpl"
                                  :value="tpl"
                                />
                              </el-select>
                              <el-tooltip content="自定义配置申报表单，申请人按该批次指定表单填报" placement="top">
                                <el-button class="launch-budget-config-btn" @click="handleConfigureFormTemplate">
                                  配置表单
                                </el-button>
                              </el-tooltip>
                            </div>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="申报项目限制" prop="declaration_limit">
                            <el-select v-model="launchForm.declaration_limit" placeholder="请选择是否限制申报项目">
                              <el-option
                                v-for="option in launchDeclarationLimitOptions"
                                :key="option"
                                :label="option"
                                :value="option"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="发起人" prop="launch_owner">
                            <el-input v-model="launchForm.launch_owner" disabled placeholder="当前操作人（PMO）" />
                          </el-form-item>
                        </div>

                        <el-form-item
                          class="launch-full-form-item"
                          label="项目批次说明"
                          prop="batch_introduction"
                        >
                          <div class="launch-richtext-shell">
                            <div class="launch-richtext-toolbar" role="toolbar" aria-label="富文本工具栏">
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="加粗"><strong>B</strong></button>
                                <button type="button" class="launch-richtext-btn" title="斜体"><em>I</em></button>
                                <button type="button" class="launch-richtext-btn" title="下划线"><u>U</u></button>
                                <button type="button" class="launch-richtext-btn" title="删除线"><s>S</s></button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="无序列表">• 列表</button>
                                <button type="button" class="launch-richtext-btn" title="有序列表">1. 列表</button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="左对齐">⯇</button>
                                <button type="button" class="launch-richtext-btn" title="居中">≡</button>
                                <button type="button" class="launch-richtext-btn" title="右对齐">⯈</button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="插入链接">🔗</button>
                                <button type="button" class="launch-richtext-btn" title="插入表格">⊞</button>
                                <button type="button" class="launch-richtext-btn" title="插入图片">🖼</button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="字体颜色">A</button>
                                <button type="button" class="launch-richtext-btn" title="撤销">↶</button>
                                <button type="button" class="launch-richtext-btn" title="重做">↷</button>
                              </span>
                              <span class="launch-richtext-count">2000 字以内</span>
                            </div>
                            <div
                              class="launch-richtext-editor"
                              contenteditable="true"
                              data-placeholder="请输入本批次的申报说明、重点方向或注意事项"
                            ></div>
                          </div>
                        </el-form-item>
                      </section>

                      <div class="launch-form-divider"></div>

                      <section class="launch-form-section">
                        <div class="launch-section-title">
                          <span class="launch-section-index success">02</span>
                          <div>
                            <h2>申报时间</h2>
                          </div>
                        </div>

                        <div class="launch-form-grid">
                          <el-form-item class="launch-inline-form-item" label="申报开始时间" prop="batch_apply_start">
                            <el-date-picker
                              v-model="launchForm.batch_apply_start"
                              class="launch-date-picker"
                              type="datetime"
                              format="YYYY-MM-DD HH:mm"
                              value-format="YYYY-MM-DD HH:mm"
                              placeholder="请选择申报开始时间"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item class="launch-inline-form-item core-constraint-item" prop="batch_apply_deadline">
                            <template #label>
                              <span class="form-label-with-tag">
                                <span>申报截止时间</span>
                              </span>
                            </template>
                            <el-date-picker
                              v-model="launchForm.batch_apply_deadline"
                              class="launch-date-picker"
                              type="datetime"
                              format="YYYY-MM-DD HH:mm"
                              value-format="YYYY-MM-DD HH:mm"
                              placeholder="请选择申报截止时间"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>
                        </div>
                      </section>

                    <LaunchPlanGantt />

                      <div class="launch-form-divider"></div>

                      <section class="launch-form-section">
                        <div class="launch-section-title">
                          <span class="launch-section-index violet">03</span>
                          <div>
                            <h2>指南与目标群体</h2>
                          </div>
                        </div>

                        <div class="launch-form-grid">
                          <el-form-item label="立项指南" prop="batch_guide_file">
                            <div class="launch-guide-upload-shell">
                              <el-upload
                                ref="launchGuideUploadRef"
                                class="launch-guide-upload"
                                action="#"
                                drag
                                :auto-upload="false"
                                :limit="1"
                                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                :show-file-list="false"
                                :before-upload="beforeGuideUpload"
                                :on-change="handleGuideFileChange"
                              >
                                <el-icon class="launch-upload-icon"><Upload /></el-icon>
                                <div class="launch-upload-copy">
                                  <strong>点击或拖拽上传立项指南（PDF / DOCX）</strong>
                                  <span>支持 PDF 或 DOCX 文件，单个文件不超过 100MB</span>
                                </div>
                              </el-upload>

                              <div v-if="launchGuideFile" class="launch-guide-file">
                                <span class="launch-guide-file-icon">
                                  <el-icon><Document /></el-icon>
                                </span>
                                <span class="launch-guide-file-name">{{ launchGuideFile.name }}</span>
                                <el-button type="primary" link @click.stop="previewLaunchGuideFile">预览</el-button>
                                <el-button type="danger" link @click.stop="removeLaunchGuideFile">删除</el-button>
                              </div>
                            </div>
                          </el-form-item>

                          <el-form-item label="目标群体" prop="target_groups">
                            <el-select
                              v-model="launchForm.target_groups"
                              multiple
                              collapse-tags
                              collapse-tags-tooltip
                              placeholder="请选择目标组织或人员群体"
                            >
                              <el-option
                                v-for="group in launchTargetGroupOptions"
                                :key="group"
                                :label="group"
                                :value="group"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>
                        </div>
                      </section>

                      <footer class="launch-form-footer">
                        <el-button @click="handleCancelLaunchInitiation">取消</el-button>
                        <el-button @click="handleSaveLaunchDraft">保存草稿</el-button>
                        <el-button type="primary" @click="handleConfirmLaunch">确认发起</el-button>
                      </footer>
                    </el-form>

                    <el-dialog
                      v-model="launchGuidePreviewVisible"
                      append-to-body
                      class="launch-guide-preview-dialog"
                      destroy-on-close
                      title="立项指南 PDF 预览"
                      width="72vw"
                      top="6vh"
                      @closed="revokeLaunchGuidePreviewUrl"
                    >
                      <div class="launch-guide-preview-body">
                        <iframe
                          v-if="launchGuidePreviewUrl"
                          class="launch-guide-preview-frame"
                          :src="launchGuidePreviewUrl"
                          title="立项指南 PDF 预览"
                        ></iframe>
                        <el-empty v-else description="暂无可预览文件" />
                      </div>

                      <template #footer>
                        <el-button @click="closeLaunchGuidePreview">关闭</el-button>
                      </template>
                    </el-dialog>
                  </section>
                </template>

                <template v-else-if="isAdminApplicationProjectPage">
                  <section class="admin-project-panel batch-project-panel" v-loading="initiationLoading" aria-label="立项项目">
                      <header class="admin-panel-header">
                        <div>
                          <h2>立项项目</h2>
                        </div>
                        <div v-if="activeInitiationBatch" class="admin-panel-actions">
                          <el-button type="primary" :icon="Plus" @click="openBatchWorkflowSettings(activeInitiationBatch)">
                            审批流设置
                          </el-button>
                          <el-tag
                            class="workflow-config-status-tag"
                            :type="getBatchWorkflowStatusTagType(activeInitiationBatch)"
                            effect="light"
                          >
                            {{ getBatchWorkflowStatusLabel(activeInitiationBatch) }}
                          </el-tag>
                        </div>
                      </header>

                      <div class="admin-list-toolbar">
                        <div class="admin-stat-tags" aria-label="批次统计">
                          <button
                            class="admin-stat-tag"
                            :class="{ active: activeInitiationNodeFilter === '' }"
                            type="button"
                            @click="setInitiationNodeFilter('')"
                          >
                            <span>项目总数</span>
                            <strong>{{ initiationStats.total }}</strong>
                          </button>
                          <button
                            class="admin-stat-tag"
                            :class="{ active: activeInitiationNodeFilter === '待形式审查' }"
                            type="button"
                            @click="setInitiationNodeFilter('待形式审查')"
                          >
                            <span>待审查</span>
                            <strong>{{ initiationStats.pendingReview }}</strong>
                          </button>
                          <button
                            class="admin-stat-tag"
                            :class="{ active: activeInitiationNodeFilter === '评审中' }"
                            type="button"
                            @click="setInitiationNodeFilter('评审中')"
                          >
                            <span>评审中</span>
                            <strong>{{ initiationStats.reviewing }}</strong>
                          </button>
                          <button
                            class="admin-stat-tag"
                            :class="{ active: activeInitiationNodeFilter === '待确认立项' }"
                            type="button"
                            @click="setInitiationNodeFilter('待确认立项')"
                          >
                            <span>待立项</span>
                            <strong>{{ initiationStats.pendingApproval }}</strong>
                          </button>
                        </div>

                        <span class="admin-submit-tip">仅显示已提交项目</span>
                      </div>

                      <el-table class="admin-project-table" :data="pagedInitiationProjects" stripe>
                        <el-table-column label="项目名称" min-width="280">
                          <template #default="{ row }">
                            <div class="admin-project-name-cell">
                              <el-tooltip :content="row.projectName" placement="top" :show-after="300">
                                <button
                                  class="admin-project-name"
                                  type="button"
                                  @click="openInitiationProjectDetail(row)"
                                >
                                  {{ row.projectName }}
                                </button>
                              </el-tooltip>
                              <span>{{ row.projectCode }}</span>
                            </div>
                          </template>
                        </el-table-column>

                        <el-table-column label="负责人／部门" min-width="120">
                          <template #default="{ row }">
                            <div class="admin-two-line-cell">
                              <strong>{{ row.leader }}</strong>
                              <span>{{ row.department }}</span>
                            </div>
                          </template>
                        </el-table-column>

                        <el-table-column prop="submitTime" label="提交时间" min-width="130" />

                        <el-table-column label="当前节点" min-width="112">
                          <template #default="{ row }">
                            <el-tag size="small" effect="plain" :class="getInitiationNodeTagClass(row.currentNode)">
                              {{ row.currentNode }}
                            </el-tag>
                          </template>
                        </el-table-column>

                        <el-table-column label="评审进度" min-width="132">
                          <template #default="{ row }">
                            <div class="admin-review-progress-cell">
                              <el-progress
                                class="admin-review-progress"
                                :percentage="getReviewProgressPercentage(row)"
                                :show-text="false"
                                :stroke-width="6"
                              />
                              <span>{{ getReviewProgressText(row) }}</span>
                            </div>
                          </template>
                        </el-table-column>

                        <el-table-column label="操作" width="200">
                          <template #default="{ row }">
                            <div class="admin-table-actions">
                              <el-button type="primary" link @click="openInitiationProjectDetail(row)">查看详情</el-button>
                              <template v-if="row.currentNode !== '已立项'">
                                <el-button
                                  type="primary"
                                  link
                                  :disabled="!canFormalReview(row)"
                                  @click="handleProjectProcessEntry('review', row)"
                                >
                                  形式审查
                                </el-button>
                                <el-button
                                  type="primary"
                                  link
                                  :disabled="!canReviewSettings(row)"
                                  @click="handleProjectProcessEntry('settings', row)"
                                >
                                  评审设置
                                </el-button>
                              </template>
                            </div>
                          </template>
                        </el-table-column>

                        <template #empty>
                          <el-empty description="该批次暂无已提交的立项项目" />
                        </template>
                      </el-table>

                      <footer class="admin-project-pagination">
                        <span>共 {{ filteredInitiationProjects.length }} 条</span>
                        <el-pagination
                          v-model:current-page="initiationPage"
                          v-model:page-size="initiationPageSize"
                          background
                          layout="prev, pager, next"
                          :total="filteredInitiationProjects.length"
                        />
                      </footer>
                  </section>
                </template>
              </template>

              <template v-else-if="isApprovalRoleApplicationLanding">
                <template v-if="currentRoleKey === 'facultyLeader' && approvalRoleInitiationView === 'self'">
                  <section class="module-entry-card-grid" aria-label="项目申报与立项功能入口">
                    <section class="card-grid" aria-label="项目申报与立项功能入口">
                      <button
                        v-for="entry in facultyEntryCards"
                        :key="entry.key"
                        class="function-card"
                        :style="{ '--accent': entry.accent, '--soft': entry.soft }"
                        type="button"
                        @click="setApprovalRoleInitiationView(entry.key)"
                      >
                        <span class="card-top">
                          <span class="function-icon">{{ entry.iconText }}</span>
                        </span>
                        <span class="card-title">{{ entry.title }}<span v-if="entry.hint" class="field-doc-hint" :title="entry.hint">ℹ</span></span>
                        <span class="enter">进入{{ entry.title }} <span aria-hidden="true">›</span></span>
                      </button>
                    </section>
                  </section>
                </template>

                <template v-else-if="approvalRoleInitiationView === 'projectMember'">
                  <section class="module-hero leader-application-hero approval-application-hero">
                    <div class="hero-copy">
                      <div class="eyebrow">项目负责人视角</div>
                      <h1>项目申报与立项</h1>
                      <p>查看可申报的科研项目立项批次，了解申报要求并提交项目申请。</p>
                    </div>


                  </section>

                  <InitiationBatchFilter
                    :model-value="leaderBatchFilter"
                    :year-options="initiationYearOptions"
                    :category-options="leaderProjectCategoryOptions"
                    show-category
                    @update:model-value="updateLeaderBatchFilter"
                    @query="handleLeaderBatchQuery"
                    @reset="handleLeaderBatchReset"
                  />

                  <section class="leader-batch-list-panel" v-loading="leaderBatchLoading">
                    <el-alert
                      v-if="leaderBatchError"
                      class="leader-batch-error"
                      :title="leaderBatchError"
                      type="error"
                      show-icon
                      :closable="false"
                    />

                    <el-skeleton v-else-if="leaderBatchLoading" :rows="4" animated />

                    <template v-else>
                      <div class="leader-batch-list">
                        <InitiationBatchCard
                          v-for="batch in pagedLeaderInitiationBatches"
                          :key="batch.id"
                          :batch="batch"
                          :status="projectMemberBatchDisplayStatus"
                          :remaining-text="getProjectMemberBatchRemainingText(batch)"
                          @view="openProjectMemberInitiationBatchDetail"
                        />

                        <el-empty
                          v-if="pagedLeaderInitiationBatches.length === 0"
                          class="leader-batch-empty"
                          description="暂无符合条件的立项批次"
                        />
                      </div>

                      <footer class="leader-batch-pagination">
                        <span>共 {{ filteredLeaderInitiationBatches.length }} 个立项批次</span>
                        <el-pagination
                          v-model:current-page="leaderBatchPage"
                          v-model:page-size="leaderBatchPageSize"
                          background
                          layout="prev, pager, next"
                          :total="filteredLeaderInitiationBatches.length"
                        />
                      </footer>
                    </template>
                  </section>
                </template>

                <template v-else-if="!activeApprovalRoleInitiationBatch">
                  <section class="initiation-batch-filter-panel" aria-label="立项批次筛选">
                    <div class="batch-filter-row">
                      <div class="batch-filter-controls">
                        <el-input
                          v-model="batchKeywordInput"
                          class="batch-keyword-input"
                          clearable
                          :prefix-icon="Search"
                          placeholder="输入批次名称或批次编号"
                          @keyup.enter="handleBatchQuery"
                        />
                        <el-select v-model="batchYearInput" class="batch-filter-select" aria-label="年份筛选">
                          <el-option label="全部年份" value="all" />
                          <el-option
                            v-for="year in initiationYearOptions"
                            :key="year"
                            :label="`${year} 年`"
                            :value="year"
                          />
                        </el-select>
                        <el-select v-model="batchQuarterInput" class="batch-filter-select" aria-label="季度筛选">
                          <el-option label="全部季度" value="all" />
                          <el-option
                            v-for="quarter in initiationQuarterOptions"
                            :key="quarter"
                            :label="`第 ${quarter} 季度`"
                            :value="quarter"
                          />
                        </el-select>
                        <el-button type="primary" @click="handleBatchQuery">查询</el-button>
                        <el-button @click="handleBatchReset">重置</el-button>
                      </div>

                      <div class="batch-status-toggle" aria-label="批次状态切换">
                        <el-button
                          :type="batchStatusView === 'active' ? 'primary' : 'default'"
                          @click="setBatchStatusView('active')"
                        >
                          正在申报中
                        </el-button>
                        <el-button
                          :type="batchStatusView === 'history' ? 'primary' : 'default'"
                          @click="setBatchStatusView('history')"
                        >
                          历史记录
                        </el-button>
                      </div>
                    </div>
                  </section>

                  <section class="initiation-batch-grid" aria-label="立项审批批次">
                    <article
                      v-for="batch in pagedInitiationBatches"
                      :key="batch.id"
                      class="initiation-batch-card"
                      :class="getBatchCardClass(batch)"
                    >
                      <div class="batch-quarter-badge">
                        <strong>{{ batch.year }}</strong>
                        <span>第 {{ batch.quarter }} 季度</span>
                      </div>

                      <div class="batch-main-block">
                        <header class="batch-card-header">
                          <div class="batch-title-block">
                            <el-tooltip :content="batch.batchName" placement="top" :show-after="300">
                              <h2>{{ batch.batchName }}</h2>
                            </el-tooltip>
                            <p>批次编号：{{ batch.batchCode }}</p>
                          </div>
                        </header>

                        <div class="batch-progress-row" :class="{ finished: batch.status === '已结束' }">
                          <span>立项进度</span>
                          <div
                            class="batch-progress-track"
                            :class="{ finished: batch.status === '已结束' }"
                            :aria-label="`立项进度 ${getBatchProgressValue(batch)}%`"
                          >
                            <span class="batch-progress-fill" :style="getBatchProgressStyle(batch)"></span>
                          </div>
                          <strong>{{ getBatchProgressValue(batch) }}%</strong>
                        </div>
                      </div>

                      <div class="batch-row-meta">
                        <div>
                          <span>申报周期</span>
                          <strong>{{ batch.applyPeriod }}</strong>
                        </div>
                        <div>
                          <span>已提交项目</span>
                          <strong>{{ batch.submittedProjectCount }}</strong>
                        </div>
                        <div>
                          <span>已立项项目</span>
                          <strong>{{ batch.establishedCount }}</strong>
                        </div>
                      </div>

                      <div class="batch-row-status">
                        <el-tag
                          v-if="batch.flowStage && batch.status !== '已结束'"
                          size="small"
                          effect="plain"
                          type="warning"
                        >
                          {{ getBatchFlowStageLabel(batch) }}
                        </el-tag>
                        <span v-else :class="getBatchStatusClass(batch)">{{ batch.status }}</span>
                      </div>

                      <footer class="batch-card-footer">
                        <el-button
                          class="batch-detail-button"
                          :type="batch.status === '申报中' ? 'primary' : 'default'"
                          @click="openApprovalRoleInitiationBatchDetail(batch)"
                        >
                          查看详情
                          <span aria-hidden="true">›</span>
                        </el-button>
                      </footer>
                    </article>

                    <el-empty
                      v-if="pagedInitiationBatches.length === 0"
                      class="batch-empty"
                      :description="batchEmptyDescription"
                    />
                  </section>

                  <footer class="batch-pagination">
                    <span>
                      共 {{ filteredInitiationBatches.length }}
                      个{{ batchStatusView === 'active' ? '正在申报批次' : '历史批次' }}
                    </span>
                    <el-pagination
                      v-model:current-page="batchPage"
                      v-model:page-size="batchPageSize"
                      background
                      layout="prev, pager, next"
                      :total="filteredInitiationBatches.length"
                    />
                  </footer>
                </template>

                <template v-else-if="!approvalRoleBatchStage">
                  <section class="batch-stage-select-panel" aria-label="项目审批事项选择">
                    <header class="batch-stage-select-head">
                      <h2>{{ activeApprovalRoleInitiationBatch?.batchName }}</h2>
                      <p>批次编号：{{ activeApprovalRoleInitiationBatch?.batchCode }}</p>
                    </header>
                    <div class="batch-stage-cards">
                      <article class="batch-stage-card" @click="approvalRoleBatchStage = 'formal'">
                        <h3>形式审查审批</h3>
                        <p>查看本批次形式审查报告，确认通过与不通过清单。</p>
                        <span>进入 ›</span>
                      </article>
                      <article
                        class="batch-stage-card"
                        @click="openApprovalRoleAssignReviewers"
                      >
                        <h3>指定子方向与评委</h3>
                        <p>为本批次申报项目指定所属子方向并分配评审评委，评委评分完成后进入评审结果汇总。</p>
                        <span>进入 ›</span>
                      </article>
                      <article
                        class="batch-stage-card"
                        @click="approvalRoleBatchStage = 'final'; approvalRoleFinalSubStep = 'report'"
                      >
                        <h3>学部推荐立项终审</h3>
                        <p>汇总专家评审意见，提交学部推荐立项终审结论。</p>
                        <span>进入 ›</span>
                      </article>
                    </div>
                  </section>
                </template>

                <template v-else-if="approvalRoleBatchStage === 'guide'">
                  <section class="formal-report-page" aria-label="立项指南发布">
                    <nav
                      class="approval-flow-steps"
                      aria-label="项目流转线"
                      title="原型演示：流转线各环节均可点击查看对应界面"
                    >
                      <button
                        v-for="(step, index) in facultyApprovalFlowSteps"
                        :key="step"
                        type="button"
                        class="approval-flow-step approval-flow-step--clickable"
                        :class="{ active: index === approvalRoleBatchStageIndex, done: index < approvalRoleBatchStageIndex }"
                        @click="selectFacultyApprovalFlowStep(index)"
                      >
                        <span class="approval-flow-index">{{ index + 1 }}</span>
                        <span class="approval-flow-label">{{ step }}</span>
                      </button>
                    </nav>

                    <el-empty description="立项指南发布：功能建设中（流转线第 1 步）">
                      <el-button @click="approvalRoleBatchStage = 'formal'">返回形式审查</el-button>
                    </el-empty>
                  </section>
                </template>

                <template v-else-if="approvalRoleBatchStage === 'recheck'">
                  <section class="formal-report-page" aria-label="复审阶段">
                    <nav
                      class="approval-flow-steps"
                      aria-label="项目流转线"
                      title="原型演示：流转线各环节均可点击查看对应界面"
                    >
                      <button
                        v-for="(step, index) in facultyApprovalFlowSteps"
                        :key="step"
                        type="button"
                        class="approval-flow-step approval-flow-step--clickable"
                        :class="{ active: index === approvalRoleBatchStageIndex, done: index < approvalRoleBatchStageIndex }"
                        @click="selectFacultyApprovalFlowStep(index)"
                      >
                        <span class="approval-flow-index">{{ index + 1 }}</span>
                        <span class="approval-flow-label">{{ step }}</span>
                      </button>
                    </nav>

                    <el-empty v-if="!facultyRecheckMonitorRows.length" description="本批次暂无进入复审的项目" />
                    <template v-else>
                      <!-- AN-MWVFRNN7：学部复审阶段 — 展示本学部复审评审报告（仅本学部数据） -->
                      <section class="formal-report-section">
                        <h3>报告头</h3>
                        <el-descriptions :column="2" border>
                          <el-descriptions-item label="报告名称">2026 年秋季批次复审评审报告（学部视角）</el-descriptions-item>
                          <el-descriptions-item label="所属学部">{{ facultyLeaderAcademy }}</el-descriptions-item>
                          <el-descriptions-item label="复审范围">学部终审推荐且复议后进入复审的项目（仅本学部）</el-descriptions-item>
                          <el-descriptions-item label="编制时间">2026-11-24</el-descriptions-item>
                        </el-descriptions>
                      </section>

                      <section class="formal-report-section">
                        <h3>复审结论概览</h3>
                        <div class="formal-report-summary">
                          <article>
                            <span>进入复审</span>
                            <strong>{{ facultyRecheckMonitorRows.length }} 项</strong>
                          </article>
                          <article>
                            <span>复审已完成</span>
                            <strong>{{ facultyArchiveRows.length }} 项</strong>
                          </article>
                          <article>
                            <span>复审进行中 / 待启动</span>
                            <strong>{{ facultyRecheckMonitorRows.length - facultyArchiveRows.length }} 项</strong>
                          </article>
                        </div>
                      </section>

                      <section class="formal-report-section">
                        <h3>复审项目清单 {{ facultyRecheckMonitorRows.length }} 项・仅展示本学部项目</h3>
                        <el-table :data="facultyRecheckMonitorRows" border size="small">
                          <el-table-column label="项目名称" min-width="240">
                            <template #default="{ row }">
                              <el-button
                                link
                                type="primary"
                                class="final-project-link"
                                @click="openFacultyRecheckScoreDetail(row)"
                              >
                                {{ row.projectName }}
                              </el-button>
                            </template>
                          </el-table-column>
                          <el-table-column prop="leader" label="项目负责人" width="100" align="center" />
                          <el-table-column prop="finalScore" label="初审得分" width="90" align="center" />
                          <el-table-column label="复审评委" min-width="160">
                            <template #default="{ row }">
                              <div class="pmo-recheck-reviewer-tags">
                                <el-tag
                                  v-for="reviewer in row.recheckReviewers"
                                  :key="reviewer"
                                  size="small"
                                  effect="plain"
                                >
                                  {{ reviewer }}
                                </el-tag>
                              </div>
                            </template>
                          </el-table-column>
                          <el-table-column label="评分进度" width="140">
                            <template #default="{ row }">
                              <el-progress
                                :percentage="Math.round((row.submittedCount / row.totalCount) * 100)"
                                :status="row.submittedCount === row.totalCount ? 'success' : undefined"
                              />
                              <span class="pmo-recheck-progress-text">{{ row.submittedCount }}/{{ row.totalCount }} 已提交</span>
                            </template>
                          </el-table-column>
                          <el-table-column label="复审状态" width="92" align="center">
                            <template #default="{ row }">
                              <el-tag
                                size="small"
                                effect="plain"
                                :type="row.status === '已完成' ? 'success' : row.status === '进行中' ? 'primary' : 'info'"
                              >
                                {{ row.status }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="latestUpdate" label="最新提交" width="140" align="center" />
                        </el-table>
                      </section>

                      <p class="formal-report-note">
                        说明：本报告仅展示{{ facultyLeaderAcademy }}进入复审的项目；点击项目名称可查看复审评委打分明细。
                      </p>
                    </template>

                    <footer class="formal-report-actions">
                      <el-button @click="approvalRoleBatchStage = ''">返回批次详情</el-button>
                    </footer>
                  </section>
                </template>

                <template v-else-if="approvalRoleBatchStage === 'archive'">
                  <section class="formal-report-page" aria-label="立项入库">
                    <nav
                      class="approval-flow-steps"
                      aria-label="项目流转线"
                      title="原型演示：流转线各环节均可点击查看对应界面"
                    >
                      <button
                        v-for="(step, index) in facultyApprovalFlowSteps"
                        :key="step"
                        type="button"
                        class="approval-flow-step approval-flow-step--clickable"
                        :class="{ active: index === approvalRoleBatchStageIndex, done: index < approvalRoleBatchStageIndex }"
                        @click="selectFacultyApprovalFlowStep(index)"
                      >
                        <span class="approval-flow-index">{{ index + 1 }}</span>
                        <span class="approval-flow-label">{{ step }}</span>
                      </button>
                    </nav>

                    <el-empty v-if="!facultyArchiveRows.length" description="本学部暂无复审通过进入立项库的项目" />
                    <template v-else>
                      <!-- AN-MWVFS94C：学部立项入库 — 展示本学部最终复审通过的项目 -->
                      <section class="formal-report-section">
                        <h3>报告头</h3>
                        <el-descriptions :column="2" border>
                          <el-descriptions-item label="报告名称">2026 年秋季批次立项入库清单（学部视角）</el-descriptions-item>
                          <el-descriptions-item label="所属学部">{{ facultyLeaderAcademy }}</el-descriptions-item>
                          <el-descriptions-item label="入库口径">复审通过（复审评委评分全部提交且结论为通过）的项目</el-descriptions-item>
                          <el-descriptions-item label="编制时间">2026-11-24</el-descriptions-item>
                        </el-descriptions>
                      </section>

                      <section class="formal-report-section">
                        <h3>立项入库概览</h3>
                        <div class="formal-report-summary">
                          <article>
                            <span>进入复审</span>
                            <strong>{{ facultyRecheckMonitorRows.length }} 项</strong>
                          </article>
                          <article>
                            <span>复审通过・立项入库</span>
                            <strong>{{ facultyArchiveRows.length }} 项</strong>
                          </article>
                          <article>
                            <span>立项率</span>
                            <strong>
                              {{
                                Math.round(
                                  (facultyArchiveRows.length / facultyRecheckMonitorRows.length) * 100,
                                )
                              }}%
                            </strong>
                          </article>
                        </div>
                      </section>

                      <section class="formal-report-section">
                        <h3>立项清单 {{ facultyArchiveRows.length }} 项・最终复审通过</h3>
                        <el-table :data="facultyArchiveRows" border size="small">
                          <el-table-column label="立项编号" width="140" align="center">
                            <template #default="{ $index }">
                              LX-2026-0{{ $index + 1 }}
                            </template>
                          </el-table-column>
                          <el-table-column label="项目名称" min-width="240">
                            <template #default="{ row }">
                              <el-button
                                link
                                type="primary"
                                class="final-project-link"
                                @click="openFacultyRecheckScoreDetail(row)"
                              >
                                {{ row.projectName }}
                              </el-button>
                            </template>
                          </el-table-column>
                          <el-table-column prop="leader" label="项目负责人" width="100" align="center" />
                          <el-table-column prop="finalScore" label="初审得分" width="90" align="center" />
                          <el-table-column label="复审评委" min-width="160">
                            <template #default="{ row }">
                              <div class="pmo-recheck-reviewer-tags">
                                <el-tag
                                  v-for="reviewer in row.recheckReviewers"
                                  :key="reviewer"
                                  size="small"
                                  effect="plain"
                                >
                                  {{ reviewer }}
                                </el-tag>
                              </div>
                            </template>
                          </el-table-column>
                          <el-table-column label="复审结论" width="100" align="center">
                            <template #default>
                              <el-tag size="small" type="success" effect="plain">复审通过</el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column label="入库日期" width="110" align="center">
                            <template #default="{ row }">
                              {{ row.latestUpdate === '——' ? '2026-11-24' : row.latestUpdate.slice(0, 10) }}
                            </template>
                          </el-table-column>
                        </el-table>
                      </section>

                      <p class="formal-report-note">
                        说明：立项入库仅收录{{ facultyLeaderAcademy }}最终复审通过的项目；点击项目名称可查看复审评委打分明细。
                      </p>
                    </template>

                    <footer class="formal-report-actions">
                      <el-button @click="approvalRoleBatchStage = ''">返回批次详情</el-button>
                    </footer>
                  </section>
                </template>

                <template v-else-if="approvalRoleBatchStage === 'final'">
                  <section class="final-review-page" aria-label="学部初审阶段">
                    <nav
                      class="approval-flow-steps"
                      aria-label="项目流转线"
                      title="原型演示：流转线各环节均可点击查看对应界面"
                    >
                      <button
                        v-for="(step, index) in facultyApprovalFlowSteps"
                        :key="step"
                        class="approval-flow-step approval-flow-step--clickable"
                        :class="{ active: index === approvalRoleBatchStageIndex, done: index < approvalRoleBatchStageIndex }"
                        @click="selectFacultyApprovalFlowStep(index)"
                      >
                        <span class="approval-flow-index">{{ index + 1 }}</span>
                        <span class="approval-flow-label">{{ step }}</span>
                      </button>
                    </nav>

                    <nav class="recheck-sub-steps final-sub-steps" aria-label="初审子步骤">
                      <button
                        type="button"
                        class="recheck-sub-step"
                        :class="{ active: approvalRoleFinalSubStep === 'assign' }"
                        @click="selectApprovalRoleFinalSubStep('assign')"
                      >
                        <span class="recheck-sub-index">1</span>
                        <span class="recheck-sub-label">指定子方向与评委</span>
                      </button>
                      <button
                        type="button"
                        class="recheck-sub-step"
                        :class="{ active: approvalRoleFinalSubStep === 'report' }"
                        @click="selectApprovalRoleFinalSubStep('report')"
                      >
                        <span class="recheck-sub-index">2</span>
                        <span class="recheck-sub-label">评审结果报告</span>
                      </button>
                    </nav>

                    <template v-if="approvalRoleFinalSubStep === 'assign'">
                      <section class="final-assign-intro" aria-label="评委分配说明">
                        <h2>指定子方向与评委</h2>
                        <p>
                          当前批次：{{ activeApprovalRoleInitiationBatch?.batchName }}（{{ activeApprovalRoleInitiationBatch?.batchCode }}）。
                          为本批次申报项目指定所属子方向并分配评审评委；全部评委完成评分后，进入「评审结果报告」汇总初审结论。
                        </p>
                      </section>

                      <section class="subdirection-assign-page">
                        <ReviewerAssignmentPanel />
                      </section>
                    </template>

                    <template v-else>
                    <header class="formal-report-head">
                      <div>
                        <h2>评审结果报告</h2>
                        <p>{{ finalReviewReport.kicker }}</p>
                      </div>
                      <el-tag type="success" effect="light">{{ finalReviewReport.statusTag }}</el-tag>
                    </header>

                    <section class="formal-report-section">
                      <h3>评审基本信息</h3>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item
                          v-for="item in finalReviewReport.info"
                          :key="item.label"
                          :label="item.label"
                        >
                          {{ item.value }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </section>

                    <section class="formal-report-section">
                      <h3>结论概览</h3>
                      <div class="formal-report-summary">
                        <article>
                          <span>申报项目</span>
                          <strong>{{ finalReviewReport.overview.declared }}</strong>
                        </article>
                        <article>
                          <span>拟推荐进入复审</span>
                          <strong>{{ finalReviewReport.overview.recommended }}</strong>
                        </article>
                        <article>
                          <span>平均分</span>
                          <strong>{{ finalReviewReport.overview.average }}</strong>
                        </article>
                        <article>
                          <span>最高分</span>
                          <strong>{{ finalReviewReport.overview.highest }}</strong>
                        </article>
                      </div>
                    </section>

                    <section class="formal-report-section">
                      <h3>学部初审结果汇总表</h3>
                      <p class="final-weight-note">{{ finalReviewReport.weightNote }}</p>
                      <div class="final-batch-actions">
                        <span>已选 {{ finalSelectedRows.length }} 单</span>
                        <el-button size="small" @click="batchSetFinalRecommendation(false)">批量不推荐</el-button>
                        <el-button size="small" type="primary" @click="batchSetFinalRecommendation(true)">批量推荐</el-button>
                      </div>
                      <el-table
                        ref="finalSummaryTableRef"
                        class="final-summary-table final-summary-table--editable"
                        :data="finalReviewRows"
                        border
                        row-key="seq"
                        @selection-change="handleFinalSelectionChange"
                      >
                        <el-table-column type="selection" width="42" />
                        <el-table-column label="推荐次序" width="128" align="center">
                          <template #default="{ row }">
                            <!-- AN-MWUFAJRV：直接输入目标名次即调序（el-input type=number） -->
                            <el-input
                              :model-value="String(row.seq)"
                              type="number"
                              size="small"
                              class="final-rank-input"
                              @change="(value: string) => moveFinalReviewRowTo(row, Number(value) || row.seq)"
                            />
                          </template>
                        </el-table-column>
                        <!-- AN-MWVFPQVT：项目名称可点进入项目评审详情，操作列不再放「查看」 -->
                        <el-table-column label="项目名称" min-width="240">
                          <template #default="{ row }">
                            <el-button
                              link
                              type="primary"
                              class="final-project-link"
                              @click="openFinalScoreDetail(row)"
                            >
                              {{ row.projectName }}
                            </el-button>
                          </template>
                        </el-table-column>
                        <el-table-column prop="leader" label="项目负责人" width="96" />
                        <el-table-column prop="subDirection" label="所属子方向" width="100" />
                        <el-table-column label="评分结果" width="120" align="center">
                          <template #default="{ row }">
                            <div class="final-score-cell">
                              <strong>{{ row.score }}</strong>
                              <span>Z={{ row.zScore }}</span>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="战略相关标注" width="112" align="center">
                          <template #default="{ row }">
                            <button
                              type="button"
                              class="strategic-star"
                              :class="{ 'is-active': row.strategicStar }"
                              @click="toggleStrategicStar(row)"
                            >
                              战略相关
                            </button>
                          </template>
                        </el-table-column>
                        <el-table-column label="对应计划申请的外部重大项目（学部战略牵引）" min-width="260">
                          <template #default="{ row }">
                            <el-input
                              :model-value="row.majorProject"
                              size="small"
                              placeholder="填写对应外部重大项目"
                              @change="(value: string) => saveFinalReviewRowField(row, 'majorProject', value)"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column label="具体评审意见" min-width="240">
                          <template #default="{ row }">
                            <el-input
                              :model-value="row.reviewComment"
                              type="textarea"
                              :rows="2"
                              resize="none"
                              placeholder="填写具体评审意见"
                              @change="(value: string) => saveFinalReviewRowField(row, 'reviewComment', value)"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column label="调整名次" width="88" align="center">
                          <template #default="{ row }">
                            <span
                              class="rank-change"
                              :class="row.rankChange === 'up' ? 'is-up' : row.rankChange === 'down' ? 'is-down' : ''"
                            >
                              {{ row.rankChange === 'up' ? '上升' : row.rankChange === 'down' ? '下降' : '-' }}
                            </span>
                          </template>
                        </el-table-column>
                        <el-table-column label="是否推荐立项" width="110" align="center">
                          <template #default="{ row }">
                            <el-tag :type="row.recommended ? 'success' : 'danger'" effect="light">
                              {{ row.recommended ? '推荐' : '不推荐' }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column label="操作" width="88" align="center" fixed="right">
                          <template #default="{ row }">
                            <div class="final-row-move-actions">
                              <!-- AN-MWUFAJRV：↑↓ 调序按钮（原生 title 提示；el-tooltip 包裹会拦截 click， 弃用） -->
                              <!-- AN-MWVFPQVT：评审详情改由项目名称进入，「查看」按钮移除 -->
                              <el-button
                                link
                                type="primary"
                                title="上移一位"
                                :disabled="finalReviewRows[0]?.seq === row.seq"
                                :icon="ArrowUp"
                                @click="moveFinalReviewRow(row, -1)"
                              />
                              <el-button
                                link
                                type="primary"
                                title="下移一位"
                                :disabled="finalReviewRows[finalReviewRows.length - 1]?.seq === row.seq"
                                :icon="ArrowDown"
                                @click="moveFinalReviewRow(row, 1)"
                              />
                            </div>
                          </template>
                        </el-table-column>
                      </el-table>
                    </section>

                    <section class="formal-report-section">
                      <h3>学部总体评语</h3>
                      <p class="final-overall-comment">{{ finalReviewReport.overallComment1 }}</p>
                      <p class="final-overall-comment">{{ finalReviewReport.overallComment2 }}</p>
                    </section>

                    <footer class="final-review-footer">
                      <div class="final-review-sign">
                        <el-tag size="small" effect="plain">{{ finalReviewReport.draftSavedTag }}</el-tag>
                        <span>{{ finalReviewReport.signers }}</span>
                      </div>
                      <div class="formal-report-actions">
                        <el-button @click="approvalRoleBatchStage = ''">返回</el-button>
                        <el-button type="primary" @click="facultyRecommendReportVisible = true">
                          学部生成推荐报告
                        </el-button>
                      </div>
                    </footer>

                                        </template>
                  </section>

                <el-dialog
                  v-model="facultyRecommendReportVisible"
                  title="学部推荐报告（预览）"
                  width="min(1200px, 96vw)"
                  top="4vh"
                  append-to-body
                  destroy-on-close
                  class="faculty-recommend-report-dialog"
                >
                  <section class="faculty-recommend-report" aria-label="学部推荐报告">
                    <header class="formal-report-head">
                      <div>
                        <h2>学部推荐报告</h2>
                        <p>{{ facultyRecommendReport.kicker }}</p>
                      </div>
                      <el-tag type="success" effect="light">{{ facultyRecommendReport.statusTag }}</el-tag>
                    </header>

                    <section class="formal-report-section">
                      <h3>报告基本信息</h3>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item
                          v-for="item in facultyRecommendReport.info"
                          :key="item.label"
                          :label="item.label"
                        >
                          {{ item.value }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </section>

                    <section class="formal-report-section">
                      <h3>结论概览</h3>
                      <div class="formal-report-summary">
                        <article v-for="item in facultyRecommendReport.overview" :key="item.label">
                          <span>{{ item.label }}</span>
                          <strong>{{ item.value }}</strong>
                        </article>
                      </div>
                    </section>

                    <section class="formal-report-section">
                      <h3>推荐清单（主体）</h3>
                      <el-table :data="recommendRows" border>
                        <el-table-column prop="order" label="推荐次序" width="84" align="center" />
                        <el-table-column prop="projectName" label="项目名称" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="leader" label="申请人" width="84" />
                        <el-table-column prop="subDirection" label="所属子方向" width="96" />
                        <el-table-column label="评分结果" width="110" align="center">
                          <template #default="{ row }">
                            <div class="final-score-cell">
                              <strong>{{ row.score }}</strong>
                              <span v-if="row.zScore">Z={{ row.zScore }}</span>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="战略相关标注" width="110" align="center">
                          <template #default="{ row }">
                            <el-tag v-if="row.strategic" type="warning" effect="plain" size="small">★战略相关</el-tag>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column prop="majorProject" label="重大项目关联描述" min-width="240" show-overflow-tooltip />
                        <el-table-column prop="reviewComment" label="项目评语" min-width="240" show-overflow-tooltip />
                        <el-table-column prop="leaderOpinion" label="学部负责人意见" min-width="180" show-overflow-tooltip />
                      </el-table>
                    </section>

                    <section class="formal-report-section">
                      <h3>不推荐清单</h3>
                      <el-table :data="notRecommendedRows" border>
                        <el-table-column prop="projectName" label="项目名称" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="leader" label="申请人" width="84" />
                        <el-table-column prop="subDirection" label="所属子方向" width="96" />
                        <el-table-column label="评分结果" width="110" align="center">
                          <template #default="{ row }">
                            <div class="final-score-cell">
                              <strong>{{ row.score }}</strong>
                              <span v-if="row.zScore">Z={{ row.zScore }}</span>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column prop="reviewComment" label="项目评语" min-width="240" show-overflow-tooltip />
                        <el-table-column prop="leaderOpinion" label="学部负责人意见" min-width="200" show-overflow-tooltip />
                      </el-table>
                    </section>

                    <section class="formal-report-section">
                      <h3>学部评语（整体）</h3>
                      <p class="final-overall-comment">{{ facultyRecommendReport.overallComment }}</p>
                      <p class="faculty-report-signers">
                        {{ facultyRecommendReport.signers }} | {{ facultyRecommendReport.signDate }}
                      </p>
                    </section>
                  </section>
                  <template #footer>
                    <el-button @click="facultyRecommendReportVisible = false">关闭</el-button>
                  </template>
                </el-dialog></template>

                <template v-else>
                  <section class="formal-report-page" aria-label="形式审查报告">
                    <nav
                      class="approval-flow-steps"
                      aria-label="项目流转线"
                      title="原型演示：流转线各环节均可点击查看对应界面"
                    >
                      <button
                        v-for="(step, index) in facultyApprovalFlowSteps"
                        :key="step"
                        type="button"
                        class="approval-flow-step approval-flow-step--clickable"
                        :class="{ active: index === approvalRoleBatchStageIndex, done: index < approvalRoleBatchStageIndex }"
                        @click="selectFacultyApprovalFlowStep(index)"
                      >
                        <span class="approval-flow-index">{{ index + 1 }}</span>
                        <span class="approval-flow-label">{{ step }}</span>
                      </button>
                    </nav>

                    <header class="formal-report-head">
                      <div>
                        <h2>形式审查报告</h2>
                        <p>{{ formalReviewReport.title }}</p>
                        <span class="formal-report-version">{{ formalReviewReport.version }}</span>
                      </div>
                      <el-tag type="success" effect="light">{{ formalReviewReport.version }}</el-tag>
                    </header>

                    <section class="formal-report-section">
                      <h3>报告头</h3>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item
                          v-for="item in formalReviewReport.head"
                          :key="item.label"
                          :label="item.label"
                        >
                          {{ item.value }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </section>

                    <section class="formal-report-section">
                      <h3>结论概览</h3>
                      <div class="formal-report-summary">
                        <article>
                          <span>累计提交</span>
                          <strong>{{ formalReviewReport.submittedCount }} 单</strong>
                        </article>
                        <article>
                          <span>通过</span>
                          <strong>{{ formalReviewReport.passedCount }} 单・通过率 {{ formalReviewReport.passedRate }}</strong>
                          <em v-if="formalReviewReport.externalPassedCount">
                            其中外部申请人 {{ formalReviewReport.externalPassedCount }} 单（清单内标注）
                          </em>
                        </article>
                        <article>
                          <span>不通过</span>
                          <strong>{{ formalReviewReport.rejectedCount }} 单</strong>
                        </article>
                      </div>
                    </section>

                    <section class="formal-report-section">
                      <h3>通过清单 {{ formalReviewReport.passedCount }} 单・包干制固定额度</h3>
                      <el-table :data="formalReviewReport.passedRows" border>
                        <el-table-column prop="code" label="单据号" width="140" />
                        <!-- AN-MWVFPQVT：项目名称点击进入项目评审详情（三评委打分），「查看」操作列移除 -->
                        <el-table-column label="项目名称" min-width="280">
                          <template #default="{ row }">
                            <el-button
                              link
                              type="primary"
                              class="final-project-link"
                              @click="openFormalPassedScoreDetail(row)"
                            >
                              {{ row.projectName }}
                            </el-button>
                          </template>
                        </el-table-column>
                        <el-table-column prop="leader" label="项目负责人" width="120" />
                        <el-table-column label="外部申请人标注" width="130" align="center">
                          <template #default="{ row }">
                            <el-tag v-if="row.external" type="warning" effect="plain" size="small">外部申请人</el-tag>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                      </el-table>
                    </section>

                    <section class="formal-report-section">
                      <h3>不通过清单 {{ formalReviewReport.rejectedCount }} 单</h3>
                      <el-table :data="formalReviewReport.rejectedRows" border>
                        <el-table-column prop="projectName" label="项目名称" min-width="260" show-overflow-tooltip />
                        <el-table-column prop="leader" label="申请人" width="110" />
                        <el-table-column prop="reason" label="不通过原因" min-width="280" show-overflow-tooltip />
                      </el-table>
                    </section>

                    <footer class="formal-report-actions">
                      <el-button @click="approvalRoleBatchStage = ''">返回批次详情</el-button>
                      <el-button type="primary" @click="openApprovalRoleAssignReviewers">
                        前往学部指定子方向
                      </el-button>
                    </footer>
                  </section>


                  <el-dialog
                    v-model="approvalDialogVisible"
                    append-to-body
                    destroy-on-close
                    class="approval-project-dialog"
                    title="项目审批"
                    width="520px"
                    @closed="closeApprovalProjectDialog"
                  >
                    <div v-if="approvalTargetProject" class="approval-dialog-body">
                      <section class="approval-dialog-project">
                        <span>审批项目</span>
                        <strong>{{ approvalTargetProject.projectName }}</strong>
                        <p>
                          {{ approvalTargetProject.projectCode }} · {{ approvalTargetProject.leader }} / {{ approvalTargetProject.department }}
                        </p>
                      </section>

                      <el-form label-position="top">
                        <el-form-item label="审批结果">
                          <el-radio-group v-model="approvalDecision" class="approval-decision-group">
                            <el-radio-button label="APPROVE">通过审批</el-radio-button>
                            <el-radio-button label="REJECT">驳回审批</el-radio-button>
                          </el-radio-group>
                        </el-form-item>

                        <el-form-item :required="approvalDecision === 'REJECT'" label="驳回理由">
                          <el-input
                            v-model="approvalRejectReason"
                            type="textarea"
                            maxlength="300"
                            show-word-limit
                            :rows="4"
                            :disabled="approvalDecision !== 'REJECT'"
                            placeholder="选择驳回审批时必须填写驳回理由"
                          />
                        </el-form-item>
                      </el-form>
                    </div>

                    <template #footer>
                      <el-button @click="closeApprovalProjectDialog">取消</el-button>
                      <el-button type="primary" :loading="approvalSubmitting" @click="confirmApprovalProject">
                        确认提交
                      </el-button>
                    </template>
                  </el-dialog>

                  <el-dialog
                    v-model="reviewReportVisible"
                    class="formal-review-report-dialog"
                    title="形式审查报告"
                    width="960px"
                    top="4vh"
                    destroy-on-close
                  >
                    <section class="formal-report-body">
                      <header class="formal-report-head">
                        <div>
                          <h2>形式审查报告</h2>
                          <p>{{ formalReviewReport.title }}</p>
                          <span class="formal-report-version">{{ formalReviewReport.version }}</span>
                        </div>
                        <el-tag type="success" effect="light">{{ formalReviewReport.version }}</el-tag>
                      </header>

                      <section class="formal-report-section">
                        <h3>报告头</h3>
                        <el-descriptions :column="2" border>
                          <el-descriptions-item
                            v-for="item in formalReviewReport.head"
                            :key="item.label"
                            :label="item.label"
                          >
                            {{ item.value }}
                          </el-descriptions-item>
                        </el-descriptions>
                      </section>

                      <section class="formal-report-section">
                        <h3>结论概览</h3>
                        <div class="formal-report-summary">
                          <article>
                            <span>累计提交</span>
                            <strong>{{ formalReviewReport.submittedCount }} 单</strong>
                          </article>
                          <article>
                            <span>通过</span>
                            <strong>{{ formalReviewReport.passedCount }} 单・通过率 {{ formalReviewReport.passedRate }}</strong>
                            <em v-if="formalReviewReport.externalPassedCount">
                              其中外部申请人 {{ formalReviewReport.externalPassedCount }} 单（清单内标注）
                            </em>
                          </article>
                          <article>
                            <span>不通过</span>
                            <strong>{{ formalReviewReport.rejectedCount }} 单</strong>
                          </article>
                        </div>
                      </section>

                      <section class="formal-report-section">
                        <h3>通过清单 {{ formalReviewReport.passedCount }} 单・包干制固定额度</h3>
                        <el-table :data="formalReviewReport.passedRows" border>
                          <el-table-column prop="code" label="单据号" width="140" />
                          <!-- AN-MWVFPQVT：项目名称点击进入项目评审详情（三评委打分），「查看」操作列移除 -->
                          <el-table-column label="项目名称" min-width="280">
                            <template #default="{ row }">
                              <el-button
                                link
                                type="primary"
                                class="final-project-link"
                                @click="openFormalPassedScoreDetail(row)"
                              >
                                {{ row.projectName }}
                              </el-button>
                            </template>
                          </el-table-column>
                          <el-table-column prop="leader" label="项目负责人" width="120" />
                          <el-table-column label="外部申请人标注" width="130" align="center">
                            <template #default="{ row }">
                              <el-tag v-if="row.external" type="warning" effect="plain" size="small">外部申请人</el-tag>
                              <span v-else>—</span>
                            </template>
                          </el-table-column>
                        </el-table>
                      </section>

                      <section class="formal-report-section">
                        <h3>不通过清单 {{ formalReviewReport.rejectedCount }} 单</h3>
                        <el-table :data="formalReviewReport.rejectedRows" border>
                          <el-table-column prop="projectName" label="项目名称" min-width="260" show-overflow-tooltip />
                          <el-table-column prop="leader" label="申请人" width="110" />
                          <el-table-column prop="reason" label="不通过原因" min-width="280" show-overflow-tooltip />
                        </el-table>
                      </section>
                    </section>

                    <template #footer>
                      <el-button @click="reviewReportVisible = false">关闭</el-button>
                    </template>
                  </el-dialog>
                </template>

                    <FinalScoreDetailDialog v-model="finalScoreDetailVisible" :target="finalScoreDetailTarget" />
              </template>

              <template v-else-if="isStandardModuleLanding">
                <section class="module-entry-card-grid" aria-label="二级功能入口">
                  <section class="card-grid" aria-label="二级功能入口">
                    <RouterLink
                      v-for="entry in activeLandingCards.filter((item) => item.path)"
                      :key="entry.title"
                      class="function-card"
                      :style="{ '--accent': entry.accent, '--soft': entry.soft }"
                      :to="entry.path ?? currentRole?.dashboardPath ?? '/login'"
                    >
                      <span class="card-top">
                        <span class="function-icon">
                          <img
                            v-if="entry.iconUrl"
                            class="function-icon-image"
                            :src="entry.iconUrl"
                            :alt="`${entry.title}图标`"
                          >
                          <span v-else>{{ entry.iconText }}</span>
                        </span>
                      </span>
                      <span class="card-title">{{ entry.title }}<span v-if="entry.hint" class="field-doc-hint" :title="entry.hint">ℹ</span></span>
                      <span class="enter">进入{{ entry.title }} <span aria-hidden="true">›</span></span>
                    </RouterLink>

                    <button
                      v-for="entry in activeLandingCards.filter((item) => !item.path)"
                      :key="entry.title"
                      class="function-card"
                      :style="{ '--accent': entry.accent, '--soft': entry.soft }"
                      type="button"
                      @click="handlePendingEntry(entry)"
                    >
                      <span class="card-top">
                        <span class="function-icon">
                          <img
                            v-if="entry.iconUrl"
                            class="function-icon-image"
                            :src="entry.iconUrl"
                            :alt="`${entry.title}图标`"
                          >
                          <span v-else>{{ entry.iconText }}</span>
                        </span>
                      </span>
                      <span class="card-title">{{ entry.title }}<span v-if="entry.hint" class="field-doc-hint" :title="entry.hint">ℹ</span></span>
                      <span class="enter">进入{{ entry.title }} <span aria-hidden="true">›</span></span>
                    </button>
                  </section>
                </section>
              </template>

              <template v-else>
                <section class="module-entry-card-grid" aria-label="二级功能入口">
                  <section class="card-grid" aria-label="二级功能入口">
                    <RouterLink
                      v-for="entry in activeLandingCards.filter((item) => item.path)"
                      :key="entry.title"
                      class="function-card"
                      :style="{ '--accent': entry.accent, '--soft': entry.soft }"
                      :to="entry.path ?? currentRole?.dashboardPath ?? '/login'"
                    >
                      <span class="card-top">
                        <span class="function-icon">
                          <img
                            v-if="entry.iconUrl"
                            class="function-icon-image"
                            :src="entry.iconUrl"
                            :alt="`${entry.title}图标`"
                          >
                          <span v-else>{{ entry.iconText }}</span>
                        </span>
                      </span>
                      <span class="card-title">{{ entry.title }}<span v-if="entry.hint" class="field-doc-hint" :title="entry.hint">ℹ</span></span>
                      <span class="enter">进入{{ entry.title }} <span aria-hidden="true">›</span></span>
                    </RouterLink>

                    <button
                      v-for="entry in activeLandingCards.filter((item) => !item.path)"
                      :key="entry.title"
                      class="function-card"
                      :style="{ '--accent': entry.accent, '--soft': entry.soft }"
                      type="button"
                      @click="handlePendingEntry(entry)"
                    >
                      <span class="card-top">
                        <span class="function-icon">
                          <img
                            v-if="entry.iconUrl"
                            class="function-icon-image"
                            :src="entry.iconUrl"
                            :alt="`${entry.title}图标`"
                          >
                          <span v-else>{{ entry.iconText }}</span>
                        </span>
                      </span>
                      <span class="card-title">{{ entry.title }}<span v-if="entry.hint" class="field-doc-hint" :title="entry.hint">ℹ</span></span>
                      <span class="enter">进入{{ entry.title }} <span aria-hidden="true">›</span></span>
                    </button>
                  </section>
                </section>
              </template>
            </section>

            <PaperOutcomesManagement v-else-if="isPaperOutcomesManagementFeature" />

            <ProjectMemberPaperCreate
              v-else-if="isProjectMemberPaperCreateFeature"
              :current-user="currentUser"
            />

            <ProjectMemberMyPapers
              v-else-if="isProjectMemberMyPapersFeature"
              :current-user="currentUser"
            />

            <section
              v-else-if="isWorkflowConfigListFeature"
              class="workflow-config-list-page"
              aria-label="科研数据审批流配置"
            >
              <section class="workflow-config-table-card">
                <header class="workflow-config-table-head">
                  <div>
                    <h2>审批流列表</h2>
                  </div>
                  <div class="workflow-config-table-actions">
                    <el-tag effect="light" type="primary">{{ workflowConfigRows.length }} 个流程</el-tag>
                    <el-button type="primary" :icon="Plus" @click="createWorkflowConfig">新建审批流</el-button>
                  </div>
                </header>

                <el-table
                  v-if="workflowConfigRows.length"
                  class="workflow-config-table"
                  :data="workflowConfigRows"
                  row-key="id"
                >
                  <el-table-column label="审批流名称" min-width="220">
                    <template #default="{ row }">
                      <div class="workflow-config-name-cell">
                        <strong>{{ row.name }}</strong>
                        <span>{{ row.code }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="scope" label="适用业务" width="160" />
                  <el-table-column label="说明" min-width="260">
                    <template #default="{ row }">
                      <span class="workflow-config-desc">{{ row.description }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" width="110">
                    <template #default="{ row }">
                      <el-tag :type="getWorkflowConfigStatusTagType(row.status)" effect="light">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="updatedAt" label="更新时间" width="150" />
                  <el-table-column label="操作" width="128" fixed="right">
                    <template #default="{ row }">
                      <el-button type="primary" link @click="openWorkflowConfig(row)">配置流程</el-button>
                    </template>
                  </el-table-column>
                </el-table>

                <el-empty v-else description="暂无审批流配置" />
              </section>
            </section>

            <section
              v-else-if="isWorkflowConfigDetailFeature"
              class="workflow-settings-route-page"
              aria-label="公共审批流编辑"
            >
              <ApprovalWorkflowSettings
                v-if="activeWorkflowDesignerContext"
                :context="activeWorkflowDesignerContext"
                back-label="返回列表"
                show-usage-remark
                @back="returnToWorkflowConfigList"
                @status-change="handleCommonWorkflowStatusChange"
              />
              <el-empty v-else class="leader-batch-empty" description="未找到该审批流">
                <el-button type="primary" @click="returnToWorkflowConfigList">返回审批流列表</el-button>
              </el-empty>
            </section>

            <section
              v-else-if="isInitiationWorkflowSettingsFeature"
              class="workflow-settings-route-page"
              aria-label="审批流设置"
            >
              <ApprovalWorkflowSettings
                v-if="activeWorkflowInitiationBatch"
                :batch="activeWorkflowInitiationBatch"
                @back="returnToAdminInitiationBatchDetail"
                @status-change="handleWorkflowStatusChange"
              />
              <el-empty v-else class="leader-batch-empty" description="未找到该立项批次">
                <el-button type="primary" @click="returnToAdminInitiationBatchDetail">返回批次列表</el-button>
              </el-empty>
            </section>

            <section
              v-else-if="isInitiationProjectDetailFeature"
              class="initiation-project-detail-page"
              aria-label="项目申报与立项项目详情"
            >
              <template v-if="activeInitiationProject">
                <section class="initiation-project-detail-hero">
                  <div class="initiation-project-title-block">
                    <button class="batch-back-link" type="button" @click="returnToInitiationProjectBatchDetail">
                      返回批次详情
                    </button>
                    <h1>{{ activeInitiationProject.projectName }}</h1>
                    <p>
                      项目编号：{{ activeInitiationProject.projectCode }}
                      <span>·</span>
                      所属批次：{{ activeInitiationProjectBatch?.batchName ?? '未匹配批次' }}
                    </p>
                  </div>

                  <div class="initiation-project-hero-side">
                    <el-tag size="large" effect="plain" :class="getInitiationNodeTagClass(activeInitiationProject.currentNode)">
                      {{ activeInitiationProject.currentNode }}
                    </el-tag>
                    <el-button @click="returnToInitiationProjectBatchDetail">返回批次详情</el-button>
                  </div>
                </section>

                <section class="initiation-project-detail-layout">
                  <div class="initiation-project-main">
                    <section class="initiation-project-card">
                      <header class="initiation-project-card-header">
                        <div>
                          <h2>项目基本信息</h2>
                          <p>展示当前申报立项项目的提交信息和负责人信息</p>
                        </div>
                      </header>

                      <dl class="initiation-project-field-grid">
                        <div>
                          <dt>项目名称</dt>
                          <dd>{{ activeInitiationProject.projectName }}</dd>
                        </div>
                        <div>
                          <dt>项目编号</dt>
                          <dd>{{ activeInitiationProject.projectCode }}</dd>
                        </div>
                        <div>
                          <dt>项目负责人</dt>
                          <dd>{{ activeInitiationProject.leader }}</dd>
                        </div>
                        <div>
                          <dt>负责人部门</dt>
                          <dd>{{ activeInitiationProject.department }}</dd>
                        </div>
                        <div>
                          <dt>提交时间</dt>
                          <dd>{{ activeInitiationProject.submitTime || '暂未提交' }}</dd>
                        </div>
                        <div>
                          <dt>申报状态</dt>
                          <dd>{{ activeInitiationProject.submitStatus }}</dd>
                        </div>
                      </dl>
                    </section>

                    <section class="initiation-project-card">
                      <header class="initiation-project-card-header">
                        <div>
                          <h2>批次信息</h2>
                          <p>该项目所属的立项批次信息</p>
                        </div>
                      </header>

                      <dl class="initiation-project-field-grid">
                        <div>
                          <dt>批次名称</dt>
                          <dd>{{ activeInitiationProjectBatch?.batchName ?? '未匹配批次' }}</dd>
                        </div>
                        <div>
                          <dt>批次编号</dt>
                          <dd>{{ activeInitiationProjectBatch?.batchCode ?? '-' }}</dd>
                        </div>
                        <div>
                          <dt>申报周期</dt>
                          <dd>{{ activeInitiationProjectBatch?.applyPeriod ?? '-' }}</dd>
                        </div>
                        <div>
                          <dt>项目类别</dt>
                          <dd>{{ activeInitiationProjectBatch?.project_category ?? '-' }}</dd>
                        </div>
                      </dl>
                    </section>

                    <section class="initiation-project-card">
                      <header class="initiation-project-card-header">
                        <div>
                          <h2>申报材料</h2>
                          <p>围绕本次立项申报形成的材料与附件</p>
                        </div>
                      </header>

                      <div class="initiation-material-list">
                        <article class="initiation-material-item">
                          <span class="material-icon">PDF</span>
                          <div>
                            <strong>{{ activeInitiationProject.projectName }}申报书.pdf</strong>
                            <p>由项目负责人提交，当前用于形式审查和专家评审</p>
                          </div>
                          <el-button link type="primary">预览</el-button>
                        </article>
                        <article class="initiation-material-item">
                          <span class="material-icon word">W</span>
                          <div>
                            <strong>{{ activeInitiationProject.projectName }}申报书.docx</strong>
                            <p>原始 Word 附件，后续接入文件存储接口后下载</p>
                          </div>
                          <el-button link type="primary">下载</el-button>
                        </article>
                      </div>
                    </section>

                    <section class="initiation-project-card">
                      <header class="initiation-project-card-header">
                        <div>
                          <h2>办理进度</h2>
                          <p>申报立项流程中的当前办理节点</p>
                        </div>
                      </header>

                      <ol class="initiation-project-steps">
                        <li
                          v-for="step in activeInitiationProjectProcessSteps"
                          :key="step.title"
                          :class="getInitiationProjectStepClass(step)"
                        >
                          <span class="step-dot"></span>
                          <div>
                            <strong>{{ step.title }}</strong>
                            <p>{{ step.description }}</p>
                          </div>
                        </li>
                      </ol>
                    </section>
                  </div>

                  <aside class="initiation-project-aside">
                    <section class="initiation-project-card">
                      <header class="initiation-project-card-header">
                        <div>
                          <h2>评审进度</h2>
                          <p>查看当前项目评审完成情况</p>
                        </div>
                      </header>

                      <div class="detail-review-progress">
                        <el-progress
                          :percentage="getReviewProgressPercentage(activeInitiationProject)"
                          :stroke-width="8"
                        />
                        <div class="detail-review-numbers">
                          <span>完成数量</span>
                          <strong>{{ getReviewProgressText(activeInitiationProject) }}</strong>
                        </div>
                      </div>
                    </section>

                    <section class="initiation-project-card">
                      <header class="initiation-project-card-header">
                        <div>
                          <h2>当前办理</h2>
                          <p>只展示申报立项模块内的办理入口</p>
                        </div>
                      </header>

                      <div class="detail-action-stack">
                        <el-button
                          v-if="canFormalReview(activeInitiationProject)"
                          type="primary"
                          @click="handleProjectProcessEntry('review', activeInitiationProject)"
                        >
                          进入形式审查
                        </el-button>
                        <el-button
                          v-else-if="canReviewSettings(activeInitiationProject)"
                          type="primary"
                          @click="handleProjectProcessEntry('settings', activeInitiationProject)"
                        >
                          进入评审设置
                        </el-button>
                        <el-button v-else disabled>
                          当前节点暂无办理入口
                        </el-button>
                        <el-button @click="returnToInitiationProjectBatchDetail">
                          返回批次详情
                        </el-button>
                      </div>
                    </section>
                  </aside>
                </section>
              </template>

              <el-empty v-else class="leader-batch-empty" description="未找到该申报立项项目">
                <el-button type="primary" @click="returnToInitiationProjectBatchDetail">
                  返回批次详情
                </el-button>
              </el-empty>
            </section>

            <section
              v-else-if="isProjectMemberInitiationBatchListFeature"
              class="project-member-initiation-page"
              aria-label="项目负责人项目申报与立项"
            >
              <section class="module-hero leader-application-hero">
                <div class="hero-copy">
                  <div class="eyebrow">{{ isInitiationApprovalRole(currentRoleKey) ? '项目负责人视角' : '项目负责人' }}</div>
                  <h1>项目申报与立项</h1>
                  <p>查看可申报的科研项目立项批次，了解申报要求并提交项目申请。</p>
                </div>

                <div v-if="!isInitiationApprovalRole(currentRoleKey)" class="leader-hero-illustration" aria-hidden="true">
                  <span class="leader-hero-document"></span>
                  <span class="leader-hero-check">✓</span>
                </div>
              </section>

              <InitiationBatchFilter
                :model-value="leaderBatchFilter"
                :year-options="initiationYearOptions"
                :category-options="leaderProjectCategoryOptions"
                show-category
                @update:model-value="updateLeaderBatchFilter"
                @query="handleLeaderBatchQuery"
                @reset="handleLeaderBatchReset"
              />

              <section class="leader-batch-list-panel" v-loading="leaderBatchLoading">
                <el-alert
                  v-if="leaderBatchError"
                  class="leader-batch-error"
                  :title="leaderBatchError"
                  type="error"
                  show-icon
                  :closable="false"
                />

                <el-skeleton v-else-if="leaderBatchLoading" :rows="4" animated />

                <template v-else>
                  <div class="leader-batch-list">
                    <InitiationBatchCard
                      v-for="batch in pagedProjectMemberInitiationBatches"
                      :key="batch.id"
                      :batch="batch"
                      :status="projectMemberBatchDisplayStatus"
                      :remaining-text="getProjectMemberBatchRemainingText(batch)"
                      :applied="hasProjectMemberApplied(batch.id)"
                      @view="openProjectMemberInitiationBatchDetail"
                    />

                    <el-empty
                      v-if="pagedProjectMemberInitiationBatches.length === 0"
                      class="leader-batch-empty"
                      description="暂无符合条件的立项批次"
                    />
                  </div>

                  <footer class="leader-batch-pagination">
                    <span>共 {{ projectMemberInitiationBatches.length }} 个立项批次</span>
                    <el-pagination
                      v-model:current-page="leaderBatchPage"
                      v-model:page-size="leaderBatchPageSize"
                      background
                      layout="prev, pager, next"
                      :total="projectMemberInitiationBatches.length"
                    />
                  </footer>
                </template>
              </section>
            </section>

            <section
              v-else-if="isProjectMemberInitiationBatchDetailFeature"
              class="project-member-initiation-detail-page"
              aria-label="项目负责人批次详情"
            >
              <template v-if="activeLeaderInitiationBatch">
                <InitiationBatchDetail
                  :batch="activeLeaderInitiationBatch"
                  :status="projectMemberBatchDisplayStatus"
                  :remaining-text="projectMemberBatchDisplayStatus"
                  show-apply-action
                  :can-apply="true"
                  :applied="hasProjectMemberApplied(activeLeaderInitiationBatch.id)"
                  :applied-project-label="getProjectMemberAppliedProjectLabel(activeLeaderInitiationBatch.id)"
                  @preview-guide="previewProjectMemberGuide"
                  @download-guide="downloadProjectMemberGuide"
                  @apply="handleProjectMemberInitiationApply"
                />

                <footer class="leader-apply-sticky-bar" aria-label="批次申报操作">
                  <div class="leader-apply-status">
                    <span>当前申报状态</span>
                    <div>
                      <span :class="getLeaderBatchStatusClass(projectMemberBatchDisplayStatus)">
                        {{ projectMemberBatchDisplayStatus }}
                      </span>
                      <p>
                        请在 {{ getBatchApplyDeadline(activeLeaderInitiationBatch) }} 前完成提交
                      </p>
                    </div>
                  </div>

                  <div class="leader-apply-actions">
                    <el-button @click="returnToProjectMemberInitiationBatchList">返回列表</el-button>
                    <el-button
                      :type="hasProjectMemberApplied(activeLeaderInitiationBatch.id) ? 'success' : 'primary'"
                      @click="handleProjectMemberInitiationApply"
                    >
                      {{
                        hasProjectMemberApplied(activeLeaderInitiationBatch.id)
                          ? '查看我的申请'
                          : '立即申报'
                      }}
                    </el-button>
                  </div>
                </footer>

                <el-dialog
                  v-model="leaderGuidePreviewVisible"
                  append-to-body
                  class="launch-guide-preview-dialog"
                  destroy-on-close
                  :title="leaderGuidePreviewTitle || '立项指南 PDF 预览'"
                  width="72vw"
                  top="6vh"
                  @closed="revokeLeaderGuidePreviewUrl"
                >
                  <div class="launch-guide-preview-body">
                    <iframe
                      v-if="leaderGuidePreviewUrl"
                      class="launch-guide-preview-frame"
                      :src="leaderGuidePreviewUrl"
                      title="立项指南 PDF 预览"
                    ></iframe>
                    <el-empty v-else description="暂无可预览文件" />
                  </div>

                  <template #footer>
                    <el-button @click="closeLeaderGuidePreview">关闭</el-button>
                  </template>
                </el-dialog>
              </template>

              <el-empty v-else class="leader-batch-empty" description="未找到该立项批次">
                <el-button type="primary" @click="returnToProjectMemberInitiationBatchList">
                  返回列表
                </el-button>
              </el-empty>
            </section>

            <section
              v-else-if="isProjectMemberInitiationApplyFeature"
              class="project-application-page"
              aria-label="填写项目申报"
            >
              <template v-if="activeLeaderInitiationBatch">
                <ProjectApplicationWizard
                  :batch="activeLeaderInitiationBatch"
                  :current-user="currentUser"
                  @back="returnToProjectMemberBatchDetail"
                />
              </template>

              <el-empty v-else class="leader-batch-empty" description="未找到该立项批次">
                <el-button type="primary" @click="returnToProjectMemberInitiationBatchList">
                  返回批次列表
                </el-button>
              </el-empty>
            </section>

            <section v-else-if="isOfficeApprovalFeature" class="office-approval-page" aria-label="管理办项目审批">
              <template v-if="officeApprovalSelectedBatchCode">
                <header class="office-batch-context">
                  <div class="office-batch-context-main">
                    <h2>{{ officeApprovalSelectedBatch?.batchName }}</h2>
                    <p>
                      批次编号：{{ officeApprovalSelectedBatch?.batchCode }} ·
                      {{ officeApprovalSelectedBatch?.project_category }} · 申报周期
                      {{ officeApprovalSelectedBatch?.applyPeriod }}
                    </p>
                  </div>
                  <el-tag
                    :type="officeApprovalSelectedBatch?.status === '申报中' ? 'success' : 'info'"
                    effect="light"
                  >
                    {{ officeApprovalSelectedBatch?.status }}
                  </el-tag>
                </header>

              <nav
                class="approval-flow-steps"
                aria-label="项目流转线"
                title="原型演示：流转线各环节均可点击查看对应界面"
              >
                <button
                  v-for="(step, index) in officeApprovalFlowSteps"
                  :key="step"
                  type="button"
                  class="approval-flow-step approval-flow-step--clickable"
                  :class="{ active: index === officeActiveStageIndex, done: index < officeActiveStageIndex }"
                  
                  @click="officeApprovalStage = (['guide', 'formal', 'final', 'recheck', 'archive'] as const)[index]"
                >
                  <span class="approval-flow-index">{{ index + 1 }}</span>
                  <span class="approval-flow-label">{{ step }}</span>
                </button>
              </nav>

              <template v-if="officeActiveStage === 'guide'">
                <section class="office-guide-form-wrap" aria-label="立项指南发布审批">
                  <section class="launch-initiation-page" aria-label="立项指南发布审批">
                    <header class="launch-page-titlebar">
                      <div>
                        <h1>立项指南发布・审批</h1>
                      </div>
                      <span
                        class="launch-status-pill"
                        :class="{ 'office-status-pill--rejected': officeGuideRejected }"
                      >
                        {{ officeGuideRejected ? '已驳回 · 待 PMO 修改' : '待管理办审批' }}
                      </span>
                    </header>

                    <div v-if="officeGuideRejected" class="office-reject-note" role="alert">
                      驳回理由：{{ officeGuideRejected.reason }}（{{ officeGuideRejected.at }}，已反馈 PMO）
                    </div>

                    <el-form
                      ref="launchFormRef"
                      class="launch-form-card"
                      :model="launchForm"
                      :rules="launchFormRules"
                      label-position="top"
                      status-icon
                    >
                      <section class="launch-form-section">
                        <div class="launch-section-title">
                          <span class="launch-section-index">01</span>
                          <div>
                            <h2>批次基本信息</h2>
                          </div>
                        </div>

                        <div class="launch-form-grid">
                          <el-form-item label="项目归属组织" prop="owner_organizations">
                            <el-select
                              v-model="launchForm.owner_organizations"
                              multiple
                              collapse-tags
                              collapse-tags-tooltip
                              placeholder="请按组织架构选择归属组织"
                            >
                              <el-option
                                v-for="org in launchOwnerOrganizationOptions"
                                :key="org"
                                :label="org"
                                :value="org"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item prop="project_category">
                            <template #label>
                              <span class="field-doc-label">科研项目类别
                                <span class="field-doc-hint" title="不同科研类别对应不同的审批流程、申请表单和预算形式">ℹ</span>
                              </span>
                            </template>
                            <el-select v-model="launchForm.project_category" placeholder="请选择科研项目类别">
                              <el-option
                                v-for="category in launchProjectCategoryOptions"
                                :key="category"
                                :label="category"
                                :value="category"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="批次编码" prop="batch_code">
                            <el-input
                              v-model.trim="launchForm.batch_code"
                              maxlength="40"
                              disabled
                              placeholder="系统自动生成，全局唯一"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="批次名称" prop="batch_name">
                            <el-input
                              v-model.trim="launchForm.batch_name"
                              maxlength="50"
                              show-word-limit
                              placeholder="请输入批次名称（≤50字）"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="项目经费来源" prop="funding_source">
                            <el-select v-model="launchForm.funding_source" placeholder="请选择项目经费来源">
                              <el-option
                                v-for="source in launchFundingSourceOptions"
                                :key="source"
                                :label="source"
                                :value="source"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="项目预算方式" prop="budget_mode">
                            <div class="launch-budget-mode-field">
                              <el-select v-model="launchForm.budget_mode" placeholder="请选择项目预算方式">
                                <el-option
                                  v-for="mode in launchBudgetModeOptions"
                                  :key="mode"
                                  :label="mode"
                                  :value="mode"
                                />
                              </el-select>
                              <el-tooltip content="自定义配置预算模板，申请人按该批次指定模板填报" placement="top">
                                <el-button class="launch-budget-config-btn" @click="handleConfigureBudgetTemplate">
                                  配置模板
                                </el-button>
                              </el-tooltip>
                            </div>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="绑定流程模板" prop="workflow_template">
                            <div class="launch-budget-mode-field">
                              <el-select v-model="launchForm.workflow_template" placeholder="请选择已发布的流程模板">
                                <el-option
                                  v-for="tpl in launchWorkflowTemplateOptions"
                                  :key="tpl"
                                  :label="tpl"
                                  :value="tpl"
                                />
                              </el-select>
                              <el-tooltip content="自定义配置流程模板，该批次申报按此流程走审批" placement="top">
                                <el-button class="launch-budget-config-btn" @click="handleConfigureWorkflowTemplate">
                                  配置模板
                                </el-button>
                              </el-tooltip>
                            </div>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="绑定申报表单模板" prop="form_template">
                            <div class="launch-budget-mode-field">
                              <el-select v-model="launchForm.form_template" placeholder="请选择已发布的表单模板">
                                <el-option
                                  v-for="tpl in launchFormTemplateOptions"
                                  :key="tpl"
                                  :label="tpl"
                                  :value="tpl"
                                />
                              </el-select>
                              <el-tooltip content="自定义配置申报表单，申请人按该批次指定表单填报" placement="top">
                                <el-button class="launch-budget-config-btn" @click="handleConfigureFormTemplate">
                                  配置表单
                                </el-button>
                              </el-tooltip>
                            </div>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="申报项目限制" prop="declaration_limit">
                            <el-select v-model="launchForm.declaration_limit" placeholder="请选择是否限制申报项目">
                              <el-option
                                v-for="option in launchDeclarationLimitOptions"
                                :key="option"
                                :label="option"
                                :value="option"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item label="发起人" prop="launch_owner">
                            <el-input v-model="launchForm.launch_owner" disabled placeholder="当前操作人（PMO）" />
                          </el-form-item>
                        </div>

                        <el-form-item
                          class="launch-full-form-item"
                          label="项目批次说明"
                          prop="batch_introduction"
                        >
                          <div class="launch-richtext-shell">
                            <div class="launch-richtext-toolbar" role="toolbar" aria-label="富文本工具栏">
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="加粗"><strong>B</strong></button>
                                <button type="button" class="launch-richtext-btn" title="斜体"><em>I</em></button>
                                <button type="button" class="launch-richtext-btn" title="下划线"><u>U</u></button>
                                <button type="button" class="launch-richtext-btn" title="删除线"><s>S</s></button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="无序列表">• 列表</button>
                                <button type="button" class="launch-richtext-btn" title="有序列表">1. 列表</button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="左对齐">⯇</button>
                                <button type="button" class="launch-richtext-btn" title="居中">≡</button>
                                <button type="button" class="launch-richtext-btn" title="右对齐">⯈</button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="插入链接">🔗</button>
                                <button type="button" class="launch-richtext-btn" title="插入表格">⊞</button>
                                <button type="button" class="launch-richtext-btn" title="插入图片">🖼</button>
                              </span>
                              <span class="launch-richtext-sep"></span>
                              <span class="launch-richtext-group">
                                <button type="button" class="launch-richtext-btn" title="字体颜色">A</button>
                                <button type="button" class="launch-richtext-btn" title="撤销">↶</button>
                                <button type="button" class="launch-richtext-btn" title="重做">↷</button>
                              </span>
                              <span class="launch-richtext-count">2000 字以内</span>
                            </div>
                            <div
                              class="launch-richtext-editor"
                              contenteditable="true"
                              data-placeholder="请输入本批次的申报说明、重点方向或注意事项"
                            ></div>
                          </div>
                        </el-form-item>
                      </section>

                      <div class="launch-form-divider"></div>

                      <section class="launch-form-section">
                        <div class="launch-section-title">
                          <span class="launch-section-index success">02</span>
                          <div>
                            <h2>申报时间</h2>
                          </div>
                        </div>

                        <div class="launch-form-grid">
                          <el-form-item class="launch-inline-form-item" label="申报开始时间" prop="batch_apply_start">
                            <el-date-picker
                              v-model="launchForm.batch_apply_start"
                              class="launch-date-picker"
                              type="datetime"
                              format="YYYY-MM-DD HH:mm"
                              value-format="YYYY-MM-DD HH:mm"
                              placeholder="请选择申报开始时间"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>

                          <el-form-item class="launch-inline-form-item core-constraint-item" prop="batch_apply_deadline">
                            <template #label>
                              <span class="form-label-with-tag">
                                <span>申报截止时间</span>
                              </span>
                            </template>
                            <el-date-picker
                              v-model="launchForm.batch_apply_deadline"
                              class="launch-date-picker"
                              type="datetime"
                              format="YYYY-MM-DD HH:mm"
                              value-format="YYYY-MM-DD HH:mm"
                              placeholder="请选择申报截止时间"
                            />
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>
                        </div>
                      </section>

                    <LaunchPlanGantt />

                      <div class="launch-form-divider"></div>

                      <section class="launch-form-section">
                        <div class="launch-section-title">
                          <span class="launch-section-index violet">03</span>
                          <div>
                            <h2>指南与目标群体</h2>
                          </div>
                        </div>

                        <div class="launch-form-grid">
                          <el-form-item label="立项指南" prop="batch_guide_file">
                            <div class="launch-guide-file office-guide-file-view">
                              <span class="launch-guide-file-icon">
                                <el-icon><Document /></el-icon>
                              </span>
                              <span class="launch-guide-file-name">
                                {{ officeGuideBatch?.batch_guide_file?.name ?? '立项指南.pdf' }}
                              </span>
                              <span class="office-guide-file-meta">
                                PMO 上传 · {{ officeGuideBatch?.batch_guide_file?.size ?? '—' }}
                              </span>
                              <el-button type="primary" link @click.stop="previewOfficeGuideFile">
                                预览
                              </el-button>
                            </div>
                          </el-form-item>

                          <el-form-item label="目标群体" prop="target_groups">
                            <el-select
                              v-model="launchForm.target_groups"
                              multiple
                              collapse-tags
                              collapse-tags-tooltip
                              placeholder="请选择目标组织或人员群体"
                            >
                              <el-option
                                v-for="group in launchTargetGroupOptions"
                                :key="group"
                                :label="group"
                                :value="group"
                              />
                            </el-select>
                            <template #error="{ error }">
                              <span class="launch-form-error">{{ error }}</span>
                            </template>
                          </el-form-item>
                        </div>
                      </section>

                      <footer class="launch-form-footer">
                        <el-button @click="handleCancelLaunchInitiation">取消</el-button>
                        <el-button type="danger" plain @click="handleOfficeGuideReject">驳回</el-button>
                        <el-button type="primary" @click="handleOfficeGuideApprove">通过</el-button>
                      </footer>
                    </el-form>

                    <el-dialog
                      v-model="launchGuidePreviewVisible"
                      append-to-body
                      class="launch-guide-preview-dialog"
                      destroy-on-close
                      title="立项指南 PDF 预览"
                      width="72vw"
                      top="6vh"
                      @closed="revokeLaunchGuidePreviewUrl"
                    >
                      <div class="launch-guide-preview-body">
                        <iframe
                          v-if="launchGuidePreviewUrl"
                          class="launch-guide-preview-frame"
                          :src="launchGuidePreviewUrl"
                          title="立项指南 PDF 预览"
                        ></iframe>
                        <el-empty v-else description="暂无可预览文件" />
                      </div>

                      <template #footer>
                        <el-button @click="closeLaunchGuidePreview">关闭</el-button>
                      </template>
                    </el-dialog>
                  </section>
                </section>
              </template>
              <section
                v-else-if="officeActiveStage === 'formal'"
                class="office-guide-form-wrap"
                aria-label="形式审查"
              >
                <div class="office-stage-standby">
                  <span class="office-stage-standby-tag">形式审查待启动</span>
                  <span>立项指南发布已审批通过，形式审查任务待启动分配</span>
                </div>
                <InitiationDeclarationReview hide-flow-strip />
              </section>
              <section
                v-else-if="officeActiveStage === 'final'"
                class="final-review-page office-guide-form-wrap"
                aria-label="学部评审结果报告（只读）"
              >
<header class="formal-report-head">
                      <div>
                        <h2>评审结果报告</h2>
                        <p>{{ finalReviewReport.kicker }}</p>
                      </div>
                      <el-tag type="success" effect="light">{{ finalReviewReport.statusTag }}</el-tag>
                    </header>

                    <section class="formal-report-section">
                      <h3>评审基本信息</h3>
                      <el-descriptions :column="2" border>
                        <el-descriptions-item
                          v-for="item in finalReviewReport.info"
                          :key="item.label"
                          :label="item.label"
                        >
                          {{ item.value }}
                        </el-descriptions-item>
                      </el-descriptions>
                    </section>

                    <section class="formal-report-section">
                      <h3>结论概览</h3>
                      <div class="formal-report-summary">
                        <article>
                          <span>申报项目</span>
                          <strong>{{ finalReviewReport.overview.declared }}</strong>
                        </article>
                        <article>
                          <span>拟推荐进入复审</span>
                          <strong>{{ finalReviewReport.overview.recommended }}</strong>
                        </article>
                        <article>
                          <span>平均分</span>
                          <strong>{{ finalReviewReport.overview.average }}</strong>
                        </article>
                        <article>
                          <span>最高分</span>
                          <strong>{{ finalReviewReport.overview.highest }}</strong>
                        </article>
                      </div>
                    </section>

                    <section class="formal-report-section">
                      <h3>学部初审结果汇总表</h3>
                      <p class="final-weight-note">{{ finalReviewReport.weightNote }}</p>
                                            <el-table
                        ref="finalSummaryTableRef"
                        class="final-summary-table"
                        :data="finalReviewRows"
                        border
                        row-key="seq"
                        @selection-change="handleFinalSelectionChange"
                      >
                        <el-table-column prop="seq" label="推荐次序" width="88" align="center" />
                        <el-table-column prop="projectName" label="项目名称" min-width="240" show-overflow-tooltip />
                        <el-table-column prop="leader" label="项目负责人" width="96" />
                        <el-table-column prop="subDirection" label="所属子方向" width="100" />
                        <el-table-column label="评分结果" width="120" align="center">
                          <template #default="{ row }">
                            <div class="final-score-cell">
                              <strong>{{ row.score }}</strong>
                              <span>Z={{ row.zScore }}</span>
                            </div>
                          </template>
                        </el-table-column>
                        <el-table-column label="战略相关标注" width="112" align="center">
                          <template #default="{ row }">
                            <span class="strategic-star" :class="{ 'is-active': row.strategicStar }">战略相关</span>
                          </template>
                        </el-table-column>
                        <el-table-column prop="majorProject" label="对应计划申请的外部重大项目（学部战略牵引）" min-width="300" />
                        <el-table-column prop="reviewComment" label="具体评审意见" min-width="260" />
                        <el-table-column label="调整名次" width="88" align="center">
                          <template #default="{ row }">
                            <span
                              class="rank-change"
                              :class="row.rankChange === 'up' ? 'is-up' : row.rankChange === 'down' ? 'is-down' : ''"
                            >
                              {{ row.rankChange === 'up' ? '上升' : row.rankChange === 'down' ? '下降' : '-' }}
                            </span>
                          </template>
                        </el-table-column>
                        <el-table-column label="是否推荐立项" width="110" align="center">
                          <template #default="{ row }">
                            <el-tag :type="row.recommended ? 'success' : 'danger'" effect="light">
                              {{ row.recommended ? '推荐' : '不推荐' }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        
                      </el-table>
                    </section>

                    <section class="formal-report-section">
                      <h3>学部总体评语</h3>
                      <p class="final-overall-comment">{{ finalReviewReport.overallComment1 }}</p>
                      <p class="final-overall-comment">{{ finalReviewReport.overallComment2 }}</p>
                    </section>
              </section>
<section
                v-else-if="officeActiveStage === 'recheck'"
                class="office-guide-form-wrap recheck-stage-wrap"
                aria-label="复审阶段"
              >
                <nav class="recheck-sub-steps" aria-label="复审子步骤">
                  <button
                    type="button"
                    class="recheck-sub-step"
                    :class="{ active: officeRecheckSubStep === 'expert' }"
                    @click="selectOfficeRecheckSubStep('expert')"
                  >
                    <span class="recheck-sub-index">1</span>
                    <span class="recheck-sub-label">专家评委审核</span>
                  </button>
                  <button
                    type="button"
                    class="recheck-sub-step"
                    :class="{ active: officeRecheckSubStep === 'pptReview' }"
                    @click="selectOfficeRecheckSubStep('pptReview')"
                  >
                    <span class="recheck-sub-index">2</span>
                    <span class="recheck-sub-label">形式审查（答辩PPT材料复审）</span>
                  </button>
                </nav>

                <template v-if="officeRecheckSubStep === 'expert'">
                  <section class="subdirection-assign-page">
                    <ReviewerAssignmentPanel />
                  </section>
                </template>

                <template v-else>
                  <section class="recheck-ppt-review" aria-label="答辩PPT材料复审">
                    <header class="review-page-head">
                      <div>
                        <h1>形式审查・答辩PPT材料复审</h1>
                        <p class="review-batch-hint">
                          复审必收材料：各申报项目答辩 PPT（≤100MB），逐项核验材料完整性。
                        </p>
                      </div>
                    </header>
                    <el-table :data="recheckPptRows" border>
                      <el-table-column prop="projectName" label="项目名称" min-width="220" />
                      <el-table-column prop="leader" label="项目负责人" width="100" align="center" />
                      <el-table-column prop="pptFile" label="答辩PPT材料" min-width="180" />
                      <el-table-column prop="fileSize" label="材料大小" width="90" align="center" />
                      <el-table-column prop="submitTime" label="提交时间" width="150" align="center" />
                      <el-table-column label="材料复审结论" width="150" align="center">
                        <template #default="{ row }">
                          <el-select
                            v-if="!row.conclusion"
                            :model-value="row.conclusion"
                            size="small"
                            class="review-result-select"
                            placeholder="待复审"
                            aria-label="材料复审结论"
                            @change="handleRecheckPptConclusion(row, $event)"
                          >
                            <el-option label="通过" value="通过" />
                            <el-option label="不通过" value="不通过" />
                          </el-select>
                          <el-tooltip
                            v-else-if="row.conclusion === '不通过'"
                            :content="row.reason || '未填写不通过理由'"
                            placement="top"
                          >
                            <el-tag type="danger" effect="light">不通过</el-tag>
                          </el-tooltip>
                          <el-tag v-else type="success" effect="light">通过</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="110" align="center" fixed="right">
                        <template #default>
                          <el-button link type="primary" @click="openRecheckPptPreview">预览</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </section>
                </template>

                <el-dialog
                  v-model="recheckPptPreviewVisible"
                  append-to-body
                  class="launch-guide-preview-dialog"
                  destroy-on-close
                  title="答辩 PPT 材料预览"
                  width="72vw"
                  top="6vh"
                >
                  <div class="launch-guide-preview-body">
                    <iframe
                      class="launch-guide-preview-frame"
                      :src="recheckPptUrl"
                      title="答辩 PPT 材料预览"
                    ></iframe>
                  </div>
                  <template #footer>
                    <el-button @click="recheckPptPreviewVisible = false">关闭</el-button>
                  </template>
                </el-dialog>
              </section>

<section
                v-else-if="officeActiveStage === 'archive'"
                class="recheck-ppt-review"
                aria-label="立项入库"
              >
                <header class="review-page-head">
                  <div>
                    <h1>立项入库・项目列表</h1>
                    <p class="review-batch-hint">
                      学部复审推荐名单如下，管理办负责人审定通过后项目正式立项入库。
                    </p>
                  </div>
                </header>
                <el-table :data="officeArchiveRows" border>
                  <el-table-column type="index" label="序号" width="60" align="center" />
                  <el-table-column prop="projectName" label="项目名称" min-width="240" />
                  <el-table-column prop="leader" label="项目负责人" width="100" align="center" />
                  <el-table-column prop="subDirection" label="所属子方向" width="120" align="center" />
                  <el-table-column prop="score" label="评审得分" width="90" align="center" />
                  <el-table-column label="战略相关" width="96" align="center">
                    <template #default="{ row }">
                      <span
                        class="strategic-star"
                        :class="{ 'is-active': row.strategic }"
                      >战略相关</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="batchCode" label="所属批次" width="130" align="center" />
                  <el-table-column label="入库状态" width="100" align="center" fixed="right">
                    <template #default>
                      <el-tag type="warning" effect="light">待审定</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </section>

              <section v-else class="formal-report-section">
                <h3>审批内容</h3>
                <el-empty description="功能建设中（原型占位）" />
              </section>

              <!-- AN-MWVJNSJU：删除「上一环节/下一环节」导航按钮；AN-MWVIO2Y9：立项指南审批的操作在内嵌表单页脚，guide 阶段不再渲染外层页脚 -->
              <footer v-if="officeActiveStage !== 'guide'" class="formal-report-actions">
                <!-- AN-MWVFLWS6：形式审查结论已由行内下拉逐项确定，页脚只保留提交动作，生成形式审查报告并流转 -->
                <el-button
                  v-if="officeActiveStage === 'formal'"
                  type="primary"
                  @click="handleSubmitFormalReport"
                >
                  提交并生成形式审查报告
                </el-button>
                <!-- AN-MWVIPNLL：答辩PPT材料复审结论已由行内下拉逐项确定，页脚只保留提交动作，全部定完方可流转 -->
                <el-button
                  v-else-if="officeActiveStage === 'recheck'"
                  type="primary"
                  @click="handleSubmitRecheckResult"
                >
                  提交复审结果
                </el-button>
                <template v-else>
                  <el-button type="danger" plain @click="handleOfficeGuideReject">驳回</el-button>
                  <el-button type="primary" @click="handleOfficeGuideApprove">通过</el-button>
                </template>
              </footer>
              </template>

              <section v-else class="office-batch-pick" aria-label="选择立项批次">
                <header class="office-batch-pick-head">
                  <div>
                    <h1>项目审批 · 选择批次</h1>
                    <p>选择需要审批的立项批次，进入五阶段审批流程</p>
                  </div>
                </header>

                <section class="initiation-batch-grid" aria-label="审批批次列表">
                  <article
                    v-for="batch in initiationBatchMockRows"
                    :key="batch.id"
                    class="initiation-batch-card"
                    :class="getBatchCardClass(batch)"
                  >
                    <div class="batch-quarter-badge">
                      <strong>{{ batch.year }}</strong>
                      <span>第 {{ batch.quarter }} 季度</span>
                    </div>

                    <div class="batch-main-block">
                      <header class="batch-card-header">
                        <div class="batch-title-block">
                          <el-tooltip :content="batch.batchName" placement="top" :show-after="300">
                            <h2>{{ batch.batchName }}</h2>
                          </el-tooltip>
                          <p>批次编号：{{ batch.batchCode }}</p>
                        </div>
                      </header>

                      <div class="batch-progress-row" :class="{ finished: batch.status === '已结束' }">
                        <span>立项进度</span>
                        <div
                          class="batch-progress-track"
                          :class="{ finished: batch.status === '已结束' }"
                          :aria-label="`立项进度 ${getBatchProgressValue(batch)}%`"
                        >
                          <span class="batch-progress-fill" :style="getBatchProgressStyle(batch)"></span>
                        </div>
                        <strong>{{ getBatchProgressValue(batch) }}%</strong>
                      </div>
                    </div>

                    <div class="batch-row-meta">
                      <div>
                        <span>项目类别</span>
                        <strong>{{ batch.project_category }}</strong>
                      </div>
                      <div>
                        <span>申报周期</span>
                        <strong>{{ batch.applyPeriod }}</strong>
                      </div>
                      <div>
                        <span>已提交项目</span>
                        <strong>{{ batch.submittedProjectCount }}</strong>
                      </div>
                    </div>

                    <div class="batch-row-status">
                      <el-tag
                        v-if="batch.flowStage && batch.status !== '已结束'"
                        size="small"
                        effect="plain"
                        type="warning"
                      >
                        {{ getBatchFlowStageLabel(batch) }}
                      </el-tag>
                      <span v-else :class="getBatchStatusClass(batch)">{{ batch.status }}</span>
                    </div>

                    <footer class="batch-card-footer">
                      <el-button
                        class="batch-detail-button"
                        :type="batch.status === '申报中' ? 'primary' : 'default'"
                        @click="enterOfficeBatchApproval(batch)"
                      >
                        进入审批
                        <span aria-hidden="true">›</span>
                      </el-button>
                    </footer>
                  </article>

                  <el-empty
                    v-if="initiationBatchMockRows.length === 0"
                    class="batch-empty"
                    description="暂无可审批的立项批次"
                  />
                </section>
              </section>
            </section>

            <ProjectMemberMyProjects
              v-else-if="isProjectMemberMyProjectsFeature"
              :current-user="currentUser"
            />

            <ProjectMemberProjectDetail
              v-else-if="isProjectMemberMyProjectDetailFeature"
              :current-user="currentUser"
            />

            <ProjectApplicationProjects
              v-else-if="isProjectApplicationProjectsFeature"
              :current-user="currentUser"
            />

            <ProjectMemberProjectDetail
              v-else-if="isProjectApplicationProjectDetailFeature"
              :current-user="currentUser"
              back-path="/project-member/application-projects"
              hide-commitment
            />

            <AdminProjectRecruitmentOverview v-else-if="isAdminProjectRecruitmentOverviewFeature" />

            <ProjectRecruitmentManagement
              v-else-if="isProjectRecruitmentManagementFeature"
              :current-user="currentUser"
            />

            <ProjectRecruitmentApplications
              v-else-if="isProjectRecruitmentApplicationsFeature"
              :current-user="currentUser"
            />

            <ProjectRecruitmentMembers
              v-else-if="isProjectRecruitmentMembersFeature"
              :current-user="currentUser"
            />

            <ProjectParticipantRecruitment
              v-else-if="isProjectParticipantRecruitmentFeature"
              :role-key="currentRoleKey"
              :current-user="currentUser"
              :view="projectParticipantRecruitmentView"
            />

            <FinanceProjectDetailPage
              v-else-if="isFinanceProjectDetailFeature"
              :role-key="currentRoleKey"
              :current-user="currentUser"
            />

            <FinanceOverview
              v-else-if="isFinanceFeature"
              :view="financeViewKey"
              :role-key="currentRoleKey"
              :current-user="currentUser"
            />

            <QuarterlyReviewMeeting v-else-if="isQuarterlyReviewMeetingFeature" />

            <ReviewConfigDetail v-else-if="isReviewConfigDetailFeature || isReviewDataMaintenanceFeature" />

            <OwnerReviewLaunch v-else-if="isReviewLaunchFeature" />

            <OwnerProjectDetail v-else-if="isProjectDetailFeature" />

            <ProjectLibraryDetail v-else-if="isProjectLibraryDetailFeature" />

            <ProjectStartManagement v-else-if="isProjectStartFeature" />

            <ProjectChangeManagement v-else-if="isProjectChangeFeature" />

            <ProjectLibraryLedger v-else-if="isProjectLibraryFeature" />

            <OwnerMonitorProgress v-else-if="isProgressMonitoringFeature" />

            <MyReviewTasks v-else-if="isReviewerProjectReviewFeature" />

            <ReviewTaskDetail v-else-if="isReviewerProjectReviewDetailFeature" />

            <KyownerReviewProjects v-else-if="isKyownerProjectReviewFeature" />

            <SubdirectionReviewManagement v-else-if="isSubdirectionReviewManagementFeature" />

            <KyownerAnnouncementPublish v-else-if="isKyownerAnnouncementPublishFeature" />

            <AnnouncementPublish v-else-if="isAnnouncementPublishFeature" />

            <OwnerTemplate v-else-if="isTemplateListFeature" />

            <OwnerTemplateBuilder v-else-if="isTemplateNewFeature" />

            <section v-else class="feature-placeholder panel" aria-label="功能路由对应关系">
              <p class="overview-kicker">功能占位页</p>
              <h3 class="placeholder-title">{{ currentFeature?.name }}</h3>
              <p class="placeholder-text">当前页面暂不展开业务界面，只标记角色功能与二级路由的对应关系。</p>

              <div class="route-map" aria-label="当前功能路由">
                <div class="route-map-row">
                  <span>当前角色</span>
                  <strong>{{ currentRole?.name }}</strong>
                </div>
                <div class="route-map-row">
                  <span>当前功能</span>
                  <strong>{{ currentFeature?.name }}</strong>
                </div>
                <div class="route-map-row">
                  <span>二级路由</span>
                  <code class="route-path">{{ route.path }}</code>
                </div>
                <div class="route-map-row">
                  <span>路由名称</span>
                  <code class="route-path">{{ String(route.name) }}</code>
                </div>
              </div>
            </section>
          </div>
        </Transition>
      </section>
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 292px 1fr;
  background:
    radial-gradient(circle at 14% 8%, rgba(0, 113, 227, 0.12), transparent 30%),
    linear-gradient(180deg, #fbfdff 0%, #f5f7fb 100%);
  color: #1d1d1f;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 26px 18px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 12px 0 34px rgba(26, 39, 68, 0.05);
  backdrop-filter: blur(22px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  padding: 0 8px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  background: linear-gradient(145deg, #0071e3, #67b7ff);
  box-shadow: 0 12px 28px rgba(0, 113, 227, 0.22);
  font-weight: 800;
}

.brand-title {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0;
}

.brand-subtitle {
  margin: 4px 0 0;
  color: #86868b;
  font-size: 13px;
}

.sidebar-nav {
  display: grid;
  flex: 1;
  gap: 20px;
  align-content: start;
  min-height: 0;
  overflow-y: auto;
}

.home-button,
.feature-button {
  position: relative;
  display: flex;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  color: #424245;
  background: transparent;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.home-button {
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  font-size: 15px;
  font-weight: 750;
}

.feature-button {
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  font-size: 15px;
  font-weight: 750;
}

.home-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #0071e3;
  background: #eef6ff;
  font-size: 15px;
}

.function-icon {
  width: 34px;
  height: 34px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  color: #0071e3;
  background: #eef6ff;
  font-size: 16px;
  font-weight: 760;
  overflow: hidden;
}

.function-icon-image {
  width: 24px;
  height: 24px;
  display: block;
  object-fit: contain;
}

.function-icon-fallback {
  font-size: 13px;
  line-height: 1;
}

.home-button:hover,
.home-button-active,
.feature-button:hover,
.feature-button-active {
  border-color: rgba(0, 113, 227, 0.1);
  color: #0066cc;
  background: rgba(0, 113, 227, 0.08);
  box-shadow: 0 10px 28px rgba(0, 113, 227, 0.08);
  transform: translateY(-1px);
}

.nav-section {
  display: grid;
  gap: 10px;
}

.nav-section-title {
  margin: 0;
  padding: 0 10px;
  color: #6e6e73;
  font-size: 12px;
  font-weight: 760;
}

.function-nav {
  display: grid;
  gap: 8px;
}

.sidebar-footer {
  display: grid;
  gap: 12px;
  padding: 16px 8px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar-user {
  display: grid;
  gap: 3px;
  color: #1d1d1f;
}

.sidebar-user strong {
  font-size: 14px;
}

.sidebar-user span {
  color: #6e6e73;
  font-size: 12px;
}

.logout-button {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-weight: 750;
}

.workspace {
  min-width: 0;
  padding: 0 32px 32px;
}

.workspace-topbar {
  margin: 0 -32px 28px;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 36px;
  margin-bottom: 18px;
}

.breadcrumb-shell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.breadcrumb-back-button {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 113, 227, 0.1);
  color: #1f6fff;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 22px rgba(26, 39, 68, 0.05);
  backdrop-filter: blur(18px);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.breadcrumb-back-button:hover {
  border-color: rgba(31, 111, 255, 0.28);
  box-shadow: 0 12px 26px rgba(31, 111, 255, 0.1);
  transform: translateX(-1px);
}

.workspace-breadcrumb {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(0, 113, 227, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 22px rgba(26, 39, 68, 0.04);
  backdrop-filter: blur(18px);
}

/* AN-MWUF20S9：面包屑 action 项（如批次流转线「立项管理」）可点击返回，视觉与可跳转项一致 */
.workspace-breadcrumb :deep(.breadcrumb-action-item) {
  cursor: pointer;
}

.workspace-breadcrumb :deep(.breadcrumb-action-item .el-breadcrumb__inner) {
  color: #0071e3;
  font-weight: 600;
}

.workspace-breadcrumb :deep(.breadcrumb-action-item .el-breadcrumb__inner:hover) {
  text-decoration: underline;
}

.workspace-breadcrumb :deep(.el-breadcrumb__inner) {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 700;
}

.workspace-breadcrumb :deep(.el-breadcrumb__inner.is-link) {
  color: #424245;
  font-weight: 760;
}

.workspace-breadcrumb :deep(.el-breadcrumb__inner.is-link:hover) {
  color: #0066cc;
}

.workspace-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #0071e3;
}

.workspace-breadcrumb :deep(.el-breadcrumb__separator) {
  color: #b5bdc9;
}

.eyebrow,
.page-title,
.page-summary,
.overview-kicker,
.overview-title,
.panel-title,
.todo-title,
.stage-name,
.todo-meta,
.stage-owner,
.empty-text {
  margin: 0;
}

.eyebrow {
  margin-bottom: 8px;
  color: #0071e3;
  font-size: 13px;
  font-weight: 760;
}

.page-title {
  font-size: 30px;
  letter-spacing: 0;
}

.page-summary {
  margin-top: 8px;
  color: #6e6e73;
}

.ghost-action {
  border: 0;
  border-radius: 8px;
  font-weight: 750;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    filter 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.ghost-action {
  padding: 8px 12px;
  color: #0066cc;
  background: #eef6ff;
  white-space: nowrap;
}

.ghost-action:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.dashboard-body {
  display: grid;
  gap: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid rgba(0, 113, 227, 0.12);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(239, 247, 255, 0.88)),
    #fff;
  box-shadow: 0 18px 46px rgba(26, 39, 68, 0.07);
}

.overview-kicker {
  color: #0071e3;
  font-size: 13px;
  font-weight: 760;
}

.overview-title {
  margin-top: 5px;
  font-size: 18px;
  font-weight: 750;
}

.overview-status {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 8px;
  color: #0066cc;
  background: #eef6ff;
  font-size: 12px;
  font-weight: 760;
}

.feature-placeholder {
  padding: 24px;
}

.placeholder-title {
  margin: 6px 0 0;
  font-size: 24px;
  font-weight: 760;
}

.placeholder-text {
  margin: 10px 0 0;
  color: #6e6e73;
}

.route-map {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.route-map-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: #fbfdff;
}

.route-map-row span {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 650;
}

.route-path {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #0066cc;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 13px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card,
.panel {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.metric-card {
  padding: 18px;
}

.metric-label {
  display: block;
  color: #6e6e73;
  font-size: 13px;
}

.metric-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.route-value {
  font-size: 18px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
  gap: 20px;
}

.panel {
  padding: 20px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 18px;
}

.panel-note,
.empty-text {
  color: #6e6e73;
  font-size: 13px;
}

.empty-text {
  margin-top: 18px;
}

.todo-list,
.stage-list {
  display: grid;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: #fbfdff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.todo-item:hover {
  border-color: rgba(0, 113, 227, 0.18);
  box-shadow: 0 12px 26px rgba(0, 113, 227, 0.08);
  transform: translateY(-1px);
}

.todo-title,
.stage-name {
  font-weight: 750;
}

.todo-meta,
.stage-owner {
  margin-top: 5px;
  color: #6e6e73;
  font-size: 13px;
}

.stage-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border-radius: 8px;
  background: #f8fbff;
}

.stage-index {
  width: 30px;
  height: 30px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  color: #6e6e73;
  background: #ebedf0;
  font-weight: 800;
}

.stage-done .stage-index {
  color: #137333;
  background: #dff6e8;
}

.stage-active .stage-index {
  color: #8b5e00;
  background: #fff3c4;
}

.content-shift-enter-active,
.content-shift-leave-active {
  transition:
    opacity 0.22s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.content-shift-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.content-shift-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

@media (max-width: 1040px) {
  .app-shell,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    height: auto;
    padding: 20px;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .workspace {
    padding: 0 20px 20px;
  }

  .workspace-topbar {
    margin: 0 -20px 20px;
  }

  .workspace-header,
  .todo-item,
  .overview-card {
    align-items: stretch;
    flex-direction: column;
  }

  .breadcrumb-shell {
    width: 100%;
  }

  .workspace-breadcrumb {
    flex: 1;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .route-map-row {
    grid-template-columns: 1fr;
  }
}

.app-shell {
  --blue: #2563eb;
  --blue-dark: #164dc4;
  --blue-soft: #edf4ff;
  --text: #172033;
  --muted: #68748a;
  --line: #e8edf5;
  --surface: #ffffff;
  --canvas: #f5f7fb;
  --sidebar-width: 272px;
  --shadow: 0 8px 28px rgba(25, 45, 80, 0.07);
  width: 100%;
  min-height: 100dvh;
  height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  overflow: hidden;
  color: var(--text);
  background: var(--canvas);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}

.sidebar {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 14px 18px;
  border-right: 1px solid var(--line);
  background: #fff;
  box-shadow: 4px 0 20px rgba(34, 54, 84, 0.025);
}

.brand {
  height: 92px;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  margin: 0;
  padding: 0 14px;
  border-bottom: 1px solid #f0f3f8;
}

.brand-logo-shell {
  width: 100%;
  height: 39px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.brand-logo {
  display: block;
  width: 212px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  object-position: left center;
}

.brand-name {
  min-width: 0;
  line-height: 1;
}

.brand-name strong {
  display: block;
  max-width: 170px;
  margin-bottom: 5px;
  overflow: hidden;
  color: var(--text);
  font-size: 14px;
  font-weight: 720;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brand-name span {
  display: block;
  color: #7a879b;
  font-size: 12px;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.nav-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 17px 0 12px;
  scrollbar-width: none;
}

.nav-scroll::-webkit-scrollbar {
  display: none;
}

.nav-group {
  display: block;
  margin-bottom: 17px;
}

.nav-label {
  margin: 0 14px 7px;
  color: #a1aabc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.nav-item {
  position: relative;
  width: 100%;
  min-height: 45px;
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 2px 0;
  padding: 7px 12px;
  border: 0;
  border-radius: 10px;
  color: #4f5d72;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.nav-item:hover {
  color: var(--blue);
  background: #f5f8fe;
}

.nav-item.active {
  color: var(--blue-dark);
  background: linear-gradient(90deg, #eaf2ff 0%, #f3f7ff 100%);
  font-weight: 650;
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: -14px;
  width: 4px;
  height: 24px;
  border-radius: 0 4px 4px 0;
  background: var(--blue);
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: currentColor;
  background: transparent;
  font-size: 0;
  line-height: 0;
}

.nav-icon :deep(svg) {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: inherit;
  font-size: 14px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-arrow {
  margin-left: auto;
  color: #b6bfce;
  font-size: 20px;
  line-height: 1;
}

.role-group {
  padding-top: 8px;
  border-top: 1px solid #f0f3f8;
}

.role-select-label {
  display: block;
}

.role-select-shell {
  position: relative;
  width: 100%;
  margin: 2px 0;
}

.role-select {
  width: 100%;
  height: 42px;
  padding: 0 36px 0 12px;
  border: 1px solid #e2e8f1;
  border-radius: 10px;
  outline: none;
  color: #334057;
  background: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
  appearance: none;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.role-select:hover,
.role-select:focus {
  border-color: #cbdcf9;
  background: #f8fbff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
}

.role-select-arrow {
  position: absolute;
  top: 50%;
  right: 13px;
  color: #9aa5b6;
  font-size: 18px;
  line-height: 1;
  pointer-events: none;
  transform: translateY(-50%) rotate(90deg);
}

.sidebar-user {
  height: 65px;
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 0 10px;
  border-top: 1px solid #eef1f6;
}

.avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #1c55c6;
  background: #dce9ff;
  font-size: 13px;
  font-weight: 750;
}

.user-meta {
  min-width: 0;
}

.user-meta strong {
  display: block;
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta span {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: #8a96a9;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace {
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  background:
    radial-gradient(circle at 92% 5%, rgba(63, 124, 255, 0.07), transparent 22%),
    var(--canvas);
}

.workspace-topbar {
  flex: 0 0 auto;
  margin: 0;
}

.workspace-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 26px 32px 32px;
  scrollbar-width: thin;
}

.workspace-header {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 36px;
  margin: 0 0 18px;
}

.breadcrumb-shell {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.breadcrumb-back-button {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e7ef;
  color: #67748a;
  background: #fff;
  box-shadow: none;
  backdrop-filter: none;
}

.breadcrumb-back-button:hover {
  border-color: #cbdcf9;
  color: var(--blue);
  box-shadow: none;
  transform: none;
}

.workspace-breadcrumb {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.workspace-breadcrumb :deep(.el-breadcrumb__inner) {
  color: #8994a5;
  font-size: 13px;
  font-weight: 500;
}

.workspace-breadcrumb :deep(.el-breadcrumb__inner.is-link) {
  color: #697589;
  font-weight: 600;
}

.workspace-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #334057;
  font-weight: 650;
}

.workspace-breadcrumb :deep(.el-breadcrumb__separator) {
  color: #a6afbd;
}

.dashboard-body {
  display: block;
}

.module-landing {
  display: block;
}

.standard-feature-dock {
  overflow: hidden;
  padding: 18px 20px 20px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.055);
  backdrop-filter: blur(16px);
}

.standard-feature-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 15px;
}

.standard-feature-header h2 {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 820;
}

.standard-feature-header p {
  margin: 6px 0 0;
  color: #6f7f96;
  font-size: 13px;
  line-height: 1.65;
}

.standard-feature-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #3478e5;
  font-size: 12px;
  font-weight: 760;
}

.standard-feature-eyebrow::before {
  content: "";
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: #3478e5;
}

.standard-feature-tip {
  flex: 0 0 auto;
  max-width: 310px;
  margin-top: 4px;
  padding: 7px 12px;
  border: 1px solid #e5edf8;
  border-radius: 999px;
  color: #7c899d;
  background: #f7faff;
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
}

.standard-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.standard-feature-button {
  min-width: 0;
  min-height: 78px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px;
  border: 1px solid rgba(31, 111, 255, 0.11);
  border-radius: 10px;
  color: #172033;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88), 0 8px 18px rgba(26, 39, 68, 0.035);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

button.standard-feature-button {
  font: inherit;
}

.standard-feature-button:hover {
  border-color: rgba(31, 111, 255, 0.3);
  background: #fff;
  box-shadow: 0 14px 28px rgba(31, 111, 255, 0.1);
  transform: translateY(-1px);
}

.standard-feature-button:active {
  transform: translateY(0);
}

.feature-action-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 12px;
  color: #1f6fff;
  background: linear-gradient(145deg, #eaf4ff, #f6fbff);
}

.feature-action-image {
  width: 25px;
  height: 25px;
  object-fit: contain;
}

.feature-action-fallback {
  font-size: 14px;
  font-weight: 860;
}

.feature-action-body {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.feature-action-body strong {
  overflow: hidden;
  color: #172033;
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-action-body small {
  overflow: hidden;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.35;
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-action-body em {
  overflow: hidden;
  color: #9aa4b2;
  font-size: 11px;
  font-style: normal;
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-action-arrow {
  color: #9aa4b2;
  font-size: 15px;
  transition: color 0.2s ease, transform 0.2s ease;
}

.standard-feature-button:hover .feature-action-arrow {
  color: #1f6fff;
  transform: translateX(2px);
}

.workbench-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.workbench-card {
  min-width: 0;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(39, 64, 108, 0.055);
}

.workbench-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
}

.workbench-card-head h2 {
  margin: 0;
  color: #1c2c48;
  font-size: 17px;
  line-height: 1.35;
  font-weight: 730;
}

.workbench-card-head p {
  margin: 5px 0 0;
  color: #7d8ba1;
  font-size: 12px;
}

.workbench-shortcut-card {
  position: relative;
  overflow: hidden;
  padding: 18px 28px 15px;
}

.workbench-shortcut-window {
  overflow: hidden;
  margin: 13px 34px 0;
}

.workbench-shortcut-track {
  width: 200%;
  display: flex;
  transition: transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.workbench-shortcut-page {
  width: 50%;
  display: grid;
  flex: 0 0 50%;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  padding: 1px;
}

.workbench-shortcut-item {
  min-width: 0;
  min-height: 106px;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 8px;
  padding: 13px 9px 12px;
  border: 1px solid #e4ebf6;
  border-radius: 13px;
  color: #223452;
  background: #fbfdff;
  cursor: pointer;
  text-align: center;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

.workbench-shortcut-item:hover {
  border-color: #bdd2f5;
  background: #fff;
  box-shadow: 0 10px 22px rgba(35, 83, 158, 0.08);
  transform: translateY(-2px);
}

.workbench-shortcut-item:active {
  transform: translateY(0);
}

.workbench-shortcut-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #3478e5;
  background: #eef5ff;
  font-size: 20px;
}

.workbench-shortcut-page .workbench-shortcut-item:nth-child(2) .workbench-shortcut-icon,
.workbench-shortcut-page .workbench-shortcut-item:nth-child(6) .workbench-shortcut-icon {
  color: #23a574;
  background: #edf9f4;
}

.workbench-shortcut-page .workbench-shortcut-item:nth-child(3) .workbench-shortcut-icon,
.workbench-shortcut-page .workbench-shortcut-item:nth-child(4) .workbench-shortcut-icon {
  color: #806fe8;
  background: #f4f1ff;
}

.workbench-shortcut-page .workbench-shortcut-item:nth-child(5) .workbench-shortcut-icon {
  color: #d88b23;
  background: #fff6e8;
}

.workbench-shortcut-name {
  max-width: 100%;
  overflow: hidden;
  font-size: 14px;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-shortcut-note {
  max-width: 100%;
  overflow: hidden;
  color: #7b8799;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-carousel-arrow {
  position: absolute;
  z-index: 1;
  top: 96px;
  width: 30px;
  height: 30px;
  border-color: #dce7f5;
  color: #6f7f96;
  background: #fff;
  box-shadow: 0 6px 16px rgba(25, 45, 80, 0.08);
}

.workbench-carousel-arrow.prev {
  left: 16px;
}

.workbench-carousel-arrow.next {
  right: 16px;
}

.workbench-carousel-dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin-top: 13px;
}

.workbench-carousel-dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #cdd8e8;
  cursor: pointer;
  transition: width 0.18s ease, background 0.18s ease;
}

.workbench-carousel-dot.active {
  width: 22px;
  background: #3478e5;
}

.workbench-middle-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.72fr) minmax(420px, 1.28fr);
  gap: 16px;
  min-width: 0;
}

.workbench-news-card,
.workbench-todo-card,
.workbench-board-card {
  padding: 20px 22px;
}

.workbench-news-card,
.workbench-todo-card {
  min-height: 304px;
}

.workbench-news-card {
  padding: 18px 20px;
}

.workbench-todo-card {
  min-height: 344px;
  padding: 22px 24px;
}

.workbench-tabs {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border: 1px solid #e5ecf6;
  border-radius: 999px;
  background: #f6f9fe;
}

.workbench-tab-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 13px;
  border: 0;
  border-radius: 999px;
  color: #6f7f96;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  transition: color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.workbench-tab-button.active {
  color: #245dc9;
  background: #fff;
  box-shadow: 0 5px 14px rgba(39, 64, 108, 0.08);
}

.workbench-new-count {
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #fff;
  background: #ff6b57;
  font-size: 11px;
  line-height: 1;
}

.workbench-news-list {
  display: grid;
  gap: 3px;
  margin-top: 14px;
}

.workbench-news-row {
  min-width: 0;
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto 92px;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 0 8px;
  border: 0;
  border-radius: 10px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.18s ease, transform 0.18s ease;
}

.workbench-news-row:hover {
  background: #f5f8fd;
}

.workbench-news-row:active {
  transform: translateY(1px);
}

.workbench-news-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #c5cfdf;
}

.workbench-news-dot.fresh {
  background: #3478e5;
}

.workbench-news-title {
  min-width: 0;
  overflow: hidden;
  color: #223452;
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-news-title em {
  display: inline-flex;
  margin-left: 6px;
  padding: 1px 5px;
  border-radius: 999px;
  color: #e95340;
  background: #fff0ee;
  font-size: 10px;
  font-style: normal;
  font-weight: 760;
  vertical-align: middle;
}

.workbench-news-category {
  color: #7b8799;
  font-size: 12px;
  white-space: nowrap;
}

.workbench-news-row time {
  color: #8d98aa;
  font-size: 12px;
  text-align: right;
  white-space: nowrap;
}

.workbench-todo-list {
  display: grid;
  margin-top: 16px;
  border-top: 1px solid #e3ebf6;
}

.workbench-todo-item {
  position: relative;
  min-width: 0;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) 178px 192px 64px;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid #e3ebf6;
  border-radius: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.workbench-todo-item:hover {
  background: #f6faff;
}

.workbench-todo-item:active {
  background: #eef5ff;
}

.workbench-todo-tools {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #7a8799;
  font-size: 12px;
}

.workbench-todo-rule {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: 0;
  color: #3478e5;
  background: transparent;
  cursor: help;
  font: inherit;
  font-weight: 650;
}

.workbench-todo-rule span {
  display: inline-flex;
  width: 15px;
  height: 15px;
  align-items: center;
  justify-content: center;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 760;
}

.workbench-todo-priority {
  width: fit-content;
  min-width: 44px;
  justify-content: center;
  border: 0;
  font-weight: 720;
}

.workbench-todo-priority.priority-urgent {
  color: #d84f3f;
  background: #fff0ed;
}

.workbench-todo-priority.priority-high {
  color: #d88221;
  background: #fff6e8;
}

.workbench-todo-priority.priority-normal {
  color: #245dc9;
  background: #eef5ff;
}

:global(.workbench-todo-ai-tooltip) {
  max-width: 280px;
  line-height: 1.55;
}

.workbench-todo-copy {
  min-width: 0;
  display: block;
  overflow: hidden;
  color: #223452;
  font-size: 13px;
  font-weight: 680;
  line-height: 1.55;
  white-space: normal;
  word-break: break-word;
}

.workbench-todo-meta,
.workbench-todo-deadline {
  min-width: 0;
  overflow: hidden;
  color: #68788f;
  font-size: 12px;
  font-weight: 620;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-todo-deadline {
  color: #405776;
}

.workbench-todo-entry {
  color: #3478e5;
  font-size: 12px;
  font-weight: 720;
  text-align: right;
  white-space: nowrap;
}

.workbench-todo-entry::after {
  content: '›';
  margin-left: 4px;
}

.workbench-todo-item b {
  min-width: 31px;
  height: 31px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #245dc9;
  background: #eef5ff;
  font-size: 15px;
  font-weight: 760;
}

.workbench-year-select {
  width: 116px;
}

.workbench-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.82fr);
  gap: 18px;
  margin-top: 18px;
  min-width: 0;
}

.workbench-trend-panel,
.workbench-status-panel {
  min-width: 0;
  border: 1px solid #e7edf6;
  border-radius: 13px;
  background: #fbfdff;
}

.workbench-trend-panel {
  padding: 16px 16px 14px;
}

.workbench-status-panel {
  padding: 16px;
}

.workbench-metric-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.workbench-metric-item {
  min-width: 0;
  padding: 12px 13px;
  border: 1px solid #e8eef7;
  border-radius: 12px;
  background: #fff;
}

.workbench-metric-item span {
  display: block;
  overflow: hidden;
  color: #7b8799;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-metric-item strong {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-top: 7px;
  color: #1c2c48;
  font-size: 25px;
  line-height: 1;
  font-weight: 780;
}

.workbench-metric-item small {
  color: #7f8ca1;
  font-size: 12px;
  font-weight: 650;
}

.workbench-metric-item em {
  display: inline-block;
  margin-top: 8px;
  color: #23a574;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
}

.workbench-chart-heading,
.workbench-status-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.workbench-chart-heading h3,
.workbench-status-heading h3 {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: #223452;
  font-size: 14px;
  font-weight: 720;
}

.workbench-chart-heading span,
.workbench-status-heading span {
  color: #8a95a7;
  font-size: 12px;
}

.workbench-trend-svg {
  width: 100%;
  height: 190px;
  margin-top: 8px;
  overflow: visible;
}

.workbench-guide-line line {
  stroke: #e7edf6;
  stroke-width: 1;
}

.workbench-guide-line text {
  fill: #9aa7b8;
  font-size: 10px;
}

.workbench-trend-svg polygon {
  pointer-events: none;
}

.workbench-trend-svg polyline {
  fill: none;
  stroke: #3478e5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.workbench-trend-point circle {
  fill: #fff;
  stroke: #3478e5;
  stroke-width: 2.5;
}

.workbench-trend-point text {
  fill: #5f6f86;
  font-size: 11px;
  text-anchor: middle;
}

.workbench-trend-point .value {
  fill: #245dc9;
  font-weight: 760;
}

.workbench-status-heading {
  margin-top: 0;
}

.workbench-status-body {
  display: grid;
  grid-template-columns: 154px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}

.workbench-donut-wrap {
  position: relative;
  width: 154px;
  height: 154px;
}

.workbench-donut-svg {
  width: 154px;
  height: 154px;
  transform: rotate(-90deg);
}

.workbench-donut-bg,
.workbench-donut-segment {
  fill: none;
  stroke-width: 14;
}

.workbench-donut-bg {
  stroke: #edf2f8;
}

.workbench-donut-segment {
  stroke-linecap: round;
  transition:
    stroke-dasharray 0.28s ease,
    stroke-dashoffset 0.28s ease;
}

.workbench-donut-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
}

.workbench-donut-center strong {
  color: #1c2c48;
  font-size: 26px;
  line-height: 1;
  font-weight: 780;
}

.workbench-donut-center span {
  margin-top: 7px;
  color: #7d8ba1;
  font-size: 12px;
}

.workbench-status-list {
  display: grid;
  gap: 9px;
}

.workbench-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid #e7edf6;
  border-radius: 11px;
  background: #fff;
}

.workbench-status-row span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  color: #617088;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-status-row i {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
}

.workbench-status-row strong {
  color: #223452;
  font-size: 13px;
  white-space: nowrap;
}

@media (max-width: 1360px) {
  .workbench-shortcut-card {
    padding-right: 22px;
    padding-left: 22px;
  }

  .workbench-shortcut-window {
    margin-right: 28px;
    margin-left: 28px;
  }

  .workbench-shortcut-page {
    gap: 10px;
  }

  .workbench-middle-grid,
  .workbench-dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 980px) {
  .workbench-card-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .workbench-shortcut-page {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .workbench-metric-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workbench-news-row {
    grid-template-columns: 12px minmax(0, 1fr) 82px;
  }

  .workbench-news-category {
    display: none;
  }
}

@media (max-width: 720px) {
  .workbench-shortcut-page,
  .workbench-todo-list,
  .workbench-metric-row,
  .workbench-status-body {
    grid-template-columns: 1fr;
  }

  .workbench-todo-item {
    grid-template-columns: 1fr;
    align-items: flex-start;
    padding: 10px 12px;
  }

  .workbench-todo-copy {
    flex-wrap: wrap;
    white-space: normal;
  }

  .workbench-todo-count,
  .workbench-todo-entry {
    text-align: left;
  }

  .workbench-donut-wrap {
    justify-self: center;
  }
}

.module-hero {
  position: relative;
  min-height: 148px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 27px 30px;
  border: 1px solid #dbe8ff;
  border-radius: 17px;
  background: linear-gradient(118deg, #ffffff 0%, #f1f6ff 63%, #e7f0ff 100%);
  box-shadow: var(--shadow);
}

.module-hero::before,
.module-hero::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.module-hero::before {
  width: 190px;
  height: 190px;
  right: 24px;
  top: -94px;
  border: 34px solid rgba(57, 116, 237, 0.08);
}

.module-hero::after {
  width: 88px;
  height: 88px;
  right: 178px;
  bottom: -48px;
  background: rgba(79, 135, 245, 0.07);
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 760px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 10px;
  color: #4771b9;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.08em;
}

.eyebrow::before {
  content: "";
  width: 18px;
  height: 3px;
  border-radius: 3px;
  background: #4b82e9;
}

.module-hero h1 {
  margin: 0;
  color: var(--text);
  font-size: 26px;
  line-height: 1.25;
  font-weight: 720;
  letter-spacing: 0;
}

.module-hero p {
  max-width: 690px;
  margin: 10px 0 0;
  color: #64738a;
  font-size: 14px;
  line-height: 1.7;
}

.hero-badge {
  position: relative;
  z-index: 1;
  min-width: 136px;
  margin-right: 8px;
  padding: 15px 18px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 7px 20px rgba(56, 91, 150, 0.08);
  text-align: center;
  backdrop-filter: blur(8px);
}

.hero-badge strong {
  display: block;
  color: #245dc9;
  font-size: 25px;
  line-height: 1;
}

.hero-badge span {
  display: block;
  margin-top: 7px;
  color: #7b899d;
  font-size: 12px;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 24px 2px 14px;
}

.module-entry-card-grid {
  display: grid;
  gap: 16px;
}

.section-head h2 {
  margin: 0;
  color: var(--text);
  font-size: 17px;
  font-weight: 680;
}

.section-head p {
  margin: 6px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.permission-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #748096;
  font-size: 12px;
  white-space: nowrap;
}

.workflow-config-list-page {
  display: grid;
  gap: 16px;
}

.workflow-config-table-card {
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.workflow-config-table-card {
  min-width: 0;
  padding: 20px 22px;
}

.workflow-config-table-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.workflow-config-table-head h2 {
  margin: 0;
  color: var(--text);
  font-size: 18px;
  font-weight: 740;
}

.workflow-config-table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}

.workflow-config-table {
  --el-table-header-bg-color: #f6f8fc;
  --el-table-header-text-color: #526177;
  --el-table-row-hover-bg-color: #f7fbff;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  overflow: hidden;
}

.workflow-config-name-cell {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.workflow-config-name-cell strong {
  overflow: hidden;
  color: #203452;
  font-size: 14px;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-config-name-cell span,
.workflow-config-desc {
  overflow: hidden;
  color: #7d899d;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-config-desc {
  display: block;
}

.admin-application-hero {
  align-items: stretch;
}

.admin-batch-panel {
  position: relative;
  z-index: 1;
  min-width: 320px;
  min-height: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 22px;
  border: 1px solid rgba(255, 255, 255, 0.84);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 22px rgba(56, 91, 150, 0.08);
  backdrop-filter: blur(8px);
}

.admin-batch-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.admin-batch-meta div {
  min-width: 0;
}

.admin-batch-meta dt {
  margin: 0 0 5px;
  color: #8390a4;
  font-size: 11px;
  font-weight: 600;
}

.admin-batch-meta dd {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  color: #2f3b52;
  font-size: 13px;
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-batch-panel :deep(.el-button) {
  min-width: 116px;
  justify-content: center;
  margin-left: 0;
}

.admin-batch-panel :deep(.el-button + .el-button) {
  margin-left: 0;
}

.initiation-batch-filter-panel {
  margin-top: 16px;
  padding: 16px 20px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.batch-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.batch-filter-controls,
.batch-status-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.batch-keyword-input {
  width: 284px;
  flex: 0 0 284px;
}

.batch-filter-select {
  width: 120px;
  flex: 0 0 120px;
}

.batch-status-toggle {
  flex: 0 0 auto;
}

.batch-status-toggle :deep(.el-button) {
  min-width: 96px;
  margin-left: 0;
}

.batch-status-toggle :deep(.el-button + .el-button) {
  margin-left: 0;
}

.initiation-batch-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;
}

.initiation-batch-card {
  position: relative;
  min-width: 0;
  min-height: 108px;
  display: grid;
  grid-template-columns: 76px minmax(260px, 1.4fr) minmax(280px, 1fr) 104px 116px;
  align-items: center;
  gap: 20px;
  overflow: hidden;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 7px 22px rgba(27, 46, 77, 0.045);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.initiation-batch-card:hover {
  border-color: #cbdcf9;
  box-shadow: 0 14px 30px rgba(33, 71, 130, 0.09);
  transform: translateY(-2px);
}

.initiation-batch-card.current {
  border-color: #9cc5ff;
  box-shadow: 0 14px 30px rgba(58, 116, 232, 0.12);
}

.initiation-batch-card.current::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 15px 0 0 15px;
  background: #3478ee;
}

.batch-quarter-badge {
  width: 72px;
  min-height: 68px;
  display: grid;
  align-content: center;
  place-items: center;
  gap: 4px;
  border-radius: 12px;
  color: #61708a;
  background: #f3f6fb;
  text-align: center;
}

.batch-quarter-badge strong {
  color: #40506a;
  font-size: 16px;
  line-height: 1;
  font-weight: 760;
}

.batch-quarter-badge span {
  color: #7c899d;
  font-size: 11px;
}

.initiation-batch-card.current .batch-quarter-badge {
  color: #245dc9;
  background: #eaf2ff;
}

.initiation-batch-card.current .batch-quarter-badge strong,
.initiation-batch-card.current .batch-quarter-badge span {
  color: #245dc9;
}

.batch-main-block,
.batch-title-block {
  min-width: 0;
}

.batch-card-header {
  min-width: 0;
}

.batch-title-block h2 {
  overflow: hidden;
  margin: 0 0 6px;
  color: #26344d;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-title-block p {
  overflow: hidden;
  margin: 0;
  color: #97a2b3;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
}

.batch-status::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.batch-status-active {
  color: #246de2;
  background: #eaf2ff;
}

.batch-status-pending {
  color: #7a55d8;
  background: #f3edff;
}

.batch-status-finished {
  color: #16835d;
  background: #e8f7f1;
}

.batch-progress-row {
  display: grid;
  grid-template-columns: auto minmax(120px, 1fr) 44px;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.batch-progress-row span {
  color: #8a95a7;
  font-size: 12px;
  white-space: nowrap;
}

.batch-progress-row strong {
  color: #246de2;
  font-size: 12px;
  font-weight: 720;
  text-align: right;
  white-space: nowrap;
}

.batch-progress-row.finished strong {
  color: #16835d;
}

.batch-progress-track {
  position: relative;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf2f8;
}

.batch-progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #4e8df6 0%, #2f6feb 100%);
}

.batch-progress-track.finished .batch-progress-fill {
  background: linear-gradient(90deg, #31a879 0%, #58bf91 100%);
}

.batch-row-meta {
  display: grid;
  /* AN-MWVFHXNP：申报周期（2026.11.01-2026.12.20 长）与已提交项目重叠——
     4 列定义容纳 PMO/管理办的 4 项 meta，周期列加宽、字号降为正文尺寸 */
  grid-template-columns: minmax(150px, 1.3fr) minmax(118px, 1fr) minmax(64px, 0.5fr) minmax(64px, 0.5fr);
  gap: 12px 14px;
  min-width: 0;
  align-items: center;
  padding-left: 20px;
  border-left: 1px solid #edf1f7;
}

.batch-row-meta div {
  min-width: 0;
}

.batch-row-meta span {
  display: block;
  overflow: hidden;
  color: #99a4b5;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-row-meta strong {
  display: block;
  margin-top: 4px;
  color: #203452;
  font-size: 18px;
  line-height: 1;
  font-weight: 760;
  white-space: nowrap;
}

.batch-row-meta div:first-child strong {
  overflow: hidden;
  color: #556278;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.4;
  text-overflow: ellipsis;
}

/* AN-MWVFHXNP：申报周期为长日期串，18px 必然溢出叠到相邻列——降为正文尺寸并省略兜底 */
.batch-row-meta div:nth-child(2) strong {
  overflow: hidden;
  color: #203452;
  font-size: 12.5px;
  font-weight: 650;
  letter-spacing: -0.2px;
  line-height: 1.4;
  text-overflow: ellipsis;
}

.batch-row-meta div:nth-child(3) strong,
.batch-row-meta div:nth-child(4) strong {
  color: #16835d;
}

.batch-row-status {
  display: flex;
  justify-content: center;
}

.batch-card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0;
}

.batch-detail-button {
  min-width: 106px;
  min-height: 38px;
}

.batch-detail-button span {
  margin-left: 2px;
  font-size: 14px;
}

.batch-empty {
  grid-column: 1 / -1;
  padding: 42px 0;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
}

.batch-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  color: #7b8799;
  font-size: 12px;
}

.project-member-initiation-page,
.project-member-initiation-detail-page {
  display: grid;
  gap: 16px;
}

.project-member-initiation-detail-page {
  padding-bottom: 108px;
}

.leader-application-hero {
  align-items: center;
  overflow: hidden;
}

.leader-hero-illustration {
  position: relative;
  z-index: 1;
  width: 162px;
  height: 162px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 18px 40px rgba(52, 120, 238, 0.1);
}

.leader-hero-illustration::before {
  content: "";
  position: absolute;
  inset: 24px;
  border-radius: inherit;
  background: #edf4ff;
}

.leader-hero-document {
  position: relative;
  width: 46px;
  height: 56px;
  border: 1px solid #a7c8ff;
  border-radius: 12px;
  background: #f9fcff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.72);
}

.leader-hero-document::before,
.leader-hero-document::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  height: 2px;
  border-radius: 999px;
  background: #6c9df4;
}

.leader-hero-document::before {
  top: 18px;
  box-shadow: 0 10px 0 #6c9df4;
}

.leader-hero-document::after {
  top: 38px;
}

.leader-hero-check {
  position: absolute;
  right: 30px;
  bottom: 42px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  color: #fff;
  background: #3478ee;
  font-size: 14px;
  font-weight: 760;
}

.approval-application-hero {
  align-items: center;
}

.approval-role-switch-panel {
  flex: 0 0 auto;
  display: grid;
  gap: 10px;
  min-width: 260px;
  padding: 18px 20px;
  border: 1px solid rgba(201, 220, 250, 0.82);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 30px rgba(38, 92, 185, 0.08);
}

.approval-role-switch-panel > span {
  color: #7a879b;
  font-size: 12px;
  font-weight: 650;
}

.approval-role-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
}

.approval-role-switch-button {
  min-height: 34px;
  padding: 7px 14px;
  border: 1px solid #d8e4f4;
  border-radius: 999px;
  color: #53627a;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 680;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.approval-role-switch-button:hover {
  border-color: #a9c5f5;
  color: #245dc9;
  background: #f5f9ff;
}

.approval-role-switch-button.is-active {
  border-color: #3478ee;
  color: #fff;
  background: #3478ee;
  box-shadow: 0 8px 18px rgba(52, 120, 238, 0.18);
}

.leader-batch-list-panel {
  min-width: 0;
}

.leader-batch-list {
  display: grid;
  gap: 12px;
}

.leader-batch-empty {
  padding: 44px 0;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.leader-batch-error {
  border-radius: 12px;
}

.leader-batch-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  color: #7b8799;
  font-size: 12px;
}

.leader-batch-pagination :deep(.el-pagination) {
  --el-pagination-button-width: 30px;
  --el-pagination-button-height: 30px;
}

.leader-apply-sticky-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: var(--sidebar-width, 272px);
  z-index: 30;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0;
  padding: 16px 32px;
  border-top: 1px solid #e7edf6;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 -12px 30px rgba(27, 46, 77, 0.06);
  backdrop-filter: blur(18px);
}

.leader-apply-status {
  min-width: 0;
  display: grid;
  gap: 8px;
  color: #7b8799;
  font-size: 12px;
}

.leader-apply-status > div {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.leader-apply-status p {
  margin: 0;
  color: #74839a;
}

.leader-apply-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.leader-apply-actions :deep(.el-button) {
  min-width: 104px;
}

.leader-apply-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.leader-submit-button-wrap {
  display: inline-flex;
}

.leader-apply-form-placeholder {
  display: grid;
  gap: 16px;
}

.leader-apply-return {
  justify-self: start;
}

.project-application-page {
  display: grid;
  gap: 14px;
  padding-bottom: 90px;
}

.project-application-title-card,
.project-application-steps-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.project-application-title-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 26px;
}

.project-application-title-card h1 {
  margin: 0;
  color: #1f304a;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 760;
}

.project-application-title-card p {
  margin: 9px 0 0;
  color: #73829a;
  font-size: 13px;
}

.project-application-title-card p span {
  margin: 0 8px;
  color: #aeb7c5;
}

.project-application-status-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 5px 13px;
  border-radius: 999px;
  color: #687589;
  background: #f2f5f9;
  font-size: 12px;
  font-weight: 680;
}

.project-application-status-pill::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.project-application-steps-card {
  padding: 13px 28px 12px;
}

.project-application-steps-card :deep(.el-step__title) {
  color: #53627a;
  font-size: 13px;
  font-weight: 700;
}

.project-application-steps-card :deep(.el-step__title.is-process),
.project-application-steps-card :deep(.el-step__title.is-success) {
  color: #245dc9;
}

.project-application-tabs-card {
  min-width: 0;
}

.project-application-tabs {
  min-width: 0;
}

.project-application-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 4px;
}

.project-application-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #dfe7f2;
}

.project-application-tabs :deep(.el-tabs__item) {
  height: 42px;
  color: #627088;
  font-size: 14px;
  font-weight: 700;
}

.project-application-tabs :deep(.el-tabs__item.is-active) {
  color: #246de2;
}

.project-application-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: #3478ee;
}

.project-application-tabs :deep(.el-tabs__content) {
  padding-top: 14px;
}

.project-application-preview-pane {
  min-width: 0;
  display: grid;
  justify-items: center;
}

.project-application-preview-pane :deep(.application-pdf-preview-card) {
  width: min(100%, 960px);
}

.project-application-sticky-bar {
  position: sticky;
  bottom: 0;
  z-index: 7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 -32px -32px;
  padding: 18px 32px;
  border-top: 1px solid #e7edf6;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -12px 30px rgba(27, 46, 77, 0.06);
  backdrop-filter: blur(18px);
}

.project-application-footer-status {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.project-application-footer-status span {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  color: #fff;
  background: #aeb9c9;
}

.project-application-footer-status span::before {
  content: "!";
  font-size: 12px;
  font-weight: 800;
}

.project-application-footer-status span.completed {
  background: #35ad7b;
}

.project-application-footer-status span.completed::before {
  content: "✓";
}

.project-application-footer-status p {
  overflow: hidden;
  margin: 0;
  color: #6f7c91;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-application-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.project-application-actions :deep(.el-button) {
  min-width: 96px;
}

.project-application-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.launch-initiation-page {
  display: grid;
  gap: 14px;
}

.launch-page-titlebar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  min-width: 0;
}

.launch-page-titlebar h1 {
  margin: 0;
  color: var(--text);
  font-size: 26px;
  line-height: 1.2;
  font-weight: 760;
}

.launch-page-titlebar p {
  margin: 8px 0 0;
  color: #8190a5;
  font-size: 13px;
}

.launch-status-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 5px 13px;
  border: 1px solid #dce5f1;
  border-radius: 999px;
  color: #69788e;
  background: #f7faff;
  font-size: 12px;
  font-weight: 650;
}

.launch-status-pill::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8a99ad;
}

.launch-form-card {
  overflow: hidden;
  padding: 24px 30px 0;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.launch-form-card :deep(.el-form-item) {
  margin-bottom: 0;
}

.launch-form-card :deep(.el-form-item__label) {
  color: #35445d;
  font-size: 13px;
  font-weight: 680;
  line-height: 1.4;
}

.launch-form-card :deep(.el-input__wrapper),
.launch-form-card :deep(.el-select__wrapper),
.launch-form-card :deep(.el-textarea__inner) {
  border-radius: 8px;
}

.launch-form-card :deep(.el-input__wrapper),
.launch-form-card :deep(.el-select__wrapper) {
  min-height: 42px;
}

.launch-form-section {
  padding-bottom: 18px;
}

.launch-section-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.launch-section-title h2 {
  margin: 0;
  color: var(--text);
  font-size: 17px;
  line-height: 1.35;
  font-weight: 720;
}

.launch-section-title p {
  margin: 5px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.launch-section-index {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  color: #246de2;
  background: #eef5ff;
  font-size: 12px;
  font-weight: 760;
}

.launch-section-index.success {
  color: #16835d;
  background: #e8f7f1;
}

.launch-section-index.violet {
  color: #7254c8;
  background: #f2edff;
}

.launch-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 28px;
}

.launch-field-tip {
  margin: 7px 0 0;
  color: #8a95a7;
  font-size: 12px;
  line-height: 1.55;
}

.launch-full-form-item {
  margin-top: 18px;
}

.launch-form-error {
  display: inline-block;
  margin-top: 4px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.launch-input-number,
.launch-date-picker {
  width: 100%;
}

.form-label-with-tag {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.core-constraint-badge {
  padding: 2px 8px;
  border-radius: 999px;
  color: #c0611e;
  background: #fff0e6;
  font-size: 11px;
  font-weight: 700;
}

.core-constraint-item :deep(.el-input__wrapper) {
  background: #fffdfb;
  box-shadow: 0 0 0 1px #f2b893 inset;
}

.core-constraint-item :deep(.el-input__wrapper:hover),
.core-constraint-item :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #e58b4c inset;
}

.deadline-tip {
  color: #c46b2d;
}

.launch-form-divider {
  height: 1px;
  margin: 0 0 18px;
  background: #edf1f7;
}

.launch-inline-form-item :deep(.el-form-item__label) {
  display: inline-flex;
  align-items: center;
  height: 32px;
  margin-bottom: 0;
  justify-self: start;
  align-self: center;
  white-space: nowrap;
}

.launch-inline-form-item :deep(.el-form-item__content) {
  align-self: center;
}

.launch-inline-form-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.launch-inline-form-item :deep(.el-form-item__content) {
  flex: 1;
  margin-left: 0 !important;
}

.launch-richtext-shell {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.launch-richtext-shell:focus-within {
  border-color: #a0c4ff;
}

.launch-richtext-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 10px;
  border-bottom: 1px solid #e4e9f2;
  background: #f7f9fc;
}

.launch-richtext-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.launch-richtext-btn {
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #5d6b7f;
  font-size: 13px;
  cursor: pointer;
}

.launch-richtext-btn:hover {
  background: #e8edf5;
  color: #1f2d3d;
}

.launch-richtext-sep {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: #d5dce8;
}

.launch-richtext-count {
  margin-left: auto;
  color: #a0aab9;
  font-size: 12px;
}

.launch-richtext-editor {
  min-height: 96px;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: #1f2d3d;
  outline: none;
  background: #fff;
}

.launch-richtext-editor:empty::before {
  content: attr(data-placeholder);
  color: #c0c6d0;
}

.launch-budget-mode-field {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.launch-budget-mode-field .el-select {
  flex: 1;
  min-width: 0;
}

.launch-guide-upload-shell {
  width: 100%;
}

.launch-guide-upload :deep(.el-upload) {
  width: 100%;
}

.launch-guide-upload :deep(.el-upload-dragger) {
  min-height: 94px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 16px 18px;
  border-color: #cfdced;
  border-radius: 12px;
  background: #fbfdff;
  text-align: left;
}

.launch-guide-upload :deep(.el-upload-dragger:hover) {
  border-color: #8cb4f3;
  background: #f6faff;
}

.launch-upload-icon {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #246de2;
  background: #eef5ff;
  font-size: 20px;
}

.launch-upload-copy {
  min-width: 0;
  display: grid;
  gap: 5px;
  color: #8190a5;
  font-size: 12px;
  line-height: 1.45;
}

.launch-upload-copy strong {
  color: #344159;
  font-size: 13px;
  font-weight: 700;
}

.office-batch-context {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin-bottom: 16px;
  border: 1px solid #e5eaf3;
  border-radius: 12px;
  background: #f8fafc;
}

.office-batch-context-main {
  flex: 1;
  min-width: 0;
}

.admin-initiation-flow-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.admin-initiation-guide-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

/* AN-MWUF2MQ8：立项指南发布批次全字段表 */
.admin-guide-field-grid {
  margin-top: 14px;
}

.admin-guide-field-grid :deep(.el-descriptions__label) {
  width: 118px;
  color: #8492a6;
  font-weight: 600;
}

.admin-guide-field-grid + .launch-form-grid {
  margin-top: 16px;
}

.office-batch-context-main h2 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2d3d;
}

.office-batch-context-main p {
  margin: 0;
  font-size: 12.5px;
  color: #8492a6;
}

.office-batch-pick-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.office-batch-pick-head h1 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: #1f2d3d;
}

.office-batch-pick-head p {
  margin: 0;
  font-size: 13px;
  color: #8492a6;
}

.office-stage-standby {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 14px;
  border: 1px dashed #a0cfff;
  border-radius: 10px;
  background: rgba(236, 245, 255, 0.7);
  color: #344159;
  font-size: 13px;
}

.office-stage-standby-tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.office-status-pill--rejected {
  background: #fef0f0 !important;
  color: #f56c6c !important;
  border-color: #fbc4c4 !important;
}

.office-reject-note {
  margin: 0 0 14px;
  padding: 10px 14px;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  background: #fef0f0;
  color: #c45656;
  font-size: 13px;
  line-height: 1.6;
}

.launch-reject-banner {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
  padding: 12px 16px;
  border: 1px solid #fbc4c4;
  border-radius: 10px;
  background: #fef0f0;
  color: #c45656;
  font-size: 13px;
  line-height: 1.6;
}

.launch-reject-banner strong {
  font-size: 14px;
}

.launch-reject-banner em {
  font-style: normal;
  color: #909399;
}

.office-guide-file-view {
  width: 100%;
}

.office-guide-file-meta {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.launch-guide-file {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 11px;
  border: 1px solid #dfe8f5;
  border-radius: 8px;
  background: #fff;
}

.launch-guide-file-icon {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  color: #246de2;
  background: #eef5ff;
}

.launch-guide-file-name {
  min-width: 0;
  overflow: hidden;
  color: #344159;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.launch-guide-preview-dialog) {
  border-radius: 16px;
}

:global(.launch-guide-preview-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 22px 14px;
  border-bottom: 1px solid #edf1f7;
}

:global(.launch-guide-preview-dialog .el-dialog__title) {
  color: #26344d;
  font-size: 16px;
  font-weight: 720;
}

:global(.launch-guide-preview-dialog .el-dialog__body) {
  padding: 0;
}

:global(.launch-guide-preview-dialog .el-dialog__footer) {
  padding: 12px 22px 16px;
  border-top: 1px solid #edf1f7;
}

.launch-guide-preview-body {
  height: min(72vh, 760px);
  min-height: 520px;
  padding: 14px;
  background: #f5f8fc;
}

.launch-guide-preview-frame {
  width: 100%;
  height: 100%;
  display: block;
  border: 1px solid #dde6f2;
  border-radius: 12px;
  background: #fff;
}

.launch-form-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin: 8px -30px 0;
  padding: 14px 30px;
  border-top: 1px solid #edf1f7;
  background: #fbfdff;
}

.launch-form-footer :deep(.el-button) {
  min-width: 88px;
}

.batch-detail-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 16px 20px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.batch-detail-summary h2 {
  margin: 7px 0 5px;
  color: #26344d;
  font-size: 17px;
  font-weight: 720;
}

.batch-detail-summary p {
  margin: 0;
  color: #7b8799;
  font-size: 12px;
}

.batch-back-link {
  padding: 0;
  border: 0;
  color: #245dc9;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.batch-back-link:hover {
  color: #174aa7;
}

.batch-project-panel {
  margin-top: 16px;
}

.batch-project-panel .admin-table-actions {
  gap: 0;
}

.batch-project-panel .admin-table-actions :deep(.el-button) {
  margin-left: 0;
  padding: 0 10px;
  white-space: nowrap;
}

.batch-project-panel .admin-table-actions :deep(.el-button:first-child) {
  padding-left: 0;
}

.batch-project-panel .admin-table-actions :deep(.el-button + .el-button) {
  border-left: 1px solid #e4ebf5;
  border-radius: 0;
}

.batch-project-panel .admin-project-table :deep(.el-table__cell) {
  padding: 6px 0;
}

.batch-project-panel .admin-project-table :deep(.cell) {
  padding: 0 8px;
  line-height: 1.32;
}

.batch-project-panel .admin-project-name-cell,
.batch-project-panel .admin-two-line-cell {
  gap: 2px;
}

.batch-project-panel .admin-project-name,
.batch-project-panel .admin-project-name-cell span,
.batch-project-panel .admin-two-line-cell strong,
.batch-project-panel .admin-two-line-cell span {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.batch-project-panel .admin-project-name {
  font-size: 13px;
  line-height: 1.32;
}

.batch-project-panel .admin-project-name-cell span,
.batch-project-panel .admin-two-line-cell span,
.batch-project-panel .admin-two-line-cell strong {
  line-height: 1.35;
}

.batch-project-panel .admin-review-progress-cell {
  grid-template-columns: minmax(64px, 1fr) auto;
  gap: 7px;
}

.batch-project-panel .admin-table-actions {
  flex-wrap: nowrap;
  white-space: nowrap;
}

.batch-project-panel .admin-table-actions :deep(.el-button.is-disabled) {
  color: #a7b2c3;
  cursor: not-allowed;
}

.approval-batch-summary-side {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.approval-project-panel {
  margin-top: 14px;
}

.approval-stat-readonly {
  cursor: default;
}

.approval-stat-readonly:hover {
  border-color: #bdd2f5;
  color: #245dc9;
  background: #eef5ff;
}

.approval-project-table :deep(.el-table__cell) {
  padding: 6px 0;
}

.approval-project-table :deep(.cell) {
  padding: 0 8px;
}

.approval-table-actions {
  flex-wrap: nowrap;
}

.subdirection-assign-page {
  min-width: 0;
}

.formal-report-page {
  display: grid;
  gap: 18px;
  padding: 6px 0 18px;
}



.formal-report-body {
  display: grid;
  gap: 18px;
}

.formal-report-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e3ecf7;
  border-radius: 10px;
  background: #f8fbff;
}

.formal-report-head h2 {
  margin: 0 0 6px;
  color: #152b4f;
  font-size: 17px;
}

.formal-report-head p {
  margin: 0 0 6px;
  color: #5f6f86;
  font-size: 13px;
}

.formal-report-version {
  color: #237a4e;
  font-size: 12px;
  font-weight: 600;
}

.formal-report-section {
  display: grid;
  gap: 10px;
}

.formal-report-section h3 {
  margin: 0;
  padding-left: 10px;
  border-left: 3px solid #3478e5;
  color: #152b4f;
  font-size: 14px;
}

/* AN-MWVFRNN7/S94C：学部复审报告/立项入库页的报告说明条 */
.formal-report-note {
  margin: 4px 0 0;
  padding: 9px 12px;
  border-radius: 6px;
  background: #f5f8fd;
  color: #5b6f8d;
  font-size: 12.5px;
  line-height: 1.7;
}

.formal-report-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.formal-report-summary article {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid #e3ecf7;
  border-radius: 10px;
  background: #fff;
}

.formal-report-summary span {
  color: #7b8ba4;
  font-size: 12px;
}

.formal-report-summary strong {
  color: #152b4f;
  font-size: 15px;
}

.formal-report-summary em {
  color: #98a6bb;
  font-size: 12px;
  font-style: normal;
}

.approval-dialog-body {
  display: grid;
  gap: 18px;
}

.approval-dialog-project {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid #e2ebf6;
  border-radius: 12px;
  background: #f8fbff;
}

.approval-dialog-project span {
  color: #8190a5;
  font-size: 12px;
}

.approval-dialog-project strong {
  color: #25344d;
  font-size: 15px;
  line-height: 1.45;
}

.approval-dialog-project p {
  margin: 0;
  color: #7b8799;
  font-size: 12px;
}

.approval-decision-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.approval-decision-group :deep(.el-radio-button__inner) {
  min-width: 104px;
  border-radius: 8px !important;
}

.initiation-project-detail-page {
  display: grid;
  gap: 16px;
}

.initiation-project-detail-hero,
.initiation-project-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.initiation-project-detail-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 24px;
}

.initiation-project-title-block {
  min-width: 0;
}

.initiation-project-title-block h1 {
  min-width: 0;
  overflow: hidden;
  margin: 8px 0 8px;
  color: #1f304a;
  font-size: 24px;
  line-height: 1.28;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.initiation-project-title-block p {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  color: #73829a;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.initiation-project-title-block p span {
  margin: 0 8px;
  color: #aeb7c5;
}

.initiation-project-hero-side {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.initiation-project-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 16px;
  align-items: start;
}

.initiation-project-main,
.initiation-project-aside {
  min-width: 0;
  display: grid;
  gap: 16px;
}

.initiation-project-card {
  padding: 20px 22px;
}

.initiation-project-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.initiation-project-card-header h2 {
  margin: 0;
  color: #1f304a;
  font-size: 17px;
  font-weight: 760;
}

.initiation-project-card-header p {
  margin: 6px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.initiation-project-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}

.initiation-project-field-grid div {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #edf1f7;
  border-radius: 12px;
  background: #fbfdff;
}

.initiation-project-field-grid dt {
  margin: 0 0 7px;
  color: #8a95a7;
  font-size: 12px;
}

.initiation-project-field-grid dd {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  color: #263855;
  font-size: 14px;
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.initiation-material-list {
  display: grid;
  gap: 10px;
}

.initiation-material-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e3ebf6;
  border-radius: 12px;
  background: #fbfdff;
}

.material-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  color: #246de2;
  background: #eef5ff;
  font-size: 11px;
  font-weight: 800;
}

.material-icon.word {
  color: #16835d;
  background: #e8f7f1;
}

.initiation-material-item strong,
.initiation-material-item p {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.initiation-material-item strong {
  display: block;
  color: #263855;
  font-size: 13px;
  font-weight: 700;
}

.initiation-material-item p {
  margin: 5px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.initiation-project-steps {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.initiation-project-step {
  position: relative;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 10px;
  padding-bottom: 18px;
}

.initiation-project-step:last-child {
  padding-bottom: 0;
}

.initiation-project-step::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 18px;
  bottom: 0;
  width: 1px;
  background: #dfe7f2;
}

.initiation-project-step:last-child::before {
  display: none;
}

.step-dot {
  position: relative;
  z-index: 1;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  border: 4px solid #eef2f7;
  border-radius: 999px;
  background: #aeb9c9;
}

.initiation-project-step.is-done .step-dot {
  border-color: #e8f7f1;
  background: #35ad7b;
}

.initiation-project-step.is-active .step-dot {
  border-color: #eaf2ff;
  background: #3478ee;
  box-shadow: 0 0 0 4px rgba(52, 120, 238, 0.08);
}

.initiation-project-step strong {
  color: #263855;
  font-size: 13px;
  font-weight: 720;
}

.initiation-project-step p {
  margin: 5px 0 0;
  color: #7b8799;
  font-size: 12px;
  line-height: 1.55;
}

.detail-review-progress {
  display: grid;
  gap: 14px;
}

.detail-review-progress :deep(.el-progress-bar__outer) {
  background: #edf1f7;
}

.detail-review-numbers {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f7faff;
}

.detail-review-numbers span {
  color: #8a95a7;
  font-size: 12px;
}

.detail-review-numbers strong {
  color: #263855;
  font-size: 18px;
  font-weight: 760;
}

.detail-action-stack {
  display: grid;
  gap: 10px;
}

.detail-action-stack :deep(.el-button) {
  width: 100%;
  margin-left: 0;
}

.admin-application-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 286px;
  gap: 16px;
  align-items: start;
  margin-top: 16px;
}

.admin-project-panel,
.admin-tools-panel {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.admin-project-panel {
  overflow: hidden;
}

.admin-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 15px;
}

.admin-panel-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 17px;
  font-weight: 700;
}

.admin-panel-header p {
  margin: 6px 0 0;
  color: #8a95a7;
  font-size: 12px;
  line-height: 1.55;
}

.admin-panel-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.admin-panel-actions :deep(.el-button) {
  margin-left: 0;
}

.workflow-config-status-tag {
  min-width: 72px;
  justify-content: center;
  border-radius: 999px;
}

.admin-batch-filter {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.admin-filter-select {
  width: 108px;
}

.admin-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.admin-stat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 5px 10px;
  border: 1px solid #e1e8f3;
  border-radius: 999px;
  color: #687589;
  background: #f8fafd;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}

.admin-stat-tag strong {
  color: #344159;
  font-size: 13px;
}

.admin-stat-tag:hover,
.admin-stat-tag.active {
  border-color: #bdd2f5;
  color: #245dc9;
  background: #eef5ff;
}

.admin-stat-tag.active strong {
  color: #245dc9;
}

.admin-submit-tip {
  flex: 0 0 auto;
  padding: 5px 9px;
  border: 1px solid #e3eaf4;
  border-radius: 999px;
  color: #7b8799;
  background: #f8fafc;
  font-size: 12px;
  white-space: nowrap;
}

.admin-project-table {
  width: 100%;
}

.admin-project-table :deep(.el-table__header th) {
  color: #6f7c91;
  background: #f8fafd;
  font-weight: 650;
}

.admin-project-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.admin-project-name-cell,
.admin-two-line-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.admin-project-name {
  min-width: 0;
  overflow: hidden;
  padding: 0;
  border: 0;
  color: #2f3b52;
  background: transparent;
  font: inherit;
  font-weight: 660;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.admin-project-name:hover {
  color: #245dc9;
}

.admin-project-name-cell span,
.admin-two-line-cell span {
  min-width: 0;
  overflow: hidden;
  color: #8a95a7;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-two-line-cell strong {
  min-width: 0;
  overflow: hidden;
  color: #344159;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-tag {
  border-radius: 999px;
  font-weight: 650;
}

.node-tag-orange {
  border-color: #f2d6b6;
  color: #a25b13;
  background: #fff7ed;
}

.node-tag-purple {
  border-color: #ded4f6;
  color: #6953b8;
  background: #f5f1ff;
}

.node-tag-blue {
  border-color: #c9dcfa;
  color: #245dc9;
  background: #eef5ff;
}

.node-tag-green {
  border-color: #cbe8dc;
  color: #177452;
  background: #edf9f3;
}

.admin-review-progress-cell {
  display: grid;
  grid-template-columns: minmax(54px, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.admin-review-progress {
  min-width: 0;
}

.admin-review-progress :deep(.el-progress-bar__outer) {
  background: #edf1f7;
}

.admin-review-progress :deep(.el-progress-bar__inner) {
  background: #4b82e9;
}

.admin-review-progress-cell span {
  color: #657186;
  font-size: 12px;
  white-space: nowrap;
}

.admin-table-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.admin-more-button {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #697589;
}

.admin-project-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  color: #7b8799;
  font-size: 12px;
}

.admin-project-pagination :deep(.el-pagination) {
  --el-pagination-button-width: 30px;
  --el-pagination-button-height: 30px;
}

.admin-tools-header {
  margin-bottom: 14px;
}

.admin-tool-list {
  display: grid;
  gap: 12px;
}

.admin-tool-card {
  padding: 15px;
  border: 1px solid #e4ebf5;
  border-radius: 13px;
  background: #fbfdff;
}

.admin-tool-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.admin-tool-card h3 {
  margin: 0;
  color: #344159;
  font-size: 14px;
  font-weight: 700;
}

.admin-tool-card-head span {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  color: #245dc9;
  background: #eef5ff;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
}

.admin-tool-card p {
  margin: 9px 0 12px;
  color: #7b8799;
  font-size: 12px;
  line-height: 1.6;
}

.admin-tool-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  color: #245dc9;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.admin-tool-link span {
  font-size: 15px;
  line-height: 1;
  transition: transform 0.18s ease;
}

.admin-tool-link:hover span {
  transform: translateX(3px);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.function-card {
  box-sizing: border-box;
  min-width: 0;
  min-height: 124px;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 24px;
  border: 1px solid #c9d9ed;
  border-radius: 14px;
  color: #152640;
  background: #fff;
  box-shadow: 0 4px 16px rgba(43, 85, 140, 0.06);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

button.function-card {
  width: 100%;
  font: inherit;
}

.function-card:hover {
  border-color: #8eb8fb;
  box-shadow: 0 8px 22px rgba(43, 85, 140, 0.1);
  transform: translateY(-2px);
}

.function-card:active {
  transform: translateY(0);
}

.function-card:focus-visible {
  outline: 2px solid #357df3;
  outline-offset: 3px;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.function-icon {
  width: 64px;
  height: 64px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #d3e3f8;
  border-radius: 16px;
  color: #357df3;
  background: #edf5ff;
  font-size: 20px;
  font-weight: 760;
  transition:
    color 0.16s ease,
    background-color 0.16s ease,
    border-color 0.16s ease;
}

.function-icon-image {
  width: 38px;
  height: 38px;
  display: block;
  object-fit: contain;
  transition: filter 0.16s ease;
}

.card-title {
  overflow: hidden;
  display: block;
  min-width: 0;
  margin: 0;
  color: #152640;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.enter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  justify-content: flex-end;
  margin: 0;
  color: #357df3;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  transition:
    color 0.16s ease,
    transform 0.16s ease;
}

.enter span {
  font-size: 16px;
  line-height: 1;
  transition: transform 0.16s ease;
}

.function-card:hover .function-icon {
  color: #fff;
  border-color: #357df3;
  background: #357df3;
}

.function-card:hover .function-icon-image {
  filter: brightness(0) invert(1);
}

.function-card:hover .enter {
  color: #2369dd;
  transform: translateX(2px);
}

.function-card:hover .enter span {
  transform: translateX(2px);
}

.panel {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
  backdrop-filter: none;
}

.overview-kicker {
  margin: 0;
  color: #4771b9;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.08em;
}

.placeholder-title {
  margin: 8px 0 0;
  color: var(--text);
  font-size: 22px;
  font-weight: 720;
}

.placeholder-text {
  margin: 10px 0 0;
  color: #64738a;
  font-size: 14px;
  line-height: 1.7;
}

.route-map {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.route-map-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fbfdff;
}

.route-map-row span {
  color: #7b8799;
  font-size: 13px;
  font-weight: 650;
}

.route-map-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-path {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--blue-dark);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 13px;
}

.content-shift-enter-active,
.content-shift-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.content-shift-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.content-shift-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 1180px) {
  .app-shell {
    --sidebar-width: 246px;
  }

  .initiation-batch-card {
    grid-template-columns: 76px minmax(0, 1fr) auto 112px;
    align-items: start;
  }

  .batch-row-meta {
    grid-column: 2 / -1;
    grid-template-columns: minmax(140px, 1.2fr) minmax(104px, 1fr) minmax(60px, 0.5fr) minmax(60px, 0.5fr);
    gap: 12px;
    padding: 14px 0 0;
    border-top: 1px solid #edf1f7;
    border-left: 0;
  }

  .batch-row-status {
    justify-content: flex-start;
  }

  .batch-card-footer {
    grid-column: 4;
    grid-row: 1;
  }

  .admin-application-layout {
    grid-template-columns: 1fr;
  }

  .initiation-project-detail-layout {
    grid-template-columns: 1fr;
  }

  .initiation-project-aside {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-tools-panel {
    order: 2;
  }

  .admin-tool-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .card-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .standard-feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-badge {
    display: none;
  }
}

@media (max-width: 900px) {
  .app-shell {
    height: auto;
    min-height: 100dvh;
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .sidebar {
    height: auto;
    max-height: 52dvh;
  }

  .workspace {
    height: auto;
    min-height: 100dvh;
  }

  .workspace-content {
    overflow: visible;
    padding: 22px 22px 28px;
  }

  .leader-apply-sticky-bar {
    left: 0;
    right: 0;
    padding: 14px 22px;
  }

  .batch-filter-row {
    align-items: stretch;
  }

  .batch-filter-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .batch-keyword-input {
    flex: 1 1 260px;
  }

  .batch-status-toggle {
    width: 100%;
    justify-content: flex-start;
  }

  .launch-form-grid {
    grid-template-columns: 1fr;
  }

  .admin-batch-panel {
    min-width: 300px;
  }

  .admin-tool-list {
    grid-template-columns: 1fr;
  }

  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .standard-feature-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .standard-feature-tip {
    max-width: 100%;
    white-space: normal;
  }

  .standard-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .brand {
    height: 76px;
  }

  .module-hero {
    align-items: flex-start;
    flex-direction: column;
    min-height: auto;
    padding: 22px;
  }

  .standard-feature-dock {
    padding: 16px;
  }

  .standard-feature-grid {
    grid-template-columns: 1fr;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .function-card {
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 8px 14px;
    min-height: 104px;
    padding: 18px;
  }

  .card-top {
    grid-row: 1 / 3;
    align-self: center;
  }

  .function-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
  }

  .function-icon-image {
    width: 32px;
    height: 32px;
  }

  .card-title {
    font-size: 17px;
  }

  .enter {
    grid-column: 2;
    justify-content: flex-start;
  }

  .admin-batch-panel {
    width: 100%;
    min-width: 0;
  }

  .initiation-batch-card {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .batch-quarter-badge {
    width: 100%;
    min-height: auto;
    grid-template-columns: auto auto;
    justify-content: flex-start;
    padding: 11px 12px;
    text-align: left;
  }

  .batch-row-meta {
    grid-column: auto;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .batch-row-meta div:first-child {
    grid-column: 1 / -1;
  }

  .batch-row-status,
  .batch-card-footer {
    justify-content: flex-start;
  }

  .batch-card-footer {
    grid-column: auto;
    grid-row: auto;
  }

  .batch-detail-button {
    width: 100%;
  }

  .batch-filter-controls,
  .batch-status-toggle,
  .batch-status-toggle :deep(.el-button),
  .batch-filter-controls :deep(.el-button) {
    width: 100%;
  }

  .batch-keyword-input,
  .batch-filter-select {
    width: 100%;
    flex-basis: 100%;
  }

  .launch-page-titlebar,
  .launch-form-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .launch-form-card {
    padding-right: 20px;
    padding-left: 20px;
  }

  .launch-form-footer {
    margin-right: -20px;
    margin-left: -20px;
    padding-right: 20px;
    padding-left: 20px;
  }

  .launch-form-footer :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }

  .leader-apply-sticky-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .leader-apply-actions {
    width: 100%;
  }

  .leader-apply-actions :deep(.el-button),
  .leader-submit-button-wrap {
    flex: 1;
    min-width: 0;
  }

  .launch-guide-file {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .admin-batch-meta,
  .admin-panel-header,
  .admin-list-toolbar,
  .admin-project-pagination {
    align-items: flex-start;
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .admin-batch-filter {
    width: 100%;
  }

  .initiation-project-detail-hero,
  .initiation-project-hero-side {
    align-items: flex-start;
    flex-direction: column;
  }

  .initiation-project-hero-side {
    width: 100%;
  }

  .initiation-project-hero-side :deep(.el-button) {
    width: 100%;
  }

  .initiation-project-title-block h1,
  .initiation-project-title-block p {
    white-space: normal;
  }

  .initiation-project-field-grid,
  .initiation-project-aside {
    grid-template-columns: 1fr;
  }

  .initiation-material-item {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .initiation-material-item :deep(.el-button) {
    grid-column: 2;
    justify-self: start;
  }

  .admin-filter-select {
    width: 50%;
  }

  .section-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .permission-tip {
    white-space: normal;
  }

  .card-grid,
  .route-map-row {
    grid-template-columns: 1fr;
  }
}

/* OA visual polish layer: keep business structure unchanged */
.app-shell {
  --blue: #3478e5;
  --blue-dark: #1f63d6;
  --blue-soft: #eef5ff;
  --text: #17233d;
  --muted: #6b7890;
  --line: #dfe8f5;
  --surface: #ffffff;
  --canvas: #f4f7fc;
  --shadow: 0 16px 40px rgba(31, 73, 125, 0.07);
  background:
    radial-gradient(circle at 92% 4%, rgba(52, 120, 229, 0.1), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, var(--canvas) 46%, #f2f6fb 100%);
}

.sidebar {
  border-right-color: rgba(215, 225, 240, 0.9);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 251, 255, 0.95) 100%);
  box-shadow:
    1px 0 0 rgba(255, 255, 255, 0.78) inset,
    10px 0 32px rgba(31, 73, 125, 0.045);
}

.brand {
  border-bottom-color: rgba(223, 232, 245, 0.9);
}

.nav-label {
  color: #98a5b8;
}

.nav-item {
  border-radius: 12px;
  transition:
    color 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
    background 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.nav-item:hover {
  color: var(--blue);
  background: rgba(52, 120, 229, 0.07);
  transform: translateX(2px);
}

.nav-item.active {
  color: var(--blue-dark);
  background: linear-gradient(90deg, #eaf3ff 0%, rgba(247, 251, 255, 0.98) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(52, 120, 229, 0.08),
    0 8px 18px rgba(52, 120, 229, 0.08);
}

.nav-item.active::before {
  width: 3px;
  height: 26px;
  background: linear-gradient(180deg, #5b9dff 0%, var(--blue) 100%);
  box-shadow: 0 6px 12px rgba(52, 120, 229, 0.28);
}

.nav-icon {
  border-radius: 10px;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.nav-item:hover .nav-icon,
.nav-item.active .nav-icon {
  background: rgba(52, 120, 229, 0.1);
}

.nav-arrow {
  transition:
    color 0.18s ease,
    transform 0.18s ease;
}

.nav-item:hover .nav-arrow,
.nav-item.active .nav-arrow {
  color: rgba(52, 120, 229, 0.72);
  transform: translateX(2px);
}

.role-select {
  border-color: #dfe7f2;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 5px 14px rgba(31, 73, 125, 0.035);
}

.role-select:hover,
.role-select:focus {
  border-color: rgba(52, 120, 229, 0.32);
  background: #fff;
  box-shadow:
    0 0 0 3px rgba(52, 120, 229, 0.1),
    0 8px 20px rgba(52, 120, 229, 0.08);
}

.sidebar-user {
  border-top-color: rgba(223, 232, 245, 0.96);
}

.avatar {
  color: #1f63d6;
  background: linear-gradient(180deg, #edf5ff 0%, #dbeaff 100%);
  box-shadow: inset 0 0 0 1px rgba(52, 120, 229, 0.08);
}

.workspace {
  background:
    radial-gradient(circle at 91% 2%, rgba(52, 120, 229, 0.1), transparent 25%),
    radial-gradient(circle at 18% 18%, rgba(93, 156, 255, 0.045), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f4f7fc 42%, #f1f5fb 100%);
}

.workspace-content {
  scrollbar-color: rgba(119, 137, 165, 0.42) transparent;
}

.breadcrumb-back-button {
  border-color: #dfe7f2;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 18px rgba(31, 73, 125, 0.055);
}

.breadcrumb-back-button:hover {
  border-color: rgba(52, 120, 229, 0.3);
  color: var(--blue);
  background: #fff;
  box-shadow: 0 10px 24px rgba(52, 120, 229, 0.1);
  transform: translateY(-1px);
}

.workspace-breadcrumb :deep(.el-breadcrumb__inner.is-link) {
  color: #53657f;
}

.workspace-breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #17233d;
}

.standard-feature-dock,
.workbench-card,
.panel,
.module-hero {
  border-color: rgba(223, 232, 245, 0.98);
  background: rgba(255, 255, 255, 0.93);
  box-shadow: var(--shadow);
}

.standard-feature-dock,
.workbench-card,
.panel {
  backdrop-filter: blur(14px) saturate(1.08);
}

.module-hero {
  border-color: rgba(203, 220, 249, 0.82);
  background:
    radial-gradient(circle at 91% 8%, rgba(52, 120, 229, 0.1), transparent 22%),
    linear-gradient(118deg, #ffffff 0%, #f4f8ff 66%, #edf5ff 100%);
}

.module-hero::before {
  border-color: rgba(52, 120, 229, 0.07);
}

.module-hero::after {
  background: rgba(52, 120, 229, 0.06);
}

.standard-feature-button,
.workbench-shortcut-item {
  border-color: rgba(218, 228, 242, 0.95);
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 8px 20px rgba(31, 73, 125, 0.045);
}

.standard-feature-button:hover,
.workbench-shortcut-item:hover {
  border-color: rgba(52, 120, 229, 0.32);
  background: #fff;
  box-shadow: 0 16px 34px rgba(52, 120, 229, 0.12);
}

.feature-action-icon,
.workbench-shortcut-icon {
  border: 1px solid rgba(52, 120, 229, 0.08);
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.86), transparent 36%),
    linear-gradient(145deg, #eaf4ff 0%, #f7fbff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.workbench-news-row,
.workbench-todo-row {
  border-radius: 12px;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.workbench-news-row:hover,
.workbench-todo-row:hover {
  background: #f8fbff;
  box-shadow: inset 0 0 0 1px rgba(52, 120, 229, 0.08);
  transform: translateX(2px);
}

.admin-project-panel,
.batch-detail-summary,
.initiation-batch-filter-panel,
.leader-batch-list-panel,
.leader-batch-summary-card,
.leader-batch-detail-card,
.launch-form-card,
.workflow-config-table-card,
.initiation-project-card,
.member-project-detail-card,
.library-detail-card,
.finance-card {
  border-color: rgba(223, 232, 245, 0.98);
  box-shadow: var(--shadow);
}

.initiation-batch-card,
.leader-batch-card {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 10px 26px rgba(31, 73, 125, 0.055);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.initiation-batch-card:hover,
.leader-batch-card:hover {
  border-color: rgba(52, 120, 229, 0.32);
  box-shadow: 0 16px 34px rgba(52, 120, 229, 0.11);
  transform: translateY(-1px);
}

@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .standard-feature-button,
  .function-card,
  .workbench-shortcut-item,
  .workbench-news-row,
  .workbench-todo-row,
  .initiation-batch-card,
  .leader-batch-card {
    transition: none;
  }
}
.approval-flow-steps {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 18px;
  padding: 14px 18px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #ffffff;
}

.approval-flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.approval-flow-step:not(:last-child)::after {
  content: '';
  flex: 1;
  height: 1px;
  margin: 0 10px;
  background: #dfe4ec;
}

.approval-flow-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border: 1px solid #dfe4ec;
  border-radius: 50%;
  background: #f7f9fc;
  color: #98a2b3;
  font-size: 12px;
  font-weight: 700;
}

.approval-flow-label {
  color: #98a2b3;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.approval-flow-step.done .approval-flow-index {
  border-color: #b7d8c5;
  background: #e9f5ee;
  color: #237a4e;
}

.approval-flow-step.done .approval-flow-label {
  color: #237a4e;
}

.approval-flow-step.active .approval-flow-index {
  border-color: #2f6f4f;
  background: #237a4e;
  color: #ffffff;
}

.approval-flow-step.active .approval-flow-label {
  color: #1d5b3f;
  font-weight: 780;
}

.batch-stage-select-panel {
  display: grid;
  gap: 22px;
  min-width: 0;
  padding: 26px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #ffffff;
}

.batch-stage-select-head h2 {
  margin: 0;
  color: #273142;
  font-size: 19px;
  font-weight: 800;
}

.batch-stage-select-head p {
  margin: 6px 0 0;
  color: #8a93a6;
  font-size: 13px;
}

.batch-stage-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 16px;
}

.batch-stage-card {
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 20px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #fcfdff;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.batch-stage-card:hover {
  border-color: #b9c6da;
  box-shadow: 0 2px 10px rgba(38, 58, 90, 0.08);
}

.batch-stage-card h3 {
  margin: 0;
  color: #273142;
  font-size: 16px;
  font-weight: 780;
}

.batch-stage-card p {
  margin: 0;
  color: #8a93a6;
  font-size: 13px;
  line-height: 1.7;
}

.batch-stage-card > span {
  color: #2f6f4f;
  font-size: 13px;
  font-weight: 700;
}

.batch-stage-actions {
  display: flex;
  justify-content: flex-end;
}

.formal-report-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.final-review-page {
  display: grid;
  gap: 0;
  min-width: 0;
  padding: 26px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #ffffff;
}

.final-review-page > .approval-flow-steps {
  margin-bottom: 14px;
}

.final-review-page > .final-sub-steps {
  margin-bottom: 18px;
}

.final-assign-intro {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
  padding: 16px 18px;
  border: 1px solid #e5eaf3;
  border-radius: 12px;
  background: #f8fafc;
}

.final-assign-intro h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2d3d;
}

.final-assign-intro p {
  margin: 0;
  color: #6b7688;
  font-size: 12.5px;
  line-height: 1.7;
}

.final-weight-note {
  margin: 0 0 12px;
  padding: 10px 14px;
  border-left: 3px solid #c8d4e4;
  background: #f7f9fc;
  color: #6b7688;
  font-size: 12px;
  line-height: 1.8;
}

.final-batch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.final-batch-actions > span {
  color: #8a93a6;
  font-size: 13px;
  font-weight: 600;
}

.final-score-cell {
  display: grid;
  gap: 2px;
}

.final-score-cell strong {
  color: #273142;
  font-size: 13px;
  font-weight: 780;
}

.final-score-cell span {
  color: #8a93a6;
  font-size: 12px;
}

.final-overall-comment {
  margin: 0 0 10px;
  color: #57606f;
  font-size: 13px;
  line-height: 1.8;
}

/* AN-MWUFAJRV：推荐汇总表行内编辑样式 */
.final-rank-input {
  width: 72px;
}

.final-summary-table--editable :deep(.el-input__inner),
.final-summary-table--editable :deep(.el-textarea__inner) {
  font-size: 12px;
}

.final-row-move-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* AN-MWUG2PQ5/AN-MWUG3BER：PMO 初审阶段（三学部汇总）与复审阶段（指派+监控）样式 */
.pmo-stage-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.pmo-stage-head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.pmo-stage-head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #8492a6;
}

.pmo-stage-head-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pmo-final-faculty-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.pmo-final-faculty-tab-count {
  margin-left: 4px;
  font-size: 11px;
  color: #67c23a;
}

.pmo-final-faculty-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #606266;
}

.pmo-final-score-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.3;
}

.pmo-final-score {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.pmo-final-zscore {
  font-size: 11px;
  color: #8492a6;
}

.pmo-final-muted {
  color: #c0c4cc;
}

.pmo-recheck-intro {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  background: #f4f4f5;
  font-size: 12px;
  color: #606266;
}

.pmo-recheck-reviewer-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.pmo-recheck-progress-text {
  margin-top: 2px;
  font-size: 11px;
  color: #8492a6;
}

/* 学部复议登记对话框 */
.pmo-recheck-dialog-tip {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  background: #fdf6ec;
  font-size: 12px;
  line-height: 1.6;
  color: #b88230;
}

.final-project-link {
  font-weight: 650;
}

.pmo-recheck-register-list {
  max-height: 340px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.pmo-recheck-register-group + .pmo-recheck-register-group {
  margin-top: 8px;
}

.pmo-recheck-register-group h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.pmo-recheck-register-group .el-checkbox {
  display: flex;
  width: 100%;
  height: auto;
  margin-right: 0;
}

.pmo-recheck-register-group :deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.5;
  font-size: 12px;
}

.final-review-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid #edf0f4;
  margin-top: 4px;
}

.final-review-sign {
  display: flex;
  align-items: center;
  gap: 12px;
}

.final-review-sign span {
  color: #6b7688;
  font-size: 13px;
  font-weight: 600;
}
.faculty-recommend-report-dialog :deep(.el-dialog__body) {
  max-height: 74vh;
  overflow-y: auto;
}

.faculty-report-signers {
  margin: 6px 0 0;
  color: #6b7688;
  font-size: 13px;
  font-weight: 600;
}
.recheck-sub-steps {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
}

.recheck-sub-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 18px;
  border: 1px solid #d4e0f5;
  border-radius: 999px;
  background: #ffffff;
  color: #52627a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recheck-sub-step:hover {
  border-color: #4b82e9;
  color: #2f6ad9;
}

.recheck-sub-step.active {
  border-color: #2f6ad9;
  background: #2f6ad9;
  color: #ffffff;
}

.recheck-sub-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(47, 106, 217, 0.1);
  color: #2f6ad9;
  font-size: 12px;
  font-weight: 700;
}

.recheck-sub-step.active .recheck-sub-index {
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
}

.recheck-ppt-review {
  background: #ffffff;
  border: 1px solid #e3ebf7;
  border-radius: 14px;
  padding: 22px 24px;
}

.office-guide-form-wrap {
  min-width: 0;
}

.office-approval-page {
  display: grid;
  gap: 0;
  min-width: 0;
  padding: 26px;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #ffffff;
}

.strategic-star {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px;
  border: 1px solid #d5dae3;
  border-radius: 14px;
  background: #f4f6f9;
  color: #9aa3b2;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.strategic-star.is-active {
  border-color: #237a4e;
  background: #eaf7f0;
  color: #237a4e;
  font-weight: 760;
}

.strategic-star:hover {
  border-color: #237a4e;
  color: #237a4e;
}

.final-row--draggable {
  cursor: grab;
}

.final-row--draggable:active {
  cursor: grabbing;
}

.rank-change {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  background: #f4f6f9;
  color: #9aa3b2;
}

.rank-change.is-up {
  background: #eaf7f0;
  color: #237a4e;
}

.rank-change.is-down {
  background: #fdeeee;
  color: #c45656;
}

.approval-flow-step--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.approval-flow-step--clickable:hover {
  border-color: #409eff;
  transform: translateY(-1px);
}

.approval-flow-step--clickable:active {
  transform: translateY(0);
}

/* FD-MWVNYLE8：未流转环节不可跳转——禁用态置灰、去 hover 交互 */
.approval-flow-step:disabled,
.approval-flow-step.locked {
  cursor: not-allowed;
  opacity: 0.45;
}

.approval-flow-step--clickable:disabled:hover,
.approval-flow-step--clickable.locked:hover {
  border-color: inherit;
  transform: none;
  box-shadow: none;
}

/* FD-MWU1XD2J：字段说明 ℹ 角标（hover 显示 title） */
.field-doc-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 4px;
  border-radius: 50%;
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  line-height: 1;
  cursor: help;
  vertical-align: middle;
}

.office-approval-page > .approval-flow-steps {
  margin-bottom: 22px;
}
</style>
