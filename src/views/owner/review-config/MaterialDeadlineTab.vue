<script setup lang="ts">
import { computed } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { AssessmentPeriod, MaterialDeadlineSetting, ReviewBaseConfig } from './types'

const setting = defineModel<MaterialDeadlineSetting>({ required: true })

const props = defineProps<{
  assessmentPeriods: AssessmentPeriod[]
  baseConfig: ReviewBaseConfig
}>()

const hasReviewMeetingTime = computed(
  () => Boolean(props.baseConfig.reviewPeriod[0]) && Boolean(props.baseConfig.reviewPeriod[1]),
)

const deadlinePreviews = computed(() =>
  props.assessmentPeriods
    .filter((period) => period.name && period.endDate)
    .map((period) => ({
      id: period.id,
      name: period.name,
      deadline: getDeadlinePreview(period.endDate, setting.value.daysBeforeMeeting),
    })),
)

async function validateAndSave(showMessage = true) {
  if (!Number.isInteger(setting.value.daysBeforeMeeting) || setting.value.daysBeforeMeeting < 1) {
    ElMessage.error('材料截止时间提前天数必须为 1 至 30 的整数')
    return false
  }

  if (!hasReviewMeetingTime.value) {
    ElMessage.error('基础配置中缺少评审会时间，无法完成配置')
    return false
  }

  if (showMessage) {
    ElMessage.success('材料提交截止时间已保存')
  }
  return true
}

function getDeadlinePreview(endDate: string, daysBefore: number) {
  const date = parseDateOnly(endDate)
  date.setDate(date.getDate() - daysBefore)

  return `${formatDate(date)} 23:59`
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

defineExpose({ validateAndSave })
</script>

<template>
  <article class="config-card">
    <header class="card-header">
      <div class="title-row">
        <span class="title-icon">
          <el-icon><Clock /></el-icon>
        </span>
        <h3>材料提交截止时间</h3>
      </div>

      <el-button type="primary" @click="validateAndSave">保存</el-button>
    </header>

    <section class="deadline-setting">
      <span class="clock-mark">
        <el-icon><Clock /></el-icon>
      </span>

      <div class="deadline-control">
        <span>材料截止时间设为评审会前</span>
        <el-input-number
          v-model="setting.daysBeforeMeeting"
          :min="1"
          :max="30"
          :precision="0"
        />
        <span>天</span>
      </div>

      <p>系统将自动根据评审会时间计算截止日期。</p>
    </section>

    <el-alert
      v-if="!hasReviewMeetingTime"
      class="deadline-alert"
      title="基础配置中缺少评审会日期，暂不能完成配置。"
      type="warning"
      :closable="false"
      show-icon
    />

    <section class="preview-card">
      <h4>截止时间预览</h4>
      <div class="preview-list">
        <div v-for="item in deadlinePreviews" :key="item.id" class="preview-item">
          <span>{{ item.name }}</span>
          <strong>{{ item.deadline }}</strong>
        </div>
      </div>
      <el-empty v-if="!deadlinePreviews.length" description="请先完善项目考核周期" :image-size="72" />
    </section>
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
.deadline-setting,
.deadline-control,
.preview-item {
  display: flex;
  align-items: center;
}

.card-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
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

.title-icon,
.clock-mark {
  display: grid;
  place-items: center;
  color: #0a84ff;
  background: #e8f2ff;
}

.title-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.deadline-setting {
  justify-content: space-between;
  gap: 24px;
  border: 1px solid rgba(10, 132, 255, 0.16);
  border-radius: 12px;
  padding: 34px;
  background: linear-gradient(135deg, #f2f8ff 0%, #fbfdff 100%);
}

.clock-mark {
  flex: 0 0 auto;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  font-size: 24px;
}

.deadline-control {
  gap: 12px;
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 820;
}

.deadline-control :deep(.el-input-number) {
  width: 132px;
}

.deadline-setting p {
  margin: 0;
  color: #6e6e73;
  font-size: 14px;
}

.deadline-alert {
  margin-top: 14px;
}

.preview-card {
  margin-top: 16px;
  border: 1px solid rgba(29, 29, 31, 0.07);
  border-radius: 12px;
  padding: 16px;
  background: #fff;
}

.preview-card h4 {
  margin: 0 0 12px;
  color: #1d1d1f;
  font-size: 15px;
}

.preview-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.preview-item {
  justify-content: space-between;
  gap: 14px;
  border-radius: 10px;
  padding: 12px 14px;
  background: #f6f9fd;
}

.preview-item span {
  color: #424245;
  font-weight: 760;
}

.preview-item strong {
  color: #0a84ff;
}

@media (max-width: 1080px) {
  .deadline-setting {
    align-items: flex-start;
    flex-direction: column;
  }

  .preview-list {
    grid-template-columns: 1fr;
  }
}
</style>
