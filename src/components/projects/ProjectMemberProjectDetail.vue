<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, DocumentChecked } from '@element-plus/icons-vue'
import type { LoggedInUser } from '../../types/auth'
import { getProjectMemberProjectDetail } from '../../dataset/projectMemberProjectsMock'
import type { ProjectApplicationWizardState } from '../../dataset/projectApplicationWizardMock'
import { formatCurrency } from '../finance/financeFormat'

const props = withDefaults(
  defineProps<{
    currentUser: LoggedInUser | null
    backPath?: string
    hideCommitment?: boolean
  }>(),
  {
    backPath: '/project-member/my-projects',
    hideCommitment: false,
  },
)

const route = useRoute()
const router = useRouter()
const activeTab = shallowRef('basic')

const project = computed(() => {
  const projectId = route.params.projectId

  if (!projectId || Array.isArray(projectId)) {
    return null
  }

  return getProjectMemberProjectDetail(projectId, props.currentUser)
})

const application = computed(() => project.value?.application ?? null)

const allocationRows = computed(() => application.value?.annualAllocations ?? [])

const allocationTotal = computed(() =>
  allocationRows.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
)

function backToList() {
  router.push(props.backPath)
}

function displayText(value: string | number | undefined) {
  if (value === 0) {
    return '0'
  }

  return value ? String(value) : '尚未填写'
}

function formatBudgetWan(value: number) {
  return `${value.toFixed(2)} 万元`
}

function getStatusType(status: string) {
  if (status === '在研' || status === '已立项') {
    return 'success'
  }

  if (status === '结题中') {
    return 'warning'
  }

  return 'primary'
}

function getSubdirection(applicationState: ProjectApplicationWizardState) {
  return applicationState.subdirection || '尚未填写'
}

function formatWan(value: number | undefined) {
  return `${(Number(value) || 0).toFixed(2)} 万元`
}
</script>

<template>
  <section class="member-project-detail-page" aria-label="我的项目详情">
    <template v-if="project && application">
      <section class="member-project-detail-hero">
        <el-button :icon="Back" circle aria-label="返回我的项目" @click="backToList" />
        <div class="detail-hero-main">
          <p>{{ backPath.includes("application-projects") ? "我的项目 / 项目详情" : "我的项目 / 项目详情" }}</p>
          <h1>{{ project.projectName }}</h1>
          <span>{{ project.projectCode }} · {{ project.batchName }}</span>
        </div>
        <div class="detail-hero-actions">
          <el-tag effect="light" :type="getStatusType(project.projectStatus)" round>{{ project.projectStatus }}</el-tag>
          <el-button @click="backToList">返回列表</el-button>
        </div>
      </section>

      <section class="detail-summary-grid">
        <article>
          <span>当前节点</span>
          <strong>{{ project.currentNode }}</strong>
        </article>
        <article>
          <span>研究周期</span>
          <strong>{{ project.researchPeriod }}</strong>
        </article>
        <article>
          <span>项目预算</span>
          <strong>{{ formatCurrency(project.totalBudget) }}</strong>
        </article>
        <article>
          <span>申报材料</span>
          <strong>已同步</strong>
        </article>
      </section>

      <section class="member-project-detail-card">
        <header class="detail-card-head">
          <div>
            <h2>申报书内容</h2>
            <p>内容按项目负责人填写申报时的章节结构展示，不包含后续审批意见。</p>
          </div>
          <el-tag effect="plain">{{ application.templateVersion }}</el-tag>
        </header>

        <el-tabs v-model="activeTab" class="application-detail-tabs">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="3" border>
              <el-descriptions-item label="项目名称">{{ application.projectName }}</el-descriptions-item>
              <el-descriptions-item label="所属学部">{{ displayText(application.department) }}</el-descriptions-item>
              <el-descriptions-item label="所属子方向">{{ getSubdirection(application) }}</el-descriptions-item>
              <el-descriptions-item label="类别">{{ application.projectCategory }}</el-descriptions-item>
              <el-descriptions-item label="单位名称">{{ application.unitName }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ application.applicantName }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ displayText(application.gender) }}</el-descriptions-item>
              <el-descriptions-item label="出生年月">{{ displayText(application.birthMonth) }}</el-descriptions-item>
              <el-descriptions-item label="学历">{{ displayText(application.education) }}</el-descriptions-item>
              <el-descriptions-item label="职称">{{ displayText(application.professionalTitle) }}</el-descriptions-item>
              <el-descriptions-item label="手机/电话">{{ displayText(application.mobile) }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ displayText(application.email) }}</el-descriptions-item>
              <el-descriptions-item label="研究周期">{{ application.researchPeriod }} 年</el-descriptions-item>
              <el-descriptions-item label="首年经费预算">
                {{ formatBudgetWan(application.firstYearBudget) }}
              </el-descriptions-item>
              <el-descriptions-item label="填报时间">{{ application.fillDate }}</el-descriptions-item>
            </el-descriptions>

            <section class="detail-section-block">
              <h3>内容摘要</h3>
              <p>{{ displayText(application.abstract) }}</p>
            </section>
          </el-tab-pane>

          <el-tab-pane label="研究方案" name="research">
            <div class="detail-section-list">
              <section>
                <h3>一、研究目的和意义简述</h3>
                <p>{{ displayText(application.researchPurpose) }}</p>
              </section>
              <section>
                <h3>二、主要研究内容</h3>
                <p>{{ displayText(application.mainResearchContent) }}</p>
              </section>
              <section>
                <h3>三、研究基础</h3>
                <p>{{ displayText(application.researchFoundation) }}</p>
              </section>
            </div>
          </el-tab-pane>

          <el-tab-pane label="任务与指标" name="task">
            <section class="detail-section-block">
              <h3>四、年度研究任务和实施方案</h3>
              <p>{{ displayText(application.annualTasks) }}</p>
            </section>

            <section class="detail-section-block">
              <h3>五、总体考核指标</h3>
              <p>{{ displayText(application.assessmentIndicators) }}</p>
            </section>
          </el-tab-pane>

          <el-tab-pane label="团队与经费" name="team">
            <section class="detail-section-block">
              <h3>六、参加人员名单</h3>
              <el-table class="detail-inner-table" :data="application.participants" border>
                <el-table-column prop="category" label="类别" width="116" />
                <el-table-column prop="name" label="姓名" width="120" />
                <el-table-column prop="unit" label="单位" min-width="170" show-overflow-tooltip />
                <el-table-column prop="gender" label="性别" width="80" />
                <el-table-column prop="major" label="专业" min-width="150" show-overflow-tooltip />
                <el-table-column prop="title" label="职称/职务" min-width="130" show-overflow-tooltip />
                <el-table-column prop="responsibility" label="责任分工" min-width="220" show-overflow-tooltip />
              </el-table>
            </section>

            <section class="detail-section-block">
              <h3>项目预算明细</h3>
              <el-descriptions :column="2" border style="margin-bottom: 12px">
                <el-descriptions-item label="项目总预算（PMO 预设）">
                  {{ formatWan(application.totalBudget) }}
                </el-descriptions-item>
                <el-descriptions-item label="首年经费">
                  {{ formatBudgetWan(application.firstYearBudget) }}
                </el-descriptions-item>
              </el-descriptions>
              <el-table class="detail-inner-table" :data="allocationRows" border>
                <el-table-column prop="yearLabel" label="年度" width="140" />
                <el-table-column label="拨付金额" align="right">
                  <template #default="{ row }">{{ formatWan(row.amount) }}</template>
                </el-table-column>
              </el-table>
              <div class="budget-total">
                <span>分年度拨付合计</span>
                <strong>{{ formatWan(allocationTotal) }}</strong>
                <em v-if="application.packageNote">{{ application.packageNote }}</em>
              </div>
            </section>
          </el-tab-pane>

          <el-tab-pane v-if="!hideCommitment" label="承诺材料" name="commitment">
            <section class="commitment-grid">
              <article>
                <span class="file-icon">W</span>
                <div>
                  <strong>{{ project.sourceWordName }}</strong>
                  <p>原始 Word 申报书</p>
                </div>
                <el-button type="primary" link>下载</el-button>
              </article>
              <article>
                <span class="file-icon pdf">PDF</span>
                <div>
                  <strong>{{ project.generatedPdfName }}</strong>
                  <p>申报书 PDF 预览文件</p>
                </div>
                <el-button type="primary" link>预览</el-button>
              </article>
            </section>

            <section class="detail-section-block">
              <h3>项目经费使用承诺书</h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="项目名称">{{ application.projectName }}</el-descriptions-item>
                <el-descriptions-item label="项目负责人">{{ application.applicantName }}</el-descriptions-item>
                <el-descriptions-item label="是否存在联合负责人">
                  {{ application.jointEnabled ? '是' : '否' }}
                </el-descriptions-item>
                <el-descriptions-item v-if="application.jointEnabled" label="联合负责人姓名">
                  {{ displayText(application.jointLeaderName) }}
                </el-descriptions-item>
                <el-descriptions-item label="在线确认">
                  <el-tag :type="application.consent ? 'success' : 'warning'" effect="light">
                    {{ application.consent ? '已确认' : '未确认' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="系统记录">
                  确认人：{{ application.applicantName }}
                  <template v-if="application.consentConfirmedAt">
                    · 确认时间：{{ application.consentConfirmedAt }}
                  </template>
                </el-descriptions-item>
              </el-descriptions>
            </section>
          </el-tab-pane>
        </el-tabs>
      </section>
    </template>

    <el-empty v-else class="member-project-empty" description="未找到该项目，或当前账号无权查看">
      <el-button type="primary" @click="backToList">返回我的项目</el-button>
    </el-empty>
  </section>
</template>

<style scoped>
.member-project-detail-page {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.member-project-detail-hero,
.detail-summary-grid article,
.member-project-detail-card {
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(40, 72, 120, 0.06);
}

.member-project-detail-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
}

.detail-hero-main {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 6px;
}

.detail-hero-main p,
.detail-hero-main span {
  margin: 0;
  color: #7b8ba4;
  font-size: 13px;
}

.detail-hero-main h1 {
  overflow: hidden;
  margin: 0;
  color: #142849;
  font-size: 26px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.detail-summary-grid article {
  display: grid;
  gap: 6px;
  padding: 16px;
}

.detail-summary-grid span {
  color: #7b8ba4;
  font-size: 13px;
}

.detail-summary-grid strong {
  overflow: hidden;
  color: #152b4f;
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-project-detail-card {
  min-width: 0;
  overflow: hidden;
  padding: 20px 22px 24px;
}

.detail-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.detail-card-head h2 {
  margin: 0;
  color: #152b4f;
  font-size: 22px;
}

.detail-card-head p {
  margin: 6px 0 0;
  color: #7b8ba4;
  font-size: 13px;
}

.application-detail-tabs {
  min-width: 0;
}

.detail-section-block,
.detail-section-list section {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e6edf7;
  border-radius: 12px;
  background: #fbfdff;
}

.detail-section-block h3,
.detail-section-list h3 {
  margin: 0 0 10px;
  color: #152b4f;
  font-size: 16px;
}

.detail-section-block p,
.detail-section-list p {
  margin: 0;
  color: #526177;
  line-height: 1.8;
}

.detail-section-list {
  display: grid;
  gap: 12px;
}

.detail-section-list.two-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-inner-table {
  width: 100%;
  --el-table-header-bg-color: #f6f9fe;
  --el-table-header-text-color: #5f6f86;
}

.detail-inner-table :deep(.el-table__cell) {
  padding: 9px 0;
}

.secondary {
  padding-left: 14px;
  color: #7b8ba4;
}

.budget-total {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  color: #637185;
  font-size: 13px;
}

.budget-total strong {
  color: #3478e5;
  font-size: 18px;
}

.budget-total em {
  color: #91a0b6;
  font-style: normal;
}

.commitment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.commitment-grid article {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e6edf7;
  border-radius: 12px;
  background: #fbfdff;
}

.file-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  color: #3478e5;
  background: #eaf2ff;
  font-weight: 800;
}

.file-icon.pdf {
  color: #23a574;
  background: #e8f7f1;
  font-size: 12px;
}

.commitment-grid article div {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 3px;
}

.commitment-grid strong {
  overflow: hidden;
  color: #152b4f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commitment-grid p {
  margin: 0;
  color: #91a0b6;
  font-size: 12px;
}

.sign-date {
  margin-left: 8px;
  color: #7b8ba4;
}

.member-project-empty {
  min-height: 420px;
  border: 1px solid #e3ebf6;
  border-radius: 14px;
  background: #fff;
}

@media (max-width: 1280px) {
  .detail-summary-grid,
  .commitment-grid,
  .detail-section-list.two-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
