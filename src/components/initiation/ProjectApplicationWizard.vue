<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, shallowRef, watch } from 'vue'
import { Back, DocumentChecked, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { InitiationBatchMockRow } from '../../dataset/initiationProjectsMock'
import type { LoggedInUser } from '../../types/auth'
import HandwrittenSignaturePad from './HandwrittenSignaturePad.vue'
import {
  cloneWizardState,
  createAnnualPlan,
  createDefaultWizardState,
  createParticipantRow,
  formatFillMonth,
  loadWizardDraft,
  saveWizardDraft,
  wizardStages,
  wizardSteps,
  type ApplicationParticipant,
  type ProjectApplicationWizardState,
  type StepStatus,
} from '../../dataset/projectApplicationWizardMock'

interface MissingResult {
  label: string
  stepIndex: number
}

type BudgetAmountKey = 'equipment' | 'purchase' | 'business' | 'labor'
type BudgetNoteKey = 'equipmentNote' | 'purchaseNote' | 'businessNote' | 'laborNote'

interface BudgetRow {
  key: BudgetAmountKey
  noteKey: BudgetNoteKey
  subject: string
  tip: string
}

const props = defineProps<{
  batch: InitiationBatchMockRow
  currentUser: LoggedInUser | null
}>()

const emit = defineEmits<{
  back: []
}>()

const activeStep = shallowRef(0)
const previewVisible = shallowRef(false)
const lastSavedText = shallowRef('内容将自动保存到本地草稿')
const invalidStepIndexes = shallowRef<Set<number>>(new Set())
const hasSubmitTried = shallowRef(false)
const application = reactive<ProjectApplicationWizardState>(
  createDefaultWizardState(props.batch, props.currentUser),
)

let autoSaveTimer: number | undefined
let hydrating = false

const genderOptions = ['男', '女', '其他']
const educationOptions = ['博士研究生', '博士', '硕士研究生', '硕士', '本科']
const projectDirectionOptions = ['AI核心', 'AI × 科学技术', 'AI × 人文社科'] as const
const budgetRows: BudgetRow[] = [
  {
    key: 'equipment',
    noteKey: 'equipmentNote',
    subject: '1. 设备费',
    tip: '例如：设备费总额 X 万元，其中学院算力配额外租用算力 X 万元',
  },
  {
    key: 'purchase',
    noteKey: 'purchaseNote',
    subject: '其中：设备购置费',
    tip: '设备购置费属于设备费明细，不重复计入预算合计',
  },
  {
    key: 'business',
    noteKey: 'businessNote',
    subject: '2. 业务费',
    tip: '例如：材料费 X 万元、差旅费 X 万元、会议费 X 万元',
  },
  {
    key: 'labor',
    noteKey: 'laborNote',
    subject: '3. 劳务费',
    tip: '劳务费原则上不超过预算总额的 30%',
  },
]

const batchDisplayName = computed(() => props.batch.batch_name ?? props.batch.batchName)
const batchDisplayCode = computed(() => props.batch.batch_code ?? props.batch.batchCode)
const batchDeadline = computed(() => props.batch.batch_apply_deadline ?? props.batch.applyPeriod)
const currentStepDefinition = computed(() => wizardSteps[activeStep.value])
const currentStageIndex = computed(() =>
  wizardStages.findIndex((stage) => stage.steps.includes(activeStep.value)),
)
const budgetTotal = computed(() => {
  return normalizeMoney(application.budget.equipment) +
    normalizeMoney(application.budget.business) +
    normalizeMoney(application.budget.labor)
})
const laborRatio = computed(() => {
  if (budgetTotal.value <= 0) {
    return 0
  }

  return (normalizeMoney(application.budget.labor) / budgetTotal.value) * 100
})
const isLaborRatioInvalid = computed(() => laborRatio.value > 30)
const overallCompletion = computed(() => {
  const total = wizardSteps.reduce((sum, _step, index) => sum + getStepCompletion(index), 0)

  return Math.round(total / wizardSteps.length)
})
const incompleteStepCount = computed(() =>
  wizardSteps.filter((_step, index) => getStepCompletion(index) < 100).length,
)
const currentStepMissingItems = computed(() => getStepMissing(activeStep.value).map((item) => item.label))
const coverSyncLines = computed(() => [
  {
    label: '项目名称',
    value: application.projectName || '尚未填写',
  },
  {
    label: '项目负责人',
    value: application.applicantName || '尚未填写',
  },
  {
    label: '填报时间',
    value: formatFillMonth(application.fillDate),
  },
])
const previewSections = computed(() => [
  {
    title: '基本信息表',
    body: [
      `项目方向：${displayText(application.projectDirection)}`,
      `项目类别：${displayText(application.projectCategory)}`,
      `单位名称：${displayText(application.unitName)}`,
      `申请人：${displayText(application.applicantName)}`,
      `研究周期：${application.researchPeriod || '尚未填写'} 年`,
      `首年经费预算：${application.firstYearBudget || 0} 万元`,
      `内容摘要：${displayText(application.abstract)}`,
    ].join('\n'),
  },
  {
    title: '一、研究目的和意义简述',
    body: [application.purposeSignificance, application.researchStatus].filter(Boolean).join('\n\n'),
  },
  {
    title: '二、主要研究内容',
    body: [
      application.mainWork,
      application.keyProblem,
      application.technicalDifficulty,
      application.technicalRoute,
      application.methodInnovation,
    ]
      .filter(Boolean)
      .join('\n\n'),
  },
  {
    title: '三、研究基础',
    body: [
      application.applicantBackground,
      application.researchFoundation,
      application.teamProfile,
      application.implementationExperience,
    ]
      .filter(Boolean)
      .join('\n\n'),
  },
  {
    title: '四、年度研究任务和实施方案',
    body: application.annualPlans
      .map((plan) =>
        [
          plan.yearLabel,
          plan.researchTasks,
          plan.implementationPlan,
          plan.cooperationMode,
          plan.studentTrainingGoal,
        ]
          .filter(Boolean)
          .join('\n'),
      )
      .filter(Boolean)
      .join('\n\n'),
  },
  {
    title: '五、总体考核指标',
    body: [
      application.overallGoal,
      application.annualGoal,
      application.expectedOutcomes,
      application.impact,
      application.talentDevelopment,
      application.otherIndicators,
    ]
      .filter(Boolean)
      .join('\n\n'),
  },
  {
    title: '六、参加人员名单',
    body: application.participants
      .map((member) =>
        `${member.category}：${displayText(member.name)} / ${displayText(member.unit)} / ${displayText(member.responsibility)}`,
      )
      .join('\n'),
  },
  {
    title: '七、经费预算表',
    body: `设备费 ${formatMoney(application.budget.equipment)} 万元；其中设备购置费 ${formatMoney(application.budget.purchase)} 万元；业务费 ${formatMoney(application.budget.business)} 万元；劳务费 ${formatMoney(application.budget.labor)} 万元。预算合计 ${formatMoney(budgetTotal.value)} 万元。`,
  },
  {
    title: '八、算力说明',
    body:
      application.specialCompute === 'no'
        ? '无特殊算力需求。'
        : [
            application.computeScale,
            application.computePeriod,
            application.computeEnvironment,
            application.computePurposeReason,
          ]
            .filter(Boolean)
            .join('\n'),
  },
  {
    title: '九、项目经费使用承诺书',
    body: application.consent
      ? '已阅读并确认承诺书内容，签名信息将渲染到正式申报书。'
      : '尚未确认承诺书。',
  },
])

watch(
  () => [props.batch.id, props.currentUser?.id],
  () => {
    hydrateDraft()
  },
  {
    immediate: true,
  },
)

watch(
  () => [
    application.applicantName,
    application.unitName,
    application.gender,
    application.professionalTitle,
  ],
  () => {
    syncLeaderParticipant()
  },
)

watch(
  application,
  () => {
    if (!hydrating) {
      scheduleAutoSave()
    }
  },
  {
    deep: true,
  },
)

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }
})

function hydrateDraft() {
  hydrating = true
  const draft = loadWizardDraft(props.batch, props.currentUser)

  Object.assign(application, cloneWizardState(draft))
  syncLeaderParticipant()
  invalidStepIndexes.value = new Set()
  hasSubmitTried.value = false
  activeStep.value = 0
  lastSavedText.value = '内容将自动保存到本地草稿'
  hydrating = false
}

function scheduleAutoSave() {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }

  lastSavedText.value = '正在自动保存...'
  autoSaveTimer = window.setTimeout(() => {
    saveDraft(false)
  }, 650)
}

function saveDraft(showMessage = true) {
  syncLeaderParticipant()
  saveWizardDraft(props.batch.id, props.currentUser, application)
  lastSavedText.value = `已保存 ${new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

  if (showMessage) {
    ElMessage.success('草稿已保存')
  }
}

function saveCurrentStep() {
  saveDraft(true)
}

function goToStep(index: number) {
  saveDraft(false)
  activeStep.value = Math.max(0, Math.min(wizardSteps.length - 1, index))
}

function goPrevStep() {
  if (activeStep.value === 0) {
    return
  }

  goToStep(activeStep.value - 1)
}

function saveAndGoNext() {
  saveDraft(false)

  if (activeStep.value === wizardSteps.length - 1) {
    submitApplication()
    return
  }

  goToStep(activeStep.value + 1)
}

function openPreview() {
  saveDraft(false)
  previewVisible.value = true
}

function submitApplication() {
  hasSubmitTried.value = true
  const validation = validateApplication()

  if (validation) {
    invalidStepIndexes.value = validation.invalidSteps
    activeStep.value = validation.firstStep
    ElMessage.warning(validation.message)
    return
  }

  invalidStepIndexes.value = new Set()
  saveDraft(false)
  ElMessage.success('原型校验通过')
}

function validateApplication() {
  const allMissing = wizardSteps.flatMap((_step, index) => getStepMissing(index))

  if (allMissing.length > 0) {
    return {
      firstStep: allMissing[0].stepIndex,
      invalidSteps: new Set(allMissing.map((item) => item.stepIndex)),
      message: `第 ${allMissing[0].stepIndex + 1} 步缺少：${allMissing[0].label}`,
    }
  }

  const overLimit = [
    {
      stepIndex: 0,
      valid: application.abstract.length <= 400,
      message: '内容摘要不能超过 400 字',
    },
    {
      stepIndex: 1,
      valid: getChapterLength(['purposeSignificance', 'researchStatus']) <= 1500,
      message: '第一章合计不能超过 1500 字',
    },
    {
      stepIndex: 2,
      valid:
        getChapterLength([
          'mainWork',
          'keyProblem',
          'technicalDifficulty',
          'technicalRoute',
          'methodInnovation',
        ]) <= 1500,
      message: '第二章合计不能超过 1500 字',
    },
    {
      stepIndex: 3,
      valid:
        getChapterLength([
          'applicantBackground',
          'researchFoundation',
          'teamProfile',
          'implementationExperience',
        ]) <= 1000,
      message: '第三章合计不能超过 1000 字',
    },
  ].find((item) => !item.valid)

  if (overLimit) {
    return {
      firstStep: overLimit.stepIndex,
      invalidSteps: new Set([overLimit.stepIndex]),
      message: overLimit.message,
    }
  }

  const budgetValues = [
    application.budget.equipment,
    application.budget.purchase,
    application.budget.business,
    application.budget.labor,
  ]

  if (budgetValues.some((value) => normalizeMoney(value) < 0)) {
    return {
      firstStep: 7,
      invalidSteps: new Set([7]),
      message: '预算金额不能为负数',
    }
  }

  if (isLaborRatioInvalid.value) {
    return {
      firstStep: 7,
      invalidSteps: new Set([7]),
      message: '劳务费占比不能超过预算总额的 30%',
    }
  }

  return null
}

function getStepStatus(index: number): StepStatus {
  const completion = getStepCompletion(index)

  if (invalidStepIndexes.value.has(index) || (hasSubmitTried.value && getStepMissing(index).length > 0)) {
    return 'INVALID'
  }

  if (index === activeStep.value) {
    return 'IN_PROGRESS'
  }

  if (completion === 100) {
    return 'COMPLETED'
  }

  return 'WAITING'
}

function getStepCompletion(index: number) {
  const requiredValues = getStepRequiredValues(index)
  const total = requiredValues.length

  if (total === 0) {
    return 0
  }

  const filled = requiredValues.filter(isFilled).length
  const percent = Math.round((filled / total) * 100)

  if (index === 7 && isLaborRatioInvalid.value) {
    return Math.min(percent, 90)
  }

  return percent
}

function getStepRequiredValues(index: number): unknown[] {
  if (index === 0) {
    return [
      application.projectName,
      application.projectDirection,
      application.projectCategory,
      application.unitName,
      application.applicantName,
      application.gender,
      application.birthMonth,
      application.education,
      application.professionalTitle,
      application.mobile,
      application.email,
      application.researchPeriod,
      application.firstYearBudget,
      application.abstract,
    ]
  }

  if (index === 1) {
    return [application.purposeSignificance, application.researchStatus]
  }

  if (index === 2) {
    return [
      application.mainWork,
      application.keyProblem,
      application.technicalDifficulty,
      application.technicalRoute,
      application.methodInnovation,
    ]
  }

  if (index === 3) {
    return [
      application.applicantBackground,
      application.researchFoundation,
      application.teamProfile,
      application.implementationExperience,
    ]
  }

  if (index === 4) {
    return application.annualPlans.flatMap((plan) => [
      plan.yearLabel,
      plan.researchTasks,
      plan.implementationPlan,
      plan.cooperationMode,
      plan.studentTrainingGoal,
    ])
  }

  if (index === 5) {
    return [
      application.overallGoal,
      application.annualGoal,
      application.expectedOutcomes,
      application.impact,
      application.talentDevelopment,
      application.otherIndicators,
    ]
  }

  if (index === 6) {
    return application.participants.flatMap((participant) => [
      participant.name,
      participant.unit,
      participant.gender,
      participant.major,
      participant.title,
      participant.responsibility,
    ])
  }

  if (index === 7) {
    return [
      application.budget.equipment,
      application.budget.equipmentNote,
      application.budget.purchase,
      application.budget.purchaseNote,
      application.budget.business,
      application.budget.businessNote,
      application.budget.labor,
      application.budget.laborNote,
    ]
  }

  if (index === 8) {
    if (application.specialCompute === 'no') {
      return [application.specialCompute]
    }

    return [
      application.specialCompute,
      application.computeScale,
      application.computePeriod,
      application.computeEnvironment,
      application.computePurposeReason,
    ]
  }

  if (index === 9) {
    const requiredValues: unknown[] = [
      application.leaderIdCard,
      application.consent,
      application.leaderSignatureDataUrl,
      application.leaderSignDate,
    ]

    if (application.jointEnabled) {
      requiredValues.push(
        application.jointName,
        application.jointIdCard,
        application.jointSignatureDataUrl,
        application.jointSignDate,
      )
    }

    return requiredValues
  }

  return []
}

function getStepMissing(index: number): MissingResult[] {
  const missing: string[] = []

  if (index === 0) {
    pushMissing(missing, application.projectName, '项目名称')
    pushMissing(missing, application.projectDirection, '项目方向')
    pushMissing(missing, application.projectCategory, '项目类别')
    pushMissing(missing, application.unitName, '单位名称')
    pushMissing(missing, application.applicantName, '姓名')
    pushMissing(missing, application.gender, '性别')
    pushMissing(missing, application.birthMonth, '出生年月')
    pushMissing(missing, application.education, '学历')
    pushMissing(missing, application.professionalTitle, '职称')
    pushMissing(missing, application.mobile, '手机')
    pushMissing(missing, application.email, '邮箱')
    pushMissing(missing, application.researchPeriod, '研究周期')
    pushMissing(missing, application.firstYearBudget, '首年经费预算')
    pushMissing(missing, application.abstract, '内容摘要')

    if (application.abstract.length > 400) {
      missing.push('内容摘要超过 400 字')
    }
  }

  if (index === 1) {
    pushMissing(missing, application.purposeSignificance, '研究目的和意义')
    pushMissing(missing, application.researchStatus, '国内外研究现状')

    if (getChapterLength(['purposeSignificance', 'researchStatus']) > 1500) {
      missing.push('第一章合计超过 1500 字')
    }
  }

  if (index === 2) {
    pushMissing(missing, application.mainWork, '主要工作内容')
    pushMissing(missing, application.keyProblem, '关键科学问题')
    pushMissing(missing, application.technicalDifficulty, '主要技术难点')
    pushMissing(missing, application.technicalRoute, '技术路线')
    pushMissing(missing, application.methodInnovation, '方法创新')

    if (
      getChapterLength([
        'mainWork',
        'keyProblem',
        'technicalDifficulty',
        'technicalRoute',
        'methodInnovation',
      ]) > 1500
    ) {
      missing.push('第二章合计超过 1500 字')
    }
  }

  if (index === 3) {
    pushMissing(missing, application.applicantBackground, '申请人工作背景')
    pushMissing(missing, application.researchFoundation, '申请人研究基础')
    pushMissing(missing, application.teamProfile, '科研团队情况')
    pushMissing(missing, application.implementationExperience, '科研项目组织实施经验')

    if (
      getChapterLength([
        'applicantBackground',
        'researchFoundation',
        'teamProfile',
        'implementationExperience',
      ]) > 1000
    ) {
      missing.push('第三章合计超过 1000 字')
    }
  }

  if (index === 4) {
    application.annualPlans.forEach((plan, planIndex) => {
      const prefix = plan.yearLabel || `第${planIndex + 1}年度`

      pushMissing(missing, plan.yearLabel, `${prefix}：年度名称`)
      pushMissing(missing, plan.researchTasks, `${prefix}：主要研究任务`)
      pushMissing(missing, plan.implementationPlan, `${prefix}：实施方案`)
      pushMissing(missing, plan.cooperationMode, `${prefix}：研究计划及合作方式`)
      pushMissing(missing, plan.studentTrainingGoal, `${prefix}：项目学生培养目标`)
    })
  }

  if (index === 5) {
    pushMissing(missing, application.overallGoal, '总目标')
    pushMissing(missing, application.annualGoal, '年度目标')
    pushMissing(missing, application.expectedOutcomes, '预期成果')
    pushMissing(missing, application.impact, '社会、学术或产业影响力')
    pushMissing(missing, application.talentDevelopment, '人才队伍建设')
    pushMissing(missing, application.otherIndicators, '其他指标')
  }

  if (index === 6) {
    const completedMembers = application.participants.filter((participant) =>
      participant.category === '成员' && isParticipantCompleted(participant),
    )

    if (completedMembers.length < 1) {
      missing.push('至少包含项目负责人和一名成员')
    }

    application.participants.forEach((participant, memberIndex) => {
      const prefix = memberIndex === 0 ? '项目负责人' : `成员${memberIndex}`

      pushMissing(missing, participant.name, `${prefix}：姓名`)
      pushMissing(missing, participant.unit, `${prefix}：单位`)
      pushMissing(missing, participant.gender, `${prefix}：性别`)
      pushMissing(missing, participant.major, `${prefix}：专业`)
      pushMissing(missing, participant.title, `${prefix}：职称/职务`)
      pushMissing(missing, participant.responsibility, `${prefix}：责任分工`)
    })
  }

  if (index === 7) {
    pushMissing(missing, application.budget.equipment, '设备费')
    pushMissing(missing, application.budget.equipmentNote, '设备费测算说明')
    pushMissing(missing, application.budget.purchase, '设备购置费')
    pushMissing(missing, application.budget.purchaseNote, '设备购置费说明')
    pushMissing(missing, application.budget.business, '业务费')
    pushMissing(missing, application.budget.businessNote, '业务费测算说明')
    pushMissing(missing, application.budget.labor, '劳务费')
    pushMissing(missing, application.budget.laborNote, '劳务费测算说明')

    if (isLaborRatioInvalid.value) {
      missing.push('劳务费占比超过 30%')
    }
  }

  if (index === 8) {
    pushMissing(missing, application.specialCompute, '是否存在特殊算力需求')

    if (application.specialCompute === 'yes') {
      pushMissing(missing, application.computeScale, '算力规模')
      pushMissing(missing, application.computePeriod, '使用周期')
      pushMissing(missing, application.computeEnvironment, '特殊环境')
      pushMissing(missing, application.computePurposeReason, '用途和原因')
    }
  }

  if (index === 9) {
    pushMissing(missing, application.leaderIdCard, '项目负责人身份证号')
    pushMissing(missing, application.consent, '已阅读并同意')
    pushMissing(missing, application.leaderSignatureDataUrl, '项目负责人手写签名')
    pushMissing(missing, application.leaderSignDate, '项目负责人签名日期')

    if (application.jointEnabled) {
      pushMissing(missing, application.jointName, '联合项目负责人姓名')
      pushMissing(missing, application.jointIdCard, '联合项目负责人身份证号')
      pushMissing(missing, application.jointSignatureDataUrl, '联合项目负责人手写签名')
      pushMissing(missing, application.jointSignDate, '联合项目负责人签名日期')
    }
  }

  return missing.map((label) => ({
    label,
    stepIndex: index,
  }))
}

function pushMissing(target: string[], value: unknown, label: string) {
  if (!isFilled(value)) {
    target.push(label)
  }
}

function isFilled(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  return value !== null && value !== undefined && String(value).trim() !== ''
}

function isParticipantCompleted(participant: ApplicationParticipant) {
  return [
    participant.name,
    participant.unit,
    participant.gender,
    participant.major,
    participant.title,
    participant.responsibility,
  ].every(isFilled)
}

function getStepClass(index: number) {
  return ['wizard-step-item', `is-${getStepStatus(index).toLowerCase()}`, { current: index === activeStep.value }]
}

function getStageClass(stageIndex: number, stepIndexes: number[]) {
  const done = stepIndexes.every((stepIndex) => getStepCompletion(stepIndex) === 100)

  return {
    done,
    active: currentStageIndex.value === stageIndex,
  }
}

function getStepStatusLabel(index: number) {
  const status = getStepStatus(index)
  const completion = getStepCompletion(index)
  const labelMap: Record<StepStatus, string> = {
    WAITING: completion > 0 ? `已填写 ${completion}%` : '待填写',
    IN_PROGRESS: completion > 0 ? `填写中 ${completion}%` : '正在填写',
    COMPLETED: '已完成',
    INVALID: '待完善',
  }

  return labelMap[status]
}

function getStepMarker(index: number) {
  const status = getStepStatus(index)

  if (status === 'COMPLETED') {
    return '✓'
  }

  if (status === 'INVALID') {
    return '!'
  }

  return String(index + 1)
}

function getStepTagType(index: number) {
  const completion = getStepCompletion(index)

  if (invalidStepIndexes.value.has(index)) {
    return 'danger'
  }

  if (completion === 100) {
    return 'success'
  }

  if (completion > 0) {
    return 'warning'
  }

  return 'info'
}

function getStepTagText(index: number) {
  const completion = getStepCompletion(index)

  if (invalidStepIndexes.value.has(index)) {
    return '待完善'
  }

  if (completion === 100) {
    return '已完成'
  }

  if (completion > 0) {
    return `填写中 ${completion}%`
  }

  return '待填写'
}

function addAnnualPlan() {
  application.annualPlans.push(createAnnualPlan(application.annualPlans.length + 1))
}

function removeAnnualPlan(index: number) {
  if (application.annualPlans.length <= 1) {
    ElMessage.warning('至少保留一个年度计划')
    return
  }

  application.annualPlans.splice(index, 1)
}

function addParticipant() {
  application.participants.push(createParticipantRow())
}

function removeParticipant(index: number) {
  if (index === 0) {
    return
  }

  application.participants.splice(index, 1)
}

function syncLeaderParticipant() {
  const leaderRow = application.participants[0] ?? createParticipantRow()

  application.participants[0] = {
    ...leaderRow,
    category: '项目负责人',
    name: application.applicantName,
    unit: application.unitName,
    gender: application.gender,
    title: application.professionalTitle,
    responsibility: leaderRow.responsibility || '项目总体负责',
  }
}

function handleLeaderSignatureSaved(_blob: Blob, dataUrl: string) {
  application.leaderSignatureDataUrl = dataUrl
  saveDraft(false)
}

function handleJointSignatureSaved(_blob: Blob, dataUrl: string) {
  application.jointSignatureDataUrl = dataUrl
  saveDraft(false)
}

function handleLeaderSignatureClear() {
  application.leaderSignatureDataUrl = ''
}

function handleJointSignatureClear() {
  application.jointSignatureDataUrl = ''
}

function handleBudgetAmountChange(key: BudgetAmountKey, value: number | undefined) {
  application.budget[key] = value ?? 0
}

function handleBudgetNoteChange(key: BudgetNoteKey, value: string) {
  application.budget[key] = value
}

function normalizeMoney(value: number) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function formatMoney(value: number) {
  return normalizeMoney(value).toFixed(2)
}

function getChapterLength(keys: Array<keyof ProjectApplicationWizardState>) {
  return keys.reduce((sum, key) => sum + String(application[key] ?? '').length, 0)
}

function displayText(value: unknown) {
  return isFilled(value) ? String(value) : '尚未填写'
}
</script>

<template>
  <section class="application-wizard-page" aria-label="项目负责人分步填写科研项目申报书">
    <section class="wizard-context-card">
      <div class="wizard-context-main">
        <span class="wizard-eyebrow">{{ batchDisplayName }}</span>
        <h1>填写科研项目申报计划书</h1>
        <div class="wizard-context-meta">
          <span>批次编号：{{ batchDisplayCode }}</span>
          <span>申报截止：{{ batchDeadline }}</span>
          <span>模板：{{ application.templateVersion }}</span>
        </div>
      </div>

      <div class="wizard-context-actions">
        <el-tag type="warning" effect="light">草稿</el-tag>
        <el-button :icon="View" @click="openPreview">预览申报书</el-button>
        <el-button type="primary" @click="saveDraft(true)">保存草稿</el-button>
      </div>
    </section>

    <section class="wizard-stage-card" aria-label="归并阶段">
      <header>
        <strong>申报填写流程</strong>
        <span>系统按章节保存，完成当前步骤后可继续下一步</span>
      </header>

      <div class="wizard-stage-flow">
        <div
          v-for="(stage, stageIndex) in wizardStages"
          :key="stage.name"
          class="wizard-stage-item"
          :class="getStageClass(stageIndex, stage.steps)"
        >
          <span class="wizard-stage-dot">{{ stage.steps.every((step) => getStepCompletion(step) === 100) ? '✓' : stageIndex + 1 }}</span>
          <div>
            <strong>{{ stage.name }}</strong>
            <small>{{ stage.note }}</small>
          </div>
        </div>
      </div>
    </section>

    <section class="wizard-workspace">
      <aside class="wizard-panel wizard-step-panel">
        <h2>申报书目录</h2>
        <p>共 10 个填写步骤。点击章节可返回修改，状态会随填写情况自动更新。</p>

        <div class="wizard-step-list">
          <button
            v-for="(step, index) in wizardSteps"
            :key="step.title"
            :class="getStepClass(index)"
            type="button"
            @click="goToStep(index)"
          >
            <span class="wizard-step-marker">{{ getStepMarker(index) }}</span>
            <span class="wizard-step-copy">
              <strong>{{ step.short }}</strong>
              <small>{{ getStepStatusLabel(index) }}</small>
            </span>
          </button>
        </div>
      </aside>

      <main class="wizard-panel wizard-form-panel">
        <header class="wizard-form-head">
          <div>
            <span>步骤 {{ activeStep + 1 }} / {{ wizardSteps.length }}</span>
            <h2>{{ currentStepDefinition.title }}</h2>
            <p>{{ currentStepDefinition.guide }}</p>
          </div>
          <el-tag :type="getStepTagType(activeStep)" effect="light">
            {{ getStepTagText(activeStep) }}
          </el-tag>
        </header>

        <el-form class="wizard-form-body" label-position="top" :model="application">
          <template v-if="activeStep === 0">
            <section class="wizard-form-section">
              <h3>项目基本资料</h3>
              <div class="wizard-form-grid">
                <el-form-item label="项目名称" required>
                  <el-input v-model.trim="application.projectName" maxlength="100" show-word-limit />
                </el-form-item>

                <el-form-item label="项目方向" required>
                  <el-radio-group v-model="application.projectDirection">
                    <el-radio-button
                      v-for="direction in projectDirectionOptions"
                      :key="direction"
                      :value="direction"
                    >
                      {{ direction }}
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="项目类别">
                  <el-input v-model="application.projectCategory" disabled>
                    <template #append>由批次自动带入</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="单位名称" required>
                  <el-input v-model.trim="application.unitName" />
                </el-form-item>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>申请人信息</h3>
              <div class="wizard-form-grid three">
                <el-form-item label="姓名" required>
                  <el-input v-model.trim="application.applicantName" disabled>
                    <template #append>系统带入</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="性别" required>
                  <el-select v-model="application.gender" placeholder="请选择">
                    <el-option v-for="gender in genderOptions" :key="gender" :label="gender" :value="gender" />
                  </el-select>
                </el-form-item>

                <el-form-item label="出生年月" required>
                  <el-date-picker
                    v-model="application.birthMonth"
                    type="month"
                    value-format="YYYY-MM"
                    format="YYYY-MM"
                    placeholder="请选择出生年月"
                  />
                </el-form-item>

                <el-form-item label="学历" required>
                  <el-select v-model="application.education" placeholder="请选择">
                    <el-option
                      v-for="education in educationOptions"
                      :key="education"
                      :label="education"
                      :value="education"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="职称" required>
                  <el-input v-model.trim="application.professionalTitle" placeholder="如：副研究员" />
                </el-form-item>

                <el-form-item label="手机" required>
                  <el-input v-model.trim="application.mobile" />
                </el-form-item>

                <el-form-item label="电话">
                  <el-input v-model.trim="application.telephone" placeholder="可填写办公电话" />
                </el-form-item>

                <el-form-item label="邮箱" required>
                  <el-input v-model.trim="application.email" />
                </el-form-item>

                <el-form-item label="研究周期" required>
                  <el-input-number v-model="application.researchPeriod" :min="1" :max="5" controls-position="right" />
                  <span class="wizard-unit-text">年</span>
                </el-form-item>

                <el-form-item label="首年经费预算" required>
                  <el-input-number
                    v-model="application.firstYearBudget"
                    :min="0"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                  />
                  <span class="wizard-unit-text">万元</span>
                </el-form-item>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>内容摘要</h3>
              <el-form-item label="项目内容摘要" required>
                <el-input
                  v-model="application.abstract"
                  type="textarea"
                  maxlength="400"
                  show-word-limit
                  :rows="6"
                  placeholder="概述项目研究对象、核心问题、主要方法和预期价值。"
                />
              </el-form-item>
            </section>

            <el-alert
              title="封面字段无需重复填写"
              description="项目名称、项目负责人和填报月份会根据本页信息自动同步到申报书封面。"
              type="info"
              :closable="false"
              show-icon
            />
          </template>

          <template v-else-if="activeStep === 1">
            <section class="wizard-form-section">
              <h3>研究目的和意义</h3>
              <p class="wizard-section-tip">两项合计不超过 1500 字。</p>
              <div class="wizard-form-grid">
                <el-form-item label="研究目的和意义" required>
                  <el-input v-model="application.purposeSignificance" type="textarea" :rows="8" />
                </el-form-item>
                <el-form-item label="国内外研究现状" required>
                  <el-input v-model="application.researchStatus" type="textarea" :rows="8" />
                </el-form-item>
              </div>
              <p :class="['wizard-count-line', { over: getChapterLength(['purposeSignificance', 'researchStatus']) > 1500 }]">
                本章合计 {{ getChapterLength(['purposeSignificance', 'researchStatus']) }} / 1500 字
              </p>
            </section>
          </template>

          <template v-else-if="activeStep === 2">
            <section class="wizard-form-section">
              <h3>研究内容与核心问题</h3>
              <p class="wizard-section-tip">本章合计不超过 1500 字。</p>
              <div class="wizard-form-grid">
                <el-form-item label="主要工作内容" required>
                  <el-input v-model="application.mainWork" type="textarea" :rows="6" />
                </el-form-item>
                <el-form-item label="关键科学问题" required>
                  <el-input v-model="application.keyProblem" type="textarea" :rows="6" />
                </el-form-item>
                <el-form-item label="主要技术难点" required>
                  <el-input v-model="application.technicalDifficulty" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="技术路线" required>
                  <el-input v-model="application.technicalRoute" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="方法创新" class="full" required>
                  <el-input v-model="application.methodInnovation" type="textarea" :rows="5" />
                </el-form-item>
              </div>
              <p
                :class="[
                  'wizard-count-line',
                  {
                    over:
                      getChapterLength([
                        'mainWork',
                        'keyProblem',
                        'technicalDifficulty',
                        'technicalRoute',
                        'methodInnovation',
                      ]) > 1500,
                  },
                ]"
              >
                本章合计
                {{
                  getChapterLength([
                    'mainWork',
                    'keyProblem',
                    'technicalDifficulty',
                    'technicalRoute',
                    'methodInnovation',
                  ])
                }}
                / 1500 字
              </p>
            </section>
          </template>

          <template v-else-if="activeStep === 3">
            <section class="wizard-form-section">
              <h3>申请人与团队基础</h3>
              <p class="wizard-section-tip">本章合计不超过 1000 字。</p>
              <div class="wizard-form-grid">
                <el-form-item label="申请人工作背景" required>
                  <el-input v-model="application.applicantBackground" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="申请人研究基础" required>
                  <el-input v-model="application.researchFoundation" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="科研团队情况" required>
                  <el-input v-model="application.teamProfile" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="科研项目组织实施经验" required>
                  <el-input v-model="application.implementationExperience" type="textarea" :rows="5" />
                </el-form-item>
              </div>
              <p
                :class="[
                  'wizard-count-line',
                  {
                    over:
                      getChapterLength([
                        'applicantBackground',
                        'researchFoundation',
                        'teamProfile',
                        'implementationExperience',
                      ]) > 1000,
                  },
                ]"
              >
                本章合计
                {{
                  getChapterLength([
                    'applicantBackground',
                    'researchFoundation',
                    'teamProfile',
                    'implementationExperience',
                  ])
                }}
                / 1000 字
              </p>
            </section>
          </template>

          <template v-else-if="activeStep === 4">
            <section class="wizard-form-section">
              <h3>分年度研究计划</h3>
              <p class="wizard-section-tip">根据执行年限逐年度填写，保持研究任务、实施路径、合作方式和学生培养目标对应。</p>

              <article
                v-for="(plan, index) in application.annualPlans"
                :key="index"
                class="wizard-repeat-card"
              >
                <header>
                  <strong>{{ String(index + 1).padStart(2, '0') }} {{ plan.yearLabel || `第${index + 1}年度` }}</strong>
                  <el-button
                    v-if="application.annualPlans.length > 1"
                    link
                    type="danger"
                    @click="removeAnnualPlan(index)"
                  >
                    删除本年度
                  </el-button>
                </header>

                <div class="wizard-form-grid">
                  <el-form-item label="年度名称或时间范围" class="full" required>
                    <el-input v-model.trim="plan.yearLabel" placeholder="如：第一年度（2026.10-2027.09）" />
                  </el-form-item>
                  <el-form-item label="主要研究任务" class="full" required>
                    <el-input v-model="plan.researchTasks" type="textarea" :rows="4" />
                  </el-form-item>
                  <el-form-item label="实施方案" class="full" required>
                    <el-input v-model="plan.implementationPlan" type="textarea" :rows="4" />
                  </el-form-item>
                  <el-form-item label="研究计划及合作方式" class="full" required>
                    <el-input v-model="plan.cooperationMode" type="textarea" :rows="4" />
                  </el-form-item>
                  <el-form-item label="项目学生培养目标" class="full" required>
                    <el-input v-model="plan.studentTrainingGoal" type="textarea" :rows="4" />
                  </el-form-item>
                </div>
              </article>

              <el-button @click="addAnnualPlan">新增年度计划</el-button>
            </section>
          </template>

          <template v-else-if="activeStep === 5">
            <section class="wizard-form-section">
              <h3>总体与年度目标</h3>
              <div class="wizard-form-grid">
                <el-form-item label="总目标" required>
                  <el-input v-model="application.overallGoal" type="textarea" :rows="6" />
                </el-form-item>
                <el-form-item label="年度目标" required>
                  <el-input v-model="application.annualGoal" type="textarea" :rows="6" />
                </el-form-item>
                <el-form-item label="预期成果" required>
                  <el-input v-model="application.expectedOutcomes" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="社会、学术或产业影响力" required>
                  <el-input v-model="application.impact" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="人才队伍建设" required>
                  <el-input v-model="application.talentDevelopment" type="textarea" :rows="5" />
                </el-form-item>
                <el-form-item label="其他指标" required>
                  <el-input v-model="application.otherIndicators" type="textarea" :rows="5" placeholder="没有其他指标时填写“无”" />
                </el-form-item>
              </div>
            </section>
          </template>

          <template v-else-if="activeStep === 6">
            <section class="wizard-form-section">
              <h3>参加人员名单</h3>
              <p class="wizard-section-tip">项目负责人作为第一行，并与基本信息自动同步。</p>

              <div class="wizard-table-scroll">
                <el-table class="wizard-edit-table" :data="application.participants" border>
                  <el-table-column label="类别" width="116">
                    <template #default="{ row, $index }">
                      <el-select v-model="row.category" :disabled="$index === 0">
                        <el-option label="项目负责人" value="项目负责人" />
                        <el-option label="成员" value="成员" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="姓名" min-width="120">
                    <template #default="{ row, $index }">
                      <el-input v-model.trim="row.name" :disabled="$index === 0" />
                    </template>
                  </el-table-column>
                  <el-table-column label="单位" min-width="150">
                    <template #default="{ row, $index }">
                      <el-input v-model.trim="row.unit" :disabled="$index === 0" />
                    </template>
                  </el-table-column>
                  <el-table-column label="性别" width="98">
                    <template #default="{ row, $index }">
                      <el-select v-model="row.gender" :disabled="$index === 0" placeholder="请选择">
                        <el-option v-for="gender in genderOptions" :key="gender" :label="gender" :value="gender" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="专业" min-width="130">
                    <template #default="{ row }">
                      <el-input v-model.trim="row.major" />
                    </template>
                  </el-table-column>
                  <el-table-column label="职称/职务" min-width="130">
                    <template #default="{ row }">
                      <el-input v-model.trim="row.title" />
                    </template>
                  </el-table-column>
                  <el-table-column label="责任分工" min-width="160">
                    <template #default="{ row }">
                      <el-input v-model.trim="row.responsibility" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="78" fixed="right">
                    <template #default="{ $index }">
                      <el-button v-if="$index > 0" link type="danger" @click="removeParticipant($index)">删除</el-button>
                      <span v-else class="wizard-muted">同步</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <footer class="wizard-table-footer">
                <span>至少包含项目负责人和一名成员。</span>
                <el-button @click="addParticipant">新增成员</el-button>
              </footer>
            </section>
          </template>

          <template v-else-if="activeStep === 7">
            <section class="wizard-form-section">
              <h3>首年经费预算</h3>
              <div class="wizard-table-scroll">
                <table class="wizard-budget-table">
                  <thead>
                    <tr>
                      <th>科目</th>
                      <th>预算经费（万元）</th>
                      <th>预算测算依据与说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in budgetRows" :key="row.subject">
                      <td>
                        <strong>{{ row.subject }}</strong>
                      </td>
                      <td>
                        <el-input-number
                          :model-value="application.budget[row.key]"
                          :min="0"
                          :precision="2"
                          :step="1"
                          controls-position="right"
                          @update:model-value="(value: number | undefined) => handleBudgetAmountChange(row.key, value)"
                        />
                      </td>
                      <td>
                        <el-input
                          :model-value="application.budget[row.noteKey]"
                          type="textarea"
                          :rows="2"
                          :placeholder="row.tip"
                          @update:model-value="(value: string) => handleBudgetNoteChange(row.noteKey, value)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="wizard-budget-total">
                <span>
                  劳务费占比：
                  <strong :class="{ danger: isLaborRatioInvalid }">{{ laborRatio.toFixed(1) }}%</strong>
                </span>
                <span>
                  预算合计：
                  <strong>{{ formatMoney(budgetTotal) }}</strong>
                  万元
                </span>
              </div>

              <el-alert
                :type="isLaborRatioInvalid ? 'error' : 'warning'"
                :title="isLaborRatioInvalid ? '劳务费占比已超过 30%，将阻止提交' : '设备购置费属于设备费明细，不重复计入合计'"
                description="预算合计 = 设备费 + 业务费 + 劳务费；设备购置费只作为设备费明细展示。"
                :closable="false"
                show-icon
              />
            </section>
          </template>

          <template v-else-if="activeStep === 8">
            <section class="wizard-form-section">
              <h3>特殊算力需求</h3>
              <el-alert
                class="wizard-section-alert"
                title="学院会为项目配置基础算力"
                description="只有超出基础配置或存在特殊环境要求时，才需要补充说明。"
                type="info"
                :closable="false"
                show-icon
              />

              <el-form-item label="是否存在特殊算力需求" required>
                <el-radio-group v-model="application.specialCompute">
                  <el-radio-button value="no">无特殊算力需求</el-radio-button>
                  <el-radio-button value="yes">有特殊算力需求</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <div v-if="application.specialCompute === 'yes'" class="wizard-form-grid">
                <el-form-item label="算力规模" required>
                  <el-input v-model.trim="application.computeScale" placeholder="如：8 卡 GPU、128G 显存等" />
                </el-form-item>
                <el-form-item label="使用周期" required>
                  <el-input v-model.trim="application.computePeriod" placeholder="如：2026.10-2027.03" />
                </el-form-item>
                <el-form-item label="特殊环境" required>
                  <el-input v-model.trim="application.computeEnvironment" placeholder="如：CUDA 版本、专用框架或安全隔离环境" />
                </el-form-item>
                <el-form-item label="用途和原因" required>
                  <el-input v-model="application.computePurposeReason" type="textarea" :rows="5" />
                </el-form-item>
              </div>
            </section>
          </template>

          <template v-else>
            <section class="wizard-form-section">
              <h3>承诺书身份信息</h3>
              <div class="wizard-form-grid">
                <el-form-item label="项目负责人" required>
                  <el-input v-model="application.applicantName" disabled />
                </el-form-item>
                <el-form-item label="项目负责人身份证号" required>
                  <el-input v-model.trim="application.leaderIdCard" />
                </el-form-item>
                <el-form-item label="是否存在联合项目负责人" class="full">
                  <el-switch
                    v-model="application.jointEnabled"
                    active-text="存在"
                    inactive-text="不存在"
                  />
                </el-form-item>
                <el-form-item v-if="application.jointEnabled" label="联合项目负责人姓名" required>
                  <el-input v-model.trim="application.jointName" />
                </el-form-item>
                <el-form-item v-if="application.jointEnabled" label="联合项目负责人身份证号" required>
                  <el-input v-model.trim="application.jointIdCard" />
                </el-form-item>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>项目经费使用承诺书</h3>
              <div class="wizard-commitment-box">
                <p>
                  项目负责人 {{ application.applicantName || '[姓名]' }}，身份证号
                  {{ application.leaderIdCard || '[XXX]' }}，
                  <template v-if="application.jointEnabled">
                    联合项目负责人 {{ application.jointName || '[姓名]' }}，身份证号
                    {{ application.jointIdCard || '[XXX]' }}，
                  </template>
                  现为北京中关村学院 {{ application.projectName || '[项目名称]' }} 的项目经费负责人，特此承诺如下：
                </p>
                <h4>一、项目经费使用责任</h4>
                <p>本人承诺，在承担项目管理职责过程中，是科研经费管理的第一责任人，对经费使用的合理性、真实性、合规性负责。</p>
                <h4>二、项目经费审批和监督</h4>
                <p>本人承诺在项目执行过程中，负责在项目预算额度内按学院财务规定对所有经费使用进行严格审批，并确保报销事项和报销材料真实、准确、合规。</p>
                <h4>三、项目经费使用的合规性</h4>
                <p>本人承诺所有开支均符合相关法律法规、学院规章制度规定及项目合同约定，不挪用、滥用或超出预算范围使用项目经费。</p>
                <h4>四、责任承担</h4>
                <p>如项目经费使用不当、超支或违反经费管理规定，给学院造成损失或影响项目执行，本人愿意承担相应责任。</p>
                <h4>五、声明</h4>
                <p>本人已认真阅读承诺函全部内容并理解其含义。若本人有任何违反上述承诺的行为，愿意承担相应责任。特此承诺。</p>
              </div>

              <el-checkbox v-model="application.consent" class="wizard-consent">
                已阅读并同意项目经费使用承诺书全部内容
              </el-checkbox>
            </section>

            <section class="wizard-form-section">
              <h3>手写签名</h3>
              <div class="wizard-signature-grid">
                <article class="wizard-signature-card">
                  <header>
                    <strong>项目负责人签名</strong>
                    <span>{{ application.leaderSignatureDataUrl ? '已采集' : '待签名' }}</span>
                  </header>
                  <HandwrittenSignaturePad
                    :model-value="application.leaderSignatureDataUrl"
                    @update:model-value="application.leaderSignatureDataUrl = $event"
                    @saved="handleLeaderSignatureSaved"
                    @clear="handleLeaderSignatureClear"
                  />
                  <el-date-picker
                    v-model="application.leaderSignDate"
                    class="wizard-sign-date"
                    type="date"
                    value-format="YYYY-MM-DD"
                    format="YYYY-MM-DD"
                    placeholder="请选择签名日期"
                  />
                </article>

                <article v-if="application.jointEnabled" class="wizard-signature-card">
                  <header>
                    <strong>联合项目负责人签名</strong>
                    <span>{{ application.jointSignatureDataUrl ? '已采集' : '待签名' }}</span>
                  </header>
                  <HandwrittenSignaturePad
                    :model-value="application.jointSignatureDataUrl"
                    @update:model-value="application.jointSignatureDataUrl = $event"
                    @saved="handleJointSignatureSaved"
                    @clear="handleJointSignatureClear"
                  />
                  <el-date-picker
                    v-model="application.jointSignDate"
                    class="wizard-sign-date"
                    type="date"
                    value-format="YYYY-MM-DD"
                    format="YYYY-MM-DD"
                    placeholder="请选择签名日期"
                  />
                </article>
              </div>
            </section>
          </template>
        </el-form>

        <footer class="wizard-form-footer">
          <div>
            <el-button :icon="Back" :disabled="activeStep === 0" @click="goPrevStep">上一步</el-button>
            <span>{{ lastSavedText }}</span>
          </div>
          <div>
            <el-button @click="saveCurrentStep">保存当前步骤</el-button>
            <el-button type="primary" @click="saveAndGoNext">
              {{ activeStep === wizardSteps.length - 1 ? '校验并提交申报' : '保存并进入下一步' }}
            </el-button>
          </div>
        </footer>
      </main>

      <aside class="wizard-panel wizard-summary-panel">
        <section class="wizard-summary-block">
          <h2>申报完成度</h2>
          <div class="wizard-progress-row">
            <el-progress type="circle" :width="78" :stroke-width="8" :percentage="overallCompletion" />
            <div>
              <strong>{{ overallCompletion === 100 ? '可以提交' : '正在填写' }}</strong>
              <p>
                {{
                  overallCompletion === 100
                    ? '所有章节已完成，请确认并提交'
                    : `还有 ${incompleteStepCount} 个章节需要完善`
                }}
              </p>
            </div>
          </div>
        </section>

        <section class="wizard-summary-block">
          <h2>封面同步信息</h2>
          <dl class="wizard-sync-list">
            <div v-for="line in coverSyncLines" :key="line.label">
              <dt>{{ line.label }}</dt>
              <dd>{{ line.value }}</dd>
            </div>
          </dl>
        </section>

        <section class="wizard-summary-block">
          <h2>各章节状态</h2>
          <div class="wizard-chapter-list">
            <button
              v-for="(step, index) in wizardSteps"
              :key="step.short"
              type="button"
              :class="{ done: getStepCompletion(index) === 100, current: activeStep === index }"
              @click="goToStep(index)"
            >
              <span></span>
              {{ step.short }}
            </button>
          </div>
        </section>

        <section class="wizard-summary-block">
          <h2>本步骤缺失项</h2>
          <ul v-if="currentStepMissingItems.length" class="wizard-missing-list">
            <li v-for="item in currentStepMissingItems.slice(0, 8)" :key="item">{{ item }}</li>
          </ul>
          <p v-else class="wizard-no-missing">本步骤必填内容已完成</p>
        </section>

        <section class="wizard-summary-block">
          <el-button class="wizard-wide-button" :icon="View" @click="openPreview">预览完整申报书</el-button>
          <el-button class="wizard-wide-button" type="primary" :icon="DocumentChecked" @click="submitApplication">
            提交申报
          </el-button>
        </section>
      </aside>
    </section>

    <el-dialog
      v-model="previewVisible"
      append-to-body
      class="application-preview-dialog"
      destroy-on-close
      title="申报书实时预览"
      width="86vw"
      top="5vh"
    >
      <div class="wizard-preview-body">
        <article class="wizard-paper">
          <section class="wizard-paper-cover">
            <p>附件1：</p>
            <h1>北京中关村学院科研项目</h1>
            <h2>申报计划书</h2>
            <dl>
              <div>
                <dt>项目名称：</dt>
                <dd>{{ application.projectName || '尚未填写' }}</dd>
              </div>
              <div>
                <dt>项目负责人：</dt>
                <dd>{{ application.applicantName || '尚未填写' }}</dd>
              </div>
              <div>
                <dt>填报时间：</dt>
                <dd>{{ formatFillMonth(application.fillDate) }}</dd>
              </div>
            </dl>
            <footer>
              <strong>北京中关村学院</strong>
              <span>{{ application.templateVersion }}</span>
            </footer>
          </section>

          <section v-for="section in previewSections" :key="section.title" class="wizard-paper-section">
            <h3>{{ section.title }}</h3>
            <p :class="{ placeholder: !section.body }">{{ section.body || '尚未填写' }}</p>
          </section>

          <section class="wizard-paper-section">
            <h3>签名确认</h3>
            <div class="wizard-paper-signatures">
              <div>
                <span>项目负责人签名：</span>
                <img v-if="application.leaderSignatureDataUrl" :src="application.leaderSignatureDataUrl" alt="项目负责人签名" />
                <em v-else>尚未填写</em>
                <strong>日期：{{ application.leaderSignDate || '尚未填写' }}</strong>
              </div>
              <div v-if="application.jointEnabled">
                <span>联合项目负责人签名：</span>
                <img v-if="application.jointSignatureDataUrl" :src="application.jointSignatureDataUrl" alt="联合项目负责人签名" />
                <em v-else>尚未填写</em>
                <strong>日期：{{ application.jointSignDate || '尚未填写' }}</strong>
              </div>
            </div>
          </section>
        </article>
      </div>

      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="ElMessage.success('已模拟生成 PDF，正式系统中由后端模板服务生成')">
          模拟生成 PDF
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.application-wizard-page {
  display: grid;
  gap: 14px;
  padding-bottom: 24px;
}

.wizard-context-card {
  position: relative;
  min-width: 0;
  min-height: 112px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  overflow: hidden;
  padding: 22px 24px;
  border: 1px solid #d9e8ff;
  border-radius: 15px;
  background: linear-gradient(108deg, #fff 0%, #f7faff 58%, #edf4ff 100%);
  box-shadow: 0 8px 26px rgba(44, 91, 155, 0.06);
}

.wizard-context-card::after {
  content: "";
  position: absolute;
  top: -70px;
  right: 58px;
  width: 180px;
  height: 180px;
  border: 28px solid rgba(92, 150, 243, 0.08);
  border-radius: 999px;
}

.wizard-context-main,
.wizard-context-actions {
  position: relative;
  z-index: 1;
}

.wizard-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #3377df;
  font-size: 12px;
  font-weight: 700;
}

.wizard-eyebrow::before {
  content: "";
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: #4c8ef6;
}

.wizard-context-main h1 {
  margin: 8px 0;
  color: #172033;
  font-size: 24px;
  font-weight: 780;
  letter-spacing: -0.3px;
}

.wizard-context-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: #7b89a3;
  font-size: 13px;
}

.wizard-context-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.wizard-stage-card,
.wizard-panel {
  border: 1px solid var(--line, #e8edf5);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow, 0 8px 28px rgba(25, 45, 80, 0.07));
}

.wizard-stage-card {
  padding: 16px 24px 18px;
}

.wizard-stage-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 15px;
}

.wizard-stage-card header strong {
  color: #1e2d47;
  font-size: 15px;
}

.wizard-stage-card header span {
  color: #8a96aa;
  font-size: 12px;
}

.wizard-stage-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.wizard-stage-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8a97ac;
}

.wizard-stage-item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 14px;
  right: 8px;
  left: 36px;
  height: 2px;
  background: #e7ebf2;
}

.wizard-stage-item.done:not(:last-child)::after {
  background: #78b2ff;
}

.wizard-stage-dot {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  border: 2px solid #dce3ed;
  border-radius: 999px;
  background: #fff;
  color: #8f9aae;
  font-size: 12px;
  font-weight: 760;
}

.wizard-stage-item.done .wizard-stage-dot {
  border-color: #17a673;
  color: #fff;
  background: #17a673;
}

.wizard-stage-item.active {
  color: #236edc;
  font-weight: 700;
}

.wizard-stage-item.active .wizard-stage-dot {
  border-color: #3a86f7;
  color: #fff;
  background: #3a86f7;
  box-shadow: 0 0 0 5px #eaf3ff;
}

.wizard-stage-item strong,
.wizard-stage-item small {
  display: block;
}

.wizard-stage-item strong {
  color: inherit;
  font-size: 13px;
}

.wizard-stage-item small {
  margin-top: 2px;
  color: #a0aabc;
  font-size: 11px;
}

.wizard-workspace {
  display: grid;
  grid-template-columns: 248px minmax(640px, 1fr) 270px;
  gap: 14px;
  align-items: start;
}

.wizard-step-panel,
.wizard-summary-panel {
  position: sticky;
  top: 16px;
}

.wizard-step-panel {
  padding: 18px 14px;
}

.wizard-step-panel h2,
.wizard-summary-block h2 {
  margin: 0;
  color: #1d2c45;
  font-size: 16px;
  font-weight: 760;
}

.wizard-step-panel p {
  margin: 8px 8px 0;
  color: #8a96aa;
  font-size: 12px;
  line-height: 1.65;
}

.wizard-step-list {
  display: grid;
  gap: 0;
  margin-top: 17px;
}

.wizard-step-item {
  position: relative;
  min-height: 54px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  padding: 0 7px 17px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.wizard-step-item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 28px;
  bottom: 0;
  left: 20px;
  width: 2px;
  background: #e7ebf2;
}

.wizard-step-marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 2px solid #dce3ed;
  border-radius: 999px;
  background: #fff;
  color: #8f9aae;
  font-size: 11px;
  font-weight: 760;
}

.wizard-step-copy strong,
.wizard-step-copy small {
  display: block;
}

.wizard-step-copy strong {
  color: #41516c;
  font-size: 13px;
  font-weight: 680;
  line-height: 1.4;
}

.wizard-step-copy small {
  margin-top: 3px;
  color: #9aa5b7;
  font-size: 11px;
}

.wizard-step-item.is-completed:not(:last-child)::after {
  background: #90c0ff;
}

.wizard-step-item.is-completed .wizard-step-marker {
  border-color: #17a673;
  color: #fff;
  background: #17a673;
}

.wizard-step-item.is-in_progress .wizard-step-marker,
.wizard-step-item.current .wizard-step-marker {
  border-color: #3a86f7;
  color: #fff;
  background: #3a86f7;
  box-shadow: 0 0 0 4px #eaf3ff;
}

.wizard-step-item.is-invalid .wizard-step-marker {
  border-color: #e45656;
  color: #fff;
  background: #e45656;
}

.wizard-step-item.current .wizard-step-copy strong {
  color: #226edc;
}

.wizard-form-panel {
  min-width: 0;
  overflow: hidden;
}

.wizard-form-head {
  min-height: 88px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid #e8edf5;
}

.wizard-form-head span {
  color: #2f78e7;
  font-size: 12px;
  font-weight: 700;
}

.wizard-form-head h2 {
  margin: 7px 0 0;
  color: #172033;
  font-size: 20px;
}

.wizard-form-head p {
  max-width: 780px;
  margin: 7px 0 0;
  color: #8390a5;
  font-size: 12px;
  line-height: 1.65;
}

.wizard-form-body {
  min-height: 590px;
  padding: 24px;
}

.wizard-form-section + .wizard-form-section {
  margin-top: 24px;
}

.wizard-form-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 15px;
  color: #21304b;
  font-size: 16px;
  font-weight: 760;
}

.wizard-form-section h3::before {
  content: "";
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background: #3a86f7;
}

.wizard-section-tip {
  margin: -7px 0 14px 12px;
  color: #8a96aa;
  font-size: 12px;
  line-height: 1.7;
}

.wizard-section-alert {
  margin-bottom: 18px;
}

.wizard-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 20px;
}

.wizard-form-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.wizard-form-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.wizard-form-grid :deep(.el-form-item.full),
.wizard-form-grid .full {
  grid-column: 1 / -1;
}

.wizard-form-grid :deep(.el-select),
.wizard-form-grid :deep(.el-date-editor),
.wizard-form-grid :deep(.el-input-number),
.wizard-form-section :deep(.el-radio-group) {
  width: 100%;
}

.wizard-unit-text {
  margin-left: 8px;
  color: #8a96aa;
  font-size: 12px;
}

.wizard-count-line {
  display: flex;
  justify-content: flex-end;
  margin: 10px 0 0;
  color: #8a96aa;
  font-size: 12px;
}

.wizard-count-line.over,
.wizard-budget-total .danger {
  color: #e45656;
}

.wizard-repeat-card {
  padding: 17px;
  margin-bottom: 13px;
  border: 1px solid #e3e9f2;
  border-radius: 12px;
  background: #fbfcfe;
}

.wizard-repeat-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 15px;
}

.wizard-repeat-card header strong {
  color: #273754;
}

.wizard-table-scroll {
  min-width: 0;
  overflow-x: auto;
}

.wizard-edit-table {
  min-width: 920px;
}

.wizard-edit-table :deep(.el-table__cell) {
  padding: 7px 0;
}

.wizard-edit-table :deep(.el-input__wrapper),
.wizard-edit-table :deep(.el-select__wrapper) {
  min-height: 32px;
}

.wizard-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 12px;
  color: #8a96aa;
  font-size: 12px;
}

.wizard-muted {
  color: #9aa6b8;
  font-size: 12px;
}

.wizard-budget-table {
  width: 100%;
  min-width: 760px;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid #e3e9f2;
  border-radius: 10px;
}

.wizard-budget-table th,
.wizard-budget-table td {
  border-bottom: 1px solid #edf1f6;
}

.wizard-budget-table th {
  padding: 11px 10px;
  color: #5c6c86;
  background: #f6f8fb;
  font-size: 12px;
  text-align: left;
}

.wizard-budget-table td {
  padding: 9px;
  vertical-align: top;
}

.wizard-budget-table tr:last-child td {
  border-bottom: 0;
}

.wizard-budget-table td:first-child {
  width: 190px;
  color: #34445f;
}

.wizard-budget-table td:nth-child(2) {
  width: 180px;
}

.wizard-budget-table :deep(.el-input-number) {
  width: 100%;
}

.wizard-budget-total {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  margin-top: 13px;
  margin-bottom: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f5f9ff;
  color: #5d6b82;
}

.wizard-budget-total strong {
  color: #216bd8;
  font-size: 20px;
}

.wizard-commitment-box {
  max-height: 260px;
  overflow: auto;
  padding: 18px;
  border: 1px solid #e3e9f2;
  border-radius: 12px;
  background: #fafbfd;
  color: #54637c;
  font-size: 12px;
  line-height: 1.85;
}

.wizard-commitment-box h4 {
  margin: 12px 0 4px;
  color: #2f3f5a;
  font-size: 13px;
}

.wizard-commitment-box h4:first-of-type {
  margin-top: 0;
}

.wizard-commitment-box p {
  margin: 0;
}

.wizard-consent {
  margin-top: 14px;
}

.wizard-signature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.wizard-signature-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid #e0e8f4;
  border-radius: 12px;
  background: #fff;
}

.wizard-signature-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 10px;
}

.wizard-signature-card header strong {
  color: #263653;
  font-size: 13px;
}

.wizard-signature-card header span {
  color: #8a96aa;
  font-size: 12px;
}

.wizard-sign-date {
  width: 100%;
  margin-top: 12px;
}

.wizard-form-footer {
  position: sticky;
  bottom: 0;
  z-index: 6;
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  border-top: 1px solid #e8edf5;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
}

.wizard-form-footer > div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wizard-form-footer span {
  color: #8491a7;
  font-size: 11px;
}

.wizard-summary-panel {
  overflow: hidden;
}

.wizard-summary-block {
  padding: 18px;
  border-bottom: 1px solid #e8edf5;
}

.wizard-summary-block:last-child {
  border-bottom: 0;
}

.wizard-progress-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 16px;
}

.wizard-progress-row strong {
  display: block;
  color: #263653;
  font-size: 14px;
}

.wizard-progress-row p {
  margin: 6px 0 0;
  color: #8a96aa;
  font-size: 11px;
  line-height: 1.5;
}

.wizard-sync-list {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
}

.wizard-sync-list div {
  display: grid;
  gap: 3px;
}

.wizard-sync-list dt {
  color: #8390a5;
  font-size: 11px;
}

.wizard-sync-list dd {
  margin: 0;
  color: #34435f;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

.wizard-chapter-list {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}

.wizard-chapter-list button {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: #55657e;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
}

.wizard-chapter-list span {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  margin-top: 5px;
  border-radius: 999px;
  background: #a9b5c7;
}

.wizard-chapter-list button.done span {
  background: #17a673;
}

.wizard-chapter-list button.current span {
  background: #3a86f7;
  box-shadow: 0 0 0 3px #eaf3ff;
}

.wizard-missing-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.wizard-missing-list li {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding: 6px 0;
  color: #6d7b91;
  font-size: 12px;
}

.wizard-missing-list li::before {
  content: "";
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  margin-top: 7px;
  border-radius: 999px;
  background: #e58a16;
}

.wizard-no-missing {
  margin: 10px 0 0;
  color: #13865f;
  font-size: 12px;
}

.wizard-wide-button {
  width: 100%;
}

.wizard-wide-button + .wizard-wide-button {
  margin: 10px 0 0;
}

.wizard-preview-body {
  max-height: 76vh;
  overflow: auto;
  padding: 20px;
  background: #eef2f7;
}

.wizard-paper {
  width: 794px;
  min-height: 1060px;
  margin: 0 auto;
  padding: 70px 74px;
  color: #222;
  background: #fff;
  box-shadow: 0 8px 28px rgba(33, 51, 81, 0.11);
  font-family: "SimSun", "Songti SC", serif;
}

.wizard-paper-cover {
  min-height: 420px;
  padding-top: 52px;
  text-align: center;
}

.wizard-paper-cover > p {
  margin: 0;
  text-align: left;
  font-size: 14px;
}

.wizard-paper-cover h1 {
  margin: 85px 0 10px;
  font-size: 28px;
  letter-spacing: 2px;
}

.wizard-paper-cover h2 {
  margin: 0 0 70px;
  font-size: 25px;
  letter-spacing: 7px;
}

.wizard-paper-cover dl {
  width: 72%;
  margin: 0 auto;
  text-align: left;
  font-size: 16px;
  line-height: 2.4;
}

.wizard-paper-cover dl div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
}

.wizard-paper-cover dt,
.wizard-paper-cover dd {
  margin: 0;
}

.wizard-paper-cover footer {
  display: grid;
  gap: 8px;
  margin-top: 80px;
}

.wizard-paper-cover footer span {
  color: #666;
  font-size: 13px;
}

.wizard-paper-section {
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px solid #333;
}

.wizard-paper-section h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.wizard-paper-section p {
  margin: 7px 0;
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.8;
}

.wizard-paper-section .placeholder {
  color: #999;
}

.wizard-paper-signatures {
  display: grid;
  gap: 18px;
}

.wizard-paper-signatures div {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) 150px;
  align-items: center;
  gap: 10px;
  min-height: 54px;
  border-bottom: 1px solid #aaa;
}

.wizard-paper-signatures img {
  max-width: 180px;
  max-height: 48px;
}

.wizard-paper-signatures em {
  color: #999;
  font-style: normal;
}

@media (max-width: 1500px) {
  .wizard-workspace {
    grid-template-columns: 238px minmax(620px, 1fr);
  }

  .wizard-summary-panel {
    display: none;
  }
}

@media (max-width: 980px) {
  .wizard-context-card,
  .wizard-stage-card header,
  .wizard-form-head,
  .wizard-form-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .wizard-workspace {
    grid-template-columns: 1fr;
  }

  .wizard-step-panel,
  .wizard-summary-panel {
    position: static;
  }

  .wizard-summary-panel {
    display: block;
  }

  .wizard-stage-flow,
  .wizard-form-grid,
  .wizard-form-grid.three,
  .wizard-signature-grid {
    grid-template-columns: 1fr;
  }

  .wizard-stage-item:not(:last-child)::after {
    display: none;
  }
}
</style>
