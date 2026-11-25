import { shallowRef } from 'vue'

export interface OfficeLaunchFeedback {
  rejected: boolean
  reason: string
  at: string
}

/**
 * 管理办负责人驳回「立项指南发布」后反馈给 PMO 的跨页面状态。
 * 模块级 ref：管理办 / PMO 分属不同路由与组件实例，普通组件内状态切换角色即丢，
 * 放模块层保证驳回理由跨视图可见，PMO 重新发起成功后由 reset 清除。
 */
export const officeLaunchFeedback = shallowRef<OfficeLaunchFeedback>({
  rejected: false,
  reason: '',
  at: '',
})

export function setOfficeLaunchRejected(reason: string, at: string): void {
  officeLaunchFeedback.value = { rejected: true, reason, at }
}

export function resetOfficeLaunchFeedback(): void {
  officeLaunchFeedback.value = { rejected: false, reason: '', at: '' }
}
