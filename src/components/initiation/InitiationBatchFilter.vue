<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'

type SelectValue = string | number

interface FilterOption {
  label: string
  value: SelectValue
}

interface BatchFilterModel {
  keyword: string
  year: number | 'all'
  quarter?: number | 'all'
  projectCategory?: string | 'all'
  status?: string | 'all'
}

const props = withDefaults(
  defineProps<{
    modelValue: BatchFilterModel
    yearOptions: number[]
    quarterOptions?: number[]
    categoryOptions?: string[]
    statusOptions?: FilterOption[]
    keywordPlaceholder?: string
    showQuarter?: boolean
    showCategory?: boolean
    showStatus?: boolean
  }>(),
  {
    keywordPlaceholder: '输入批次名称或批次编号',
    showQuarter: false,
    showCategory: false,
    showStatus: false,
    quarterOptions: () => [],
    categoryOptions: () => [],
    statusOptions: () => [],
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: BatchFilterModel]
  query: []
  reset: []
}>()

const categorySelectOptions = computed<FilterOption[]>(() =>
  props.categoryOptions.map((category) => ({
    label: category,
    value: category,
  })),
)

function updateFilter(nextValue: Partial<BatchFilterModel>) {
  emit('update:modelValue', {
    ...props.modelValue,
    ...nextValue,
  })
}

function updateKeyword(value: SelectValue) {
  updateFilter({ keyword: String(value) })
}

function updateYear(value: SelectValue) {
  updateFilter({ year: value === 'all' ? 'all' : Number(value) })
}

function updateQuarter(value: SelectValue) {
  updateFilter({ quarter: value === 'all' ? 'all' : Number(value) })
}

function updateProjectCategory(value: SelectValue) {
  updateFilter({ projectCategory: String(value) })
}

function updateStatus(value: SelectValue) {
  updateFilter({ status: String(value) })
}
</script>

<template>
  <section class="initiation-batch-filter-shell" aria-label="立项批次筛选">
    <el-input
      class="batch-filter-keyword"
      clearable
      :model-value="modelValue.keyword"
      :prefix-icon="Search"
      :placeholder="keywordPlaceholder"
      @keyup.enter="emit('query')"
      @update:model-value="updateKeyword"
    />

    <el-select
      class="batch-filter-select"
      :model-value="modelValue.year"
      aria-label="年份筛选"
      @update:model-value="updateYear"
    >
      <el-option label="全部年份" value="all" />
      <el-option
        v-for="year in yearOptions"
        :key="year"
        :label="`${year} 年`"
        :value="year"
      />
    </el-select>

    <el-select
      v-if="showQuarter"
      class="batch-filter-select"
      :model-value="modelValue.quarter ?? 'all'"
      aria-label="季度筛选"
      @update:model-value="updateQuarter"
    >
      <el-option label="全部季度" value="all" />
      <el-option
        v-for="quarter in quarterOptions"
        :key="quarter"
        :label="`第 ${quarter} 季度`"
        :value="quarter"
      />
    </el-select>

    <el-select
      v-if="showCategory"
      class="batch-filter-select"
      :model-value="modelValue.projectCategory ?? 'all'"
      aria-label="项目类别筛选"
      @update:model-value="updateProjectCategory"
    >
      <el-option label="全部类别" value="all" />
      <el-option
        v-for="option in categorySelectOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <el-select
      v-if="showStatus"
      class="batch-filter-select"
      :model-value="modelValue.status ?? 'all'"
      aria-label="批次状态筛选"
      @update:model-value="updateStatus"
    >
      <el-option label="全部状态" value="all" />
      <el-option
        v-for="option in statusOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <el-button type="primary" @click="emit('query')">查询</el-button>
    <el-button @click="emit('reset')">重置</el-button>
  </section>
</template>

<style scoped>
.initiation-batch-filter-shell {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
  padding: 16px 20px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.batch-filter-keyword {
  width: min(300px, 100%);
  flex: 0 1 300px;
}

.batch-filter-select {
  width: 128px;
  flex: 0 0 128px;
}

.initiation-batch-filter-shell :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 860px) {
  .batch-filter-keyword,
  .batch-filter-select {
    width: 100%;
    flex-basis: 100%;
  }
}
</style>
