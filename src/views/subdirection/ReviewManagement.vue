<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import ReviewResultTab from '../kyowner/review-projects/components/ReviewResultTab.vue'
import {
  loadSubdirectionReviewDataset,
} from './review-management/reviewManagementStorage'
import ReviewInfoTab from './review-management/components/ReviewInfoTab.vue'

const activeTab = shallowRef<'info' | 'result'>('info')
const dataset = loadSubdirectionReviewDataset()
const managedSubDirections = computed(() => dataset.managedSubDirections)
</script>

<template>
  <section class="subdirection-review-page" aria-label="评审管理">
    <header class="page-heading">
   
    </header>

    <article class="review-tabs-card">
      <el-tabs v-model="activeTab" class="review-tabs">
        <el-tab-pane label="完善评审信息" name="info">
          <ReviewInfoTab />
        </el-tab-pane>

        <el-tab-pane label="评审结果" name="result">
          <ReviewResultTab
            :allowed-sub-directions="managedSubDirections"
            :show-actions="false"
            project-detail-route-name="sub-direction-leader-review-management-detail"
          />
        </el-tab-pane>
      </el-tabs>
    </article>
  </section>
</template>

<style scoped>
.subdirection-review-page {
  display: grid;
  gap: 16px;
  color: #1d1d1f;
  animation: fade-up 0.24s ease both;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.page-heading h1,
.page-heading p {
  margin: 0;
}

.page-heading h1 {
  font-size: 30px;
  font-weight: 860;
  letter-spacing: 0;
}

.page-heading p {
  margin-top: 8px;
  color: #6e6e73;
  font-size: 14px;
}

.review-tabs-card {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 0 14px 14px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.review-tabs :deep(.el-tabs__header) {
  margin: 0 0 16px;
}

.review-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: rgba(29, 29, 31, 0.08);
}

.review-tabs :deep(.el-tabs__item) {
  height: 56px;
  padding: 0 34px;
  color: #424245;
  font-weight: 800;
}

.review-tabs :deep(.el-tabs__item.is-active) {
  color: #0a84ff;
}

.review-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: #0a84ff;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
