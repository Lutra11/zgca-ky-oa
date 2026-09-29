export type RoleKey =
  | 'researchProjectAdmin'
  | 'researchDepartmentLeader'
  | 'facultyLeader'
  | 'projectLeader'
  | 'reviewer'
  | 'projectMember'
  | 'projectStudent'
  | 'projectMentor'

export type RoleRouteName =
  | 'research-project-admin'
  | 'research-dept-leader'
  | 'faculty-leader'
  | 'sub-direction-leader'
  | 'review-judge'
  | 'project-member'
  | 'project-student'
  | 'project-mentor'

export type RoleFeatureKey =
  string

export type RoleFeatureRouteSegment =
  string

export interface RoleInfo {
  key: RoleKey
  name: string
  englishName: string
  routeName: RoleRouteName
}

export interface UserAccount {
  id: string
  username: string
  password: string
  displayName: string
  avatar: string
  department: string
  roles: RoleInfo[]
}

export interface LoggedInUser {
  id: string
  username: string
  displayName: string
  avatar: string
  department: string
  roles: RoleInfo[]
}

export interface RoleRouteConfig {
  key: RoleKey
  name: string
  englishName: string
  routeName: RoleRouteName
  basePath: string
  dashboardPath: string
}

export interface RoleFeatureConfig {
  key: RoleFeatureKey
  name: string
  routeSegment: RoleFeatureRouteSegment
  router: string
  icon: string
}

export interface RoleAuthButton {
  function_name: string
  router: string
  icon: string
}

export interface RoleAuthConfig {
  key: RoleKey
  content: RoleAuthButton[]
}
