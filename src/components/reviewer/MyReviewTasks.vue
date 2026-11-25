<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Lock } from '@element-plus/icons-vue'
import {
  getMockReviewTasks,
  reviewConfidentialityItems,
  reviewRuleItems,
} from '../../dataset/reviewerReviewTasksMock'
import type { ReviewerProject, ReviewerProjectStatus } from '../../dataset/reviewerReviewTasksMock'

const router = useRouter()
const sourceProjects = shallowRef<ReviewerProject[]>(getMockReviewTasks())

// 批次选择层（AN 全角色统一入口模式）：先看到立项评审批次卡片，点开后才进入规则确认与任务列表
const activeReviewBatch = shallowRef('')

interface ReviewBatchCard {
  batch: string
  total: number
  pending: number
  draft: number
  done: number
  nearestDeadline: string
}

const reviewBatchCards = computed<ReviewBatchCard[]>(() => {
  const map = new Map<string, ReviewBatchCard>()

  for (const task of sourceProjects.value) {
    const card =
      map.get(task.projectBatch) ?? {
        batch: task.projectBatch,
        total: 0,
        pending: 0,
        draft: 0,
        done: 0,
        nearestDeadline: task.reviewDeadline,
      }

    card.total += 1

    if (task.status === '待评审') {
      card.pending += 1
    } else if (task.status === '草稿') {
      card.draft += 1
    } else {
      card.done += 1
    }

    if (task.reviewDeadline < card.nearestDeadline) {
      card.nearestDeadline = task.reviewDeadline
    }

    map.set(task.projectBatch, card)
  }

  return [...map.values()]
})

const activeBatchTasks = computed(() => {
  if (!activeReviewBatch.value) {
    return []
  }

  return sourceProjects.value.filter((task) => task.projectBatch === activeReviewBatch.value)
})

function enterReviewBatch(batch: string) {
  activeReviewBatch.value = batch
  confidentialityConfirmed.value = false
  confidentialityAgreed.value = false
}

function backToReviewBatchPick() {
  activeReviewBatch.value = ''
  confidentialityConfirmed.value = false
  confidentialityAgreed.value = false
}

const draftFilters = reactive({
  keyword: '',
})

const appliedFilters = reactive({
  keyword: '',
})

// 保密确认闸门：勾选“我已仔细阅读并同意”并点击确认后，才能看到评审任务列表
const confidentialityConfirmed = shallowRef(false)
const confidentialityAgreed = shallowRef(false)

const filteredProjects = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  if (!keyword) {
    return activeBatchTasks.value
  }

  return activeBatchTasks.value.filter((project) =>
    [project.projectCode, project.projectName, project.subDirection]
      .some((value) => value.toLowerCase().includes(keyword)),
  )
})

function applyFilters() {
  appliedFilters.keyword = draftFilters.keyword
}

function resetFilters() {
  draftFilters.keyword = ''
  appliedFilters.keyword = ''
}

function confirmConfidentiality() {
  if (!confidentialityAgreed.value) {
    return
  }

  confidentialityConfirmed.value = true
}

function openReview(project: ReviewerProject) {
  router.push({
    name: 'review-judge-project-review-detail',
    params: { projectId: project.id },
  })
}

function getStatusType(status: ReviewerProjectStatus) {
  if (status === '已评审') {
    return 'success'
  }

  if (status === '草稿') {
    return 'warning'
  }

  return 'info'
}
</script>

<template>
  <section class="my-review-tasks-page" aria-label="我的评审任务">
    <template v-if="!activeReviewBatch">
      <header class="review-batch-page-heading">
        <div>
          <h3>立项评审批次</h3>
          <p>正在评审中的项目批次，点开批次后阅读评审规则并处理分配给您的评审任务。</p>
        </div>
      </header>

      <section class="review-batch-grid" aria-label="立项评审批次列表">
        <article
          v-for="card in reviewBatchCards"
          :key="card.batch"
          class="review-batch-card"
        >
          <header class="review-batch-card-header">
            <h4>{{ card.batch }}</h4>
            <el-tag type="warning" effect="light">评审中</el-tag>
          </header>

          <div class="review-batch-stats">
            <span>评审任务 {{ card.total }} 项</span>
            <span>待评审 {{ card.pending }} 项</span>
            <span>草稿 {{ card.draft }} 项</span>
            <span>已评审 {{ card.done }} 项</span>
          </div>

          <p class="review-batch-deadline">评审截止：{{ card.nearestDeadline }}</p>

          <el-button type="primary" @click="enterReviewBatch(card.batch)">进入评审任务</el-button>
        </article>

        <el-empty
          v-if="reviewBatchCards.length === 0"
          class="review-batch-empty"
          description="暂无分配给您的评审批次"
        />
      </section>
    </template>

    <template v-else>
      <header class="review-batch-context">
        <el-button link @click="backToReviewBatchPick">← 返回批次列表</el-button>
        <div class="review-batch-context-main">
          <h3>{{ activeReviewBatch }}</h3>
          <p>
            评审任务 {{ activeBatchTasks.length }} 项 · 待评审
            {{ activeBatchTasks.filter((task) => task.status === '待评审').length }} 项
          </p>
        </div>
      </header>

      <template v-if="!confidentialityConfirmed">
        <section class="review-rule-panel">
          <header class="rule-heading">
            <div>
              <h3>本批次评审规则</h3>
              <p>PMO 配置・批次锁定・只读</p>
            </div>
            <el-icon class="rule-lock"><Lock /></el-icon>
          </header>
          <ol class="rule-list">
            <li v-for="(item, index) in reviewRuleItems" :key="`rule-${index}`">{{ item }}</li>
          </ol>
        </section>

        <section class="review-rule-panel confidentiality-panel">
          <header class="rule-heading">
            <div>
              <h3>评审保密要求</h3>
              <p>PMO 配置・批次锁定・只读</p>
            </div>
            <el-icon class="rule-lock"><Lock /></el-icon>
          </header>
          <ol class="rule-list">
            <li v-for="(item, index) in reviewConfidentialityItems" :key="`conf-${index}`">{{ item }}</li>
          </ol>

          <footer class="confidentiality-confirm-bar">
            <el-checkbox v-model="confidentialityAgreed">我已仔细阅读并同意上述评审规则与保密要求</el-checkbox>
            <el-button
              type="primary"
              :disabled="!confidentialityAgreed"
              @click="confirmConfidentiality"
            >
              确认
            </el-button>
          </footer>
        </section>
      </template>

      <section v-else class="task-list-panel" aria-label="评审任务列表">
        <header class="task-list-heading">
          <h3>评审任务列表</h3>
        </header>

        <div class="task-filter-bar">
          <el-input
            v-model="draftFilters.keyword"
            class="task-keyword-input"
            clearable
            placeholder="项目名称 / 申请单号"
            @keyup.enter="applyFilters"
          />
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>

        <el-table
          :data="filteredProjects"
          class="task-table"
          empty-text="暂无评审任务"
        >
          <el-table-column prop="projectCode" label="申请单号" width="160" />
          <el-table-column prop="projectName" label="项目名称" min-width="300" show-overflow-tooltip />
          <el-table-column prop="subDirection" label="所属子方向" width="140" />
          <el-table-column prop="reviewDeadline" label="评审截止时间" width="170" />
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openReview(row)">评分</el-button>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </template>
  </section>
</template>

<style scoped>
.my-review-tasks-page {
  display: grid;
  gap: 18px;
  min-width: 0;
  color: #1d1d1f;
}

.review-batch-page-heading {
  padding: 6px 2px 0;
}

.review-batch-page-heading h3 {
  margin: 0;
  font-size: 17px;
  color: #273142;
}

.review-batch-page-heading p {
  margin: 6px 0 0;
  color: #8a93a6;
  font-size: 12.5px;
}

.review-batch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.review-batch-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border: 1px solid #e7eaf0;
  border-radius: 10px;
  background: #ffffff;
}

.review-batch-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.review-batch-card-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #273142;
}

.review-batch-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: #57606f;
  font-size: 12.5px;
}

.review-batch-deadline {
  margin: 0;
  color: #b45209;
  font-size: 12.5px;
}

.review-batch-card .el-button {
  align-self: flex-start;
}

.review-batch-empty {
  grid-column: 1 / -1;
}

.review-batch-context {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1px solid #e5eaf3;
  border-radius: 12px;
  background: #f8fafc;
}

.review-batch-context-main {
  flex: 1;
  min-width: 0;
}

.review-batch-context-main h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2d3d;
}

.review-batch-context-main p {
  margin: 0;
  font-size: 12.5px;
  color: #8492a6;
}

.review-rule-panel,
.task-list-panel {
  min-width: 0;
  padding: 20px 24px;
  border: 1px solid #e7eaf0;
  border-radius: 10px;
  background: #ffffff;
}

.review-rule-panel {
  box-shadow: none;
}

.rule-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.rule-heading h3 {
  margin: 0;
  font-size: 15px;
  color: #273142;
}

.rule-heading p {
  margin: 4px 0 0;
  color: #8a93a6;
  font-size: 12px;
}

.rule-lock {
  color: #9aa4b5;
  font-size: 18px;
}

.rule-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
  color: #57606f;
  font-size: 13px;
  line-height: 1.7;
}

.confidentiality-confirm-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px dashed #e7eaf0;
}

.task-list-heading h3 {
  margin: 0;
  font-size: 15px;
  color: #273142;
}

.task-filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 16px;
}

.task-keyword-input {
  width: 260px;
}

.task-table {
  width: 100%;
}
</style>
