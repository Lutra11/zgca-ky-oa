<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getMockReviewTasks,
  reviewConfidentialityItems,
  reviewRuleItems,
} from '../../dataset/reviewerReviewTasksMock'
import type {
  ReviewGrade,
  ReviewerMaterial,
  ReviewerProject,
  ReviewerScoreForm,
} from '../../dataset/reviewerReviewTasksMock'

type DimensionKey = 'projectProgress' | 'resultOutput' | 'teamCollaboration'

const route = useRoute()
const router = useRouter()
const project = shallowRef<ReviewerProject | null>(null)
const activeTab = shallowRef<'rules' | 'score' | 'detail'>('score')
const previewMaterial = shallowRef<ReviewerMaterial | null>(null)
const isPreviewVisible = shallowRef(false)
const isSaving = shallowRef(false)
const savedAt = shallowRef('')
const application = computed(() => project.value?.application ?? null)
const isEvaluationSubmitted = computed(() => project.value?.status === '已评审')
const isMaterialsSubmitted = computed(() => project.value?.isMaterialsSubmitted === true)

const dimensionConfigs: Array<{ key: DimensionKey; label: string; description: string }> = [
  { key: 'projectProgress', label: '项目进度', description: '评价任务推进、计划执行和关键节点完成情况' },
  { key: 'resultOutput', label: '成果产出', description: '评价论文、专利、系统、数据集等阶段成果质量' },
  { key: 'teamCollaboration', label: '团队协作', description: '评价人员分工、跨团队协作和组织执行情况' },
]

const form = reactive<ReviewerScoreForm>(createEmptyForm())
const gradeSummary = computed(() => {
  const grades = dimensionConfigs
    .map((dimension) => form[dimension.key].grade)
    .filter((grade): grade is Exclude<ReviewGrade, ''> => Boolean(grade))

  if (!grades.length) return '-'

  const gradeValues = { A: 4, B: 3, C: 2, D: 1 }
  const average = grades.reduce((total, grade) => total + gradeValues[grade], 0) / grades.length

  if (average >= 3.5) return 'A'
  if (average >= 2.5) return 'B'
  if (average >= 1.5) return 'C'
  return 'D'
})

onMounted(loadProjectDetail)

function loadProjectDetail() {
  const projectId = String(route.params.projectId ?? '')
  const matched = getMockReviewTasks().find((task) => task.id === projectId) ?? null

  project.value = matched
  savedAt.value = matched?.evaluationSubmittedAt ?? ''
}

function createEmptyForm(): ReviewerScoreForm {
  return {
    projectProgress: { grade: '', reason: '' },
    resultOutput: { grade: '', reason: '' },
    teamCollaboration: { grade: '', reason: '' },
    overallComment: '',
  }
}

async function saveDraft() {
  if (isEvaluationSubmitted.value || !isMaterialsSubmitted.value) return
  if (!validateForm()) return

  await saveEvaluation('SAVE')
}

async function submitReview() {
  if (isEvaluationSubmitted.value || !isMaterialsSubmitted.value) return
  if (!validateForm()) return

  try {
    await ElMessageBox.confirm('提交后将更新该项目的评审状态，确认提交本次评审吗？', '提交评审', {
      type: 'warning',
      confirmButtonText: '确认提交',
      cancelButtonText: '取消',
      autofocus: false,
    })
    await saveEvaluation('SUBMIT')
  } catch (error: unknown) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('评审提交失败，请稍后重试。')
    }
  }
}

async function saveEvaluation(action: 'SAVE' | 'SUBMIT') {
  if (!project.value || isSaving.value) return

  isSaving.value = true

  try {
    savedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })

    if (action === 'SUBMIT') {
      project.value.status = '已评审'
      project.value.evaluationStatus = 'SUBMITTED'
      project.value.evaluationSubmittedAt = savedAt.value
      ElMessage.success('评审提交成功')
      goBack()
      return
    }

    project.value.status = '草稿'
    project.value.evaluationStatus = 'DRAFT'
    ElMessage.success('评审已保存')
  } finally {
    isSaving.value = false
  }
}

function validateForm() {
  const incompleteDimension = dimensionConfigs.find((dimension) => {
    const value = form[dimension.key]
    return !value.grade || !value.reason.trim()
  })

  if (incompleteDimension) {
    activeTab.value = 'score'
    ElMessage.warning(`请完成“${incompleteDimension.label}”等级与评分理由`)
    return false
  }

  if (!form.overallComment.trim()) {
    activeTab.value = 'score'
    ElMessage.warning('请填写总体评价')
    return false
  }

  return true
}

function openMaterialPreview(material: ReviewerMaterial) {
  previewMaterial.value = material
  isPreviewVisible.value = true
}

function downloadMaterial() {
  ElMessage.info('原型演示：材料下载已按保密要求禁用')
}

function goBack() {
  router.push('/review-judge/project-review')
}

function getStatusType(status: string) {
  if (status === '已评审') return 'success'
  if (status === '草稿') return 'warning'
  return 'info'
}
</script>

<template>
  <section class="review-detail-page" aria-label="项目评审详情">
    <el-result
      v-if="!project"
      icon="warning"
      title="未找到对应评审项目"
      sub-title="请返回评审列表重新选择项目"
    >
      <template #extra><el-button type="primary" @click="goBack">返回评审列表</el-button></template>
    </el-result>

    <template v-if="project">
      <section class="tabs-panel">
        <el-tabs v-model="activeTab" class="review-tabs">
          <el-tab-pane label="项目打分" name="score">
            <el-form class="score-form" label-position="top">
              <section
                v-for="dimension in dimensionConfigs"
                :key="dimension.key"
                class="score-dimension"
              >
                <header class="dimension-heading">
                  <div><h3>{{ dimension.label }}</h3><p>{{ dimension.description }}</p></div>
                  <span>必填</span>
                </header>
                <el-form-item label="评价等级" required>
                  <el-radio-group v-model="form[dimension.key].grade" class="grade-options" :disabled="isEvaluationSubmitted || !isMaterialsSubmitted">
                    <el-radio-button v-for="grade in ['A', 'B', 'C', 'D']" :key="grade" :value="grade">
                      {{ grade }}
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="评分理由" required>
                  <el-input
                    v-model="form[dimension.key].reason"
                    type="textarea"
                    :rows="3"
                    maxlength="300"
                    show-word-limit
                    :disabled="isEvaluationSubmitted || !isMaterialsSubmitted"
                    :placeholder="`请填写${dimension.label}评分理由`"
                  />
                </el-form-item>
              </section>

              <section class="overall-section">
                <header class="dimension-heading">
                  <div><h3>总体评价</h3><p>综合说明项目优点、不足及改进建议（综合等级：{{ gradeSummary }}）</p></div>
                  <span>必填</span>
                </header>
                <el-form-item required>
                  <el-input
                    v-model="form.overallComment"
                    type="textarea"
                    :rows="5"
                    maxlength="800"
                    show-word-limit
                    :disabled="isEvaluationSubmitted || !isMaterialsSubmitted"
                    placeholder="请填写对该项目的总体评价，包括优点、不足及改进建议"
                  />
                </el-form-item>
              </section>

              <footer class="form-actions">
                <span v-if="savedAt">最近保存：{{ savedAt }}</span>
                <div v-if="isMaterialsSubmitted && !isEvaluationSubmitted">
                  <el-button :loading="isSaving" @click="saveDraft">保存草稿</el-button>
                  <el-button type="primary" :loading="isSaving" @click="submitReview">提交评审</el-button>
                </div>
                <span v-else-if="isEvaluationSubmitted" class="submitted-readonly">评审已提交，仅可查看</span>
                <span v-else class="submitted-readonly">材料未提交，暂不能评分</span>
              </footer>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="申报书内容" name="detail">
            <div class="detail-content" v-if="application">
              <section class="content-section">
                <header class="section-heading">
                  <h3>项目基本信息</h3>
                  <p>模板版本 {{ application.templateVersion }}・填写日期 {{ application.fillDate }}</p>
                </header>
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="项目名称" :span="3">{{ application.projectName }}</el-descriptions-item>
                  <el-descriptions-item label="所属学部">{{ application.department }}</el-descriptions-item>
                  <el-descriptions-item label="子方向">{{ application.subdirection }}</el-descriptions-item>
                  <el-descriptions-item label="项目类别">{{ application.projectCategory }}</el-descriptions-item>
                  <el-descriptions-item label="研究周期">{{ application.researchPeriod }}</el-descriptions-item>
                  <el-descriptions-item label="首年经费">{{ application.firstYearBudget }}</el-descriptions-item>
                  <el-descriptions-item label="答辩 PPT" :span="3">{{ application.defensePptName }}</el-descriptions-item>
                  <el-descriptions-item label="内容摘要" :span="3">{{ application.abstract }}</el-descriptions-item>
                </el-descriptions>
              </section>

              <section class="content-section">
                <header class="section-heading"><h3>申请人信息</h3></header>
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="所在单位">{{ application.unitName }}</el-descriptions-item>
                  <el-descriptions-item label="姓名">{{ application.applicantName }}</el-descriptions-item>
                  <el-descriptions-item label="性别">{{ application.gender }}</el-descriptions-item>
                  <el-descriptions-item label="出生年月">{{ application.birthMonth }}</el-descriptions-item>
                  <el-descriptions-item label="学历">{{ application.education }}</el-descriptions-item>
                  <el-descriptions-item label="职称">{{ application.professionalTitle }}</el-descriptions-item>
                  <el-descriptions-item label="手机/电话">{{ application.mobile }}</el-descriptions-item>
                  <el-descriptions-item label="邮箱">{{ application.email }}</el-descriptions-item>
                </el-descriptions>
              </section>

              <section class="content-section">
                <header class="section-heading"><h3>项目研究内容</h3></header>
                <div class="research-block"><span>研究目的和意义</span><p>{{ application.researchPurpose }}</p></div>
                <div class="research-block"><span>主要研究内容</span><p>{{ application.mainResearchContent }}</p></div>
                <div class="research-block"><span>研究基础</span><p>{{ application.researchFoundation }}</p></div>
                <div class="research-block"><span>年度研究任务和实施方案</span><p>{{ application.annualTasks }}</p></div>
                <div class="research-block"><span>总体考核指标</span><p>{{ application.assessmentIndicators }}</p></div>
              </section>

              <section class="content-section">
                <header class="section-heading"><h3>参加人员名单</h3></header>
                <el-table :data="application.participants" class="material-table">
                  <el-table-column prop="category" label="类别" width="100" align="center" />
                  <el-table-column prop="name" label="姓名" width="100" />
                  <el-table-column prop="unit" label="所在单位" min-width="140" show-overflow-tooltip />
                  <el-table-column prop="gender" label="性别" width="60" align="center" />
                  <el-table-column prop="major" label="专业" width="130" />
                  <el-table-column prop="title" label="职称/身份" width="110" />
                  <el-table-column prop="responsibility" label="项目分工" min-width="180" show-overflow-tooltip />
                </el-table>
              </section>

              <section class="content-section">
                <header class="section-heading"><h3>项目预算明细（包干制）</h3></header>
                <el-descriptions :column="3" border>
                  <el-descriptions-item label="项目总预算">{{ application.totalBudget }} 万元（PMO 预设）</el-descriptions-item>
                  <el-descriptions-item label="包干说明" :span="2">{{ application.packageNote }}</el-descriptions-item>
                </el-descriptions>
                <el-table :data="application.annualAllocations" class="material-table budget-table">
                  <el-table-column prop="yearLabel" label="年度" width="140" />
                  <el-table-column label="拨付金额（万元）" width="160">
                    <template #default="{ row }">{{ row.amount }}</template>
                  </el-table-column>
                  <el-table-column label="占比">
                    <template #default="{ row }">
                      {{ ((row.amount / application.totalBudget) * 100).toFixed(0) }}%
                    </template>
                  </el-table-column>
                </el-table>
              </section>

              <section class="content-section">
                <header class="section-heading"><h3>项目经费使用承诺书</h3></header>
                <div class="consent-readonly">
                  <p>项目负责人已阅读并在线确认《项目经费使用承诺书》全文。</p>
                  <span>确认人：{{ application.applicantName }}・确认时间：{{ application.consentConfirmedAt }}</span>
                </div>
              </section>

              <section class="content-section">
                <header class="section-heading material-heading">
                  <div><h3>评审材料</h3><p>项目负责人提交的材料</p></div>
                  <span>{{ project.materials.length }} 个文件</span>
                </header>
                <el-table :data="project.materials" class="material-table" empty-text="暂无评审材料">
                  <el-table-column prop="name" label="文件名称" min-width="230" show-overflow-tooltip />
                  <el-table-column prop="format" label="格式" width="85" align="center" />
                  <el-table-column prop="size" label="文件大小" width="105" />
                  <el-table-column prop="uploader" label="提交人" width="100" />
                  <el-table-column prop="uploadedAt" label="提交时间" width="165" />
                  <el-table-column label="操作" width="150" align="center" fixed="right">
                    <template #default="{ row }">
                      <el-button link type="primary" :icon="View" @click="openMaterialPreview(row)">预览</el-button>
                      <el-button link type="primary" :icon="Download" @click="downloadMaterial">下载</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </section>
            </div>
          </el-tab-pane>

          <el-tab-pane label="评审规则与保密要求" name="rules">
            <div class="detail-content">
              <section class="content-section">
                <header class="section-heading"><h3>本批次评审规则</h3><p>PMO 配置・批次锁定・只读</p></header>
                <ol class="rules-readonly-list">
                  <li v-for="(item, index) in reviewRuleItems" :key="`rule-${index}`">{{ item }}</li>
                </ol>
              </section>
              <section class="content-section">
                <header class="section-heading"><h3>评审保密要求</h3><p>PMO 配置・批次锁定・只读</p></header>
                <ol class="rules-readonly-list confidential">
                  <li v-for="(item, index) in reviewConfidentialityItems" :key="`conf-${index}`">{{ item }}</li>
                </ol>
              </section>
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </template>

    <el-dialog
      v-model="isPreviewVisible"
      title="材料预览"
      width="min(760px, 94vw)"
      destroy-on-close
    >
      <template v-if="previewMaterial">
        <div class="material-preview-head">
          <div>
            <strong>{{ previewMaterial.name }}</strong>
            <span>{{ previewMaterial.format }} · {{ previewMaterial.size }} · {{ previewMaterial.uploadedAt }}</span>
          </div>
          <el-tag :type="getStatusType(project?.status ?? '')" effect="light">{{ project?.status }}</el-tag>
        </div>
        <div class="material-preview-body">
          <p>{{ previewMaterial.previewContent }}</p>
        </div>
      </template>
      <template #footer>
        <el-button @click="isPreviewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.review-detail-page {
  display: grid;
  gap: 18px;
  min-width: 0;
  color: #1d1d1f;
}

.section-heading,
.dimension-heading,
.form-actions,
.material-heading {
  display: flex;
  align-items: center;
}

.section-heading h3,
.section-heading p,
.dimension-heading h3,
.dimension-heading p,
.project-description p {
  margin: 0;
}

.tabs-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
  background: #ffffff;
}

.review-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 22px;
  border-bottom: 1px solid #edf0f4;
}

.review-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.review-tabs :deep(.el-tabs__item) {
  height: 54px;
  font-size: 15px;
  font-weight: 760;
}

.score-form,
.detail-content {
  display: grid;
  gap: 24px;
  padding: 22px;
}

.content-section {
  min-width: 0;
}

.section-heading,
.dimension-heading {
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-heading h3,
.dimension-heading h3 {
  color: #273142;
  font-size: 17px;
  font-weight: 780;
}

.section-heading p,
.dimension-heading p {
  margin-top: 4px;
  color: #8a93a6;
  font-size: 13px;
}

.dimension-heading span {
  color: #d06a2b;
  font-size: 12px;
  font-weight: 700;
}

.score-dimension,
.overall-section {
  min-width: 0;
  padding: 18px;
  border: 1px solid #edf0f4;
  border-radius: 8px;
  background: #fcfdff;
}

.grade-options {
  flex-wrap: wrap;
}

.form-actions {
  justify-content: space-between;
  gap: 12px;
}

.form-actions > span:first-child {
  color: #8a93a6;
  font-size: 13px;
}

.submitted-readonly {
  color: #98a2b3;
  font-size: 13px;
  font-weight: 600;
}

.project-description {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

.project-description span {
  color: #273142;
  font-size: 14px;
  font-weight: 760;
}

.project-description p {
  color: #57606f;
  font-size: 13px;
  line-height: 1.8;
}

.rules-readonly-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 22px;
}

.rules-readonly-list li {
  color: #3d4757;
  font-size: 13px;
  line-height: 1.7;
}

.rules-readonly-list.confidential li {
  color: #a04b2c;
}

.material-table :deep(.el-table__header th) {
  color: #4c5667;
  background: #f7f9fc;
  font-weight: 760;
}

.material-preview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf0f4;
}

.material-preview-head strong {
  display: block;
  color: #273142;
  font-size: 15px;
}

.material-preview-head span {
  display: block;
  margin-top: 4px;
  color: #8a93a6;
  font-size: 12px;
}

.material-preview-body {
  padding-top: 14px;
}

.material-preview-body p {
  margin: 0;
  color: #57606f;
  font-size: 13px;
  line-height: 1.8;
}
.consent-readonly {
  display: grid;
  gap: 6px;
  padding: 14px 18px;
  border: 1px solid #edf0f4;
  border-radius: 8px;
  background: #fcfdff;
}

.consent-readonly p {
  margin: 0;
  color: #57606f;
  font-size: 13px;
}

.consent-readonly span {
  color: #8a93a6;
  font-size: 12px;
}

.research-block {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.research-block span {
  color: #273142;
  font-size: 14px;
  font-weight: 760;
}

.research-block p {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #edf0f4;
  border-radius: 8px;
  background: #fcfdff;
  color: #57606f;
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
