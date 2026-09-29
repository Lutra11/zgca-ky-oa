<script setup lang="ts">
import { shallowRef } from 'vue'
import ApprovalReviewTab from './review-projects/components/ApprovalReviewTab.vue'
import ReviewMonitorTab from './review-projects/components/ReviewMonitorTab.vue'
import ReviewResultTab from './review-projects/components/ReviewResultTab.vue'
import type { ReviewProjectTab } from './review-projects/types'

const activeTab = shallowRef<ReviewProjectTab>('approval')

function openMonitorTab() {
  activeTab.value = 'monitor'
}

function openResultTab() {
  activeTab.value = 'result'
}
</script>

<template>
  <section class="review-projects-page" aria-label="评审项目">
    <header class="page-heading">
      <div>
        <h1>评审项目</h1>
        <p>管理评审申请的审批、监控与结果，确保评审流程合规高效</p>
      </div>
    </header>

    <article class="review-tabs-card">
      <el-tabs v-model="activeTab" class="review-tabs">
        <el-tab-pane label="审批评审" name="approval">
          <ApprovalReviewTab @approved="openMonitorTab" />
        </el-tab-pane>

        <el-tab-pane label="评审监控" name="monitor">
          <ReviewMonitorTab @next="openResultTab" />
        </el-tab-pane>

        <el-tab-pane label="评审结果" name="result">
          <ReviewResultTab />
        </el-tab-pane>
      </el-tabs>
    </article>
  </section>
</template>

<style scoped>
.review-projects-page {
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
