<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { View } from '@element-plus/icons-vue'
import templateDataset from '../../../../dataset/template.json'
import type { ApprovalFilters, ApprovalProject, ReviewApproval } from '../types'

interface TemplateItem {
  id: string
  name: string
  templateNo: string
  category: string
  description: string
  fields?: string[]
  workflowNodes?: string[]
}

const props = defineProps<{
  approval: ReviewApproval | null
}>()

const emit = defineEmits<{
  approve: [approval: ReviewApproval]
  reject: [approval: ReviewApproval]
}>()

const templates = templateDataset as TemplateItem[]
const pageSize = shallowRef(8)
const currentPage = shallowRef(1)
const previewTemplate = shallowRef<TemplateItem | null>(null)
const isTemplateDialogVisible = shallowRef(false)

const draftFilters = reactive<ApprovalFilters>({
  batch: '',
  facultyDirection: '',
  projectType: '',
  keyword: '',
})

const appliedFilters = reactive<ApprovalFilters>({
  batch: '',
  facultyDirection: '',
  projectType: '',
  keyword: '',
})

const projects = computed(() => props.approval?.projects ?? [])
const reviewTemplate = computed(() => getTemplate(props.approval?.reviewTemplateId ?? ''))
const noticeTemplate = computed(() => getTemplate(props.approval?.noticeTemplateId ?? ''))

const batchOptions = computed(() => unique(projects.value.map((project) => project.batch)))
const facultyDirectionOptions = computed(() =>
  unique(projects.value.map((project) => `${project.faculty}/${project.subDirection}`)),
)
const projectTypeOptions = computed(() => unique(projects.value.map((project) => project.projectType)))

const filteredProjects = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return projects.value.filter((project) => {
    const matchesBatch = appliedFilters.batch ? project.batch === appliedFilters.batch : true
    const matchesFacultyDirection = appliedFilters.facultyDirection
      ? `${project.faculty}/${project.subDirection}` === appliedFilters.facultyDirection
      : true
    const matchesProjectType = appliedFilters.projectType
      ? project.projectType === appliedFilters.projectType
      : true
    const matchesKeyword = keyword
      ? [project.projectName, project.projectCode, project.principal].some((value) =>
          value.toLowerCase().includes(keyword),
        )
      : true

    return matchesBatch && matchesFacultyDirection && matchesProjectType && matchesKeyword
  })
})

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredProjects.value.slice(start, start + pageSize.value)
})

watch(
  () => props.approval?.id,
  () => {
    resetFilters()
  },
)

function applyFilters() {
  appliedFilters.batch = draftFilters.batch
  appliedFilters.facultyDirection = draftFilters.facultyDirection
  appliedFilters.projectType = draftFilters.projectType
  appliedFilters.keyword = draftFilters.keyword
  currentPage.value = 1
}

function resetFilters() {
  draftFilters.batch = ''
  draftFilters.facultyDirection = ''
  draftFilters.projectType = ''
  draftFilters.keyword = ''
  appliedFilters.batch = ''
  appliedFilters.facultyDirection = ''
  appliedFilters.projectType = ''
  appliedFilters.keyword = ''
  currentPage.value = 1
}

function openTemplatePreview(template: TemplateItem | null) {
  if (!template) {
    return
  }

  previewTemplate.value = template
  isTemplateDialogVisible.value = true
}

function getTemplate(templateId: string) {
  return templates.find((template) => template.id === templateId) ?? null
}

function getProjectIndex(index: number) {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean)
}

function viewProject(project: ApprovalProject) {
  console.info('Project detail reserved:', project.projectCode)
}
</script>

<template>
  <article class="approval-detail-card">
    <el-empty v-if="!approval" description="暂无待审批的评审申请" :image-size="116" />

    <template v-else>
      <section class="info-card">
        <h3>基本信息</h3>
        <div class="info-grid">
          <div>
            <span>本次评审名称</span>
            <strong>{{ approval.reviewName }}</strong>
          </div>
          <div>
            <span>评审周期</span>
            <strong>{{ approval.reviewPeriod[0] }} 至 {{ approval.reviewPeriod[1] }}</strong>
          </div>
          <div>
            <span>学生绩效和360评审周期</span>
            <strong>{{ approval.performancePeriod[0] }} 至 {{ approval.performancePeriod[1] }}</strong>
          </div>
          <div>
            <span>发起人 / 发起时间</span>
            <strong>{{ approval.initiator }} · {{ approval.initiatedAt }}</strong>
          </div>
          <div>
            <span>评审标准模板</span>
            <strong>
              {{ reviewTemplate?.name ?? approval.reviewTemplateId }}
              <el-button size="small" type="primary" plain @click="openTemplatePreview(reviewTemplate)">
                预览
              </el-button>
            </strong>
          </div>
          <div>
            <span>通知模板</span>
            <strong>
              {{ noticeTemplate?.name ?? approval.noticeTemplateId }}
              <el-button size="small" type="primary" plain @click="openTemplatePreview(noticeTemplate)">
                预览
              </el-button>
            </strong>
          </div>
          <div>
            <span>参评项目数量</span>
            <strong>{{ approval.projects.length }} 个</strong>
          </div>
        </div>
      </section>

      <section class="project-section">
        <h3>参评项目</h3>
        <div class="filter-panel">
          <el-select v-model="draftFilters.batch" placeholder="项目批次" clearable>
            <el-option v-for="batch in batchOptions" :key="batch" :label="batch" :value="batch" />
          </el-select>
          <el-select v-model="draftFilters.facultyDirection" placeholder="学部/子方向" clearable>
            <el-option
              v-for="item in facultyDirectionOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <el-select v-model="draftFilters.projectType" placeholder="项目类型" clearable>
            <el-option v-for="type in projectTypeOptions" :key="type" :label="type" :value="type" />
          </el-select>
          <el-input v-model="draftFilters.keyword" placeholder="请输入项目名称、项目负责人" clearable />
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>

        <el-table :data="paginatedProjects" class="project-table" height="340">
          <el-table-column label="序号" width="70" align="center">
            <template #default="{ $index }">{{ getProjectIndex($index) }}</template>
          </el-table-column>
          <el-table-column label="项目编号" width="126">
            <template #default="{ row }">
              <button class="project-code" type="button" @click="viewProject(row)">
                {{ row.projectCode }}
              </button>
            </template>
          </el-table-column>
          <el-table-column prop="projectType" label="项目类型" width="120" />
          <el-table-column prop="faculty" label="所属学部" width="120" />
          <el-table-column prop="subDirection" label="所属子方向" width="120" />
          <el-table-column prop="subDirectionLeader" label="子方向负责人" width="120" />
          <el-table-column prop="batch" label="项目批次" width="100" />
          <el-table-column label="项目名称" min-width="240">
            <template #default="{ row }">
              <el-tooltip :content="row.projectName" placement="top" effect="light">
                <span class="project-name">{{ row.projectName }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="principal" label="项目负责人" width="120" />
        </el-table>

        <div class="table-footer">
          <span>共 {{ filteredProjects.length }} 项</span>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[8, 10, 20]"
            :total="filteredProjects.length"
            layout="sizes, prev, pager, next"
            background
          />
        </div>
      </section>

      <footer class="detail-actions">
        <el-button type="danger" plain @click="emit('reject', approval)">驳回评审</el-button>
        <el-button type="primary" @click="emit('approve', approval)">通过评审</el-button>
      </footer>
    </template>

    <el-dialog v-model="isTemplateDialogVisible" title="模板预览" width="680px" append-to-body>
      <article v-if="previewTemplate" class="template-preview">
        <h3>{{ previewTemplate.name }}</h3>
        <p>{{ previewTemplate.templateNo }} · {{ previewTemplate.category }}</p>
        <section>
          <h4>模板正文</h4>
          <p>{{ previewTemplate.description }}</p>
        </section>
        <section v-if="previewTemplate.fields?.length">
          <h4>模板字段</h4>
          <el-tag v-for="field in previewTemplate.fields" :key="field" effect="light">{{ field }}</el-tag>
        </section>
        <section v-if="previewTemplate.workflowNodes?.length">
          <h4>附件与流程</h4>
          <p>{{ previewTemplate.workflowNodes.join(' / ') }}</p>
        </section>
      </article>
    </el-dialog>
  </article>
</template>

<style scoped>
.approval-detail-card {
  position: relative;
  min-width: 0;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 34px rgba(26, 39, 68, 0.06);
}

.info-card,
.project-section {
  border: 1px solid rgba(0, 113, 227, 0.08);
  border-radius: 12px;
  padding: 16px;
  background: #fbfdff;
}

.project-section {
  margin-top: 14px;
}

.info-card h3,
.project-section h3,
.template-preview h3,
.template-preview p,
.template-preview h4 {
  margin: 0;
}

.info-card h3,
.project-section h3 {
  margin-bottom: 14px;
  border-left: 4px solid #0a84ff;
  padding-left: 10px;
  color: #1d1d1f;
  font-size: 16px;
  font-weight: 840;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
}

.info-grid div {
  display: grid;
  gap: 6px;
}

.info-grid span {
  color: #86868b;
  font-size: 12px;
  font-weight: 720;
}

.info-grid strong {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1d1d1f;
  font-size: 13px;
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr)) minmax(220px, 1.4fr) auto auto;
  gap: 10px;
  margin-bottom: 12px;
}

.project-code {
  border: 0;
  color: #0a84ff;
  background: transparent;
  cursor: pointer;
  font-weight: 760;
}

.project-name {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-footer,
.detail-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.detail-actions {
  position: sticky;
  bottom: 0;
  justify-content: flex-end;
  border-top: 1px solid rgba(29, 29, 31, 0.06);
  padding-top: 12px;
  background: rgba(255, 255, 255, 0.95);
}

.detail-actions :deep(.el-button) {
  min-width: 120px;
  height: 40px;
  border-radius: 10px;
  font-weight: 780;
}

.template-preview {
  display: grid;
  gap: 12px;
}

.template-preview section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-preview section h4 {
  width: 100%;
}

@media (max-width: 1280px) {
  .filter-panel,
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
