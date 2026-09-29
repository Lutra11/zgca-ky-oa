<script setup lang="ts">
import { alertLevelLabels, type FinanceAlertRecord } from '../../dataset/researchFinanceMock'
import { getAlertTagType } from './financeFormat'

withDefaults(
  defineProps<{
    rows: FinanceAlertRecord[]
    showProject?: boolean
    showOperations?: boolean
  }>(),
  {
    showProject: false,
    showOperations: false,
  },
)

const emit = defineEmits<{
  openProject: [projectId: string]
}>()

function getAlertLevelLabel(row: FinanceAlertRecord) {
  return alertLevelLabels[row.level]
}
</script>

<template>
  <el-table class="finance-detail-table" :data="rows" row-key="id" border empty-text="暂无经费预警记录">
    <el-table-column label="风险等级" width="104" fixed="left">
      <template #default="{ row }">
        <el-tag size="small" effect="light" :type="getAlertTagType(row.level)">
          {{ getAlertLevelLabel(row) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column v-if="showProject" label="项目" min-width="240" show-overflow-tooltip>
      <template #default="{ row }">
        <div class="alert-project-cell">
          <strong>{{ row.projectName }}</strong>
          <span>{{ row.projectCode }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="alertType" label="预警类型" min-width="170" show-overflow-tooltip />
    <el-table-column prop="content" label="预警内容" min-width="300" show-overflow-tooltip />
    <el-table-column prop="triggeredAt" label="触发时间" width="150" />
    <el-table-column prop="recipients" label="提醒对象" min-width="170" show-overflow-tooltip />
    <el-table-column prop="remindStatus" label="提醒状态" width="104" />
    <el-table-column prop="processStatus" label="处理状态" width="104" />
    <el-table-column v-if="showOperations" label="操作" width="118" fixed="right" align="center">
      <template #default="{ row }">
        <el-button type="primary" link @click="emit('openProject', row.projectId)">查看项目</el-button>
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

.alert-project-cell {
  display: grid;
  gap: 2px;
}

.alert-project-cell strong {
  overflow: hidden;
  color: #152b4f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-project-cell span {
  color: #91a0b6;
  font-size: 12px;
}
</style>
