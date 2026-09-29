export type ReviewConfigTabName =
  | 'assessment-periods'
  | 'evaluation-rules'
  | 'project-levels'
  | 'reminder-settings'
  | 'material-deadline'

export type ReviewConfigStatus = 'draft' | 'launched'

export interface SelectedReviewProject {
  id: string
  projectCode: string
  projectName: string
  faculty: string
  subDirection: string
  principal: string
}

export interface ReviewBaseConfig {
  reviewId: string
  reviewName: string
  reviewPeriod: [string, string]
  performanceReviewPeriod: [string, string]
  reviewTemplateId: string
  noticeTemplateId: string
  selectedProjects: SelectedReviewProject[]
  createdAt: string
  updatedAt: string
}

export interface AssessmentPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
}

export interface EvaluationSubRule {
  id: string
  name: string
  percentage: number
  description: string
}

export interface EvaluationRule {
  id: string
  name: string
  percentage: number
  description: string
  expanded: boolean
  children: EvaluationSubRule[]
}

export type ProjectLevelLimit = '上限' | '下限' | '固定' | '不强制'

export interface ProjectLevel {
  id: string
  name: string
  percentage: number
  limit: ProjectLevelLimit
  description: string
}

export type ReminderConfigKey = 'materialSubmit' | 'reviewResult' | 'studentPerformance'

export interface ReminderConfig {
  enabled: boolean
  advanceDays: number
  frequencyDays: number
  receiverGroups: string[]
}

export interface ReminderSettings {
  materialSubmit: ReminderConfig
  reviewResult: ReminderConfig
  studentPerformance: ReminderConfig
}

export interface MaterialDeadlineSetting {
  daysBeforeMeeting: number
}

export interface ReviewConfigDraft {
  reviewId: string
  baseConfig: ReviewBaseConfig
  assessmentPeriods: AssessmentPeriod[]
  evaluationRules: EvaluationRule[]
  projectLevels: ProjectLevel[]
  reminderSettings: ReminderSettings
  materialDeadlineSetting: MaterialDeadlineSetting
  currentStep: ReviewConfigTabName
  status: ReviewConfigStatus
}

export interface ReviewConfigTabExpose {
  validateAndSave: (showMessage?: boolean) => Promise<boolean>
}
