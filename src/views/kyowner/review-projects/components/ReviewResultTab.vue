<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, DocumentAdd } from '@element-plus/icons-vue'
import resultDataset from '../../../../dataset/review_results.json'
import FacultyResultCards from './FacultyResultCards.vue'
import ResultProjectTable from './ResultProjectTable.vue'
import type { FacultyReviewResult, ReviewResultProject } from '../types'

const props = withDefaults(
  defineProps<{
    allowedSubDirections?: string[]
    showActions?: boolean
    projectDetailRouteName?: string
    announcementPath?: string
  }>(),
  {
    allowedSubDirections: () => [],
    showActions: true,
    projectDetailRouteName: 'research-dept-leader-review-projects-detail',
    announcementPath: '/research-dept-leader/announcement-publishing',
  },
)

const router = useRouter()
const rawResults = resultDataset as FacultyReviewResult[]
const activeFaculty = shallowRef(rawResults[0]?.faculty ?? '')

const results = computed<FacultyReviewResult[]>(() => {
  const allowedSet = new Set(props.allowedSubDirections)

  if (!allowedSet.size) {
    return rawResults
  }

  return rawResults
    .map((result) => ({
      ...result,
      projects: result.projects.filter((project) => allowedSet.has(project.subDirection)),
    }))
    .filter((result) => result.projects.length)
})

const currentResult = computed(
  () => results.value.find((result) => result.faculty === activeFaculty.value) ?? results.value[0] ?? null,
)

const levelStats = computed(() => {
  const projects = currentResult.value?.projects ?? []
  const stats = {
    total: projects.length,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  }

  projects.forEach((project) => {
    stats[project.finalLevel] += 1
  })

  return stats
})

const canGenerateAnnouncement = computed(() => {
  const result = currentResult.value

  if (!result) {
    return false
  }

  return Boolean(result.summary.trim() && result.projects.every((project) => project.finalLevel))
})

const disabledTip = computed(() =>
  canGenerateAnnouncement.value ? '' : '当前学部存在未完成评级或未填写学部总体评语',
)

const statCards = computed(() => [
  { label: '总项目数', value: levelStats.value.total, tone: 'neutral' },
  { label: 'A级项目', value: levelStats.value.A, tone: 'blue' },
  { label: 'B级项目', value: levelStats.value.B, tone: 'green' },
  { label: 'C级项目', value: levelStats.value.C, tone: 'orange' },
  { label: 'D级项目', value: levelStats.value.D, tone: 'gray' },
])

watch(
  results,
  (nextResults) => {
    if (!nextResults.length) {
      activeFaculty.value = ''
      return
    }

    if (!nextResults.some((result) => result.faculty === activeFaculty.value)) {
      activeFaculty.value = nextResults[0].faculty
    }
  },
  { immediate: true },
)

function selectFaculty(faculty: string) {
  activeFaculty.value = faculty
}

function viewProject(project: ReviewResultProject) {
  if (props.projectDetailRouteName) {
    router.push({
      name: props.projectDetailRouteName,
      params: { projectId: project.projectCode },
    })
    return
  }

  ElMessage.info(`${project.projectCode} 项目详情入口已预留`)
}

function goBack() {
  router.back()
}

function generateAnnouncement() {
  const result = currentResult.value

  if (!result || !canGenerateAnnouncement.value) {
    ElMessage.warning(disabledTip.value)
    return
  }

  router.push({
    path: props.announcementPath,
    query: {
      mode: 'independent',
      faculty: result.faculty,
      projectCodes: result.projects.map((project) => project.projectCode).join(','),
      source: 'review-results',
    },
  })
}
</script>

<template>
  <section class="review-result-tab" aria-label="评审结果">
    <FacultyResultCards
      :results="results"
      :active-faculty="activeFaculty"
      @select="selectFaculty"
    />

    <template v-if="currentResult">
      <section class="result-summary-card">
        <div
          v-for="card in statCards"
          :key="card.label"
          class="result-stat"
          :class="`stat-${card.tone}`"
        >
          <strong>{{ card.value }}</strong>
          <span>{{ card.label }}</span>
        </div>

        <div class="faculty-comment">
          <span>学部总体评语：</span>
          <p>{{ currentResult.summary }}</p>
        </div>
      </section>

      <ResultProjectTable :projects="currentResult.projects" @view="viewProject" />
    </template>

    <el-empty v-else description="暂无评审结果数据" :image-size="112" />

    <footer v-if="showActions" class="result-actions">
      <el-button :icon="Back" @click="goBack">返回</el-button>
      <el-tooltip :disabled="canGenerateAnnouncement" :content="disabledTip" placement="top">
        <span>
          <el-button
            :icon="DocumentAdd"
            type="primary"
            :disabled="!canGenerateAnnouncement"
            @click="generateAnnouncement"
          >
            生成公告
          </el-button>
        </span>
      </el-tooltip>
    </footer>
  </section>
</template>

<style scoped>
.review-result-tab {
  display: grid;
  gap: 14px;
}

.result-summary-card {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.result-stat {
  display: grid;
  place-items: center;
  gap: 6px;
  min-height: 86px;
  border-radius: 10px;
  background: #f8fbff;
}

.result-stat strong {
  font-size: 28px;
  line-height: 1;
  font-weight: 860;
}

.result-stat span {
  color: #424245;
  font-size: 13px;
  font-weight: 760;
}

.stat-neutral strong {
  color: #1d1d1f;
}

.stat-blue {
  background: #eef6ff;
}

.stat-blue strong {
  color: #0a84ff;
}

.stat-green {
  background: #eafaf1;
}

.stat-green strong {
  color: #1fbd72;
}

.stat-orange {
  background: #fff5e8;
}

.stat-orange strong {
  color: #ff8a1f;
}

.stat-gray {
  background: #f2f4f8;
}

.stat-gray strong {
  color: #6e6e73;
}

.faculty-comment {
  grid-column: 1 / -1;
  border-radius: 10px;
  padding: 14px 16px;
  background: #eef6ff;
}

.faculty-comment span {
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 800;
}

.faculty-comment p {
  margin: 8px 0 0;
  color: #424245;
  line-height: 1.7;
}

.result-actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 -12px 34px rgba(26, 39, 68, 0.08);
  backdrop-filter: blur(18px);
}

.result-actions :deep(.el-button) {
  min-width: 128px;
  height: 42px;
  border-radius: 10px;
  font-weight: 780;
}

@media (max-width: 1180px) {
  .result-summary-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .result-summary-card,
  .result-actions {
    grid-template-columns: 1fr;
  }

  .result-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
