<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import type { FinanceProjectFilterModel, RiskLevel } from '../../dataset/researchFinanceMock'

const props = defineProps<{
  modelValue: FinanceProjectFilterModel
  departments: Array<{ label: string; value: string }>
  projectStatuses: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FinanceProjectFilterModel]
  query: []
  reset: []
  export: []
}>()

const riskOptions: Array<{ label: string; value: RiskLevel | 'all' }> = [
  { label: '全部风险', value: 'all' },
  { label: '正常', value: 'NORMAL' },
  { label: '关注', value: 'ATTENTION' },
  { label: '预警', value: 'WARNING' },
]

function updateField<K extends keyof FinanceProjectFilterModel>(key: K, value: FinanceProjectFilterModel[K]) {
  emit('update:modelValue', {
    ...modelValueProxy(),
    [key]: value,
  })
}

function modelValueProxy() {
  return { ...props.modelValue }
}
</script>

<template>
  <section class="finance-filter-panel" aria-label="经费项目查询条件">
    <el-input
      class="finance-keyword"
      :model-value="props.modelValue.keyword"
      clearable
      :prefix-icon="Search"
      placeholder="项目编号、项目名称、负责人"
      @update:model-value="updateField('keyword', String($event))"
      @keyup.enter="emit('query')"
    />
    <el-select
      class="finance-filter-select"
      :model-value="props.modelValue.departmentId"
      placeholder="学部/部门"
      @update:model-value="updateField('departmentId', String($event))"
    >
      <el-option label="全部部门" value="all" />
      <el-option v-for="item in props.departments" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-select
      class="finance-filter-select"
      :model-value="props.modelValue.projectStatus"
      placeholder="项目状态"
      @update:model-value="updateField('projectStatus', String($event))"
    >
      <el-option label="全部状态" value="all" />
      <el-option v-for="item in props.projectStatuses" :key="item" :label="item" :value="item" />
    </el-select>
    <el-select
      class="finance-filter-select"
      :model-value="props.modelValue.riskLevel"
      placeholder="经费风险"
      @update:model-value="updateField('riskLevel', $event as RiskLevel | 'all')"
    >
      <el-option v-for="item in riskOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-button type="primary" @click="emit('query')">查询</el-button>
    <el-button @click="emit('reset')">重置</el-button>
    <el-button class="export-button" @click="emit('export')">导出</el-button>
  </section>
</template>

<style scoped>
.finance-filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(40, 72, 120, 0.05);
}

.finance-keyword {
  width: 280px;
}

.finance-filter-select {
  width: 148px;
}

.export-button {
  margin-left: auto;
}

@media (max-width: 1280px) {
  .export-button {
    margin-left: 0;
  }
}
</style>
