<script setup lang="ts">
import { computed, reactive, shallowRef, watch, type Component } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import {
  ArrowLeft,
  Collection,
  Connection,
  DataAnalysis,
  Delete,
  Document,
  Download,
  Edit,
  Finished,
  Link,
  Notebook,
  OfficeBuilding,
  Plus,
  PriceTag,
  Refresh,
  RefreshLeft,
  Search,
  Upload,
  View,
} from '@element-plus/icons-vue'
import {
  buildPaperKnowledgeOptions,
  buildPaperOptions,
  buildPaperQualityReport,
  clonePaperKnowledge,
  clonePaperOutcomes,
  createPaperOutcomeId,
  emptyPaperKnowledgeFilters,
  emptyPaperOutcomeFilters,
  enrichPaperOutcomes,
  filterPaperKnowledge,
  filterPaperOutcomes,
  type PaperKnowledge,
  type PaperKnowledgeFilters,
  type PaperOutcome,
  type PaperOutcomeFilters,
} from '../../dataset/paperOutcomesMock'

type OutcomeModuleKey = 'list' | 'knowledge' | 'match' | 'excel' | 'quality'
type MetricTone = 'blue' | 'green' | 'purple' | 'amber' | 'red'

interface PaperModuleItem {
  key: OutcomeModuleKey
  label: string
  icon: Component
  tone: MetricTone
  badge: string
}

interface AiMatchRuleResult {
  label: string
  description: string
  matched: boolean
  evidence: string
}

interface AiMatchAnalysis {
  paperKey: string
  checkedCount: number
  confidence: number
  matchDegree: '高' | '中' | '低'
  summary: string
  checkedAt: string
  rules: AiMatchRuleResult[]
}

const papers = shallowRef<PaperOutcome[]>(clonePaperOutcomes())
const knowledge = shallowRef<PaperKnowledge[]>(clonePaperKnowledge())
const loading = shallowRef(false)
const error = shallowRef('')
const activeModuleKey = shallowRef<OutcomeModuleKey>('list')
const editorOpen = shallowRef(false)
const editingPaper = shallowRef<PaperOutcome | null>(null)
const paperDetailOpen = shallowRef(false)
const detailPaper = shallowRef<PaperOutcome | null>(null)
const paperPage = shallowRef(1)
const paperPageSize = shallowRef(10)
const knowledgePage = shallowRef(1)
const knowledgePageSize = shallowRef(10)
const qualityPage = shallowRef(1)
const qualityPageSize = shallowRef(10)
const unmatchedPage = shallowRef(1)
const matchedPage = shallowRef(1)
const selectedKnowledgeId = shallowRef('')
const selectedUnmatchedId = shallowRef('')
const activeMatchTab = shallowRef<'unmatched' | 'matched'>('unmatched')
const manualMatchedPaperKeys = shallowRef<string[]>([])
const aiMatchAnalysis = shallowRef<AiMatchAnalysis | null>(null)

const paperFilters = reactive<PaperOutcomeFilters>({ ...emptyPaperOutcomeFilters })
const knowledgeFilters = reactive<PaperKnowledgeFilters>({ ...emptyPaperKnowledgeFilters })

function createEmptyPaper(): PaperOutcome {
  return {
    id: '',
    title: '',
    resultType: '期刊论文',
    venueName: '',
    venueShortName: '',
    year: String(new Date().getFullYear()),
    paperStatus: '待核实',
    doi: '',
    paperUrl: '',
    preprintUrl: '',
    authors: '',
    collegeAuthors: '',
    source: '前端录入',
    batch: '',
    verificationStatus: '未核验',
    remark: '',
    projectId: '',
    projectName: '',
    projectOwner: '',
  }
}

const paperForm = reactive<PaperOutcome>(createEmptyPaper())

const sourceEnrichedPapers = computed(() => enrichPaperOutcomes(papers.value, knowledge.value))
const enrichedPapers = computed(() =>
  sourceEnrichedPapers.value.map((paper) => {
    if (!manualMatchedPaperKeys.value.includes(getPaperKey(paper))) {
      return paper
    }

    return {
      ...paper,
      matchStatus: '已匹配',
      matchedBy: 'AI 原型检验 + 人工确认',
      matchedName: paper.matchedName || paper.venueName || paper.venueShortName || '人工确认匹配',
      matchConfidence: Math.max(paper.matchConfidence ?? 0, aiMatchAnalysis.value?.confidence ?? 88),
    }
  }),
)
const auditedPapers = computed(() =>
  sourceEnrichedPapers.value
    .filter((paper) => paper.matchStatus === '已匹配')
    .map((paper) => ({
      ...paper,
      verificationStatus: '已核验',
      matchedName: paper.matchedName || paper.venueName || paper.venueShortName || '已确认匹配',
      matchedBy: paper.matchedBy || '知识库匹配',
      matchConfidence: paper.matchConfidence && paper.matchConfidence > 0 ? paper.matchConfidence : 96,
    })),
)
const filteredPapers = computed(() => filterPaperOutcomes(auditedPapers.value, paperFilters))
const filteredKnowledge = computed(() => filterPaperKnowledge(knowledge.value, knowledgeFilters))
const paperOptions = computed(() => buildPaperOptions(auditedPapers.value))
const knowledgeOptions = computed(() => buildPaperKnowledgeOptions(knowledge.value))
const qualityReport = computed(() => buildPaperQualityReport(enrichedPapers.value))
const unmatchedPapers = computed(() => enrichedPapers.value.filter((paper) => paper.matchStatus !== '已匹配'))
const matchedPapers = computed(() => enrichedPapers.value.filter((paper) => paper.matchStatus === '已匹配'))
const paginatedQualityIssues = computed(() => {
  const start = (qualityPage.value - 1) * qualityPageSize.value
  return qualityReport.value.issues.slice(start, start + qualityPageSize.value)
})

const moduleItems = computed<PaperModuleItem[]>(() => [
  {
    key: 'list',
    label: '成果列表',
    icon: Document,
    tone: 'blue',
    badge: String(filteredPapers.value.length),
  },
  {
    key: 'knowledge',
    label: '期刊/会议知识库',
    icon: Collection,
    tone: 'green',
    badge: String(knowledge.value.length),
  },
  {
    key: 'match',
    label: '匹配核验工作台',
    icon: Connection,
    tone: 'purple',
    badge: String(unmatchedPapers.value.length),
  },
  {
    key: 'excel',
    label: 'Excel 导入导出',
    icon: Upload,
    tone: 'amber',
    badge: 'IO',
  },
  {
    key: 'quality',
    label: '数据质量检查',
    icon: DataAnalysis,
    tone: 'red',
    badge: String(qualityReport.value.summary.issues),
  },
])

const paperStatusOptions = ['投稿中', '已录用', '待核实', '待审核']
const resultTypeOptions = ['期刊论文', '会议论文', '预印本', '其他']
const verificationStatusOptions = ['未核验', '已核验', '需复核', '待确定']
const matchPageSize = 8

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const baseYears = Array.from({ length: currentYear - 2020 + 2 }, (_, index) => String(currentYear + 1 - index))
  const selectedYear = String(paperForm.year || '').trim()

  return selectedYear && !baseYears.includes(selectedYear) ? [selectedYear, ...baseYears] : baseYears
})

const venueOptions = computed(() =>
  knowledge.value
    .filter((item) => item.name)
    .map((item) => ({
      label: item.name,
      value: item.name,
      shortName: item.shortName,
      publisher: item.publisher,
      categoryCn: item.categoryCn,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, 'zh-Hans-CN')),
)

const paginatedPapers = computed(() => {
  const start = (paperPage.value - 1) * paperPageSize.value
  return filteredPapers.value.slice(start, start + paperPageSize.value)
})

const paginatedKnowledge = computed(() => {
  const start = (knowledgePage.value - 1) * knowledgePageSize.value
  return filteredKnowledge.value.slice(start, start + knowledgePageSize.value)
})

const selectedKnowledge = computed(
  () => filteredKnowledge.value.find((item) => item.id === selectedKnowledgeId.value) ?? paginatedKnowledge.value[0] ?? null,
)

const paginatedUnmatchedPapers = computed(() => {
  const start = (unmatchedPage.value - 1) * matchPageSize
  return unmatchedPapers.value.slice(start, start + matchPageSize)
})

const matchedSamplePapers = computed(() => matchedPapers.value.slice(0, 80))

const paginatedMatchedPapers = computed(() => {
  const start = (matchedPage.value - 1) * matchPageSize
  return matchedSamplePapers.value.slice(start, start + matchPageSize)
})

const selectedUnmatchedPaper = computed(
  () => unmatchedPapers.value.find((paper) => getPaperKey(paper) === selectedUnmatchedId.value) ?? paginatedUnmatchedPapers.value[0] ?? null,
)

watch(
  () => filteredPapers.value.length,
  () => {
    paperPage.value = 1
  },
)

watch(
  () => filteredKnowledge.value.length,
  () => {
    knowledgePage.value = 1
  },
)

watch(
  () => qualityReport.value.issues.length,
  () => {
    qualityPage.value = 1
  },
)

watch(
  () => paginatedKnowledge.value.map((item) => item.id).join('|'),
  () => {
    if (!paginatedKnowledge.value.some((item) => item.id === selectedKnowledgeId.value)) {
      selectedKnowledgeId.value = paginatedKnowledge.value[0]?.id ?? ''
    }
  },
  { immediate: true },
)

watch(
  () => paginatedUnmatchedPapers.value.map((paper) => getPaperKey(paper)).join('|'),
  () => {
    if (!paginatedUnmatchedPapers.value.some((paper) => getPaperKey(paper) === selectedUnmatchedId.value)) {
      selectedUnmatchedId.value = getPaperKey(paginatedUnmatchedPapers.value[0])
    }
  },
  { immediate: true },
)

watch(
  () => selectedUnmatchedId.value,
  () => {
    if (aiMatchAnalysis.value && selectedUnmatchedPaper.value) {
      aiMatchAnalysis.value = buildAiMatchAnalysis(selectedUnmatchedPaper.value, unmatchedPapers.value.length)
    }
  },
)

function displayValue(value: unknown, fallback = '未填写') {
  const text = String(value ?? '').trim()
  return text || fallback
}

const academyAffiliationKeywords = [
  '中关村学院',
  '中关村人工智能研究院',
  'Zhongguancun Acadamy',
  'Zhongguancun Academy',
  'Zhongguancun insitution of Artificial inteillgence',
  'Zhongguancun Institution of Artificial Intelligence',
  'Zhongguancun Institute of Artificial Intelligence',
  'ZGAI',
  'ZGCA',
]

function normalizeAiText(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function findKeywordEvidence(text: string, keywords: string[]) {
  const normalizedText = normalizeAiText(text)
  return keywords.find((keyword) => normalizedText.includes(normalizeAiText(keyword))) ?? ''
}

function extractPersonNames(text: string) {
  return String(text || '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .split(/[;；,，、\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
}

function buildAiMatchAnalysis(paper: PaperOutcome, checkedCount = 1): AiMatchAnalysis {
  const affiliationText = [paper.authors, paper.collegeAuthors, paper.projectName, paper.remark, paper.source].filter(Boolean).join(' ')
  const affiliationEvidence = findKeywordEvidence(affiliationText, academyAffiliationKeywords)
  const authorCandidates = [...extractPersonNames(paper.projectOwner), ...extractPersonNames(paper.collegeAuthors)]
  const authorText = [paper.authors, paper.collegeAuthors].filter(Boolean).join(' ')
  const matchedAuthor = authorCandidates.find((name) => normalizeAiText(authorText).includes(normalizeAiText(name))) ?? ''
  const acknowledgementText = [paper.remark, paper.paperUrl, paper.preprintUrl].filter(Boolean).join(' ')
  const acknowledgementEvidence = findKeywordEvidence(acknowledgementText, academyAffiliationKeywords)
  const rules: AiMatchRuleResult[] = [
    {
      label: '两院署名',
      description: '检查论文作者、机构或备注中是否出现中关村学院/中关村人工智能研究院及 ZGAI、ZGCA 等署名。',
      matched: Boolean(affiliationEvidence),
      evidence: affiliationEvidence ? `识别到“${affiliationEvidence}”` : '当前记录未提供明确两院署名，建议补充论文首页或作者单位信息。',
    },
    {
      label: '本人署名',
      description: '检查项目负责人或学院作者姓名是否出现在论文作者字段中。',
      matched: Boolean(matchedAuthor),
      evidence: matchedAuthor ? `识别到作者“${matchedAuthor}”` : '作者字段未识别到项目负责人/学院作者姓名，建议人工确认。',
    },
    {
      label: '致谢署名',
      description: '检查致谢或备注信息中是否包含两院署名。',
      matched: Boolean(acknowledgementEvidence),
      evidence: acknowledgementEvidence ? `致谢信息识别到“${acknowledgementEvidence}”` : '当前记录暂无致谢原文，暂无法自动确认。',
    },
  ]
  const confidence = Math.min(
    98,
    Math.max(
      28,
      (rules[0].matched ? 42 : 0) + (rules[1].matched ? 38 : 0) + (rules[2].matched ? 18 : 0),
    ),
  )
  const matchDegree = confidence >= 80 ? '高' : confidence >= 55 ? '中' : '低'

  return {
    paperKey: getPaperKey(paper),
    checkedCount,
    confidence,
    matchDegree,
    summary:
      matchDegree === '高'
        ? 'AI 原型判断该论文与两院及本人署名高度匹配，可进入人工确认。'
        : matchDegree === '中'
          ? 'AI 原型发现部分匹配线索，建议补充署名或致谢材料后再确认。'
          : 'AI 原型暂未发现充分匹配依据，请人工核对论文首页、作者单位与致谢信息。',
    checkedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    rules,
  }
}

function runAiBatchCheck() {
  const selectedPaper = selectedUnmatchedPaper.value ?? unmatchedPapers.value[0]

  if (!selectedPaper) {
    ElMessage.warning('当前没有待匹配论文可检验')
    return
  }

  aiMatchAnalysis.value = buildAiMatchAnalysis(selectedPaper, unmatchedPapers.value.length)
  ElMessage.success(`已完成 ${unmatchedPapers.value.length} 条待匹配论文的 AI 原型批量检验`)
}

function confirmPaperMatched(paper: PaperOutcome) {
  const paperKey = getPaperKey(paper)

  if (!paperKey) {
    return
  }

  manualMatchedPaperKeys.value = Array.from(new Set([...manualMatchedPaperKeys.value, paperKey]))
  aiMatchAnalysis.value = buildAiMatchAnalysis(paper, Math.max(1, unmatchedPapers.value.length))
  ElMessage.success('已确认匹配；核验状态仍由项目负责人或学生端确认')
}

function getPaperKey(paper?: PaperOutcome | null) {
  if (!paper) {
    return ''
  }

  return paper.recordKey || [paper.id, paper.projectId, paper.projectName].filter(Boolean).join('::') || paper.id
}

function updatePaperFilter(key: keyof PaperOutcomeFilters, value: unknown) {
  paperFilters[key] = String(value ?? '')
}

function updateKnowledgeFilter(key: keyof PaperKnowledgeFilters, value: unknown) {
  knowledgeFilters[key] = String(value ?? '')
}

function resetPaperFilters() {
  Object.assign(paperFilters, emptyPaperOutcomeFilters)
}

function resetKnowledgeFilters() {
  Object.assign(knowledgeFilters, emptyPaperKnowledgeFilters)
}

function selectModule(key: OutcomeModuleKey) {
  activeModuleKey.value = key
  editorOpen.value = false
  editingPaper.value = null
}

function selectKnowledge(item: PaperKnowledge) {
  selectedKnowledgeId.value = item.id
}

function selectUnmatchedPaper(paper: PaperOutcome) {
  selectedUnmatchedId.value = getPaperKey(paper)
}

function syncPaperVenue(value: string) {
  const matchedVenue = venueOptions.value.find((item) => item.value === value)

  if (matchedVenue?.shortName && !paperForm.venueShortName) {
    paperForm.venueShortName = matchedVenue.shortName
  }
}

function assignPaperForm(paper: PaperOutcome) {
  Object.assign(paperForm, { ...createEmptyPaper(), ...paper })
}

function openCreate() {
  editingPaper.value = null
  assignPaperForm(createEmptyPaper())
  editorOpen.value = true
}

function openEdit(paper: PaperOutcome) {
  editingPaper.value = paper
  assignPaperForm(paper)
  editorOpen.value = true
}

function openPaperDetail(paper: PaperOutcome) {
  detailPaper.value = paper
  paperDetailOpen.value = true
}

function editPaperFromDetail() {
  if (!detailPaper.value) {
    return
  }

  openEdit(detailPaper.value)
  paperDetailOpen.value = false
}

function closeEditor() {
  editorOpen.value = false
  editingPaper.value = null
}

function normalizePaperPayload(payload: PaperOutcome): PaperOutcome {
  const now = new Date().toISOString()

  return {
    ...createEmptyPaper(),
    ...payload,
    id: String(payload.id || createPaperOutcomeId()).trim(),
    title: String(payload.title || '').trim(),
    resultType: String(payload.resultType || '').trim(),
    venueName: String(payload.venueName || '').trim(),
    venueShortName: String(payload.venueShortName || '').trim(),
    year: String(payload.year || '').trim(),
    paperStatus: String(payload.paperStatus || '').trim(),
    doi: String(payload.doi || '').trim(),
    authors: String(payload.authors || '').trim(),
    collegeAuthors: String(payload.collegeAuthors || '').trim(),
    batch: String(payload.batch || '').trim(),
    verificationStatus: String(payload.verificationStatus || '').trim() || '未核验',
    projectId: String(payload.projectId || '').trim(),
    projectName: String(payload.projectName || '').trim(),
    projectOwner: String(payload.projectOwner || '').trim(),
    recordKey: payload.recordKey || createPaperOutcomeId('ROW'),
    updatedAt: now,
    createdAt: payload.createdAt || now,
  }
}

function savePaper() {
  if (!paperForm.title.trim()) {
    ElMessage.warning('请先填写论文题目')
    return
  }

  const payload = normalizePaperPayload({ ...paperForm })

  if (editingPaper.value?.id) {
    const editingKey = getPaperKey(editingPaper.value)
    papers.value = papers.value.map((paper) => (getPaperKey(paper) === editingKey ? payload : paper))
    ElMessage.success('论文记录已更新')
  } else {
    papers.value = [payload, ...papers.value]
    ElMessage.success('论文记录已新增')
  }

  closeEditor()
}

async function removePaper(paper: PaperOutcome) {
  try {
    await ElMessageBox.confirm(`确定删除论文记录“${paper.title || paper.id}”？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      autofocus: false,
      closeOnClickModal: false,
    })
    const removingKey = getPaperKey(paper)
    papers.value = papers.value.filter((item) => getPaperKey(item) !== removingKey)
    ElMessage.success('论文记录已删除')
  } catch {
    // 用户取消删除。
  }
}

function markPaperVerified(paper: PaperOutcome) {
  if (!paper?.id) {
    return
  }

  const updatingKey = getPaperKey(paper)
  papers.value = papers.value.map((item) => (getPaperKey(item) === updatingKey ? { ...item, verificationStatus: '已核验' } : item))
  ElMessage.success('已标记为已核验')
}

function markPaperNeedsReview(paper: PaperOutcome) {
  if (!paper?.id) {
    return
  }

  const updatingKey = getPaperKey(paper)
  papers.value = papers.value.map((item) => (getPaperKey(item) === updatingKey ? { ...item, verificationStatus: '需复核' } : item))
  ElMessage.success('已标记为需复核')
}

function reloadFromSource() {
  loading.value = true
  error.value = ''
  papers.value = clonePaperOutcomes()
  knowledge.value = clonePaperKnowledge()
  manualMatchedPaperKeys.value = []
  aiMatchAnalysis.value = null
  resetPaperFilters()
  resetKnowledgeFilters()
  loading.value = false
  ElMessage.success('已重新载入论文成果源表样例数据')
}

function escapeCsvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function exportFilteredPapers() {
  if (filteredPapers.value.length === 0) {
    ElMessage.warning('当前没有可导出的论文记录')
    return
  }

  const columns: Array<[string, keyof PaperOutcome]> = [
    ['论文ID', 'id'],
    ['论文题目', 'title'],
    ['成果类型', 'resultType'],
    ['期刊/会议名称', 'venueName'],
    ['期刊/会议简称', 'venueShortName'],
    ['发表年份', 'year'],
    ['论文状态', 'paperStatus'],
    ['DOI', 'doi'],
    ['全部作者', 'authors'],
    ['学院作者', 'collegeAuthors'],
    ['数据来源', 'source'],
    ['数据批次', 'batch'],
    ['核验状态', 'verificationStatus'],
    ['匹配状态', 'matchStatus'],
    ['匹配名称', 'matchedName'],
    ['项目关联ID', 'projectId'],
    ['项目名称', 'projectName'],
    ['项目负责人', 'projectOwner'],
    ['备注', 'remark'],
  ]
  const csv = [
    columns.map(([label]) => escapeCsvCell(label)).join(','),
    ...filteredPapers.value.map((paper) => columns.map(([, key]) => escapeCsvCell(paper[key])).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `论文筛选结果-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出当前筛选结果')
}

function handleImportFile(file: UploadFile, target: 'papers' | 'knowledge') {
  ElMessage.success(`已接收 ${file.name}，当前原型保留源项目数据结构，正式接入时替换为 Excel 解析接口`)

  if (target === 'papers') {
    papers.value = clonePaperOutcomes()
  } else {
    knowledge.value = clonePaperKnowledge()
  }
}

function handlePaperImportFile(file: UploadFile) {
  handleImportFile(file, 'papers')
}

function handleKnowledgeImportFile(file: UploadFile) {
  handleImportFile(file, 'knowledge')
}

function matchTagType(status?: string) {
  return status === '已匹配' ? 'success' : 'warning'
}

function verifyTagType(status?: string) {
  if (status === '已核验') {
    return 'success'
  }
  if (status === '需复核' || status === '待确定') {
    return 'danger'
  }
  return 'info'
}

</script>

<template>
  <section class="paper-outcomes-page" aria-label="论文成果管理">
    <section class="outcomes-panel module-switcher" aria-label="论文成果管理子功能">
      <button
        v-for="module in moduleItems"
        :key="module.key"
        class="module-button-card"
        :class="[{ active: module.key === activeModuleKey }, `module-button-${module.tone}`]"
        type="button"
        @click="selectModule(module.key)"
      >
        <span class="module-button-icon">
          <el-icon><component :is="module.icon" /></el-icon>
        </span>
        <span class="module-button-content">
          <strong>{{ module.label }}</strong>
        </span>
        <span class="module-button-badge">{{ module.badge }}</span>
      </button>
    </section>

    <template v-if="activeModuleKey === 'list'">
      <section v-if="editorOpen" class="paper-editor-shell page-stack" aria-label="论文记录编辑工作区">
        <div class="paper-editor-return-row">
          <el-button class="paper-editor-back-button" :icon="ArrowLeft" plain round @click="closeEditor">返回列表</el-button>
          <span v-if="editingPaper?.id" class="paper-editor-context">正在编辑：{{ editingPaper.id }}</span>
        </div>

        <section class="outcomes-panel editor-panel" aria-label="论文记录编辑">
          <div class="outcomes-panel-toolbar editor-toolbar">
            <div>
              <h2>{{ editingPaper?.id ? '编辑论文记录' : '新增论文记录' }}</h2>
              <p>字段沿用论文成果管理项目，当前保存到前端原型状态。</p>
            </div>
            <el-tag v-if="editingPaper?.id" type="info" effect="plain" round>{{ editingPaper.id }}</el-tag>
          </div>

          <el-form class="paper-editor-form" :model="paperForm" label-position="top" @submit.prevent>
            <h3>基础信息</h3>
            <div class="paper-editor-grid">
              <el-form-item label="论文ID">
                <el-input v-model="paperForm.id" clearable placeholder="留空自动生成" />
              </el-form-item>
              <el-form-item class="field-wide" label="论文题目" required>
                <el-input v-model="paperForm.title" clearable placeholder="请输入论文题目" />
              </el-form-item>
              <el-form-item label="成果类型">
                <el-select v-model="paperForm.resultType" placeholder="请选择成果类型">
                  <el-option v-for="item in resultTypeOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              <el-form-item class="field-wide" label="期刊/会议名称">
                <el-select
                  v-model="paperForm.venueName"
                  filterable
                  allow-create
                  default-first-option
                  clearable
                  placeholder="输入关键词检索知识库，也可直接录入"
                  @change="syncPaperVenue"
                >
                  <el-option v-for="item in venueOptions" :key="item.value" :label="item.label" :value="item.value">
                    <div class="venue-option-row">
                      <strong>{{ item.label }}</strong>
                      <span>{{ [item.shortName, item.publisher, item.categoryCn].filter(Boolean).join(' / ') || '知识库条目' }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="简称">
                <el-input v-model="paperForm.venueShortName" clearable placeholder="例如 NeurIPS" />
              </el-form-item>
              <el-form-item label="年份">
                <el-select v-model="paperForm.year" clearable filterable placeholder="请选择年份">
                  <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
                </el-select>
              </el-form-item>
              <el-form-item label="论文状态">
                <el-select v-model="paperForm.paperStatus" placeholder="请选择状态">
                  <el-option v-for="item in paperStatusOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              <el-form-item label="DOI">
                <el-input v-model="paperForm.doi" clearable placeholder="10.xxxx/xxxxx" />
              </el-form-item>
            </div>

            <h3>作者与项目信息</h3>
            <div class="paper-editor-grid">
              <el-form-item class="field-wide" label="全部作者">
                <el-input v-model="paperForm.authors" clearable placeholder="多个作者可用分号分隔" />
              </el-form-item>
              <el-form-item class="field-wide" label="学院作者">
                <el-input v-model="paperForm.collegeAuthors" clearable placeholder="学院内部作者" />
              </el-form-item>
              <el-form-item label="数据批次">
                <el-input v-model="paperForm.batch" clearable placeholder="例如 2026/01-2026/03" />
              </el-form-item>
              <el-form-item label="核验状态">
                <el-select v-model="paperForm.verificationStatus" placeholder="请选择核验状态">
                  <el-option v-for="item in verificationStatusOptions" :key="item" :label="item" :value="item" />
                </el-select>
              </el-form-item>
              <el-form-item label="项目ID">
                <el-input v-model="paperForm.projectId" clearable />
              </el-form-item>
              <el-form-item class="field-wide" label="项目名称">
                <el-input v-model="paperForm.projectName" clearable />
              </el-form-item>
              <el-form-item label="负责人">
                <el-input v-model="paperForm.projectOwner" clearable />
              </el-form-item>
              <el-form-item class="field-wide" label="备注">
                <el-input v-model="paperForm.remark" type="textarea" :rows="3" resize="vertical" placeholder="补充说明、核验备注或数据来源说明" />
              </el-form-item>
            </div>

            <div class="paper-editor-actions">
              <el-button round @click="closeEditor">取消</el-button>
              <el-button type="primary" round @click="savePaper">保存记录</el-button>
            </div>
          </el-form>
        </section>
      </section>

      <template v-else>
        <section class="outcomes-panel filter-panel" aria-label="论文筛选条件">
          <div class="paper-filter-actions">
            <div class="toolbar-actions">
              <el-button :icon="Refresh" :loading="loading" round @click="reloadFromSource">重读源表</el-button>
              <el-button :icon="RefreshLeft" round @click="resetPaperFilters">重置筛选</el-button>
              <el-button type="primary" :icon="Download" :disabled="loading || filteredPapers.length === 0" round @click="exportFilteredPapers">
                导出筛选结果
              </el-button>
              <el-button type="success" :icon="Plus" round @click="openCreate">新增论文</el-button>
            </div>
          </div>

          <div class="paper-filter-grid">
            <label class="filter-field field-wide">
              <span>关键词</span>
              <el-input
                :model-value="paperFilters.keyword"
                clearable
                :prefix-icon="Search"
                placeholder="搜索题名、期刊/会议、作者、项目、DOI"
                @update:model-value="updatePaperFilter('keyword', $event)"
              />
            </label>
            <label class="filter-field">
              <span>成果类型</span>
              <el-select
                :model-value="paperFilters.resultType"
                clearable
                filterable
                placeholder="全部类型"
                @update:model-value="updatePaperFilter('resultType', $event)"
              >
                <el-option v-for="item in paperOptions.resultTypes" :key="item" :label="item" :value="item" />
              </el-select>
            </label>
            <label class="filter-field">
              <span>论文状态</span>
              <el-select
                :model-value="paperFilters.paperStatus"
                clearable
                filterable
                placeholder="全部状态"
                @update:model-value="updatePaperFilter('paperStatus', $event)"
              >
                <el-option v-for="item in paperOptions.paperStatuses" :key="item" :label="item" :value="item" />
              </el-select>
            </label>
            <label class="filter-field">
              <span>项目</span>
              <el-select
                :model-value="paperFilters.projectName"
                clearable
                filterable
                placeholder="全部项目"
                @update:model-value="updatePaperFilter('projectName', $event)"
              >
                <el-option v-for="item in paperOptions.projects" :key="item" :label="item" :value="item" />
              </el-select>
            </label>
            <label class="filter-field">
              <span>负责人</span>
              <el-select
                :model-value="paperFilters.projectOwner"
                clearable
                filterable
                placeholder="全部负责人"
                @update:model-value="updatePaperFilter('projectOwner', $event)"
              >
                <el-option v-for="item in paperOptions.people" :key="item" :label="item" :value="item" />
              </el-select>
            </label>
            <label class="filter-field">
              <span>数据批次</span>
              <el-select
                :model-value="paperFilters.batch"
                clearable
                filterable
                placeholder="全部批次"
                @update:model-value="updatePaperFilter('batch', $event)"
              >
                <el-option v-for="item in paperOptions.batches" :key="item" :label="item" :value="item" />
              </el-select>
            </label>
            <label class="filter-field">
              <span>匹配状态</span>
              <el-select
                :model-value="paperFilters.matchStatus"
                clearable
                filterable
                placeholder="全部匹配状态"
                @update:model-value="updatePaperFilter('matchStatus', $event)"
              >
                <el-option v-for="item in paperOptions.matchStatuses" :key="item" :label="item" :value="item" />
              </el-select>
            </label>
            <label class="filter-field">
              <span>核验状态</span>
              <el-select
                :model-value="paperFilters.verificationStatus"
                clearable
                filterable
                placeholder="全部核验状态"
                @update:model-value="updatePaperFilter('verificationStatus', $event)"
              >
                <el-option v-for="item in paperOptions.verificationStatuses" :key="item" :label="item" :value="item" />
              </el-select>
            </label>
          </div>
        </section>

        <section class="paper-list-only-layout" aria-label="论文成果列表">
          <div class="paper-table-region">
            <section class="outcomes-panel table-panel" aria-label="论文成果列表">
              <div v-if="error" class="state-box error-text">{{ error }}</div>
              <el-table
                v-else
                v-loading="loading"
                class="outcomes-table"
                :data="paginatedPapers"
                :row-key="getPaperKey"
                empty-text="没有符合当前条件的记录。"
              >
                <el-table-column prop="id" label="论文ID" width="112" fixed="left">
                  <template #default="{ row }">
                    <span class="strong-cell">{{ row.id || '未生成' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="论文题目" min-width="300" fixed="left">
                  <template #default="{ row }">
                    <div class="title-cell">
                      <strong>{{ row.title || '未填写题名' }}</strong>
                      <span v-if="row.doi">DOI: {{ row.doi }}</span>
                      <span v-else-if="row.preprintUrl">预印本: {{ row.preprintUrl }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="resultType" label="类型" width="100" />
                <el-table-column label="期刊/会议" min-width="220">
                  <template #default="{ row }">
                    <div class="venue-cell">
                      <strong>{{ row.venueName || '未填写' }}</strong>
                      <span>{{ row.venueShortName || '无简称' }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="year" label="年份" width="82">
                  <template #default="{ row }">{{ row.year || '未填' }}</template>
                </el-table-column>
                <el-table-column prop="paperStatus" label="状态" width="96" />
                <el-table-column prop="projectOwner" label="负责人" width="96">
                  <template #default="{ row }">{{ row.projectOwner || '未填写' }}</template>
                </el-table-column>
                <el-table-column label="匹配" width="104">
                  <template #default="{ row }">
                    <el-tag :type="matchTagType(row.matchStatus)" effect="light" round>{{ row.matchStatus || '未匹配' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="核验" width="104">
                  <template #default="{ row }">
                    <el-tag :type="verifyTagType(row.verificationStatus)" effect="light" round>{{ row.verificationStatus || '未填写' }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="286" fixed="right" align="center">
                  <template #default="{ row }">
                    <div class="paper-action-bar">
                      <el-button size="small" type="primary" plain :icon="View" @click.stop="openPaperDetail(row)">详情</el-button>
                      <el-button size="small" plain :icon="Edit" @click.stop="openEdit(row)">编辑</el-button>
                      <el-button size="small" type="danger" plain :icon="Delete" @click.stop="removePaper(row)">删除</el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </section>

            <section class="outcomes-panel pagination-panel" aria-label="论文成果分页">
              <div class="pagination-summary">
                <strong>成果列表分页</strong>
                <span>第 {{ paperPage }} 页，每页 {{ paperPageSize }} 条，共 {{ filteredPapers.length }} 条</span>
              </div>
              <el-pagination
                v-model:current-page="paperPage"
                v-model:page-size="paperPageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="filteredPapers.length"
                background
                layout="total, sizes, prev, pager, next, jumper"
              />
            </section>
          </div>
        </section>

        <el-dialog v-model="paperDetailOpen" class="paper-detail-dialog" title="论文详情" width="860px" destroy-on-close>
          <template v-if="detailPaper">
            <div class="dialog-paper-heading">
              <span class="preview-summary-icon"><el-icon><Document /></el-icon></span>
              <div>
                <h3>{{ detailPaper.title || '未填写题名' }}</h3>
                <div class="preview-tags">
                  <el-tag type="primary" effect="light" round>{{ detailPaper.resultType || '未分类' }}</el-tag>
                  <el-tag :type="matchTagType(detailPaper.matchStatus)" effect="light" round>{{ detailPaper.matchStatus || '未匹配' }}</el-tag>
                  <el-tag :type="verifyTagType(detailPaper.verificationStatus)" effect="light" round>
                    {{ detailPaper.verificationStatus || '未核验' }}
                  </el-tag>
                </div>
              </div>
            </div>
            <el-descriptions class="preview-descriptions paper-detail-descriptions" :column="2" border size="small">
              <el-descriptions-item label="论文ID">{{ displayValue(detailPaper.id) }}</el-descriptions-item>
              <el-descriptions-item label="成果类型">{{ displayValue(detailPaper.resultType) }}</el-descriptions-item>
              <el-descriptions-item label="发表载体" :span="2">{{ displayValue(detailPaper.venueName) }}</el-descriptions-item>
              <el-descriptions-item label="简称">{{ displayValue(detailPaper.venueShortName) }}</el-descriptions-item>
              <el-descriptions-item label="发表年份">{{ displayValue(detailPaper.year) }}</el-descriptions-item>
              <el-descriptions-item label="发表日期">{{ displayValue(detailPaper.publishDate) }}</el-descriptions-item>
              <el-descriptions-item label="论文状态">{{ displayValue(detailPaper.paperStatus) }}</el-descriptions-item>
              <el-descriptions-item label="DOI" :span="2">{{ displayValue(detailPaper.doi) }}</el-descriptions-item>
              <el-descriptions-item label="论文链接" :span="2">{{ displayValue(detailPaper.paperUrl) }}</el-descriptions-item>
              <el-descriptions-item label="预印本链接" :span="2">{{ displayValue(detailPaper.preprintUrl) }}</el-descriptions-item>
              <el-descriptions-item label="全部作者" :span="2">{{ displayValue(detailPaper.authors) }}</el-descriptions-item>
              <el-descriptions-item label="学院作者" :span="2">{{ displayValue(detailPaper.collegeAuthors) }}</el-descriptions-item>
              <el-descriptions-item label="数据来源">{{ displayValue(detailPaper.source) }}</el-descriptions-item>
              <el-descriptions-item label="数据批次">{{ displayValue(detailPaper.batch) }}</el-descriptions-item>
              <el-descriptions-item label="匹配名称" :span="2">{{ displayValue(detailPaper.matchedName, '暂无匹配') }}</el-descriptions-item>
              <el-descriptions-item label="匹配依据">{{ displayValue(detailPaper.matchedBy, '暂无匹配') }}</el-descriptions-item>
              <el-descriptions-item label="匹配置信度">{{ detailPaper.matchConfidence ? `${detailPaper.matchConfidence}%` : '暂无匹配' }}</el-descriptions-item>
              <el-descriptions-item label="项目关联ID">{{ displayValue(detailPaper.projectId) }}</el-descriptions-item>
              <el-descriptions-item label="项目负责人">{{ displayValue(detailPaper.projectOwner) }}</el-descriptions-item>
              <el-descriptions-item label="项目名称" :span="2">{{ displayValue(detailPaper.projectName) }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ displayValue(detailPaper.remark) }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <template #footer>
            <el-button round @click="paperDetailOpen = false">关闭</el-button>
            <el-button v-if="detailPaper" round type="primary" @click="editPaperFromDetail">编辑记录</el-button>
          </template>
        </el-dialog>
      </template>
    </template>

    <template v-else-if="activeModuleKey === 'knowledge'">
      <section class="outcomes-panel filter-panel">
        <div class="outcomes-panel-toolbar">
          <div class="knowledge-count-card" aria-label="知识库显示数量">
            <strong>{{ filteredKnowledge.length }}</strong>
            <span>/ {{ knowledge.length }} 条</span>
          </div>
          <el-button :icon="RefreshLeft" round @click="resetKnowledgeFilters">重置筛选</el-button>
        </div>
        <div class="paper-filter-grid knowledge-filter-grid">
          <label class="filter-field field-wide">
            <span>关键词</span>
            <el-input
              :model-value="knowledgeFilters.keyword"
              clearable
              :prefix-icon="Search"
              placeholder="搜索名称、简称、ISSN、出版商、分区或指标"
              @update:model-value="updateKnowledgeFilter('keyword', $event)"
            />
          </label>
          <label class="filter-field">
            <span>出版商</span>
            <el-select
              :model-value="knowledgeFilters.publisher"
              clearable
              filterable
              placeholder="全部出版商"
              @update:model-value="updateKnowledgeFilter('publisher', $event)"
            >
              <el-option v-for="item in knowledgeOptions.publishers" :key="item" :label="item" :value="item" />
            </el-select>
          </label>
          <label class="filter-field">
            <span>分类</span>
            <el-select
              :model-value="knowledgeFilters.categoryCn"
              clearable
              filterable
              placeholder="全部分类"
              @update:model-value="updateKnowledgeFilter('categoryCn', $event)"
            >
              <el-option v-for="item in knowledgeOptions.categories" :key="item" :label="item" :value="item" />
            </el-select>
          </label>
          <label class="filter-field">
            <span>JCR 分区</span>
            <el-select
              :model-value="knowledgeFilters.jcrPartition"
              clearable
              filterable
              placeholder="全部 JCR 分区"
              @update:model-value="updateKnowledgeFilter('jcrPartition', $event)"
            >
              <el-option v-for="item in knowledgeOptions.jcrPartitions" :key="item" :label="item" :value="item" />
            </el-select>
          </label>
          <label class="filter-field">
            <span>中科院分区</span>
            <el-select
              :model-value="knowledgeFilters.casPartition"
              clearable
              filterable
              placeholder="全部中科院分区"
              @update:model-value="updateKnowledgeFilter('casPartition', $event)"
            >
              <el-option v-for="item in knowledgeOptions.casPartitions" :key="item" :label="item" :value="item" />
            </el-select>
          </label>
        </div>
      </section>

      <section class="paper-list-preview-layout" aria-label="期刊会议知识库列表与详情预览">
        <div class="paper-table-region">
          <section class="outcomes-panel table-panel">
            <el-table
              v-loading="loading"
              class="outcomes-table"
              :data="paginatedKnowledge"
              row-key="id"
              empty-text="没有符合当前条件的知识库记录。"
              @row-click="selectKnowledge"
            >
              <el-table-column prop="publisher" label="出版商" width="170" fixed="left" />
              <el-table-column label="期刊/会议名称" min-width="360" fixed="left">
                <template #default="{ row }">
                  <div class="venue-cell">
                    <strong>{{ row.name || '未填写名称' }}</strong>
                    <span>{{ row.shortName || '无简称' }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="JCR 分区" width="110" align="center">
                <template #default="{ row }"><span class="metric-pill blue">{{ row.jcrPartition || '待补全' }}</span></template>
              </el-table-column>
              <el-table-column label="中科院分区" width="116" align="center">
                <template #default="{ row }"><span class="metric-pill green">{{ row.casPartition || '待补全' }}</span></template>
              </el-table-column>
              <el-table-column label="CiteScore" width="128" align="center">
                <template #default="{ row }"><span class="metric-pill purple">{{ row.citeScore || '待补全' }}</span></template>
              </el-table-column>
              <el-table-column label="Impact Factor" width="128" align="center">
                <template #default="{ row }"><span class="metric-pill amber">{{ row.impactFactor || '待补全' }}</span></template>
              </el-table-column>
            </el-table>
          </section>

          <section class="outcomes-panel pagination-panel">
            <div class="pagination-summary">
              <strong>知识库列表分页</strong>
              <span>第 {{ knowledgePage }} 页，每页 {{ knowledgePageSize }} 条，共 {{ filteredKnowledge.length }} 条</span>
            </div>
            <el-pagination
              v-model:current-page="knowledgePage"
              v-model:page-size="knowledgePageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="filteredKnowledge.length"
              background
              layout="total, sizes, prev, pager, next, jumper"
            />
          </section>
        </div>

        <aside class="outcomes-panel preview-card" aria-label="知识库详情预览">
          <template v-if="selectedKnowledge">
            <div class="preview-header">
              <div>
                <h2>知识库详情</h2>
                <p>期刊/会议分区、指标与来源信息</p>
              </div>
              <el-tag type="info" effect="plain" round>{{ selectedKnowledge.id }}</el-tag>
            </div>
            <div class="preview-main">
              <span class="preview-summary-icon"><el-icon><Notebook /></el-icon></span>
              <div>
                <h3>{{ selectedKnowledge.name }}</h3>
                <div class="preview-tags">
                  <el-tag type="primary" effect="light" round>{{ selectedKnowledge.publisher }}</el-tag>
                  <el-tag v-if="selectedKnowledge.shortName" type="success" effect="light" round>{{ selectedKnowledge.shortName }}</el-tag>
                </div>
              </div>
            </div>
            <el-descriptions class="preview-descriptions" :column="1" border size="small">
              <el-descriptions-item label="简称">{{ displayValue(selectedKnowledge.shortName) }}</el-descriptions-item>
              <el-descriptions-item label="分类">{{ displayValue(selectedKnowledge.categoryCn, '未分类') }}</el-descriptions-item>
              <el-descriptions-item label="JCR 分区">
                <span class="preview-inline-value"><el-icon><PriceTag /></el-icon>{{ displayValue(selectedKnowledge.jcrPartition, '待补全') }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="中科院分区">{{ displayValue(selectedKnowledge.casPartition, '待补全') }}</el-descriptions-item>
              <el-descriptions-item label="CiteScore">{{ displayValue(selectedKnowledge.citeScore, '待补全') }}</el-descriptions-item>
              <el-descriptions-item label="Impact Factor">{{ displayValue(selectedKnowledge.impactFactor, '待补全') }}</el-descriptions-item>
              <el-descriptions-item label="ISSN">{{ displayValue(selectedKnowledge.issn) }}</el-descriptions-item>
              <el-descriptions-item label="eISSN">{{ displayValue(selectedKnowledge.eissn) }}</el-descriptions-item>
              <el-descriptions-item label="覆盖范围">{{ displayValue(selectedKnowledge.coverage) }}</el-descriptions-item>
            </el-descriptions>
          </template>
          <el-empty v-else description="暂无可预览记录" />
        </aside>
      </section>
    </template>

    <template v-else-if="activeModuleKey === 'match'">
      <section class="outcomes-panel match-tabs-panel">
        <div class="match-workbench-header">
          <div>
            <h2>匹配核验工作台</h2>
          </div>
          <el-button type="primary" :icon="DataAnalysis" round @click="runAiBatchCheck">批量检验</el-button>
        </div>
        <el-tabs v-model="activeMatchTab" class="match-workbench-tabs">
          <el-tab-pane name="unmatched" label="待匹配">
            <section class="match-list-preview-layout">
              <section class="match-unmatched-panel">
                <el-empty v-if="unmatchedPapers.length === 0" description="当前没有待匹配记录" />
                <div v-else class="match-list">
                  <article
                    v-for="paper in paginatedUnmatchedPapers"
                    :key="getPaperKey(paper)"
                    class="match-item"
                    :class="{ active: getPaperKey(paper) === getPaperKey(selectedUnmatchedPaper) }"
                    @click="selectUnmatchedPaper(paper)"
                  >
                    <div>
                      <strong>{{ paper.title || '未填写题名' }}</strong>
                      <span>{{ paper.venueName || '未填写期刊/会议' }} / {{ paper.venueShortName || '无简称' }}</span>
                    </div>
                    <el-tag :type="verifyTagType(paper.verificationStatus)" effect="light" round>{{ paper.verificationStatus }}</el-tag>
                  </article>
                </div>

                <section class="outcomes-panel pagination-panel match-pagination-panel">
                  <div class="pagination-summary">
                    <strong>分页</strong>
                    <span>第 {{ unmatchedPage }} 页，每页 {{ matchPageSize }} 条，共 {{ unmatchedPapers.length }} 条</span>
                  </div>
                  <el-pagination
                    v-model:current-page="unmatchedPage"
                    :page-size="matchPageSize"
                    :total="unmatchedPapers.length"
                    background
                    layout="total, prev, pager, next, jumper"
                  />
                </section>
              </section>

              <aside class="outcomes-panel preview-card match-preview-card">
                <template v-if="selectedUnmatchedPaper">
                  <section v-if="aiMatchAnalysis" class="ai-analysis-card">
                    <div class="ai-analysis-heading">
                      <div>
                        <span>AI 原型分析</span>
                        <strong>{{ aiMatchAnalysis.confidence }}%</strong>
                      </div>
                      <el-tag type="primary" effect="light" round>匹配程度：{{ aiMatchAnalysis.matchDegree }}</el-tag>
                    </div>
                    <p>{{ aiMatchAnalysis.summary }}</p>
                    <div class="ai-rule-list">
                      <article v-for="rule in aiMatchAnalysis.rules" :key="rule.label">
                        <el-tag :type="rule.matched ? 'success' : 'info'" effect="light" round>
                          {{ rule.matched ? '通过' : '待确认' }}
                        </el-tag>
                        <div>
                          <strong>{{ rule.label }}</strong>
                          <span>{{ rule.evidence }}</span>
                        </div>
                      </article>
                    </div>
                  </section>
                  <section v-else class="ai-analysis-placeholder">
                    点击“批量检验”后，在这里展示两院署名、本人署名和致谢署名的 AI 原型分析结果。
                  </section>
                  <div class="preview-actions">
                    <el-button round type="primary" @click="confirmPaperMatched(selectedUnmatchedPaper)">确认匹配</el-button>
                    <el-button round plain @click="markPaperNeedsReview(selectedUnmatchedPaper)">标记需复核</el-button>
                  </div>
                </template>
                <el-empty v-else description="暂无待匹配记录" />
              </aside>
            </section>
          </el-tab-pane>

          <el-tab-pane name="matched" label="已匹配">
            <section class="outcomes-panel table-panel match-table-panel">
              <el-table class="outcomes-table" :data="paginatedMatchedPapers" :row-key="getPaperKey" empty-text="暂无已匹配记录">
                <el-table-column prop="id" label="论文ID" width="112" />
                <el-table-column label="论文题目" min-width="320">
                  <template #default="{ row }">
                    <div class="title-cell">
                      <strong>{{ row.title }}</strong>
                      <span>匹配：{{ row.matchedName }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="venueShortName" label="简称" width="120" />
                <el-table-column prop="matchedBy" label="匹配依据" width="132" />
                <el-table-column label="核验" width="104">
                  <template #default="{ row }">
                    <el-tag :type="verifyTagType(row.verificationStatus)" effect="light" round>{{ row.verificationStatus || '未填写' }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </section>
          </el-tab-pane>
        </el-tabs>
      </section>
    </template>

    <template v-else-if="activeModuleKey === 'excel'">
      <section class="excel-layout">
        <section class="outcomes-panel upload-panel">
          <div>
            <h2>Excel 导入</h2>
          </div>
          <div class="upload-grid">
            <el-upload action="#" drag :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" @change="handlePaperImportFile">
              <el-icon class="upload-icon"><Upload /></el-icon>
              <strong>导入论文成果总表</strong>
              <span>支持 .xlsx / .xls</span>
            </el-upload>
            <el-upload action="#" drag :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls" @change="handleKnowledgeImportFile">
              <el-icon class="upload-icon"><Upload /></el-icon>
              <strong>导入期刊/会议知识库</strong>
              <span>支持 .xlsx / .xls</span>
            </el-upload>
          </div>
          <div class="excel-actions">
            <el-button type="primary" :icon="Download" round @click="exportFilteredPapers">导出当前筛选结果</el-button>
          </div>
        </section>
      </section>
    </template>

    <template v-else-if="activeModuleKey === 'quality'">
      <section class="outcomes-panel quality-panel">
        <div class="outcomes-panel-toolbar">
          <div>
            <h2>数据质量检查</h2>
          </div>
          <el-button type="primary" plain round @click="selectModule('list')">返回成果列表</el-button>
        </div>
        <el-table class="outcomes-table" :data="paginatedQualityIssues" row-key="id" empty-text="当前没有质量问题">
          <el-table-column prop="paperId" label="论文ID" width="116" />
          <el-table-column label="论文题目" min-width="300">
            <template #default="{ row }">
              <span class="quality-title">{{ row.title || '未填写题名' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="问题类型" width="126" />
          <el-table-column prop="message" label="问题说明" min-width="220" />
          <el-table-column label="优先级" width="96">
            <template #default="{ row }">
              <el-tag :type="row.severity === '高' ? 'danger' : row.severity === '中' ? 'warning' : 'info'" effect="light" round>
                {{ row.severity }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <section class="quality-pagination-panel">
          <el-pagination
            v-model:current-page="qualityPage"
            v-model:page-size="qualityPageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="qualityReport.issues.length"
            background
            layout="total, sizes, prev, pager, next, jumper"
          />
        </section>
      </section>
    </template>
  </section>
</template>

<style scoped>
.paper-outcomes-page {
  --outcomes-blue: #3478e5;
  --outcomes-green: #23a574;
  --outcomes-purple: #806fe8;
  --outcomes-amber: #d88b23;
  --outcomes-red: #e15241;
  display: grid;
  gap: 16px;
  min-width: 0;
}

.outcomes-panel {
  min-width: 0;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 28px rgba(39, 64, 108, 0.055);
}

.outcomes-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 22px 26px;
}

.outcomes-kicker {
  display: inline-flex;
  align-items: center;
  color: #245dc9;
  font-size: 12px;
  font-weight: 720;
}

.outcomes-hero h1 {
  margin: 8px 0 0;
  color: #172033;
  font-size: 25px;
  line-height: 1.25;
  font-weight: 760;
}

.outcomes-hero p,
.outcomes-panel-toolbar p,
.preview-header p,
.upload-panel p {
  margin: 6px 0 0;
  color: #76859a;
  font-size: 12px;
  line-height: 1.6;
}

.module-switcher {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.module-button-card {
  position: relative;
  min-width: 0;
  min-height: 84px;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 15px;
  border: 1px solid #e4ebf6;
  border-radius: 13px;
  color: #223452;
  background: #fbfdff;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.module-button-card:hover {
  border-color: #bdd2f5;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(35, 83, 158, 0.08);
  transform: translateY(-1px);
}

.module-button-card:active {
  transform: translateY(0);
}

.module-button-card.active {
  border-color: #a7c5fb;
  background: #f2f7ff;
  box-shadow: inset 0 0 0 1px rgba(52, 120, 229, 0.12);
}

.module-button-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: var(--outcomes-blue);
  background: #eef5ff;
  font-size: 19px;
}

.module-button-green .module-button-icon {
  color: var(--outcomes-green);
  background: #edf9f4;
}

.module-button-purple .module-button-icon {
  color: var(--outcomes-purple);
  background: #f4f1ff;
}

.module-button-amber .module-button-icon {
  color: var(--outcomes-amber);
  background: #fff6e8;
}

.module-button-red .module-button-icon {
  color: var(--outcomes-red);
  background: #fff0ee;
}

.module-button-content {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 6px;
}

.module-button-content strong,
.outcomes-panel-toolbar h2,
.preview-header h2,
.upload-panel h2 {
  margin: 0;
  color: #223452;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 730;
}

.module-button-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  min-width: 24px;
  padding: 3px 7px;
  border-radius: 999px;
  color: #245dc9;
  background: #eef5ff;
  font-size: 12px;
  font-weight: 740;
  text-align: center;
}

.page-stack {
  display: grid;
  gap: 14px;
}

.outcomes-panel-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.filter-panel,
.editor-panel,
.quality-panel,
.source-panel,
.upload-panel,
.match-tabs-panel {
  padding: 20px;
}

.toolbar-actions,
.paper-editor-actions,
.preview-actions,
.excel-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.paper-action-bar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 250px;
  white-space: nowrap;
}

.paper-action-bar :deep(.el-button + .el-button) {
  margin-left: 0;
}

.paper-filter-grid,
.paper-editor-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.paper-editor-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.knowledge-filter-grid {
  grid-template-columns: minmax(260px, 2fr) repeat(4, minmax(0, 1fr));
}

.field-wide {
  grid-column: span 2;
}

.filter-field {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.filter-field > span {
  color: #56647a;
  font-size: 12px;
  font-weight: 680;
}

.outcomes-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.outcomes-metrics-four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.outcomes-stat-card {
  min-width: 0;
  min-height: 104px;
  padding: 16px;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 28px rgba(39, 64, 108, 0.045);
}

.outcomes-stat-card::before {
  display: block;
  width: 34px;
  height: 3px;
  margin-bottom: 13px;
  border-radius: 999px;
  background: var(--outcomes-blue);
  content: "";
}

.outcomes-stat-card span,
.outcomes-stat-card small {
  display: block;
  overflow: hidden;
  color: #7b8799;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outcomes-stat-card strong {
  display: block;
  margin: 8px 0 6px;
  color: #172033;
  font-size: 28px;
  line-height: 1;
  font-weight: 780;
}

.outcomes-stat-green::before {
  background: var(--outcomes-green);
}

.outcomes-stat-purple::before {
  background: var(--outcomes-purple);
}

.outcomes-stat-amber::before {
  background: var(--outcomes-amber);
}

.outcomes-stat-red::before {
  background: var(--outcomes-red);
}

.paper-list-preview-layout,
.match-list-preview-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
  gap: 16px;
  min-width: 0;
  align-items: start;
}

.paper-list-only-layout {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.paper-table-region {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.table-panel {
  overflow: hidden;
}

.outcomes-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
  --el-table-row-hover-bg-color: #f5f8fd;
}

.outcomes-table :deep(.el-table__cell) {
  padding: 9px 0;
}

.outcomes-table :deep(.cell) {
  line-height: 1.36;
}

.strong-cell {
  color: #245dc9;
  font-weight: 720;
}

.title-cell,
.venue-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.title-cell strong,
.venue-cell strong,
.quality-title {
  overflow: hidden;
  color: #223452;
  font-size: 13px;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-cell span,
.venue-cell span {
  overflow: hidden;
  color: #8a95a7;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
}

.pagination-summary {
  display: grid;
  gap: 3px;
  color: #7b8799;
  font-size: 12px;
}

.pagination-summary strong {
  color: #223452;
  font-size: 13px;
}

.preview-card {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 156px);
  padding: 20px;
  overflow-y: auto;
}

.preview-header,
.preview-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-main {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  margin: 18px 0 16px;
  padding: 15px;
  border: 1px solid #e4ebf6;
  border-radius: 13px;
  background: #fbfdff;
}

.preview-summary-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #3478e5;
  background: #eef5ff;
  font-size: 20px;
}

.preview-summary-icon.warning {
  color: #d88b23;
  background: #fff6e8;
}

.preview-main h3 {
  margin: 0;
  color: #172033;
  font-size: 15px;
  font-weight: 740;
  line-height: 1.45;
}

.preview-main p {
  margin: 7px 0 0;
  color: #7b8799;
  font-size: 12px;
  line-height: 1.5;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.preview-descriptions {
  --el-descriptions-table-border: 1px solid #e7edf6;
  --el-fill-color-light: #f6f9fe;
}

.preview-descriptions :deep(.el-descriptions__label.el-descriptions__cell) {
  width: 108px;
  color: #6f7f96;
  background: #f6f9fe;
  font-weight: 700;
}

.preview-descriptions :deep(.el-descriptions__content.el-descriptions__cell) {
  color: #223452;
  background: #ffffff;
  font-size: 12px;
  line-height: 1.55;
  word-break: break-word;
}

.preview-inline-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.preview-actions {
  position: sticky;
  bottom: -20px;
  margin: 16px -20px -20px;
  padding: 14px 20px 16px;
  justify-content: flex-end;
  border-top: 1px solid #e7edf6;
  background: #ffffff;
}

:deep(.paper-detail-dialog) {
  border-radius: 16px;
  box-shadow: 0 18px 46px rgb(29 64 125 / 16%);
}

:deep(.paper-detail-dialog .el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #edf2f9;
}

:deep(.paper-detail-dialog .el-dialog__body) {
  padding: 20px 24px;
}

:deep(.paper-detail-dialog .el-dialog__footer) {
  padding: 14px 24px 20px;
  border-top: 1px solid #edf2f9;
}

.dialog-paper-heading {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid #e4ebf6;
  border-radius: 13px;
  background: #fbfdff;
}

.dialog-paper-heading h3 {
  margin: 0;
  color: #172033;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 760;
}

.paper-detail-descriptions {
  margin-top: 12px;
}

.paper-editor-return-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.paper-editor-context {
  color: #7b8799;
  font-size: 12px;
}

.paper-editor-form h3 {
  margin: 18px 0 0;
  color: #223452;
  font-size: 14px;
  font-weight: 730;
}

.paper-editor-actions {
  margin-top: 16px;
}

.venue-option-row {
  display: grid;
  gap: 2px;
  line-height: 1.35;
}

.venue-option-row span {
  color: #8a95a7;
  font-size: 12px;
}

.knowledge-count-card {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  color: #7b8799;
  font-size: 13px;
}

.knowledge-count-card strong {
  color: #245dc9;
  font-size: 28px;
  line-height: 1;
}

.metric-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.metric-pill.blue {
  color: #245dc9;
  background: #eef5ff;
}

.metric-pill.green {
  color: #147a55;
  background: #edf9f4;
}

.metric-pill.purple {
  color: #6752cc;
  background: #f4f1ff;
}

.metric-pill.amber {
  color: #a46018;
  background: #fff6e8;
}

.match-list {
  display: grid;
  gap: 10px;
}

.match-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 15px;
  border: 1px solid #e4ebf6;
  border-radius: 13px;
  background: #fbfdff;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.match-item:hover,
.match-item.active {
  border-color: #a7c5fb;
  background: #f2f7ff;
}

.match-item:active {
  transform: translateY(1px);
}

.match-item div {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.match-item strong,
.match-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-item strong {
  color: #223452;
  font-size: 13px;
}

.match-item span {
  color: #7b8799;
  font-size: 12px;
}

.match-unmatched-panel {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.match-table-panel {
  margin-top: 8px;
}

.match-workbench-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.match-workbench-header h2 {
  margin: 0;
  color: #223452;
  font-size: 16px;
  font-weight: 730;
}

.match-workbench-header p {
  margin: 6px 0 0;
  color: #7b8799;
  font-size: 12px;
  line-height: 1.55;
}

.ai-analysis-card,
.ai-analysis-placeholder {
  margin-top: 14px;
  padding: 14px;
  border-radius: 13px;
}

.ai-analysis-card {
  border: 1px solid #d8e6ff;
  background: #f6f9ff;
}

.ai-analysis-placeholder {
  border: 1px dashed #d5e0f0;
  color: #7b8799;
  background: #fbfdff;
  font-size: 12px;
  line-height: 1.6;
}

.ai-analysis-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-analysis-heading div {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
}

.ai-analysis-heading span {
  color: #5f6f86;
  font-size: 12px;
  font-weight: 700;
}

.ai-analysis-heading strong {
  color: #245dc9;
  font-size: 24px;
  line-height: 1;
  font-weight: 780;
}

.ai-analysis-card > p {
  margin: 10px 0 12px;
  color: #40516b;
  font-size: 12px;
  line-height: 1.7;
}

.ai-rule-list {
  display: grid;
  gap: 8px;
}

.ai-rule-list article {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e5edf8;
  border-radius: 11px;
  background: #ffffff;
}

.ai-rule-list div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.ai-rule-list strong {
  color: #223452;
  font-size: 12px;
  font-weight: 730;
}

.ai-rule-list span,
.ai-analysis-card small {
  color: #7b8799;
  font-size: 12px;
  line-height: 1.55;
}

.ai-analysis-card small {
  display: block;
  margin-top: 10px;
}

.excel-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.source-list,
.upload-panel,
.upload-grid,
.quality-tags {
  display: grid;
  gap: 12px;
}

.source-list {
  margin-top: 16px;
}

.source-list article {
  display: grid;
  gap: 5px;
  padding: 14px;
  border: 1px solid #e4ebf6;
  border-radius: 12px;
  background: #fbfdff;
}

.source-list span {
  color: #7b8799;
  font-size: 12px;
}

.source-list strong {
  color: #223452;
  font-size: 13px;
}

.upload-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.upload-grid :deep(.el-upload),
.upload-grid :deep(.el-upload-dragger) {
  width: 100%;
}

.upload-grid :deep(.el-upload-dragger) {
  min-height: 180px;
  display: grid;
  align-content: center;
  gap: 8px;
  border-color: #d8e5f5;
  border-radius: 14px;
  background: #fbfdff;
}

.upload-icon {
  color: #3478e5;
  font-size: 28px;
}

.upload-grid strong {
  color: #223452;
  font-size: 14px;
}

.upload-grid span {
  color: #7b8799;
  font-size: 12px;
}

.excel-actions {
  justify-content: flex-start;
}

.quality-tags {
  grid-template-columns: repeat(6, max-content);
  margin: 14px 0;
}

.quality-pagination-panel {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #edf2f9;
}

@media (max-width: 1360px) {
  .module-switcher,
  .outcomes-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .paper-filter-grid,
  .knowledge-filter-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .paper-list-preview-layout,
  .match-list-preview-layout,
  .excel-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .preview-card {
    position: static;
    max-height: none;
  }
}

@media (max-width: 960px) {
  .module-switcher,
  .outcomes-metrics,
  .outcomes-metrics-four,
  .paper-filter-grid,
  .paper-editor-grid,
  .knowledge-filter-grid,
  .upload-grid {
    grid-template-columns: 1fr;
  }

  .field-wide {
    grid-column: span 1;
  }

  .outcomes-hero,
  .outcomes-panel-toolbar,
  .pagination-panel {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
