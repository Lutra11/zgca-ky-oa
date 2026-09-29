<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import {
  ArrowDown,
  ArrowRight,
  Bell,
  Grid,
  QuestionFilled,
  Tickets,
} from '@element-plus/icons-vue'
import type { LoggedInUser } from '../types/auth'

interface Props {
  user: LoggedInUser | null
  roleName?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  logout: []
}>()

const profileVisible = shallowRef(false)

const avatarModules = import.meta.glob<string>('../dataset/img/*', {
  eager: true,
  query: '?url',
  import: 'default',
})

const defaultAvatar = avatarModules['../dataset/img/zyh.png'] ?? ''

const displayName = computed(() => props.user?.displayName ?? '未登录')

const currentRole = computed(() =>
  props.user?.roles.find((role) => role.name === props.roleName) ?? props.user?.roles[0],
)

const roleLabel = computed(() => props.roleName ?? currentRole.value?.name ?? '未选择角色')

const avatarSrc = computed(() => resolveDatasetImage(props.user?.avatar) ?? defaultAvatar)

const organizationName = computed(() => '中关村人工智能研究院')

const departmentName = computed(() => props.user?.department ?? '科研部')

const dataScope = computed(() => {
  switch (currentRole.value?.key) {
    case 'researchProjectAdmin':
      return '全部科研项目'
    case 'researchDepartmentLeader':
      return '科研部全局'
    case 'facultyLeader':
      return '当前学部'
    case 'projectLeader':
      return '当前子方向'
    case 'reviewer':
      return '本人评审任务'
    case 'projectMember':
      return '本人项目'
    default:
      return '当前权限范围'
  }
})

const phoneNumber = computed(() => '138****1024')

const emailAddress = computed(() => {
  const username = props.user?.username?.trim()

  return username ? `${username}@domain.com` : 'test_account@domain.com'
})

function resolveDatasetImage(avatar?: string) {
  if (!avatar) {
    return undefined
  }

  const normalizedAvatar = avatar
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^src\/dataset\//, '')

  return avatarModules[`../dataset/${normalizedAvatar}`]
}

function requestLogout() {
  profileVisible.value = false
  emit('logout')
}
</script>

<template>
  <header class="app-topbar" aria-label="顶部工具栏">
    <div class="topbar-actions">
      <button class="topbar-icon-button" type="button" aria-label="答疑帮助">
        <el-icon><QuestionFilled /></el-icon>
      </button>

      <span class="topbar-divider" aria-hidden="true"></span>

      <el-popover
        v-model:visible="profileVisible"
        placement="bottom-end"
        trigger="click"
        :width="460"
        :show-arrow="false"
        popper-class="profile-popover-shell"
      >
        <template #reference>
          <button class="current-user" type="button" aria-label="打开个人信息" :aria-expanded="profileVisible">
            <el-tag class="role-tag" round>{{ roleLabel }}</el-tag>
            <el-avatar class="user-avatar" :size="40" :src="avatarSrc">
              {{ displayName.slice(0, 1) }}
            </el-avatar>
            <strong class="user-name">{{ displayName }}</strong>
            <el-icon class="user-arrow"><ArrowDown /></el-icon>
          </button>
        </template>

        <section class="profile-card profile-card-dense" aria-label="个人信息">
          <section class="profile-section">
            <h3>
              <span class="section-icon blue-outline">
                <el-icon><Tickets /></el-icon>
              </span>
              基本信息
            </h3>

            <div class="profile-info-grid">
              <div class="profile-info-item">
                <span>所属组织：</span>
                <strong>{{ organizationName }}</strong>
              </div>
              <div class="profile-info-item">
                <span>所属部门：</span>
                <strong>{{ departmentName }}</strong>
              </div>
              <div class="profile-info-item">
                <span>数据范围：</span>
                <strong>{{ dataScope }}</strong>
              </div>
            </div>

            <div class="profile-contact-row">
              <span class="contact-icon"><el-icon><Grid /></el-icon></span>
              <span>手机号：</span>
              <strong>{{ phoneNumber }}</strong>
            </div>
            <div class="profile-contact-row">
              <span class="contact-icon"><el-icon><Bell /></el-icon></span>
              <span>邮箱：</span>
              <strong>{{ emailAddress }}</strong>
            </div>
          </section>

          <el-divider />

          <button class="profile-logout" type="button" @click="requestLogout">
            <el-icon><ArrowRight /></el-icon>
            退出登录
          </button>
        </section>
      </el-popover>
    </div>
  </header>
</template>

<style scoped>
.app-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  min-height: 72px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 18px;
  padding: 14px 32px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 28px rgba(26, 39, 68, 0.05);
  backdrop-filter: blur(22px);
}

.topbar-actions {
  display: flex;
  justify-self: end;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.topbar-icon-button,
.current-user {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.topbar-icon-button {
  width: 44px;
  height: 44px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  color: #273244;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.topbar-icon-button:hover {
  color: #0066cc;
  background: rgba(0, 113, 227, 0.08);
  transform: translateY(-1px);
}

.topbar-icon-button :deep(.el-icon) {
  font-size: 23px;
}

.topbar-divider {
  width: 1px;
  height: 28px;
  background: rgba(29, 29, 31, 0.1);
}

.current-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  border-radius: 999px;
  padding: 4px 8px 4px 4px;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.current-user:hover,
.current-user[aria-expanded='true'] {
  background: #f4f8ff;
  box-shadow: inset 0 0 0 1px rgba(0, 113, 227, 0.1);
  transform: translateY(-1px);
}

.role-tag {
  max-width: 160px;
  height: 28px;
  border-color: rgba(0, 113, 227, 0.16);
  color: #0066cc;
  background: #eef6ff;
  font-weight: 760;
}

.role-tag :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar {
  flex: 0 0 auto;
  border: 2px solid #fff;
  box-shadow: 0 8px 18px rgba(26, 39, 68, 0.12);
}

.user-name {
  max-width: 96px;
  overflow: hidden;
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-arrow {
  flex: 0 0 auto;
  color: #6e6e73;
  font-size: 16px;
}

:deep(.profile-popover-shell) {
  padding: 0;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 18px;
  box-shadow: 0 22px 58px rgba(26, 39, 68, 0.16);
  overflow: hidden;
}

.profile-card {
  width: 100%;
  box-sizing: border-box;
  padding: 22px 24px 20px;
  color: #1d1d1f;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(22px);
}

.profile-card :deep(.el-divider--horizontal) {
  margin: 18px 0;
}

.profile-hero {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 24px;
  align-items: center;
}

.profile-avatar {
  border: 1px solid rgba(29, 29, 31, 0.06);
  box-shadow: 0 16px 34px rgba(26, 39, 68, 0.12);
}

.profile-title-block {
  min-width: 0;
}

.profile-title-block h2,
.profile-title-block p,
.profile-section h3,
.profile-info-item span,
.profile-info-item strong,
.profile-contact-row span,
.profile-contact-row strong,
.overview-item span,
.overview-item strong {
  margin: 0;
}

.profile-title-block h2 {
  color: #111827;
  font-size: 28px;
  font-weight: 860;
  letter-spacing: 0;
  line-height: 1.2;
}

.profile-role-tag {
  height: 34px;
  margin-top: 8px;
  border-color: rgba(0, 113, 227, 0.22);
  color: #0870de;
  background: #edf6ff;
  font-size: 15px;
  font-weight: 820;
}

.profile-title-block p {
  margin-top: 10px;
  color: #6e6e73;
  font-size: 16px;
  line-height: 1.5;
}

.profile-section {
  display: grid;
  gap: 14px;
}

.profile-section h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 840;
}

.section-icon {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  color: #0870de;
  font-size: 18px;
}

.blue-outline {
  box-shadow: inset 0 0 0 1px rgba(0, 113, 227, 0.18);
}

.filled-blue {
  background: #eaf3ff;
}

.lightning-icon {
  background: #f1f7ff;
}

.profile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px dashed rgba(29, 29, 31, 0.12);
  border-bottom: 1px dashed rgba(29, 29, 31, 0.12);
}

.profile-info-item {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  border-bottom: 1px dashed rgba(29, 29, 31, 0.1);
}

.profile-info-item:nth-child(2n) {
  border-left: 1px solid rgba(29, 29, 31, 0.08);
}

.profile-info-item:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.profile-info-item span,
.profile-contact-row span {
  flex: 0 0 auto;
  color: #6e6e73;
  font-size: 15px;
}

.profile-info-item strong,
.profile-contact-row strong {
  min-width: 0;
  overflow: hidden;
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-contact-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 4px 12px;
  border-bottom: 1px dashed rgba(29, 29, 31, 0.1);
}

.contact-icon {
  width: 24px;
  display: inline-grid;
  place-items: center;
  color: #0870de;
  font-size: 18px;
}

.overview-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
  overflow: hidden;
}

.overview-item {
  min-height: 82px;
  display: grid;
  grid-template-columns: 44px auto;
  gap: 14px;
  align-items: center;
  justify-content: center;
}

.overview-item + .overview-item {
  border-left: 1px solid rgba(29, 29, 31, 0.08);
}

.overview-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: #0870de;
  font-size: 28px;
}

.overview-item div {
  display: grid;
  gap: 4px;
}

.overview-item span {
  color: #6e6e73;
  font-size: 15px;
}

.overview-item strong {
  color: #0870de;
  font-size: 24px;
  font-weight: 860;
  line-height: 1;
}

.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
}

.quick-action-button {
  min-width: 0;
  min-height: 58px;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 18px;
  gap: 12px;
  align-items: center;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 10px;
  padding: 0 14px;
  color: #1d1d1f;
  background: #ffffff;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.quick-action-button:hover {
  border-color: rgba(0, 113, 227, 0.22);
  box-shadow: 0 10px 24px rgba(26, 39, 68, 0.08);
  transform: translateY(-1px);
}

.quick-action-button > .el-icon:first-child {
  color: #1d1d1f;
  font-size: 24px;
}

.quick-action-button span {
  overflow: hidden;
  font-size: 15px;
  font-weight: 740;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-action-arrow {
  color: #8a94a6;
  font-size: 17px;
}

.profile-logout {
  width: 100%;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 10px;
  color: #e33b35;
  background: transparent;
  font-size: 16px;
  font-weight: 820;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.profile-logout:hover {
  background: #fff2f1;
  transform: translateY(-1px);
}

.profile-logout .el-icon {
  font-size: 20px;
}

:deep(.profile-popover-shell) {
  width: min(460px, calc(100vw - 36px)) !important;
  max-height: 25vh;
}

.compact-profile-card {
  max-height: 25vh;
  display: grid;
  gap: 10px;
  overflow-y: auto;
  padding: 14px;
  scrollbar-width: thin;
}

@supports (height: 1dvh) {
  :deep(.profile-popover-shell),
  .compact-profile-card {
    max-height: 25dvh;
  }
}

.compact-profile-card::-webkit-scrollbar {
  width: 6px;
}

.compact-profile-card::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.28);
}

.compact-profile-head {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.compact-profile-avatar {
  border: 2px solid #ffffff;
  box-shadow: 0 10px 22px rgba(26, 39, 68, 0.12);
}

.compact-profile-title {
  min-width: 0;
}

.compact-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.compact-name-row h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #111827;
  font-size: 18px;
  font-weight: 860;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-role-tag {
  flex: 0 0 auto;
  height: 26px;
  border-color: rgba(0, 113, 227, 0.18);
  color: #0870de;
  background: #edf6ff;
  font-size: 12px;
  font-weight: 800;
}

.compact-profile-title p {
  margin: 5px 0 0;
  overflow: hidden;
  color: #6e6e73;
  font-size: 12px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.compact-info-grid article,
.compact-stat-item {
  min-width: 0;
  border: 1px solid rgba(29, 29, 31, 0.07);
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
}

.compact-info-grid article {
  display: grid;
  gap: 4px;
  padding: 8px 10px;
}

.compact-info-grid span,
.compact-stat-item span {
  color: #8a94a6;
  font-size: 11px;
  font-weight: 720;
}

.compact-info-grid strong {
  overflow: hidden;
  color: #1d1d1f;
  font-size: 12px;
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-work-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.compact-stat-item {
  min-height: 46px;
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
}

.compact-stat-item .el-icon {
  color: #0870de;
  font-size: 20px;
}

.compact-stat-item strong {
  color: #0870de;
  font-size: 18px;
  font-weight: 860;
}

.compact-action-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 7px;
}

.compact-action-button,
.compact-logout-button {
  min-width: 0;
  min-height: 34px;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 9px;
  background: #ffffff;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    transform 0.18s ease;
}

.compact-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #344054;
  font-size: 12px;
  font-weight: 760;
}

.compact-action-button .el-icon {
  flex: 0 0 auto;
  font-size: 15px;
}

.compact-action-button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-action-button:hover {
  border-color: rgba(0, 113, 227, 0.22);
  background: #f7fbff;
  transform: translateY(-1px);
}

.compact-logout-button {
  color: #e33b35;
  font-size: 12px;
  font-weight: 820;
}

.compact-logout-button:hover {
  border-color: rgba(227, 59, 53, 0.2);
  background: #fff2f1;
  transform: translateY(-1px);
}
.profile-card-dense {
  max-height: 25vh;
  overflow-y: auto;
  padding: 14px 16px 12px;
  scrollbar-width: thin;
}

@supports (height: 1dvh) {
  .profile-card-dense {
    max-height: 25dvh;
  }
}

.profile-card-dense::-webkit-scrollbar {
  width: 6px;
}

.profile-card-dense::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.28);
}

.profile-card-dense :deep(.el-divider--horizontal) {
  margin: 9px 0;
}

.profile-card-dense .profile-section {
  gap: 8px;
}

.profile-card-dense .profile-section h3 {
  gap: 7px;
  font-size: 14px;
}

.profile-card-dense .section-icon {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  font-size: 14px;
}

.profile-card-dense .profile-info-item {
  gap: 6px;
  padding: 8px 9px;
}

.profile-card-dense .profile-info-item span,
.profile-card-dense .profile-contact-row span {
  font-size: 12px;
}

.profile-card-dense .profile-info-item strong,
.profile-card-dense .profile-contact-row strong {
  font-size: 12px;
}

.profile-card-dense .profile-contact-row {
  min-height: 30px;
  gap: 7px;
  padding: 0 3px 7px;
}

.profile-card-dense .contact-icon {
  width: 20px;
  font-size: 14px;
}

.profile-card-dense .overview-item {
  min-height: 54px;
  grid-template-columns: 32px auto;
  gap: 8px;
}

.profile-card-dense .overview-icon {
  width: 30px;
  height: 30px;
  font-size: 20px;
}

.profile-card-dense .overview-item span {
  font-size: 12px;
}

.profile-card-dense .overview-item strong {
  font-size: 18px;
}

.profile-card-dense .quick-action-grid {
  gap: 8px;
}

.profile-card-dense .quick-action-button {
  min-height: 42px;
  grid-template-columns: 24px minmax(0, 1fr) 14px;
  gap: 8px;
  padding: 0 10px;
}

.profile-card-dense .quick-action-button > .el-icon:first-child {
  font-size: 18px;
}

.profile-card-dense .quick-action-button span {
  font-size: 13px;
}

.profile-card-dense .quick-action-arrow {
  font-size: 14px;
}

.profile-card-dense .profile-logout {
  min-height: 34px;
  font-size: 14px;
}

.profile-card-dense .profile-logout .el-icon {
  font-size: 16px;
}
@media (max-width: 1180px) {
  .topbar-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 720px) {
  .app-topbar {
    gap: 12px;
    padding: 12px 20px;
  }

  .topbar-actions {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .role-tag {
    max-width: 124px;
  }

  .user-name {
    max-width: 72px;
  }

  .profile-card {
    padding: 18px;
  }

  .profile-hero,
  .profile-info-grid,
  .overview-panel,
  .quick-action-grid {
    grid-template-columns: 1fr;
  }

  .profile-info-item:nth-child(2n),
  .overview-item + .overview-item {
    border-left: 0;
  }

  .profile-info-item:nth-last-child(-n + 2) {
    border-bottom: 1px dashed rgba(29, 29, 31, 0.1);
  }
}

.app-topbar {
  min-height: 68px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  align-items: center;
  padding: 0 32px;
  border-bottom: 1px solid rgba(215, 225, 240, 0.9);
  background: rgba(255, 255, 255, 0.86);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.82) inset,
    0 10px 28px rgba(31, 73, 125, 0.045);
  backdrop-filter: blur(18px) saturate(1.3);
}

.topbar-actions {
  justify-self: end;
  gap: 12px;
}

.topbar-icon-button {
  width: 38px;
  height: 38px;
  border: 1px solid #dfe7f2;
  border-radius: 12px;
  color: #66758c;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 14px rgba(31, 73, 125, 0.04);
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.topbar-icon-button:hover {
  border-color: rgba(52, 120, 229, 0.28);
  color: #3478e5;
  background: #fff;
  box-shadow: 0 10px 22px rgba(52, 120, 229, 0.1);
  transform: translateY(-1px);
}

.topbar-icon-button :deep(.el-icon) {
  font-size: 18px;
}

.topbar-divider {
  height: 24px;
  background: #e8edf5;
}

.current-user {
  min-height: 40px;
  gap: 8px;
  padding: 3px 10px 3px 4px;
  border: 1px solid #dfe7f2;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 5px 16px rgba(31, 73, 125, 0.045);
}

.current-user:hover,
.current-user[aria-expanded='true'] {
  border-color: rgba(52, 120, 229, 0.26);
  background: #fff;
  box-shadow: 0 10px 24px rgba(52, 120, 229, 0.09);
  transform: translateY(-1px);
}

.role-tag {
  max-width: 132px;
  height: 24px;
  border: 0;
  color: #1f63d6;
  background: linear-gradient(180deg, #f3f8ff 0%, #eaf3ff 100%);
  font-size: 11px;
  font-weight: 700;
}

.user-avatar {
  width: 32px !important;
  height: 32px !important;
  border: 1px solid #fff;
  box-shadow: 0 6px 16px rgba(25, 45, 80, 0.14);
}

.user-name {
  max-width: 88px;
  color: #334057;
  font-size: 13px;
  font-weight: 650;
}

.user-arrow {
  color: #9ba5b4;
  font-size: 14px;
}

@media (max-width: 1180px) {
  .app-topbar {
    min-height: auto;
    padding: 12px 22px;
  }

  .topbar-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 720px) {
  .app-topbar {
    gap: 10px;
    padding: 12px 16px;
  }

  .topbar-actions {
    justify-content: flex-start;
  }

  .role-tag {
    max-width: 108px;
  }

  .user-name {
    max-width: 64px;
  }
}
</style>







