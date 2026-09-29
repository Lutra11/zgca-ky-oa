<script setup lang="ts">
import { reactive, useTemplateRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const visible = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  confirm: [reason: string]
}>()

const formRef = useTemplateRef<FormInstance>('formRef')
const form = reactive({ reason: '' })

const rules = reactive<FormRules<typeof form>>({
  reason: [{ required: true, message: '请填写驳回理由', trigger: 'blur' }],
})

async function submitReject() {
  const formInstance = formRef.value

  if (!formInstance) {
    return
  }

  try {
    await formInstance.validate()
  } catch {
    return
  }

  try {
    await ElMessageBox.confirm('确认驳回该评审申请吗？', '确认驳回', {
      type: 'warning',
      confirmButtonText: '确定驳回',
      cancelButtonText: '取消',
      autofocus: false,
    })
    emit('confirm', form.reason.trim())
    visible.value = false
    form.reason = ''
  } catch {
    // 用户取消时不处理。
  }
}

function closeDialog() {
  visible.value = false
  form.reason = ''
  formRef.value?.clearValidate()
}

function handleClosed() {
  form.reason = ''
  formRef.value?.clearValidate()
}
</script>

<template>
  <el-dialog v-model="visible" title="驳回评审" width="420px" append-to-body @closed="handleClosed">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="驳回理由" prop="reason" required>
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="6"
          maxlength="500"
          show-word-limit
          placeholder="请输入驳回原因，说明需要修改或补充的内容"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="danger" @click="submitReject">确定驳回</el-button>
    </template>
  </el-dialog>
</template>
