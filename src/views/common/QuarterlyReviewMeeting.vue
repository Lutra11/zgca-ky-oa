<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowRight,
  Calendar,
  Clock,
  Document,
  Search,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'
import meetingDataset from '../../dataset/quarterly_review_meeting.json'
import { getRoleFeatureConfigs } from '../../utils/auth'
import type { RoleFeatureConfig, RoleKey } from '../../types/auth'

type StatusTone = 'success' | 'warning' | 'info' | 'danger'

interface RoleMetric {
  label: string
  value: string
}

interface RoleNotice {
  title: string
  content: string
  action: string
}

interface RoleMeetingView {
  roleLabel: string
  summary: string
  primaryAction: string
  primaryRoute: string
  dangerAction: string
  focusItems: string[]
  metrics: RoleMetric[]
  notice?: RoleNotice
}

interface QuarterlyMeeting {
  id: string
  name: string
  status: string
  statusTone: StatusTone
  reviewPeriod: string
  projectAssessmentPeriod: string
  evaluationDeadline: string
  projectCount: number
  directionCount: number
  facultyCount: number
  approvalStatus: string
  reviewRecorder: string
  reviewApplicant: string
  announcementPublisher: string
  announcementAuditor: string
  roleViews: Record<RoleKey, RoleMeetingView>
}

interface HistoryMeeting {
  id: string
  year: string
  name: string
  reviewPeriod: string
  projectAssessmentPeriod: string
  facultyCount: number
  directionCount: number
  projectCount: number
  reviewRecorder: string
  reviewApplicant: string
  announcementPublisher: string
  announcementAuditor: string
  status: string
}

interface QuarterlyMeetingDataset {
  current: QuarterlyMeeting
  history: HistoryMeeting[]
}

interface QuarterlyFeatureLink extends RoleFeatureConfig {
  iconUrl: string
  description: string
}

interface MetricSlot {
  key: string
  labels: string[]
}

const route = useRoute()
const router = useRouter()
const dataset = meetingDataset as unknown as QuarterlyMeetingDataset
const featureIconModules = import.meta.glob<string>('../../dataset/icon/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})

const routeRoleKey = computed(() => route.meta.roleKey as RoleKey)
const previewRoleKey = shallowRef<RoleKey>(routeRoleKey.value)
const isNoReviewState = shallowRef(false)

const draftFilters = reactive({
  year: '',
  keyword: '',
})

const appliedFilters = reactive({
  year: '',
  keyword: '',
})

const switchableRoleKeys: RoleKey[] = ['facultyLeader', 'projectLeader', 'reviewer']

const metricSlots: MetricSlot[] = [
  { key: 'review-period', labels: ['评审周期'] },
  { key: 'assessment-period', labels: ['项目考核周期'] },
  { key: 'deadline', labels: ['360环评及绩效截止'] },
  { key: 'project-count', labels: ['参评项目数', '待评项目数'] },
  { key: 'direction-count', labels: ['参评子方向数'] },
  { key: 'faculty-count', labels: ['参评学部数'] },
  { key: 'approval-status', labels: ['审批状态'] },
  { key: 'review-reminder', labels: ['评审截止提醒'] },
]

const quarterlyCommonFeatureExcludes = new Set([
  'dashboard',
  'quarterly-review-meeting',
  'finance-overview',
  'finance-workbench',
  'finance-ledger',
  'finance-receipts',
  'finance-budget',
  'finance-expenses',
  'finance-budget-adjustments',
  'finance-alerts',
  'finance-reconciliation',
  'finance-reports',
  'finance-settlement',
  'finance-sync',
  'finance-sync-records',
  'paper-outcomes-management',
  'initiation-batches',
  'initiation-batch-detail',
  'initiation-apply',
  'initiation-project-detail',
  'initiation-workflow-settings',
  'project-library',
  'project-recruitments',
  'project-recruitment-applications',
  'project-recruitment-members',
])

const quarterlyAdminFeatureAllowList = new Set([
  'review-data-maintenance',
  'template-create',
  'project-management',
  'announcement-publishing',
])

function getVisibleRoleKeys(roleKey: RoleKey): RoleKey[] {
  return switchableRoleKeys.includes(roleKey) ? switchableRoleKeys : [roleKey]
}

const visibleRoleKeys = computed(() => getVisibleRoleKeys(routeRoleKey.value))

const activeRoleViewKey = computed<RoleKey>(() =>
  visibleRoleKeys.value.includes(previewRoleKey.value)
    ? previewRoleKey.value
    : visibleRoleKeys.value[0] ?? routeRoleKey.value,
)

const roleOptions = computed(() =>
  visibleRoleKeys.value.map((key) => ({
    key,
    label: dataset.current.roleViews[key].roleLabel,
  })),
)

const hasRoleSwitcher = computed(() => roleOptions.value.length > 1)

const canLaunchReviewFromEmpty = computed(() => activeRoleViewKey.value === 'researchProjectAdmin')

const roleView = computed(
  () => dataset.current.roleViews[activeRoleViewKey.value] ?? dataset.current.roleViews[routeRoleKey.value],
)

const statusType = computed(() => {
  const typeMap: Record<StatusTone, 'success' | 'warning' | 'info' | 'danger'> = {
    success: 'success',
    warning: 'warning',
    info: 'info',
    danger: 'danger',
  }

  return typeMap[dataset.current.statusTone] ?? 'info'
})

function resolveMetricIcon(label: string) {
  if (label.includes('评审周期')) {
    return Calendar
  }

  if (label.includes('考核周期') || label.includes('截止') || label.includes('提醒')) {
    return Clock
  }

  if (label.includes('项目')) {
    return Document
  }

  if (label.includes('子方向') || label.includes('学部')) {
    return User
  }

  return ArrowRight
}

const currentMetrics = computed(() => {
  const metricsByLabel = new Map(roleView.value.metrics.map((metric) => [metric.label, metric]))

  return metricSlots.map((slot) => {
    const metric = slot.labels.map((label) => metricsByLabel.get(label)).find(Boolean)

    return {
      key: slot.key,
      label: metric?.label ?? slot.labels[0],
      value: metric?.value ?? '',
      icon: resolveMetricIcon(metric?.label ?? slot.labels[0]),
      visible: Boolean(metric),
    }
  })
})

const quarterlyFunctionLinks = computed<QuarterlyFeatureLink[]>(() =>
  getRoleFeatureConfigs(activeRoleViewKey.value)
    .filter((feature) => {
      if (activeRoleViewKey.value === 'researchProjectAdmin') {
        return quarterlyAdminFeatureAllowList.has(feature.routeSegment)
      }

      return !quarterlyCommonFeatureExcludes.has(feature.routeSegment)
    })
    .map((feature) => ({
      ...feature,
      iconUrl: resolveFeatureIcon(feature.icon),
      description: getFeatureDescription(feature.name),
    })),
)

function resolveFeatureIcon(icon?: string) {
  if (!icon) {
    return ''
  }

  const normalizedIcon = icon
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^src\/dataset\//, '')

  return featureIconModules[`../../dataset/${normalizedIcon}`] ?? ''
}

function getFeatureDescription(name: string) {
  const descriptionMap: Record<string, string> = {
    数据维护: '维护评审配置',
    模板搭建: '维护评审模板',
    项目管理: '查看参评项目',
    公告发布: '发布评审公告',
    评审项目: '审批与查看评审',
    评审管理: '配置评委与时间',
    评审材料提交: '提交评审材料',
    材料成果维护: '维护材料成果',
    项目评审: '处理待评项目',
    评审结果: '查看评审结果',
    我的项目: '查看项目材料',
    '360 环评': '填写环评反馈',
  }

  return descriptionMap[name] ?? '处理季度评审事项'
}

const yearOptions = computed(() =>
  Array.from(new Set(dataset.history.map((item) => item.year))).sort((a, b) => Number(b) - Number(a)),
)

const filteredHistory = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return dataset.history.filter((item) => {
    const matchesYear = appliedFilters.year ? item.year === appliedFilters.year : true
    const matchesKeyword = keyword ? item.name.toLowerCase().includes(keyword) : true

    return matchesYear && matchesKeyword
  })
})

watch(
  routeRoleKey,
  (nextRoleKey) => {
    const nextVisibleKeys = getVisibleRoleKeys(nextRoleKey)
    previewRoleKey.value = nextVisibleKeys.includes(previewRoleKey.value)
      ? previewRoleKey.value
      : nextVisibleKeys[0] ?? nextRoleKey
  },
)

function selectRoleView(roleKey: RoleKey) {
  if (roleKey === activeRoleViewKey.value || !visibleRoleKeys.value.includes(roleKey)) {
    return
  }

  previewRoleKey.value = roleKey
}

function applyFilters() {
  appliedFilters.year = draftFilters.year
  appliedFilters.keyword = draftFilters.keyword
}

function resetFilters() {
  draftFilters.year = ''
  draftFilters.keyword = ''
  appliedFilters.year = ''
  appliedFilters.keyword = ''
}

function enterQuarterlyFeature(path: string) {
  router.push(path)
}

function launchReviewFromEmpty() {
  if (!canLaunchReviewFromEmpty.value) {
    ElMessage.info('当前角色暂无发起评审权限')
    return
  }

  router.push('/research-project-admin/review-launch')
}

function enterPrimaryAction() {
  if (!roleView.value.primaryRoute) {
    ElMessage.info('当前角色入口正在建设中')
    return
  }

  router.push(roleView.value.primaryRoute)
}

async function endReview() {
  try {
    await ElMessageBox.confirm('结束后当前季度评审会将进入归档状态，是否继续？', '结束评审', {
      type: 'warning',
      confirmButtonText: '确认结束',
      cancelButtonText: '取消',
      autofocus: false,
    })
    isNoReviewState.value = true
    ElMessage.success('已切换为无评审状态（原型模拟）')
  } catch {
    // 用户取消时不处理。
  }
}

function toggleNoReviewState() {
  isNoReviewState.value = !isNoReviewState.value
  ElMessage.success(isNoReviewState.value ? '已切换为无评审状态' : '已恢复评审进行状态')
}
</script>

<template>
  <section class="quarterly-page" aria-label="季度评审会">
    <section v-if="quarterlyFunctionLinks.length" class="quarterly-feature-dock" aria-label="季度评审会常用功能">
      <header class="feature-dock-header">
        <h2>常用功能</h2>
        <span>按当前身份展示可用操作</span>
      </header>

      <div class="quarterly-feature-grid">
        <button
          v-for="feature in quarterlyFunctionLinks"
          :key="feature.router"
          type="button"
          class="quarterly-feature-button"
          @click="enterQuarterlyFeature(feature.router)"
        >
          <span class="feature-action-icon">
            <img
              v-if="feature.iconUrl"
              class="feature-action-image"
              :src="feature.iconUrl"
              :alt="`${feature.name}图标`"
            >
            <span v-else class="feature-action-fallback">{{ feature.name.slice(0, 1) }}</span>
          </span>
          <span class="feature-action-body">
            <strong>{{ feature.name }}</strong>
          </span>
          <el-icon class="feature-action-arrow"><ArrowRight /></el-icon>
        </button>
      </div>
    </section>

    <header class="quarterly-heading quarterly-role-strip">
      <div class="role-context" aria-live="polite">
        <span>当前身份</span>
        <strong>{{ roleView.roleLabel }}</strong>
      </div>

      <div class="heading-actions">
        <div v-if="hasRoleSwitcher" class="role-switcher" aria-label="角色视角切换">
          <button
            v-for="item in roleOptions"
            :key="item.key"
            type="button"
            class="role-switch-button"
            :class="{ 'is-active': activeRoleViewKey === item.key }"
            :aria-pressed="activeRoleViewKey === item.key"
            @click="selectRoleView(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
        <el-button class="ghost-state-button" :icon="SwitchButton" plain @click="toggleNoReviewState">
          无评审状态
        </el-button>
      </div>
    </header>

    <article class="current-card">
      <div v-if="!isNoReviewState" class="current-panel">
        <div class="current-topline">
          <div class="status-block">
            <el-tag :type="statusType" effect="light" size="large">{{ dataset.current.status }}</el-tag>
            <div>
              <strong>{{ dataset.current.name }}</strong>
              <span>{{ roleView.summary }}</span>
            </div>
          </div>

          <el-button type="primary" :icon="ArrowRight" @click="enterPrimaryAction">
            {{ roleView.primaryAction }}
          </el-button>
        </div>

        <el-divider />

        <section class="metric-grid" aria-label="季度评审会信息">
          <article
            v-for="metric in currentMetrics"
            :key="metric.key"
            class="metric-item"
            :class="{ 'metric-item-hidden': !metric.visible }"
            :aria-hidden="!metric.visible"
          >
            <span class="metric-icon">
              <el-icon><component :is="metric.icon" /></el-icon>
            </span>
            <div>
              <p>{{ metric.label }}</p>
              <strong>{{ metric.value }}</strong>
            </div>
          </article>
        </section>

        <section v-if="roleView.notice" class="audit-notice" aria-label="角色提示">
          <span class="notice-icon">
            <el-icon><Document /></el-icon>
          </span>
          <div class="notice-content">
            <strong>{{ roleView.notice.title }}</strong>
            <p>{{ roleView.notice.content }}</p>
          </div>
          <el-button type="primary" plain @click="enterPrimaryAction">
            {{ roleView.notice.action }}
          </el-button>
        </section>

        <template v-if="roleView.dangerAction">
          <el-divider />
          <footer class="current-footer">
            <el-button type="danger" @click="endReview">
              {{ roleView.dangerAction }}
            </el-button>
          </footer>
        </template>
      </div>

      <div v-else class="current-panel current-empty-panel">
        <el-empty
          description="当前暂无进行中的季度评审会"
          :image-size="118"
        >
          <el-button v-if="canLaunchReviewFromEmpty" type="primary" plain @click="launchReviewFromEmpty">发起评审</el-button>
        </el-empty>
      </div>
    </article>

    <article class="history-card">
      <header class="section-header">
        <div>
          <h2>历次评审</h2>
          <p>支持按年份和评审名称筛选历史季度评审会</p>
        </div>
      </header>

      <section class="filter-bar" aria-label="历次评审筛选">
        <el-select v-model="draftFilters.year" placeholder="全部年份" clearable>
          <el-option v-for="year in yearOptions" :key="year" :label="year" :value="year" />
        </el-select>
        <el-input v-model="draftFilters.keyword" placeholder="请输入评审名称" clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="Search" @click="applyFilters">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </section>

      <el-table :data="filteredHistory" class="history-table">
        <el-table-column label="序号" width="70" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="评审名称" min-width="210">
          <template #default="{ row }">
            <el-button link type="primary">{{ row.name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="reviewPeriod" label="评审周期" min-width="180" />
        <el-table-column prop="projectAssessmentPeriod" label="项目考评周期" min-width="170" />
        <el-table-column prop="facultyCount" label="参评学部数" width="115" align="center" />
        <el-table-column prop="directionCount" label="参评子方向数" width="125" align="center" />
        <el-table-column prop="projectCount" label="参评项目数" width="115" align="center" />
        <el-table-column prop="reviewRecorder" label="评审登记人" width="115" align="center" />
        <el-table-column prop="reviewApplicant" label="评审申请人" width="115" align="center" />
        <el-table-column prop="announcementPublisher" label="公告发起人" width="115" align="center" />
        <el-table-column prop="announcementAuditor" label="公告审核人" width="115" align="center" />
        <el-table-column label="状态" width="105" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : 'info'" effect="light">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </article>
  </section>
</template>

<style scoped>
.quarterly-page {
  display: grid;
  gap: 20px;
  color: #1d1d1f;
  animation: quarterly-fade-up 0.24s ease both;
}

.quarterly-heading,
.current-topline,
.section-header,
.current-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.quarterly-heading h1,
.quarterly-heading p,
.section-header h2,
.section-header p,
.metric-item p,
.metric-item strong,
.status-block strong,
.status-block span {
  margin: 0;
}

.quarterly-role-strip {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 10px 12px 10px 16px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 26px rgba(26, 39, 68, 0.045);
  backdrop-filter: blur(18px);
}

.role-context {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 128px;
}

.role-context span {
  color: #8a94a6;
  font-size: 13px;
  font-weight: 720;
}

.role-context strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 860;
}

.quarterly-feature-dock {
  overflow-x: auto;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.055);
  backdrop-filter: blur(18px);
}

.feature-dock-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.feature-dock-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 860;
}

.feature-dock-header span {
  color: #7b8494;
  font-size: 13px;
  font-weight: 680;
}

.quarterly-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  min-width: 880px;
}

.quarterly-feature-button {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 18px;
  gap: 14px;
  align-items: center;
  width: 100%;
  height: 68px;
  border: 1px solid rgba(31, 111, 255, 0.11);
  border-radius: 8px;
  padding: 14px;
  color: #172033;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.88), 0 8px 18px rgba(26, 39, 68, 0.035);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.quarterly-feature-button:hover {
  border-color: rgba(31, 111, 255, 0.3);
  background: #ffffff;
  box-shadow: 0 14px 28px rgba(31, 111, 255, 0.1);
  transform: translateY(-1px);
}

.feature-action-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(145deg, #eaf4ff, #f6fbff);
  color: #1f6fff;
  overflow: hidden;
}

.feature-action-image {
  width: 25px;
  height: 25px;
  object-fit: contain;
}

.feature-action-fallback {
  font-size: 14px;
  font-weight: 860;
}

.feature-action-body {
  display: grid;
  min-width: 0;
  text-align: left;
}

.feature-action-body strong {
  overflow: hidden;
  color: #172033;
  font-size: 15px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-action-arrow {
  color: #9aa4b2;
  font-size: 15px;
  transition: color 0.2s ease, transform 0.2s ease;
}

.quarterly-feature-button:hover .feature-action-arrow {
  color: #1f6fff;
  transform: translateX(2px);
}
.section-header p {
  margin-top: 6px;
  color: #6e6e73;
  font-size: 14px;
}

.heading-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex: 1;
}

.role-switcher {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: auto;
  max-width: 100%;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.role-switch-button {
  min-height: 34px;
  border: 1px solid rgba(31, 111, 255, 0.12);
  border-radius: 8px;
  padding: 0 16px;
  color: #5f6b7a;
  background: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 760;
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.role-switch-button:hover {
  border-color: rgba(31, 111, 255, 0.24);
  color: #1f2937;
  background: #ffffff;
}

.role-switch-button.is-active {
  border-color: rgba(31, 111, 255, 0.34);
  color: #1f6fff;
  background: #eef6ff;
  box-shadow: 0 6px 16px rgba(31, 111, 255, 0.08);
}

.ghost-state-button {
  color: #697586;
  background: rgba(255, 255, 255, 0.7);
}

.current-card,
.history-card {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.current-card {
  height: 420px;
  overflow: hidden;
  padding: 26px 30px;
  box-sizing: border-box;
}

.current-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.current-empty-panel {
  align-items: center;
  justify-content: center;
}

.current-card :deep(.el-divider--horizontal) {
  margin: 18px 0;
}

.history-card {
  overflow: hidden;
}

.section-header {
  padding: 18px 22px 14px;
}

.section-header h2 {
  font-size: 18px;
  font-weight: 840;
}

.status-block {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.status-block > div {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.status-block strong {
  overflow: hidden;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 860;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-block span {
  color: #6e6e73;
  font-size: 13px;
  line-height: 1.5;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px 24px;
}

.metric-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  min-height: 54px;
  opacity: 1;
  transition: opacity 0.12s ease;
}

.metric-item-hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.metric-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #5f6b7a;
  background: #f3f7fc;
  font-size: 17px;
}

.metric-item p {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 720;
}

.metric-item strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 860;
}


.audit-notice {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-top: 18px;
  border: 1px solid rgba(31, 111, 255, 0.12);
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f4f9ff, #ffffff);
}

.notice-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  color: #1f6fff;
  background: #eaf3ff;
  font-size: 18px;
}

.notice-content {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.notice-content strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 840;
}

.notice-content p {
  margin: 0;
  color: #5f6b7a;
  font-size: 13px;
  line-height: 1.6;
}
.filter-bar {
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(240px, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  border-top: 1px solid rgba(29, 29, 31, 0.06);
  border-bottom: 1px solid rgba(29, 29, 31, 0.06);
  padding: 14px 22px;
  background: #f8fbff;
}

.history-table {
  --el-table-header-bg-color: #1262ee;
  --el-table-header-text-color: #ffffff;
}

.history-table :deep(.el-table__header th) {
  font-weight: 820;
}

.history-table :deep(.el-table__row:hover > td) {
  background: #f3f8ff;
}

.history-table :deep(.el-button.is-link) {
  font-weight: 760;
}

.quarterly-heading :deep(.el-button),
.current-topline :deep(.el-button),
.current-footer :deep(.el-button),
.filter-bar :deep(.el-button) {
  min-height: 38px;
  border-radius: 10px;
  font-weight: 780;
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-bar {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .quarterly-heading,
  .current-topline,
  .section-header,
  .current-footer,
  .heading-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .role-context {
    justify-content: space-between;
  }

  .role-switcher,
  .heading-actions :deep(.el-button) {
    width: 100%;
  }

  .feature-dock-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }


  .role-switcher {
    display: flex;
    flex-wrap: wrap;
  }
.role-switch-button {
    flex: 1 1 120px;
  }
.audit-notice {
    grid-template-columns: 1fr;
  }

  .current-card {
    height: auto;
    min-height: 420px;
    padding: 20px;
  }

  .metric-grid,
  .filter-bar {
    grid-template-columns: 1fr;
  }
}

@keyframes quarterly-fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>















