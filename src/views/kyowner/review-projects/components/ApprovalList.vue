<script setup lang="ts">
import type { ReviewApproval } from '../types'

defineProps<{
  approvals: ReviewApproval[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [approval: ReviewApproval]
}>()
</script>

<template>
  <article class="approval-list-card">
    <header class="list-header">
      <h3>待审批评审列表</h3>
      <el-tag type="primary" effect="light" round>{{ approvals.length }}</el-tag>
    </header>

    <div v-if="approvals.length" class="approval-list">
      <button
        v-for="approval in approvals"
        :key="approval.id"
        type="button"
        class="approval-item"
        :class="{ active: selectedId === approval.id }"
        @click="emit('select', approval)"
      >
        <strong>{{ approval.reviewName }}</strong>
        <span>{{ approval.initiator }} · {{ approval.projects.length }} 个项目</span>
        <span>{{ approval.initiatedAt }}</span>
        <div>
          <el-tag type="warning" effect="light">待审批</el-tag>
          <em>查看</em>
        </div>
      </button>
    </div>

    <el-empty v-else description="暂无待审批的评审申请" :image-size="96" />
  </article>
</template>

<style scoped>
.approval-list-card {
  min-width: 0;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.list-header,
.approval-item div {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-header {
  margin-bottom: 12px;
}

.list-header h3 {
  margin: 0;
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 840;
}

.approval-list {
  display: grid;
  gap: 8px;
}

.approval-item {
  display: grid;
  gap: 7px;
  width: 100%;
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  border-radius: 10px;
  padding: 12px;
  background: #fbfdff;
  color: #1d1d1f;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.approval-item:hover,
.approval-item.active {
  border-color: rgba(10, 132, 255, 0.18);
  border-left-color: #0a84ff;
  background: #eef6ff;
}

.approval-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 820;
}

.approval-item span {
  color: #6e6e73;
  font-size: 12px;
}

.approval-item em {
  color: #0a84ff;
  font-size: 12px;
  font-style: normal;
  font-weight: 760;
}
</style>
