import accounts from '../dataset/roles.json'
import roleAuth from '../dataset/role_auth.json'
import type {
  LoggedInUser,
  RoleAuthConfig,
  RoleAuthButton,
  RoleFeatureConfig,
  RoleKey,
  RoleRouteConfig,
  RoleRouteName,
  UserAccount,
} from '../types/auth'

const STORAGE_KEY = 'zgca_ky_oa_current_user'

export const roleRouteConfigs: RoleRouteConfig[] = [
  {
    key: 'researchProjectAdmin',
    name: '科研项目管理员',
    englishName: 'Research Project Administrator',
    routeName: 'research-project-admin',
    basePath: '/research-project-admin',
    dashboardPath: '/research-project-admin/dashboard',
  },
  {
    key: 'researchDepartmentLeader',
    name: '科研部负责人',
    englishName: 'Research Department Leader',
    routeName: 'research-dept-leader',
    basePath: '/research-dept-leader',
    dashboardPath: '/research-dept-leader/dashboard',
  },
  {
    key: 'facultyLeader',
    name: '学部负责人',
    englishName: 'Faculty Leader',
    routeName: 'faculty-leader',
    basePath: '/faculty-leader',
    dashboardPath: '/faculty-leader/dashboard',
  },
  {
    key: 'projectLeader',
    name: '子方向负责人',
    englishName: 'Sub-direction Leader',
    routeName: 'sub-direction-leader',
    basePath: '/sub-direction-leader',
    dashboardPath: '/sub-direction-leader/dashboard',
  },
  {
    key: 'reviewer',
    name: '评委',
    englishName: 'Review Judge',
    routeName: 'review-judge',
    basePath: '/review-judge',
    dashboardPath: '/review-judge/dashboard',
  },
  {
    key: 'projectMember',
    name: '项目负责人',
    englishName: 'Project Member',
    routeName: 'project-member',
    basePath: '/project-member',
    dashboardPath: '/project-member/dashboard',
  },
  {
    key: 'projectStudent',
    name: '项目学生',
    englishName: 'Project Student',
    routeName: 'project-student',
    basePath: '/project-student',
    dashboardPath: '/project-student/dashboard',
  },
  {
    key: 'projectMentor',
    name: '项目导师',
    englishName: 'Project Mentor',
    routeName: 'project-mentor',
    basePath: '/project-mentor',
    dashboardPath: '/project-mentor/dashboard',
  },
]

export function loginByCredentials(username: string, password: string): LoggedInUser | null {
  const matchedAccount = (accounts as UserAccount[]).find(
    (account) => account.username === username.trim() && account.password === password,
  )

  return matchedAccount ? sanitizeAccount(matchedAccount) : null
}

export function setCurrentUser(user: LoggedInUser) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function getCurrentUser(): LoggedInUser | null {
  const storedUser = window.localStorage.getItem(STORAGE_KEY)

  if (!storedUser) {
    return null
  }

  try {
    const parsedUser = JSON.parse(storedUser) as LoggedInUser
    const latestAccount = (accounts as UserAccount[]).find(
      (account) => account.id === parsedUser.id || account.username === parsedUser.username,
    )

    return latestAccount ? sanitizeAccount(latestAccount) : parsedUser
  } catch {
    clearCurrentUser()
    return null
  }
}

export function clearCurrentUser() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function getRoleRouteConfig(roleKey: RoleKey): RoleRouteConfig | undefined {
  return roleRouteConfigs.find((item) => item.key === roleKey)
}

export function getRoleFeatureConfigs(roleKey: RoleKey): RoleFeatureConfig[] {
  return getRoleAuthConfig(roleKey)?.content.map(toRoleFeatureConfig) ?? []
}

export function getRoleFeaturePath(_role: RoleRouteConfig, feature: RoleFeatureConfig): string {
  return feature.router
}

export function getRoleAuthConfig(roleKey: RoleKey): RoleAuthConfig | undefined {
  return (roleAuth as RoleAuthConfig[]).find((item) => item.key === roleKey)
}

export function getRoleRouteConfigByName(routeName: string): RoleRouteConfig | undefined {
  return roleRouteConfigs.find((item) => item.routeName === routeName)
}

export function getDefaultDashboardPath(user: LoggedInUser): string {
  const firstRole = user.roles[0]
  return firstRole ? (getRoleRouteConfig(firstRole.key)?.dashboardPath ?? '/login') : '/login'
}

export function getDefaultRouteName(user: LoggedInUser): RoleRouteName | 'login' {
  const firstRole = user.roles[0]
  return firstRole ? (getRoleRouteConfig(firstRole.key)?.routeName ?? 'login') : 'login'
}

export function userHasRole(user: LoggedInUser, roleKey: RoleKey) {
  return user.roles.some((role) => role.key === roleKey)
}

function sanitizeAccount(account: UserAccount): LoggedInUser {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    avatar: account.avatar,
    department: account.department,
    roles: account.roles,
  }
}

function toRoleFeatureConfig(button: RoleAuthButton): RoleFeatureConfig {
  const routeSegment = getRouteSegment(button.router)

  return {
    key: routeSegment,
    name: button.function_name,
    routeSegment,
    router: button.router,
    icon: button.icon,
  }
}

function getRouteSegment(router: string): string {
  const segments = router.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? 'dashboard'
}
