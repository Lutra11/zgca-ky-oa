<script setup lang="ts">
import { computed } from 'vue'
import type { FacultyProjectGroup, ProjectTypeProjectGroup, ScopeGroupMode } from './types'

const props = defineProps<{
  groups: FacultyProjectGroup[]
  typeGroups?: ProjectTypeProjectGroup[]
  scopeMode?: ScopeGroupMode
  enableProjectTypeGrouping?: boolean
}>()

const emit = defineEmits<{
  updateScopeMode: [mode: ScopeGroupMode]
}>()

const facultyCount = computed(() => props.groups.length)
const projectTypeCount = computed(() => props.typeGroups?.length ?? 0)
const projectCount = computed(() => props.groups.reduce((total, group) => total + group.projects.length, 0))

const activeScopeMode = computed({
  get: () => props.scopeMode ?? 'faculty',
  set: (value: ScopeGroupMode) => emit('updateScopeMode', value),
})

const currentGroups = computed(() => {
  if (props.enableProjectTypeGrouping && activeScopeMode.value === 'projectType') {
    return (props.typeGroups ?? []).map((group) => ({
      key: group.projectType,
      label: group.projectType,
      projects: group.projects,
    }))
  }

  return props.groups.map((group) => ({
    key: group.faculty,
    label: group.faculty,
    projects: group.projects,
  }))
})

const scopeTitle = computed(() =>
  activeScopeMode.value === 'projectType' ? '可发布项目（按项目类型分组）' : '可发布项目（按学部分组）',
)

const scopeDescription = computed(() =>
  activeScopeMode.value === 'projectType'
    ? '统一发布模式下，已完成评审项目按基础培育与自由探索分类纳入公告范围'
    : '统一发布模式下，所有已完成评审项目将自动纳入公告范围',
)
</script>

<template>
  <section class="unified-scope">
    <div class="scope-metrics">
      <article>
        <span class="metric-icon">◎</span>
        <div>
          <p>发布范围</p>
          <strong>全部学部</strong>
        </div>
      </article>
      <article>
        <span class="metric-icon">▦</span>
        <div>
          <p>{{ activeScopeMode === 'projectType' ? '涉及类型' : '涉及学部' }}</p>
          <strong>{{ activeScopeMode === 'projectType' ? projectTypeCount : facultyCount }} 个</strong>
        </div>
      </article>
      <article>
        <span class="metric-icon">▣</span>
        <div>
          <p>关联项目</p>
          <strong>{{ projectCount }} 个</strong>
        </div>
      </article>
    </div>

    <article class="project-card">
      <header class="panel-header">
        <h3>{{ scopeTitle }}</h3>
        <span>{{ scopeDescription }}</span>
      </header>

      <el-tabs v-if="enableProjectTypeGrouping" v-model="activeScopeMode" class="scope-mode-tabs">
        <el-tab-pane label="按学部分组" name="faculty" />
        <el-tab-pane label="项目类型分组" name="projectType" />
      </el-tabs>

      <el-collapse class="faculty-collapse" :model-value="currentGroups.map((group) => group.key)">
        <el-collapse-item v-for="group in currentGroups" :key="group.key" :name="group.key">
          <template #title>
            <div class="collapse-title">
              <strong>{{ group.label }}（{{ group.projects.length }}个）</strong>
              <el-tag size="small" type="primary" effect="light">已自动纳入</el-tag>
            </div>
          </template>

          <el-table :data="group.projects" class="scope-table" size="small">
            <el-table-column prop="projectCode" label="项目编号" width="128" />
            <el-table-column label="项目名称" min-width="190">
              <template #default="{ row }">
                <el-tooltip :content="row.projectName" placement="top" effect="light">
                  <span class="project-name">{{ row.projectName }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column v-if="activeScopeMode === 'faculty'" prop="projectType" label="项目类型" width="108">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.projectType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="subDirection" label="所属子方向" width="132" />
            <el-table-column prop="projectLeader" label="项目负责人" width="108" />
            <el-table-column prop="reviewCompletedTime" label="评审完成时间" width="156" />
            <el-table-column label="评审结果" width="90">
              <template #default="{ row }">
                <el-tag type="success" effect="light" size="small">{{ row.reviewResult }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </article>
  </section>
</template>

<style scoped>
.unified-scope {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.scope-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.scope-metrics article,
.project-card {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.scope-metrics article {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.metric-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #0a84ff;
  background: #e8f3ff;
  font-size: 18px;
  font-weight: 820;
}

.scope-metrics p,
.panel-header h3,
.panel-header span {
  margin: 0;
}

.scope-metrics p {
  color: #86868b;
  font-size: 12px;
  font-weight: 760;
}

.scope-metrics strong {
  display: block;
  margin-top: 4px;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 820;
}

.project-card {
  min-width: 0;
  padding: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.panel-header h3 {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 820;
}

.panel-header span {
  color: #86868b;
  font-size: 12px;
}

.scope-mode-tabs {
  margin-top: 10px;
}

.scope-mode-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.scope-mode-tabs :deep(.el-tabs__item) {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 780;
}

.faculty-collapse {
  border: 0;
}

.faculty-collapse :deep(.el-collapse-item__wrap),
.faculty-collapse :deep(.el-collapse-item__header) {
  border-color: rgba(29, 29, 31, 0.06);
}

.collapse-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-right: 10px;
}

.scope-table {
  --el-table-border-color: rgba(29, 29, 31, 0.06);
  --el-table-header-bg-color: #f8fbff;
}

.project-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .scope-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
