<script setup lang="ts">
import type { PaymentDetailRecord } from '../../dataset/researchFinanceMock'
import { formatCurrency } from './financeFormat'

defineProps<{
  rows: PaymentDetailRecord[]
}>()
</script>

<template>
  <el-table class="finance-detail-table" :data="rows" row-key="id" border empty-text="暂无已付款明细">
    <el-table-column prop="paymentNo" label="付款单号" width="148" fixed="left" />
    <el-table-column prop="paymentDate" label="付款日期" width="112" />
    <el-table-column prop="payee" label="收款方" min-width="180" show-overflow-tooltip />
    <el-table-column prop="summary" label="付款摘要" min-width="180" show-overflow-tooltip />
    <el-table-column prop="primarySubject" label="一级科目" width="112" />
    <el-table-column prop="secondarySubject" label="二级科目" width="150" show-overflow-tooltip />
    <el-table-column label="付款金额" width="128" align="right">
      <template #default="{ row }">{{ formatCurrency(row.amount) }}</template>
    </el-table-column>
    <el-table-column prop="status" label="付款状态" width="104">
      <template #default="{ row }">
        <el-tag size="small" type="success" effect="light">{{ row.status }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="voucherNo" label="用友凭证号" width="166" />
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
