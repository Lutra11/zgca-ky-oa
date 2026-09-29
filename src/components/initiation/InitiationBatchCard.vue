<script setup lang="ts">
import { computed } from 'vue'
import type { InitiationBatchMockRow } from '../../dataset/initiationProjectsMock'

type LeaderBatchStatus = '未开始' | '申报中' | '已结束'

const props = defineProps<{
  batch: InitiationBatchMockRow
  status: LeaderBatchStatus
  remainingText?: string
}>()

const emit = defineEmits<{
  view: [batch: InitiationBatchMockRow]
}>()

const batchName = computed(() => props.batch.batch_name ?? props.batch.batchName)
const batchCode = computed(() => props.batch.batch_code ?? props.batch.batchCode)
const category = computed(() => props.batch.project_category ?? '纵向项目')
const applyPeriod = computed(() => {
  const start = props.batch.batch_apply_start?.slice(0, 10).replace(/-/g, '.')
  const deadline = props.batch.batch_apply_deadline?.slice(0, 10).replace(/-/g, '.')

  return start && deadline ? `${start}—${deadline}` : props.batch.applyPeriod
})
const limitText = computed(() => {
  const limit = props.batch.batch_limit_count ?? 0

  return limit === 0 ? '不限' : `${limit} 项`
})
const progressValue = computed(() => Math.min(100, Math.max(0, props.batch.progress)))
const isApplying = computed(() => props.status === '申报中')
const isEnded = computed(() => props.status === '已结束')
const progressColor = computed(() => (isEnded.value ? '#35ad7b' : '#3478ee'))
const tagClass = computed(() => ({
  'batch-status-tag': true,
  applying: isApplying.value,
  pending: props.status === '未开始',
  ended: isEnded.value,
}))
</script>

<template>
  <article
    class="leader-initiation-batch-card"
    :class="{ applying: isApplying, ended: isEnded }"
  >
    <div class="batch-quarter-badge">
      <strong>{{ batch.year }}</strong>
      <span>第 {{ batch.quarter }} 季度</span>
    </div>

    <section class="batch-card-main">
      <div class="batch-title-row">
        <el-tooltip :content="batchName" placement="top" :show-after="300">
          <h2>{{ batchName }}</h2>
        </el-tooltip>
        <span class="category-pill">{{ category }}</span>
      </div>
      <p>批次编号：{{ batchCode }}</p>
      <div class="batch-progress-line">
        <span>批次进度</span>
        <el-progress
          class="batch-progress"
          :percentage="progressValue"
          :show-text="false"
          :stroke-width="5"
          :color="progressColor"
        />
        <strong :class="{ ended: isEnded }">{{ progressValue }}%</strong>
      </div>
    </section>

    <section class="batch-period-meta">
      <span>申报周期</span>
      <strong>{{ applyPeriod }}</strong>
    </section>

    <section class="batch-quota-meta">
      <div>
        <span>项目类别</span>
        <strong>{{ category }}</strong>
      </div>
      <div>
        <span>数量上限</span>
        <strong>{{ limitText }}</strong>
      </div>
    </section>

    <section class="batch-status-meta">
      <span :class="tagClass">{{ status }}</span>
      <em v-if="remainingText && isApplying">{{ remainingText }}</em>
    </section>

    <footer class="batch-card-action">
      <el-button
        class="batch-view-button"
        :type="isApplying ? 'primary' : 'default'"
        @click="emit('view', batch)"
      >
        查看详情
        <span aria-hidden="true">›</span>
      </el-button>
    </footer>
  </article>
</template>

<style scoped>
.leader-initiation-batch-card {
  position: relative;
  min-width: 0;
  min-height: 108px;
  display: grid;
  grid-template-columns: 76px minmax(330px, 1.45fr) minmax(190px, 0.75fr) minmax(150px, 0.55fr) 112px 126px;
  align-items: center;
  gap: 20px;
  overflow: hidden;
  padding: 18px 22px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 7px 22px rgba(27, 46, 77, 0.045);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.leader-initiation-batch-card:hover {
  border-color: #cbdcf9;
  box-shadow: 0 14px 30px rgba(33, 71, 130, 0.09);
  transform: translateY(-2px);
}

.leader-initiation-batch-card.applying {
  border-color: #9cc5ff;
  box-shadow: 0 14px 30px rgba(58, 116, 232, 0.12);
}

.leader-initiation-batch-card.applying::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 15px 0 0 15px;
  background: #3478ee;
}

.batch-quarter-badge {
  width: 72px;
  min-height: 68px;
  display: grid;
  align-content: center;
  place-items: center;
  gap: 4px;
  border-radius: 12px;
  color: #61708a;
  background: #f3f6fb;
  text-align: center;
}

.batch-quarter-badge strong {
  color: #40506a;
  font-size: 16px;
  line-height: 1;
  font-weight: 760;
}

.batch-quarter-badge span {
  color: #7c899d;
  font-size: 11px;
}

.leader-initiation-batch-card.applying .batch-quarter-badge {
  color: #245dc9;
  background: #eaf2ff;
}

.leader-initiation-batch-card.applying .batch-quarter-badge strong,
.leader-initiation-batch-card.applying .batch-quarter-badge span {
  color: #245dc9;
}

.batch-card-main,
.batch-title-row {
  min-width: 0;
}

.batch-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-title-row h2 {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  color: #26344d;
  font-size: 16px;
  line-height: 1.35;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 10px;
  border-radius: 999px;
  color: #6b778c;
  background: #f2f5f9;
  font-size: 12px;
  font-weight: 650;
}

.batch-card-main p {
  overflow: hidden;
  margin: 7px 0 0;
  color: #97a2b3;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-progress-line {
  display: grid;
  grid-template-columns: auto minmax(160px, 1fr) 44px;
  align-items: center;
  gap: 10px;
  margin-top: 11px;
}

.batch-progress-line span {
  color: #8a95a7;
  font-size: 12px;
  white-space: nowrap;
}

.batch-progress-line strong {
  color: #246de2;
  font-size: 12px;
  font-weight: 720;
  text-align: right;
  white-space: nowrap;
}

.batch-progress-line strong.ended {
  color: #16835d;
}

.batch-progress {
  min-width: 0;
}

.batch-progress :deep(.el-progress-bar__outer) {
  background: #edf2f8;
}

.batch-progress :deep(.el-progress-bar__inner) {
  transition: width 0.3s ease;
}

.batch-period-meta,
.batch-quota-meta,
.batch-status-meta {
  min-width: 0;
  padding-left: 20px;
  border-left: 1px solid #edf1f7;
}

.batch-period-meta span,
.batch-quota-meta span {
  display: block;
  overflow: hidden;
  color: #99a4b5;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-period-meta strong,
.batch-quota-meta strong {
  display: block;
  overflow: hidden;
  margin-top: 7px;
  color: #203452;
  font-size: 13px;
  line-height: 1.35;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-quota-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.batch-status-meta {
  display: grid;
  place-items: center;
  gap: 5px;
}

.batch-status-meta em {
  color: #f06b2b;
  font-size: 11px;
  font-style: normal;
  white-space: nowrap;
}

.batch-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}

.batch-status-tag::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.batch-status-tag.applying {
  color: #246de2;
  background: #eaf2ff;
}

.batch-status-tag.pending {
  color: #8b66cf;
  background: #f4efff;
}

.batch-status-tag.ended {
  color: #16835d;
  background: #e8f7f1;
}

.batch-card-action {
  display: flex;
  justify-content: flex-end;
}

.batch-view-button {
  min-width: 116px;
  min-height: 40px;
}

.batch-view-button span {
  margin-left: 2px;
  font-size: 14px;
}

@media (max-width: 1320px) {
  .leader-initiation-batch-card {
    grid-template-columns: 76px minmax(260px, 1.4fr) minmax(170px, 0.8fr) minmax(132px, 0.6fr) 100px 116px;
    gap: 14px;
    padding: 16px 18px;
  }
}

@media (max-width: 1080px) {
  .leader-initiation-batch-card {
    grid-template-columns: 76px minmax(0, 1fr) 120px;
  }

  .batch-period-meta,
  .batch-quota-meta,
  .batch-status-meta {
    border-left: 0;
    padding-left: 0;
  }

  .batch-period-meta,
  .batch-quota-meta {
    grid-column: 2 / 4;
  }

  .batch-status-meta {
    justify-items: start;
  }
}
</style>
