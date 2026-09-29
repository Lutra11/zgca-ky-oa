<script setup lang="ts">
import { computed, reactive, useTemplateRef } from 'vue'
import { ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

type TemplateCategory = '评审标准模板' | '通知模板'
type TemplateScope = '学生管理' | '科研管理' | '青年科研项目' | '其他'

interface TemplateCreateForm {
  name: string
  description: string
  category: TemplateCategory
  scopes: TemplateScope[]
  customScope: string
}

interface TemplateCreatePayload {
  name: string
  description: string
  category: TemplateCategory
  scopes: string[]
}

const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  enterBuilder: [payload: TemplateCreatePayload]
}>()

const templateFormRef = useTemplateRef<FormInstance>('templateFormRef')

const form = reactive<TemplateCreateForm>({
  name: '',
  description: '',
  category: '评审标准模板',
  scopes: [],
  customScope: '',
})

const categories: TemplateCategory[] = ['评审标准模板', '通知模板']
const scopeOptions: TemplateScope[] = ['学生管理', '科研管理', '青年科研项目', '其他']

const isCustomScopeVisible = computed(() => form.scopes.includes('其他'))

const rules = reactive<FormRules<TemplateCreateForm>>({
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { max: 50, message: '模板名称不能超过 50 个字符', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入模板概述', trigger: 'blur' },
    { max: 200, message: '模板概述不能超过 200 个字符', trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  scopes: [{ validator: validateScopes, trigger: 'change' }],
  customScope: [{ validator: validateCustomScope, trigger: 'blur' }],
})

function validateScopes(_rule: unknown, value: TemplateScope[], callback: (error?: Error) => void) {
  if (!value.length) {
    callback(new Error('请选择适用范围'))
    return
  }

  callback()
}

function validateCustomScope(_rule: unknown, _value: string, callback: (error?: Error) => void) {
  if (!isCustomScopeVisible.value) {
    callback()
    return
  }

  const customScope = form.customScope.trim()

  if (!customScope) {
    callback(new Error('请输入自定义标签'))
    return
  }

  if (customScope.length > 15) {
    callback(new Error('自定义标签不能超过 15 个字符'))
    return
  }

  callback()
}

async function requestCancel() {
  try {
    await ElMessageBox.confirm('当前内容取消后不会保存', '取消新建模板', {
      confirmButtonText: '确认取消',
      cancelButtonText: '继续填写',
      type: 'warning',
      autofocus: false,
    })
    resetForm()
    visible.value = false
  } catch {
    // 用户选择继续填写时保留当前内容。
  }
}

async function beforeClose(done: () => void) {
  try {
    await ElMessageBox.confirm('当前内容取消后不会保存', '取消新建模板', {
      confirmButtonText: '确认取消',
      cancelButtonText: '继续填写',
      type: 'warning',
      autofocus: false,
    })
    resetForm()
    done()
  } catch {
    // 用户选择继续填写时不关闭弹窗。
  }
}

async function enterTemplateBuilder() {
  const formInstance = templateFormRef.value

  if (!formInstance) {
    return
  }

  try {
    await formInstance.validate()
  } catch {
    return
  }

  emit('enterBuilder', {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    scopes: form.scopes.map((scope) => (scope === '其他' ? form.customScope.trim() : scope)),
  })

  resetForm()
  visible.value = false
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.category = '评审标准模板'
  form.scopes = []
  form.customScope = ''
  templateFormRef.value?.clearValidate()
}
</script>

<template>
  <el-dialog
    v-model="visible"
    class="template-create-dialog"
    width="640px"
    :before-close="beforeClose"
    :close-on-click-modal="false"
    append-to-body
  >
    <template #header>
      <div class="dialog-heading">
        <h3 class="dialog-title">新建模板</h3>
        <p class="dialog-summary">请先填写模板的基本信息，完成后进入详细模板搭建页面。</p>
      </div>
    </template>

    <div class="template-dialog-steps" aria-label="模板创建步骤">
      <div class="template-step template-step-active">
        <span>1</span>
        <strong>基本信息</strong>
      </div>
      <i></i>
      <div class="template-step">
        <span>2</span>
        <strong>模板搭建</strong>
      </div>
    </div>

    <el-form
      ref="templateFormRef"
      class="template-create-form"
      :model="form"
      :rules="rules"
      label-position="left"
      label-width="96px"
      status-icon
    >
      <el-form-item label="模板名称" prop="name" required>
        <el-input
          v-model="form.name"
          maxlength="50"
          placeholder="请输入模板名称"
          show-word-limit
          clearable
        />
      </el-form-item>

      <el-form-item label="模板概述" prop="description" required>
        <el-input
          v-model="form.description"
          type="textarea"
          maxlength="200"
          :rows="4"
          placeholder="请输入模板概述，用于说明模板的用途和适用场景"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="分类" prop="category" required>
        <el-radio-group v-model="form.category">
          <el-radio v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="适用范围" prop="scopes" required>
        <el-checkbox-group v-model="form.scopes">
          <el-checkbox v-for="scope in scopeOptions" :key="scope" :value="scope">
            {{ scope }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <Transition name="template-dialog-field">
        <el-form-item v-if="isCustomScopeVisible" label="自定义标签" prop="customScope">
          <el-input
            v-model="form.customScope"
            maxlength="15"
            placeholder="请输入自定义标签"
            show-word-limit
            clearable
          />
        </el-form-item>
      </Transition>

      <p class="required-note">
        <span>*</span>
        为必填项
      </p>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="requestCancel">取消</el-button>
        <el-button type="primary" @click="enterTemplateBuilder">进入模板搭建</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-heading {
  display: grid;
  gap: 6px;
}

.dialog-title,
.dialog-summary,
.required-note {
  margin: 0;
}

.dialog-title {
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 760;
}

.dialog-summary {
  color: #6e6e73;
  font-size: 13px;
}

.template-dialog-steps {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 6px 92px 20px;
  border-bottom: 1px solid rgba(29, 29, 31, 0.08);
}

.template-dialog-steps i {
  height: 1px;
  background: #dfe5ee;
}

.template-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #8a93a3;
  font-size: 13px;
  font-style: normal;
  font-weight: 700;
}

.template-step span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid #dfe5ee;
  border-radius: 999px;
  background: #fff;
  font-weight: 800;
}

.template-step-active {
  color: #1d1d1f;
}

.template-step-active span {
  color: #fff;
  border-color: #0071e3;
  background: #0071e3;
  box-shadow: 0 8px 18px rgba(0, 113, 227, 0.2);
}

.template-create-form {
  display: grid;
  gap: 6px;
  padding: 24px 20px 0;
}

.template-create-form :deep(.el-form-item__label) {
  color: #1d1d1f;
  font-weight: 760;
}

.template-create-form :deep(.el-input__wrapper),
.template-create-form :deep(.el-textarea__inner) {
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(29, 29, 31, 0.08);
}

.template-create-form :deep(.el-input__wrapper.is-focus),
.template-create-form :deep(.el-textarea__inner:focus) {
  box-shadow:
    inset 0 0 0 1px rgba(0, 113, 227, 0.36),
    0 10px 24px rgba(0, 113, 227, 0.08);
}

.template-create-form :deep(.el-checkbox),
.template-create-form :deep(.el-radio) {
  margin-right: 22px;
}

.required-note {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6e6e73;
  font-size: 13px;
}

.required-note span {
  color: #ff3b30;
  font-weight: 800;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 2px;
}

.dialog-footer :deep(.el-button) {
  min-width: 104px;
  height: 40px;
  border-radius: 8px;
  font-weight: 760;
}

.template-dialog-field-enter-active,
.template-dialog-field-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.template-dialog-field-enter-from,
.template-dialog-field-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 720px) {
  .template-dialog-steps {
    padding: 6px 0 18px;
  }

  .template-create-form {
    padding: 20px 0 0;
  }
}
</style>
