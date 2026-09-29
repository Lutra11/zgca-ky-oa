<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  applicationStatusLabelMap,
  getRecruitmentPendingCount,
  recruitmentStatusLabelMap,
  getDisplayRecruitmentStatus,
  type ProjectRecruitment,
  type ProjectRecruitmentState,
} from '../../../dataset/projectRecruitmentMock'

const props = defineProps<{
  modelValue: boolean
  recruitment: ProjectRecruitment | null
  state: ProjectRecruitmentState
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()

const joinApplications = computed(() => {
  if (!props.recruitment) {
    return []
  }

  return props.state.applications.filter(
    (application) =>
      application.application_type === 'JOIN' && application.recruitment_id === props.recruitment?.id,
  )
})

const status = computed(() => (props.recruitment ? getDisplayRecruitmentStatus(props.recruitment) : 'DRAFT'))

function statusType(value: string) {
  if (value === 'PUBLISHED' || value === 'APPROVED') {
    return 'success'
  }

  if (value === 'PENDING' || value === 'DRAFT') {
    return 'warning'
  }

  if (value === 'REJECTED') {
    return 'danger'
  }

  return 'info'
}

function getApplicationStatusLabel(status: string) {
  return applicationStatusLabelMap[status as keyof typeof applicationStatusLabelMap] ?? status
}

function goApplications() {
  emit('update:modelValue', false)
  router.push('/project-member/project-recruitment-applications?type=join')
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    size="min(920px, 88vw)"
    append-to-body
    class="recruitment-detail-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div v-if="recruitment" class="drawer-title-block">
        <h2>{{ recruitment.project_name }}</h2>
        <p>
          {{ recruitment.project_code }}
          <span>·</span>
          招募人数：{{ recruitment.planned_count }} 人
          <span>·</span>
          截止：{{ recruitment.application_deadline }}
        </p>
      </div>
    </template>

    <template v-if="recruitment">
      <section class="drawer-summary-grid">
        <article>
          <span>计划招募</span>
          <strong>{{ recruitment.planned_count }} 人</strong>
        </article>
        <article>
          <span>已录用</span>
          <strong>{{ recruitment.admitted_count }} 人</strong>
        </article>
        <article>
          <span>待审批</span>
          <strong>{{ getRecruitmentPendingCount(state, recruitment.id) }} 条</strong>
        </article>
        <article>
          <span>招募状态</span>
          <strong>{{ recruitmentStatusLabelMap[status] }}</strong>
        </article>
      </section>

      <section class="drawer-panel">
        <header>
          <h3>招募要求</h3>
          <el-tag effect="light" :type="statusType(status)">{{ recruitmentStatusLabelMap[status] }}</el-tag>
        </header>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目负责人姓名">{{ recruitment.leader_name }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ recruitment.department_name }}</el-descriptions-item>
          <el-descriptions-item label="项目负责人介绍" :span="2">
            {{ recruitment.leader_introduction || '暂无负责人介绍' }}
          </el-descriptions-item>
          <el-descriptions-item label="项目简介" :span="2">{{ recruitment.project_description }}</el-descriptions-item>
          <el-descriptions-item label="招募方向及要求" :span="2">{{ recruitment.requirements }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="drawer-panel">
        <header>
          <div>
            <h3>学生申请列表</h3>
            <p>展示该招募岗位下的加入申请，审批会在“加入与退出审批”页面完成。</p>
          </div>
          <el-button type="primary" plain @click="goApplications">进入审批</el-button>
        </header>

        <el-table :data="joinApplications" row-key="id">
          <el-table-column label="学生" min-width="150">
            <template #default="{ row }">
              <div class="applicant-cell">
                <strong>{{ row.student_name }}</strong>
                <span>{{ row.student_no }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="college" label="所属单位" min-width="170" show-overflow-tooltip />
          <el-table-column prop="grade" label="年级" width="120" />
          <el-table-column prop="available_time" label="每周投入" width="120" />
          <el-table-column label="申请状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="light" :type="statusType(row.status)">
                {{ getApplicationStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="申请时间" width="150" />
          <template #empty>
            <el-empty description="暂无学生申请" />
          </template>
        </el-table>
      </section>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-title-block h2 {
  margin: 0;
  color: #1c2c46;
  font-size: 20px;
  font-weight: 780;
}

.drawer-title-block p {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 7px 0 0;
  color: #7e8da5;
  font-size: 12px;
}

.drawer-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.drawer-summary-grid article,
.drawer-panel {
  border: 1px solid #e3ebf6;
  border-radius: 13px;
  background: #fff;
}

.drawer-summary-grid article {
  min-width: 0;
  padding: 14px;
}

.drawer-summary-grid span {
  display: block;
  color: #8390a5;
  font-size: 11px;
}

.drawer-summary-grid strong {
  display: block;
  margin-top: 7px;
  color: #1c2c46;
  font-size: 20px;
}

.drawer-panel {
  overflow: hidden;
  margin-bottom: 14px;
}

.drawer-panel > header {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid #edf1f6;
}

.drawer-panel h3 {
  margin: 0;
  color: #1c2c46;
  font-size: 16px;
}

.drawer-panel p {
  margin: 5px 0 0;
  color: #8a98ab;
  font-size: 12px;
}

.drawer-panel :deep(.el-descriptions) {
  padding: 16px;
}

.applicant-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.applicant-cell strong {
  color: #233755;
}

.applicant-cell span {
  color: #8a98ab;
  font-size: 12px;
}

@media (max-width: 900px) {
  .drawer-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .drawer-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
