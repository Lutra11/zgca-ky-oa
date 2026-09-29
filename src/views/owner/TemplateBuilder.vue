<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck, InfoFilled } from '@element-plus/icons-vue'
import TemplateAttachmentPanel from './TemplateAttachmentPanel.vue'
import TemplateEditorToolbar from './TemplateEditorToolbar.vue'

type TemplateCategory = '评审标准模板' | '通知模板'

interface TemplateSeed {
  name: string
  description: string
  category: TemplateCategory
  scopes: string[]
}

interface TemplateAttachment {
  id: string
  name: string
  size: string
  uploadedAt: string
  kind: 'pdf' | 'word'
  raw?: File
}

interface TemplateDraft {
  title: string
  content: string
  savedAt: string
  attachments: Omit<TemplateAttachment, 'raw'>[]
}

interface OutlineItem {
  id: string
  title: string
  level: 1 | 2
}

type EditorCommand =
  | 'formatBlock'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'foreColor'
  | 'hiliteColor'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'createLink'
  | 'blockquote'
  | 'codeBlock'
  | 'insertTable'
  | 'insertImage'
  | 'undo'
  | 'redo'

const TEMPLATE_SEED_KEY = 'zgca_ky_oa_template_create_seed'
const TEMPLATE_DRAFT_PREFIX = 'zgca_ky_oa_template_builder_draft'

const route = useRoute()
const router = useRouter()
const editorRef = useTemplateRef<HTMLElement>('editorRef')
const imageInputRef = useTemplateRef<HTMLInputElement>('imageInputRef')

const templateSeed = reactive<TemplateSeed>({
  name: '青年科研项目',
  description: '用于青年科研项目评审的标准模板。',
  category: '评审标准模板',
  scopes: ['青年科研项目'],
})

const documentTitle = shallowRef('')
const editorHtml = shallowRef('')
const editorText = shallowRef('')
const currentBlock = shallowRef('P')
const markdownEnabled = shallowRef(true)
const activeOutlineId = shallowRef('section-intro')
const isPreviewVisible = shallowRef(false)
const lastSavedAt = shallowRef('')

let autoSaveTimer: ReturnType<typeof window.setTimeout> | undefined

const attachments = shallowRef<TemplateAttachment[]>([
  {
    id: 'mock-pdf',
    name: '评审细则_2024.pdf',
    size: '1.24 MB',
    uploadedAt: '2024-05-20 10:20',
    kind: 'pdf',
  },
  {
    id: 'mock-docx-1',
    name: '评分参考示例.docx',
    size: '860 KB',
    uploadedAt: '2024-05-20 10:21',
    kind: 'word',
  },
  {
    id: 'mock-docx-2',
    name: '相关政策说明.docx',
    size: '512 KB',
    uploadedAt: '2024-05-20 10:22',
    kind: 'word',
  },
])

const outlineItems: OutlineItem[] = [
  { id: 'section-intro', title: '一、模板说明', level: 1 },
  { id: 'section-dimensions', title: '二、评审维度', level: 1 },
  { id: 'dimension-science', title: '2.1 科学价值', level: 2 },
  { id: 'dimension-innovation', title: '2.2 创新性', level: 2 },
  { id: 'dimension-plan', title: '2.3 研究方案可行性', level: 2 },
  { id: 'dimension-foundation', title: '2.4 研究基础与条件', level: 2 },
  { id: 'dimension-impact', title: '2.5 预期成果与影响', level: 2 },
  { id: 'section-standard', title: '三、评分标准', level: 1 },
]

const wordCount = computed(() => editorText.value.replace(/\s/g, '').length)

const lineCount = computed(() =>
  editorText.value.split('\n').filter((line) => line.trim()).length,
)

const draftStorageKey = computed(() =>
  `${TEMPLATE_DRAFT_PREFIX}:${templateSeed.category}:${templateSeed.name || '未命名模板'}`,
)

const returnPath = computed(() => (typeof route.query.returnTo === 'string' ? route.query.returnTo : ''))

onMounted(() => {
  document.execCommand('styleWithCSS', false, 'true')
  loadTemplateSeed()
  loadEditorDraft()
})

onUnmounted(() => {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }
})

function loadTemplateSeed() {
  const storedSeed = window.sessionStorage.getItem(TEMPLATE_SEED_KEY)

  if (!storedSeed) {
    documentTitle.value = `${templateSeed.category} - ${templateSeed.name}`
    return
  }

  try {
    const parsedSeed = JSON.parse(storedSeed) as TemplateSeed
    templateSeed.name = parsedSeed.name || templateSeed.name
    templateSeed.description = parsedSeed.description || templateSeed.description
    templateSeed.category = parsedSeed.category || templateSeed.category
    templateSeed.scopes = parsedSeed.scopes?.length ? parsedSeed.scopes : templateSeed.scopes
  } catch {
    window.sessionStorage.removeItem(TEMPLATE_SEED_KEY)
  }

  documentTitle.value = `${templateSeed.category} - ${templateSeed.name}`
}

async function loadEditorDraft() {
  const storedDraft = window.localStorage.getItem(draftStorageKey.value)

  if (storedDraft) {
    try {
      const parsedDraft = JSON.parse(storedDraft) as TemplateDraft
      documentTitle.value = parsedDraft.title || documentTitle.value
      editorHtml.value = parsedDraft.content || createDefaultContent()
      attachments.value = parsedDraft.attachments?.length ? parsedDraft.attachments : attachments.value
      lastSavedAt.value = parsedDraft.savedAt || formatTime(new Date())
    } catch {
      editorHtml.value = createDefaultContent()
      lastSavedAt.value = formatTime(new Date())
    }
  } else {
    editorHtml.value = createDefaultContent()
    lastSavedAt.value = formatTime(new Date())
  }

  await nextTick()
  if (editorRef.value) {
    editorRef.value.innerHTML = editorHtml.value
    syncEditorState()
  }
}

function createDefaultContent() {
  const scopeText = templateSeed.scopes.length ? templateSeed.scopes.join('、') : '科研项目'
  const description = templateSeed.description || `本模板用于${scopeText}的评审工作。`

  return `
    <h2 data-outline-id="section-intro">一、模板说明</h2>
    <p>${description}评审专家请依据各项评审维度的评分标准进行综合评定，所有评分项满分为 100 分。</p>
    <p>请在充分阅读申报材料的基础上，客观、公正、独立地完成评审。</p>
    <h2 data-outline-id="section-dimensions">二、评审维度</h2>
    <p>评审维度包括以下五个方面，请结合项目实际情况进行评分与评价。</p>
    <ul>
      <li data-outline-id="dimension-science">科学价值</li>
      <li data-outline-id="dimension-innovation">创新性</li>
      <li data-outline-id="dimension-plan">研究方案可行性</li>
      <li data-outline-id="dimension-foundation">研究基础与条件</li>
      <li data-outline-id="dimension-impact">预期成果与影响</li>
    </ul>
    <h2 data-outline-id="section-standard">三、评分标准</h2>
    <p>各评审维度的具体评分标准如下表所示：</p>
    <table>
      <thead>
        <tr>
          <th>评审维度</th>
          <th>权重（%）</th>
          <th>评分标准说明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>科学价值</td>
          <td>20</td>
          <td>项目的科学意义、理论价值及对学科发展的贡献程度。</td>
        </tr>
        <tr>
          <td>创新性</td>
          <td>25</td>
          <td>项目在研究内容、方法或技术路线等方面的创新程度。</td>
        </tr>
        <tr>
          <td>研究方案可行性</td>
          <td>25</td>
          <td>研究目标明确，技术路线合理，研究方法可行，进度安排合理。</td>
        </tr>
      </tbody>
    </table>
  `
}

function handleEditorCommand(command: EditorCommand, value?: string) {
  focusEditor()

  switch (command) {
    case 'formatBlock':
      currentBlock.value = value ?? 'P'
      document.execCommand('formatBlock', false, value ?? 'P')
      break
    case 'foreColor':
      document.execCommand('foreColor', false, value ?? '#1d1d1f')
      break
    case 'hiliteColor':
      document.execCommand('backColor', false, value ?? '#fff176')
      break
    case 'blockquote':
      insertHtml('<blockquote>请输入引用内容</blockquote><p><br></p>')
      break
    case 'codeBlock':
      insertHtml('<pre><code>// 请在这里输入代码</code></pre><p><br></p>')
      break
    case 'insertTable':
      insertHtml(createTableHtml())
      break
    case 'insertImage':
      imageInputRef.value?.click()
      break
    case 'createLink': {
      const link = window.prompt('请输入链接地址')
      if (link) {
        document.execCommand('createLink', false, link)
      }
      break
    }
    default:
      document.execCommand(command, false)
      break
  }

  syncEditorState()
  scheduleAutoSave()
}

function createTableHtml() {
  return `
    <table>
      <thead>
        <tr>
          <th>字段</th>
          <th>说明</th>
          <th>要求</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>示例字段</td>
          <td>请填写说明</td>
          <td>请填写要求</td>
        </tr>
      </tbody>
    </table>
    <p><br></p>
  `
}

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    const source = typeof reader.result === 'string' ? reader.result : ''
    if (source) {
      insertHtml(`<figure><img src="${source}" alt="${file.name}" /><figcaption>${file.name}</figcaption></figure><p><br></p>`)
      syncEditorState()
      scheduleAutoSave()
    }
    input.value = ''
  }
  reader.readAsDataURL(file)
}

function insertHtml(html: string) {
  focusEditor()
  document.execCommand('insertHTML', false, html)
}

function focusEditor() {
  editorRef.value?.focus()
}

function handleEditorInput() {
  syncEditorState()
  scheduleAutoSave()
}

function syncEditorState() {
  const editor = editorRef.value

  if (!editor) {
    return
  }

  editorHtml.value = editor.innerHTML
  editorText.value = editor.innerText
}

function scrollToOutline(id: string) {
  activeOutlineId.value = id
  const target = editorRef.value?.querySelector(`[data-outline-id="${id}"]`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scheduleAutoSave() {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }

  autoSaveTimer = window.setTimeout(() => {
    saveDraft(false)
  }, 900)
}

function saveDraft(showMessage = true) {
  syncEditorState()
  const savedAt = formatTime(new Date())
  const serializableAttachments = attachments.value.map(({ raw: _raw, ...attachment }) => attachment)

  window.localStorage.setItem(
    draftStorageKey.value,
    JSON.stringify({
      title: documentTitle.value,
      content: editorHtml.value,
      savedAt,
      attachments: serializableAttachments,
    } satisfies TemplateDraft),
  )

  lastSavedAt.value = savedAt

  if (showMessage) {
    ElMessage.success('草稿已保存')
  }
}

function previewDocument() {
  syncEditorState()
  isPreviewVisible.value = true
}

function publishTemplate() {
  saveDraft(false)
  ElMessage.success('模板已发布（原型模拟）')
}

function returnToSource() {
  if (!returnPath.value) {
    return
  }

  const query: Record<string, string> = {}

  if (typeof route.query.selectedTaskId === 'string') {
    query.selectedTaskId = route.query.selectedTaskId
  }

  router.push({
    path: returnPath.value,
    query,
  })
}

function addOutline() {
  ElMessage.info('目录结构后续将支持从正文标题自动生成')
}

function formatTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
</script>

<template>
  <section class="template-builder" aria-label="模板搭建">
    <header class="builder-header">
      <div class="builder-title-block">
        <h2 class="builder-title">模板搭建</h2>
        <div class="builder-steps" aria-label="模板创建步骤">
         
          <span class="step-item step-active">2</span>
          <strong>模板搭建</strong>
        </div>
      </div>

      <div class="builder-actions">
        <el-button v-if="returnPath" @click="returnToSource">返回评审任务</el-button>
        <el-button @click="saveDraft()">保存草稿</el-button>
        <el-button @click="previewDocument">预览</el-button>
        <el-button type="primary" @click="publishTemplate">发布模板</el-button>
      </div>
    </header>

    <div class="builder-grid">
      <div class="document-workbench">
        <div class="document-title-row">
          <el-input
            v-model="documentTitle"
            maxlength="100"
            show-word-limit
            class="document-title-input"
            placeholder="请输入模板标题"
            @input="scheduleAutoSave"
          />
          <div class="markdown-switch">
            <el-switch v-model="markdownEnabled" />
            <span>支持 Markdown</span>
            <el-tooltip content="原型阶段保留开关，后续可接入 Markdown 解析器。">
              <el-icon><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>

        <div class="editor-shell">
          <aside class="outline-panel" aria-label="文档结构">
            <header class="outline-header">
              <h3>文档结构</h3>
            </header>

            <nav class="outline-list">
              <button
                v-for="item in outlineItems"
                :key="item.id"
                type="button"
                class="outline-item"
                :class="[
                  `outline-level-${item.level}`,
                  { 'outline-item-active': activeOutlineId === item.id },
                ]"
                @click="scrollToOutline(item.id)"
              >
                {{ item.title }}
              </button>
            </nav>

            <el-button class="outline-add-button" type="primary" plain @click="addOutline">
              + 添加目录
            </el-button>
          </aside>

          <main class="editor-panel">
            <TemplateEditorToolbar
              v-model:block="currentBlock"
              @command="handleEditorCommand"
            />

            <article
              ref="editorRef"
              class="rich-editor"
              contenteditable="true"
              spellcheck="false"
              aria-label="模板正文编辑器"
              @input="handleEditorInput"
            ></article>

            <footer class="editor-status">
              <span>字数：{{ wordCount }}</span>
              <span>行数：{{ lineCount }}</span>
              <strong>自动保存于 {{ lastSavedAt }}</strong>
              <el-icon><CircleCheck /></el-icon>
            </footer>
          </main>
        </div>
      </div>

      <TemplateAttachmentPanel v-model="attachments" />
    </div>

    <input ref="imageInputRef" class="hidden-image-input" type="file" accept="image/*" @change="handleImageChange" />

    <el-dialog v-model="isPreviewVisible" title="模板预览" width="760px" append-to-body>
      <article class="preview-document">
        <h1>{{ documentTitle }}</h1>
        <div class="preview-content" v-html="editorHtml"></div>
      </article>
    </el-dialog>
  </section>
</template>

<style scoped>
.template-builder {
  display: grid;
  gap: 18px;
}

.builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.builder-title-block {
  display: flex;
  align-items: center;
  gap: 42px;
  min-width: 0;
}

.builder-title,
.outline-header h3,
.preview-document h1 {
  margin: 0;
}

.builder-title {
  color: #1d1d1f;
  font-size: 30px;
  font-weight: 780;
  letter-spacing: 0;
}

.builder-steps {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6e6e73;
  font-size: 14px;
  font-weight: 760;
}

.builder-steps i {
  width: 126px;
  height: 1px;
  background: #dfe5ee;
}

.step-item,
.step-check {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(29, 29, 31, 0.1);
  font-weight: 800;
}

.step-done {
  color: #0071e3;
}

.step-check {
  color: #0071e3;
  font-size: 20px;
}

.step-active {
  color: #fff;
  background: #0071e3;
  box-shadow: 0 10px 24px rgba(0, 113, 227, 0.22);
}

.builder-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.builder-actions :deep(.el-button) {
  min-width: 112px;
  height: 44px;
  border-radius: 8px;
  font-weight: 760;
}

.builder-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;
}

.document-workbench {
  display: grid;
  gap: 14px;
  min-width: 0;
  padding: 20px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.document-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
}

.document-title-input :deep(.el-input__wrapper) {
  min-height: 52px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0, 113, 227, 0.14);
}

.document-title-input :deep(.el-input__inner) {
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 760;
}

.markdown-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #424245;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.markdown-switch .el-icon {
  color: #8a93a3;
}

.editor-shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 720px;
  overflow: hidden;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 8px;
  background: #fff;
}

.outline-panel {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 12px;
  padding: 20px 16px;
  border-right: 1px solid rgba(29, 29, 31, 0.08);
  background: #fbfdff;
}

.outline-header {
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
}

.outline-header h3 {
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 780;
}

.outline-list {
  display: grid;
  align-content: start;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
}

.outline-item {
  min-height: 36px;
  border: 0;
  border-radius: 8px;
  color: #424245;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.outline-item:hover,
.outline-item-active {
  color: #0066cc;
  background: #eef6ff;
}

.outline-level-1 {
  padding: 8px 12px;
}

.outline-level-2 {
  padding: 8px 12px 8px 34px;
  color: #6e6e73;
  font-weight: 650;
}

.outline-add-button {
  height: 40px;
  border-radius: 8px;
  font-weight: 760;
}

.editor-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
}

.rich-editor {
  min-height: 620px;
  padding: 34px 42px 44px;
  overflow-y: auto;
  color: #1d1d1f;
  outline: none;
  font-size: 16px;
  line-height: 1.75;
}

.rich-editor:focus {
  box-shadow: inset 0 0 0 2px rgba(0, 113, 227, 0.08);
}

.rich-editor :deep(h1),
.rich-editor :deep(h2),
.rich-editor :deep(h3) {
  margin: 24px 0 12px;
  color: #1d1d1f;
  line-height: 1.28;
}

.rich-editor :deep(h1) {
  font-size: 28px;
}

.rich-editor :deep(h2) {
  font-size: 24px;
}

.rich-editor :deep(h3) {
  font-size: 20px;
}

.rich-editor :deep(p),
.rich-editor :deep(ul),
.rich-editor :deep(ol),
.rich-editor :deep(blockquote),
.rich-editor :deep(pre) {
  margin: 12px 0;
}

.rich-editor :deep(blockquote) {
  padding: 10px 14px;
  border-left: 4px solid #0071e3;
  border-radius: 8px;
  color: #424245;
  background: #f5faff;
}

.rich-editor :deep(pre) {
  padding: 14px 16px;
  overflow-x: auto;
  border-radius: 8px;
  color: #1d1d1f;
  background: #f4f7fb;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.rich-editor :deep(table) {
  width: 100%;
  margin: 16px 0;
  border-collapse: collapse;
}

.rich-editor :deep(th),
.rich-editor :deep(td) {
  padding: 10px 12px;
  border: 1px solid #dfe5ee;
  text-align: left;
}

.rich-editor :deep(th) {
  background: #f4f7fb;
  font-weight: 780;
}

.rich-editor :deep(figure) {
  margin: 18px 0;
}

.rich-editor :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(26, 39, 68, 0.1);
}

.rich-editor :deep(figcaption) {
  margin-top: 8px;
  color: #6e6e73;
  font-size: 13px;
  text-align: center;
}

.editor-status {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 18px;
  border-top: 1px solid rgba(29, 29, 31, 0.08);
  color: #6e6e73;
  background: #fbfdff;
  font-size: 13px;
}

.editor-status strong {
  margin-left: auto;
  color: #6e6e73;
  font-weight: 650;
}

.editor-status .el-icon {
  color: #34c759;
  font-size: 18px;
}

.hidden-image-input {
  display: none;
}

.preview-document {
  padding: 12px 4px;
  color: #1d1d1f;
}

.preview-document h1 {
  margin-bottom: 18px;
  font-size: 24px;
  font-weight: 780;
}

.preview-content {
  line-height: 1.75;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 10px 12px;
  border: 1px solid #dfe5ee;
}

@media (max-width: 1280px) {
  .builder-header,
  .builder-title-block {
    align-items: flex-start;
    flex-direction: column;
  }

  .builder-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 920px) {
  .document-title-row,
  .editor-shell {
    grid-template-columns: 1fr;
  }

  .outline-panel {
    border-right: 0;
    border-bottom: 1px solid rgba(29, 29, 31, 0.08);
  }

  .rich-editor {
    padding: 24px;
  }
}
</style>
