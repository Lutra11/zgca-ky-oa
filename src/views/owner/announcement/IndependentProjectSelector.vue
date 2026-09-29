<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type {
  AnnouncementProject,
  AnnouncementProjectType,
  FacultyProjectGroup,
  ProjectTypeProjectGroup,
  ScopeGroupMode,
} from './types'

const props = defineProps<{
  groups: FacultyProjectGroup[]
  typeGroups?: ProjectTypeProjectGroup[]
  selectedIds: string[]
  scopeMode?: ScopeGroupMode
  enableProjectTypeGrouping?: boolean
}>()

const emit = defineEmits<{
  toggleProject: [projectId: string, checked: boolean]
  toggleFaculty: [faculty: string, checked: boolean]
  toggleProjectType: [projectType: AnnouncementProjectType, checked: boolean]
  updateScopeMode: [mode: ScopeGroupMode]
  viewProject: [project: AnnouncementProject]
}>()

const activeFaculty = shallowRef(props.groups[0]?.faculty ?? '')
const activeProjectType = shallowRef<AnnouncementProjectType>(props.typeGroups?.[0]?.projectType ?? '基础培育')

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

const activeGroupKey = computed({
  get: () => (activeScopeMode.value === 'projectType' ? activeProjectType.value : activeFaculty.value),
  set: (value: string) => {
    if (activeScopeMode.value === 'projectType') {
      activeProjectType.value = value as AnnouncementProjectType
    } else {
      activeFaculty.value = value
    }
  },
})

const currentGroup = computed(() => {
  const fallback = currentGroups.value[0]

  return currentGroups.value.find((group) => group.key === activeGroupKey.value) ?? fallback
})

const scopeTitle = computed(() =>
  activeScopeMode.value === 'projectType' ? '可发布项目（按项目类型分组）' : '可发布项目（按学部分组）',
)

const scopeDescription = computed(() =>
  activeScopeMode.value === 'projectType'
    ? '支持按基础培育、自由探索整体选择或单独选择项目'
    : '支持按学部整体选择或单独选择项目',
)

const selectedSet = computed(() => new Set(props.selectedIds))

const currentProjectIds = computed(() => currentGroup.value?.projects.map((project) => project.id) ?? [])

const selectedInCurrentFaculty = computed(
  () => currentProjectIds.value.filter((id) => selectedSet.value.has(id)).length,
)

const isCurrentFacultyChecked = computed(
  () => currentProjectIds.value.length > 0 && selectedInCurrentFaculty.value === currentProjectIds.value.length,
)

const isCurrentFacultyIndeterminate = computed(
  () => selectedInCurrentFaculty.value > 0 && selectedInCurrentFaculty.value < currentProjectIds.value.length,
)

function isProjectChecked(project: AnnouncementProject) {
  return selectedSet.value.has(project.id)
}

function handleFacultyCheck(checked: boolean) {
  if (!currentGroup.value) {
    return
  }

  if (activeScopeMode.value === 'projectType') {
    emit('toggleProjectType', currentGroup.value.key as AnnouncementProjectType, checked)
    return
  }

  emit('toggleFaculty', currentGroup.value.key, checked)
}
</script>

<template>
  <section class="independent-selector">
    <article class="project-card">
      <header class="panel-header">
        <div>
          <h3>{{ scopeTitle }}</h3>
          <p>{{ scopeDescription }}</p>
        </div>
        <el-tooltip content="仅展示已完成全部评审且已生成最终结果的项目" placement="top">
          <el-icon class="info-dot">i</el-icon>
        </el-tooltip>
      </header>

      <el-tabs v-if="enableProjectTypeGrouping" v-model="activeScopeMode" class="scope-mode-tabs">
        <el-tab-pane label="按学部分组" name="faculty" />
        <el-tab-pane label="项目类型分组" name="projectType" />
      </el-tabs>

      <el-tabs v-model="activeGroupKey" class="faculty-tabs">
        <el-tab-pane
          v-for="group in currentGroups"
          :key="group.key"
          :label="group.label"
          :name="group.key"
        />
      </el-tabs>

      <div v-if="currentGroup" class="faculty-toolbar">
        <div>
          <span>{{ activeScopeMode === 'projectType' ? '当前项目类型：' : '当前学部：' }}</span>
          <strong>{{ currentGroup.label }}</strong>
        </div>
        <div>
          <span>可发布项目：</span>
          <strong>{{ currentGroup.projects.length }} 个</strong>
        </div>
        <el-checkbox
          :model-value="isCurrentFacultyChecked"
          :indeterminate="isCurrentFacultyIndeterminate"
          @change="handleFacultyCheck"
        >
          {{ activeScopeMode === 'projectType' ? '选择该类型全部项目' : '选择该学部全部项目' }}
        </el-checkbox>
      </div>

      <el-table v-if="currentGroup" :data="currentGroup.projects" class="project-table" height="372">
        <el-table-column label="" width="48" align="center">
          <template #default="{ row }">
            <el-checkbox
              :model-value="isProjectChecked(row)"
              @change="(checked: boolean) => emit('toggleProject', row.id, checked)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="projectCode" label="项目编号" width="130" />
        <el-table-column label="项目名称" min-width="220">
          <template #default="{ row }">
            <button class="project-link" type="button" @click="emit('viewProject', row)">
              {{ row.projectName }}
            </button>
          </template>
        </el-table-column>
        <el-table-column v-if="activeScopeMode === 'faculty'" prop="projectType" label="项目类型" width="108">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.projectType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subDirection" label="所属子方向" width="140" />
        <el-table-column prop="projectLeader" label="项目负责人" width="110" />
        <el-table-column prop="reviewCompletedTime" label="评审完成时间" width="160" />
        <el-table-column label="评审结果" width="92">
          <template #default="{ row }">
            <el-tag type="success" effect="light" size="small">{{ row.reviewResult }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </article>
  </section>
</template>

<style scoped>
.independent-selector,
.project-card {
  min-width: 0;
}

.project-card {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-header h3,
.panel-header p {
  margin: 0;
}

.panel-header h3 {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 820;
}

.panel-header p {
  margin-top: 5px;
  color: #86868b;
  font-size: 12px;
}

.info-dot {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #0a84ff;
  background: #e8f3ff;
  font-size: 12px;
  font-style: normal;
  font-weight: 820;
}

.faculty-tabs {
  margin-top: 12px;
}

.scope-mode-tabs {
  margin-top: 12px;
}

.scope-mode-tabs :deep(.el-tabs__header) {
  margin-bottom: 8px;
}

.scope-mode-tabs :deep(.el-tabs__item) {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 780;
}

.faculty-tabs :deep(.el-tabs__header) {
  margin-bottom: 10px;
}

.faculty-tabs :deep(.el-tabs__item) {
  color: #6e6e73;
  font-size: 13px;
  font-weight: 780;
}

.faculty-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  margin-bottom: 10px;
  border-radius: 10px;
  padding: 10px 12px;
  background: #f8fbff;
  color: #6e6e73;
  font-size: 13px;
  font-weight: 760;
}

.faculty-toolbar strong {
  color: #0a84ff;
}

.project-table {
  --el-table-border-color: rgba(29, 29, 31, 0.06);
  --el-table-header-bg-color: #f8fbff;
  border-radius: 10px;
  overflow: hidden;
}

.project-link {
  max-width: 100%;
  overflow: hidden;
  border: 0;
  color: #1d1d1f;
  background: transparent;
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 720;
}

.project-link:hover {
  color: #0a84ff;
}
</style>
