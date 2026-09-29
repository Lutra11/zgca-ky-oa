<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'
import AnnouncementRichTextEditor from './AnnouncementRichTextEditor.vue'
import type {
  AnnouncementAttachment,
  AnnouncementFormState,
  NoticeTemplate,
  ReceiverOption,
} from './types'

const form = defineModel<AnnouncementFormState>('form', { required: true })
const attachments = defineModel<AnnouncementAttachment[]>('attachments', { required: true })

const props = defineProps<{
  templates: NoticeTemplate[]
  receiverOptions: ReceiverOption[]
}>()

const emit = defineEmits<{
  previewTemplate: [template: NoticeTemplate]
}>()

const announcementTypes = ['项目评审结果公告', '项目推进通知', '材料提交通知', '其他公告']

const selectedTemplate = computed(() =>
  props.templates.find((template) => template.id === form.value.templateId),
)

function previewSelectedTemplate() {
  if (!selectedTemplate.value) {
    ElMessage.warning('请先选择通知模板')
    return
  }

  emit('previewTemplate', selectedTemplate.value)
}

function beforeUpload(file: UploadRawFile) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isValidType = ['pdf', 'doc', 'docx'].includes(extension)
  const isValidSize = file.size / 1024 / 1024 <= 50

  if (!isValidType) {
    ElMessage.warning('仅支持 PDF、DOC、DOCX 格式')
    return false
  }

  if (!isValidSize) {
    ElMessage.warning('单个附件大小不能超过 50MB')
    return false
  }

  return true
}

function handleFileChange(file: UploadFile) {
  if (!file.raw || !beforeUpload(file.raw)) {
    return
  }

  const exists = attachments.value.some((item) => item.name === file.name && item.size === formatFileSize(file.size ?? 0))

  if (exists) {
    return
  }

  attachments.value = [
    ...attachments.value,
    {
      id: `${file.uid}`,
      name: file.name,
      size: formatFileSize(file.size ?? 0),
      raw: file.raw,
    },
  ]
}

function removeAttachment(attachmentId: string) {
  attachments.value = attachments.value.filter((item) => item.id !== attachmentId)
}

function previewAttachment(attachment: AnnouncementAttachment) {
  ElMessage.info(`${attachment.name} 预览功能正在建设中`)
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`
}
</script>

<template>
  <article class="announcement-form-card">
    <header class="panel-header">
      <h3>公告内容配置</h3>
    </header>

    <el-form class="announcement-form" label-width="94px" :model="form">
      <el-form-item label="公告标题" required>
        <el-input
          v-model="form.title"
          maxlength="100"
          show-word-limit
          placeholder="请输入公告标题"
        />
      </el-form-item>

      <el-form-item label="公告类型" required>
        <el-select v-model="form.type" placeholder="请选择公告类型">
          <el-option v-for="type in announcementTypes" :key="type" :label="type" :value="type" />
        </el-select>
      </el-form-item>

      <el-form-item label="通知模板" required>
        <div class="template-select-row">
          <el-select v-model="form.templateId" placeholder="请选择通知模板">
            <el-option
              v-for="template in templates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
          </el-select>
          <el-button plain type="primary" @click="previewSelectedTemplate">预览</el-button>
        </div>
      </el-form-item>

      <el-form-item label="接收对象" required>
        <el-select
          v-model="form.receiverTypes"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择接收对象"
        >
          <el-option
            v-for="option in receiverOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="公告摘要">
        <el-input
          v-model="form.summary"
          type="textarea"
          maxlength="200"
          show-word-limit
          :rows="3"
          placeholder="请输入公告摘要"
        />
      </el-form-item>

      <el-form-item label="公告正文" required>
        <AnnouncementRichTextEditor v-model="form.body" />
      </el-form-item>

      <el-form-item label="附件上传">
        <div class="upload-area">
          <el-upload
            drag
            multiple
            :auto-upload="false"
            :show-file-list="false"
            accept=".pdf,.doc,.docx"
            :on-change="handleFileChange"
          >
            <div class="upload-copy">
              <strong>点击或拖拽文件到此处上传</strong>
              <span>支持 PDF / DOC / DOCX，单个文件不超过 50MB</span>
            </div>
          </el-upload>

          <div v-if="attachments.length" class="attachment-list">
            <div v-for="attachment in attachments" :key="attachment.id" class="attachment-item">
              <div>
                <strong>{{ attachment.name }}</strong>
                <span>{{ attachment.size }}</span>
              </div>
              <button type="button" @click="previewAttachment(attachment)">预览</button>
              <button type="button" @click="removeAttachment(attachment.id)">删除</button>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="发布设置">
        <div class="switch-row">
          <el-switch v-model="form.pinned" />
          <span>是否置顶</span>
          <el-switch v-model="form.readRequired" />
          <span>需要已读确认</span>
        </div>
      </el-form-item>
    </el-form>
  </article>
</template>

<style scoped>
.announcement-form-card {
  min-width: 0;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.panel-header h3 {
  margin: 0 0 12px;
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 820;
}

.announcement-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.announcement-form :deep(.el-form-item__label) {
  color: #424245;
  font-weight: 760;
}

.announcement-form :deep(.el-input__wrapper),
.announcement-form :deep(.el-select__wrapper),
.announcement-form :deep(.el-textarea__inner) {
  border-radius: 9px;
  box-shadow: inset 0 0 0 1px rgba(29, 29, 31, 0.08);
}

.template-select-row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 86px;
  gap: 10px;
}

.upload-area {
  width: 100%;
  display: grid;
  gap: 10px;
}

.upload-area :deep(.el-upload),
.upload-area :deep(.el-upload-dragger) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 18px;
  border-radius: 10px;
  background: #fbfdff;
}

.upload-copy {
  display: grid;
  gap: 6px;
  color: #0a84ff;
  text-align: center;
}

.upload-copy span {
  color: #86868b;
  font-size: 12px;
}

.attachment-list {
  display: grid;
  gap: 8px;
}

.attachment-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px 42px;
  gap: 8px;
  align-items: center;
  border-radius: 10px;
  padding: 8px 10px;
  background: #f8fbff;
}

.attachment-item div {
  min-width: 0;
}

.attachment-item strong,
.attachment-item span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-item strong {
  color: #1d1d1f;
  font-size: 13px;
}

.attachment-item span {
  margin-top: 3px;
  color: #86868b;
  font-size: 12px;
}

.attachment-item button {
  border: 0;
  color: #0a84ff;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 760;
}

.switch-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: #424245;
  font-size: 13px;
  font-weight: 760;
}
</style>
