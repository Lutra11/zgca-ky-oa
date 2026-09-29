<script setup lang="ts">
import { payableTypeLabels, type PayableDetailRecord } from '../../dataset/researchFinanceMock'
import { formatCurrency } from './financeFormat'

defineProps<{
  rows: PayableDetailRecord[]
}>()

function getPayableTypeLabel(row: PayableDetailRecord) {
  return payableTypeLabels[row.payableType]
}
</script>

<template>
  <el-table class="finance-detail-table" :data="rows" row-key="id" border empty-text="暂无应付未付明细">
    <el-table-column prop="payableNo" label="应付单号" width="148" fixed="left" />
    <el-table-column label="应付类型" width="152">
      <template #default="{ row }">{{ getPayableTypeLabel(row) }}</template>
    </el-table-column>
    <el-table-column prop="confirmDate" label="确认日期" width="112" />
    <el-table-column prop="supplier" label="供应商或收款对象" min-width="180" show-overflow-tooltip />
    <el-table-column prop="summary" label="摘要" min-width="180" show-overflow-tooltip />
    <el-table-column prop="primarySubject" label="一级科目" width="112" />
    <el-table-column prop="secondarySubject" label="二级科目" width="150" show-overflow-tooltip />
    <el-table-column label="应付金额" width="128" align="right">
      <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
    </el-table-column>
    <el-table-column prop="freezeStatus" label="冻结状态" width="104">
      <template #default="{ row }">
        <el-tag size="small" type="warning" effect="light">{{ row.freezeStatus }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="expectedPaymentDate" label="预计付款日期" width="130" />
    <el-table-column prop="syncTime" label="同步时间" width="150" />
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
</style>
