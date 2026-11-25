<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, shallowRef, watch } from 'vue'
import { Back, DocumentChecked, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { InitiationBatchMockRow } from '../../dataset/initiationProjectsMock'
import type { LoggedInUser } from '../../types/auth'
import {
  cloneWizardState,
  createAnnualAllocations,
  createDefaultWizardState,
  createParticipantRow,
  formatFillMonth,
  loadWizardDraft,
  saveWizardDraft,
  wizardPresetTotalBudget,
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

const FIXED_PACKAGE_NOTE =
  '本批次项目按包干制科研项目管理，无需编制明细预算，由项目负责人根据科研实际需要统筹安排使用。实际经费使用需按设备费、业务费、劳务费（比例不得超过项目总经费的 30%）三类科目列支，不设间接费用。'

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
const departmentOptions = ['人工智能学部', '理学部', '工学部', '人文与社会科学学部', '经济管理学部']
const subdirectionOptions: Record<string, string[]> = {
  人工智能学部: ['AI核心', 'AI × 科学技术', 'AI × 人文社科', 'AI × 产业应用'],
  理学部: ['数学', '物理', '化学', '生命科学'],
  工学部: ['智能制造', '能源环境', '集成电路', '生物医学工程'],
  人文与社会科学学部: ['法学', '教育学', '新闻传播学', '心理学'],
  经济管理学部: ['理论经济学', '应用经济学', '工商管理学', '公共管理学'],
}
const pptAccept = '.ppt,.pptx,.pdf'
const pptMaxSizeMb = 100

const batchDisplayName = computed(() => props.batch.batch_name ?? props.batch.batchName)
const batchDisplayCode = computed(() => props.batch.batch_code ?? props.batch.batchCode)
const batchDeadline = computed(() => props.batch.batch_apply_deadline ?? props.batch.applyPeriod)
const currentStepDefinition = computed(() => wizardSteps[activeStep.value])
const currentStageIndex = computed(() =>
  wizardStages.findIndex((stage) => stage.steps.includes(activeStep.value)),
)
const subdirectionChoices = computed(() => subdirectionOptions[application.department] ?? [])
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
      `所属学部：${displayText(application.department)}`,
      `所属子方向：${displayText(application.subdirection)}`,
      `类别：${displayText(application.projectCategory)}`,
      `研究周期：${application.researchPeriod || '尚未填写'} 年`,
      `首年经费：${application.firstYearBudget || 0} 万元`,
      `内容摘要：${displayText(application.abstract)}`,
      `答辩 PPT：${displayText(application.defensePptName)}`,
    ].join('\n'),
  },
  {
    title: '申请人信息',
    body: [
      `单位名称：${displayText(application.unitName)}`,
      `姓名：${displayText(application.applicantName)}`,
      `性别：${displayText(application.gender)}`,
      `出生年月：${displayText(application.birthMonth)}`,
      `学历：${displayText(application.education)}`,
      `职称：${displayText(application.professionalTitle)}`,
      `手机/电话：${displayText(application.mobile)}`,
      `邮箱：${displayText(application.email)}`,
    ].join('\n'),
  },
  {
    title: '一、研究目的和意义简述',
    body: application.researchPurpose,
  },
  {
    title: '二、主要研究内容',
    body: application.mainResearchContent,
  },
  {
    title: '三、研究基础',
    body: application.researchFoundation,
  },
  {
    title: '四、年度研究任务和实施方案',
    body: application.annualTasks,
  },
  {
    title: '五、总体考核指标',
    body: application.assessmentIndicators,
  },
  {
    title: '参加人员名单',
    body: application.participants
      .map((member) =>
        `${member.category}：${displayText(member.name)} / ${displayText(member.unit)} / ${displayText(member.responsibility)}`,
      )
      .join('\n'),
  },
  {
    title: '项目预算明细',
    body: `项目总预算 ${formatMoney(application.totalBudget)} 万元（PMO 预设，包干制，无需填写预算明细）\n包干说明：${packageNoteText}`,
  },
  {
    title: '项目经费使用承诺书',
    body: application.consent
      ? `已在线确认承诺书内容，确认人：${application.applicantName || '[姓名]'}，确认时间：${application.consentConfirmedAt || '刚刚'}${
          application.jointEnabled ? `；联合项目负责人：${displayText(application.jointLeaderName)}` : ''
        }`
      : '尚未确认承诺书。',
  },
])

const packageNoteText = FIXED_PACKAGE_NOTE

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
  () => [application.applicantName, application.unitName, application.gender, application.professionalTitle],
  () => {
    syncLeaderParticipant()
  },
)

watch(
  () => application.researchPeriod,
  (period) => {
    application.annualAllocations = createAnnualAllocations(period)
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

function goToStep(index: number) {
  saveDraft(false)
  activeStep.value = Math.max(0, Math.min(wizardSteps.length - 1, index))
}

function saveCurrentStep() {
  saveDraft(true)
}

function richtextCharCount(value: string | undefined) {
  return (value ?? '').length
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
      stepIndex: 2,
      valid: getLength('researchPurpose') <= 1500,
      message: '一、研究目的和意义简述不能超过 1500 字',
    },
    {
      stepIndex: 2,
      valid: getLength('mainResearchContent') <= 1500,
      message: '二、主要研究内容不能超过 1500 字',
    },
    {
      stepIndex: 2,
      valid: getLength('researchFoundation') <= 1000,
      message: '三、研究基础不能超过 1000 字',
    },
  ].find((item) => !item.valid)

  if (overLimit) {
    return {
      firstStep: overLimit.stepIndex,
      invalidSteps: new Set([overLimit.stepIndex]),
      message: overLimit.message,
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

  return Math.round((filled / total) * 100)
}

function getStepRequiredValues(index: number): unknown[] {
  if (index === 0) {
    return [
      application.projectName,
      application.department,
      application.subdirection,
      application.projectCategory,
      application.researchPeriod,
      application.firstYearBudget,
      application.abstract,
    ]
  }

  if (index === 1) {
    return [
      application.unitName,
      application.applicantName,
      application.gender,
      application.birthMonth,
      application.education,
      application.professionalTitle,
      application.mobile,
      application.email,
    ]
  }

  if (index === 2) {
    return [
      application.researchPurpose,
      application.mainResearchContent,
      application.researchFoundation,
      application.annualTasks,
      application.assessmentIndicators,
    ]
  }

  if (index === 3) {
    return application.participants.flatMap((participant) => [
      participant.name,
      participant.unit,
      participant.gender,
      participant.major,
      participant.title,
      participant.responsibility,
    ])
  }

  if (index === 4) {
    return [application.totalBudget]
  }

  if (index === 6) {
    const requiredValues: unknown[] = [application.consent]

    if (application.jointEnabled) {
      requiredValues.push(application.jointLeaderName)
    }

    return requiredValues
  }

  return []
}

function getStepMissing(index: number): MissingResult[] {
  const missing: string[] = []

  if (index === 0) {
    pushMissing(missing, application.projectName, '项目名称')
    pushMissing(missing, application.department, '所属学部')
    pushMissing(missing, application.subdirection, '所属子方向')
    pushMissing(missing, application.projectCategory, '类别')
    pushMissing(missing, application.researchPeriod, '研究周期')
        pushMissing(missing, application.abstract, '内容摘要')

    if (application.abstract.length > 400) {
      missing.push('内容摘要超过 400 字')
    }
  }

  if (index === 1) {
    pushMissing(missing, application.unitName, '单位名称')
    pushMissing(missing, application.applicantName, '姓名')
    pushMissing(missing, application.mobile, '手机/电话')
    pushMissing(missing, application.email, '邮箱')
  }

  if (index === 2) {
    pushMissing(missing, application.researchPurpose, '一、研究目的和意义简述')
    pushMissing(missing, application.mainResearchContent, '二、主要研究内容')
    pushMissing(missing, application.researchFoundation, '三、研究基础')
    pushMissing(missing, application.annualTasks, '四、年度研究任务和实施方案')
    pushMissing(missing, application.assessmentIndicators, '五、总体考核指标')

    if (getLength('researchPurpose') > 1500) {
      missing.push('一、研究目的和意义简述超过 1500 字')
    }

    if (getLength('mainResearchContent') > 1500) {
      missing.push('二、主要研究内容超过 1500 字')
    }

    if (getLength('researchFoundation') > 1000) {
      missing.push('三、研究基础超过 1000 字')
    }
  }

  if (index === 3) {
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

  if (index === 6) {
    pushMissing(missing, application.consent, '承诺书在线确认')

    if (application.jointEnabled) {
      pushMissing(missing, application.jointLeaderName, '联合项目负责人姓名')
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
    return Number.isFinite(value) && value !== 0
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

function handlePptChange(_file: unknown, fileList: { name: string }[]) {
  application.defensePptName = fileList[0]?.name ?? ''
}

function handlePptRemove() {
  application.defensePptName = ''
}

function handlePptExceed() {
  ElMessage.warning('仅支持上传一个答辩 PPT 附件')
}

function beforePptUpload(file: File) {
  if (file.size > pptMaxSizeMb * 1024 * 1024) {
    ElMessage.error(`附件不能超过 ${pptMaxSizeMb}MB`)
    return false
  }

  return false
}

function handleConsentChange(value: boolean) {
  if (value) {
    application.consentConfirmedAt = `${formatFillMonth(application.fillDate)}（系统记录）`
  } else {
    application.consentConfirmedAt = ''
  }
}

function normalizeMoney(value: number) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function formatMoney(value: number) {
  return normalizeMoney(value).toFixed(2)
}

function getLength(key: keyof ProjectApplicationWizardState) {
  return String(application[key] ?? '').length
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
      </header>

      <div class="wizard-stage-flow">
        <div
          v-for="(stage, stageIndex) in wizardStages"
          :key="stage.name"
          class="wizard-stage-item"
          :class="getStageClass(stageIndex, stage.steps)"
        >
          <strong>{{ stage.name }}</strong>
          <span class="wizard-stage-dot">{{ stage.steps.every((step) => getStepCompletion(step) === 100) ? '✓' : stageIndex + 1 }}</span>
        </div>
      </div>
    </section>

    <section class="wizard-workspace">
      <aside class="wizard-panel wizard-step-panel">
        <h2>申报书目录</h2>

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
          </div>
          <el-tag :type="getStepTagType(activeStep)" effect="light">
            {{ getStepTagText(activeStep) }}
          </el-tag>
        </header>

        <el-form class="wizard-form-body" label-position="top" :model="application">
          <template v-if="activeStep === 0">
            <section class="wizard-form-section">
              <h3>项目基本信息</h3>
              <div class="wizard-form-grid">
                <el-form-item label="项目名称" class="full" required>
                  <el-input v-model.trim="application.projectName" maxlength="100" show-word-limit />
                </el-form-item>

                <el-form-item label="所属学部" required>
                  <el-select v-model="application.department" placeholder="请选择所属学部">
                    <el-option
                      v-for="department in departmentOptions"
                      :key="department"
                      :label="department"
                      :value="department"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="所属子方向" required>
                  <el-select v-model="application.subdirection" placeholder="请选择所属子方向">
                    <el-option
                      v-for="subdirection in subdirectionChoices"
                      :key="subdirection"
                      :label="subdirection"
                      :value="subdirection"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="类别" required>
                  <el-input v-model="application.projectCategory" disabled>
                    <template #append>与批次信息同步，不可修改</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="研究周期" required>
                  <el-input-number v-model="application.researchPeriod" :min="1" :max="5" controls-position="right" />
                  <span class="wizard-unit-text">年</span>
                </el-form-item>

                </div>
            </section>

            <section class="wizard-form-section">
              <h3>内容摘要</h3>
              <el-form-item label="内容摘要" required>
                <div class="rich-editor" aria-label="内容摘要富文本编辑器">
                  <div class="rich-editor-toolbar" role="toolbar" aria-label="富文本工具栏">
                    <el-tooltip content="加粗" placement="top">
                      <button type="button" class="rich-editor-btn" aria-label="加粗"><strong>B</strong></button>
                    </el-tooltip>
                    <el-tooltip content="斜体" placement="top">
                      <button type="button" class="rich-editor-btn" aria-label="斜体"><em>I</em></button>
                    </el-tooltip>
                    <el-tooltip content="下划线" placement="top">
                      <button type="button" class="rich-editor-btn" aria-label="下划线"><ins>U</ins></button>
                    </el-tooltip>
                    <span class="rich-editor-divider" />
                    <el-tooltip content="无序列表" placement="top">
                      <button type="button" class="rich-editor-btn" aria-label="无序列表">•≡</button>
                    </el-tooltip>
                    <el-tooltip content="有序列表" placement="top">
                      <button type="button" class="rich-editor-btn" aria-label="有序列表">1.</button>
                    </el-tooltip>
                    <span class="rich-editor-divider" />
                    <el-tooltip content="插入图片" placement="top">
                      <button type="button" class="rich-editor-btn" aria-label="插入图片">🖼️</button>
                    </el-tooltip>
                    <el-tooltip content="清除格式" placement="top">
                      <button type="button" class="rich-editor-btn" aria-label="清除格式">✕</button>
                    </el-tooltip>
                  </div>
                  <el-input
                    v-model="application.abstract"
                    type="textarea"
                    :rows="6"
                    placeholder="概述项目研究对象、核心问题、主要方法和预期价值。"
                    class="rich-editor-body"
                  />
                </div>
              </el-form-item>
            </section>

          </template>

          <template v-else-if="activeStep === 1">
            <section class="wizard-form-section">
              <h3>申请人信息</h3>
              <p class="wizard-section-tip">以下信息从人员主数据自动带出，允许补充修改。</p>
              <div class="wizard-form-grid three">
                <el-form-item label="单位名称">
                  <el-input v-model.trim="application.unitName" disabled>
                    <template #append>主数据带出</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="姓名">
                  <el-input v-model.trim="application.applicantName" disabled>
                    <template #append>主数据带出</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="性别">
                  <el-select v-model="application.gender" disabled placeholder="请选择">
                    <el-option v-for="gender in genderOptions" :key="gender" :label="gender" :value="gender" />
                  </el-select>
                </el-form-item>

                <el-form-item label="出生年月">
                  <el-date-picker
                    v-model="application.birthMonth"
                    type="month"
                    value-format="YYYY-MM"
                    format="YYYY-MM"
                    placeholder="请选择出生年月"
                    disabled
                  />
                </el-form-item>

                <el-form-item label="学历">
                  <el-select v-model="application.education" disabled placeholder="请选择">
                    <el-option
                      v-for="education in educationOptions"
                      :key="education"
                      :label="education"
                      :value="education"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="职称">
                  <el-input v-model.trim="application.professionalTitle" disabled>
                    <template #append>主数据带出</template>
                  </el-input>
                </el-form-item>

                <el-form-item label="手机/电话" required>
                  <el-input v-model.trim="application.mobile" placeholder="可修改，用于联络" />
                </el-form-item>

                <el-form-item label="邮箱" required>
                  <el-input v-model.trim="application.email" placeholder="可修改，用于联络" />
                </el-form-item>
              </div>
            </section>
          </template>

          <template v-else-if="activeStep === 2">
            <section class="wizard-form-section">
              <h3>一、研究目的和意义简述（≤1500字）</h3>
              <div class="wizard-richtext-demo">
                <div class="wizard-richtext-toolbar" role="toolbar" aria-label="富文本工具栏">
                  <el-tooltip content="加粗" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn is-active"><strong>B</strong></button>
                  </el-tooltip>
                  <el-tooltip content="斜体" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><em>I</em></button>
                  </el-tooltip>
                  <el-tooltip content="下划线" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><span style="text-decoration: underline">U</span></button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="项目符号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">•⋮</button>
                  </el-tooltip>
                  <el-tooltip content="编号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">1⋮</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入公式" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">∑</button>
                  </el-tooltip>
                  <el-tooltip content="插入表格" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">▦</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入图片" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">🖼</button>
                  </el-tooltip>
                  <span class="wizard-richtext-wordcount">{{ richtextCharCount(application.researchPurpose) }}/1500</span>
                </div>
                <div class="wizard-richtext-editor" contenteditable="true" data-placeholder="请输入研究目的和意义简述">
                  {{ application.researchPurpose }}
                </div>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>二、主要研究内容（≤1500字）</h3>
              <div class="wizard-richtext-demo">
                <div class="wizard-richtext-toolbar" role="toolbar" aria-label="富文本工具栏">
                  <el-tooltip content="加粗" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn is-active"><strong>B</strong></button>
                  </el-tooltip>
                  <el-tooltip content="斜体" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><em>I</em></button>
                  </el-tooltip>
                  <el-tooltip content="下划线" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><span style="text-decoration: underline">U</span></button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="项目符号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">•⋮</button>
                  </el-tooltip>
                  <el-tooltip content="编号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">1⋮</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入公式" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">∑</button>
                  </el-tooltip>
                  <el-tooltip content="插入表格" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">▦</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入图片" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">🖼</button>
                  </el-tooltip>
                  <span class="wizard-richtext-wordcount">{{ richtextCharCount(application.mainResearchContent) }}/1500</span>
                </div>
                <div class="wizard-richtext-editor" contenteditable="true" data-placeholder="请输入主要研究内容">
                  {{ application.mainResearchContent }}
                </div>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>三、研究基础（≤1000字）</h3>
              <div class="wizard-richtext-demo">
                <div class="wizard-richtext-toolbar" role="toolbar" aria-label="富文本工具栏">
                  <el-tooltip content="加粗" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn is-active"><strong>B</strong></button>
                  </el-tooltip>
                  <el-tooltip content="斜体" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><em>I</em></button>
                  </el-tooltip>
                  <el-tooltip content="下划线" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><span style="text-decoration: underline">U</span></button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="项目符号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">•⋮</button>
                  </el-tooltip>
                  <el-tooltip content="编号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">1⋮</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入公式" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">∑</button>
                  </el-tooltip>
                  <el-tooltip content="插入表格" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">▦</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入图片" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">🖼</button>
                  </el-tooltip>
                  <span class="wizard-richtext-wordcount">{{ richtextCharCount(application.researchFoundation) }}/1000</span>
                </div>
                <div class="wizard-richtext-editor" contenteditable="true" data-placeholder="请输入研究基础">
                  {{ application.researchFoundation }}
                </div>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>四、年度研究任务和实施方案</h3>
              <div class="wizard-richtext-demo">
                <div class="wizard-richtext-toolbar" role="toolbar" aria-label="富文本工具栏">
                  <el-tooltip content="加粗" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn is-active"><strong>B</strong></button>
                  </el-tooltip>
                  <el-tooltip content="斜体" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><em>I</em></button>
                  </el-tooltip>
                  <el-tooltip content="下划线" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><span style="text-decoration: underline">U</span></button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="项目符号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">•⋮</button>
                  </el-tooltip>
                  <el-tooltip content="编号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">1⋮</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入公式" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">∑</button>
                  </el-tooltip>
                  <el-tooltip content="插入表格" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">▦</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入图片" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">🖼</button>
                  </el-tooltip>
                </div>
                <div class="wizard-richtext-editor" contenteditable="true" data-placeholder="请输入年度研究任务和实施方案">
                  {{ application.annualTasks }}
                </div>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>五、总体考核指标</h3>
              <div class="wizard-richtext-demo">
                <div class="wizard-richtext-toolbar" role="toolbar" aria-label="富文本工具栏">
                  <el-tooltip content="加粗" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn is-active"><strong>B</strong></button>
                  </el-tooltip>
                  <el-tooltip content="斜体" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><em>I</em></button>
                  </el-tooltip>
                  <el-tooltip content="下划线" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn"><span style="text-decoration: underline">U</span></button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="项目符号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">•⋮</button>
                  </el-tooltip>
                  <el-tooltip content="编号列表" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">1⋮</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入公式" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">∑</button>
                  </el-tooltip>
                  <el-tooltip content="插入表格" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">▦</button>
                  </el-tooltip>
                  <span class="wizard-richtext-divider"></span>
                  <el-tooltip content="插入图片" placement="top" effect="light">
                    <button type="button" class="wizard-richtext-btn">🖼</button>
                  </el-tooltip>
                </div>
                <div class="wizard-richtext-editor" contenteditable="true" data-placeholder="请输入总体考核指标">
                  {{ application.assessmentIndicators }}
                </div>
              </div>
            </section>
          </template>

          <template v-else-if="activeStep === 3">
            <section class="wizard-form-section">
              <h3>参加人员名单</h3>

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
                      <el-input v-model.trim="row.name" :disabled="$index === 0" placeholder="人员选择或手动输入" />
                    </template>
                  </el-table-column>
                  <el-table-column label="单位" min-width="150">
                    <template #default="{ row, $index }">
                      <el-input v-model.trim="row.unit" :disabled="$index === 0" placeholder="自动带出或手动输入" />
                    </template>
                  </el-table-column>
                  <el-table-column label="性别" width="98">
                    <template #default="{ row, $index }">
                      <el-select v-model="row.gender" :disabled="$index === 0" placeholder="选择">
                        <el-option v-for="gender in genderOptions" :key="gender" :label="gender" :value="gender" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="专业" min-width="130">
                    <template #default="{ row }">
                      <el-input v-model.trim="row.major" placeholder="自动带出或手动输入" />
                    </template>
                  </el-table-column>
                  <el-table-column label="职称/职务" min-width="130">
                    <template #default="{ row }">
                      <el-input v-model.trim="row.title" placeholder="自动带出或手动输入" />
                    </template>
                  </el-table-column>
                  <el-table-column label="责任分工" min-width="160">
                    <template #default="{ row }">
                      <el-input v-model.trim="row.responsibility" maxlength="100" />
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
                <el-button @click="addParticipant">新增成员</el-button>
              </footer>
            </section>
          </template>

          <template v-else-if="activeStep === 4">
            <section class="wizard-form-section">
              <h3>项目预算明细</h3>
              <p class="wizard-section-tip">
                本批次按包干制管理，项目总预算由 PMO 统一预设（{{
                  formatMoney(wizardPresetTotalBudget)
                }}
                万元），申请人无需填写预算明细。
              </p>

              <div class="wizard-package-note" role="note" aria-label="包干说明">
                <strong>包干说明</strong>
                <p>{{ packageNoteText }}</p>
              </div>
            </section>
          </template>

          <template v-else-if="activeStep === 5">
            <section class="wizard-form-section">
              <h3>答辩材料</h3>
              <el-form-item label="答辩 PPT 附件（复审必填）">
                <el-upload
                  drag
                  :auto-upload="false"
                  :limit="1"
                  :accept="pptAccept"
                  :on-change="handlePptChange"
                  :on-remove="handlePptRemove"
                  :on-exceed="handlePptExceed"
                  :before-upload="beforePptUpload"
                >
                  <div class="wizard-upload-hint">
                    <strong>点击或拖拽上传答辩 PPT</strong>
                    <span>初审前不强制要求；通过初审后可按初审意见修改申报书并提交复审 PPT（≤100MB）</span>
                  </div>
                </el-upload>
              </el-form-item>
            </section>
          </template>

          <template v-else>
            <section class="wizard-form-section">
              <h3>联合项目负责人</h3>
              <div class="wizard-form-grid">
                <el-form-item label="是否存在联合项目负责人" class="full">
                  <el-switch
                    v-model="application.jointEnabled"
                    active-text="存在"
                    inactive-text="不存在"
                  />
                </el-form-item>
                <el-form-item v-if="application.jointEnabled" label="联合项目负责人姓名" required>
                  <el-input
                    v-model.trim="application.jointLeaderName"
                    placeholder="可在组织架构选择或输入文本"
                  />
                </el-form-item>
              </div>
            </section>

            <section class="wizard-form-section">
              <h3>项目经费使用承诺书</h3>
              <div class="wizard-commitment-box">
                <p>
                  项目负责人 {{ application.applicantName || '[姓名]' }}
                  <template v-if="application.jointEnabled">
                    ，联合项目负责人 {{ application.jointLeaderName || '[姓名]' }}
                  </template>
                  ，
                  现为北京中关村学院 {{ application.projectName || '[项目名称]' }} 的项目经费负责人，特此承诺如下：
                </p>
                <h4>一、项目经费使用责任</h4>
                <p>本人承诺，在承担[项目名称]管理职责过程中，本人是科研经费管理的第一责任人，对经费使用的合理性、真实性、合规性负责。</p>
                <h4>二、项目经费审批和监督</h4>
                <p>本人承诺在项目执行过程中，负责在项目预算额度内按学院财务规定对所有经费使用进行严格审批。若有任何需要调整预算的情况，本人将按照学院项目管理规定履行相关审批流程。本人承诺负责本项目经费的管理与监督，确保报销事项和报销材料的真实、准确、合规。如因虚假报销或不合理使用导致经济损失，本人愿意承担最终责任。</p>
                <h4>三、项目经费使用的合规性</h4>
                <p>本人承诺在项目实施过程中，所有开支均符合相关法律法规、学院规章制度规定及项目合同约定。若项目中出现不合规支出，本人愿意承担最终责任。本人承诺项目经费仅用于与本项目实施相关的必要支出，不得挪用、滥用或超出预算范围，不得用于其他无关事务。除另有约定外，本项目经费购置的固定资产（如设备、软件）及无形资产（如专利、版权）均为学院资产，本人承诺按学院资产管理规定办理入库、登记；项目结题后配合资产盘点与移交，不擅自处置或占用；若因资产流失致学院损失，本人承担赔偿责任。</p>
                <h4>四、责任承担</h4>
                <p>本人作为项目负责人，负责经费的审批和管理。如经学院财务部或审计部门发现经费使用存在虚假、滥用或不合规的情况，本人将积极协助调查处理。如项目经费使用不当、超支或违反经费管理规定，给学院造成损失或影响项目执行，学院可追究本人相应责任，包括而不限于：取消经费负责人资格、追回相应经费、索赔因项目经费不当使用而致使学院遭受的全部损失等。本人已知悉学院科研经费相关管理规定：对于不履行科研经费管理责任、违规使用科研经费的行为，视情节轻重采取通报批评、冻结科研经费使用、取消责任人一定期限内项目申报资格、取消导师资格等处罚措施。涉嫌犯罪的，依法移送司法机关追究法律责任。</p>
                <h4>五、声明</h4>
                <p>本人已认真阅读承诺函全部内容并理解其含义。若本人有任何违反上述承诺的行为，愿意承担相应责任。</p>
                <p>特此承诺。</p>
              </div>

              <el-checkbox
                :model-value="application.consent"
                class="wizard-consent"
                @update:model-value="(_value: boolean | string | number) => { application.consent = Boolean(_value); handleConsentChange(Boolean(_value)) }"
              >
                已阅读并同意项目经费使用承诺书全部内容（提交前必选，系统记录确认人与时间）
              </el-checkbox>
              <p v-if="application.consentConfirmedAt" class="wizard-consent-record">
                确认人：{{ application.applicantName }} · 确认时间：{{ application.consentConfirmedAt }}
              </p>
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
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #8a97ac;
}

.wizard-stage-item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 38px;
  left: calc(50% + 21px);
  right: calc(-50% + 21px);
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

.wizard-stage-item strong {
  display: block;
  color: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.wizard-richtext-demo {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.wizard-richtext-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid #e7ebf2;
  background: #f7f9fc;
}

.wizard-richtext-btn {
  display: grid;
  place-items: center;
  min-width: 28px;
  height: 28px;
  padding: 0 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #4e5969;
  font-size: 13px;
  cursor: pointer;
}

.wizard-richtext-btn:hover {
  border-color: #c6d4ea;
  background: #eef4ff;
}

.wizard-richtext-btn.is-active {
  border-color: #9dc2ff;
  background: #e1efff;
  color: #236edc;
}

.wizard-richtext-divider {
  width: 1px;
  height: 16px;
  margin: 0 6px;
  background: #dcdfe6;
}

.wizard-richtext-wordcount {
  margin-left: auto;
  color: #a0aabc;
  font-size: 12px;
}

.wizard-richtext-editor {
  min-height: 168px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.7;
  outline: none;
  background: #fff;
}

.wizard-richtext-editor:empty::before {
  content: attr(data-placeholder);
  color: #c0c4cc;
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

.wizard-package-note {
  margin: 14px 0 0;
  padding: 14px 16px;
  border: 1px solid #dbe7f8;
  border-left: 4px solid #3478ee;
  border-radius: 10px;
  background: #f6faff;
}

.wizard-package-note strong {
  display: block;
  margin-bottom: 6px;
  color: #245dc9;
  font-size: 13px;
  font-weight: 700;
}

.wizard-package-note p {
  margin: 0;
  color: #344159;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-line;
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
.rich-editor {
  width: 100%;
  display: grid;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.rich-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid #e7eaf0;
  background: #f7f9fc;
}

.rich-editor-btn {
  min-width: 28px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: #475069;
  font-size: 13px;
  line-height: 1;
}

.rich-editor-btn:hover {
  border-color: #c6d4f5;
  background: #eef3ff;
  color: #1f6feb;
}

.rich-editor-divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: #dcdfe6;
}

.rich-editor-body :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 10px 12px;
}
</style>
