<script setup lang="ts">
import { shallowRef } from 'vue'
import { syncStatusLabels, type FinanceSyncRecord } from '../../dataset/researchFinanceMock'
import { getSyncTagType } from './financeFormat'

defineProps<{
  rows: FinanceSyncRecord[]
}>()

const emit = defineEmits<{
  retry: [row: FinanceSyncRecord]
}>()

const retryingIds = shallowRef<string[]>([])

function getSyncStatusLabel(row: FinanceSyncRecord) {
  return syncStatusLabels[row.status]
}

function retry(row: FinanceSyncRecord) {
  if (retryingIds.value.includes(row.id)) {
    return
  }

  retryingIds.value = [...retryingIds.value, row.id]
  emit('retry', row)

  window.setTimeout(() => {
    retryingIds.value = retryingIds.value.filter((id) => id !== row.id)
  }, 1200)
}

function isRetrying(row: FinanceSyncRecord) {
  return retryingIds.value.includes(row.id)
}
</script>

<template>
  <el-table class="finance-detail-table" :data="rows" row-key="id" border empty-text="暂无数据同步记录">
    <el-table-column prop="syncBatchNo" label="同步批次号" width="150" fixed="left" />
    <el-table-column prop="dataType" label="数据类型" min-width="170" show-overflow-tooltip />
    <el-table-column prop="direction" label="数据方向" width="142">
      <template #default="{ row }">
        <el-tag size="small" effect="plain" :type="row.direction.includes('用友 →') ? 'success' : 'info'">
          {{ row.direction }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="projectCode" label="项目编号" width="120" />
    <el-table-column prop="startedAt" label="发起时间" width="150" />
    <el-table-column prop="completedAt" label="完成时间" width="150">
      <template #default="{ row }">{{ row.completedAt ?? '-' }}</template>
    </el-table-column>
    <el-table-column label="同步状态" width="108">
      <template #default="{ row }">
        <el-tag size="small" effect="light" :type="getSyncTagType(row.status)">
          {{ getSyncStatusLabel(row) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="dataCount" label="数据条数" width="100" align="right" />
    <el-table-column prop="retryCount" label="重试次数" width="100" align="right" />
    <el-table-column prop="errorMessage" label="错误信息" min-width="260" show-overflow-tooltip>
      <template #default="{ row }">{{ row.errorMessage || '-' }}</template>
    </el-table-column>
    <el-table-column label="操作" width="112" fixed="right" align="center">
      <template #default="{ row }">
        <el-button
          v-if="row.status === 'FAILED'"
          type="primary"
          link
          :loading="isRetrying(row)"
          :disabled="isRetrying(row)"
          @click="retry(row)"
        >
          重试
        </el-button>
        <span v-else class="muted-action">—</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
.finance-detail-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
  --el-table-row-hover-bg-color: #f5f8fd;
}

.finance-detail-table :deep(.el-table__cell) {
  padding: 9px 0;
}

.muted-action {
  color: #a8b3c4;
}
</style>
