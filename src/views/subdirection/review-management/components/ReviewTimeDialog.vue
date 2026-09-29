<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'

const visible = defineModel<boolean>({ required: true })

const props = defineProps<{
  reviewPeriod: [string, string]
  initialRange: [string, string]
}>()

const emit = defineEmits<{
  confirm: [range: [string, string]]
}>()

const range = shallowRef<[string, string] | []>([])

const reviewStartTime = computed(() => toTimestamp(props.reviewPeriod[0]))
const reviewEndTime = computed(() => toTimestamp(props.reviewPeriod[1]))

watch(
  () => visible.value,
  (nextVisible) => {
    if (nextVisible) {
      range.value = props.initialRange[0] && props.initialRange[1] ? [...props.initialRange] : []
    }
  },
)

function disableOutOfReviewPeriod(date: Date) {
  const time = date.getTime()
  const startDay = startOfDay(reviewStartTime.value)
  const endDay = endOfDay(reviewEndTime.value)

  return time < startDay || time > endDay
}

function confirmTime() {
  if (!Array.isArray(range.value) || range.value.length !== 2) {
    ElMessage.warning('请选择评审开始时间和评审截止时间')
    return
  }

  const [start, end] = range.value
  const startTime = toTimestamp(start)
  const endTime = toTimestamp(end)

  if (startTime > endTime) {
    ElMessage.warning('评审开始时间不能晚于截止时间')
    return
  }

  if (startTime < reviewStartTime.value || endTime > reviewEndTime.value) {
    ElMessage.warning('评审时间不能超出本次评审总周期')
    return
  }

  emit('confirm', [start, end])
  visible.value = false
}

function toTimestamp(value: string) {
  return new Date(value.replace(/-/g, '/')).getTime()
}

function startOfDay(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function endOfDay(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}
</script>

<template>
  <el-dialog v-model="visible" title="指定评审时间" width="560px" append-to-body>
    <section class="time-dialog">
      <p>本次评审总周期：{{ reviewPeriod[0] }} 至 {{ reviewPeriod[1] }}</p>
      <el-date-picker
        v-model="range"
        type="datetimerange"
        start-placeholder="评审开始时间"
        end-placeholder="评审截止时间"
        format="YYYY-MM-DD HH:mm"
        value-format="YYYY-MM-DD HH:mm"
        :disabled-date="disableOutOfReviewPeriod"
      />
    </section>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirmTime">确认时间</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.time-dialog {
  display: grid;
  gap: 14px;
}

.time-dialog p {
  margin: 0;
  color: #6e6e73;
  font-size: 13px;
}

.time-dialog :deep(.el-date-editor) {
  width: 100%;
}
</style>
