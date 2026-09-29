<script setup lang="ts">
import { computed } from 'vue'
import { Delete, Document, Download, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'

interface TemplateAttachment {
  id: string
  name: string
  size: string
  uploadedAt: string
  kind: 'pdf' | 'word'
  raw?: File
}

const attachments = defineModel<TemplateAttachment[]>({ required: true })

const acceptedExtensions = ['pdf', 'doc', 'docx']

const uploadedCount = computed(() => attachments.value.length)

function handleUploadChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw

  if (!rawFile) {
    return
  }

  const extension = getFileExtension(rawFile.name)

  if (!extension || !acceptedExtensions.includes(extension)) {
    ElMessage.warning('仅支持上传 PDF、DOC、DOCX 文件')
    return
  }

  if (rawFile.size > 50 * 1024 * 1024) {
    ElMessage.warning('附件大小不能超过 50MB')
    return
  }

  attachments.value = [
    ...attachments.value,
    {
      id: `${Date.now()}-${rawFile.name}`,
      name: rawFile.name,
      size: formatFileSize(rawFile.size),
      uploadedAt: formatDateTime(new Date()),
      kind: extension === 'pdf' ? 'pdf' : 'word',
      raw: rawFile,
    },
  ]

  ElMessage.success('附件已添加')
}

function removeAttachment(id: string) {
  attachments.value = attachments.value.filter((attachment) => attachment.id !== id)
}

function downloadAttachment(attachment: TemplateAttachment) {
  if (!attachment.raw) {
    ElMessage.info('原型附件暂无本地文件可下载')
    return
  }

  const url = URL.createObjectURL(attachment.raw)
  const link = document.createElement('a')
  link.href = url
  link.download = attachment.name
  link.click()
  URL.revokeObjectURL(url)
}

function downloadAll() {
  if (!attachments.value.length) {
    ElMessage.info('暂无附件可下载')
    return
  }

  attachments.value.forEach(downloadAttachment)
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase()
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<template>
  <aside class="attachment-panel" aria-label="附件管理">
    <header class="attachment-header">
      <h3>附件管理</h3>
    </header>

    <el-upload
      class="attachment-upload"
      drag
      action="#"
      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleUploadChange"
    >
      <div class="upload-box">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <strong>上传附件</strong>
        <span>支持 PDF、Word 文件，大小不超过 50MB</span>
        <em>PDF / DOC / DOCX</em>
      </div>
    </el-upload>

    <section class="attachment-list" aria-label="已上传附件">
      <div class="attachment-list-header">
        <h4>已上传（{{ uploadedCount }}）</h4>
        <button type="button" @click="downloadAll">全部下载</button>
      </div>

      <div class="attachment-items">
        <article
          v-for="attachment in attachments"
          :key="attachment.id"
          class="attachment-item"
        >
          <div class="attachment-file-icon" :class="`attachment-${attachment.kind}`">
            <el-icon><Document /></el-icon>
          </div>
          <div class="attachment-info">
            <strong>{{ attachment.name }}</strong>
            <span>{{ attachment.size }} · {{ attachment.uploadedAt }}</span>
          </div>
          <button type="button" title="下载" @click="downloadAttachment(attachment)">
            <el-icon><Download /></el-icon>
          </button>
          <button type="button" title="删除" @click="removeAttachment(attachment.id)">
            <el-icon><Delete /></el-icon>
          </button>
        </article>
      </div>
    </section>

    <p class="attachment-note">附件将随模板发布，供使用者参考下载。</p>
  </aside>
</template>

<style scoped>
.attachment-panel {
  position: sticky;
  top: 96px;
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.attachment-header {
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
}

.attachment-header h3,
.attachment-list-header h4,
.attachment-note {
  margin: 0;
}

.attachment-header h3 {
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 780;
}

.attachment-upload :deep(.el-upload),
.attachment-upload :deep(.el-upload-dragger) {
  width: 100%;
}

.attachment-upload :deep(.el-upload-dragger) {
  padding: 22px 18px;
  border-color: rgba(0, 113, 227, 0.26);
  border-radius: 8px;
  background: linear-gradient(180deg, #fbfdff, #f7fbff);
}

.upload-box {
  display: grid;
  justify-items: center;
  gap: 8px;
  color: #6e6e73;
}

.upload-icon {
  color: #0071e3;
  font-size: 34px;
}

.upload-box strong {
  color: #0071e3;
  font-size: 16px;
}

.upload-box span {
  max-width: 220px;
  line-height: 1.55;
}

.upload-box em {
  padding: 4px 12px;
  border: 1px solid rgba(0, 113, 227, 0.18);
  border-radius: 999px;
  color: #0071e3;
  background: #eef6ff;
  font-style: normal;
  font-weight: 760;
}

.attachment-list {
  display: grid;
  gap: 12px;
}

.attachment-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.attachment-list-header h4 {
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 780;
}

.attachment-list-header button,
.attachment-item button {
  border: 0;
  color: #0071e3;
  background: transparent;
  cursor: pointer;
  font-weight: 760;
}

.attachment-items {
  display: grid;
  gap: 10px;
}

.attachment-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 28px 28px;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 8px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.attachment-item:hover {
  border-color: rgba(0, 113, 227, 0.2);
  box-shadow: 0 12px 26px rgba(0, 113, 227, 0.08);
  transform: translateY(-1px);
}

.attachment-file-icon {
  width: 38px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #fff;
}

.attachment-pdf {
  background: linear-gradient(145deg, #ff3b30, #ff6b5f);
}

.attachment-word {
  background: linear-gradient(145deg, #0071e3, #67b7ff);
}

.attachment-info {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.attachment-info strong,
.attachment-info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-info strong {
  color: #1d1d1f;
  font-size: 14px;
}

.attachment-info span {
  color: #6e6e73;
  font-size: 12px;
}

.attachment-item button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #8a93a3;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.attachment-item button:hover {
  color: #0066cc;
  background: rgba(0, 113, 227, 0.08);
}

.attachment-note {
  padding: 16px;
  border-radius: 8px;
  color: #6e6e73;
  background: #f4f7fb;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1180px) {
  .attachment-panel {
    position: static;
  }
}
</style>
