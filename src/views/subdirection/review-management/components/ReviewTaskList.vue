<script setup lang="ts">
import type { SubdirectionReviewTask } from '../types'

defineProps<{
  tasks: SubdirectionReviewTask[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [task: SubdirectionReviewTask]
}>()

function statusType(status: SubdirectionReviewTask['status']) {
  return status === '进行中' ? 'success' : 'warning'
}
</script>

<template>
  <article class="task-list-card">
    <header class="task-list-header">
      <div>
        <h3>已通过评审列表</h3>
        <p>请选择评审查看或完善评审信息</p>
      </div>
      <el-tag effect="light" round>{{ tasks.length }}</el-tag>
    </header>

    <div v-if="tasks.length" class="task-list">
      <button
        v-for="task in tasks"
        :key="task.id"
        type="button"
        class="task-item"
        :class="{ active: selectedId === task.id }"
        @click="emit('select', task)"
      >
        <span class="task-title-row">
          <strong>{{ task.reviewName }}</strong>
          <el-tag :type="statusType(task.status)" effect="light" round>{{ task.status }}</el-tag>
        </span>
        <span>发起人：{{ task.initiator }}</span>
        <span>参评项目：{{ task.projects.length }} 个</span>
        <span>通过时间：{{ task.approvedAt }}</span>
      </button>
    </div>

    <el-empty v-else description="暂无已通过评审任务" :image-size="96" />
  </article>
</template>

<style scoped>
.task-list-card {
  min-width: 0;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.task-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.task-list-header h3,
.task-list-header p {
  margin: 0;
}

.task-list-header h3 {
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 840;
}

.task-list-header p {
  margin-top: 5px;
  color: #86868b;
  font-size: 12px;
}

.task-list {
  display: grid;
  gap: 10px;
}

.task-item {
  display: grid;
  gap: 8px;
  width: 100%;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-left: 3px solid transparent;
  border-radius: 10px;
  padding: 12px;
  background: #fbfdff;
  color: #424245;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.task-item:hover,
.task-item.active {
  border-color: rgba(10, 132, 255, 0.22);
  border-left-color: #0a84ff;
  background: #eef6ff;
  transform: translateY(-1px);
}

.task-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.task-title-row strong {
  min-width: 0;
  overflow: hidden;
  color: #1d1d1f;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 840;
}

.task-item > span:not(.task-title-row) {
  color: #6e6e73;
  font-size: 12px;
}
</style>
