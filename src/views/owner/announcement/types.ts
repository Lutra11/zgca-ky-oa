export type PublishMode = 'unified' | 'independent'

export type ScopeGroupMode = 'faculty' | 'projectType'

export type AnnouncementProjectType = '基础培育' | '自由探索'

export type ReceiverType =
  | 'facultyLeader'
  | 'subDirectionLeader'
  | 'projectLeader'
  | 'projectMember'

export interface AnnouncementPerson {
  id: string
  name: string
  role?: string
}

export interface AnnouncementProject {
  id: string
  projectCode: string
  projectName: string
  faculty: string
  subDirection: string
  projectType?: AnnouncementProjectType
  projectLeader: string
  reviewCompleted: boolean
  reviewResult: string
  reviewCompletedTime: string
  facultyLeader: AnnouncementPerson
  subDirectionLeader: AnnouncementPerson
  members: AnnouncementPerson[]
}

export interface AnnouncementDataset {
  publisherUnit: string
  projects: AnnouncementProject[]
}

export interface NoticeTemplate {
  id: string
  name: string
  templateNo: string
  category: string
  status: string
  description: string
  workflowNodes?: string[]
  fields?: string[]
}

export interface AnnouncementFormState {
  title: string
  type: string
  templateId: string
  receiverTypes: ReceiverType[]
  summary: string
  body: string
  pinned: boolean
  readRequired: boolean
}

export interface AnnouncementAttachment {
  id: string
  name: string
  size: string
  raw?: File
}

export interface FacultyProjectGroup {
  faculty: string
  projects: AnnouncementProject[]
}

export interface ProjectTypeProjectGroup {
  projectType: AnnouncementProjectType
  projects: AnnouncementProject[]
}

export interface ReceiverOption {
  label: string
  value: ReceiverType
}
