<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import type { AnnouncementProject, AnnouncementProjectType, ScopeGroupMode } from './types'

const props = defineProps<{
  selectedProjects: AnnouncementProject[]
  groupMode?: ScopeGroupMode
}>()

const emit = defineEmits<{
  removeProject: [projectId: string]
  clearFaculty: [faculty: string]
  clearProjectType: [projectType: AnnouncementProjectType]
  clearAll: []
  viewProject: [project: AnnouncementProject]
}>()

const selectedGroups = computed(() => {
  const groupMap = new Map<string, AnnouncementProject[]>()

  props.selectedProjects.forEach((project) => {
    const groupKey = props.groupMode === 'projectType' ? project.projectType ?? '基础培育' : project.faculty
    const projects = groupMap.get(groupKey) ?? []
    projects.push(project)
    groupMap.set(groupKey, projects)
  })

  return Array.from(groupMap.entries()).map(([name, projects]) => ({ name, projects }))
})

const selectedGroupLabel = computed(() => (props.groupMode === 'projectType' ? '项目类型' : '学部'))

async function confirmClearGroup(name: string) {
  try {
    await ElMessageBox.confirm(`确认清空 ${name} 下已选择的项目吗？`, `清空${selectedGroupLabel.value}项目`, {
      type: 'warning',
      confirmButtonText: '确认清空',
      cancelButtonText: '取消',
      autofocus: false,
    })

    if (props.groupMode === 'projectType') {
      emit('clearProjectType', name as AnnouncementProjectType)
    } else {
      emit('clearFaculty', name)
    }
  } catch {
    // 用户取消清空时不需要处理。
  }
}

async function confirmClearAll() {
  try {
    await ElMessageBox.confirm('确认清空全部已选择项目吗？', '清空全部', {
      type: 'warning',
      confirmButtonText: '确认清空',
      cancelButtonText: '取消',
      autofocus: false,
    })
    emit('clearAll')
  } catch {
    // 用户取消清空时不需要处理。
  }
}
</script>

<template>
  <article class="selected-panel">
    <header class="panel-header">
      <div>
        <h3>已选择项目</h3>
        <p>已选择{{ selectedGroupLabel }} {{ selectedGroups.length }} 个，已选择项目 {{ selectedProjects.length }} 个</p>
      </div>
      <el-button
        v-if="selectedProjects.length"
        :icon="Delete"
        link
        type="primary"
        @click="confirmClearAll"
      >
        清空全部
      </el-button>
    </header>

    <el-empty v-if="!selectedProjects.length" description="暂未选择项目" :image-size="76" />

    <div v-else class="selected-groups">
      <section v-for="group in selectedGroups" :key="group.name" class="selected-group">
        <div class="group-title">
          <strong>{{ group.name }}（{{ group.projects.length }}）</strong>
          <button type="button" @click="confirmClearGroup(group.name)">清空该{{ selectedGroupLabel }}</button>
        </div>
        <div class="selected-project-list">
          <div v-for="project in group.projects" :key="project.id" class="selected-project">
            <button type="button" class="project-name" @click="emit('viewProject', project)">
              <span>{{ project.projectCode }}</span>
              {{ project.projectName }}
            </button>
            <button type="button" class="remove-button" @click="emit('removeProject', project.id)">移除</button>
          </div>
        </div>
      </section>
    </div>
  </article>
</template>

<style scoped>
.selected-panel {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 280px;
  
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.panel-header {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
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

.selected-groups {
  display: block;
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: scroll;
  overscroll-behavior: contain;
  padding-right: 4px;
  scrollbar-gutter: stable;
  touch-action: pan-y;
}

.selected-groups::-webkit-scrollbar {
  width: 6px;
}

.selected-groups::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(10, 132, 255, 0.22);
}

.selected-panel :deep(.el-empty) {
  flex: 1;
  min-height: 0;
  padding: 10px 0 4px;
}

.selected-panel :deep(.el-empty__description) {
  margin-top: 6px;
}

.selected-group {
  overflow: hidden;
  border: 1px solid rgba(0, 113, 227, 0.08);
  border-radius: 10px;
  background: #f8fbff;
}

.selected-group + .selected-group {
  margin-top: 10px;
}

.group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border-bottom: 1px solid rgba(0, 113, 227, 0.08);
  background: #eef6ff;
}

.group-title strong {
  color: #0a84ff;
  font-size: 13px;
}

.group-title button,
.remove-button,
.project-name {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.group-title button,
.remove-button {
  color: #0a84ff;
  font-size: 12px;
  font-weight: 760;
}

.selected-project-list {
  display: grid;
}

.selected-project {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  gap: 8px;
  align-items: center;
  min-height: 34px;
  padding: 7px 10px;
}

.selected-project + .selected-project {
  border-top: 1px solid rgba(29, 29, 31, 0.06);
}

.project-name {
  min-width: 0;
  overflow: hidden;
  color: #424245;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
}

.project-name span {
  margin-right: 8px;
  color: #0a84ff;
}

.project-name:hover {
  color: #0a84ff;
}
</style>
