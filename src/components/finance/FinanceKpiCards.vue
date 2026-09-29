<script setup lang="ts">
import { formatCurrency } from './financeFormat'

export interface FinanceKpiCard {
  label: string
  value: number
  unit?: string
  note: string
  tone: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'
  currency?: boolean
}

defineProps<{
  cards: FinanceKpiCard[]
}>()

function formatValue(card: FinanceKpiCard) {
  if (card.currency) {
    return formatCurrency(card.value)
  }

  return `${card.value}${card.unit ?? ''}`
}
</script>

<template>
  <section class="finance-kpi-grid" aria-label="经费执行统计">
    <article v-for="card in cards" :key="card.label" class="finance-kpi-card" :class="`tone-${card.tone}`">
      <span class="kpi-icon">{{ card.label.slice(0, 1) }}</span>
      <div>
        <p>{{ card.label }}</p>
        <strong>{{ formatValue(card) }}</strong>
        <em>{{ card.note }}</em>
      </div>
    </article>
  </section>
</template>

<style scoped>
.finance-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.finance-kpi-card {
  display: flex;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(40, 72, 120, 0.06);
}

.kpi-icon {
  display: inline-grid;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  font-weight: 800;
}

.finance-kpi-card div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.finance-kpi-card p,
.finance-kpi-card em {
  margin: 0;
  color: #7b8ba4;
  font-size: 12px;
  font-style: normal;
}

.finance-kpi-card strong {
  overflow: hidden;
  color: #172b4d;
  font-size: 20px;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tone-blue .kpi-icon {
  color: #3478e5;
  background: #eaf2ff;
}

.tone-green .kpi-icon {
  color: #18a875;
  background: #e8f7f1;
}

.tone-orange .kpi-icon {
  color: #d97706;
  background: #fff4e5;
}

.tone-red .kpi-icon {
  color: #d93025;
  background: #fdecec;
}

.tone-purple .kpi-icon {
  color: #7c5cff;
  background: #f0ecff;
}

.tone-gray .kpi-icon {
  color: #637185;
  background: #eef2f6;
}

@media (max-width: 1440px) {
  .finance-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .finance-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
