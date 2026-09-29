<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { ReviewerCandidate } from '../types'

const visible = defineModel<boolean>({ required: true })

const props = defineProps<{
  candidates: ReviewerCandidate[]
  initialSelectedIds: string[]
}>()

const emit = defineEmits<{
  confirm: [reviewerIds: string[]]
}>()

const keyword = shallowRef('')
const selectedIds = shallowRef<string[]>([])

const filteredCandidates = computed(() => {
  const text = keyword.value.trim().toLowerCase()

  if (!text) {
    return props.candidates
  }

  return props.candidates.filter((candidate) =>
    [candidate.name, candidate.faculty, candidate.researchDirection, candidate.title].some((value) =>
      value.toLowerCase().includes(text),
    ),
  )
})

watch(
  () => visible.value,
  (nextVisible) => {
    if (nextVisible) {
      selectedIds.value = [...props.initialSelectedIds]
      keyword.value = ''
    }
  },
)

function confirmSelection() {
  if (!selectedIds.value.length) {
    ElMessage.warning('请至少选择一名评委')
    return
  }

  emit('confirm', Array.from(new Set(selectedIds.value)))
  visible.value = false
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="指定评委"
    width="760px"
    class="reviewer-assign-dialog"
    append-to-body
  >
    <section class="reviewer-dialog">
      <header class="dialog-intro">
        <div>
          <strong>评委候选人</strong>
          <span>支持按姓名、学部、研究方向或职称快速检索</span>
        </div>
        <el-tag type="primary" effect="light">已选择 {{ selectedIds.length }} 人</el-tag>
      </header>

      <el-input v-model="keyword" class="reviewer-search" placeholder="搜索姓名、学部、研究方向或职称" clearable>
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-checkbox-group v-model="selectedIds" class="candidate-grid">
        <el-checkbox
          v-for="candidate in filteredCandidates"
          :key="candidate.id"
          class="candidate-card"
          :value="candidate.id"
        >
          <span class="candidate-content">
            <span class="candidate-topline">
              <strong>{{ candidate.name }}</strong>
              <el-tag size="small" type="info" effect="light">任务 {{ candidate.currentTaskCount }} 项</el-tag>
            </span>
            <em>{{ candidate.title }} · {{ candidate.faculty }}</em>
            <small>{{ candidate.researchDirection }}</small>
          </span>
        </el-checkbox>
      </el-checkbox-group>

      <el-empty v-if="!filteredCandidates.length" description="暂无匹配评委" :image-size="90" />
    </section>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确认指定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.reviewer-dialog {
  display: grid;
  gap: 16px;
  padding-top: 2px;
}

.dialog-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid rgba(10, 132, 255, 0.12);
  border-radius: 12px;
  padding: 12px 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.dialog-intro div {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.dialog-intro strong {
  color: #1d1d1f;
  font-size: 15px;
  font-weight: 860;
}

.dialog-intro span {
  color: #6e6e73;
  font-size: 12px;
  font-weight: 650;
}

.reviewer-search :deep(.el-input__wrapper) {
  min-height: 40px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(29, 29, 31, 0.08) inset;
}

.candidate-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-height: 390px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 2px 6px 2px 2px;
  scrollbar-width: thin;
}

.candidate-card {
  width: 100%;
  height: auto;
  min-height: 92px;
  display: flex;
  align-items: flex-start;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 12px;
  margin: 0;
  padding: 14px;
  background: rgba(251, 253, 255, 0.92);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.candidate-card:hover,
.candidate-card.is-checked {
  border-color: rgba(10, 132, 255, 0.34);
  background: #eef6ff;
  box-shadow: 0 10px 24px rgba(10, 132, 255, 0.1);
  transform: translateY(-1px);
}

.candidate-card :deep(.el-checkbox__input) {
  flex: 0 0 auto;
  margin-top: 3px;
}

.candidate-card :deep(.el-checkbox__label) {
  min-width: 0;
  flex: 1;
  padding-left: 12px;
}

.candidate-content {
  display: grid;
  gap: 7px;
  min-width: 0;
  color: #1d1d1f;
}

.candidate-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.candidate-card strong {
  overflow: hidden;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-card em,
.candidate-card small {
  overflow: hidden;
  color: #6e6e73;
  font-style: normal;
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-card em {
  font-weight: 720;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-footer :deep(.el-button) {
  min-width: 96px;
  height: 38px;
  border-radius: 10px;
  font-weight: 780;
}

@media (max-width: 760px) {
  .candidate-grid {
    grid-template-columns: 1fr;
  }

  .dialog-intro {
    align-items: flex-start;
    flex-direction: column;
  }

  .dialog-footer {
    flex-direction: column-reverse;
  }

  .dialog-footer :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }
}
</style>
