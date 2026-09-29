<script setup lang="ts">
import type { BudgetAdjustmentRecord } from '../../dataset/researchFinanceMock'
import { formatCurrency } from './financeFormat'

withDefaults(
  defineProps<{
    rows: BudgetAdjustmentRecord[]
    showProject?: boolean
    showOperations?: boolean
  }>(),
  {
    showProject: false,
    showOperations: false,
  },
)

const emit = defineEmits<{
  view: [row: BudgetAdjustmentRecord]
  diff: [row: BudgetAdjustmentRecord]
}>()

function getStatusType(status: string) {
  if (status === '已通过') {
    return 'success'
  }

  if (status === '已驳回') {
    return 'danger'
  }

  return 'warning'
}

function getSyncType(status: string) {
  if (status === '已同步') {
    return 'success'
  }

  if (status === '同步失败') {
    return 'danger'
  }

  return 'info'
}
</script>

<template>
  <el-table class="finance-detail-table" :data="rows" row-key="id" border empty-text="暂无预算调整记录">
    <el-table-column prop="adjustmentNo" label="调整单号" width="150" fixed="left" />
    <el-table-column prop="version" label="调整版本" width="92" align="center" />
    <el-table-column v-if="showProject" label="项目" min-width="240" show-overflow-tooltip>
      <template #default="{ row }">
        <div class="adjust-project-cell">
          <strong>{{ row.projectName }}</strong>
          <span>{{ row.projectCode }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="subject" label="调整科目" min-width="160" />
    <el-table-column label="调整前金额" width="126" align="right">
      <template #default="{ row }">{{ formatCurrency(row.beforeAmount) }}</template>
    </el-table-column>
    <el-table-column label="调整后金额" width="126" align="right">
      <template #default="{ row }">{{ formatCurrency(row.afterAmount) }}</template>
    </el-table-column>
    <el-table-column label="调整金额" width="116" align="right">
      <template #default="{ row }">{{ formatCurrency(row.adjustmentAmount) }}</template>
    </el-table-column>
    <el-table-column prop="reason" label="调整原因" min-width="220" show-overflow-tooltip />
    <el-table-column prop="applicant" label="申请人" width="96" />
    <el-table-column prop="applyTime" label="申请时间" width="150" />
    <el-table-column label="审批状态" width="104">
      <template #default="{ row }">
        <el-tag size="small" effect="light" :type="getStatusType(row.status)">{{ row.status }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="用友同步" width="104">
      <template #default="{ row }">
        <el-tag size="small" effect="light" :type="getSyncType(row.yonyouSyncStatus)">
          {{ row.yonyouSyncStatus }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="syncTime" label="同步时间" width="150" />
    <el-table-column v-if="showOperations" label="操作" width="168" fixed="right" align="center">
      <template #default="{ row }">
        <el-button type="primary" link @click="emit('view', row)">查看详情</el-button>
        <el-divider direction="vertical" />
        <el-button type="primary" link @click="emit('diff', row)">查看差异</el-button>
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

.adjust-project-cell {
  display: grid;
  gap: 2px;
}

.adjust-project-cell strong {
  overflow: hidden;
  color: #152b4f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adjust-project-cell span {
  color: #91a0b6;
  font-size: 12px;
}
</style>
