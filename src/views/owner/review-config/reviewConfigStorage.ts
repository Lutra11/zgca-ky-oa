import reviewConfigDataset from '../../../dataset/review_config_details.json'
import type {
  ReviewBaseConfig,
  ReviewConfigDraft,
  ReviewConfigTabName,
  SelectedReviewProject,
} from './types'

const STORAGE_PREFIX = 'zgca_ky_oa_review_config_detail_'
const REVIEW_SEQUENCE_KEY = 'zgca_ky_oa_review_sequence'

const tabOrder: ReviewConfigTabName[] = [
  'assessment-periods',
  'evaluation-rules',
  'project-levels',
  'reminder-settings',
  'material-deadline',
]

export const reviewConfigTabs: Array<{ name: ReviewConfigTabName; label: string }> = [
  { name: 'assessment-periods', label: '项目考核周期' },
  { name: 'evaluation-rules', label: '评审标准细则' },
  { name: 'project-levels', label: '项目等级设置' },
  { name: 'reminder-settings', label: '提醒频率设置' },
  { name: 'material-deadline', label: '材料提交截止时间' },
]

export function generateReviewId() {
  const year = new Date().getFullYear()
  const sequence = Number(window.localStorage.getItem(REVIEW_SEQUENCE_KEY) ?? '1')
  const reviewId = `RV${year}${String(sequence).padStart(3, '0')}`
  window.localStorage.setItem(REVIEW_SEQUENCE_KEY, String(sequence + 1))

  return reviewId
}

export function createReviewConfigDraftFromBase(
  baseConfig: Omit<ReviewBaseConfig, 'createdAt' | 'updatedAt'>,
) {
  const now = formatDateTime(new Date())
  const draft = createDefaultDraft(baseConfig.reviewId)

  draft.reviewId = baseConfig.reviewId
  draft.baseConfig = {
    ...baseConfig,
    createdAt: now,
    updatedAt: now,
  }
  draft.currentStep = 'assessment-periods'
  draft.status = 'draft'

  saveReviewConfigDraft(draft)
  return draft
}

export function loadReviewConfigDraft(reviewId: string): ReviewConfigDraft | null {
  const storedDraft = window.localStorage.getItem(getDraftStorageKey(reviewId))

  if (storedDraft) {
    try {
      return JSON.parse(storedDraft) as ReviewConfigDraft
    } catch {
      window.localStorage.removeItem(getDraftStorageKey(reviewId))
    }
  }

  const datasetDraft = (reviewConfigDataset as ReviewConfigDraft[]).find(
    (draft) => draft.reviewId === reviewId,
  )

  return datasetDraft ? cloneDraft(datasetDraft) : null
}

export function saveReviewConfigDraft(draft: ReviewConfigDraft) {
  draft.baseConfig.updatedAt = formatDateTime(new Date())
  window.localStorage.setItem(getDraftStorageKey(draft.reviewId), JSON.stringify(draft))
}

export function createDefaultDraft(reviewId: string): ReviewConfigDraft {
  const seed = (reviewConfigDataset as ReviewConfigDraft[])[0]
  const draft = cloneDraft(seed)

  draft.reviewId = reviewId
  draft.baseConfig.reviewId = reviewId
  draft.currentStep = 'assessment-periods'
  draft.status = 'draft'

  return draft
}

export function getNextTabName(current: ReviewConfigTabName) {
  const index = getTabIndex(current)
  return tabOrder[Math.min(index + 1, tabOrder.length - 1)]
}

export function getPreviousTabName(current: ReviewConfigTabName) {
  const index = getTabIndex(current)
  return tabOrder[Math.max(index - 1, 0)]
}

export function getTabIndex(tabName: ReviewConfigTabName) {
  return Math.max(tabOrder.indexOf(tabName), 0)
}

export function isLastReviewConfigTab(tabName: ReviewConfigTabName) {
  return getTabIndex(tabName) === tabOrder.length - 1
}

export function normalizeSelectedProject(project: {
  id: string
  projectCode: string
  projectName: string
  faculty: string
  subDirection: string
  principal: string
}): SelectedReviewProject {
  return {
    id: project.id,
    projectCode: project.projectCode,
    projectName: project.projectName,
    faculty: project.faculty,
    subDirection: project.subDirection,
    principal: project.principal,
  }
}

export function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function getDraftStorageKey(reviewId: string) {
  return `${STORAGE_PREFIX}${reviewId}`
}

function cloneDraft(draft: ReviewConfigDraft) {
  return JSON.parse(JSON.stringify(draft)) as ReviewConfigDraft
}
