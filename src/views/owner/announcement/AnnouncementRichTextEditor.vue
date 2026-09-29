<script setup lang="ts">
import { nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import TemplateEditorToolbar from '../TemplateEditorToolbar.vue'

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

const editorHtml = defineModel<string>({ required: true })

const editorRef = useTemplateRef<HTMLElement>('editorRef')
const imageInputRef = useTemplateRef<HTMLInputElement>('imageInputRef')
const currentBlock = shallowRef('P')
const isSyncingFromModel = shallowRef(false)

onMounted(async () => {
  document.execCommand('styleWithCSS', false, 'true')
  await nextTick()
  syncDomFromModel()
})

watch(
  editorHtml,
  () => {
    if (!isSyncingFromModel.value) {
      syncDomFromModel()
    }
  },
)

function syncDomFromModel() {
  const editor = editorRef.value

  if (editor && editor.innerHTML !== editorHtml.value) {
    editor.innerHTML = editorHtml.value
  }
}

function handleInput() {
  const editor = editorRef.value

  if (!editor) {
    return
  }

  isSyncingFromModel.value = true
  editorHtml.value = editor.innerHTML
  window.setTimeout(() => {
    isSyncingFromModel.value = false
  })
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
      insertHtml('<pre><code>// 请输入代码</code></pre><p><br></p>')
      break
    case 'insertTable':
      insertHtml(createTableHtml())
      break
    case 'insertImage':
      imageInputRef.value?.click()
      break
    case 'createLink': {
      const url = window.prompt('请输入链接地址')
      if (url) {
        document.execCommand('createLink', false, url)
      }
      break
    }
    default:
      document.execCommand(command, false)
      break
  }

  handleInput()
}

function createTableHtml() {
  return `
    <table>
      <thead>
        <tr><th>项目</th><th>说明</th><th>备注</th></tr>
      </thead>
      <tbody>
        <tr><td>示例</td><td>请输入内容</td><td>-</td></tr>
      </tbody>
    </table>
    <p><br></p>
  `
}

function insertHtml(html: string) {
  focusEditor()
  document.execCommand('insertHTML', false, html)
}

function focusEditor() {
  editorRef.value?.focus()
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
      handleInput()
    }

    input.value = ''
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="announcement-editor">
    <TemplateEditorToolbar v-model:block="currentBlock" @command="handleEditorCommand" />
    <article
      ref="editorRef"
      class="rich-editor"
      contenteditable="true"
      spellcheck="false"
      aria-label="公告正文编辑器"
      @input="handleInput"
    ></article>
    <input ref="imageInputRef" class="hidden-input" type="file" accept="image/*" @change="handleImageChange" />
  </div>
</template>

<style scoped>
.announcement-editor {
  overflow: hidden;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 10px;
  background: #fff;
}

.announcement-editor :deep(.editor-toolbar) {
  min-height: 42px;
  padding: 6px 10px;
  gap: 6px;
  overflow-x: auto;
}

.announcement-editor :deep(.block-select) {
  width: 92px;
}

.announcement-editor :deep(.toolbar-button),
.announcement-editor :deep(.toolbar-color) {
  width: 28px;
  height: 28px;
  border-radius: 7px;
}

.announcement-editor :deep(.toolbar-divider) {
  height: 22px;
}

.rich-editor {
  min-height: 150px;
  max-height: 280px;
  overflow-y: auto;
  padding: 14px 16px;
  color: #1d1d1f;
  outline: none;
  font-size: 14px;
  line-height: 1.7;
}

.rich-editor:focus {
  box-shadow: inset 0 0 0 2px rgba(0, 113, 227, 0.08);
}

.rich-editor :deep(h1),
.rich-editor :deep(h2),
.rich-editor :deep(h3) {
  margin: 14px 0 8px;
  line-height: 1.28;
}

.rich-editor :deep(h1) {
  font-size: 22px;
}

.rich-editor :deep(h2) {
  font-size: 19px;
}

.rich-editor :deep(h3) {
  font-size: 17px;
}

.rich-editor :deep(blockquote) {
  margin: 10px 0;
  padding: 8px 12px;
  border-left: 4px solid #0071e3;
  border-radius: 8px;
  color: #424245;
  background: #f5faff;
}

.rich-editor :deep(table) {
  width: 100%;
  margin: 10px 0;
  border-collapse: collapse;
}

.rich-editor :deep(th),
.rich-editor :deep(td) {
  padding: 8px;
  border: 1px solid #dfe5ee;
  text-align: left;
}

.rich-editor :deep(th) {
  background: #f4f7fb;
}

.rich-editor :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.hidden-input {
  display: none;
}
</style>
