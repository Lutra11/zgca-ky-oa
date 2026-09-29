<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCurrentUser } from '../../../../utils/auth'
import ApprovalDetail from './ApprovalDetail.vue'
import ApprovalList from './ApprovalList.vue'
import RejectReviewDialog from './RejectReviewDialog.vue'
import {
  loadReviewApprovals,
  saveReviewApprovals,
  updateApprovalStatus,
} from '../reviewProjectStorage'
import type { ReviewApproval } from '../types'

const emit = defineEmits<{
  approved: [approval: ReviewApproval]
  rejected: [approval: ReviewApproval]
}>()

const currentUser = getCurrentUser()
const approvals = shallowRef<ReviewApproval[]>(loadReviewApprovals())
const selectedApprovalId = shallowRef('')
const rejectDialogVisible = shallowRef(false)
const rejectTarget = shallowRef<ReviewApproval | null>(null)

const pendingApprovals = computed(() =>
  approvals.value.filter((approval) => approval.status === 'pending'),
)

const selectedApproval = computed(
  () =>
    pendingApprovals.value.find((approval) => approval.id === selectedApprovalId.value) ??
    pendingApprovals.value[0] ??
    null,
)

watch(
  pendingApprovals,
  (items) => {
    if (!items.length) {
      selectedApprovalId.value = ''
      return
    }

    if (!items.some((item) => item.id === selectedApprovalId.value)) {
      selectedApprovalId.value = items[0].id
    }
  },
  { immediate: true },
)

function selectApproval(approval: ReviewApproval) {
  selectedApprovalId.value = approval.id
}

async function approveReview(approval: ReviewApproval) {
  try {
    await ElMessageBox.confirm(
      '确认通过该评审申请吗？通过后将进入评审监控阶段',
      '通过评审申请',
      {
        type: 'info',
        confirmButtonText: '确认通过',
        cancelButtonText: '取消',
        autofocus: false,
      },
    )
  } catch {
    return
  }

  const updatedApprovals = updateApprovalStatus(approvals.value, approval.id, 'approved', {
    operator: currentUser?.displayName ?? '科研部负责人',
  })
  approvals.value = updatedApprovals
  saveReviewApprovals(updatedApprovals)
  ElMessage.success('评审申请已通过，已进入评审监控阶段')
  emit('approved', approval)
}

function openRejectDialog(approval: ReviewApproval) {
  rejectTarget.value = approval
  rejectDialogVisible.value = true
}

function rejectReview(reason: string) {
  const approval = rejectTarget.value

  if (!approval) {
    return
  }

  const updatedApprovals = updateApprovalStatus(approvals.value, approval.id, 'rejected', {
    reason,
    operator: currentUser?.displayName ?? '科研部负责人',
  })
  approvals.value = updatedApprovals
  saveReviewApprovals(updatedApprovals)
  ElMessage.success('评审申请已驳回')
  emit('rejected', approval)
  rejectTarget.value = null
}
</script>

<template>
  <section class="approval-review-tab" aria-label="审批评审">
    <ApprovalList
      :approvals="pendingApprovals"
      :selected-id="selectedApproval?.id ?? ''"
      @select="selectApproval"
    />

    <ApprovalDetail
      :approval="selectedApproval"
      @approve="approveReview"
      @reject="openRejectDialog"
    />

    <RejectReviewDialog v-model="rejectDialogVisible" @confirm="rejectReview" />
  </section>
</template>

<style scoped>
.approval-review-tab {
  display: grid;
  grid-template-columns: minmax(300px, 0.3fr) minmax(0, 0.7fr);
  gap: 14px;
  align-items: start;
}

@media (max-width: 1280px) {
  .approval-review-tab {
    grid-template-columns: 1fr;
  }
}
</style>
