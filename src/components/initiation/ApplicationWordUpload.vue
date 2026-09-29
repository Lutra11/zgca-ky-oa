<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Document, Upload } from '@element-plus/icons-vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import type { ApplicationWordFileState } from '../../dataset/projectApplicationMock'

const props = defineProps<{
  wordFile?: ApplicationWordFileState | null
}>()

const emit = defineEmits<{
  upload: [file: File]
  preview: []
}>()

const uploadRef = shallowRef<UploadInstance>()

const uploadStatusLabel = computed(() => {
  if (!props.wordFile) {
    return '待上传'
  }

  return props.wordFile.upload_status === 'UPLOADED' ? '已上传' : '上传失败'
})

const convertStatusLabel = computed(() => {
  if (!props.wordFile) {
    return '待转换'
  }

  const labelMap = {
    WAITING: '待转换',
    CONVERTING: '转换中',
    CONVERTED: '已转换为 PDF',
    ERROR: '转换失败',
  } as const

  return labelMap[props.wordFile.convert_status]
})

const convertStatusType = computed(() => {
  if (!props.wordFile) {
    return 'info'
  }

  if (props.wordFile.convert_status === 'CONVERTED') {
    return 'success'
  }

  if (props.wordFile.convert_status === 'ERROR') {
    return 'danger'
  }

  return 'warning'
})

function handleUploadChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw

  if (!rawFile) {
    return
  }

  emit('upload', rawFile)
  uploadRef.value?.clearFiles()
}
</script>

<template>
  <div class="application-word-upload">
    <el-upload
      v-if="!wordFile"
      ref="uploadRef"
      class="word-upload-drop"
      action="#"
      drag
      :auto-upload="false"
      :show-file-list="false"
      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      :on-change="handleUploadChange"
    >
      <el-icon class="word-upload-icon"><Upload /></el-icon>
      <div class="word-upload-copy">
        <strong>点击或拖拽上传项目申报书 Word</strong>
        <span>仅支持 DOC / DOCX，单个文件不超过 20MB，不支持 DOCM</span>
      </div>
    </el-upload>

    <section v-else class="word-file-card">
      <span class="word-file-icon">
        <el-icon><Document /></el-icon>
      </span>

      <div class="word-file-info">
        <strong>{{ wordFile.name }}</strong>
        <span>{{ wordFile.size }} · {{ wordFile.uploaded_at }}</span>
      </div>

      <div class="word-file-status">
        <el-tag size="small" type="success" effect="plain">{{ uploadStatusLabel }}</el-tag>
        <el-tag size="small" :type="convertStatusType" effect="plain">{{ convertStatusLabel }}</el-tag>
      </div>

      <div class="word-file-actions">
        <el-upload
          ref="uploadRef"
          action="#"
          :auto-upload="false"
          :show-file-list="false"
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          :on-change="handleUploadChange"
        >
          <el-button link type="primary">替换文件</el-button>
        </el-upload>
        <el-button
          link
          type="primary"
          :disabled="wordFile.convert_status !== 'CONVERTED'"
          @click="emit('preview')"
        >
          预览PDF
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.application-word-upload {
  min-width: 0;
}

.word-upload-drop :deep(.el-upload),
.word-upload-drop :deep(.el-upload-dragger) {
  width: 100%;
}

.word-upload-drop :deep(.el-upload-dragger) {
  min-height: 118px;
  display: grid;
  place-items: center;
  padding: 22px;
  border-color: #cbdcf9;
  border-radius: 12px;
  background: #fbfdff;
}

.word-upload-icon {
  width: 38px;
  height: 38px;
  margin-bottom: 8px;
  border-radius: 10px;
  color: #2e73e8;
  background: #eef5ff;
}

.word-upload-copy {
  display: grid;
  gap: 6px;
}

.word-upload-copy strong {
  color: #26344d;
  font-size: 14px;
}

.word-upload-copy span {
  color: #8a95a7;
  font-size: 12px;
}

.word-file-card {
  min-width: 0;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e3ebf8;
  border-radius: 12px;
  background: #fbfdff;
}

.word-file-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #2e73e8;
  background: #edf4ff;
}

.word-file-info {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.word-file-info strong {
  overflow: hidden;
  color: #203452;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.word-file-info span {
  color: #8a95a7;
  font-size: 12px;
}

.word-file-status,
.word-file-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.word-file-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 980px) {
  .word-file-card {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .word-file-status,
  .word-file-actions {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>
