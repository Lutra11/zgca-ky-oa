<script setup lang="ts">
import { computed } from 'vue'
import { Document } from '@element-plus/icons-vue'
import type { InitiationBatchMockRow } from '../../dataset/initiationProjectsMock'
import LaunchPlanGantt from './LaunchPlanGantt.vue'

type LeaderBatchStatus = '未开始' | '申报中' | '已结束'

const props = defineProps<{
  batch: InitiationBatchMockRow
  status: LeaderBatchStatus
  remainingText: string
  showApplyAction?: boolean
  canApply?: boolean
  applyDisabledReason?: string
  /** 负责人已在该批次提交申报——操作按钮从「立即申报」切换为「查看我的申请」 */
  applied?: boolean
  /** 已提交申报的项目名（applied 态按钮旁展示） */
  appliedProjectLabel?: string
}>()

const emit = defineEmits<{
  previewGuide: [batch: InitiationBatchMockRow]
  downloadGuide: [batch: InitiationBatchMockRow]
  apply: [batch: InitiationBatchMockRow]
}>()

const batchName = computed(() => props.batch.batch_name ?? props.batch.batchName)
const batchCode = computed(() => props.batch.batch_code ?? props.batch.batchCode)
const category = computed(() => props.batch.project_category ?? '纵向项目')
const batchIntroduction = computed(() => props.batch.batch_introduction?.trim() || '暂无项目批次介绍')
const applyStart = computed(() => props.batch.batch_apply_start ?? '')
const applyDeadline = computed(() => props.batch.batch_apply_deadline ?? '')
const guideFile = computed(() => props.batch.batch_guide_file)
const limitText = computed(() => {
  const limit = props.batch.batch_limit_count ?? 0

  return limit === 0 ? '不限（0）' : `${limit} 项`
})
const statusTagClass = computed(() => ({
  'detail-status-tag': true,
  applying: props.status === '申报中',
  pending: props.status === '未开始',
  ended: props.status === '已结束',
}))
</script>

<template>
  <div class="leader-batch-detail-page">
    <section class="leader-batch-summary-card" aria-label="批次概要">
      <div class="summary-copy">
        <span :class="statusTagClass">{{ status }}</span>
        <h1>{{ batchName }}</h1>
        <p>批次编号：{{ batchCode }}</p>
      </div>

      <div class="summary-deadline">
        <span>申报截止时间</span>
        <strong>{{ applyDeadline }}</strong>
        <em>{{ remainingText }}</em>
        <el-tooltip
          v-if="showApplyAction"
          :disabled="canApply || applied"
          :content="applyDisabledReason"
          placement="top"
        >
          <span class="summary-apply-button-wrap">
            <template v-if="applied">
              <span v-if="appliedProjectLabel" class="summary-applied-label" :title="appliedProjectLabel">
                已提交：{{ appliedProjectLabel }}
              </span>
              <el-button type="success" @click="emit('apply', batch)">
                查看我的申请
                <span aria-hidden="true">›</span>
              </el-button>
            </template>
            <el-button v-else type="primary" :disabled="!canApply" @click="emit('apply', batch)">
              立即申报
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </section>

    <section class="leader-batch-detail-card" aria-label="批次详情">
      <section class="detail-section">
        <div class="detail-section-title">
          <span class="detail-section-index">01</span>
          <div>
            <h2>批次基本信息</h2>
            <p>以下信息由PMO发布</p>
          </div>
        </div>

        <div class="detail-field-grid">
          <div class="detail-field">
            <span>批次名称</span>
            <strong>{{ batchName }}</strong>
          </div>
          <div class="detail-field">
            <span>批次编码</span>
            <strong>{{ batchCode }}</strong>
          </div>
          <div class="detail-field">
            <span>项目类别</span>
            <strong>{{ category }}</strong>
          </div>
          <div class="detail-field">
            <span>项目数量上限</span>
            <strong>{{ limitText }}</strong>
          </div>
        </div>

        <div class="detail-introduction-box">
          <span>项目批次介绍</span>
          <p>{{ batchIntroduction }}</p>
        </div>
      </section>

      <div class="detail-divider"></div>

      <section class="detail-section">
        <div class="detail-section-title">
          <span class="detail-section-index success">02</span>
          <div>
            <h2>申报时间</h2>
            <p>请在申报截止前完成项目填写与提交</p>
          </div>
        </div>

        <div class="apply-time-grid">
          <div class="apply-time-card start">
            <span class="time-mark">始</span>
            <div>
              <span>批次申报开始时间</span>
              <strong>{{ applyStart }}</strong>
            </div>
          </div>
          <div class="apply-time-card deadline">
            <span class="time-mark">止</span>
            <div>
              <span>批次申报截止时间</span>
              <strong>{{ applyDeadline }}</strong>
            </div>
          </div>
        </div>

        <LaunchPlanGantt />
      </section>

      <div class="detail-divider"></div>

      <section class="detail-section">
        <div class="detail-section-title">
          <span class="detail-section-index violet">03</span>
          <div>
            <h2>立项指南</h2>
            <p>申报前请先阅读本批次立项指南</p>
          </div>
        </div>

        <div v-if="guideFile" class="guide-file-row">
          <span class="guide-file-icon">
            <el-icon><Document /></el-icon>
          </span>
          <div class="guide-file-info">
            <strong>{{ guideFile.name }}</strong>
            <span>PDF · {{ guideFile.size }}</span>
          </div>
          <div class="guide-actions">
            <el-button @click="emit('previewGuide', batch)">预览</el-button>
            <el-button @click="emit('downloadGuide', batch)">下载</el-button>
          </div>
        </div>

        <el-empty v-else description="暂无立项指南文件" />
      </section>
    </section>
  </div>
</template>

<style scoped>
.leader-batch-detail-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
  gap: 18px;
}

.leader-batch-summary-card,
.leader-batch-detail-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.leader-batch-summary-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: center;
  gap: 24px;
  padding: 22px 28px;
}

.summary-copy h1 {
  margin: 12px 0 9px;
  color: #1f304a;
  font-size: 24px;
  line-height: 1.25;
  font-weight: 760;
}

.summary-copy p {
  margin: 0;
  color: #74839a;
  font-size: 13px;
}

.detail-status-tag {
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

.detail-status-tag::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.detail-status-tag.applying {
  color: #246de2;
  background: #eaf2ff;
}

.detail-status-tag.pending {
  color: #8b66cf;
  background: #f4efff;
}

.detail-status-tag.ended {
  color: #16835d;
  background: #e8f7f1;
}

.summary-deadline {
  min-width: 0;
  padding-left: 34px;
  border-left: 1px solid #e8edf5;
}

.summary-deadline span {
  display: block;
  color: #7b8799;
  font-size: 12px;
}

.summary-deadline strong {
  display: block;
  margin-top: 10px;
  color: #1f304a;
  font-size: 16px;
  font-weight: 760;
}

.summary-deadline em {
  display: inline-flex;
  margin-top: 9px;
  padding: 4px 12px;
  border-radius: 999px;
  color: #f06b2b;
  background: #fff0e4;
  font-size: 12px;
  font-style: normal;
  font-weight: 650;
}

.summary-apply-button-wrap {
  display: block;
  margin-top: 14px;
}

.summary-apply-button-wrap :deep(.el-button) {
  min-width: 116px;
}

.summary-applied-label {
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 10px;
  font-size: 12px;
  color: #35ad7b;
  vertical-align: middle;
}

.leader-batch-detail-card {
  padding: 26px 30px 24px;
}

.detail-section {
  min-width: 0;
}

.detail-section-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}

.detail-section-title h2 {
  margin: 0;
  color: #1f304a;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 760;
}

.detail-section-title p {
  margin: 6px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.detail-section-index {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  color: #246de2;
  background: #eef5ff;
  font-size: 12px;
  font-weight: 760;
}

.detail-section-index.success {
  color: #16835d;
  background: #e8f7f1;
}

.detail-section-index.violet {
  color: #7a55d8;
  background: #f3edff;
}

.detail-field-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 30px 62px;
}

.detail-field {
  min-width: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf1f7;
}

.detail-field span {
  display: block;
  color: #8a95a7;
  font-size: 12px;
}

.detail-field strong {
  display: block;
  overflow: hidden;
  margin-top: 10px;
  color: #203452;
  font-size: 15px;
  line-height: 1.35;
  font-weight: 730;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-introduction-box {
  margin-top: 22px;
  padding: 16px 18px;
  border: 1px solid #e4ecf7;
  border-radius: 12px;
  background: #f8fbff;
}

.detail-introduction-box span {
  display: block;
  color: #7c89a0;
  font-size: 12px;
}

.detail-introduction-box p {
  margin: 8px 0 0;
  color: #203452;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
}

.detail-divider {
  height: 1px;
  margin: 28px 0;
  background: #edf1f7;
}

.apply-time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 26px;
}

.apply-time-card {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
  padding: 17px 20px;
  border: 1px solid #e3ebf8;
  border-radius: 12px;
  background: #f9fbff;
}

.apply-time-card.deadline {
  border-color: #f0cdb9;
  background: #fffaf6;
}

.time-mark {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  color: #2e73e8;
  background: #eaf2ff;
  font-size: 12px;
  font-weight: 760;
}

.apply-time-card.deadline .time-mark {
  color: #d76827;
  background: #fff0e4;
}

.apply-time-card div {
  min-width: 0;
}

.apply-time-card span:not(.time-mark) {
  display: block;
  color: #8a95a7;
  font-size: 12px;
}

.apply-time-card strong {
  display: block;
  margin-top: 8px;
  color: #203452;
  font-size: 15px;
  font-weight: 760;
}

.guide-file-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e3ebf8;
  border-radius: 12px;
  background: #fbfdff;
}

.guide-file-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #2e73e8;
  background: #edf4ff;
}

.guide-file-info {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.guide-file-info strong {
  overflow: hidden;
  color: #203452;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guide-file-info span {
  color: #8a95a7;
  font-size: 12px;
}

.guide-actions {
  display: flex;
  gap: 8px;
}

.guide-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 1080px) {
  .leader-batch-summary-card {
    grid-template-columns: 1fr;
  }

  .summary-deadline {
    padding-left: 0;
    border-left: 0;
  }

  .detail-field-grid,
  .apply-time-grid {
    grid-template-columns: 1fr;
  }
}
</style>
