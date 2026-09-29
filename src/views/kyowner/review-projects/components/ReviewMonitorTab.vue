<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Right, Warning } from '@element-plus/icons-vue'
import OwnerMonitorProgress from '../../../owner/MonitorProgress.vue'

const emit = defineEmits<{
  next: []
}>()

async function changeReviewInfo() {
  try {
    await ElMessageBox.confirm('确认进入评审信息变更流程吗？关键变更将记录操作日志。', '变更评审信息', {
      type: 'info',
      confirmButtonText: '确认变更',
      cancelButtonText: '取消',
      autofocus: false,
    })
    ElMessage.success('评审信息变更入口已预留')
  } catch {
    // 用户取消时不处理。
  }
}

async function cancelReview() {
  try {
    await ElMessageBox.confirm('取消评审会影响当前执行中的评审任务，是否继续？', '取消评审', {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      autofocus: false,
    })
    ElMessage.success('取消评审操作已模拟提交')
  } catch {
    // 用户取消时不处理。
  }
}

function goNext() {
  ElMessage.success('已进入评审结果查看')
  emit('next')
}
</script>

<template>
  <section class="review-monitor-tab" aria-label="评审监控">
    <OwnerMonitorProgress
      query-path="/research-dept-leader/review-projects"
      project-detail-route-name="research-dept-leader-review-projects-detail"
    />

    <footer class="monitor-actions">
      <el-button :icon="EditPen" plain type="primary" @click="changeReviewInfo">
        变更评审信息
      </el-button>
      <el-button :icon="Warning" plain type="danger" @click="cancelReview">
        取消评审
      </el-button>
      <el-button :icon="Right" type="primary" @click="goNext">下一步</el-button>
    </footer>
  </section>
</template>

<style scoped>
.review-monitor-tab {
  display: grid;
  gap: 14px;
}

.monitor-actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 -12px 34px rgba(26, 39, 68, 0.08);
  backdrop-filter: blur(18px);
}

.monitor-actions :deep(.el-button) {
  min-width: 132px;
  height: 42px;
  border-radius: 10px;
  font-weight: 780;
}

@media (max-width: 760px) {
  .monitor-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
