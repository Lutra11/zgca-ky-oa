<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  saved: [blob: Blob, dataUrl: string]
  clear: []
}>()

const canvasRef = ref<HTMLCanvasElement>()
const isDrawing = ref(false)
const isSignatureEmpty = ref(true)
let context: CanvasRenderingContext2D | null = null
let previousPoint: { x: number; y: number } | null = null

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      clearCanvas(false)
      return
    }

    nextTick(() => drawDataUrl(value))
  },
)

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  if (props.modelValue) {
    drawDataUrl(props.modelValue)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})

function resizeCanvas() {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1

  canvas.width = Math.max(1, Math.floor(rect.width * ratio))
  canvas.height = Math.max(1, Math.floor(rect.height * ratio))
  context = canvas.getContext('2d')

  if (!context) {
    return
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.lineWidth = 2.6
  context.strokeStyle = '#246de2'

  if (props.modelValue) {
    drawDataUrl(props.modelValue)
  } else {
    isSignatureEmpty.value = true
  }
}

function drawDataUrl(dataUrl: string) {
  const canvas = canvasRef.value

  if (!canvas || !context) {
    return
  }

  const image = new Image()
  image.onload = () => {
    context?.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    context?.drawImage(image, 0, 0, canvas.clientWidth, canvas.clientHeight)
    isSignatureEmpty.value = false
  }
  image.src = dataUrl
}

function getPointerPosition(event: PointerEvent) {
  const canvas = canvasRef.value
  const rect = canvas?.getBoundingClientRect()

  if (!rect) {
    return { x: 0, y: 0 }
  }

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startDrawing(event: PointerEvent) {
  if (!context) {
    return
  }

  isDrawing.value = true
  previousPoint = getPointerPosition(event)
  canvasRef.value?.setPointerCapture(event.pointerId)
}

function draw(event: PointerEvent) {
  if (!isDrawing.value || !context || !previousPoint) {
    return
  }

  const currentPoint = getPointerPosition(event)

  context.beginPath()
  context.moveTo(previousPoint.x, previousPoint.y)
  context.lineTo(currentPoint.x, currentPoint.y)
  context.stroke()

  previousPoint = currentPoint
  isSignatureEmpty.value = false
}

function finishDrawing(event: PointerEvent) {
  isDrawing.value = false
  previousPoint = null

  if (canvasRef.value?.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId)
  }
}

function clearCanvas(shouldEmit = true) {
  const canvas = canvasRef.value

  if (!canvas || !context) {
    return
  }

  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
  isSignatureEmpty.value = true

  if (shouldEmit) {
    emit('update:modelValue', '')
    emit('clear')
  }
}

function exportSignatureBlob() {
  const canvas = canvasRef.value

  if (!canvas || isSignatureEmpty.value) {
    ElMessage.warning('请先完成手写签名')
    return
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      ElMessage.error('签名导出失败，请重新签名')
      return
    }

    const dataUrl = canvas.toDataURL('image/png')

    emit('update:modelValue', dataUrl)
    emit('saved', blob, dataUrl)
    ElMessage.success('签名已保存')
  }, 'image/png')
}

function isEmpty() {
  return isSignatureEmpty.value
}

defineExpose({
  isEmpty,
  exportSignatureBlob,
})
</script>

<template>
  <div class="signature-pad-shell">
    <header class="signature-toolbar">
      <span>手写签名</span>
      <div>
        <el-button link type="primary" @click="clearCanvas()">清空</el-button>
        <el-button link type="primary" @click="clearCanvas()">重新签名</el-button>
      </div>
    </header>

    <canvas
      ref="canvasRef"
      class="signature-canvas"
      aria-label="手写签名区域"
      @pointerdown.prevent="startDrawing"
      @pointermove.prevent="draw"
      @pointerup.prevent="finishDrawing"
      @pointercancel.prevent="finishDrawing"
      @pointerleave.prevent="finishDrawing"
    ></canvas>

    <footer class="signature-footer">
      <span>{{ isSignatureEmpty ? '请使用鼠标、触控板或触摸屏签名' : '签名已绘制，请点击保存签名' }}</span>
      <el-button size="small" type="primary" plain @click="exportSignatureBlob">保存签名</el-button>
    </footer>
  </div>
</template>

<style scoped>
.signature-pad-shell {
  min-width: 0;
  padding: 12px 14px 8px;
  border: 1px solid #cbdcf9;
  border-radius: 12px;
  background: #fbfdff;
}

.signature-toolbar,
.signature-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.signature-toolbar {
  margin-bottom: 8px;
}

.signature-toolbar span {
  color: #35445d;
  font-size: 13px;
  font-weight: 700;
}

.signature-toolbar :deep(.el-button + .el-button) {
  margin-left: 8px;
}

.signature-canvas {
  width: 100%;
  height: 96px;
  display: block;
  border: 1px dashed #d7e2f2;
  border-radius: 10px;
  background-image:
    linear-gradient(#edf3fb 1px, transparent 1px),
    linear-gradient(90deg, #edf3fb 1px, transparent 1px);
  background-size: 22px 22px;
  touch-action: none;
}

.signature-footer {
  margin-top: 7px;
  color: #8a95a7;
  font-size: 11px;
}

.signature-footer :deep(.el-button) {
  flex: 0 0 auto;
}
</style>
