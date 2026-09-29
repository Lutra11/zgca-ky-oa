import type { LoggedInUser } from '../types/auth'
import { paperOutcomeRows, type PaperOutcome } from './paperOutcomesMock'
import { getProjectMemberProjects, type ProjectMemberProjectRow } from './projectMemberProjectsMock'

export interface ProjectMemberPaperGroup {
  projectId: string
  projectCode: string
  projectName: string
  departmentName: string
  projectStatus: string
  leaderName: string
  papers: PaperOutcome[]
  source: 'REAL' | 'MOCK'
}

export interface UserPaperProjectLink {
  projectId: string
  projectCode: string
  projectName: string
  departmentName: string
  leaderName: string
}

export interface UserPaperRecord {
  id: string
  userId: string
  title: string
  resultType: string
  venueName: string
  venueShortName: string
  year: string
  publishDate: string
  paperStatus: string
  doi: string
  paperUrl: string
  preprintUrl: string
  authors: string
  collegeAuthors: string
  remark: string
  pdfFileName: string
  projectLinks: UserPaperProjectLink[]
  verificationStatus: string
  createdAt: string
  updatedAt: string
}

const USER_PAPER_STORAGE_KEY = 'zgca_ky_oa_user_paper_records'

const mockPaperTemplates = [
  {
    resultType: '会议论文',
    venueName: 'AAAI Conference on Artificial Intelligence',
    venueShortName: 'AAAI',
    paperStatus: '投稿中',
    verificationStatus: '待核验',
  },
  {
    resultType: '期刊论文',
    venueName: 'IEEE Transactions on Artificial Intelligence',
    venueShortName: 'IEEE TAI',
    paperStatus: '已录用',
    verificationStatus: '已核验',
  },
]

const standalonePaperTemplates = [
  {
    title: '面向科研管理场景的智能知识抽取方法研究',
    resultType: '期刊论文',
    venueName: 'Journal of Artificial Intelligence Research',
    venueShortName: 'JAIR',
    paperStatus: '已录用',
    verificationStatus: '待核验',
    year: '2026',
  },
  {
    title: 'Research Workflow Intelligence with Human-in-the-loop Verification',
    resultType: '会议论文',
    venueName: 'International Joint Conference on Artificial Intelligence',
    venueShortName: 'IJCAI',
    paperStatus: '投稿中',
    verificationStatus: '未核验',
    year: '2026',
  },
]

function normalize(value?: string | number) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesProject(paper: PaperOutcome, project: ProjectMemberProjectRow) {
  const candidates = [
    project.id,
    project.projectId,
    project.projectCode,
    project.projectName,
  ].map(normalize)

  return [
    paper.projectId,
    paper.projectName,
  ].map(normalize).some((value) => value && candidates.some((candidate) => candidate && value.includes(candidate)))
}

function buildMockPaper(project: ProjectMemberProjectRow, index: number): PaperOutcome {
  const template = mockPaperTemplates[index % mockPaperTemplates.length]
  const sequence = `${index + 1}`.padStart(2, '0')

  return {
    recordKey: `OWNER-${project.projectCode}-PAPER-${sequence}`,
    id: `OWNER-PAPER-${project.projectCode}-${sequence}`,
    title:
      index === 0
        ? `${project.projectName}关键技术研究与原型验证`
        : `${project.projectName}阶段性成果与应用评估`,
    resultType: template.resultType,
    venueName: template.venueName,
    venueShortName: template.venueShortName,
    year: '2026',
    publishDate: index === 0 ? '' : '2026-08-20',
    paperStatus: template.paperStatus,
    doi: '',
    paperUrl: '',
    preprintUrl: '',
    authors: `${project.leaderName}, 李思远, 王欣然`,
    collegeAuthors: `${project.leaderName}（项目负责人）；李思远（项目成员）；王欣然（项目成员）`,
    source: '项目负责人端 Mock',
    batch: project.batchName,
    verificationStatus: template.verificationStatus,
    remark: '当前项目暂无正式论文数据，使用项目负责人端模拟数据展示。',
    projectId: project.projectCode,
    projectName: project.projectName,
    projectOwner: project.leaderName,
    createdAt: '2026-08-26 10:00',
    updatedAt: '2026-08-26 10:00',
    matchStatus: '项目内成果',
  }
}

function buildStandalonePaper(currentUser: LoggedInUser | null, index: number): PaperOutcome {
  const template = standalonePaperTemplates[index % standalonePaperTemplates.length]
  const userName = currentUser?.displayName || '当前用户'
  const userId = currentUser?.id || 'current-user'
  const sequence = `${index + 1}`.padStart(2, '0')

  return {
    recordKey: `PERSONAL-${userId}-PAPER-${sequence}`,
    id: `PERSONAL-PAPER-${userId}-${sequence}`,
    title: template.title,
    resultType: template.resultType,
    venueName: template.venueName,
    venueShortName: template.venueShortName,
    year: template.year,
    publishDate: index === 0 ? '2026-08-18' : '',
    paperStatus: template.paperStatus,
    doi: '',
    paperUrl: '',
    preprintUrl: '',
    authors: `${userName}, 刘思源, 陈嘉宁`,
    collegeAuthors: `${userName}（当前用户）；刘思源（合作作者）；陈嘉宁（合作作者）`,
    source: '个人成果 Mock',
    batch: '',
    verificationStatus: template.verificationStatus,
    remark: '该论文暂未关联科研项目，用于展示个人所有论文中的未关联项目成果。',
    projectId: '',
    projectName: '',
    projectOwner: userName,
    createdAt: '2026-08-28 10:00',
    updatedAt: '2026-08-28 10:00',
    matchStatus: '未关联项目',
  }
}

function getPaperKey(paper: PaperOutcome) {
  return paper.recordKey || `${paper.id}-${paper.projectId}`
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readAllUserPaperRecords(): UserPaperRecord[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(USER_PAPER_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as UserPaperRecord[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAllUserPaperRecords(records: UserPaperRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(USER_PAPER_STORAGE_KEY, JSON.stringify(records))
}

function getUserId(currentUser: LoggedInUser | null) {
  return currentUser?.id || 'anonymous'
}

function getUserPaperRecords(currentUser: LoggedInUser | null) {
  const userId = getUserId(currentUser)

  return readAllUserPaperRecords().filter((record) => record.userId === userId)
}

function matchesProjectLink(link: UserPaperProjectLink, project: ProjectMemberProjectRow) {
  const candidates = [project.id, project.projectId, project.projectCode].map(normalize)

  return [link.projectId, link.projectCode].map(normalize).some(
    (value) => value && candidates.some((candidate) => candidate && value === candidate),
  )
}

function toPaperOutcome(
  record: UserPaperRecord,
  currentUser: LoggedInUser | null,
  projectLink?: UserPaperProjectLink,
): PaperOutcome {
  const projectNames = projectLink
    ? projectLink.projectName
    : record.projectLinks.map((link) => link.projectName).filter(Boolean).join('、')
  const projectCodes = projectLink
    ? projectLink.projectCode
    : record.projectLinks.map((link) => link.projectCode).filter(Boolean).join('、')

  return {
    recordKey: record.id,
    id: record.id,
    title: record.title,
    resultType: record.resultType,
    venueName: record.venueName,
    venueShortName: record.venueShortName,
    year: record.year,
    publishDate: record.publishDate,
    paperStatus: record.paperStatus,
    doi: record.doi,
    paperUrl: record.paperUrl,
    preprintUrl: record.preprintUrl,
    authors: record.authors,
    collegeAuthors: record.collegeAuthors,
    source: '个人新增论文',
    batch: '',
    verificationStatus: record.verificationStatus,
    remark: record.remark || (record.pdfFileName ? `已上传论文 PDF：${record.pdfFileName}` : ''),
    projectId: projectCodes,
    projectName: projectNames,
    projectOwner: currentUser?.displayName || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    matchStatus: record.projectLinks.length ? '已关联项目' : '未关联项目',
  }
}

export function getProjectMemberPaperGroups(currentUser: LoggedInUser | null): ProjectMemberPaperGroup[] {
  const userPaperRecords = getUserPaperRecords(currentUser)

  return getProjectMemberProjects(currentUser).map((project) => {
    const matchedPapers = paperOutcomeRows.filter((paper) => matchesProject(paper, project))
    const userLinkedPapers = userPaperRecords.flatMap((record) =>
      record.projectLinks
        .filter((link) => matchesProjectLink(link, project))
        .map((link) => toPaperOutcome(record, currentUser, link)),
    )
    const papers = [
      ...(matchedPapers.length > 0 ? matchedPapers : [buildMockPaper(project, 0), buildMockPaper(project, 1)]),
      ...userLinkedPapers,
    ]

    return {
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectName: project.projectName,
      departmentName: project.departmentName,
      projectStatus: project.projectStatus,
      leaderName: project.leaderName,
      papers,
      source: matchedPapers.length > 0 ? 'REAL' : 'MOCK',
    }
  })
}

export function getProjectMemberAllPapers(currentUser: LoggedInUser | null): PaperOutcome[] {
  const paperMap = new Map<string, PaperOutcome>()

  getProjectMemberPaperGroups(currentUser).forEach((group) => {
    group.papers.forEach((paper) => {
      paperMap.set(getPaperKey(paper), {
        ...paper,
        projectId: paper.projectId || group.projectCode,
        projectName: paper.projectName || group.projectName,
        projectOwner: paper.projectOwner || group.leaderName,
      })
    })
  })

  standalonePaperTemplates.forEach((_, index) => {
    const paper = buildStandalonePaper(currentUser, index)
    paperMap.set(getPaperKey(paper), paper)
  })

  getUserPaperRecords(currentUser).forEach((record) => {
    const paper = toPaperOutcome(record, currentUser)
    paperMap.set(getPaperKey(paper), paper)
  })

  return Array.from(paperMap.values())
}

export function saveProjectMemberPaperRecord(
  currentUser: LoggedInUser | null,
  payload: Omit<UserPaperRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'verificationStatus'>,
) {
  const now = new Date().toISOString()
  const record: UserPaperRecord = {
    ...payload,
    id: `USER-PAPER-${Date.now()}`,
    userId: getUserId(currentUser),
    verificationStatus: '待核验',
    createdAt: now,
    updatedAt: now,
  }
  const records = readAllUserPaperRecords()

  writeAllUserPaperRecords([record, ...records])

  return record
}
