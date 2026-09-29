<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion, User, View } from '@element-plus/icons-vue'
import announcementDataset from '../../../dataset/announcement_publish.json'
import templateDataset from '../../../dataset/template.json'
import { getCurrentUser } from '../../../utils/auth'
import AnnouncementForm from './AnnouncementForm.vue'
import AnnouncementPreviewDialog from './AnnouncementPreviewDialog.vue'
import IndependentProjectSelector from './IndependentProjectSelector.vue'
import PublishSummary from './PublishSummary.vue'
import SelectedProjectsPanel from './SelectedProjectsPanel.vue'
import UnifiedProjectScope from './UnifiedProjectScope.vue'
import type {
  AnnouncementAttachment,
  AnnouncementDataset,
  AnnouncementFormState,
  AnnouncementPerson,
  AnnouncementProject,
  AnnouncementProjectType,
  FacultyProjectGroup,
  NoticeTemplate,
  ProjectTypeProjectGroup,
  PublishMode,
  ReceiverOption,
  ReceiverType,
  ScopeGroupMode,
} from './types'

const ANNOUNCEMENT_RECORDS_KEY = 'zgca_ky_oa_announcement_records'

const route = useRoute()
const currentUser = getCurrentUser()
const dataset = announcementDataset as AnnouncementDataset
const allTemplates = templateDataset as NoticeTemplate[]

const mode = shallowRef<PublishMode>('unified')
const scopeGroupMode = shallowRef<ScopeGroupMode>('faculty')
const selectedProjectIds = shallowRef<string[]>([])
const attachments = shallowRef<AnnouncementAttachment[]>([])
const isPreviewVisible = shallowRef(false)
const isTemplatePreviewVisible = shallowRef(false)
const previewTemplate = shallowRef<NoticeTemplate | null>(null)
const lastGeneratedTitle = shallowRef('')

const noticeTemplates = computed(() => {
  const templates = allTemplates.filter((template) => {
    const isNotice = template.category.includes('通知') || template.templateNo.startsWith('TPL-NT')
    const isEnabled = template.status.includes('启用') || template.templateNo.startsWith('TPL-NT')

    return isNotice && isEnabled
  })

  return templates.length ? templates : allTemplates.filter((template) => template.templateNo.startsWith('TPL-NT'))
})

const normalizedProjects = computed<AnnouncementProject[]>(() =>
  dataset.projects.map((project, index) => ({
    ...project,
    projectType: project.projectType ?? inferProjectType(project, index),
  })),
)

const completedProjects = computed(() =>
  normalizedProjects.value.filter(
    (project) => project.reviewCompleted && project.reviewResult && project.reviewCompletedTime,
  ),
)

const groupedProjects = computed(() => groupProjectsByFaculty(completedProjects.value))
const projectTypeGroups = computed(() => groupProjectsByProjectType(completedProjects.value))

const receiverOptions = computed<ReceiverOption[]>(() => {
  if (mode.value === 'unified') {
    return [
      { label: '全部学部负责人', value: 'facultyLeader' },
      { label: '全部子方向负责人', value: 'subDirectionLeader' },
      { label: '全部项目负责人', value: 'projectLeader' },
      { label: '全部项目成员', value: 'projectMember' },
    ]
  }

  return [
    { label: '已选学部负责人', value: 'facultyLeader' },
    { label: '已选子方向负责人', value: 'subDirectionLeader' },
    { label: '已选项目负责人', value: 'projectLeader' },
    { label: '已选项目成员', value: 'projectMember' },
  ]
})

const form = reactive<AnnouncementFormState>({
  title: '',
  type: '项目评审结果公告',
  templateId: noticeTemplates.value[0]?.id ?? '',
  receiverTypes: ['facultyLeader', 'subDirectionLeader', 'projectLeader', 'projectMember'],
  summary: '本公告公示科研项目评审结果，请相关项目负责人及成员登录系统查看详细信息。',
  body: createDefaultBody(),
  pinned: true,
  readRequired: true,
})

const selectedProjects = computed(() => {
  if (mode.value === 'unified') {
    return completedProjects.value
  }

  const selectedSet = new Set(selectedProjectIds.value)
  return completedProjects.value.filter((project) => selectedSet.has(project.id))
})

const selectedGroups = computed(() => groupProjectsByFaculty(selectedProjects.value))
const selectedProjectTypeGroups = computed(() => groupProjectsByProjectType(selectedProjects.value))

const selectedFacultyCount = computed(() => selectedGroups.value.length)
const selectedProjectTypeCount = computed(() => selectedProjectTypeGroups.value.length)

const receiverPeople = computed(() => collectReceivers(selectedProjects.value, form.receiverTypes))

const receiverCount = computed(() => receiverPeople.value.length)

const receiverLabels = computed(() =>
  receiverOptions.value
    .filter((option) => form.receiverTypes.includes(option.value))
    .map((option) => option.label),
)

const pageRoleName = computed(() => String(route.meta.roleName ?? '科研项目管理员'))
const isBaseDataAnnouncement = computed(() => route.meta.featureKey === 'base-announcement-publishing')

const hasDraftContent = computed(() => {
  const generatedTitle = lastGeneratedTitle.value

  return Boolean(
    selectedProjectIds.value.length ||
      attachments.value.length ||
      form.title.trim() && form.title !== generatedTitle ||
      form.summary.trim() ||
      stripHtml(form.body).trim(),
  )
})

watch(
  [mode, selectedGroups],
  () => {
    updateGeneratedTitle()
    ensureReceiverDefaults()
  },
  { immediate: true },
)

watch(scopeGroupMode, () => {
  updateGeneratedTitle()
})

watch(
  () => route.query,
  () => {
    applyRoutePrefill()
  },
  { immediate: true },
)

function groupProjectsByFaculty(projects: AnnouncementProject[]): FacultyProjectGroup[] {
  const groupMap = new Map<string, AnnouncementProject[]>()

  projects.forEach((project) => {
    const groupProjects = groupMap.get(project.faculty) ?? []
    groupProjects.push(project)
    groupMap.set(project.faculty, groupProjects)
  })

  return Array.from(groupMap.entries()).map(([faculty, projects]) => ({ faculty, projects }))
}

function groupProjectsByProjectType(projects: AnnouncementProject[]): ProjectTypeProjectGroup[] {
  const groupMap = new Map<AnnouncementProjectType, AnnouncementProject[]>()

  projects.forEach((project) => {
    const projectType = getProjectType(project)
    const groupProjects = groupMap.get(projectType) ?? []
    groupProjects.push(project)
    groupMap.set(projectType, groupProjects)
  })

  return (['基础培育', '自由探索'] as AnnouncementProjectType[])
    .map((projectType) => ({ projectType, projects: groupMap.get(projectType) ?? [] }))
    .filter((group) => group.projects.length)
}

function inferProjectType(project: AnnouncementProject, index: number): AnnouncementProjectType {
  const sourceText = `${project.projectName} ${project.projectCode} ${project.subDirection}`

  if (sourceText.includes('自由探索') || /FREE|XTS/i.test(sourceText)) {
    return '自由探索'
  }

  if (sourceText.includes('基础培育') || /BASIC|JC/i.test(sourceText)) {
    return '基础培育'
  }

  return index % 3 === 1 ? '自由探索' : '基础培育'
}

function getProjectType(project: AnnouncementProject): AnnouncementProjectType {
  return project.projectType ?? '基础培育'
}

function collectReceivers(projects: AnnouncementProject[], receiverTypes: ReceiverType[]) {
  const peopleMap = new Map<string, AnnouncementPerson>()

  projects.forEach((project) => {
    if (receiverTypes.includes('facultyLeader')) {
      peopleMap.set(project.facultyLeader.id, project.facultyLeader)
    }

    if (receiverTypes.includes('subDirectionLeader')) {
      peopleMap.set(project.subDirectionLeader.id, project.subDirectionLeader)
    }

    project.members.forEach((member) => {
      if (receiverTypes.includes('projectLeader') && member.role === 'projectLeader') {
        peopleMap.set(member.id, member)
      }

      if (receiverTypes.includes('projectMember') && member.role === 'projectMember') {
        peopleMap.set(member.id, member)
      }
    })
  })

  return Array.from(peopleMap.values())
}

function createDefaultBody() {
  return `
    <p>经专家评审和综合评议，现将本次科研项目评审结果予以公布。</p>
    <p>请项目负责人及成员登录科研管理OA系统，在“项目管理-评审结果”中查看详细评审意见及后续安排。</p>
    <p>如对评审结果有疑问，请在公告期内联系科研管理办公室。</p>
  `
}

function updateGeneratedTitle() {
  const nextTitle =
    mode.value === 'unified'
      ? createUnifiedTitle()
      : createIndependentTitle()

  if (!form.title || form.title === lastGeneratedTitle.value) {
    form.title = nextTitle
  }

  lastGeneratedTitle.value = nextTitle
}

function createUnifiedTitle() {
  return isBaseDataAnnouncement.value && scopeGroupMode.value === 'projectType'
    ? '关于2026年度科研项目评审结果的公告（按项目类型发布）'
    : '关于2026年度科研项目评审结果的公告（统一发布）'
}

function createIndependentTitle() {
  if (isBaseDataAnnouncement.value && scopeGroupMode.value === 'projectType') {
    const projectTypes = selectedProjectTypeGroups.value.map((group) => group.projectType)

    if (!projectTypes.length) {
      return '关于已选项目评审结果的公告'
    }

    const typeText =
      projectTypes.length <= 2 ? projectTypes.join('与') : `${projectTypes.slice(0, 2).join('与')}等${projectTypes.length}类`

    return `关于${typeText}项目评审结果的公告`
  }

  const faculties = selectedGroups.value.map((group) => group.faculty)

  if (!faculties.length) {
    return '关于已选项目评审结果的公告'
  }

  const facultyText = faculties.length <= 2 ? faculties.join('与') : `${faculties.slice(0, 2).join('与')}等${faculties.length}个学部`
  return `关于${facultyText}项目评审结果的公告`
}

function ensureReceiverDefaults() {
  if (!form.receiverTypes.length) {
    form.receiverTypes =
      mode.value === 'unified'
        ? ['facultyLeader', 'subDirectionLeader', 'projectLeader', 'projectMember']
        : ['facultyLeader', 'projectLeader', 'projectMember']
  }
}

function applyRoutePrefill() {
  const queryMode = getQueryText('mode')
  const source = getQueryText('source')

  if (queryMode !== 'independent' || source !== 'review-results') {
    return
  }

  mode.value = 'independent'

  const faculty = getQueryText('faculty')
  const projectCodes = getQueryText('projectCodes')
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean)
  const projectCodeSet = new Set(projectCodes)

  selectedProjectIds.value = completedProjects.value
    .filter((project) =>
      projectCodeSet.size ? projectCodeSet.has(project.projectCode) : project.faculty === faculty,
    )
    .map((project) => project.id)

  form.type = '项目评审结果公告'
  form.templateId = noticeTemplates.value[0]?.id ?? form.templateId
  form.receiverTypes = ['facultyLeader', 'subDirectionLeader', 'projectLeader', 'projectMember']

  if (!form.summary.trim() || form.summary === '本公告公示科研项目评审结果，请相关项目负责人及成员登录系统查看详细信息。') {
    form.summary = faculty
      ? `本公告公布${faculty}项目评审结果，请相关负责人及时查看。`
      : '本公告公布已选项目评审结果，请相关负责人及时查看。'
  }

  if (!stripHtml(form.body).trim() || form.body === createDefaultBody()) {
    form.body = `
      <p>现将${faculty || '已选学部'}项目评审结果予以公告。</p>
      <p>请相关项目负责人及成员登录科研管理OA系统查看详细评审意见、最终评级及后续安排。</p>
      <p>如对评审结果有疑问，请在公告期内联系科研管理办公室。</p>
    `
  }

  updateGeneratedTitle()
}

function getQueryText(key: string) {
  const value = route.query[key]

  return typeof value === 'string' ? value : ''
}

function toggleProject(projectId: string, checked: boolean) {
  const selectedSet = new Set(selectedProjectIds.value)

  if (checked) {
    selectedSet.add(projectId)
  } else {
    selectedSet.delete(projectId)
  }

  selectedProjectIds.value = Array.from(selectedSet)
}

function toggleFaculty(faculty: string, checked: boolean) {
  const selectedSet = new Set(selectedProjectIds.value)
  const group = groupedProjects.value.find((item) => item.faculty === faculty)

  group?.projects.forEach((project) => {
    if (checked) {
      selectedSet.add(project.id)
    } else {
      selectedSet.delete(project.id)
    }
  })

  selectedProjectIds.value = Array.from(selectedSet)
}

function toggleProjectType(projectType: AnnouncementProjectType, checked: boolean) {
  const selectedSet = new Set(selectedProjectIds.value)
  const group = projectTypeGroups.value.find((item) => item.projectType === projectType)

  group?.projects.forEach((project) => {
    if (checked) {
      selectedSet.add(project.id)
    } else {
      selectedSet.delete(project.id)
    }
  })

  selectedProjectIds.value = Array.from(selectedSet)
}

function removeProject(projectId: string) {
  selectedProjectIds.value = selectedProjectIds.value.filter((id) => id !== projectId)
}

function clearFaculty(faculty: string) {
  const facultyProjectIds = new Set(
    completedProjects.value.filter((project) => project.faculty === faculty).map((project) => project.id),
  )
  selectedProjectIds.value = selectedProjectIds.value.filter((id) => !facultyProjectIds.has(id))
}

function clearProjectType(projectType: AnnouncementProjectType) {
  const projectIds = new Set(
    completedProjects.value.filter((project) => getProjectType(project) === projectType).map((project) => project.id),
  )

  selectedProjectIds.value = selectedProjectIds.value.filter((id) => !projectIds.has(id))
}

function clearAllSelectedProjects() {
  selectedProjectIds.value = []
}

function viewProject(project: AnnouncementProject) {
  ElMessage.info(`${project.projectCode} 项目详情入口已预留`)
}

function showTemplatePreview(template: NoticeTemplate) {
  previewTemplate.value = template
  isTemplatePreviewVisible.value = true
}

async function cancelPublish() {
  if (hasDraftContent.value) {
    try {
      await ElMessageBox.confirm('当前内容取消后不会保存，是否继续？', '取消公告发布', {
        type: 'warning',
        confirmButtonText: '继续取消',
        cancelButtonText: '返回编辑',
        autofocus: false,
      })
    } catch {
      return
    }
  }

  resetDraft()
}

function resetDraft() {
  selectedProjectIds.value = []
  attachments.value = []
  form.title = ''
  form.summary = ''
  form.body = createDefaultBody()
  form.pinned = true
  form.readRequired = true
  updateGeneratedTitle()
  ElMessage.info('公告草稿已取消')
}

function previewAnnouncement() {
  const error = validateForm(false)

  if (error) {
    ElMessage.warning(error)
    return
  }

  isPreviewVisible.value = true
}

async function publishAnnouncement() {
  const error = validateForm(true)

  if (error) {
    ElMessage.warning(error)
    return
  }

  const message =
    mode.value === 'unified'
      ? isBaseDataAnnouncement.value
        ? `本次公告将发送至 ${selectedFacultyCount.value} 个学部、${selectedProjectTypeCount.value} 类项目、${selectedProjects.value.length} 个项目、${receiverCount.value} 名相关人员。`
        : `本次公告将发送至 ${selectedFacultyCount.value} 个学部、${selectedProjects.value.length} 个项目、${receiverCount.value} 名相关人员。`
      : scopeGroupMode.value === 'projectType'
        ? `本次已选择 ${selectedProjectTypeCount.value} 类项目、${selectedProjects.value.length} 个项目、${receiverCount.value} 名相关人员。`
        : `本次已选择 ${selectedFacultyCount.value} 个学部、${selectedProjects.value.length} 个项目、${receiverCount.value} 名相关人员。`

  try {
    await ElMessageBox.confirm(message, '确认发布公告', {
      type: 'info',
      confirmButtonText: '确认发布',
      cancelButtonText: '取消',
      autofocus: false,
    })
  } catch {
    return
  }

  saveAnnouncementRecord()
  ElMessage.success('公告发布成功')
}

function validateForm(requireProjectSelection: boolean) {
  if (mode.value === 'unified' && !completedProjects.value.length) {
    return '当前没有可统一发布的项目'
  }

  if (mode.value === 'independent' && requireProjectSelection && !selectedProjects.value.length) {
    return '请至少选择一个项目'
  }

  if (!form.title.trim()) {
    return '请填写公告标题'
  }

  if (!form.templateId) {
    return '请选择通知模板'
  }

  if (!stripHtml(form.body).trim()) {
    return '请填写公告正文'
  }

  if (!form.receiverTypes.length || receiverCount.value === 0) {
    return '请选择有效接收对象'
  }

  return ''
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
}

function saveAnnouncementRecord() {
  const stored = window.localStorage.getItem(ANNOUNCEMENT_RECORDS_KEY)
  const records = stored ? (JSON.parse(stored) as unknown[]) : []
  const now = new Date()

  records.unshift({
    id: `ANN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now()}`,
    title: form.title,
    mode: mode.value,
    scopeGroupMode: scopeGroupMode.value,
    faculties: selectedGroups.value.map((group) => group.faculty),
    projectTypes: selectedProjectTypeGroups.value.map((group) => group.projectType),
    projects: selectedProjects.value.map((project) => project.projectCode),
    receivers: receiverPeople.value.map((person) => person.id),
    publishedAt: now.toISOString(),
    operator: currentUser?.displayName ?? currentUser?.username ?? '当前用户',
  })

  window.localStorage.setItem(ANNOUNCEMENT_RECORDS_KEY, JSON.stringify(records.slice(0, 50)))
}
</script>

<template>
  <section class="announcement-page" aria-label="公告发布">
    <header class="page-heading">
      <div>
      
      </div>
    </header>

    <div class="mode-switch">
      <button
        type="button"
        :class="{ active: mode === 'unified' }"
        @click="mode = 'unified'"
      >
        <el-icon><Promotion /></el-icon>
        统一发布
      </button>
      <button
        type="button"
        :class="{ active: mode === 'independent' }"
        @click="mode = 'independent'"
      >
        <el-icon><User /></el-icon>
        独立发布
      </button>
    </div>

    <Transition name="content-fade" mode="out-in">
      <section v-if="mode === 'unified'" key="unified" class="unified-layout">
        <UnifiedProjectScope
          :groups="groupedProjects"
          :type-groups="projectTypeGroups"
          :scope-mode="scopeGroupMode"
          :enable-project-type-grouping="isBaseDataAnnouncement"
          @update-scope-mode="(nextMode) => (scopeGroupMode = nextMode)"
        />

        <div class="right-column">
          <AnnouncementForm
            v-model:form="form"
            v-model:attachments="attachments"
            :templates="noticeTemplates"
            :receiver-options="receiverOptions"
            @preview-template="showTemplatePreview"
          />
          <PublishSummary
            mode="unified"
            :scope-mode="scopeGroupMode"
            :faculty-count="selectedFacultyCount"
            :project-type-count="selectedProjectTypeCount"
            :project-count="selectedProjects.length"
            :receiver-count="receiverCount"
          />
        </div>
      </section>

      <section v-else key="independent" class="independent-layout">
        <div class="left-column">
          <IndependentProjectSelector
            :groups="groupedProjects"
            :type-groups="projectTypeGroups"
            :selected-ids="selectedProjectIds"
            :scope-mode="scopeGroupMode"
            :enable-project-type-grouping="isBaseDataAnnouncement"
            @toggle-project="toggleProject"
            @toggle-faculty="toggleFaculty"
            @toggle-project-type="toggleProjectType"
            @update-scope-mode="(nextMode) => (scopeGroupMode = nextMode)"
            @view-project="viewProject"
          />
          <SelectedProjectsPanel
            :selected-projects="selectedProjects"
            :group-mode="scopeGroupMode"
            @remove-project="removeProject"
            @clear-faculty="clearFaculty"
            @clear-project-type="clearProjectType"
            @clear-all="clearAllSelectedProjects"
            @view-project="viewProject"
          />
        </div>

        <div class="right-column">
          <AnnouncementForm
            v-model:form="form"
            v-model:attachments="attachments"
            :templates="noticeTemplates"
            :receiver-options="receiverOptions"
            @preview-template="showTemplatePreview"
          />
          <PublishSummary
            mode="independent"
            :scope-mode="scopeGroupMode"
            :faculty-count="selectedFacultyCount"
            :project-type-count="selectedProjectTypeCount"
            :project-count="selectedProjects.length"
            :receiver-count="receiverCount"
          />
        </div>
      </section>
    </Transition>

    <footer class="action-bar">
      <el-button @click="cancelPublish">取消</el-button>
      <el-button :icon="View" plain type="primary" @click="previewAnnouncement">预览公告</el-button>
      <el-button type="primary" @click="publishAnnouncement">
        {{ mode === 'unified' ? '统一发布公告' : '发布公告' }}
      </el-button>
    </footer>

    <AnnouncementPreviewDialog
      v-model="isPreviewVisible"
      :form="form"
      :mode="mode"
      :publisher-unit="dataset.publisherUnit"
      :projects="selectedProjects"
      :receiver-labels="receiverLabels"
      :faculty-count="selectedFacultyCount"
      :project-count="selectedProjects.length"
      :receiver-count="receiverCount"
      :attachments="attachments"
    />

    <el-dialog v-model="isTemplatePreviewVisible" title="通知模板预览" width="620px" append-to-body>
      <article v-if="previewTemplate" class="template-preview">
        <h2>{{ previewTemplate.name }}</h2>
        <p>{{ previewTemplate.description }}</p>
        <div class="template-meta">
          <span>模板编号：{{ previewTemplate.templateNo }}</span>
          <span>模板状态：{{ previewTemplate.status }}</span>
        </div>
        <section>
          <h3>正文字段</h3>
          <el-tag v-for="field in previewTemplate.fields ?? []" :key="field" effect="light">
            {{ field }}
          </el-tag>
        </section>
        <section>
          <h3>流程节点</h3>
          <el-tag v-for="node in previewTemplate.workflowNodes ?? []" :key="node" type="info" effect="light">
            {{ node }}
          </el-tag>
        </section>
      </article>
    </el-dialog>
  </section>
</template>

<style scoped>
.announcement-page {
  display: grid;
  gap: 14px;
  padding-bottom: 76px;
  color: #1d1d1f;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.page-kicker,
.page-heading h1,
.page-heading p {
  margin: 0;
}

.page-kicker {
  color: #0a84ff;
  font-size: 13px;
  font-weight: 760;
}

.page-heading h1 {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 840;
  letter-spacing: 0;
}

.page-heading p:not(.page-kicker) {
  margin-top: 8px;
  color: #6e6e73;
  font-size: 14px;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-width: 760px;
}

.mode-switch button {
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 10px;
  color: #424245;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.mode-switch button:hover {
  color: #0a84ff;
  transform: translateY(-1px);
}

.mode-switch button.active {
  border-color: transparent;
  color: #fff;
  background: #0a84ff;
  box-shadow: 0 14px 30px rgba(10, 132, 255, 0.22);
}

.unified-layout {
  display: grid;
  grid-template-columns: minmax(480px, 0.84fr) minmax(620px, 1.16fr);
  gap: 14px;
  align-items: start;
}

.independent-layout {
  display: grid;
  grid-template-columns: minmax(520px, 0.92fr) minmax(600px, 1.08fr);
  gap: 14px;
  align-items: start;
}

.left-column,
.right-column {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 12;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin: 0 -4px;
  border: 1px solid rgba(29, 29, 31, 0.06);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 -12px 34px rgba(26, 39, 68, 0.08);
  backdrop-filter: blur(18px);
}

.action-bar :deep(.el-button) {
  min-width: 128px;
  height: 42px;
  border-radius: 10px;
  font-weight: 780;
}

.template-preview h2,
.template-preview h3,
.template-preview p {
  margin: 0;
}

.template-preview h2 {
  font-size: 20px;
  font-weight: 820;
}

.template-preview p {
  margin-top: 10px;
  color: #424245;
  line-height: 1.7;
}

.template-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 12px;
  color: #86868b;
  font-size: 13px;
}

.template-preview section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.template-preview section h3 {
  width: 100%;
  font-size: 15px;
}

.content-fade-enter-active,
.content-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.content-fade-enter-from,
.content-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 1320px) {
  .unified-layout,
  .independent-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .mode-switch {
    grid-template-columns: 1fr;
  }

  .action-bar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
