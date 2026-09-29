<script setup lang="ts">
import type { BudgetSubject } from '../../dataset/researchFinanceMock'
import { formatCurrency, formatPercent, toProgressPercent } from './financeFormat'

defineProps<{
  subjects: BudgetSubject[]
}>()

function rowClassName({ row }: { row: BudgetSubject }) {
  return row.level === 1 ? 'primary-budget-row' : 'secondary-budget-row'
}
</script>

<template>
  <el-table
    class="finance-detail-table budget-execution-table"
    :data="subjects"
    row-key="id"
    border
    :row-class-name="rowClassName"
    empty-text="暂无预算科目数据"
  >
    <el-table-column label="一级科目" min-width="136">
      <template #default="{ row }">
        <strong v-if="row.level === 1">{{ row.name }}</strong>
        <span v-else class="secondary-placeholder">—</span>
      </template>
    </el-table-column>
    <el-table-column label="二级科目" min-width="190" show-overflow-tooltip>
      <template #default="{ row }">
        <span :class="{ 'secondary-name': row.level === 2 }">
          {{ row.level === 1 ? '一级科目合计' : row.name }}
        </span>
      </template>
    </el-table-column>
    <el-table-column label="经费性质" width="96" align="center">
      <template #default="{ row }">{{ row.fundNature === 'DIRECT' ? '直接经费' : '间接经费' }}</template>
    </el-table-column>
    <el-table-column label="预算金额" width="132" align="right">
      <template #default="{ row }">{{ formatCurrency(row.budgetAmount) }}</template>
    </el-table-column>
    <el-table-column label="已付款" width="120" align="right">
      <template #default="{ row }">{{ formatCurrency(row.paidAmount) }}</template>
    </el-table-column>
    <el-table-column label="应付未付" width="120" align="right">
      <template #default="{ row }">{{ formatCurrency(row.unpaidPayableAmount) }}</template>
    </el-table-column>
    <el-table-column label="预算占用" width="120" align="right">
      <template #default="{ row }">{{ formatCurrency(row.occupiedAmount) }}</template>
    </el-table-column>
    <el-table-column label="可用余额" width="120" align="right">
      <template #default="{ row }">{{ formatCurrency(row.availableAmount) }}</template>
    </el-table-column>
    <el-table-column label="科目预算占用率" width="174">
      <template #default="{ row }">
        <div class="rate-cell">
          <el-progress
            :percentage="toProgressPercent(row.occupancyRate)"
            :stroke-width="6"
            :show-text="false"
            :color="row.occupancyRate > 0.9 ? '#e5484d' : '#3478e5'"
          />
          <span>{{ formatPercent(row.occupancyRate) }}</span>
        </div>
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

.budget-execution-table :deep(.primary-budget-row) {
  font-weight: 700;
  background: #fbfdff;
}

.secondary-name {
  padding-left: 12px;
  color: #526177;
}

.secondary-placeholder {
  color: #c5cfdd;
}

.rate-cell {
  display: grid;
  grid-template-columns: 1fr 48px;
  align-items: center;
  gap: 8px;
}

.rate-cell span {
  color: #526177;
  font-size: 12px;
  text-align: right;
}
</style>
