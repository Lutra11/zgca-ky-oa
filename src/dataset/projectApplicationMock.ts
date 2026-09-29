import type { LoggedInUser } from '../types/auth'

export type ProjectApplicationType = 'BASIC_CULTIVATION' | 'FREE_EXPLORATION'
export type ProjectApplicationStatus = 'DRAFT' | 'SUBMITTED'
export type ApplicationUploadStatus = 'WAITING' | 'UPLOADED' | 'ERROR'
export type ApplicationConvertStatus = 'WAITING' | 'CONVERTING' | 'CONVERTED' | 'ERROR'
export type ApplicationPreviewStatus = 'SYNCED' | 'STALE'

export interface ProjectApplicationMember {
  user_id: string
  name: string
  student_no: string
  school: string
  college: string
}

export interface ProjectApplicationMentor {
  mentor_id: string
  name: string
  mentor_no: string
  school: string
  college: string
}

export interface ProjectApplicationForm {
  batch_id: string
  project_type: ProjectApplicationType
  project_name: string
  project_description: string
  project_leader_id: string
  project_leader_name: string
  fill_date: string
  project_members: ProjectApplicationMember[]
  mentor_id: string
  mentor_name: string
  project_mentors: ProjectApplicationMentor[]
  source_docx_file_id: string
  generated_pdf_file_id?: string
  signature_file_id?: string
  status: ProjectApplicationStatus
}

export interface PersonOption {
  user_id: string
  name: string
  department: string
}

export interface ApplicationWordFileState {
  file_id: string
  name: string
  size: string
  upload_status: ApplicationUploadStatus
  convert_status: ApplicationConvertStatus
  preview_url?: string
  uploaded_at: string
}

export interface ApplicationSignatureState {
  file_id: string
  data_url: string
  uploaded_at: string
}

export interface ApplicationPreviewState {
  generated_pdf_file_id?: string
  preview_status: ApplicationPreviewStatus
  synced_at?: string
}

export interface ProjectApplicationDraftRecord {
  form: ProjectApplicationForm
  source_docx_file?: ApplicationWordFileState
  signature_file?: ApplicationSignatureState
  preview: ApplicationPreviewState
}

const APPLICATION_DRAFT_STORAGE_KEY = 'zgci_ky_oa_project_application_drafts'

export const applicationMemberOptions: PersonOption[] = [
  { user_id: 'u101', name: '李思远', department: '应用研究部' },
  { user_id: 'u102', name: '王欣然', department: '生命与医学学部' },
  { user_id: 'u103', name: '陈子安', department: '智能制造中心' },
  { user_id: 'u104', name: '何文清', department: 'AI 医疗研究部' },
  { user_id: 'u105', name: '唐若琳', department: 'AI 物理研究部' },
  { user_id: 'u106', name: '陆一鸣', department: '生命与医学学部' },
]

export const applicationMentorOptions: PersonOption[] = [
  { user_id: 'm201', name: '周明远', department: '人工智能研究院' },
  { user_id: 'm202', name: '林教授', department: 'AI x 科学技术中心' },
  { user_id: 'm203', name: '陈院士', department: '北京中关村学院' },
  { user_id: 'm204', name: '赵研究员', department: '智能医学工程团队' },
]

export const defaultProjectApplicationMembers: ProjectApplicationMember[] = [
  {
    user_id: 'student-2026-001',
    name: '李思远',
    student_no: 'S2026001',
    school: '北京中关村学院',
    college: '人工智能学院',
  },
  {
    user_id: 'student-2026-002',
    name: '王欣然',
    student_no: 'S2026002',
    school: '北京中关村学院',
    college: '智能制造学院',
  },
  {
    user_id: 'student-2026-003',
    name: '陈子安',
    student_no: 'S2026003',
    school: '北京中关村学院',
    college: '生命科学学院',
  },
]

export const defaultProjectApplicationMentors: ProjectApplicationMentor[] = [
  {
    mentor_id: 'mentor-2026-001',
    name: '周明远',
    mentor_no: 'T2026001',
    school: '北京中关村学院',
    college: '人工智能学院',
  },
]

export const applicationTemplatePlaceholders = [
  '{{project_name}}',
  '{{project_leader}}',
  '{{fill_date}}',
  '{{signature}}',
  '{{signature_date}}',
]

export function createDefaultProjectApplicationForm(
  batchId: string,
  currentUser: LoggedInUser | null,
): ProjectApplicationForm {
  const defaultMentor = defaultProjectApplicationMentors[0]

  return {
    batch_id: batchId,
    project_type: 'BASIC_CULTIVATION',
    project_name: '多模态具身智能关键技术研究',
    project_description: '围绕复杂环境下多模态感知、决策与执行协同问题，开展关键方法研究。',
    project_leader_id: currentUser?.id ?? '',
    project_leader_name: currentUser?.displayName ?? '',
    fill_date: formatDateInputValue(new Date()),
    project_members: defaultProjectApplicationMembers.map((member) => ({ ...member })),
    mentor_id: defaultMentor?.mentor_id ?? '',
    mentor_name: defaultMentor?.name ?? '',
    project_mentors: defaultProjectApplicationMentors.map((mentor) => ({ ...mentor })),
    source_docx_file_id: `source-docx-${batchId || 'new'}-${currentUser?.id ?? 'current'}`,
    generated_pdf_file_id: `generated-pdf-${batchId || 'new'}-${currentUser?.id ?? 'current'}`,
    signature_file_id: '',
    status: 'DRAFT',
  }
}

export function normalizeProjectApplicationForm(
  form: Partial<ProjectApplicationForm> | undefined,
  batchId: string,
  currentUser: LoggedInUser | null,
): ProjectApplicationForm {
  const defaultForm = createDefaultProjectApplicationForm(batchId, currentUser)
  const rawMembers = Array.isArray(form?.project_members) ? form.project_members : []
  const rawMentors = Array.isArray(form?.project_mentors) ? form.project_mentors : []
  const projectMembers =
    rawMembers.length > 0
      ? rawMembers.map((member, index) => ({
          user_id: member.user_id || `student-manual-${index + 1}`,
          name: member.name ?? '',
          student_no: member.student_no ?? '',
          school: member.school ?? '北京中关村学院',
          college: member.college ?? '',
        }))
      : defaultForm.project_members.map((member) => ({ ...member }))
  const projectMentors =
    rawMentors.length > 0
      ? rawMentors.map((mentor, index) => ({
          mentor_id: mentor.mentor_id || `mentor-manual-${index + 1}`,
          name: mentor.name ?? '',
          mentor_no: mentor.mentor_no ?? '',
          school: mentor.school ?? '北京中关村学院',
          college: mentor.college ?? '',
        }))
      : form?.mentor_id || form?.mentor_name
        ? [
            {
              mentor_id: form.mentor_id ?? 'mentor-manual-1',
              name: form.mentor_name ?? '',
              mentor_no: '',
              school: '北京中关村学院',
              college: '',
            },
          ]
        : defaultForm.project_mentors.map((mentor) => ({ ...mentor }))
  const firstMentor = projectMentors[0]

  return {
    ...defaultForm,
    ...form,
    batch_id: batchId,
    project_leader_id: currentUser?.id ?? form?.project_leader_id ?? defaultForm.project_leader_id,
    project_leader_name: currentUser?.displayName ?? form?.project_leader_name ?? defaultForm.project_leader_name,
    project_members: projectMembers,
    project_mentors: projectMentors,
    mentor_id: firstMentor?.mentor_id ?? '',
    mentor_name: firstMentor?.name ?? '',
  }
}

export function createDefaultApplicationDraft(
  batchId: string,
  currentUser: LoggedInUser | null,
): ProjectApplicationDraftRecord {
  return {
    form: createDefaultProjectApplicationForm(batchId, currentUser),
    source_docx_file: {
      file_id: `source-docx-${batchId || 'new'}-${currentUser?.id ?? 'current'}`,
      name: '附件1.2026年北京中关村学院科研项目申报书.docx',
      size: '40 KB',
      upload_status: 'UPLOADED',
      convert_status: 'CONVERTED',
      uploaded_at: formatDateTimeValue(new Date()),
    },
    preview: {
      generated_pdf_file_id: `generated-pdf-${batchId || 'new'}-${currentUser?.id ?? 'current'}`,
      preview_status: 'STALE',
    },
  }
}

export function loadProjectApplicationDraft(
  batchId: string,
  currentUser: LoggedInUser | null,
): ProjectApplicationDraftRecord {
  const draftKey = getDraftKey(batchId, currentUser)
  const storedDrafts = readStoredDrafts()
  const storedDraft = storedDrafts[draftKey]

  if (!storedDraft) {
    return createDefaultApplicationDraft(batchId, currentUser)
  }

  return {
    ...storedDraft,
    form: normalizeProjectApplicationForm(storedDraft.form, batchId, currentUser),
    preview: storedDraft.preview ?? {
      preview_status: 'STALE',
    },
  }
}

export function saveProjectApplicationDraft(
  batchId: string,
  currentUser: LoggedInUser | null,
  draft: ProjectApplicationDraftRecord,
) {
  const draftKey = getDraftKey(batchId, currentUser)
  const storedDrafts = readStoredDrafts()

  storedDrafts[draftKey] = draft
  window.localStorage.setItem(APPLICATION_DRAFT_STORAGE_KEY, JSON.stringify(storedDrafts))
}

export function createWordFileState(file: File): ApplicationWordFileState {
  return {
    file_id: `source-docx-${Date.now()}`,
    name: file.name,
    size: formatFileSize(file.size),
    upload_status: 'UPLOADED',
    convert_status: 'CONVERTED',
    uploaded_at: formatDateTimeValue(new Date()),
  }
}

export function createSignatureFileState(dataUrl: string): ApplicationSignatureState {
  return {
    file_id: `signature-png-${Date.now()}`,
    data_url: dataUrl,
    uploaded_at: formatDateTimeValue(new Date()),
  }
}

export function createGeneratedPdfId(batchId: string) {
  return `generated-pdf-${batchId}-${Date.now()}`
}

export function formatFillMonth(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')

  return `${date.getFullYear()}年${month}月`
}

export function formatDateInputValue(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

function getDraftKey(batchId: string, currentUser: LoggedInUser | null) {
  return `${currentUser?.id ?? 'anonymous'}::${batchId}`
}

function readStoredDrafts(): Record<string, ProjectApplicationDraftRecord> {
  const rawValue = window.localStorage.getItem(APPLICATION_DRAFT_STORAGE_KEY)

  if (!rawValue) {
    return {}
  }

  try {
    return JSON.parse(rawValue) as Record<string, ProjectApplicationDraftRecord>
  } catch {
    return {}
  }
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  const kb = size / 1024

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }

  return `${(kb / 1024).toFixed(1)} MB`
}

function formatDateTimeValue(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}`
}
