<script setup lang="ts">
import type { PublishMode, ScopeGroupMode } from './types'

defineProps<{
  mode: PublishMode
  scopeMode?: ScopeGroupMode
  facultyCount: number
  projectTypeCount?: number
  projectCount: number
  receiverCount: number
}>()
</script>

<template>
  <section class="publish-summary" aria-label="发布摘要">
    <div class="summary-title">
      <span>发布摘要</span>
    </div>
    <div class="summary-grid">
      <div>
        <span>发布方式</span>
        <strong>{{ mode === 'unified' ? '统一发布' : '独立发布' }}</strong>
      </div>
      <div>
        <span>
          {{ scopeMode === 'projectType' ? (mode === 'unified' ? '项目类型' : '已选类型') : (mode === 'unified' ? '学部数量' : '已选学部') }}
        </span>
        <strong>{{ scopeMode === 'projectType' ? projectTypeCount ?? 0 : facultyCount }}</strong>
      </div>
      <div>
        <span>{{ mode === 'unified' ? '项目数量' : '已选项目' }}</span>
        <strong>{{ projectCount }}</strong>
      </div>
      <div>
        <span>接收人数</span>
        <strong>{{ receiverCount }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.publish-summary {
  overflow: hidden;
  border: 1px solid rgba(0, 113, 227, 0.12);
  border-radius: 10px;
  background: #f8fbff;
}

.summary-title {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 113, 227, 0.1);
  color: #0a84ff;
  font-size: 14px;
  font-weight: 820;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-grid div {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  text-align: center;
}

.summary-grid div + div {
  border-left: 1px solid rgba(29, 29, 31, 0.08);
}

.summary-grid span {
  color: #86868b;
  font-size: 12px;
  font-weight: 760;
}

.summary-grid strong {
  color: #0a84ff;
  font-size: 20px;
  line-height: 1;
}

@media (max-width: 760px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
