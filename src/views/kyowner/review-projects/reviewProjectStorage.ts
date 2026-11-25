import approvalDataset from '../../../dataset/review_approvals.json'
import type { ApprovalStatus, ReviewApproval } from './types'

const APPROVAL_STORAGE_KEY = 'zgca_ky_oa_kyowner_review_approvals'

export function loadReviewApprovals() {
  const stored = window.localStorage.getItem(APPROVAL_STORAGE_KEY)

  if (stored) {
    try {
      return JSON.parse(stored) as ReviewApproval[]
    } catch {
      window.localStorage.removeItem(APPROVAL_STORAGE_KEY)
    }
  }

  return cloneApprovals(approvalDataset as ReviewApproval[])
}

export function saveReviewApprovals(approvals: ReviewApproval[]) {
  window.localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(approvals))
}

export function updateApprovalStatus(
  approvals: ReviewApproval[],
  approvalId: string,
  status: ApprovalStatus,
  options: { reason?: string; operator?: string } = {},
) {
  const now = formatDateTime(new Date())

  return approvals.map((approval) =>
    approval.id === approvalId
      ? {
          ...approval,
          status,
          rejectReason: options.reason ?? approval.rejectReason,
          approver: options.operator ?? '管理办负责人',
          approvedAt: now,
        }
      : approval,
  )
}

export function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

function cloneApprovals(approvals: ReviewApproval[]) {
  return JSON.parse(JSON.stringify(approvals)) as ReviewApproval[]
}
