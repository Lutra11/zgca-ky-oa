<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check, DocumentChecked } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import templateDataset from '../../../dataset/template.json'
import AssessmentPeriodTab from './AssessmentPeriodTab.vue'
import EvaluationRuleTab from './EvaluationRuleTab.vue'
import MaterialDeadlineTab from './MaterialDeadlineTab.vue'
import ProjectLevelTab from './ProjectLevelTab.vue'
import ReminderSettingTab from './ReminderSettingTab.vue'
import {
  createDefaultDraft,
  getNextTabName,
  getPreviousTabName,
  getTabIndex,
  isLastReviewConfigTab,
  loadReviewConfigDraft,
  reviewConfigTabs,
  saveReviewConfigDraft,
} from './reviewConfigStorage'
import type { ReviewConfigDraft, ReviewConfigTabExpose, ReviewConfigTabName } from './types'

interface TemplateItem {
  id: string
  name: string
}

const route = useRoute()
const router = useRouter()
const defaultReviewId = 'RV2026001'
const reviewId = computed(() => String(route.params.reviewId ?? defaultReviewId))
const isDraftFound = shallowRef(true)
const activeTab = shallowRef<ReviewConfigTabName>('assessment-periods')
const draft = reactive<ReviewConfigDraft>(createDefaultDraft(reviewId.value))

const assessmentRef = ref<ReviewConfigTabExpose | null>(null)
const evaluationRef = ref<ReviewConfigTabExpose | null>(null)
const levelRef = ref<ReviewConfigTabExpose | null>(null)
const reminderRef = ref<ReviewConfigTabExpose | null>(null)
const deadlineRef = ref<ReviewConfigTabExpose | null>(null)

const templates = templateDataset as TemplateItem[]

const currentTabIndex = computed(() => getTabIndex(activeTab.value) + 1)
const isLastTab = computed(() => isLastReviewConfigTab(activeTab.value))
const launchPath = computed(() => route.path.replace(/\/[^/]+\/config-detail$/, ''))

const selectedProjectCount = computed(() => draft.baseConfig.selectedProjects.length)
const reviewTemplateName = computed(() => getTemplateName(draft.baseConfig.reviewTemplateId))
const noticeTemplateName = computed(() => getTemplateName(draft.baseConfig.noticeTemplateId))

watch(
  reviewId,
  () => {
    loadCurrentDraft()
  },
  { immediate: true },
)

function loadCurrentDraft() {
  const loadedDraft = loadReviewConfigDraft(reviewId.value)

  if (!loadedDraft) {
    isDraftFound.value = false
    return
  }

  isDraftFound.value = true
  Object.assign(draft, loadedDraft)
  activeTab.value = loadedDraft.currentStep
}

watch(
  draft,
  () => {
    if (isDraftFound.value) {
      saveReviewConfigDraft(draft)
    }
  },
  { deep: true },
)

async function goPrevious() {
  if (activeTab.value === 'assessment-periods') {
    router.push(launchPath.value)
    return
  }

  activeTab.value = getPreviousTabName(activeTab.value)
  draft.currentStep = activeTab.value
  saveReviewConfigDraft(draft)
}

async function saveAndContinue() {
  const saved = await validateTab(activeTab.value, true)

  if (!saved) {
    return
  }

  draft.currentStep = activeTab.value
  saveReviewConfigDraft(draft)

  if (isLastTab.value) {
    await finishReviewLaunch()
    return
  }

  activeTab.value = getNextTabName(activeTab.value)
  draft.currentStep = activeTab.value
  saveReviewConfigDraft(draft)
}

async function finishReviewLaunch() {
  const isValid = await validateAllTabs()

  if (!isValid) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认发起本次评审？\n评审名称：${draft.baseConfig.reviewName}\n参评项目数量：${selectedProjectCount.value}\n评审周期数量：${draft.assessmentPeriods.length}\n评审模板：${reviewTemplateName.value}\n通知模板：${noticeTemplateName.value}`,
      '完成配置并发起评审',
      {
        type: 'warning',
        confirmButtonText: '确认发起',
        cancelButtonText: '取消',
        autofocus: false,
      },
    )
    draft.status = 'launched'
    saveReviewConfigDraft(draft)
    ElMessage.success('评审已成功发起')
    router.push(launchPath.value)
  } catch {
    // 用户取消发起时不需要额外处理。
  }
}

async function validateAllTabs() {
  for (const tab of reviewConfigTabs) {
    const valid = await validateTab(tab.name, false)

    if (!valid) {
      activeTab.value = tab.name
      draft.currentStep = tab.name
      return false
    }
  }

  return true
}

async function validateTab(tabName: ReviewConfigTabName, showMessage: boolean) {
  const expose = getTabExpose(tabName)

  if (!expose) {
    ElMessage.error('当前配置组件尚未加载，请稍后重试')
    return false
  }

  return expose.validateAndSave(showMessage)
}

function getTabExpose(tabName: ReviewConfigTabName) {
  const exposeMap: Record<ReviewConfigTabName, ReviewConfigTabExpose | null> = {
    'assessment-periods': assessmentRef.value,
    'evaluation-rules': evaluationRef.value,
    'project-levels': levelRef.value,
    'reminder-settings': reminderRef.value,
    'material-deadline': deadlineRef.value,
  }

  return exposeMap[tabName]
}

function getTemplateName(templateId: string) {
  return templates.find((template) => template.id === templateId)?.name ?? templateId
}
</script>

<template>
  <section class="review-config-page" aria-label="发起评审详情配置">
    <template v-if="isDraftFound">
      <header class="page-heading">
        <div>
          <p class="page-kicker">评审配置草稿 · {{ draft.reviewId }}</p>
          <h2>发起评审详情配置</h2>
          <p>请完善本次评审的详细规则与提醒设置</p>
        </div>

        <div class="draft-summary">
          <span>当前步骤 {{ currentTabIndex }} / {{ reviewConfigTabs.length }}</span>
          <strong>{{ draft.baseConfig.reviewName }}</strong>
          <em>{{ selectedProjectCount }} 个参评项目</em>
        </div>
      </header>

      <article class="config-shell">
        <el-tabs v-model="activeTab" class="config-tabs">
          <el-tab-pane
            v-for="tab in reviewConfigTabs"
            :key="tab.name"
            :label="tab.label"
            :name="tab.name"
          />
        </el-tabs>

        <div class="tab-content">
          <AssessmentPeriodTab
            v-show="activeTab === 'assessment-periods'"
            ref="assessmentRef"
            v-model="draft.assessmentPeriods"
          />
          <EvaluationRuleTab
            v-show="activeTab === 'evaluation-rules'"
            ref="evaluationRef"
            v-model="draft.evaluationRules"
          />
          <ProjectLevelTab
            v-show="activeTab === 'project-levels'"
            ref="levelRef"
            v-model="draft.projectLevels"
          />
          <ReminderSettingTab
            v-show="activeTab === 'reminder-settings'"
            ref="reminderRef"
            v-model="draft.reminderSettings"
          />
          <MaterialDeadlineTab
            v-show="activeTab === 'material-deadline'"
            ref="deadlineRef"
            v-model="draft.materialDeadlineSetting"
            :assessment-periods="draft.assessmentPeriods"
            :base-config="draft.baseConfig"
          />
        </div>
      </article>

      <footer class="config-action-bar">
        <el-button :icon="ArrowLeft" @click="goPrevious">上一步</el-button>
        <el-button type="primary" @click="saveAndContinue">
          <template v-if="isLastTab">
            <el-icon><Check /></el-icon>
            完成配置并发起评审
          </template>
          <template v-else>
            保存并继续
            <el-icon><ArrowRight /></el-icon>
          </template>
        </el-button>
      </footer>
    </template>

    <el-result
      v-else
      icon="warning"
      title="未找到对应评审配置"
      sub-title="请先完成发起评审基础配置，或返回数据维护入口选择已有配置。"
    >
      <template #extra>
        <el-button :icon="DocumentChecked" type="primary" @click="router.push(launchPath)">
          返回数据维护
        </el-button>
      </template>
    </el-result>
  </section>
</template>

<style scoped>
.review-config-page {
  display: grid;
  gap: 16px;
  padding-bottom: 76px;
  animation: config-fade-in 0.24s ease both;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.page-heading h2,
.page-heading p,
.draft-summary strong,
.draft-summary span,
.draft-summary em {
  margin: 0;
}

.page-heading h2 {
  color: #1d1d1f;
  font-size: 26px;
  font-weight: 860;
}

.page-heading p {
  margin-top: 6px;
  color: #6e6e73;
  font-size: 14px;
}

.page-kicker {
  color: #0a84ff !important;
  font-size: 12px !important;
  font-weight: 820;
}

.draft-summary {
  display: grid;
  justify-items: end;
  gap: 5px;
  text-align: right;
}

.draft-summary span,
.draft-summary em {
  color: #86868b;
  font-size: 12px;
  font-style: normal;
}

.draft-summary strong {
  color: #1d1d1f;
  font-size: 15px;
}

.config-shell {
  overflow: hidden;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 40px rgba(26, 39, 68, 0.07);
}

.config-tabs {
  padding: 0 22px;
}

.config-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.config-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: rgba(29, 29, 31, 0.07);
}

.config-tabs :deep(.el-tabs__item) {
  height: 58px;
  padding: 0 30px;
  color: #6e6e73;
  font-size: 15px;
  font-weight: 780;
}

.config-tabs :deep(.el-tabs__item.is-active) {
  color: #0a84ff;
}

.config-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: #0a84ff;
}

.tab-content {
  padding: 22px;
}

.config-action-bar {
  position: sticky;
  bottom: 0;
  z-index: 12;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 -4px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 -12px 34px rgba(26, 39, 68, 0.08);
  backdrop-filter: blur(18px);
}

.config-action-bar :deep(.el-button) {
  min-width: 120px;
  height: 42px;
  border-radius: 10px;
  font-weight: 780;
}

.config-action-bar :deep(.el-button--primary) {
  min-width: 168px;
}

@keyframes config-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1080px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .draft-summary {
    justify-items: start;
    text-align: left;
  }

  .config-tabs :deep(.el-tabs__item) {
    padding: 0 14px;
  }

  .config-action-bar {
    flex-direction: column;
  }
}
</style>
