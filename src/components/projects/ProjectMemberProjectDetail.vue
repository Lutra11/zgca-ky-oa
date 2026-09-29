<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back, DocumentChecked } from '@element-plus/icons-vue'
import type { LoggedInUser } from '../../types/auth'
import { getProjectMemberProjectDetail } from '../../dataset/projectMemberProjectsMock'
import type { ProjectApplicationWizardState } from '../../dataset/projectApplicationWizardMock'
import { formatCurrency } from '../finance/financeFormat'

const props = defineProps<{
  currentUser: LoggedInUser | null
}>()

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

const budgetRows = computed(() => {
  const budget = application.value?.budget

  if (!budget) {
    return []
  }

  return [
    {
      subject: '设备费',
      amount: budget.equipment,
      note: budget.equipmentNote,
    },
    {
      subject: '其中：设备购置费',
      amount: budget.purchase,
      note: budget.purchaseNote,
      secondary: true,
    },
    {
      subject: '业务费',
      amount: budget.business,
      note: budget.businessNote,
    },
    {
      subject: '劳务费',
      amount: budget.labor,
      note: budget.laborNote,
    },
  ]
})

const budgetTotal = computed(() => {
  const budget = application.value?.budget

  return budget ? budget.equipment + budget.business + budget.labor : 0
})

const hasSpecialCompute = computed(() => application.value?.specialCompute === 'yes')

function backToList() {
  router.push('/project-member/my-projects')
}

function displayText(value: string | number | undefined) {
  if (value === 0) {
    return '0'
  }

  return value ? String(value) : '尚未填写'
}

function maskIdCard(value: string) {
  if (!value || value.length < 8) {
    return '尚未填写'
  }

  return `${value.slice(0, 6)}********${value.slice(-4)}`
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

function getProjectDirection(applicationState: ProjectApplicationWizardState) {
  return applicationState.projectDirection || '尚未填写'
}
</script>

<template>
  <section class="member-project-detail-page" aria-label="我的项目详情">
    <template v-if="project && application">
      <section class="member-project-detail-hero">
        <el-button :icon="Back" circle aria-label="返回我的项目" @click="backToList" />
        <div class="detail-hero-main">
          <p>我的项目 / 项目详情</p>
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
              <el-descriptions-item label="项目方向">{{ getProjectDirection(application) }}</el-descriptions-item>
              <el-descriptions-item label="项目类别">{{ application.projectCategory }}</el-descriptions-item>
              <el-descriptions-item label="单位名称">{{ application.unitName }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ application.applicantName }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ displayText(application.gender) }}</el-descriptions-item>
              <el-descriptions-item label="出生年月">{{ displayText(application.birthMonth) }}</el-descriptions-item>
              <el-descriptions-item label="学历">{{ displayText(application.education) }}</el-descriptions-item>
              <el-descriptions-item label="职称">{{ displayText(application.professionalTitle) }}</el-descriptions-item>
              <el-descriptions-item label="手机">{{ displayText(application.mobile) }}</el-descriptions-item>
              <el-descriptions-item label="电话">{{ displayText(application.telephone) }}</el-descriptions-item>
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
                <p>{{ displayText(application.purposeSignificance) }}</p>
              </section>
              <section>
                <h3>国内外研究现状</h3>
                <p>{{ displayText(application.researchStatus) }}</p>
              </section>
              <section>
                <h3>二、主要研究内容</h3>
                <p>{{ displayText(application.mainWork) }}</p>
              </section>
              <section>
                <h3>关键科学问题</h3>
                <p>{{ displayText(application.keyProblem) }}</p>
              </section>
              <section>
                <h3>主要技术难点</h3>
                <p>{{ displayText(application.technicalDifficulty) }}</p>
              </section>
              <section>
                <h3>技术路线</h3>
                <p>{{ displayText(application.technicalRoute) }}</p>
              </section>
              <section>
                <h3>方法创新</h3>
                <p>{{ displayText(application.methodInnovation) }}</p>
              </section>
              <section>
                <h3>三、研究基础</h3>
                <p>{{ displayText(application.researchFoundation) }}</p>
              </section>
              <section>
                <h3>申请人工作背景</h3>
                <p>{{ displayText(application.applicantBackground) }}</p>
              </section>
              <section>
                <h3>科研团队情况</h3>
                <p>{{ displayText(application.teamProfile) }}</p>
              </section>
              <section>
                <h3>科研项目组织实施经验</h3>
                <p>{{ displayText(application.implementationExperience) }}</p>
              </section>
            </div>
          </el-tab-pane>

          <el-tab-pane label="任务与指标" name="task">
            <section class="detail-section-block">
              <h3>四、年度研究任务和实施方案</h3>
              <el-table class="detail-inner-table" :data="application.annualPlans" border>
                <el-table-column prop="yearLabel" label="年度" width="110" />
                <el-table-column prop="researchTasks" label="主要研究任务" min-width="220" show-overflow-tooltip />
                <el-table-column prop="implementationPlan" label="实施方案" min-width="220" show-overflow-tooltip />
                <el-table-column prop="cooperationMode" label="研究计划及合作方式" min-width="220" show-overflow-tooltip />
                <el-table-column prop="studentTrainingGoal" label="学生培养目标" min-width="200" show-overflow-tooltip />
              </el-table>
            </section>

            <div class="detail-section-list two-columns">
              <section>
                <h3>五、总体考核指标</h3>
                <p>{{ displayText(application.overallGoal) }}</p>
              </section>
              <section>
                <h3>年度目标</h3>
                <p>{{ displayText(application.annualGoal) }}</p>
              </section>
              <section>
                <h3>预期成果</h3>
                <p>{{ displayText(application.expectedOutcomes) }}</p>
              </section>
              <section>
                <h3>社会、学术或产业影响力</h3>
                <p>{{ displayText(application.impact) }}</p>
              </section>
              <section>
                <h3>人才队伍建设</h3>
                <p>{{ displayText(application.talentDevelopment) }}</p>
              </section>
              <section>
                <h3>其他指标</h3>
                <p>{{ displayText(application.otherIndicators) }}</p>
              </section>
            </div>
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
              <h3>七、经费预算表</h3>
              <el-table class="detail-inner-table" :data="budgetRows" border>
                <el-table-column label="预算科目" min-width="160">
                  <template #default="{ row }">
                    <span :class="{ secondary: row.secondary }">{{ row.subject }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" width="132" align="right">
                  <template #default="{ row }">{{ formatBudgetWan(row.amount) }}</template>
                </el-table-column>
                <el-table-column prop="note" label="测算说明" min-width="260" show-overflow-tooltip />
              </el-table>
              <div class="budget-total">
                <span>预算合计</span>
                <strong>{{ formatBudgetWan(budgetTotal) }}</strong>
                <em>设备购置费为设备费明细，不重复计入合计</em>
              </div>
            </section>

            <section class="detail-section-block">
              <h3>八、算力说明</h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="是否有特殊算力需求">
                  {{ hasSpecialCompute ? '有特殊算力需求' : '无特殊算力需求' }}
                </el-descriptions-item>
                <el-descriptions-item label="算力规模">{{ displayText(application.computeScale) }}</el-descriptions-item>
                <el-descriptions-item label="使用周期">{{ displayText(application.computePeriod) }}</el-descriptions-item>
                <el-descriptions-item label="特殊环境">{{ displayText(application.computeEnvironment) }}</el-descriptions-item>
                <el-descriptions-item label="用途和原因" :span="2">
                  {{ displayText(application.computePurposeReason) }}
                </el-descriptions-item>
              </el-descriptions>
            </section>
          </el-tab-pane>

          <el-tab-pane label="承诺材料" name="commitment">
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
              <h3>九、项目经费使用承诺书</h3>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="项目名称">{{ application.projectName }}</el-descriptions-item>
                <el-descriptions-item label="项目负责人">{{ application.applicantName }}</el-descriptions-item>
                <el-descriptions-item label="负责人身份证号">
                  {{ maskIdCard(application.leaderIdCard) }}
                </el-descriptions-item>
                <el-descriptions-item label="是否存在联合负责人">
                  {{ application.jointEnabled ? '是' : '否' }}
                </el-descriptions-item>
                <el-descriptions-item v-if="application.jointEnabled" label="联合负责人">
                  {{ displayText(application.jointName) }}
                </el-descriptions-item>
                <el-descriptions-item v-if="application.jointEnabled" label="联合负责人身份证号">
                  {{ maskIdCard(application.jointIdCard) }}
                </el-descriptions-item>
                <el-descriptions-item label="承诺确认">
                  <el-tag :type="application.consent ? 'success' : 'warning'" effect="light">
                    {{ application.consent ? '已阅读并同意' : '未确认' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="负责人签名">
                  <el-tag type="success" effect="light">已采集</el-tag>
                  <span class="sign-date">日期：{{ application.leaderSignDate }}</span>
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
