export type ReviewTaskStatus = '待完善' | '进行中'

export interface ReviewerCandidate {
  id: string
  name: string
  faculty: string
  researchDirection: string
  title: string
  currentTaskCount: number
}

export interface SubdirectionReviewProject {
  id: string
  projectCode: string
  projectName: string
  projectType: string
  faculty: string
  subDirection: string
  principal: string
  batch: string
  assignedReviewerIds: string[]
  reviewStartAt: string
  reviewEndAt: string
  materialSubmitted: boolean
}

export interface OperationLog {
  operator: string
  content: string
  time: string
}

export interface SubdirectionReviewTask {
  id: string
  reviewName: string
  initiator: string
  initiatedAt: string
  approver: string
  approvedAt: string
  status: ReviewTaskStatus
  reviewPeriod: [string, string]
  performancePeriod: [string, string]
  reviewTemplateId: string
  noticeTemplateId: string
  subDirectionLeaderName: string
  ownerUsernames: string[]
  projects: SubdirectionReviewProject[]
  operationLogs: OperationLog[]
}

export interface SubdirectionReviewDataset {
  managedSubDirections: string[]
  tasks: SubdirectionReviewTask[]
  reviewerCandidates: ReviewerCandidate[]
}

export interface ReviewProjectFilters {
  batch: string
  faculty: string
  subDirection: string
  projectType: string
  keyword: string
}
