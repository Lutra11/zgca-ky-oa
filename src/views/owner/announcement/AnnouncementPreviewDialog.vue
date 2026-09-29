<script setup lang="ts">
import type {
  AnnouncementAttachment,
  AnnouncementFormState,
  AnnouncementProject,
  PublishMode,
} from './types'

defineProps<{
  form: AnnouncementFormState
  mode: PublishMode
  publisherUnit: string
  projects: AnnouncementProject[]
  receiverLabels: string[]
  facultyCount: number
  projectCount: number
  receiverCount: number
  attachments: AnnouncementAttachment[]
}>()

const visible = defineModel<boolean>({ required: true })

function formatNow() {
  const date = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<template>
  <el-dialog v-model="visible" title="公告预览" width="860px" append-to-body class="announcement-preview-dialog">
    <article class="preview-document">
      <header class="preview-header">
        <h1>{{ form.title || '未命名公告' }}</h1>
        <p>
          <span>发布单位：{{ publisherUnit }}</span>
          <span>发布时间：{{ formatNow() }}</span>
          <span>发布方式：{{ mode === 'unified' ? '统一发布' : '独立发布' }}</span>
        </p>
      </header>

      <section class="preview-summary">
        <div>
          <span>发布范围</span>
          <strong>{{ facultyCount }} 个学部 / {{ projectCount }} 个项目</strong>
        </div>
        <div>
          <span>接收对象</span>
          <strong>{{ receiverCount }} 人</strong>
        </div>
        <div>
          <span>接收类型</span>
          <strong>{{ receiverLabels.join('、') || '-' }}</strong>
        </div>
      </section>

      <section class="preview-section">
        <h2>公告摘要</h2>
        <p>{{ form.summary || '暂无摘要' }}</p>
      </section>

      <section class="preview-section">
        <h2>公告正文</h2>
        <div class="preview-content" v-html="form.body"></div>
      </section>

      <section class="preview-section">
        <h2>关联项目</h2>
        <div class="project-list">
          <span v-for="project in projects" :key="project.id">
            {{ project.projectCode }} {{ project.projectName }}
          </span>
        </div>
      </section>

      <section class="preview-section">
        <h2>附件</h2>
        <p v-if="!attachments.length">暂无附件</p>
        <div v-else class="attachment-list">
          <span v-for="attachment in attachments" :key="attachment.id">
            {{ attachment.name }}（{{ attachment.size }}）
          </span>
        </div>
      </section>
    </article>
  </el-dialog>
</template>

<style scoped>
.preview-document {
  color: #1d1d1f;
}

.preview-header {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
  text-align: center;
}

.preview-header h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 820;
}

.preview-header p {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  margin: 10px 0 0;
  color: #6e6e73;
  font-size: 13px;
}

.preview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.preview-summary div {
  display: grid;
  gap: 6px;
  border-radius: 10px;
  padding: 12px;
  background: #f8fbff;
}

.preview-summary span {
  color: #86868b;
  font-size: 12px;
  font-weight: 760;
}

.preview-summary strong {
  color: #0a84ff;
  font-size: 14px;
}

.preview-section {
  margin-top: 16px;
}

.preview-section h2 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 820;
}

.preview-section p {
  margin: 0;
  color: #424245;
  line-height: 1.7;
}

.preview-content {
  min-height: 120px;
  border-radius: 10px;
  padding: 14px;
  background: #fbfdff;
  line-height: 1.75;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 8px;
  border: 1px solid #dfe5ee;
}

.project-list,
.attachment-list {
  display: grid;
  gap: 6px;
}

.project-list span,
.attachment-list span {
  border-radius: 8px;
  padding: 8px 10px;
  color: #424245;
  background: #f8fbff;
  font-size: 13px;
}

@media (max-width: 760px) {
  .preview-summary {
    grid-template-columns: 1fr;
  }
}
</style>
