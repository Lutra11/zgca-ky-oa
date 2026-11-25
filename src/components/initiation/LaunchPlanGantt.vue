<template>
  <section class="launch-plan-section" aria-label="进度计划">
    <header class="launch-plan-header">
      <div>
        <h3>进度计划</h3>
      </div>
      <div class="launch-plan-view-switch">
        <button
          type="button"
          class="launch-plan-view-tab"
          :class="{ active: viewMode === 'gantt' }"
          @click="viewMode = 'gantt'"
        >
          甘特视图
        </button>
        <button
          type="button"
          class="launch-plan-view-tab"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          列表视图
        </button>
      </div>
    </header>

    <div v-show="viewMode === 'gantt'" ref="ganttMountRef" class="launch-gantt-mount"></div>

    <ul v-if="viewMode === 'list'" class="launch-plan-list">
      <li v-for="task in planTasks" :key="task.id" class="launch-plan-list-row">
        <span class="launch-plan-list-index">{{ task.index }}</span>
        <span class="launch-plan-list-name">{{ task.text }}</span>
        <span class="launch-plan-list-date">{{ task.dateLabel }}</span>
        <span v-if="task.isDdl" class="launch-plan-list-tag">DDL</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'

type PlanViewMode = 'gantt' | 'list'

const viewMode = shallowRef<PlanViewMode>('gantt')
const ganttMountRef = shallowRef<HTMLElement>()

interface PlanTask {
  id: number
  index: string
  text: string
  start: string
  end: string
  dateLabel: string
  isDdl: boolean
  duration: number
}

/** 2026-11 / 2027-01 示例进度计划 */
const planTasks: PlanTask[] = [
  { id: 1, index: '①', text: '项目申报', start: '2026-11-24', end: '2026-11-30', dateLabel: 'DDL 11.30', isDdl: true, duration: 7 },
  { id: 2, index: '②', text: '形式审查', start: '2026-12-01', end: '2026-12-03', dateLabel: '12.01–03', isDdl: false, duration: 3 },
  { id: 3, index: '③', text: '评审组织', start: '2026-12-04', end: '2026-12-06', dateLabel: '12.04–06', isDdl: false, duration: 3 },
  { id: 4, index: '④', text: '学部初审', start: '2026-12-07', end: '2026-12-13', dateLabel: 'DDL 12.13', isDdl: true, duration: 7 },
  { id: 5, index: '⑤', text: '学部会议', start: '2026-12-14', end: '2026-12-19', dateLabel: '12.14–19', isDdl: false, duration: 6 },
  { id: 6, index: '⑥', text: '项目修改', start: '2026-12-17', end: '2026-12-24', dateLabel: 'DDL 12.24', isDdl: true, duration: 8 },
  { id: 7, index: '⑦', text: '院内复审', start: '2026-12-20', end: '2026-12-26', dateLabel: 'DDL 12.26', isDdl: true, duration: 7 },
  { id: 8, index: '⑧', text: '立项入库', start: '2026-12-20', end: '2026-12-26', dateLabel: '12.26', isDdl: false, duration: 7 },
]

let ganttReady = false

function initGantt() {
  if (ganttReady || !ganttMountRef.value) {
    return
  }

  gantt.config.date_scale = '%Y年%m月'
  gantt.config.scale_unit = 'month'
  gantt.config.subscales = [{ unit: 'week', step: 1, date: '%W周' }]
  gantt.config.readonly = true
  gantt.config.row_height = 30
  gantt.config.bar_height = 16
  gantt.config.scale_height = 40
  gantt.config.min_column_width = 30
  gantt.config.show_progress = false
  gantt.config.show_ticks = false
  gantt.config.xml_date = '%Y-%m-%d'

  // 条形文案: 不显示内部文字 (节点名已在左列)
  gantt.templates.task_text = () => ''

  // 自定义悬浮提示
  gantt.templates.tooltip_date_format = (date: Date) =>
    `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`
  gantt.templates.tooltip_text = (_start: Date, _end: Date, task: Record<string, unknown>) =>
    `<b>${String(task.text ?? '')}</b><br/>${String(task.dateLabel ?? '')}`

  // 每个节点分配独立色系 (bar-1 ~ bar-8)
  gantt.templates.task_class = (_start: Date, _end: Date, task: Record<string, unknown>) =>
    `launch-gantt-bar bar-${String(task.id)}`

  // 行斑马纹去掉, 用分隔线
  gantt.templates.task_row_class = () => 'launch-gantt-row'
  gantt.config.show_grid = true
  gantt.config.columns = [
    { name: 'text', label: '节点', width: 120, align: 'left' },
    { name: 'dateLabel', label: '时间', width: 96, align: 'left' },
  ]

  gantt.init(ganttMountRef.value)
  gantt.parse({
    data: planTasks.map((task) => ({
      id: task.id,
      text: `${task.index} ${task.text}`,
      dateLabel: task.dateLabel,
      start_date: new Date(task.start),
      duration: task.duration,
      progress: 0,
    })),
    links: [],
  })

  ganttReady = true
}

onMounted(() => {
  initGantt()
})

onBeforeUnmount(() => {
  if (ganttReady) {
    gantt.clearAll()
  }
})

watch(viewMode, () => {
  if (viewMode.value === 'gantt') {
    initGantt()
  }
})
</script>

<style scoped>
.launch-plan-section {
  margin-top: 24px;
  padding: 18px 20px;
  border: 1px solid #e4e9f2;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(31, 45, 61, 0.05);
}

.launch-plan-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.launch-plan-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.launch-plan-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #8492a6;
}

.launch-plan-view-switch {
  display: inline-flex;
  padding: 3px;
  border-radius: 8px;
  background: #edf1f7;
  gap: 2px;
}

.launch-plan-view-tab {
  border: 0;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  color: #5d6b7f;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.launch-plan-view-tab.active {
  color: #fff;
  background: #3d5a80;
  font-weight: 600;
}

.launch-gantt-mount {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 296px;
  border: 1px solid #e4e9f2;
  border-radius: 8px;
  overflow: hidden;
}

/* ===== 甘特图美化（覆盖 dhtmlx 默认皮肤） ===== */
.launch-gantt-mount :deep(.gantt_container) {
  background: #fbfcfe;
}

/* 网格与时间轴统一底色 */
.launch-gantt-mount :deep(.gantt_grid) {
  background: #fff;
}

/* 列头: 淡蓝底、细字 */
.launch-gantt-mount :deep(.gantt_scale_line) {
  background: #f4f7fb;
  border-bottom: 1px solid #e4e9f2;
  color: #7a8699;
  font-size: 12px;
}

/* 主刻度(月)与副刻度(周)层次 */
.launch-gantt-mount :deep(.gantt_scale_line:first-child) {
  font-weight: 600;
  color: #3d5a80;
}

/* 时间轴行: 去斑马纹, 用极细分隔线 */
.launch-gantt-mount :deep(.gantt_task_row),
.launch-gantt-mount :deep(.gantt_row) {
  border-bottom: 1px solid #f0f3f8;
  background: transparent;
}

.launch-gantt-mount :deep(.gantt_row:hover),
.launch-gantt-mount :deep(.gantt_task_row:hover) {
  background: #f4f8fd;
}

/* 网格数据行文字 */
.launch-gantt-mount :deep(.gantt_cell) {
  color: #34435c;
  font-size: 12px;
  border-bottom: 1px solid #f0f3f8;
  border-right: 1px solid #f0f3f8;
}

/* 周格线更轻 */
.launch-gantt-mount :deep(.gantt_task_bg .gantt_cell) {
  border-right: 1px solid #f4f6fa;
}



/* 隐藏默认进度块与端点手柄 */
.launch-gantt-mount :deep(.gantt_task_progress),
.launch-gantt-mount :deep(.gantt_task_progress_drag) {
  display: none;
}

/* 任务条: 圆角渐变 + 柔和阴影, 8 个节点各一色 */
.launch-gantt-mount :deep(.launch-gantt-bar .gantt_task_content) {
  border-radius: 0px;
  border: none;
}

/* ① 项目申报 - 靛蓝 */
.launch-gantt-mount :deep(.bar-1 .gantt_task_content) {
  background: linear-gradient(135deg, #6a89cc 0%, #4665a3 100%);
}

/* ② 形式审查 - 青碧 */
.launch-gantt-mount :deep(.bar-2 .gantt_task_content) {
  background: linear-gradient(135deg, #4fb3a9 0%, #2e8c84 100%);
}

/* ③ 评审组织 - 天蓝 */
.launch-gantt-mount :deep(.bar-3 .gantt_task_content) {
  background: linear-gradient(135deg, #5ba8d6 0%, #3a7ca5 100%);
}

/* ④ 学部初审 - 紫罗兰 */
.launch-gantt-mount :deep(.bar-4 .gantt_task_content) {
  background: linear-gradient(135deg, #9d8bd0 0%, #7363b3 100%);
}

/* ⑤ 学部会议 - 草绿 */
.launch-gantt-mount :deep(.bar-5 .gantt_task_content) {
  background: linear-gradient(135deg, #7fc07f 0%, #549b54 100%);
}

/* ⑥ 项目修改 - 琥珀 */
.launch-gantt-mount :deep(.bar-6 .gantt_task_content) {
  background: linear-gradient(135deg, #f0a662 0%, #d9832e 100%);
}

/* ⑦ 院内复审 - 珊瑚红 */
.launch-gantt-mount :deep(.bar-7 .gantt_task_content) {
  background: linear-gradient(135deg, #f08e8e 0%, #d96060 100%);
}

/* ⑧ 立项入库 - 深蓝(终态) */
.launch-gantt-mount :deep(.bar-8 .gantt_task_content) {
  background: linear-gradient(135deg, #3d5a80 0%, #2a3f5c 100%);
}

/* 悬浮提示样式 */
.launch-gantt-mount :deep(.gantt_tooltip) {
  padding: 8px 12px !important;
  border-radius: 8px !important;
  border: 1px solid #e4e9f2 !important;
  box-shadow: 0 6px 18px rgba(31, 45, 61, 0.14) !important;
  font-size: 12px !important;
  color: #34435c !important;
  background: #fff !important;
}

.launch-plan-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid #e4e9f2;
  border-radius: 8px;
  overflow: hidden;
}

.launch-plan-list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  font-size: 13px;
  color: #1f2d3d;
}

.launch-plan-list-row + .launch-plan-list-row {
  border-top: 1px solid #edf1f7;
}

.launch-plan-list-index {
  width: 22px;
  color: #3d5a80;
  font-weight: 600;
}

.launch-plan-list-name {
  flex: 1;
}

.launch-plan-list-date {
  color: #5d6b7f;
}

.launch-plan-list-tag {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #c0392b;
  background: #fdecea;
  font-weight: 600;
}
</style>
