<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { getFinanceProjectDetail, syncStatusLabels } from '../../dataset/researchFinanceMock'
import type { BudgetSubject } from '../../dataset/researchFinanceMock'
import BudgetAdjustmentTable from './BudgetAdjustmentTable.vue'
import BudgetExecutionTable from './BudgetExecutionTable.vue'
import FinanceAlertList from './FinanceAlertList.vue'
import PayableDetailTable from './PayableDetailTable.vue'
import PaymentDetailTable from './PaymentDetailTable.vue'
import { formatCurrency, formatPercent, getSyncTagType } from './financeFormat'

const props = defineProps<{
  modelValue: boolean
  projectId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const activeTab = shallowRef('budget')

const detail = computed(() => (props.projectId ? getFinanceProjectDetail(props.projectId) : null))

const summary = computed(() => detail.value?.summary ?? null)

const budgetSubjects = computed(() => detail.value?.budgetSubjects ?? [])

const financeTotals = computed(() => {
  const project = summary.value

  if (!project) {
    return []
  }

  return [
    { label: '项目总预算', value: project.totalBudget, tone: 'blue' },
    { label: '已付款', value: project.paidAmount, tone: 'green' },
    { label: '应付未付', value: project.unpaidPayableAmount, tone: 'purple' },
    { label: '预算占用', value: project.occupiedAmount, tone: 'orange' },
    { label: '可用余额', value: project.availableAmount, tone: 'green' },
    { label: '预算占用率', value: project.budgetOccupancyRate, tone: 'gray', percent: true },
  ]
})

function findPrimarySubject(name: string): BudgetSubject | undefined {
  return budgetSubjects.value.find((item) => item.level === 1 && item.name === name)
}

const laborBudgetRate = computed(() => {
  const project = summary.value
  const subject = findPrimarySubject('劳务费')

  return project && subject ? subject.budgetAmount / project.totalBudget : 0
})

const outsourcingBudgetRate = computed(() => {
  const project = summary.value
  const subject = findPrimarySubject('外协费')

  return project && subject ? subject.budgetAmount / project.totalBudget : 0
})

watch(
  () => props.projectId,
  () => {
    activeTab.value = 'budget'
  },
)
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    append-to-body
    destroy-on-close
    size="72%"
    class="project-finance-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="drawer-title">
        <span>项目经费详情</span>
        <p v-if="summary">{{ summary.projectCode }} · {{ summary.projectName }}</p>
      </div>
    </template>

    <template v-if="summary && detail">
      <section class="drawer-project-summary">
        <div class="summary-main">
          <strong>{{ summary.projectName }}</strong>
          <span>{{ summary.projectCode }} / {{ summary.leaderName }} / {{ summary.departmentName }}</span>
        </div>
        <div class="summary-meta">
          <span>执行期限：{{ summary.projectPeriod }}</span>
          <span>
            数据同步：
            <el-tag v-if="summary.syncStatus" size="small" effect="light" :type="getSyncTagType(summary.syncStatus)">
              {{ syncStatusLabels[summary.syncStatus] }}
            </el-tag>
          </span>
          <span>最近同步：{{ summary.lastSyncTime ?? '-' }}</span>
        </div>
      </section>

      <section class="drawer-stat-grid">
        <article v-for="item in financeTotals" :key="item.label" :class="`drawer-stat tone-${item.tone}`">
          <span>{{ item.label }}</span>
          <strong>{{ item.percent ? formatPercent(item.value) : formatCurrency(item.value) }}</strong>
        </article>
      </section>

      <section class="control-indicator-card">
        <div>
          <span>劳务费预算比例</span>
          <strong :class="{ warning: laborBudgetRate > 0.3 }">{{ formatPercent(laborBudgetRate) }}</strong>
          <small>用友控制上限 30%</small>
        </div>
        <el-progress
          :percentage="Math.min(100, laborBudgetRate * 100)"
          :stroke-width="8"
          :color="laborBudgetRate > 0.3 ? '#e5484d' : '#3478e5'"
        />
        <div>
          <span>外协费预算比例</span>
          <strong :class="{ warning: outsourcingBudgetRate > 0.5 }">{{ formatPercent(outsourcingBudgetRate) }}</strong>
          <small>用友控制上限 50%</small>
        </div>
        <el-progress
          :percentage="Math.min(100, outsourcingBudgetRate * 100)"
          :stroke-width="8"
          :color="outsourcingBudgetRate > 0.5 ? '#e5484d' : '#23a574'"
        />
      </section>

      <el-tabs v-model="activeTab" class="finance-detail-tabs">
        <el-tab-pane label="预算执行" name="budget">
          <BudgetExecutionTable :subjects="detail.budgetSubjects" />
        </el-tab-pane>
        <el-tab-pane label="已付款明细" name="payments">
          <PaymentDetailTable :rows="detail.payments" />
        </el-tab-pane>
        <el-tab-pane label="应付未付明细" name="payables">
          <PayableDetailTable :rows="detail.payables" />
        </el-tab-pane>
        <el-tab-pane label="预算调整" name="adjustments">
          <BudgetAdjustmentTable :rows="detail.adjustments" />
        </el-tab-pane>
        <el-tab-pane label="预警记录" name="alerts">
          <FinanceAlertList :rows="detail.alerts" />
        </el-tab-pane>
      </el-tabs>
    </template>

    <el-empty v-else description="未找到项目经费详情" />
  </el-drawer>
</template>

<style scoped>
.drawer-title {
  display: grid;
  gap: 4px;
}

.drawer-title span {
  color: #152b4f;
  font-size: 18px;
  font-weight: 800;
}

.drawer-title p {
  margin: 0;
  color: #7b8ba4;
  font-size: 13px;
}

.drawer-project-summary,
.control-indicator-card {
  margin-bottom: 14px;
  padding: 16px;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
}

.drawer-project-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.summary-main,
.summary-meta {
  display: grid;
  gap: 8px;
}

.summary-main strong {
  color: #152b4f;
  font-size: 18px;
}

.summary-main span,
.summary-meta span {
  color: #637185;
  font-size: 13px;
}

.drawer-stat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.drawer-stat {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e3ebf6;
  border-radius: 12px;
  background: #fff;
}

.drawer-stat span {
  color: #7b8ba4;
  font-size: 12px;
}

.drawer-stat strong {
  overflow: hidden;
  color: #172b4d;
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tone-blue {
  border-color: #d8e7ff;
}

.tone-green {
  border-color: #d8f1e7;
}

.tone-orange {
  border-color: #ffe5bf;
}

.tone-purple {
  border-color: #e5ddff;
}

.control-indicator-card {
  display: grid;
  grid-template-columns: 180px 1fr 180px 1fr;
  align-items: center;
  gap: 12px;
}

.control-indicator-card div {
  display: grid;
  gap: 3px;
}

.control-indicator-card span,
.control-indicator-card small {
  color: #7b8ba4;
  font-size: 12px;
}

.control-indicator-card strong {
  color: #152b4f;
  font-size: 18px;
}

.control-indicator-card strong.warning {
  color: #e5484d;
}

.finance-detail-tabs {
  padding: 0 2px;
}

@media (max-width: 1360px) {
  .drawer-stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .control-indicator-card {
    grid-template-columns: 170px 1fr;
  }
}
</style>
