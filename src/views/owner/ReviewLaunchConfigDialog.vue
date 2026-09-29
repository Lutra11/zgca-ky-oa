<script setup lang="ts">
import { computed, reactive, shallowRef, useTemplateRef } from 'vue'
import { InfoFilled, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, GetDisabledHours, GetDisabledMinutes } from 'element-plus'
import templateDataset from '../../dataset/template.json'

type TemplateCategory = '评审标准模板' | '通知模板'

interface TemplateItem {
  id: string
  name: string
  templateNo: string
  category: TemplateCategory
  applicableDepartment: string
  creator: string
  createdAt: string
  updatedAt: string
  status: string
  usageCount: number
  description: string
  workflowNodes: string[]
  fields: string[]
}

interface ReviewLaunchConfigForm {
  reviewName: string
  reviewStart: string
  reviewEnd: string
  performanceStart: string
  performanceEnd: string
  reviewTemplateId: string
  noticeTemplateId: string
}

interface ReviewLaunchConfigPayload {
  reviewName: string
  reviewPeriod: [string, string]
  performanceReviewPeriod: [string, string]
  reviewTemplateId: string
  noticeTemplateId: string
}

defineProps<{
  selectedCount: number
}>()

const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  confirm: [payload: ReviewLaunchConfigPayload]
}>()

const templates = templateDataset as TemplateItem[]
const reviewConfigFormRef = useTemplateRef<FormInstance>('reviewConfigFormRef')
const previewTemplate = shallowRef<TemplateItem | null>(null)
const isPreviewVisible = shallowRef(false)

const reviewTemplateOptions = computed(() => getEnabledTemplatesByCategory('评审标准模板'))
const noticeTemplateOptions = computed(() => getEnabledTemplatesByCategory('通知模板'))

const form = reactive<ReviewLaunchConfigForm>({
  reviewName: '2026年第一次季度推进会',
  reviewStart: '',
  reviewEnd: '',
  performanceStart: '',
  performanceEnd: '',
  reviewTemplateId: getDefaultTemplateId('评审标准模板'),
  noticeTemplateId: getDefaultTemplateId('通知模板'),
})

const rules = reactive<FormRules<ReviewLaunchConfigForm>>({
  reviewName: [
    { required: true, message: '请输入评审名称', trigger: 'blur' },
    { max: 50, message: '评审名称不能超过 50 个字符', trigger: 'blur' },
  ],
  reviewStart: [{ validator: validateReviewStart, trigger: 'change' }],
  reviewEnd: [{ validator: validateReviewEnd, trigger: 'change' }],
  performanceStart: [{ validator: validatePerformanceStart, trigger: 'change' }],
  performanceEnd: [{ validator: validatePerformanceEnd, trigger: 'change' }],
  reviewTemplateId: [{ required: true, message: '请选择评审模板', trigger: 'change' }],
  noticeTemplateId: [{ required: true, message: '请选择通知模板', trigger: 'change' }],
})

const disabledPastDate = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return date.getTime() < today.getTime()
}

const disabledPastHours: GetDisabledHours = (_role, comparingDate) => {
  if (!isSameDate(comparingDate?.toDate(), new Date())) {
    return []
  }

  return createNumberRange(0, new Date().getHours())
}

const disabledPastMinutes: GetDisabledMinutes = (hour, _role, comparingDate) => {
  const now = new Date()

  if (!isSameDate(comparingDate?.toDate(), now)) {
    return []
  }

  if (hour < now.getHours()) {
    return createNumberRange(0, 60)
  }

  if (hour === now.getHours()) {
    return createNumberRange(0, now.getMinutes())
  }

  return []
}

async function confirmNextStep() {
  const formInstance = reviewConfigFormRef.value

  if (!formInstance) {
    return
  }

  try {
    await formInstance.validate()
  } catch {
    return
  }

  emit('confirm', {
    reviewName: form.reviewName.trim(),
    reviewPeriod: [form.reviewStart, form.reviewEnd],
    performanceReviewPeriod: [form.performanceStart, form.performanceEnd],
    reviewTemplateId: form.reviewTemplateId,
    noticeTemplateId: form.noticeTemplateId,
  })

  visible.value = false
}

function requestCancel() {
  visible.value = false
}

function resetForm() {
  form.reviewName = '2026年第一次季度推进会'
  form.reviewStart = ''
  form.reviewEnd = ''
  form.performanceStart = ''
  form.performanceEnd = ''
  form.reviewTemplateId = getDefaultTemplateId('评审标准模板')
  form.noticeTemplateId = getDefaultTemplateId('通知模板')
  reviewConfigFormRef.value?.clearValidate()
}

function openTemplatePreview(templateId: string, templateLabel: string) {
  const selectedTemplate = templates.find((template) => template.id === templateId)

  if (!selectedTemplate) {
    ElMessage.warning(`请先选择${templateLabel}`)
    return
  }

  previewTemplate.value = selectedTemplate
  isPreviewVisible.value = true
}

function getEnabledTemplatesByCategory(category: TemplateCategory) {
  return templates.filter((template) => template.category === category && template.status === '启用')
}

function getDefaultTemplateId(category: TemplateCategory) {
  return getEnabledTemplatesByCategory(category)[0]?.id ?? ''
}

function validateReviewStart(_rule: unknown, value: string, callback: (error?: Error) => void) {
  validateDateTimeStart(value, form.reviewEnd, '评审周期开始时间', callback)
}

function validateReviewEnd(_rule: unknown, value: string, callback: (error?: Error) => void) {
  validateDateTimeEnd(form.reviewStart, value, '评审周期结束时间', callback)
}

function validatePerformanceStart(
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void,
) {
  validateDateTimeStart(value, form.performanceEnd, '学生绩效和360评审周期开始时间', callback)
}

function validatePerformanceEnd(_rule: unknown, value: string, callback: (error?: Error) => void) {
  validateDateTimeEnd(form.performanceStart, value, '学生绩效和360评审周期结束时间', callback)
}

function validateDateTimeStart(
  startValue: string,
  endValue: string,
  label: string,
  callback: (error?: Error) => void,
) {
  const baseError = getDateTimeError(startValue, label)

  if (baseError) {
    callback(new Error(baseError))
    return
  }

  if (endValue && parseDateTimeValue(startValue) > parseDateTimeValue(endValue)) {
    callback(new Error('开始时间不能晚于结束时间'))
    return
  }

  callback()
}

function validateDateTimeEnd(
  startValue: string,
  endValue: string,
  label: string,
  callback: (error?: Error) => void,
) {
  const baseError = getDateTimeError(endValue, label)

  if (baseError) {
    callback(new Error(baseError))
    return
  }

  if (startValue && parseDateTimeValue(endValue) < parseDateTimeValue(startValue)) {
    callback(new Error('结束时间不能早于开始时间'))
    return
  }

  callback()
}

function getDateTimeError(value: string, label: string) {
  if (!value) {
    return `请选择${label}`
  }

  const timestamp = parseDateTimeValue(value)

  if (Number.isNaN(timestamp)) {
    return '请选择有效的日期与时间'
  }

  if (timestamp < getCurrentMinuteTimestamp()) {
    return '不能选择早于当前时间的日期与时间'
  }

  return ''
}

function parseDateTimeValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value)

  if (!match) {
    return Number.NaN
  }

  const [, year, month, day, hour, minute] = match.map(Number)
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime()
}

function getCurrentMinuteTimestamp() {
  const now = new Date()
  now.setSeconds(0, 0)

  return now.getTime()
}

function isSameDate(date: Date | undefined, target: Date) {
  if (!date) {
    return false
  }

  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  )
}

function createNumberRange(start: number, end: number) {
  return Array.from({ length: Math.max(end - start, 0) }, (_item, index) => start + index)
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="review-config-dialog"
    width="680px"
    :close-on-click-modal="false"
    append-to-body
    @closed="resetForm"
  >
    <template #header>
      <div class="dialog-heading">
        <div>
          <h3 class="dialog-title">发起评审配置</h3>
          <p class="dialog-summary">请先完成评审基本信息配置，确认后进入下一步。</p>
        </div>
        <span class="dialog-preview-tip">
          <el-icon><InfoFilled /></el-icon>
          模板内容支持预览
        </span>
      </div>
    </template>

    <el-form
      ref="reviewConfigFormRef"
      class="review-config-form"
      :model="form"
      :rules="rules"
      label-position="left"
      label-width="124px"
      status-icon
    >
      <el-form-item label="评审名称" prop="reviewName" required>
        <el-input v-model="form.reviewName" maxlength="50" clearable />
      </el-form-item>

      <el-form-item label="评审周期" required>
        <div class="range-field">
          <el-form-item class="range-date-item" prop="reviewStart">
            <el-date-picker
              v-model="form.reviewStart"
              type="datetime"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              date-format="YYYY-MM-DD"
              time-format="HH:mm"
              placeholder="开始时间"
              :disabled-date="disabledPastDate"
              :disabled-hours="disabledPastHours"
              :disabled-minutes="disabledPastMinutes"
              clearable
            />
          </el-form-item>
          <span class="range-separator">至</span>
          <el-form-item class="range-date-item" prop="reviewEnd">
            <el-date-picker
              v-model="form.reviewEnd"
              type="datetime"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              date-format="YYYY-MM-DD"
              time-format="HH:mm"
              placeholder="结束时间"
              :disabled-date="disabledPastDate"
              :disabled-hours="disabledPastHours"
              :disabled-minutes="disabledPastMinutes"
              clearable
            />
          </el-form-item>
          <p class="field-help">仅支持选择不早于当前时间的日期与时间，精确到分钟</p>
        </div>
      </el-form-item>

      <el-form-item required>
        <template #label>
          <span class="multiline-label">学生绩效和<br />360评审周期</span>
        </template>
        <div class="range-field">
          <el-form-item class="range-date-item" prop="performanceStart">
            <el-date-picker
              v-model="form.performanceStart"
              type="datetime"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              date-format="YYYY-MM-DD"
              time-format="HH:mm"
              placeholder="开始时间"
              :disabled-date="disabledPastDate"
              :disabled-hours="disabledPastHours"
              :disabled-minutes="disabledPastMinutes"
              clearable
            />
          </el-form-item>
          <span class="range-separator">至</span>
          <el-form-item class="range-date-item" prop="performanceEnd">
            <el-date-picker
              v-model="form.performanceEnd"
              type="datetime"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              date-format="YYYY-MM-DD"
              time-format="HH:mm"
              placeholder="结束时间"
              :disabled-date="disabledPastDate"
              :disabled-hours="disabledPastHours"
              :disabled-minutes="disabledPastMinutes"
              clearable
            />
          </el-form-item>
          <p class="field-help">仅支持选择不早于当前时间的日期与时间，精确到分钟</p>
        </div>
      </el-form-item>

      <el-form-item label="评审模板" prop="reviewTemplateId" required>
        <div class="template-select-row">
          <el-select v-model="form.reviewTemplateId" placeholder="请选择评审模板" clearable>
            <el-option
              v-for="template in reviewTemplateOptions"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
          <el-button
            :icon="View"
            plain
            @click="openTemplatePreview(form.reviewTemplateId, '评审模板')"
          >
            预览
          </el-button>
          <p class="field-help">可选择已启用的评审标准模板</p>
        </div>
      </el-form-item>

      <el-form-item label="通知模板" prop="noticeTemplateId" required>
        <div class="template-select-row">
          <el-select v-model="form.noticeTemplateId" placeholder="请选择通知模板" clearable>
            <el-option
              v-for="template in noticeTemplateOptions"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
          <el-button
            :icon="View"
            plain
            @click="openTemplatePreview(form.noticeTemplateId, '通知模板')"
          >
            预览
          </el-button>
          <p class="field-help">可选择已启用的通知模板</p>
        </div>
      </el-form-item>

      <div class="review-config-note">
        <el-icon><InfoFilled /></el-icon>
        确认配置后，将基于所选 {{ selectedCount }} 个参评项目发起评审流程。
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="requestCancel">取消</el-button>
        <el-button type="primary" @click="confirmNextStep">确认并下一步</el-button>
      </div>
    </template>

    <el-dialog
      v-model="isPreviewVisible"
      class="review-template-preview-dialog"
      width="720px"
      title="模板预览"
      append-to-body
    >
      <article v-if="previewTemplate" class="template-preview-content">
        <header class="template-preview-heading">
          <div>
            <h4>{{ previewTemplate.name }}</h4>
            <p>{{ previewTemplate.templateNo }} · {{ previewTemplate.category }}</p>
          </div>
          <span class="template-status">{{ previewTemplate.status }}</span>
        </header>

        <dl class="template-preview-info">
          <div>
            <dt>适用范围</dt>
            <dd>{{ previewTemplate.applicableDepartment }}</dd>
          </div>
          <div>
            <dt>创建人</dt>
            <dd>{{ previewTemplate.creator }}</dd>
          </div>
          <div>
            <dt>最后更新</dt>
            <dd>{{ previewTemplate.updatedAt }}</dd>
          </div>
        </dl>

        <section class="template-preview-section">
          <h5>模板说明</h5>
          <p>{{ previewTemplate.description }}</p>
        </section>

        <section class="template-preview-section">
          <h5>字段内容</h5>
          <div class="template-field-tags">
            <span v-for="field in previewTemplate.fields" :key="field">{{ field }}</span>
          </div>
        </section>

        <section class="template-preview-section">
          <h5>流程节点</h5>
          <ol class="template-flow-list">
            <li v-for="node in previewTemplate.workflowNodes" :key="node">{{ node }}</li>
          </ol>
        </section>
      </article>
    </el-dialog>
  </el-dialog>
</template>

<style scoped>
.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.dialog-title,
.dialog-summary,
.field-help,
.template-preview-heading h4,
.template-preview-heading p,
.template-preview-section h5,
.template-preview-section p,
.template-preview-info,
.template-preview-info dd,
.template-flow-list {
  margin: 0;
}

.dialog-title {
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 780;
  letter-spacing: 0;
}

.dialog-summary {
  margin-top: 6px;
  color: #6e6e73;
  font-size: 13px;
}

.dialog-preview-tip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  border-radius: 8px;
  padding: 0 12px;
  color: #286ac8;
  background: #eef6ff;
  font-size: 13px;
  font-weight: 720;
  white-space: nowrap;
}

.review-config-form {
  display: grid;
  gap: 4px;
  padding-top: 14px;
}

.review-config-form :deep(.el-form-item__label) {
  color: #1d1d1f;
  font-weight: 760;
}

.review-config-form :deep(.el-input__wrapper),
.review-config-form :deep(.el-select__wrapper) {
  min-height: 40px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(29, 29, 31, 0.08);
}

.review-config-form :deep(.el-input__wrapper.is-focus),
.review-config-form :deep(.el-select__wrapper.is-focused) {
  box-shadow:
    inset 0 0 0 1px rgba(0, 113, 227, 0.36),
    0 10px 24px rgba(0, 113, 227, 0.08);
}

.multiline-label {
  display: inline-block;
  line-height: 1.28;
}

.range-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 26px minmax(0, 1fr);
  gap: 12px;
  width: 100%;
}

.range-date-item {
  margin-bottom: 0;
}

.range-date-item :deep(.el-date-editor.el-input),
.range-date-item :deep(.el-input) {
  width: 100%;
}

.range-separator {
  display: grid;
  place-items: center;
  min-height: 40px;
  color: #424245;
  font-weight: 760;
}

.field-help {
  grid-column: 1 / -1;
  color: #8a93a3;
  font-size: 12px;
  line-height: 1.5;
}

.template-select-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  gap: 14px;
  width: 100%;
}

.template-select-row :deep(.el-button) {
  height: 40px;
  border-radius: 8px;
  font-weight: 760;
}

.review-config-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  border-radius: 8px;
  padding: 14px 16px;
  color: #286ac8;
  background: linear-gradient(90deg, #eef6ff, #f5faff);
  font-size: 13px;
  font-weight: 720;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  min-width: 104px;
  height: 40px;
  border-radius: 8px;
  font-weight: 760;
}

.template-preview-content {
  display: grid;
  gap: 18px;
}

.template-preview-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  border-radius: 8px;
  padding: 16px;
  background: #f8fbff;
}

.template-preview-heading h4 {
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 800;
}

.template-preview-heading p {
  margin-top: 6px;
  color: #86868b;
  font-size: 13px;
}

.template-status {
  flex: none;
  border-radius: 999px;
  padding: 4px 10px;
  color: #1f9d55;
  background: #e9f8ef;
  font-size: 12px;
  font-weight: 760;
}

.template-preview-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.template-preview-info div {
  border-radius: 8px;
  padding: 12px;
  background: #f5f5f7;
}

.template-preview-info dt {
  color: #86868b;
  font-size: 12px;
}

.template-preview-info dd {
  margin-top: 6px;
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 720;
}

.template-preview-section {
  display: grid;
  gap: 10px;
}

.template-preview-section h5 {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 800;
}

.template-preview-section p,
.template-flow-list {
  color: #424245;
  font-size: 14px;
  line-height: 1.8;
}

.template-field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-field-tags span {
  border-radius: 999px;
  padding: 6px 10px;
  color: #286ac8;
  background: #eef6ff;
  font-size: 12px;
  font-weight: 720;
}

.template-flow-list {
  display: grid;
  gap: 8px;
  padding-left: 20px;
}

@media (max-width: 760px) {
  .dialog-heading,
  .template-preview-heading {
    flex-direction: column;
  }

  .range-field,
  .template-select-row,
  .template-preview-info {
    grid-template-columns: 1fr;
  }

  .range-separator {
    min-height: 16px;
  }
}
</style>
