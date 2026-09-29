<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  Calendar,
  DataLine,
  DocumentAdd,
  DocumentChecked,
  Folder,
  FolderOpened,
  Plus,
  Promotion,
  VideoPlay,
  WarningFilled,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import type { LoggedInUser } from '../../types/auth'
import dashboardDataset from '../../dataset/dashboard.json'

interface DashboardMetric {
  key: string
  label: string
  value: number
  unit: string
  trend: string
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  icon: string
}

interface TodoItem {
  id: string
  level: string
  title: string
  businessType: string
  submitter: string
  dueTime: string
  status: string
  action: string
}

interface TodoTab {
  key: string
  label: string
  count: number
  items: TodoItem[]
}

interface ReviewProgress {
  name: string
  participants: number
  assignedExperts: number
  expertSubmitted: number
  waitingSubmit: number
  deadline: string
  items: Array<{
    label: string
    value: number
  }>
}

interface DashboardData {
  currentBatch: {
    name: string
    code: string
    period: string
  }
  metrics: DashboardMetric[]
  todoTabs: TodoTab[]
  reviewProgress: ReviewProgress
  stageDistribution: Array<{
    label: string
    value: number
  }>
  importantDates: Array<{
    date: string
    title: string
    status: string
  }>
  risks: Array<{
    id: string
    level: string
    title: string
    action: string
  }>
  projectTypeDistribution: Array<{
    name: string
    value: number
  }>
  facultyDirectionDistribution: Array<{
    name: string
    value: number
  }>
  announcements: Array<{
    id: string
    title: string
    scope: string
    time: string
    status: string
  }>
  commonActions: Array<{
    label: string
    route: string
    icon: string
  }>
}

const props = defineProps<{
  user: LoggedInUser | null
  roleName?: string
  roleEnglishName?: string
}>()

const router = useRouter()
const dashboardData = dashboardDataset as DashboardData
const activeTodoTab = shallowRef(dashboardData.todoTabs[0]?.key ?? '')
const projectTypeChartRef = useTemplateRef<HTMLDivElement>('projectTypeChartRef')
const facultyChartRef = useTemplateRef<HTMLDivElement>('facultyChartRef')

let projectTypeChart: echarts.ECharts | null = null
let facultyChart: echarts.ECharts | null = null

const currentDateLabel = computed(() => formatCurrentDate(new Date()))

const displayName = computed(() => props.user?.displayName ?? '科研管理员')

const displayInitial = computed(() => displayName.value.slice(0, 1))

const roleLabel = computed(() => props.roleName ?? '科研项目管理员')

const projectTypeTotal = computed(() =>
  dashboardData.projectTypeDistribution.reduce((total, item) => total + item.value, 0),
)

const quickActions = computed(() => [
  {
    label: '新建项目批次',
    route: '/research-project-admin/project-management',
    icon: Plus,
  },
  {
    label: '数据维护',
    route: '/research-project-admin/review-data-maintenance',
    icon: DocumentChecked,
  },
  {
    label: '发布通知',
    route: '/research-project-admin/announcement-publishing',
    icon: Promotion,
  },
])

const iconMap: Record<string, Component> = {
  Calendar,
  DataLine,
  DocumentAdd,
  DocumentChecked,
  Folder,
  FolderOpened,
  Promotion,
  VideoPlay,
  WarningFilled,
}

onMounted(async () => {
  await nextTick()
  renderCharts()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  projectTypeChart?.dispose()
  facultyChart?.dispose()
})

function navigateTo(route: string) {
  router.push(route)
}

function getIcon(iconName: string) {
  return iconMap[iconName] ?? DocumentChecked
}

function getTodoLevelType(level: string) {
  if (level === '紧急') {
    return 'danger'
  }

  if (level === '即将超时') {
    return 'warning'
  }

  return 'info'
}

function getStatusType(status: string) {
  if (['已处理', '已发布', '正常'].includes(status)) {
    return 'success'
  }

  if (['紧急', '待审核', '待发布'].includes(status)) {
    return 'danger'
  }

  if (['待配置', '待确认', '草稿'].includes(status)) {
    return 'warning'
  }

  return 'info'
}

function getRiskClass(level: string) {
  return {
    'risk-high': level === '高',
    'risk-medium': level === '中',
    'risk-low': level === '低',
  }
}

function renderCharts() {
  renderProjectTypeChart()
  renderFacultyChart()
}

function renderProjectTypeChart() {
  const chartElement = projectTypeChartRef.value

  if (!chartElement) {
    return
  }

  projectTypeChart = projectTypeChart ?? echarts.init(chartElement)
  projectTypeChart.setOption({
    color: ['#0a84ff', '#34c759', '#ffb020', '#6e56cf', '#8e8e93'],
    title: {
      text: `总计\n${projectTypeTotal.value}项`,
      left: 'center',
      top: '39%',
      textStyle: {
        color: '#1d1d1f',
        fontSize: 13,
        fontWeight: 760,
        lineHeight: 20,
      },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br />{c} 项 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 4,
      top: 'center',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: '#424245',
        fontSize: 12,
      },
    },
    series: [
      {
        name: '项目类型',
        type: 'pie',
        radius: ['54%', '76%'],
        center: ['31%', '52%'],
        avoidLabelOverlap: true,
        label: {
          show: false,
        },
        emphasis: {
          scaleSize: 4,
        },
        data: dashboardData.projectTypeDistribution,
      },
    ],
  })
}

function renderFacultyChart() {
  const chartElement = facultyChartRef.value

  if (!chartElement) {
    return
  }

  const facultyData = [...dashboardData.facultyDirectionDistribution].reverse()

  facultyChart = facultyChart ?? echarts.init(chartElement)
  facultyChart.setOption({
    color: ['#0a84ff'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}<br />{c} 项',
    },
    grid: {
      top: 8,
      right: 42,
      bottom: 18,
      left: 78,
    },
    xAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#eef2f7',
        },
      },
      axisLabel: {
        color: '#8a93a3',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'category',
      data: facultyData.map((item) => item.name),
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#424245',
        fontSize: 12,
      },
    },
    series: [
      {
        name: '项目数量',
        type: 'bar',
        data: facultyData.map((item) => item.value),
        barWidth: 10,
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
        },
        label: {
          show: true,
          position: 'right',
          color: '#6e6e73',
          fontSize: 11,
          formatter: '{c}',
        },
      },
    ],
  })
}

function resizeCharts() {
  projectTypeChart?.resize()
  facultyChart?.resize()
}

function formatCurrentDate(date: Date) {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}年${month}月${day}日 ${weekdays[date.getDay()]}`
}
</script>

<template>
  <section class="owner-dashboard-home" aria-label="科研项目管理员首页">
    <header class="welcome-panel">
      <div class="welcome-main">
        <div class="welcome-avatar">
          <img style="width: 60px;height:60px;border-radius: 30px;" src="../../dataset/img/zyh.png" alt="">
        </div>
        <div class="welcome-copy">
          <h2>您好，{{ displayName }}，欢迎进入科研管理OA系统</h2>
          <div class="welcome-meta">
            <span>当前角色：{{ roleLabel }}</span>
            <span>当前日期：{{ currentDateLabel }}</span>
            <span>当前批次：{{ dashboardData.currentBatch.name }}</span>
          </div>
          <p class="batch-period">{{ dashboardData.currentBatch.period }}</p>
        </div>
      </div>

      <div class="welcome-actions" aria-label="快捷操作">
        <el-button
          v-for="action in quickActions"
          :key="action.label"
          :icon="action.icon"
          type="primary"
          plain
          @click="navigateTo(action.route)"
        >
          {{ action.label }}
        </el-button>
      </div>
    </header>

    <section class="metric-grid" aria-label="首页关键指标">
      <article
        v-for="metric in dashboardData.metrics"
        :key="metric.key"
        class="metric-card"
        :class="`metric-${metric.tone}`"
      >
        <div>
          <p class="metric-label">{{ metric.label }}</p>
          <div class="metric-value-row">
            <strong>{{ metric.value }}</strong>
            <span>{{ metric.unit }}</span>
          </div>
          <p class="metric-trend">{{ metric.trend }}</p>
        </div>
        <span class="metric-icon">
          <el-icon><component :is="getIcon(metric.icon)" /></el-icon>
        </span>
      </article>
    </section>

    <section class="dashboard-grid dashboard-grid-top">
      <article class="home-panel todo-panel">
        <div class="panel-header">
          <h3>我的待办</h3>
          <button class="text-link" type="button">查看全部待办</button>
        </div>

        <el-tabs v-model="activeTodoTab" class="todo-tabs">
          <el-tab-pane
            v-for="tab in dashboardData.todoTabs"
            :key="tab.key"
            :name="tab.key"
            :label="`${tab.label} (${tab.count})`"
          >
            <el-table :data="tab.items" class="todo-table" height="238">
              <el-table-column label="待办事项" min-width="210">
                <template #default="{ row }">
                  <div class="todo-title-cell">
                    <el-tag :type="getTodoLevelType(row.level)" size="small" effect="light">
                      {{ row.level }}
                    </el-tag>
                    <span>{{ row.title }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="businessType" label="业务类型" width="96" />
              <el-table-column prop="submitter" label="提交人" width="82" />
              <el-table-column prop="dueTime" label="提交时间" width="104" />
              <el-table-column label="状态" width="88">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)" size="small" effect="light">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="82" fixed="right">
                <template #default="{ row }">
                  <button class="table-action" type="button">{{ row.action }}</button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </article>

      <article class="home-panel progress-panel">
        <div class="panel-header">
          <h3>当前评审进度</h3>
          <button class="text-link" type="button">查看详情</button>
        </div>

        <div class="review-title-row">
          <strong>{{ dashboardData.reviewProgress.name }}</strong>
          <span>评审截止：{{ dashboardData.reviewProgress.deadline }}</span>
        </div>

        <div class="review-summary-grid">
          <div>
            <span>参评项目</span>
            <strong>{{ dashboardData.reviewProgress.participants }}</strong>
          </div>
          <div>
            <span>已分配专家</span>
            <strong>{{ dashboardData.reviewProgress.assignedExperts }}</strong>
          </div>
          <div>
            <span>专家已提交</span>
            <strong>{{ dashboardData.reviewProgress.expertSubmitted }}</strong>
          </div>
          <div>
            <span>待提交</span>
            <strong>{{ dashboardData.reviewProgress.waitingSubmit }}</strong>
          </div>
        </div>

        <div class="progress-list">
          <div
            v-for="item in dashboardData.reviewProgress.items"
            :key="item.label"
            class="progress-item"
          >
            <span>{{ item.label }}</span>
            <el-progress
              :percentage="item.value"
              :stroke-width="8"
              :show-text="false"
              color="#0a84ff"
            />
            <strong>{{ item.value }}%</strong>
          </div>
        </div>

        <div class="progress-actions">
          <el-button plain :icon="Promotion">催办</el-button>
          <el-button plain :icon="DataLine">导出进度</el-button>
        </div>
      </article>
    </section>

    <section class="dashboard-grid dashboard-grid-middle">
      <article class="home-panel stage-panel">
        <div class="panel-header">
          <h3>项目阶段分布</h3>
          <button class="text-link" type="button">查看项目明细</button>
        </div>

        <div class="stage-flow">
          <div
            v-for="(stage, index) in dashboardData.stageDistribution"
            :key="stage.label"
            class="stage-node"
          >
            <div class="stage-block">
              <span>{{ stage.label }}</span>
              <strong>{{ stage.value }}</strong>
            </div>
            <span v-if="index < dashboardData.stageDistribution.length - 1" class="stage-arrow">
              →
            </span>
          </div>
        </div>
      </article>

      <article class="home-panel timeline-panel">
        <div class="panel-header">
          <h3>重要时间节点</h3>
          <button class="text-link" type="button">查看全部日程</button>
        </div>

        <div class="date-list">
          <div v-for="item in dashboardData.importantDates" :key="item.title" class="date-item">
            <span class="date-dot" :class="{ 'date-dot-urgent': item.status === '紧急' }"></span>
            <strong>{{ item.date }}</strong>
            <span>{{ item.title }}</span>
            <el-tag :type="getStatusType(item.status)" size="small" effect="light">
              {{ item.status }}
            </el-tag>
          </div>
        </div>
      </article>
    </section>

    <section class="dashboard-grid dashboard-grid-bottom">
      <article class="home-panel risk-panel">
        <div class="panel-header">
          <h3>异常与风险提醒</h3>
          <button class="text-link" type="button">查看全部提醒</button>
        </div>

        <div class="risk-list">
          <div
            v-for="risk in dashboardData.risks"
            :key="risk.id"
            class="risk-item"
            :class="getRiskClass(risk.level)"
          >
            <span>{{ risk.level }}</span>
            <p>{{ risk.title }}</p>
            <button class="table-action" type="button">{{ risk.action }}</button>
          </div>
        </div>
      </article>

      <article class="home-panel chart-panel">
        <div class="panel-header">
          <h3>项目类型分布</h3>
        </div>
        <div ref="projectTypeChartRef" class="chart chart-donut" aria-label="项目类型分布图"></div>
      </article>

      <article class="home-panel chart-panel wide-chart-panel">
        <div class="panel-header">
          <h3>学部/子方向分布</h3>
        </div>
        <div ref="facultyChartRef" class="chart chart-bar" aria-label="学部子方向分布图"></div>
      </article>
    </section>

    <section class="dashboard-grid dashboard-grid-footer">
      <article class="home-panel announcement-panel">
        <div class="panel-header">
          <h3>通知公告</h3>
          <button class="text-link" type="button" @click="navigateTo('/research-project-admin/announcement-publishing')">
            发布通知
          </button>
        </div>

        <div class="announcement-list">
          <div
            v-for="notice in dashboardData.announcements"
            :key="notice.id"
            class="announcement-item"
          >
            <div>
              <strong>{{ notice.title }}</strong>
              <span>{{ notice.scope }} · {{ notice.time }}</span>
            </div>
            <el-tag :type="getStatusType(notice.status)" size="small" effect="light">
              {{ notice.status }}
            </el-tag>
          </div>
        </div>
      </article>

      <article class="home-panel common-panel">
        <div class="panel-header">
          <h3>常用功能</h3>
        </div>

        <div class="common-action-grid">
          <button
            v-for="action in dashboardData.commonActions"
            :key="action.label"
            class="common-action"
            type="button"
            @click="navigateTo(action.route)"
          >
            <span>
              <el-icon><component :is="getIcon(action.icon)" /></el-icon>
            </span>
            {{ action.label }}
          </button>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.owner-dashboard-home {
  display: grid;
  gap: 14px;
  color: #1d1d1f;
}

.welcome-panel,
.metric-card,
.home-panel {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.welcome-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px;
}

.welcome-main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.welcome-avatar {
  width: 58px;
  height: 58px;
  border-radius: 30px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  /* background: linear-gradient(145deg, #b8dcff, #0a84ff 68%, #006edb); */
  box-shadow: 0 12px 26px rgba(0, 113, 227, 0.2);
  font-size: 24px;
  font-weight: 800;
}

.welcome-copy {
  min-width: 0;
}

.welcome-copy h2,
.welcome-meta,
.batch-period,
.metric-label,
.metric-trend,
.panel-header h3,
.risk-item p {
  margin: 0;
}

.welcome-copy h2 {
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0;
}

.welcome-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 8px;
  color: #424245;
  font-size: 13px;
  font-weight: 680;
}

.batch-period {
  margin-top: 7px;
  color: #86868b;
  font-size: 12px;
}

.welcome-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.welcome-actions :deep(.el-button) {
  height: 38px;
  border-radius: 8px;
  font-weight: 760;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 12px;
}

.metric-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  overflow: hidden;
}

.metric-label {
  color: #424245;
  font-size: 13px;
  font-weight: 760;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 8px;
}

.metric-value-row strong {
  color: #1d1d1f;
  font-size: 30px;
  line-height: 1;
  font-weight: 820;
}

.metric-value-row span,
.metric-trend {
  color: #86868b;
  font-size: 12px;
  font-weight: 700;
}

.metric-trend {
  margin-top: 8px;
}

.metric-icon {
  width: 52px;
  height: 52px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  font-size: 24px;
}

.metric-blue .metric-icon {
  color: #0a84ff;
  background: #e8f3ff;
}

.metric-green .metric-icon {
  color: #1f9d55;
  background: #e9f8ef;
}

.metric-orange .metric-icon {
  color: #ff9f0a;
  background: #fff4dc;
}

.metric-red .metric-icon {
  color: #ff3b30;
  background: #fff0ef;
}

.metric-purple .metric-icon {
  color: #6e56cf;
  background: #f1edff;
}

.metric-blue .metric-trend,
.metric-green .metric-trend {
  color: #0a84ff;
}

.metric-orange .metric-trend,
.metric-red .metric-trend {
  color: #ff3b30;
}

.dashboard-grid {
  display: grid;
  gap: 12px;
}

.dashboard-grid-top {
  grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
}

.dashboard-grid-middle {
  grid-template-columns: minmax(0, 1.05fr) minmax(420px, 0.95fr);
}

.dashboard-grid-bottom {
  grid-template-columns: minmax(300px, 0.9fr) minmax(300px, 0.8fr) minmax(360px, 1fr);
}

.dashboard-grid-footer {
  grid-template-columns: minmax(0, 1fr) minmax(340px, 0.7fr);
}

.home-panel {
  min-width: 0;
  padding: 14px 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 30px;
}

.panel-header h3 {
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 800;
}

.text-link,
.table-action {
  border: 0;
  color: #0a84ff;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 760;
}

.text-link:hover,
.table-action:hover {
  color: #006edb;
}

.todo-tabs {
  margin-top: 4px;
}

.todo-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.todo-tabs :deep(.el-tabs__item) {
  height: 34px;
  color: #6e6e73;
  font-size: 13px;
  font-weight: 760;
}

.todo-tabs :deep(.el-tabs__item.is-active) {
  color: #0a84ff;
}

.todo-tabs :deep(.el-tabs__active-bar) {
  background: #0a84ff;
}

.todo-table {
  --el-table-border-color: rgba(29, 29, 31, 0.06);
  --el-table-header-bg-color: #f8fbff;
  border-radius: 8px;
  overflow: hidden;
}

.todo-table :deep(.el-table__header th) {
  color: #424245;
  font-size: 12px;
  font-weight: 780;
}

.todo-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.todo-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.todo-title-cell span:last-child {
  overflow: hidden;
  color: #1d1d1f;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.review-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.review-title-row strong {
  color: #1d1d1f;
  font-size: 15px;
}

.review-title-row span {
  color: #ff3b30;
  font-size: 12px;
  font-weight: 760;
}

.review-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.review-summary-grid div {
  display: grid;
  gap: 4px;
  border-radius: 8px;
  padding: 10px;
  background: #f8fbff;
}

.review-summary-grid span {
  color: #86868b;
  font-size: 12px;
}

.review-summary-grid strong {
  color: #0a84ff;
  font-size: 22px;
  line-height: 1;
}

.progress-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.progress-item {
  display: grid;
  grid-template-columns: 98px minmax(0, 1fr) 46px;
  align-items: center;
  gap: 10px;
}

.progress-item span,
.progress-item strong {
  color: #424245;
  font-size: 12px;
  font-weight: 760;
}

.progress-item strong {
  text-align: right;
}

.progress-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 14px;
}

.progress-actions :deep(.el-button) {
  height: 34px;
  min-width: 100px;
  border-radius: 8px;
  font-weight: 760;
}

.stage-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.stage-node {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18px;
  align-items: center;
  min-width: 0;
}

.stage-node:last-child {
  grid-template-columns: minmax(0, 1fr);
}

.stage-block {
  display: grid;
  place-items: center;
  min-height: 70px;
  border-radius: 8px;
  color: #0a62cf;
  background: linear-gradient(135deg, #eef6ff, #dcecff);
}

.stage-block span {
  font-size: 12px;
  font-weight: 760;
}

.stage-block strong {
  margin-top: 2px;
  font-size: 24px;
  line-height: 1;
}

.stage-arrow {
  color: #9eb6d5;
  text-align: center;
  font-weight: 800;
}

.date-list,
.risk-list,
.announcement-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.date-item {
  display: grid;
  grid-template-columns: 10px 74px minmax(0, 1fr) 52px;
  align-items: center;
  gap: 10px;
  min-height: 30px;
}

.date-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #34c759;
}

.date-dot-urgent {
  background: #ff9f0a;
}

.date-item strong {
  color: #1d1d1f;
  font-size: 13px;
}

.date-item span:nth-child(3) {
  overflow: hidden;
  color: #424245;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.risk-item {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 70px;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.risk-item > span {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.risk-high > span {
  background: #ff3b30;
}

.risk-medium > span {
  background: #ff9f0a;
}

.risk-low > span {
  background: #0a84ff;
}

.risk-item p {
  overflow: hidden;
  color: #424245;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.chart {
  width: 100%;
  height: 222px;
}

.chart-bar {
  height: 218px;
}

.announcement-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.06);
}

.announcement-item:last-child {
  border-bottom: 0;
}

.announcement-item div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.announcement-item strong {
  overflow: hidden;
  color: #1d1d1f;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.announcement-item span {
  color: #86868b;
  font-size: 12px;
}

.common-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.common-action {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  border: 1px solid rgba(0, 113, 227, 0.1);
  border-radius: 8px;
  padding: 0 12px;
  color: #1d1d1f;
  background: #f8fbff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 760;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.common-action span {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #0a84ff;
  background: #e8f3ff;
}

.common-action:hover {
  border-color: rgba(10, 132, 255, 0.22);
  color: #006edb;
  background: #eef6ff;
  transform: translateY(-1px);
}

@media (max-width: 1440px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(180px, 1fr));
  }

  .dashboard-grid-top,
  .dashboard-grid-middle,
  .dashboard-grid-bottom,
  .dashboard-grid-footer {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .welcome-panel,
  .welcome-main,
  .review-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .welcome-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .metric-grid,
  .review-summary-grid,
  .stage-flow,
  .common-action-grid {
    grid-template-columns: 1fr;
  }

  .stage-node,
  .stage-node:last-child {
    grid-template-columns: 1fr;
  }

  .stage-arrow {
    display: none;
  }

  .date-item {
    grid-template-columns: 10px 68px minmax(0, 1fr);
  }

  .date-item :deep(.el-tag) {
    grid-column: 3;
    width: fit-content;
  }
}
</style>
