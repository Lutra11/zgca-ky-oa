<script setup lang="ts">
import { computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import type { ReviewResultProject } from '../types'

const props = defineProps<{
  projects: ReviewResultProject[]
}>()

const emit = defineEmits<{
  view: [project: ReviewResultProject]
}>()

const tableData = computed(() => props.projects)

function levelType(level: ReviewResultProject['finalLevel']) {
  const map = {
    A: 'primary',
    B: 'success',
    C: 'warning',
    D: 'info',
  } as const

  return map[level]
}
</script>

<template>
  <article class="result-table-card">
    <el-table :data="tableData" class="result-table">
      <el-table-column label="序号" width="70" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>

      <el-table-column label="项目编号" width="132">
        <template #default="{ row }">
          <button class="project-code" type="button" @click="emit('view', row)">
            {{ row.projectCode }}
          </button>
        </template>
      </el-table-column>

      <el-table-column label="项目名称" min-width="240">
        <template #default="{ row }">
          <el-tooltip :content="row.projectName" placement="top" effect="light">
            <span class="project-name">{{ row.projectName }}</span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column prop="principal" label="项目负责人" width="110" />
      <el-table-column prop="subDirection" label="子方向" width="120" />

      <el-table-column label="项目得分" width="100" align="center">
        <template #default="{ row }">
          <strong class="score-text">{{ row.score }}</strong>
        </template>
      </el-table-column>

      <el-table-column label="推荐评级" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="levelType(row.recommendedLevel)" effect="dark">{{ row.recommendedLevel }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="最终评级" width="124" align="center">
        <template #default="{ row }">
          <span class="final-level-cell">
            <el-tag :type="levelType(row.finalLevel)" effect="dark">{{ row.finalLevel }}</el-tag>
            <el-tooltip
              v-if="row.recommendedLevel !== row.finalLevel"
              :content="row.adjustReason || '最终评级已由学部调整'"
              placement="top"
              effect="light"
            >
              <el-icon class="adjust-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>

      <el-table-column label="子方向评语" min-width="220">
        <template #default="{ row }">
          <el-tooltip :content="row.subDirectionComment" placement="top" effect="light">
            <span class="comment-cell">{{ row.subDirectionComment }}</span>
          </el-tooltip>
        </template>
      </el-table-column>

      <el-table-column label="学部评语" min-width="240">
        <template #default="{ row }">
          <el-tooltip :content="row.facultyComment" placement="top" effect="light">
            <span class="comment-cell">{{ row.facultyComment }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </article>
</template>

<style scoped>
.result-table-card {
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.result-table {
  --el-table-border-color: rgba(29, 29, 31, 0.06);
  --el-table-header-bg-color: #f8fbff;
  border-radius: 10px;
  overflow: hidden;
}

.result-table :deep(.el-table__header th) {
  color: #424245;
  font-size: 12px;
  font-weight: 800;
}

.project-code {
  border: 0;
  color: #0a84ff;
  background: transparent;
  cursor: pointer;
  font-weight: 760;
}

.project-name,
.comment-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-name {
  color: #1d1d1f;
  font-weight: 720;
}

.comment-cell {
  color: #424245;
}

.score-text {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 860;
}

.final-level-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.adjust-icon {
  color: #ff8a1f;
  font-size: 15px;
}
</style>
