<template>
  <!-- AN-MWVFPQVT/MWVINCCJ：项目评审详情 — 点击项目名称打开，展示评委打分明细（终审表/通过清单/复审报告/立项清单共用，可挂任意流转线） -->
  <el-dialog
    :model-value="modelValue"
    append-to-body
    destroy-on-close
    class="final-score-dialog"
    title="项目评审详情"
    width="720px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="target" class="final-score-body">
      <header class="final-score-head">
        <div class="final-score-project">
          <strong>{{ target.projectName }}</strong>
          <p>{{ target.metaText }}</p>
        </div>
        <div v-if="target.score || target.tag" class="final-score-summary">
          <div v-if="target.score" class="final-score-total">
            <span>{{ target.score.label }}</span>
            <strong>{{ target.score.value }}</strong>
          </div>
          <el-tag v-if="target.tag" size="small" effect="plain" :type="target.tag.type">
            {{ target.tag.text }}
          </el-tag>
        </div>
      </header>
      <p class="final-score-note">
        {{ target.reviewers ? '复审评委独立打分：' : '三位评委独立打分：' }}选题和科学价值 30 /
        研究内容与方案 30 / 可行性论证 20 / 学生培养与成果转化 20（满分 100）。
      </p>
      <section
        v-for="reviewer in makeReviewerScores(
          target.projectName,
          target.score ? Number(target.score.value) : undefined,
          target.reviewers,
        )"
        :key="reviewer.name"
        class="reviewer-score-card"
      >
        <header class="reviewer-score-head">
          <strong>{{ reviewer.name }}</strong>
          <el-tag
            size="small"
            effect="plain"
            :type="reviewer.grade === 'A' ? 'success' : reviewer.grade === 'B' ? 'primary' : 'warning'"
          >
            {{ reviewer.grade }} 档
          </el-tag>
          <span class="reviewer-score-total">{{ reviewer.total.toFixed(1) }} 分</span>
        </header>
        <ul class="reviewer-score-dims">
          <li v-for="dimension in reviewer.dimensions" :key="dimension.label">
            <span>{{ dimension.label }}</span>
            <strong>{{ dimension.value }} / {{ dimension.max }}</strong>
          </li>
        </ul>
        <p class="reviewer-score-comment">{{ reviewer.comment }}</p>
      </section>
    </div>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { makeReviewerScores } from '../../dataset/finalReviewReportMock'

/** 项目评审详情数据（终审表/通过清单/复审报告/立项清单各入口构造） */
export interface ScoreDetailTarget {
  projectName: string
  metaText: string
  score?: { label: string; value: string }
  tag?: { type: 'success' | 'danger' | 'info'; text: string }
  /** 复审场景传入实际复审评委名单 */
  reviewers?: string[]
}

defineProps<{
  modelValue: boolean
  target: ScoreDetailTarget | null
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<style>
.final-score-dialog .final-score-body {
  display: grid;
  gap: 14px;
}

.final-score-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e6ecf5;
}

.final-score-project strong {
  display: block;
  color: #152b4f;
  font-size: 16px;
  line-height: 1.4;
}

.final-score-project p {
  margin: 4px 0 0;
  color: #66788f;
  font-size: 12.5px;
}

.final-score-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.final-score-total {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.final-score-total span {
  color: #66788f;
  font-size: 12px;
}

.final-score-total strong {
  color: #1f3a63;
  font-size: 22px;
  font-weight: 700;
}

.final-score-note {
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f5f8fd;
  color: #5b6f8d;
  font-size: 12px;
  line-height: 1.7;
}

.reviewer-score-card {
  padding: 12px 14px;
  border: 1px solid #e6ecf5;
  border-radius: 8px;
  background: #fbfcfe;
}

.reviewer-score-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reviewer-score-head strong {
  color: #203452;
  font-size: 13.5px;
}

.reviewer-score-total {
  margin-left: auto;
  color: #1f3a63;
  font-size: 14px;
  font-weight: 650;
}

.reviewer-score-dims {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 18px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.reviewer-score-dims li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.5px;
}

.reviewer-score-dims li span {
  color: #66788f;
}

.reviewer-score-dims li strong {
  font-weight: 650;
  color: #203452;
}

.reviewer-score-comment {
  margin: 10px 0 0;
  padding-top: 8px;
  border-top: 1px dashed #e6ecf5;
  font-size: 12.5px;
  line-height: 1.7;
  color: #5a6b81;
}
</style>
