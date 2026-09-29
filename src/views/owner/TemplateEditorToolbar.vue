<script setup lang="ts">
import { shallowRef } from 'vue'
import { Grid, Picture, RefreshLeft, RefreshRight, Tickets } from '@element-plus/icons-vue'

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

interface BlockOption {
  label: string
  value: string
}

const blockModel = defineModel<string>('block', { required: true })

const emit = defineEmits<{
  command: [command: EditorCommand, value?: string]
}>()

const fontColor = shallowRef('#1d1d1f')
const highlightColor = shallowRef('#fff176')

const blockOptions: BlockOption[] = [
  { label: '正文', value: 'P' },
  { label: '一级标题', value: 'H1' },
  { label: '二级标题', value: 'H2' },
  { label: '三级标题', value: 'H3' },
]

function emitCommand(command: EditorCommand, value?: string) {
  emit('command', command, value)
}

function changeBlock(value: string) {
  emitCommand('formatBlock', value)
}

function changeColor(command: 'foreColor' | 'hiliteColor', event: Event) {
  emitCommand(command, (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="editor-toolbar" aria-label="富文本编辑工具栏">
    <el-select v-model="blockModel" class="block-select" @change="changeBlock">
      <el-option
        v-for="option in blockOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>

    <div class="toolbar-group">
      <button class="toolbar-button text-button" type="button" title="一级标题" @mousedown.prevent @click="emitCommand('formatBlock', 'H1')">
        H1
      </button>
      <button class="toolbar-button text-button" type="button" title="二级标题" @mousedown.prevent @click="emitCommand('formatBlock', 'H2')">
        H2
      </button>
      <button class="toolbar-button text-button" type="button" title="三级标题" @mousedown.prevent @click="emitCommand('formatBlock', 'H3')">
        H3
      </button>
    </div>

    <span class="toolbar-divider" aria-hidden="true"></span>

    <div class="toolbar-group">
      <button class="toolbar-button text-button" type="button" title="加粗" @mousedown.prevent @click="emitCommand('bold')">
        <strong>B</strong>
      </button>
      <button class="toolbar-button text-button" type="button" title="斜体" @mousedown.prevent @click="emitCommand('italic')">
        <em>I</em>
      </button>
      <button class="toolbar-button text-button" type="button" title="下划线" @mousedown.prevent @click="emitCommand('underline')">
        <u>U</u>
      </button>
      <button class="toolbar-button text-button" type="button" title="删除线" @mousedown.prevent @click="emitCommand('strikeThrough')">
        <s>S</s>
      </button>
      <label class="toolbar-color" title="字体颜色">
        <span>A</span>
        <input v-model="fontColor" type="color" @input="changeColor('foreColor', $event)" />
      </label>
      <label class="toolbar-color highlight-color" title="背景颜色">
        <span></span>
        <input v-model="highlightColor" type="color" @input="changeColor('hiliteColor', $event)" />
      </label>
    </div>

    <span class="toolbar-divider" aria-hidden="true"></span>

    <div class="toolbar-group">
      <button class="toolbar-button icon-button" type="button" title="无序列表" @mousedown.prevent @click="emitCommand('insertUnorderedList')">
        <span class="list-icon unordered"></span>
      </button>
      <button class="toolbar-button icon-button" type="button" title="有序列表" @mousedown.prevent @click="emitCommand('insertOrderedList')">
        <span class="list-icon ordered"></span>
      </button>
      <button class="toolbar-button icon-button" type="button" title="左对齐" @mousedown.prevent @click="emitCommand('justifyLeft')">
        ≡
      </button>
      <button class="toolbar-button icon-button" type="button" title="居中对齐" @mousedown.prevent @click="emitCommand('justifyCenter')">
        ≣
      </button>
      <button class="toolbar-button icon-button" type="button" title="右对齐" @mousedown.prevent @click="emitCommand('justifyRight')">
        ≡
      </button>
      <button class="toolbar-button icon-button" type="button" title="引用" @mousedown.prevent @click="emitCommand('blockquote')">
        “
      </button>
      <button class="toolbar-button icon-button" type="button" title="链接" @mousedown.prevent @click="emitCommand('createLink')">
        ↗
      </button>
      <button class="toolbar-button icon-button" type="button" title="代码块" @mousedown.prevent @click="emitCommand('codeBlock')">
        &lt;/&gt;
      </button>
      <button class="toolbar-button icon-button" type="button" title="表格" @mousedown.prevent @click="emitCommand('insertTable')">
        <el-icon><Grid /></el-icon>
      </button>
      <button class="toolbar-button icon-button" type="button" title="图片" @mousedown.prevent @click="emitCommand('insertImage')">
        <el-icon><Picture /></el-icon>
      </button>
      <button class="toolbar-button icon-button" type="button" title="高亮块" @mousedown.prevent @click="emitCommand('hiliteColor', '#fff176')">
        <el-icon><Tickets /></el-icon>
      </button>
    </div>

    <span class="toolbar-spacer"></span>

    <div class="toolbar-group">
      <button class="toolbar-button icon-button" type="button" title="撤回" @mousedown.prevent @click="emitCommand('undo')">
        <el-icon><RefreshLeft /></el-icon>
      </button>
      <button class="toolbar-button icon-button" type="button" title="重做" @mousedown.prevent @click="emitCommand('redo')">
        <el-icon><RefreshRight /></el-icon>
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-toolbar {
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
  background: rgba(255, 255, 255, 0.94);
}

.block-select {
  width: 112px;
}

.block-select :deep(.el-select__wrapper) {
  min-height: 40px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(29, 29, 31, 0.08);
}

.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.toolbar-button,
.toolbar-color {
  width: 36px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: #1d1d1f;
  background: transparent;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.toolbar-button:hover,
.toolbar-color:hover {
  color: #0066cc;
  background: rgba(0, 113, 227, 0.08);
  transform: translateY(-1px);
}

.text-button {
  font-size: 16px;
  font-weight: 780;
}

.icon-button {
  font-size: 18px;
  font-weight: 800;
}

.toolbar-color {
  position: relative;
  font-weight: 800;
}

.toolbar-color span {
  position: relative;
  padding-bottom: 4px;
}

.toolbar-color span::after {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  border-radius: 999px;
  background: v-bind(fontColor);
  content: "";
}

.highlight-color span {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: v-bind(highlightColor);
}

.highlight-color span::after {
  display: none;
}

.toolbar-color input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  background: rgba(29, 29, 31, 0.1);
}

.toolbar-spacer {
  flex: 1;
}

.list-icon {
  width: 18px;
  height: 16px;
  display: inline-block;
  background:
    linear-gradient(#1d1d1f, #1d1d1f) 8px 2px / 10px 2px no-repeat,
    linear-gradient(#1d1d1f, #1d1d1f) 8px 7px / 10px 2px no-repeat,
    linear-gradient(#1d1d1f, #1d1d1f) 8px 12px / 10px 2px no-repeat;
}

.list-icon::before {
  display: grid;
  width: 6px;
  height: 16px;
  align-items: center;
  color: #1d1d1f;
  font-size: 9px;
  font-weight: 800;
}

.list-icon.unordered::before {
  content: "•••";
  writing-mode: vertical-rl;
}

.list-icon.ordered::before {
  content: "123";
  writing-mode: vertical-rl;
}

@media (max-width: 1180px) {
  .editor-toolbar {
    overflow-x: auto;
  }

  .toolbar-spacer {
    display: none;
  }
}
</style>
