<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import templateDataset from '../../../../dataset/template.json'
import { getCurrentUser } from '../../../../utils/auth'
import ReviewTaskDetail from './ReviewTaskDetail.vue'
import ReviewTaskList from './ReviewTaskList.vue'
import {
  loadSubdirectionReviewDataset,
  replaceReviewTask,
  saveSubdirectionReviewDataset,
} from '../reviewManagementStorage'
import type { SubdirectionReviewDataset, SubdirectionReviewProject, SubdirectionReviewTask } from '../types'

interface TemplateItem {
  id: string
  name: string
  category: '评审标准模板' | '通知模板'
  applicableDepartment: string
  description: string
}

interface TemplateSeed {
  name: string
  description: string
  category: '评审标准模板' | '通知模板'
  scopes: string[]
}

const TEMPLATE_SEED_KEY = 'zgca_ky_oa_template_create_seed'

const route = useRoute()
const router = useRouter()
const currentUser = getCurrentUser()
const datasetState = shallowRef<SubdirectionReviewDataset>(loadSubdirectionReviewDataset())
const selectedTaskId = shallowRef('')
const templates = templateDataset as TemplateItem[]

const visibleTasks = computed(() => {
  if (!currentUser) {
    return []
  }

  if (currentUser.username === 'ky_system') {
    return datasetState.value.tasks
  }

  return datasetState.value.tasks.filter(
    (task) =>
      task.ownerUsernames.includes(currentUser.username) ||
      task.subDirectionLeaderName === currentUser.displayName,
  )
})

const selectedTask = computed(
  () => visibleTasks.value.find((task) => task.id === selectedTaskId.value) ?? visibleTasks.value[0] ?? null,
)

onMounted(() => {
  const queryTaskId = typeof route.query.selectedTaskId === 'string' ? route.query.selectedTaskId : ''
  selectedTaskId.value = queryTaskId || visibleTasks.value[0]?.id || ''
})

watch(
  visibleTasks,
  (tasks) => {
    if (!tasks.length) {
      selectedTaskId.value = ''
      return
    }

    if (!tasks.some((task) => task.id === selectedTaskId.value)) {
      selectedTaskId.value = tasks[0].id
    }
  },
  { immediate: true },
)

function selectTask(task: SubdirectionReviewTask) {
  selectedTaskId.value = task.id
}

function updateTask(nextTask: SubdirectionReviewTask, message: string) {
  const nextDataset = replaceReviewTask(datasetState.value, nextTask)
  datasetState.value = nextDataset
  saveSubdirectionReviewDataset(nextDataset)
  ElMessage.success(message)
}

function viewProject(project: SubdirectionReviewProject) {
  router.push({
    name: 'sub-direction-leader-review-management-detail',
    params: { projectId: project.projectCode },
    query: { selectedTaskId: selectedTaskId.value },
  })
}

function editTemplate(templateId: string, taskId: string) {
  const template = templates.find((item) => item.id === templateId)

  if (!template) {
    ElMessage.warning('未找到对应模板，无法编辑')
    return
  }

  const seed: TemplateSeed = {
    name: template.name,
    description: template.description,
    category: template.category,
    scopes: [template.applicableDepartment],
  }

  window.sessionStorage.setItem(TEMPLATE_SEED_KEY, JSON.stringify(seed))
  router.push({
    name: 'sub-direction-leader-template-new',
    query: {
      templateId,
      selectedTaskId: taskId,
      returnTo: '/sub-direction-leader/review-management',
    },
  })
}
</script>

<template>
  <section class="review-info-tab" aria-label="完善评审信息">
    <ReviewTaskList
      :tasks="visibleTasks"
      :selected-id="selectedTaskId"
      @select="selectTask"
    />

    <ReviewTaskDetail
      :task="selectedTask"
      :reviewer-candidates="datasetState.reviewerCandidates"
      @update-task="updateTask"
      @view-project="viewProject"
      @edit-template="editTemplate"
    />
  </section>
</template>

<style scoped>
.review-info-tab {
  display: grid;
  grid-template-columns: minmax(260px, 0.28fr) minmax(0, 0.72fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 1180px) {
  .review-info-tab {
    grid-template-columns: 1fr;
  }
}
</style>
