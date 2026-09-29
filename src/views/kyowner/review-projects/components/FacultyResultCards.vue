<script setup lang="ts">
import { CircleCheckFilled } from '@element-plus/icons-vue'
import type { FacultyReviewResult } from '../types'

defineProps<{
  results: FacultyReviewResult[]
  activeFaculty: string
}>()

const emit = defineEmits<{
  select: [faculty: string]
}>()
</script>

<template>
  <section class="faculty-result-cards" aria-label="学部评审完成情况">
    <button
      v-for="result in results"
      :key="result.faculty"
      type="button"
      class="faculty-card"
      :class="{ active: activeFaculty === result.faculty }"
      @click="emit('select', result.faculty)"
    >
      <span class="faculty-icon">
        <el-icon><CircleCheckFilled /></el-icon>
      </span>
      <span class="faculty-info">
        <strong>{{ result.faculty }}</strong>
        <em>{{ result.status }}</em>
      </span>
      <span class="submitted-time">提交时间：{{ result.submittedAt }}</span>
    </button>
  </section>
</template>

<style scoped>
.faculty-result-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.faculty-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-height: 92px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
  color: #1d1d1f;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.faculty-card:hover,
.faculty-card.active {
  border-color: rgba(10, 132, 255, 0.42);
  background: #eef6ff;
  transform: translateY(-1px);
}

.faculty-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #1fbd72;
  background: #e9f8ef;
  font-size: 22px;
}

.faculty-info {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.faculty-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 840;
}

.faculty-info em {
  color: #1fbd72;
  font-size: 13px;
  font-style: normal;
  font-weight: 760;
}

.submitted-time {
  grid-column: 2;
  color: #6e6e73;
  font-size: 12px;
}

@media (max-width: 1180px) {
  .faculty-result-cards {
    grid-template-columns: 1fr;
  }
}
</style>
