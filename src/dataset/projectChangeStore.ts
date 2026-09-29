import {
  projectLedgerRows,
  type ProjectLedgerMember,
  type ProjectLedgerMentor,
  type ProjectLedgerProject,
} from './projectLedgerMock'

export const PROJECT_CHANGE_STORAGE_KEY = 'zgca_ky_oa_project_change_projects_v1'

export function cloneProjectLedgerProject(project: ProjectLedgerProject): ProjectLedgerProject {
  return {
    ...project,
    members: project.members.map((member: ProjectLedgerMember) => ({ ...member })),
    mentors: project.mentors.map((mentor: ProjectLedgerMentor) => ({ ...mentor })),
  }
}

export function cloneProjectLedgerRows(): ProjectLedgerProject[] {
  return projectLedgerRows.map(cloneProjectLedgerProject)
}

export function loadProjectChangeProjects(): ProjectLedgerProject[] {
  if (typeof window === 'undefined') {
    return cloneProjectLedgerRows()
  }

  const raw = window.localStorage.getItem(PROJECT_CHANGE_STORAGE_KEY)

  if (!raw) {
    return cloneProjectLedgerRows()
  }

  try {
    const parsed = JSON.parse(raw) as ProjectLedgerProject[]

    if (!Array.isArray(parsed)) {
      window.localStorage.removeItem(PROJECT_CHANGE_STORAGE_KEY)
      return cloneProjectLedgerRows()
    }

    return parsed.map((project) => ({
      ...project,
      members: Array.isArray(project.members) ? project.members.map((member) => ({ ...member })) : [],
      mentors: Array.isArray(project.mentors) ? project.mentors.map((mentor) => ({ ...mentor })) : [],
    }))
  } catch {
    window.localStorage.removeItem(PROJECT_CHANGE_STORAGE_KEY)
    return cloneProjectLedgerRows()
  }
}

export function saveProjectChangeProjects(projects: ProjectLedgerProject[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROJECT_CHANGE_STORAGE_KEY, JSON.stringify(projects))
}
