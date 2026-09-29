import dataset from '../../../dataset/subdirection_review_management.json'
import type { SubdirectionReviewDataset, SubdirectionReviewTask } from './types'

const STORAGE_KEY = 'zgca_ky_oa_subdirection_review_management'

export function loadSubdirectionReviewDataset() {
  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (stored) {
    try {
      return JSON.parse(stored) as SubdirectionReviewDataset
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return cloneDataset(dataset as SubdirectionReviewDataset)
}

export function saveSubdirectionReviewDataset(nextDataset: SubdirectionReviewDataset) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDataset))
}

export function replaceReviewTask(
  currentDataset: SubdirectionReviewDataset,
  nextTask: SubdirectionReviewTask,
) {
  return {
    ...currentDataset,
    tasks: currentDataset.tasks.map((task) => (task.id === nextTask.id ? nextTask : task)),
  }
}

export function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function cloneDataset(source: SubdirectionReviewDataset) {
  return JSON.parse(JSON.stringify(source)) as SubdirectionReviewDataset
}
