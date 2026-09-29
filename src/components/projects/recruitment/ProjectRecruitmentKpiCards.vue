<script setup lang="ts">
import { computed } from 'vue'
import type { LoggedInUser } from '../../../types/auth'
import {
  getLeaderApplications,
  getLeaderMemberships,
  getLeaderRecruitments,
  getRecruitmentLeaderProjects,
  getDisplayRecruitmentStatus,
  type ProjectRecruitmentState,
} from '../../../dataset/projectRecruitmentMock'

const props = defineProps<{
  state: ProjectRecruitmentState
  currentUser: LoggedInUser | null
}>()

const kpis = computed(() => {
  const projects = getRecruitmentLeaderProjects(props.currentUser)
  const recruitments = getLeaderRecruitments(props.state, props.currentUser)
  const applications = getLeaderApplications(props.state, props.currentUser)
  const members = getLeaderMemberships(props.state, props.currentUser)
  const joinPending = applications.filter(
    (application) => application.application_type === 'JOIN' && application.status === 'PENDING',
  ).length
  const exitPending = applications.filter(
    (application) => application.application_type === 'EXIT' && application.status === 'PENDING',
  ).length

  return [
    {
      label: '负责项目',
      value: projects.length,
      note: `其中 ${projects.filter((project) => project.project_status === '在研').length} 个在研项目可发布招募`,
      tone: '#edf5ff',
    },
    {
      label: '招募岗位',
      value: recruitments.filter((recruitment) => getDisplayRecruitmentStatus(recruitment) === 'PUBLISHED').length,
      note: '当前有效招募岗位',
      tone: '#edf5ff',
    },
    {
      label: '待审批申请',
      value: joinPending + exitPending,
      note: `加入 ${joinPending} · 退出 ${exitPending}`,
      tone: '#fff5e2',
    },
    {
      label: '已招募学生',
      value: members.filter((member) => member.member_type === 'STUDENT' && member.status === 'ACTIVE').length,
      note: '审批通过后自动进入成员列表',
      tone: '#eaf8f2',
    },
  ]
})
</script>

<template>
  <section class="recruitment-kpi-grid" aria-label="项目招募统计">
    <article v-for="item in kpis" :key="item.label" class="recruitment-kpi-card" :style="{ '--tone': item.tone }">
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
      <small>{{ item.note }}</small>
    </article>
  </section>
</template>

<style scoped>
.recruitment-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.recruitment-kpi-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  min-height: 104px;
  padding: 16px;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(40, 72, 120, 0.045);
}

.recruitment-kpi-card::after {
  content: "";
  position: absolute;
  right: -24px;
  bottom: -32px;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: var(--tone);
}

.recruitment-kpi-card span,
.recruitment-kpi-card strong,
.recruitment-kpi-card small {
  position: relative;
  z-index: 1;
  display: block;
}

.recruitment-kpi-card span {
  color: #7f8da3;
  font-size: 12px;
}

.recruitment-kpi-card strong {
  margin-top: 11px;
  color: #1c2c46;
  font-size: 26px;
  line-height: 1;
  font-weight: 780;
}

.recruitment-kpi-card small {
  margin-top: 8px;
  color: #98a4b5;
  font-size: 11px;
}

@media (max-width: 1180px) {
  .recruitment-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .recruitment-kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
