<script setup lang="ts">
import {
  riskLevelLabels,
  syncStatusLabels,
  type ProjectFinanceSummary,
} from '../../dataset/researchFinanceMock'
import { formatCurrency, formatPercent, getRiskTagType, getSyncTagType, toProgressPercent } from './financeFormat'

interface FinanceSortChange {
  prop?: string
  order?: 'ascending' | 'descending' | null
}

defineProps<{
  rows: ProjectFinanceSummary[]
  total: number
  loading?: boolean
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  view: [project: ProjectFinanceSummary]
  sortChange: [sort: FinanceSortChange]
  'update:currentPage': [page: number]
  'update:pageSize': [pageSize: number]
}>()

function getRiskLabel(row: ProjectFinanceSummary) {
  return riskLevelLabels[row.riskLevel]
}

function getSyncLabel(row: ProjectFinanceSummary) {
  return row.syncStatus ? syncStatusLabels[row.syncStatus] : ''
}
</script>

<template>
  <section class="finance-table-card" aria-label="项目经费列表">
    <el-table
      v-loading="loading"
      class="finance-project-table"
      :data="rows"
      row-key="projectId"
      stripe
      @sort-change="emit('sortChange', $event)"
    >
      <el-table-column prop="projectCode" label="项目编号" width="132" fixed="left" />
      <el-table-column label="项目名称" min-width="260" fixed="left" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="project-cell">
            <strong>{{ row.projectName }}</strong>
            <span>最近同步：{{ row.lastSyncTime ?? '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="leaderName" label="负责人" width="96" />
      <el-table-column prop="departmentName" label="学部/部门" min-width="150" show-overflow-tooltip />
      <el-table-column prop="projectStatus" label="状态" width="96">
        <template #default="{ row }">
          <el-tag size="small" effect="light">{{ row.projectStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalBudget" label="项目总预算" width="140" sortable="custom" align="right">
        <template #default="{ row }">{{ formatCurrency(row.totalBudget) }}</template>
      </el-table-column>
      <el-table-column prop="paidAmount" label="已付款" width="132" align="right">
        <template #default="{ row }">{{ formatCurrency(row.paidAmount) }}</template>
      </el-table-column>
      <el-table-column prop="unpaidPayableAmount" label="应付未付" width="132" align="right">
        <template #default="{ row }">
          <span class="unpaid-amount">{{ formatCurrency(row.unpaidPayableAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="availableAmount" label="可用余额" width="132" align="right">
        <template #default="{ row }">{{ formatCurrency(row.availableAmount) }}</template>
      </el-table-column>
      <el-table-column prop="actualPaymentRate" label="实际付款执行率" width="178" sortable="custom">
        <template #default="{ row }">
          <div class="rate-cell">
            <el-progress
              :percentage="toProgressPercent(row.actualPaymentRate)"
              :stroke-width="6"
              :show-text="false"
            />
            <span>{{ formatPercent(row.actualPaymentRate) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="budgetOccupancyRate" label="预算占用率" width="164" sortable="custom">
        <template #default="{ row }">
          <div class="rate-cell occupancy">
            <el-progress
              :percentage="toProgressPercent(row.budgetOccupancyRate)"
              :stroke-width="6"
              :show-text="false"
              color="#7c5cff"
            />
            <span>{{ formatPercent(row.budgetOccupancyRate) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="风险状态" width="108" align="center">
        <template #default="{ row }">
          <el-tag size="small" effect="light" :type="getRiskTagType(row.riskLevel)">
            {{ getRiskLabel(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="同步" width="96" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.syncStatus" size="small" effect="plain" :type="getSyncTagType(row.syncStatus)">
            {{ getSyncLabel(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="108" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link @click="emit('view', row)">查看详情</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="暂无符合条件的经费项目" />
      </template>
    </el-table>

    <footer class="finance-pagination">
      <span>共 {{ total }} 个项目</span>
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[6, 10, 20]"
        background
        layout="sizes, prev, pager, next"
        :total="total"
        @update:current-page="emit('update:currentPage', $event)"
        @update:page-size="emit('update:pageSize', $event)"
      />
    </footer>
  </section>
</template>

<style scoped>
.finance-table-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(40, 72, 120, 0.06);
}

.finance-project-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
  --el-table-row-hover-bg-color: #f5f8fd;
}

.finance-project-table :deep(.el-table__cell) {
  padding: 10px 0;
}

.project-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.project-cell strong {
  overflow: hidden;
  color: #152b4f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-cell span {
  color: #91a0b6;
  font-size: 12px;
}

.unpaid-amount {
  color: #7c5cff;
  font-weight: 700;
}

.rate-cell {
  display: grid;
  grid-template-columns: 1fr 46px;
  align-items: center;
  gap: 8px;
}

.rate-cell span {
  color: #526177;
  font-size: 12px;
  text-align: right;
}

.finance-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-top: 1px solid #edf2f8;
  color: #7b8ba4;
  font-size: 13px;
}
</style>
