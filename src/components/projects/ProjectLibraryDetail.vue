<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CircleCheckFilled,
  DataAnalysis,
  Document,
} from '@element-plus/icons-vue'
import {
  projectLedgerRows,
  type LedgerValue,
  type ProjectLedgerMember,
  type ProjectLedgerMentor,
  type ProjectLedgerProject,
} from '../../dataset/projectLedgerMock'
import { loadProjectChangeProjects } from '../../dataset/projectChangeStore'
import projectDetailsDataset from '../../dataset/project_details.json'

type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger'
type StageStatus = 'done' | 'active' | 'pending'
type RiskLevel = 'danger' | 'warning' | 'info' | 'success'
type QuarterlyReviewGrade = 'A' | 'B' | 'C' | 'D'
type OutcomeSectionKey = 'achievements' | 'monthly' | 'major'
type AchievementTypeKey = 'papers' | 'openSource' | 'patents'

interface InfoItem {
  label: string
  value: LedgerValue | number
  wide?: boolean
}

interface FundingSourceRow {
  source: string
  count: number
}

interface ChangeRecord {
  type: string
  operator: string
  time: string
  content: string
}

interface QuarterlyReviewResult {
  id: string
  year: string
  quarter: string
  reviewTime: string
  direction: string
  reviewer: string
  result: QuarterlyReviewGrade
  opinions: string[]
}

interface ProjectAchievementRow {
  id: string
  title: string
  category: string
  owner: string
  status: string
  date: string
  note: string
}

interface ProjectMonthlyReport {
  id: string
  month: string
  title: string
  submitter: string
  status: string
  summary: string
}

interface ProjectMajorOutcome {
  id: string
  title: string
  level: string
  date: string
  impact: string
}

interface QuarterlyOverviewProject {
  id: string
  projectCode: string
  projectName: string
  projectType: string
  projectBatch: string
  status: string
  faculty: string
  subDirection: string
  projectLeader: string
  subDirectionLeader: string
  description: {
    goal: string
    content: string
    applicationValue: string
  }
  budget: number
  usedBudget: number
  expectedResults: number
  completedResults: number
  paperCount: number
  tags: string[]
  timeline: Array<{
    date: string
    title: string
    operator: string
    note: string
    status: StageStatus
  }>
  risks: Array<{
    id: string
    level: RiskLevel
    title: string
    description: string
    action: string
  }>
  contactInfo: {
    projectSource: string
    researchField: string
    keywords: string
    resultForms: string
    partner: string
    partnerStartDate: string
    partnerEndDate: string
    remark: string
    department: string
    contactPerson: string
    phone: string
    email: string
  }
}

const route = useRoute()
const router = useRouter()
const activeTab = shallowRef('basic')
const outcomeSection = shallowRef<OutcomeSectionKey>('achievements')
const achievementType = shallowRef<AchievementTypeKey>('papers')
const quarterlyProjectDetails = projectDetailsDataset as QuarterlyOverviewProject[]

const tabItems = [
  { label: '基本信息', name: 'basic' },
  { label: '项目成员信息', name: 'members' },
  { label: '季度推进会信息', name: 'quarterly' },
  { label: '科研成果管理', name: 'outcomes' },
  { label: '梧桐杯加速项目信息', name: 'wutong' },
  { label: '变更记录', name: 'changes' },
]

const memberColumns: Array<{ prop: keyof ProjectLedgerMember; label: string; minWidth?: number }> = [
  { prop: 'name', label: '姓名', minWidth: 140 },
  { prop: 'studentStatus', label: '在项状态', minWidth: 110 },
  { prop: 'researchTopic', label: '研究课题', minWidth: 220 },
  { prop: 'entryDate', label: '入项日期', minWidth: 112 },
  { prop: 'exitDate', label: '出项日期', minWidth: 112 },
  { prop: 'grade', label: '年级', minWidth: 86 },
  { prop: 'role', label: '角色', minWidth: 120 },
  { prop: 'university', label: '学籍高校', minWidth: 150 },
  { prop: 'school', label: '院系', minWidth: 150 },
  { prop: 'major', label: '专业', minWidth: 140 },
  { prop: 'fundingSource', label: '经费来源', minWidth: 120 },
  { prop: 'phone', label: '手机号码', minWidth: 128 },
  { prop: 'email', label: '电子邮箱', minWidth: 190 },
]

const mentorColumns: Array<{ prop: keyof ProjectLedgerMentor; label: string; minWidth?: number }> = [
  { prop: 'name', label: '姓名', minWidth: 140 },
  { prop: 'mentorStatus', label: '在项状态', minWidth: 110 },
  { prop: 'entryDate', label: '入项日期', minWidth: 112 },
  { prop: 'exitDate', label: '出项日期', minWidth: 112 },
  { prop: 'title', label: '职称', minWidth: 110 },
  { prop: 'organization', label: '工作单位', minWidth: 190 },
  { prop: 'phone', label: '手机号', minWidth: 128 },
  { prop: 'email', label: '邮箱', minWidth: 190 },
]

const achievementTypeOptions = [
  { label: '论文', value: 'papers' },
  { label: '开源', value: 'openSource' },
  { label: '专利', value: 'patents' },
]

const quarterLabelMap: Record<string, string> = {
  Q1: '第一季度',
  Q2: '第二季度',
  Q3: '第三季度',
  Q4: '第四季度',
}

const projectId = computed(() => {
  const param = route.params.projectId

  return decodeURIComponent(Array.isArray(param) ? param[0] ?? '' : String(param ?? ''))
})

const project = computed<ProjectLedgerProject | null>(
  () =>
    loadProjectChangeProjects().find((item) => getProjectKey(item) === projectId.value) ??
    projectLedgerRows.find((item) => getProjectKey(item) === projectId.value) ??
    null,
)

const quarterlyOverviewProject = computed<QuarterlyOverviewProject | null>(() => {
  const current = project.value
  const matched = quarterlyProjectDetails.find(
    (item) =>
      text(current?.code) === item.projectCode ||
      text(current?.instanceId) === item.id ||
      text(current?.name) === item.projectName,
  )

  return matched ?? quarterlyProjectDetails.find((item) => item.projectCode === 'PMJ240401') ?? null
})

const quarterlyReviewResults = computed<QuarterlyReviewResult[]>(() => {
  const current = quarterlyOverviewProject.value
  const fallbackDirection = getShortDirection(project.value?.subDirection) || '智能科学技术'
  const fallbackReviewer = shown(project.value?.departmentLeader)

  return [
    {
      id: 'review-2026-q1',
      year: '2026',
      quarter: 'Q1',
      reviewTime: '2026-03-26 14:00',
      direction: current?.subDirection || fallbackDirection,
      reviewer: fallbackReviewer,
      result: 'B',
      opinions: ['项目方向明确，建议补充阶段性量化指标。', '经费使用计划需进一步拆分到具体任务。'],
    },
    {
      id: 'review-2026-q2',
      year: '2026',
      quarter: 'Q2',
      reviewTime: '2026-06-25 15:30',
      direction: current?.subDirection || fallbackDirection,
      reviewer: shown(project.value?.directionLeader),
      result: 'A',
      opinions: ['阶段目标完成度较好，成果产出与计划基本匹配。', '建议继续强化应用验证场景和合作单位反馈。'],
    },
    {
      id: 'review-2026-q3',
      year: '2026',
      quarter: 'Q3',
      reviewTime: '2026-09-24 10:30',
      direction: current?.subDirection || fallbackDirection,
      reviewer: '季度推进会专家组',
      result: 'A',
      opinions: [
        '当前研究进度稳定，关键算法验证结果达到季度预期。',
        '后续应补充可复现实验记录，并形成可沉淀的技术文档。',
        '建议在下一季度集中推进成果登记和应用示范材料准备。',
      ],
    },
    {
      id: 'review-2026-q4',
      year: '2026',
      quarter: 'Q4',
      reviewTime: '2026-12-22 09:30',
      direction: current?.subDirection || fallbackDirection,
      reviewer: '科研部评审组',
      result: 'B',
      opinions: ['年度总结材料待补充，建议同步梳理知识产权和论文成果。'],
    },
    {
      id: 'review-2025-q4',
      year: '2025',
      quarter: 'Q4',
      reviewTime: '2025-12-19 14:00',
      direction: current?.subDirection || fallbackDirection,
      reviewer: '历史项目评审组',
      result: 'C',
      opinions: ['历史批次数据用于展示季度筛选效果，正式环境将由季度推进会接口返回。'],
    },
  ]
})

const achievementRows = computed<Record<AchievementTypeKey, ProjectAchievementRow[]>>(() => {
  const current = project.value
  const code = shown(current?.code)
  const leader = shown(current?.leader)

  return {
    papers: [
      {
        id: `${code}-paper-001`,
        title: `${shown(current?.name)}阶段性研究论文`,
        category: '论文',
        owner: leader,
        status: '已发表',
        date: '2026-08-18',
        note: '对应成果管理中的论文成果管理。',
      },
      {
        id: `${code}-paper-002`,
        title: '科研项目算法验证与应用分析',
        category: '论文',
        owner: leader,
        status: '投稿中',
        date: '2026-09-05',
        note: '待同步期刊/会议、检索和 DOI 信息。',
      },
    ],
    openSource: [
      {
        id: `${code}-open-001`,
        title: '项目实验代码与样例数据仓库',
        category: '开源',
        owner: leader,
        status: '维护中',
        date: '2026-08-28',
        note: '对应成果管理中的开源管理。',
      },
    ],
    patents: [
      {
        id: `${code}-patent-001`,
        title: `${shown(current?.name)}相关方法专利`,
        category: '专利',
        owner: leader,
        status: '受理中',
        date: '2026-09-12',
        note: '对应成果管理中的知识产权/专利数据。',
      },
    ],
  }
})

const currentAchievementRows = computed(() => achievementRows.value[achievementType.value])

const monthlyReports = computed<ProjectMonthlyReport[]>(() => [
  {
    id: 'report-2026-07',
    month: '2026年07月',
    title: `${shown(project.value?.name)}科研月报`,
    submitter: shown(project.value?.leader),
    status: '已提交',
    summary: '完成阶段实验记录整理，补充项目成员任务分工和本月风险说明。',
  },
  {
    id: 'report-2026-08',
    month: '2026年08月',
    title: `${shown(project.value?.name)}科研月报`,
    submitter: shown(project.value?.leader),
    status: '待完善',
    summary: '持续推进核心研究任务，待补充成果证明材料和下月计划。',
  },
])

const majorOutcomes = computed<ProjectMajorOutcome[]>(() => [
  {
    id: 'major-001',
    title: `${shown(project.value?.name)}关键阶段成果`,
    level: '院级重点成果',
    date: '2026-08-30',
    impact: '形成可展示的阶段性技术成果，后续可接入重大成果登记和展示流程。',
  },
])

const basicInfoItems = computed<InfoItem[]>(() => {
  const current = project.value

  if (!current) {
    return []
  }

  return [
    { label: '项目名称', value: current.name, wide: true },
    { label: '状态', value: current.status },
    { label: '类型', value: current.type },
    { label: '项目编号', value: current.code },
    { label: '项目类型', value: current.projectType },
    { label: '终止时间', value: current.endDate },
    { label: '经费', value: current.funding },
    { label: '当前算力额度', value: current.computeQuota },
  ]
})

const organizationItems = computed<InfoItem[]>(() => {
  const current = project.value

  if (!current) {
    return []
  }

  return [
    { label: '项目负责人', value: current.leader },
    { label: '学部/部门', value: current.department },
    { label: '管理部门', value: current.managementDepartment },
    { label: '子方向', value: current.subDirection, wide: true },
    { label: '部门负责人', value: current.departmentLeader },
    { label: '方向负责人', value: current.directionLeader },
    { label: '是否兼职导师', value: current.isPartTimeMentor },
    { label: '项目负责人职称', value: current.leaderTitle },
    { label: '项目负责人工作单位', value: current.leaderOrganization, wide: true },
    { label: '手机号', value: current.phone },
    { label: '邮箱', value: current.email },
    { label: 'PM', value: current.pm },
    { label: 'PM邮箱', value: current.pmEmail },
  ]
})

const fundingSourceRows = computed<FundingSourceRow[]>(() => {
  const counter = new Map<string, number>()

  project.value?.members.forEach((member) => {
    const source = text(member.fundingSource)

    if (!source) {
      return
    }

    counter.set(source, (counter.get(source) ?? 0) + 1)
  })

  return Array.from(counter.entries()).map(([source, count]) => ({ source, count }))
})

const changeRecords = computed<ChangeRecord[]>(() => {
  const current = project.value

  if (!current) {
    return []
  }

  const records: ChangeRecord[] = [
    {
      type: '创建项目台账',
      operator: shown(current.submitter),
      time: shown(current.createdAt),
      content: '录入项目基础信息、组织归属和初始成员数据。',
    },
  ]

  if (text(current.updatedAt) && current.updatedAt !== current.createdAt) {
    records.push({
      type: '更新台账记录',
      operator: shown(current.submitter),
      time: shown(current.updatedAt),
      content: '同步项目台账字段更新，后续可接入项目变更审批记录。',
    })
  }

  return records
})

const hasComputeQuota = computed(() => {
  const quota = Number(text(project.value?.computeQuota))

  return Number.isFinite(quota) && quota > 0
})

const isWutongProject = computed(() => {
  const current = project.value

  if (!current) {
    return false
  }

  return [current.name, current.projectType, current.subDirection]
    .map((item) => text(item))
    .some((item) => item.includes('梧桐杯'))
})

function text(value: LedgerValue | number | undefined) {
  return value === null || value === undefined || value === '' ? '' : String(value)
}

function shown(value: LedgerValue | number | undefined) {
  return text(value) || '暂未登记'
}

function getProjectKey(item?: ProjectLedgerProject | null) {
  if (!item) {
    return ''
  }

  return text(item.code) || text(item.instanceId) || text(item.name)
}

function getStatusTagType(status: LedgerValue): TagType {
  if (text(status) === '在研') {
    return 'success'
  }

  if (text(status) === '终止') {
    return 'danger'
  }

  return 'info'
}

function tagTypeByStatus(status: string): TagType {
  if (['已发表', '已提交', '已授权', '已登记', '维护中'].includes(status)) {
    return 'success'
  }

  if (['投稿中', '受理中', '待完善', '审核中'].includes(status)) {
    return 'warning'
  }

  if (['已驳回', '异常'].includes(status)) {
    return 'danger'
  }

  return 'info'
}

function getReviewResultType(result: QuarterlyReviewGrade): TagType {
  if (result === 'A') {
    return 'success'
  }

  if (result === 'B') {
    return 'primary'
  }

  if (result === 'C') {
    return 'warning'
  }

  return 'danger'
}

function getQuarterLabel(quarter: string) {
  return quarterLabelMap[quarter] ?? quarter
}

function personInitial(value: LedgerValue) {
  return shown(value).replace(/\([^)]*\)/g, '').trim().slice(0, 1) || '项'
}

function getShortDirection(value: LedgerValue | undefined) {
  const direction = text(value)

  return direction.split('-').filter(Boolean).pop() ?? direction
}

function formatQuota(value: LedgerValue) {
  const quota = text(value)

  if (!quota) {
    return '暂未登记'
  }

  return quota === '0' ? '0' : quota
}

function openFinanceDetail() {
  const projectCode = text(project.value?.code)

  router.push(`/research-project-admin/finance-workbench/${encodeURIComponent(projectCode)}`)
}

function backToLibrary() {
  router.push('/research-project-admin/project-library')
}
</script>

<template>
  <section class="project-library-detail-page" aria-label="项目库详情">
    <el-result v-if="!project" icon="warning" title="未找到对应项目" sub-title="请返回项目库重新选择项目">
      <template #extra>
        <el-button type="primary" @click="backToLibrary">返回项目库</el-button>
      </template>
    </el-result>

    <template v-else>
      <section class="library-detail-card">
        <el-tabs v-model="activeTab" class="project-library-tabs">
          <el-tab-pane v-for="tab in tabItems" :key="tab.name" :label="tab.label" :name="tab.name" />
        </el-tabs>

        <section v-if="activeTab === 'basic'" class="tab-panel-content">
          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>项目基本信息</h2>
              </div>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item v-for="item in basicInfoItems" :key="item.label" :label="item.label" :span="item.wide ? 3 : 1">
                <el-tag v-if="item.label === '状态'" :type="getStatusTagType(project.status)" effect="light">
                  {{ shown(item.value) }}
                </el-tag>
                <span v-else>{{ shown(item.value) }}</span>
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="quarterlyOverviewProject" class="basic-overview-embedded">
              <div class="basic-overview-title">
                <div>
                  <h3>项目概述</h3>
                  <p>来自季度推进会项目管理的项目概览。</p>
                </div>
                <el-tag :type="getStatusTagType(quarterlyOverviewProject.status)" effect="light" round>
                  {{ quarterlyOverviewProject.status }}
                </el-tag>
              </div>
              <div class="quarterly-overview-row">
                <article>
                  <span>研究目标</span>
                  <p>{{ quarterlyOverviewProject.description.goal }}</p>
                </article>
                <article>
                  <span>研究内容</span>
                  <p>{{ quarterlyOverviewProject.description.content }}</p>
                </article>
                <article>
                  <span>应用价值</span>
                  <p>{{ quarterlyOverviewProject.description.applicationValue }}</p>
                </article>
              </div>
            </div>
          </article>

          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>组织与负责人信息</h2>
                <p>展示负责人、管理部门、子方向和联系信息。</p>
              </div>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item
                v-for="item in organizationItems"
                :key="item.label"
                :label="item.label"
                :span="item.wide ? 3 : 1"
              >
                {{ shown(item.value) }}
              </el-descriptions-item>
            </el-descriptions>
          </article>

          <div class="basic-resource-grid">
            <article class="library-section-block resource-card">
              <div class="section-title-row">
                <div>
                  <h2>项目经费</h2>
                  <p>项目库保留台账经费摘要，完整执行明细进入经费管理查看。</p>
                </div>
                <el-button type="primary" plain @click="openFinanceDetail">查看经费详情</el-button>
              </div>

              <div class="finance-overview-grid">
                <article>
                  <span>台账经费</span>
                  <strong>{{ shown(project.funding) }}</strong>
                  <small>如未登记，需等待经费管理数据同步。</small>
                </article>
                <article>
                  <span>成员经费来源</span>
                  <strong>{{ fundingSourceRows.length ? `${fundingSourceRows.length} 类` : '暂未登记' }}</strong>
                  <small>来自项目成员子表。</small>
                </article>
              </div>

              <el-table v-if="fundingSourceRows.length" class="library-child-table compact-table" :data="fundingSourceRows" border>
                <el-table-column prop="source" label="经费来源" min-width="180" />
                <el-table-column prop="count" label="关联成员数" width="120" />
              </el-table>
              <el-empty v-else description="该项目暂未同步经费来源或预算执行数据" />
            </article>

            <article class="library-section-block resource-card">
              <div class="section-title-row">
                <div>
                  <h2>项目算力</h2>
                  <p>与经费并列展示，后续对接算力使用明细接口。</p>
                </div>
                <span class="data-source-pill">
                  <el-icon><DataAnalysis /></el-icon>
                  算力资源
                </span>
              </div>

              <div class="compute-panel" :class="{ active: hasComputeQuota }">
                <span class="compute-icon">
                  <el-icon><DataAnalysis /></el-icon>
                </span>
                <div>
                  <span>当前算力额度</span>
                  <strong>{{ formatQuota(project.computeQuota) }}</strong>
                  <p v-if="hasComputeQuota">该项目已在项目库台账中登记算力额度，可继续补充使用周期和资源类型。</p>
                  <p v-else>该项目暂未登记专项算力额度。</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="activeTab === 'members'" class="tab-panel-content">
          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>学生成员</h2>
                <p>项目成员信息与学生在项状态。</p>
              </div>
              <el-tag type="primary" effect="light" round>{{ project.members.length }} 人</el-tag>
            </div>
            <el-table
              v-if="project.members.length"
              class="library-child-table"
              :data="project.members"
              border
              row-key="instanceId"
            >
              <el-table-column type="index" label="序号" width="64" />
              <el-table-column
                v-for="column in memberColumns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :min-width="column.minWidth"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span v-if="column.prop === 'name'" class="person-chip">
                    <span>{{ personInitial(row.name) }}</span>{{ shown(row.name) }}
                  </span>
                  <span v-else>{{ shown(row[column.prop]) }}</span>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="该项目暂未登记学生成员" />
          </article>

          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>导师信息</h2>
                <p>导师在项状态、单位和联系方式。</p>
              </div>
              <el-tag type="primary" effect="light" round>{{ project.mentors.length }} 人</el-tag>
            </div>
            <el-table
              v-if="project.mentors.length"
              class="library-child-table"
              :data="project.mentors"
              border
              row-key="instanceId"
            >
              <el-table-column type="index" label="序号" width="64" />
              <el-table-column
                v-for="column in mentorColumns"
                :key="column.prop"
                :prop="column.prop"
                :label="column.label"
                :min-width="column.minWidth"
                show-overflow-tooltip
              >
                <template #default="{ row }">{{ shown(row[column.prop]) }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="该项目暂未登记导师信息" />
          </article>
        </section>

        <section v-else-if="activeTab === 'quarterly'" class="tab-panel-content">
          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>推进会评审结果</h2>
                <p>以列表展示历次季度推进会评审结果、评委与评审意见。</p>
              </div>
              <el-tag type="primary" effect="light" round>{{ quarterlyReviewResults.length }} 条记录</el-tag>
            </div>

            <div v-if="quarterlyReviewResults.length" class="quarterly-review-list">
              <article
                v-for="review in quarterlyReviewResults"
                :key="review.id"
                class="quarterly-review-card"
              >
                <div class="quarterly-review-meta">
                  <span>
                    <em>评审批次</em>
                    <strong>{{ review.year }} 年 {{ getQuarterLabel(review.quarter) }}</strong>
                  </span>
                  <span>
                    <em>评审时间</em>
                    <strong>{{ review.reviewTime }}</strong>
                  </span>
                  <span>
                    <em>评审方向</em>
                    <strong>{{ review.direction }}</strong>
                  </span>
                  <span>
                    <em>评委</em>
                    <strong>{{ review.reviewer }}</strong>
                  </span>
                  <span>
                    <em>评审结果</em>
                    <el-tag :type="getReviewResultType(review.result)" effect="light" round>
                      {{ review.result }}
                    </el-tag>
                  </span>
                </div>

                <div class="quarterly-review-opinions">
                  <span class="opinion-title">
                    <el-icon><CircleCheckFilled /></el-icon>
                    评审意见
                  </span>
                  <ul>
                    <li v-for="opinion in review.opinions" :key="opinion">{{ opinion }}</li>
                  </ul>
                </div>
              </article>
            </div>
            <el-empty v-else description="暂无历次推进会评审结果" />
          </article>
        </section>

        <section v-else-if="activeTab === 'outcomes'" class="tab-panel-content">
          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>科研成果管理</h2>
                <p>按科研成果、科研月报和重大成果查看该项目沉淀内容。</p>
              </div>
              <span class="data-source-pill">
                <el-icon><Document /></el-icon>
                成果管理
              </span>
            </div>

            <el-tabs v-model="outcomeSection" class="outcome-sub-tabs">
              <el-tab-pane label="科研成果" name="achievements" />
              <el-tab-pane label="科研月报" name="monthly" />
              <el-tab-pane label="重大成果" name="major" />
            </el-tabs>

            <section v-if="outcomeSection === 'achievements'" class="outcome-section-panel">
              <div class="achievement-type-switch">
                <el-radio-group v-model="achievementType">
                  <el-radio-button
                    v-for="item in achievementTypeOptions"
                    :key="item.value"
                    :label="item.value"
                  >
                    {{ item.label }}
                  </el-radio-button>
                </el-radio-group>
              </div>

              <el-table class="library-child-table" :data="currentAchievementRows" border>
                <el-table-column prop="title" label="成果名称" min-width="260" show-overflow-tooltip />
                <el-table-column prop="category" label="成果类型" width="110" />
                <el-table-column prop="owner" label="负责人" min-width="150" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" width="110">
                  <template #default="{ row }">
                    <el-tag :type="tagTypeByStatus(row.status)" effect="light">{{ row.status }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="date" label="登记时间" width="130" />
                <el-table-column prop="note" label="说明" min-width="260" show-overflow-tooltip />
              </el-table>
            </section>

            <section v-else-if="outcomeSection === 'monthly'" class="outcome-section-panel">
              <div class="report-card-list">
                <article v-for="report in monthlyReports" :key="report.id" class="report-card">
                  <span class="report-month">{{ report.month }}</span>
                  <div>
                    <strong>{{ report.title }}</strong>
                    <p>{{ report.summary }}</p>
                    <small>提交人：{{ report.submitter }}</small>
                  </div>
                  <el-tag :type="tagTypeByStatus(report.status)" effect="light" round>{{ report.status }}</el-tag>
                </article>
              </div>
            </section>

            <section v-else class="outcome-section-panel">
              <div class="major-outcome-list">
                <article v-for="item in majorOutcomes" :key="item.id" class="major-outcome-card">
                  <span class="major-icon">
                    <el-icon><CircleCheckFilled /></el-icon>
                  </span>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.impact }}</p>
                    <small>{{ item.level }} · {{ item.date }}</small>
                  </div>
                </article>
              </div>
            </section>
          </article>
        </section>

        <section v-else-if="activeTab === 'wutong'" class="tab-panel-content">
          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>梧桐杯加速项目信息</h2>
                <p>展示项目是否进入梧桐杯加速项目管理范围。</p>
              </div>
              <el-tag :type="isWutongProject ? 'success' : 'info'" effect="light" round>
                {{ isWutongProject ? '已标记' : '未标记' }}
              </el-tag>
            </div>

            <el-descriptions :column="3" border>
              <el-descriptions-item label="是否梧桐杯加速项目">
                {{ isWutongProject ? '是' : '否' }}
              </el-descriptions-item>
              <el-descriptions-item label="所属项目">
                {{ shown(project.name) }}
              </el-descriptions-item>
              <el-descriptions-item label="项目编号">
                {{ shown(project.code) }}
              </el-descriptions-item>
              <el-descriptions-item label="加速阶段" :span="3">
                {{ isWutongProject ? '待接入加速阶段字段' : '暂未纳入梧桐杯加速管理' }}
              </el-descriptions-item>
            </el-descriptions>
          </article>
        </section>

        <section v-else-if="activeTab === 'changes'" class="tab-panel-content">
          <article class="library-section-block">
            <div class="section-title-row">
              <div>
                <h2>变更记录</h2>
                <p>当前展示台账创建和更新记录，后续可接入项目变更审批流水。</p>
              </div>
            </div>

            <el-timeline class="library-timeline">
              <el-timeline-item
                v-for="record in changeRecords"
                :key="`${record.type}-${record.time}`"
                :timestamp="record.time"
                type="primary"
              >
                <div class="change-card">
                  <strong>{{ record.type }}</strong>
                  <span>操作人：{{ record.operator }}</span>
                  <p>{{ record.content }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </article>
        </section>
      </section>
    </template>
  </section>
</template>

<style scoped>
.project-library-detail-page {
  --library-blue: #3478e5;
  --library-text: #172b49;
  --library-muted: #7c8ba1;
  --library-border: #e1e8f2;
  --library-soft: #f4f7fc;
  display: grid;
  gap: 16px;
  min-width: 0;
}

.library-detail-card,
.library-section-block {
  border: 1px solid var(--library-border);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(37 68 116 / 5.5%);
}

.compute-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  color: var(--library-blue);
  background: #eef5ff;
}

.library-detail-card {
  overflow: hidden;
  padding: 0 0 18px;
}

.project-library-tabs {
  padding: 0 22px;
}

.project-library-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 6px 0 0;
}

.project-library-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #e7edf6;
}

.project-library-tabs :deep(.el-tabs__item) {
  height: 52px;
  color: #6f7f96;
  font-size: 14px;
  font-weight: 720;
}

.project-library-tabs :deep(.el-tabs__item.is-active) {
  color: var(--library-blue);
}

.project-library-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 999px;
  background: var(--library-blue);
}

.tab-panel-content {
  display: grid;
  gap: 16px;
  padding: 18px 22px 0;
}

.library-section-block {
  padding: 18px;
}

.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title-row h2 {
  margin: 0;
  color: var(--library-text);
  font-size: 18px;
  line-height: 1.35;
  font-weight: 800;
}

.section-title-row p {
  margin: 5px 0 0;
  color: var(--library-muted);
  font-size: 12px;
  line-height: 1.6;
}

.library-section-block :deep(.el-descriptions__label) {
  width: 140px;
  color: #6f7f96;
  font-weight: 680;
}

.library-section-block :deep(.el-descriptions__content) {
  color: #1d2f4a;
  font-weight: 650;
}

.basic-overview-embedded {
  display: grid;
  gap: 12px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e8eef7;
}

.basic-overview-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.basic-overview-title h3 {
  margin: 0;
  color: var(--library-text);
  font-size: 15px;
  font-weight: 820;
}

.basic-overview-title p {
  margin: 4px 0 0;
  color: var(--library-muted);
  font-size: 12px;
}

.library-child-table {
  width: 100%;
}

.library-child-table :deep(.el-table__header th) {
  color: #60708a;
  background: #f6f9fe;
}

.person-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #263a55;
  font-weight: 700;
}

.person-chip span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  color: #3478e5;
  background: #edf4ff;
  font-size: 12px;
  font-weight: 800;
}

.data-source-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border: 1px solid #d9e6f8;
  border-radius: 999px;
  color: #3478e5;
  background: #f5f9ff;
  font-size: 12px;
  font-weight: 720;
  white-space: nowrap;
}

.finance-overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.finance-overview-grid article {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid #e2eaf5;
  border-radius: 12px;
  background: #f8fbff;
}

.finance-overview-grid span {
  color: #6f7f96;
  font-size: 12px;
}

.finance-overview-grid strong {
  color: var(--library-text);
  font-size: 20px;
  font-weight: 820;
}

.finance-overview-grid small {
  color: #8c99ad;
  font-size: 12px;
}

.basic-resource-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
  gap: 16px;
  align-items: stretch;
}

.resource-card {
  min-width: 0;
}

.compact-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.library-timeline {
  padding: 4px 0 0;
}

.change-card {
  display: grid;
  gap: 5px;
  padding: 12px 14px;
  border: 1px solid #e3eaf5;
  border-radius: 12px;
  background: #fbfdff;
}

.change-card strong {
  color: var(--library-text);
  font-size: 14px;
}

.change-card span,
.change-card p {
  margin: 0;
  color: var(--library-muted);
  font-size: 12px;
  line-height: 1.55;
}

.compute-panel {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
  border: 1px solid #e2eaf5;
  border-radius: 14px;
  background: #f8fbff;
}

.compute-panel.active {
  border-color: #b9d3fb;
  background: #f4f8ff;
}

.compute-panel > div {
  display: grid;
  gap: 5px;
}

.compute-panel span:not(.compute-icon) {
  color: var(--library-muted);
  font-size: 12px;
}

.compute-panel strong {
  color: var(--library-text);
  font-size: 24px;
  font-weight: 840;
}

.compute-panel p {
  margin: 0;
  color: #6f7f96;
  font-size: 13px;
  line-height: 1.65;
}

.outcome-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 12px;
}

.outcome-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border: 1px solid #e2eaf5;
  border-radius: 12px;
  background: #fbfdff;
}

.outcome-card div {
  display: grid;
  gap: 7px;
}

.outcome-card strong {
  color: var(--library-text);
  font-size: 15px;
  font-weight: 800;
}

.outcome-card p {
  margin: 0;
  color: var(--library-muted);
  font-size: 12px;
  line-height: 1.55;
}

.quarterly-overview-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.quarterly-overview-row article {
  min-width: 0;
  padding: 16px;
  border: 1px solid #e2eaf5;
  border-radius: 12px;
  background: #f8fbff;
}

.quarterly-overview-row span {
  display: block;
  margin-bottom: 8px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 800;
}

.quarterly-overview-row p {
  margin: 0;
  color: #40506a;
  font-size: 13px;
  line-height: 1.75;
}

.quarterly-filter-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.quarterly-filter-select {
  width: 136px;
}

.quarterly-review-list {
  display: grid;
  gap: 12px;
}

.quarterly-review-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e2eaf5;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
}

.quarterly-review-meta {
  display: grid;
  grid-template-columns: 150px 180px minmax(180px, 1fr) 180px 110px;
  gap: 14px;
  align-items: center;
}

.quarterly-review-meta span {
  min-width: 0;
  display: grid;
  gap: 5px;
  padding-right: 14px;
  border-right: 1px solid #e8eef7;
}

.quarterly-review-meta span:last-child {
  padding-right: 0;
  border-right: 0;
}

.quarterly-review-meta em {
  color: #8a98ad;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
}

.quarterly-review-meta strong {
  overflow: hidden;
  color: var(--library-text);
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quarterly-review-opinions {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f4f8ff;
}

.opinion-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 800;
}

.quarterly-review-opinions ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: #4d5d74;
  font-size: 13px;
  line-height: 1.65;
}

.outcome-sub-tabs {
  margin-top: -4px;
}

.outcome-sub-tabs :deep(.el-tabs__header) {
  margin-bottom: 14px;
}

.outcome-sub-tabs :deep(.el-tabs__item) {
  font-weight: 760;
}

.outcome-section-panel {
  display: grid;
  gap: 14px;
}

.achievement-type-switch {
  display: flex;
  justify-content: flex-start;
}

.report-card-list,
.major-outcome-list {
  display: grid;
  gap: 12px;
}

.report-card,
.major-outcome-card {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #e2eaf5;
  border-radius: 14px;
  background: #fbfdff;
}

.report-month {
  display: grid;
  place-items: center;
  min-height: 44px;
  border-radius: 12px;
  color: #3478e5;
  background: #edf5ff;
  font-size: 13px;
  font-weight: 800;
}

.report-card div,
.major-outcome-card div {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.report-card strong,
.major-outcome-card strong {
  color: var(--library-text);
  font-size: 15px;
  font-weight: 820;
}

.report-card p,
.major-outcome-card p {
  margin: 0;
  color: var(--library-muted);
  font-size: 13px;
  line-height: 1.55;
}

.report-card small,
.major-outcome-card small {
  color: #95a1b3;
  font-size: 12px;
}

.major-outcome-card {
  grid-template-columns: 48px minmax(0, 1fr);
}

.major-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #17a36b;
  background: #eaf8f2;
  font-size: 20px;
}

.quarterly-overview-layout {
  display: grid;
  grid-template-columns: minmax(380px, 0.9fr) minmax(320px, 0.6fr) minmax(360px, 0.78fr);
  gap: 16px;
  align-items: start;
}

.quarterly-overview-left {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.quarterly-supplement-card {
  grid-column: 1 / -1;
}

.quarterly-description-list {
  display: grid;
  gap: 10px;
  color: #40506a;
  font-size: 14px;
  line-height: 1.75;
}

.quarterly-description-list p {
  margin: 0;
}

.quarterly-description-list strong {
  color: var(--library-text);
  font-weight: 820;
}

.quarterly-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.quarterly-metric-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 74px;
  padding: 12px;
  border: 1px solid #e2eaf5;
  border-radius: 12px;
  background: #f8fbff;
}

.quarterly-metric-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  color: #3478e5;
  background: #edf5ff;
  font-size: 18px;
}

.quarterly-metric-card div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.quarterly-metric-card span:not(.quarterly-metric-icon) {
  color: #6f7f96;
  font-size: 12px;
  font-weight: 700;
}

.quarterly-metric-card strong {
  overflow: hidden;
  color: var(--library-text);
  font-size: 15px;
  font-weight: 840;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-green .quarterly-metric-icon {
  color: #17a36b;
  background: #eaf8f2;
}

.metric-amber .quarterly-metric-icon {
  color: #d28a20;
  background: #fff7e8;
}

.metric-purple .quarterly-metric-icon {
  color: #806fe8;
  background: #f2f0ff;
}

.quarterly-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quarterly-timeline-item {
  display: grid;
  gap: 4px;
}

.quarterly-timeline-item strong {
  color: var(--library-text);
  font-size: 13px;
  font-weight: 820;
}

.quarterly-timeline-item p {
  margin: 0;
  color: var(--library-muted);
  font-size: 12px;
  line-height: 1.55;
}

.quarterly-risk-list {
  display: grid;
  gap: 10px;
}

.quarterly-risk-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid #e3eaf5;
  border-radius: 12px;
  background: #fbfdff;
}

.quarterly-risk-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  color: #3478e5;
  background: #edf5ff;
}

.quarterly-risk-item.risk-warning .quarterly-risk-icon {
  color: #d28a20;
  background: #fff7e8;
}

.quarterly-risk-item.risk-danger .quarterly-risk-icon {
  color: #d84f3f;
  background: #fff0ed;
}

.quarterly-risk-item.risk-success .quarterly-risk-icon {
  color: #17a36b;
  background: #eaf8f2;
}

.quarterly-risk-item strong {
  display: block;
  color: var(--library-text);
  font-size: 13px;
  font-weight: 820;
}

.quarterly-risk-item p {
  margin: 4px 0 0;
  color: var(--library-muted);
  font-size: 12px;
  line-height: 1.55;
}

.quarterly-empty-success {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #17a36b;
  font-size: 13px;
  font-weight: 720;
}

@media (max-width: 1280px) {
  .outcome-grid,
  .basic-resource-grid,
  .quarterly-overview-row,
  .quarterly-overview-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quarterly-review-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quarterly-supplement-card {
    grid-column: auto;
  }
}

@media (max-width: 900px) {
  .section-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .finance-overview-grid {
    grid-template-columns: 1fr;
  }

  .basic-resource-grid,
  .quarterly-overview-row,
  .quarterly-review-meta,
  .report-card,
  .major-outcome-card {
    grid-template-columns: 1fr;
  }

  .quarterly-filter-bar {
    justify-content: flex-start;
  }

  .quarterly-review-meta span {
    padding-right: 0;
    border-right: 0;
  }

  .quarterly-overview-layout,
  .quarterly-metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
