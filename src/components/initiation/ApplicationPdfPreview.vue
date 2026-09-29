<script setup lang="ts">
import { computed, ref } from 'vue'
import type { InitiationBatchMockRow } from '../../dataset/initiationProjectsMock'
import {
  formatFillMonth,
  type ApplicationPreviewStatus,
  type ApplicationWordFileState,
  type ProjectApplicationForm,
} from '../../dataset/projectApplicationMock'

const props = withDefaults(
  defineProps<{
    batch: InitiationBatchMockRow
    form: ProjectApplicationForm
    wordFile?: ApplicationWordFileState | null
    signatureDataUrl: string
    previewStatus: ApplicationPreviewStatus
    generating?: boolean
    totalPages?: number
  }>(),
  {
    wordFile: null,
    generating: false,
    totalPages: 18,
  },
)

const emit = defineEmits<{
  preview: []
  download: []
}>()

const activePage = ref<'cover' | 'signature'>('cover')
const fullscreenVisible = ref(false)

const isSynced = computed(() => props.previewStatus === 'SYNCED')
const fillMonth = computed(() => formatFillMonth(props.form.fill_date) || 'YYYY年MM月')
const pageNumber = computed(() => (activePage.value === 'cover' ? 1 : Math.max(1, props.totalPages - 1)))
const statusLabel = computed(() => (isSynced.value ? '内容已同步' : '等待重新生成'))
const wordFileName = computed(() => props.wordFile?.name ?? '暂未上传申报书')
const signatureLabel = computed(() => (props.signatureDataUrl ? '签名已采集' : '待完成签名'))

function switchToPreviousPage() {
  activePage.value = activePage.value === 'cover' ? 'signature' : 'cover'
}

function switchToNextPage() {
  activePage.value = activePage.value === 'cover' ? 'signature' : 'cover'
}
</script>

<template>
  <section class="application-pdf-preview-card" aria-label="申报书 PDF 预览">
    <header class="preview-card-header">
      <div>
        <h2>申报书预览</h2>
        <p>点击预览后生成最新 PDF，不随输入实时转换</p>
      </div>
      <span class="preview-sync-pill" :class="{ synced: isSynced, stale: !isSynced }">
        {{ statusLabel }}
      </span>
    </header>

    <div class="preview-toolbar">
      <el-radio-group v-model="activePage" size="small">
        <el-radio-button label="cover">封面</el-radio-button>
        <el-radio-button label="signature">签名页</el-radio-button>
      </el-radio-group>

      <div class="preview-actions">
        <span>第 {{ pageNumber }} / {{ totalPages }} 页</span>
        <el-button link type="primary" :loading="generating" @click="emit('preview')">重新预览</el-button>
        <el-button link type="primary" :disabled="!isSynced" @click="emit('download')">下载PDF</el-button>
        <el-button link type="primary" @click="fullscreenVisible = true">全屏</el-button>
      </div>
    </div>

    <div class="pdf-page-shell" :class="{ stale: !isSynced }">
      <article v-if="activePage === 'cover'" class="mock-pdf-page cover-page">
        <span class="attachment-label">附件1</span>
        <h3>北京中关村学院科研项目</h3>
        <h1>申 报 计 划 书</h1>
        <div class="title-rule"></div>
        <dl class="cover-fields">
          <div>
            <dt>项目名称：</dt>
            <dd>{{ form.project_name || '待填写' }}</dd>
          </div>
          <div>
            <dt>项目负责人：</dt>
            <dd>{{ form.project_leader_name || '系统带入' }}</dd>
          </div>
          <div>
            <dt>填报时间：</dt>
            <dd>{{ fillMonth }}</dd>
          </div>
        </dl>
        <footer>
          <strong>北京中关村学院</strong>
          <span>{{ fillMonth }}</span>
        </footer>
      </article>

      <article v-else class="mock-pdf-page signature-page">
        <h3>九、项目经费使用承诺书</h3>
        <p>
          本人作为项目负责人，承诺在项目执行过程中严格遵守科研经费管理要求，保证经费使用真实、合理、合规。
        </p>
        <div class="signature-preview-line">
          <span>项目负责人签名：</span>
          <img v-if="signatureDataUrl" :src="signatureDataUrl" alt="项目负责人签名">
          <em v-else>待签名</em>
        </div>
        <div class="signature-date-line">
          <span>日期：</span>
          <strong>{{ form.fill_date || '待填写' }}</strong>
        </div>
      </article>

      <div v-if="!isSynced" class="preview-stale-mask">
        <strong>等待重新生成</strong>
        <span>表单、Word 或签名有更新，请点击“预览”同步 PDF</span>
      </div>
    </div>

    <footer class="preview-card-footer">
      <button type="button" @click="switchToPreviousPage">上一页</button>
      <button type="button" @click="switchToNextPage">下一页</button>
    </footer>

    <section class="preview-file-status">
      <div>
        <span class="file-icon">W</span>
        <div>
          <strong>{{ wordFileName }}</strong>
          <span>{{ wordFile?.convert_status === 'CONVERTED' ? '已转换为 PDF' : '等待转换' }}</span>
        </div>
      </div>
      <div>
        <span class="file-icon signed">✓</span>
        <div>
          <strong>{{ signatureLabel }}</strong>
          <span>写入承诺书签名栏右侧</span>
        </div>
      </div>
    </section>

    <el-dialog
      v-model="fullscreenVisible"
      append-to-body
      class="application-preview-fullscreen"
      title="申报书 PDF 全屏预览"
      width="86vw"
      top="4vh"
    >
      <div class="fullscreen-preview-body">
        <div class="pdf-page-shell fullscreen">
          <article v-if="activePage === 'cover'" class="mock-pdf-page cover-page">
            <span class="attachment-label">附件1</span>
            <h3>北京中关村学院科研项目</h3>
            <h1>申 报 计 划 书</h1>
            <div class="title-rule"></div>
            <dl class="cover-fields">
              <div>
                <dt>项目名称：</dt>
                <dd>{{ form.project_name || '待填写' }}</dd>
              </div>
              <div>
                <dt>项目负责人：</dt>
                <dd>{{ form.project_leader_name || '系统带入' }}</dd>
              </div>
              <div>
                <dt>填报时间：</dt>
                <dd>{{ fillMonth }}</dd>
              </div>
            </dl>
            <footer>
              <strong>北京中关村学院</strong>
              <span>{{ fillMonth }}</span>
            </footer>
          </article>

          <article v-else class="mock-pdf-page signature-page">
            <h3>九、项目经费使用承诺书</h3>
            <p>
              本人作为项目负责人，承诺在项目执行过程中严格遵守科研经费管理要求，保证经费使用真实、合理、合规。
            </p>
            <div class="signature-preview-line">
              <span>项目负责人签名：</span>
              <img v-if="signatureDataUrl" :src="signatureDataUrl" alt="项目负责人签名">
              <em v-else>待签名</em>
            </div>
            <div class="signature-date-line">
              <span>日期：</span>
              <strong>{{ form.fill_date || '待填写' }}</strong>
            </div>
          </article>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<style scoped>
.application-pdf-preview-card {
  min-width: 0;
  display: grid;
  gap: 12px;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.preview-card-header,
.preview-toolbar,
.preview-card-footer,
.preview-file-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-card-header h2 {
  margin: 0;
  color: #1f304a;
  font-size: 18px;
  font-weight: 760;
}

.preview-card-header p {
  margin: 5px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.preview-sync-pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 680;
}

.preview-sync-pill::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: currentColor;
}

.preview-sync-pill.synced {
  color: #16835d;
  background: #e8f7f1;
}

.preview-sync-pill.stale {
  color: #d06a2b;
  background: #fff0e4;
}

.preview-toolbar {
  align-items: flex-start;
}

.preview-toolbar :deep(.el-radio-button__inner) {
  min-width: 90px;
}

.preview-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  color: #8a95a7;
  font-size: 12px;
}

.preview-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.pdf-page-shell {
  position: relative;
  min-height: 360px;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: 18px;
  border: 1px solid #e2e9f4;
  border-radius: 12px;
  background: #f6f8fc;
}

.pdf-page-shell.fullscreen {
  min-height: 70vh;
}

.mock-pdf-page {
  width: min(100%, 410px);
  min-height: 330px;
  display: grid;
  align-content: start;
  padding: 36px 42px;
  border: 1px solid #d9e1ec;
  background: #fff;
  box-shadow: 0 12px 30px rgba(27, 46, 77, 0.08);
}

.fullscreen .mock-pdf-page {
  width: min(100%, 620px);
  min-height: 72vh;
}

.attachment-label {
  color: #8a95a7;
  font-size: 11px;
}

.cover-page h3 {
  margin: 24px 0 10px;
  color: #1d1d1f;
  font-size: 18px;
  text-align: center;
}

.cover-page h1 {
  margin: 0;
  color: #111827;
  font-size: 28px;
  letter-spacing: 0.18em;
  text-align: center;
}

.title-rule {
  width: 160px;
  height: 2px;
  margin: 18px auto 42px;
  background: #8a8f98;
}

.cover-fields {
  display: grid;
  gap: 16px;
  margin: 0;
}

.cover-fields div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  align-items: end;
  gap: 10px;
}

.cover-fields dt {
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.cover-fields dd {
  min-width: 0;
  overflow: hidden;
  margin: 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #a5abb5;
  color: #1f304a;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-page footer {
  display: grid;
  justify-items: center;
  gap: 8px;
  margin-top: 58px;
  color: #111827;
  font-size: 13px;
}

.cover-page footer span {
  color: #5c6678;
  font-size: 12px;
}

.signature-page {
  align-content: center;
  gap: 22px;
}

.signature-page h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  text-align: center;
}

.signature-page p {
  margin: 0;
  color: #3f4c61;
  font-size: 13px;
  line-height: 1.9;
}

.signature-preview-line,
.signature-date-line {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  color: #111827;
  font-size: 13px;
}

.signature-preview-line img {
  width: 132px;
  height: 52px;
  object-fit: contain;
}

.signature-preview-line em {
  min-width: 112px;
  padding-bottom: 3px;
  border-bottom: 1px solid #a5abb5;
  color: #9ca3af;
  font-style: normal;
  text-align: center;
}

.signature-date-line strong {
  min-width: 112px;
  padding-bottom: 3px;
  border-bottom: 1px solid #a5abb5;
  text-align: center;
}

.preview-stale-mask {
  position: absolute;
  inset: auto 26px 26px;
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid #ffd7ba;
  border-radius: 10px;
  color: #a25b13;
  background: rgba(255, 247, 237, 0.94);
  font-size: 12px;
  text-align: center;
  backdrop-filter: blur(8px);
}

.preview-stale-mask strong {
  color: #9a4b10;
}

.preview-card-footer {
  justify-content: center;
}

.preview-card-footer button {
  border: 1px solid #dce5f1;
  border-radius: 8px;
  padding: 5px 12px;
  color: #52627a;
  background: #fff;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.preview-card-footer button:hover {
  color: #246de2;
  border-color: #bdd2f5;
}

.preview-file-status {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.preview-file-status > div {
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #dce8fb;
  border-radius: 10px;
  background: #f7fbff;
}

.file-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: #2e73e8;
  background: #edf4ff;
  font-size: 12px;
  font-weight: 800;
}

.file-icon.signed {
  color: #fff;
  background: #3478ee;
}

.preview-file-status strong,
.preview-file-status span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-file-status strong {
  color: #203452;
  font-size: 12px;
}

.preview-file-status span {
  margin-top: 3px;
  color: #8a95a7;
  font-size: 11px;
}

.fullscreen-preview-body {
  display: grid;
  place-items: center;
  min-height: 72vh;
  background: #f6f8fc;
}

@media (max-width: 1180px) {
  .preview-card-header,
  .preview-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .preview-actions {
    justify-content: flex-start;
  }

  .preview-file-status {
    grid-template-columns: 1fr;
  }
}
</style>
