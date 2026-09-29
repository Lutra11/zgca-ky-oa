export type ReviewProjectTab = 'approval' | 'monitor' | 'result'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalProject {
  id: string
  projectCode: string
  projectType: string
  faculty: string
  subDirection: string
  subDirectionLeader: string
  batch: string
  projectName: string
  principal: string
}

export interface ReviewApproval {
  id: string
  reviewName: string
  initiator: string
  initiatedAt: string
  status: ApprovalStatus
  reviewPeriod: [string, string]
  performancePeriod: [string, string]
  reviewTemplateId: string
  noticeTemplateId: string
  rejectReason: string
  approver: string
  approvedAt: string
  projects: ApprovalProject[]
}

export interface ApprovalFilters {
  batch: string
  facultyDirection: string
  projectType: string
  keyword: string
}

export interface ReviewResultProject {
  id: string
  projectCode: string
  projectName: string
  principal: string
  subDirection: string
  score: number
  recommendedLevel: 'A' | 'B' | 'C' | 'D'
  finalLevel: 'A' | 'B' | 'C' | 'D'
  subDirectionComment: string
  facultyComment: string
  adjustReason: string
}

export interface FacultyReviewResult {
  faculty: string
  status: string
  submittedAt: string
  summary: string
  projects: ReviewResultProject[]
}
