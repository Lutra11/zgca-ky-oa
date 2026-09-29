<script setup lang="ts">
import { Calendar, Delete, Plus, Rank } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AssessmentPeriod } from './types'

const periods = defineModel<AssessmentPeriod[]>({ required: true })

function addPeriod() {
  periods.value.push({
    id: createId('period'),
    name: '',
    startDate: '',
    endDate: '',
  })
}

async function removePeriod(periodId: string) {
  if (periods.value.length <= 1) {
    ElMessage.warning('至少需要保留一个考核周期')
    return
  }

  try {
    await ElMessageBox.confirm('删除后该周期配置将无法恢复，是否继续？', '删除考核周期', {
      type: 'warning',
      confirmButtonText: '继续删除',
      cancelButtonText: '取消',
      autofocus: false,
    })
    periods.value = periods.value.filter((period) => period.id !== periodId)
  } catch {
    // 用户取消删除时不需要额外处理。
  }
}

async function validateAndSave(showMessage = true) {
  const error = validatePeriods()

  if (error) {
    ElMessage.error(error)
    return false
  }

  if (showMessage) {
    ElMessage.success('项目考核周期已保存')
  }
  return true
}

function validatePeriods() {
  if (!periods.value.length) {
    return '请至少配置一个考核周期'
  }

  const names = new Set<string>()

  for (const period of periods.value) {
    const name = period.name.trim()

    if (!name) {
      return '周期名称不能为空'
    }

    if (names.has(name)) {
      return `周期名称不能重复：${name}`
    }

    names.add(name)

    if (!period.startDate || !period.endDate) {
      return `请完善 ${name} 的开始日期和结束日期`
    }

    if (period.startDate > period.endDate) {
      return `${name} 的开始日期不能晚于结束日期`
    }
  }

  const sortedPeriods = [...periods.value].sort((left, right) =>
    left.startDate.localeCompare(right.startDate),
  )

  for (let index = 1; index < sortedPeriods.length; index += 1) {
    const previous = sortedPeriods[index - 1]
    const current = sortedPeriods[index]

    if (current.startDate <= previous.endDate) {
      return `${previous.name} 与 ${current.name} 的时间不能交叉或重复`
    }
  }

  return ''
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`
}

defineExpose({ validateAndSave })
</script>

<template>
  <article class="config-card">
    <header class="card-header">
      <div class="title-row">
        <span class="title-icon">
          <el-icon><Calendar /></el-icon>
        </span>
        <h3>项目考核周期</h3>
      </div>

      <div class="header-actions">
        <el-button :icon="Plus" plain @click="addPeriod">添加周期</el-button>
        <el-button type="primary" @click="validateAndSave">保存</el-button>
      </div>
    </header>

    <div class="period-list">
      <section v-for="period in periods" :key="period.id" class="period-row">
        <span class="drag-icon">
          <el-icon><Rank /></el-icon>
        </span>

        <label class="period-field period-name">
          <span>周期名称</span>
          <el-input v-model="period.name" placeholder="请输入周期名称" clearable />
        </label>

        <label class="period-field">
          <span>开始日期</span>
          <el-date-picker
            v-model="period.startDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            placeholder="开始日期"
            clearable
          />
        </label>

        <label class="period-field">
          <span>结束日期</span>
          <el-date-picker
            v-model="period.endDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            placeholder="结束日期"
            clearable
          />
        </label>

        <el-button class="danger-icon-button" :icon="Delete" plain @click="removePeriod(period.id)" />
      </section>
    </div>
  </article>
</template>

<style scoped>
.config-card {
  border: 1px solid rgba(0, 113, 227, 0.1);
  border-radius: 12px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 36px rgba(26, 39, 68, 0.07);
}

.card-header,
.title-row,
.header-actions,
.period-row {
  display: flex;
  align-items: center;
}

.card-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.title-row {
  gap: 10px;
}

.title-row h3 {
  margin: 0;
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 820;
}

.title-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  color: #0a84ff;
  background: #e8f2ff;
}

.header-actions {
  gap: 10px;
}

.period-list {
  display: grid;
  gap: 10px;
}

.period-row {
  display: grid;
  grid-template-columns: 22px minmax(260px, 1.7fr) minmax(180px, 1fr) minmax(180px, 1fr) 42px;
  gap: 16px;
  padding: 14px;
  border: 1px solid rgba(10, 132, 255, 0.16);
  border-radius: 10px;
  background: linear-gradient(180deg, #fbfdff 0%, #f7fbff 100%);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.period-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(26, 39, 68, 0.08);
}

.drag-icon {
  color: #a1a1a6;
}

.period-field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.period-field span {
  color: #6e6e73;
  font-size: 12px;
  font-weight: 760;
}

.period-field :deep(.el-date-editor.el-input) {
  width: 100%;
}

.danger-icon-button {
  align-self: end;
  width: 38px;
  border-color: rgba(255, 59, 48, 0.42);
  color: #ff3b30;
}

@media (max-width: 1180px) {
  .period-row {
    grid-template-columns: 22px 1fr 1fr;
  }

  .period-name {
    grid-column: span 2;
  }
}
</style>
