import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import {
  getCurrentUser,
  getDefaultRouteName,
  getRoleFeatureConfigs,
  getRoleFeaturePath,
  roleRouteConfigs,
  userHasRole,
} from '../utils/auth'
import type { RoleKey } from '../types/auth'

const LoginView = () => import('../views/login.vue')
const DashboardView = () => import('../views/DashboardView.vue')

const roleRoutes: RouteRecordRaw[] = roleRouteConfigs.flatMap((role) => {
  const featureConfigs = getRoleFeatureConfigs(role.key)
  const featureRoutes = featureConfigs.map((feature) => ({
    path: getRoleFeaturePath(role, feature),
    name:
      feature.key === 'dashboard'
        ? role.routeName
        : `${role.routeName}-${feature.routeSegment}`,
    component: DashboardView,
    meta: {
      requiresAuth: true,
      roleKey: role.key,
      roleName: role.name,
      englishName: role.englishName,
      featureKey: feature.key,
      featureName: feature.name,
    },
  }))
  const hasTemplateCreate = featureConfigs.some((feature) => feature.routeSegment === 'template-create')
  const projectManagementFeature = featureConfigs.find(
    (feature) => feature.routeSegment === 'project-management',
  )
  const projectLibraryFeature = featureConfigs.find((feature) => feature.routeSegment === 'project-library')
  const announcementFeature = featureConfigs.find(
    (feature) => feature.routeSegment === 'announcement-publishing',
  )
  const reviewDataMaintenanceFeature = featureConfigs.find(
    (feature) => feature.routeSegment === 'review-data-maintenance',
  )
  const reviewProjectsFeature = featureConfigs.find((feature) => feature.routeSegment === 'review-projects')
  const reviewManagementFeature = featureConfigs.find((feature) => feature.routeSegment === 'review-management')
  const initiationBatchesFeature = featureConfigs.find((feature) => feature.routeSegment === 'initiation-batches')
  const myProjectsFeature = featureConfigs.find((feature) => feature.routeSegment === 'my-projects')
  const myPapersFeature = featureConfigs.find((feature) => feature.routeSegment === 'my-papers')
  const financeWorkbenchFeature = featureConfigs.find((feature) => feature.routeSegment === 'finance-workbench')
  const financeOverviewFeature = featureConfigs.find((feature) => feature.routeSegment === 'finance-overview')
  const financeProjectDetailRouter = financeWorkbenchFeature?.router ?? financeOverviewFeature?.router
  const supportsProjectMemberInitiationFlow =
    role.key === 'projectMember' || role.key === 'projectLeader' || role.key === 'facultyLeader'
  const initiationBatchesRouter = initiationBatchesFeature?.router ?? `${role.basePath}/initiation-batches`

  return [
    {
      path: role.basePath,
      redirect: role.dashboardPath,
    },
    ...featureRoutes,
    ...(hasTemplateCreate || role.key === 'projectLeader'
      ? [
          {
            path: `${role.basePath}/template-new`,
            name: `${role.routeName}-template-new`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'template-new',
              featureName: '模板搭建',
              hidden: true,
            },
          },
        ]
      : []),
    ...(role.key === 'researchProjectAdmin' && projectManagementFeature
      ? [
          {
            path: `${projectManagementFeature.router}/:projectId`,
            name: `${role.routeName}-project-management-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'project-detail',
              featureName: '项目详情',
              hidden: true,
            },
          },
          {
            path: `${projectManagementFeature.router}/:projectId/edit`,
            name: `${role.routeName}-project-management-edit`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'project-edit',
              featureName: '编辑项目',
              hidden: true,
            },
          },
        ]
      : []),
    ...(role.key === 'researchProjectAdmin' && projectLibraryFeature
      ? [
          {
            path: `${projectLibraryFeature.router}/:projectId`,
            name: `${role.routeName}-project-library-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'project-library-detail',
              featureName: '项目详情',
              hidden: true,
            },
          },
        ]
      : []),
    ...(financeProjectDetailRouter
      ? [
          {
            path: `${financeProjectDetailRouter}/:projectId`,
            name: `${role.routeName}-finance-project-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'finance-project-detail',
              featureName: '项目经费详情',
              hidden: true,
            },
          },
        ]
      : []),
    ...(announcementFeature
      ? [
          {
            path: `${role.basePath}/announcement-publish`,
            name: `${role.routeName}-announcement-publish`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'announcement-publish',
              featureName: announcementFeature.name,
              hidden: true,
            },
          },
        ]
      : []),
    ...(role.key === 'researchProjectAdmin'
      ? [
          {
            path: `${role.basePath}/base-announcement-publishing`,
            name: `${role.routeName}-base-announcement-publishing`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'base-announcement-publishing',
              featureName: '公告发布',
              hidden: true,
            },
          },
          {
            path: `${role.basePath}/workflow-config`,
            name: `${role.routeName}-workflow-config`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'workflow-config',
              featureName: '审批流配置',
              hidden: true,
            },
          },
          {
            path: `${role.basePath}/workflow-config/:workflowId`,
            name: `${role.routeName}-workflow-config-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'workflow-config-detail',
              featureName: '审批流编辑',
              hidden: true,
            },
          },
          {
            path: `${role.basePath}/finance-receipts`,
            name: `${role.routeName}-finance-receipts`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'finance-receipts',
              featureName: '到账与经费分拨',
              hidden: true,
            },
          },
          {
            path: `${role.basePath}/finance-settlement`,
            name: `${role.routeName}-finance-settlement`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'finance-settlement',
              featureName: '财务决算',
              hidden: true,
            },
          },
          {
            path: `${role.basePath}/initiation-batches/:batchId/workflow-settings`,
            name: `${role.routeName}-initiation-workflow-settings`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'initiation-workflow-settings',
              featureName: '审批流设置',
              hidden: true,
            },
          },
          {
            path: `${role.basePath}/initiation-batches/:batchId/projects/:projectId`,
            name: `${role.routeName}-initiation-project-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'initiation-project-detail',
              featureName: '项目详情',
              hidden: true,
            },
          },
          {
            path: `${role.basePath}/review-launch`,
            name: `${role.routeName}-review-launch`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'review-launch',
              featureName: '发起评审',
              hidden: true,
            },
          },
          ...(reviewDataMaintenanceFeature
            ? [
                {
                  path: `${reviewDataMaintenanceFeature.router}/:reviewId/config-detail`,
                  name: `${role.routeName}-review-data-maintenance-config-detail`,
                  component: DashboardView,
                  meta: {
                    requiresAuth: true,
                    roleKey: role.key,
                    roleName: role.name,
                    englishName: role.englishName,
                    featureKey: 'review-config-detail',
                    featureName: '详情配置',
                    hidden: true,
                  },
                },
                {
                  path: `${role.basePath}/review-launch/:reviewId/config-detail`,
                  redirect: (to: any) =>
                    `${reviewDataMaintenanceFeature.router}/${String(to.params.reviewId)}/config-detail`,
                },
              ]
            : []),
        ]
      : []),
    ...(role.key === 'researchDepartmentLeader' && reviewProjectsFeature
      ? [
          {
            path: `${reviewProjectsFeature.router}/:projectId`,
            name: `${role.routeName}-review-projects-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'project-detail',
              featureName: '项目详情',
              hidden: true,
            },
          },
        ]
      : []),
    ...(role.key === 'projectLeader' && reviewManagementFeature
      ? [
          {
            path: `${reviewManagementFeature.router}/:projectId`,
            name: `${role.routeName}-review-management-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'project-detail',
              featureName: '项目详情',
              hidden: true,
            },
          },
        ]
      : []),
    ...(role.key === 'projectMember' && myProjectsFeature
      ? [
          {
            path: `${myProjectsFeature.router}/:projectId`,
            name: `${role.routeName}-my-project-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'my-project-detail',
              featureName: '项目详情',
              hidden: true,
            },
          },
        ]
      : []),
    ...(myPapersFeature
      ? [
          {
            path: `${myPapersFeature.router}/new`,
            name: `${role.routeName}-my-paper-create`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'my-paper-create',
              featureName: '新增论文',
              hidden: true,
            },
          },
        ]
      : []),
    ...(supportsProjectMemberInitiationFlow
      ? [
          ...(role.key === 'projectMember'
            ? []
            : [
                {
                  path: initiationBatchesRouter,
                  name: `${role.routeName}-initiation-batches`,
                  component: DashboardView,
                  meta: {
                    requiresAuth: true,
                    roleKey: role.key,
                    roleName: role.name,
                    englishName: role.englishName,
                    featureKey: 'initiation-batches',
                    featureName: '项目申报与立项',
                    hidden: true,
                  },
                },
              ]),
          {
            path: `${initiationBatchesRouter}/:batchId/projects/:projectId`,
            name: `${role.routeName}-initiation-project-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'initiation-project-detail',
              featureName: '项目详情',
              hidden: true,
            },
          },
          {
            path: `${initiationBatchesRouter}/:batchId`,
            name: `${role.routeName}-initiation-batch-detail`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'initiation-batch-detail',
              featureName: '批次详情',
              hidden: true,
            },
          },
          {
            path: `${initiationBatchesRouter}/:batchId/apply`,
            name: `${role.routeName}-initiation-apply`,
            component: DashboardView,
            meta: {
              requiresAuth: true,
              roleKey: role.key,
              roleName: role.name,
              englishName: role.englishName,
              featureKey: 'initiation-apply',
              featureName: '填写申报',
              hidden: true,
            },
          },
        ]
      : []),
  ]
})

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
      },
    },
    ...roleRoutes,
    {
      path: '/research-project-admin/finance-overview',
      redirect: '/research-project-admin/finance-workbench',
    },
    {
      path: '/research-project-admin/finance-budget-adjustments',
      redirect: '/research-project-admin/finance-budget',
    },
    {
      path: '/research-project-admin/finance-sync-records',
      redirect: '/research-project-admin/finance-workbench',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const user = getCurrentUser()

  if (to.meta.requiresAuth && !user) {
    return { name: 'login' }
  }

  if (to.name === 'login' && user) {
    return { name: getDefaultRouteName(user) }
  }

  const requiredRole = to.meta.roleKey as RoleKey | undefined

  if (user && requiredRole && !userHasRole(user, requiredRole)) {
    return { name: getDefaultRouteName(user) }
  }
})

export default router
