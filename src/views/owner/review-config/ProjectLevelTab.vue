<script setup lang="ts">
import { computed } from 'vue'
import { Delete, Medal, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ProjectLevel, ProjectLevelLimit } from './types'

const levels = defineModel<ProjectLevel[]>({ required: true })

const limitOptions: ProjectLevelLimit[] = ['上限', '下限', '固定', '不强制']
const levelTotal = computed(() =>
  Number(levels.value.reduce((sum, level) => sum + Number(level.percentage || 0), 0).toFixed(1)),
)

function addLevel() {
  levels.value.push({
    id: createId('level'),
    name: getNextLevelName(),
    percentage: 0,
    limit: '不强制',
    description: '',
  })
}

async function removeLevel(levelId: string) {
  if (levels.value.length <= 1) {
    ElMessage.warning('至少需要保留一个项目等级')
    return
  }

  try {
    await ElMessageBox.confirm('删除后该等级配置将无法恢复，是否继续？', '删除项目等级', {
      type: 'warning',
      confirmButtonText: '继续删除',
      cancelButtonText: '取消',
      autofocus: false,
    })
    levels.value = levels.value.filter((level) => level.id !== levelId)
  } catch {
    // 用户取消删除时不需要额外处理。
  }
}

async function validateAndSave(showMessage = true) {
  const error = validateLevels()

  if (error) {
    ElMessage.error(error)
    return false
  }

  if (showMessage) {
    ElMessage.success('项目等级设置已保存')
  }
  return true
}

function validateLevels() {
  if (!levels.value.length) {
    return '请至少配置一个项目等级'
  }

  const names = new Set<string>()

  for (const level of levels.value) {
    const name = level.name.trim()

    if (!name) {
      return '等级名称不能为空'
    }

    if (names.has(name)) {
      return `等级名称不能重复：${name}`
    }

    names.add(name)
  }

  if (levelTotal.value !== 100) {
    return '所有等级占比总和必须等于 100%'
  }

  return ''
}

function getTotalClass() {
  return {
    'total-success': levelTotal.value === 100,
    'total-warning': levelTotal.value < 100,
    'total-danger': levelTotal.value > 100,
  }
}

function getNextLevelName() {
  const existingNames = new Set(levels.value.map((level) => level.name.trim()))

  for (const name of ['D', 'E', 'F', 'G']) {
    if (!existingNames.has(name)) {
      return name
    }
  }

  return `等级${levels.value.length + 1}`
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`
}

defineExpose({ validateAndSave })
</script>

<template>
  <article class="config-card">
    <header class="card-header">
      <div class="title-row">
        <span class="title-icon">
          <el-icon><Medal /></el-icon>
        </span>
        <h3>项目等级设置</h3>
      </div>

      <div class="header-actions">
        <el-button :icon="Plus" plain @click="addLevel">添加等级</el-button>
        <el-button type="success" @click="validateAndSave">保存等级</el-button>
      </div>
    </header>

    <div class="level-table">
      <div class="level-head">
        <span>等级</span>
        <span>占比（%）</span>
        <span>占比限制</span>
        <span>描述</span>
        <span>操作</span>
      </div>

      <div v-for="level in levels" :key="level.id" class="level-row">
        <el-input v-model="level.name" placeholder="等级" maxlength="12" />
        <div class="percentage-cell">
          <el-input-number v-model="level.percentage" :min="0" :max="100" :precision="1" />
          <span>%</span>
        </div>
        <el-select v-model="level.limit" placeholder="占比限制">
          <el-option v-for="option in limitOptions" :key="option" :label="option" :value="option" />
        </el-select>
        <el-input v-model="level.description" placeholder="请输入描述" />
        <el-button class="danger-icon-button" :icon="Delete" plain @click="removeLevel(level.id)" />
      </div>
    </div>

    <div class="level-note">
      <p class="level-total" :class="getTotalClass()">等级占比总计：{{ levelTotal }}% / 100%</p>
      <p>
        “上限”表示该等级最终项目数量不得超过该占比；“下限”表示不得低于该占比；“固定”表示必须严格按照该占比；“不强制”仅作为参考比例。
      </p>
    </div>
  </article>
</template>

<style scoped>
.config-card {
  border: 1px solid rgba(0, 113, 227, 0.1);
  border-radius: 12px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 36px rgba(26, 39, 68, 0.07);
}

.card-header,
.title-row,
.header-actions,
.percentage-cell,
.level-note {
  display: flex;
  align-items: center;
}

.card-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.title-row,
.header-actions {
  gap: 10px;
}

.title-row h3 {
  margin: 0;
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 820;
}

.title-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  color: #0a84ff;
  background: #e8f2ff;
}

.level-table {
  overflow: hidden;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 10px;
}

.level-head,
.level-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.7fr) minmax(170px, 0.75fr) minmax(150px, 0.8fr) minmax(220px, 1.2fr) 78px;
  gap: 16px;
  align-items: center;
}

.level-head {
  padding: 14px 18px;
  color: #424245;
  background: #f6f9fd;
  font-size: 13px;
  font-weight: 820;
}

.level-row {
  padding: 14px 18px;
  border-top: 1px solid rgba(29, 29, 31, 0.07);
}

.level-row:hover {
  background: #fbfdff;
}

.percentage-cell {
  gap: 8px;
}

.percentage-cell :deep(.el-input-number) {
  width: 116px;
}

.percentage-cell span {
  color: #6e6e73;
}

.danger-icon-button {
  width: 38px;
  border-color: rgba(255, 59, 48, 0.42);
  color: #ff3b30;
}

.level-note {
  justify-content: space-between;
  gap: 20px;
  margin-top: 14px;
  color: #6e6e73;
  font-size: 13px;
}

.level-note p {
  margin: 0;
}

.level-total {
  flex: 0 0 auto;
  border-radius: 7px;
  padding: 6px 12px;
  font-weight: 820;
}

.total-success {
  color: #1a9c55;
  background: #e7f8ef;
}

.total-warning {
  color: #b56a00;
  background: #fff4df;
}

.total-danger {
  color: #ff3b30;
  background: #fff0ee;
}

@media (max-width: 1180px) {
  .level-head {
    display: none;
  }

  .level-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .level-note {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
