<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Delete, Document, Plus, Search, View } from '@element-plus/icons-vue'
import {
  getProjectMemberAllPapers,
  getProjectMemberPaperGroups,
  type ProjectMemberPaperGroup,
} from '../../dataset/projectMemberPaperOutcomesMock'
import type { PaperOutcome } from '../../dataset/paperOutcomesMock'
import type { LoggedInUser } from '../../types/auth'

const props = defineProps<{
  currentUser: LoggedInUser | null
}>()

type PaperViewTab = 'project' | 'all'
type PaperDeleteDialogMode = 'direct' | 'review'

const route = useRoute()
const router = useRouter()
const filters = reactive({
  keyword: '',
  paperStatus: 'all',
  projectStatus: 'all',
})
const appliedFilters = reactive({ ...filters })
const activePaperView = shallowRef<PaperViewTab>('project')
const projectPage = shallowRef(1)
const projectPageSize = shallowRef(8)
const allPaperPage = shallowRef(1)
const allPaperPageSize = shallowRef(10)
const selectedPaper = shallowRef<PaperOutcome | null>(null)
const paperDetailOpen = shallowRef(false)
const selectedVerifyPaper = shallowRef<PaperOutcome | null>(null)
const verifyDialogOpen = shallowRef(false)
const verifiedPaperKeys = shallowRef<string[]>([])
const selectedDeletePaper = shallowRef<PaperOutcome | null>(null)
const deleteDialogOpen = shallowRef(false)
const deleteDialogMode = shallowRef<PaperDeleteDialogMode>('direct')
const deletedPaperKeys = shallowRef<string[]>([])
const deleteReviewPaperKeys = shallowRef<string[]>([])

const PAPER_DELETE_STORAGE_PREFIX = 'zgca_ky_oa_project_student_deleted_papers'
const PAPER_DELETE_REVIEW_STORAGE_PREFIX = 'zgca_ky_oa_project_student_delete_reviews'

const projectGroups = computed(() => getProjectMemberPaperGroups(props.currentUser))
const allPersonalPapers = computed(() => getProjectMemberAllPapers(props.currentUser))
const isProjectStudentView = computed(() => route.meta.roleKey === 'projectStudent' || route.path.includes('/project-student/'))
const visibleAllPersonalPapers = computed(() =>
  allPersonalPapers.value.filter((paper) => !deletedPaperKeys.value.includes(getPaperKey(paper))),
)
const deleteDialogTitle = computed(() =>
  deleteDialogMode.value === 'direct' ? '确认删除论文' : '删除审核提示',
)

const paperStatusOptions = computed(() =>
  Array.from(new Set(visibleAllPersonalPapers.value.map((paper) => paper.paperStatus).filter(Boolean))),
)

const projectStatusOptions = computed(() =>
  Array.from(new Set(projectGroups.value.map((group) => group.projectStatus).filter(Boolean))),
)

const filteredGroups = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return projectGroups.value.filter((group) => {
    const matchesKeyword =
      !keyword ||
      [
        group.projectCode,
        group.projectName,
        group.departmentName,
        group.leaderName,
        ...group.papers.flatMap((paper) => [
          paper.title,
          paper.venueName,
          paper.venueShortName,
          paper.authors,
        ]),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))

    const matchesProjectStatus =
      appliedFilters.projectStatus === 'all' || group.projectStatus === appliedFilters.projectStatus
    const matchesPaperStatus =
      appliedFilters.paperStatus === 'all' ||
      group.papers.some((paper) => paper.paperStatus === appliedFilters.paperStatus)

    return matchesKeyword && matchesProjectStatus && matchesPaperStatus
  })
})

const pagedGroups = computed(() => {
  const start = (projectPage.value - 1) * projectPageSize.value

  return filteredGroups.value.slice(start, start + projectPageSize.value)
})

const expandedProjectKeys = computed(() => pagedGroups.value.map((group) => group.projectId))

const filteredAllPapers = computed(() => {
  const keyword = appliedFilters.keyword.trim().toLowerCase()

  return visibleAllPersonalPapers.value.filter((paper) => {
    const matchesKeyword =
      !keyword ||
      [
        paper.title,
        paper.authors,
        paper.collegeAuthors,
        paper.venueName,
        paper.venueShortName,
        paper.projectId,
        paper.projectName,
        paper.projectOwner,
        paper.resultType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))

    const matchesPaperStatus =
      appliedFilters.paperStatus === 'all' || paper.paperStatus === appliedFilters.paperStatus

    return matchesKeyword && matchesPaperStatus
  })
})

const pagedAllPapers = computed(() => {
  const start = (allPaperPage.value - 1) * allPaperPageSize.value

  return filteredAllPapers.value.slice(start, start + allPaperPageSize.value)
})

watch(
  () => filteredGroups.value.length,
  () => {
    projectPage.value = 1
  },
)

watch(
  () => filteredAllPapers.value.length,
  () => {
    allPaperPage.value = 1
  },
)

watch(
  () => props.currentUser?.id,
  () => {
    loadPrototypePaperDeleteState()
  },
  { immediate: true },
)

function queryPapers() {
  Object.assign(appliedFilters, filters)
  projectPage.value = 1
  allPaperPage.value = 1
}

function resetPapers() {
  filters.keyword = ''
  filters.paperStatus = 'all'
  filters.projectStatus = 'all'
  Object.assign(appliedFilters, filters)
  projectPage.value = 1
  allPaperPage.value = 1
}

function getVisiblePapers(group: ProjectMemberPaperGroup) {
  if (appliedFilters.paperStatus === 'all') {
    return group.papers
  }

  return group.papers.filter((paper) => paper.paperStatus === appliedFilters.paperStatus)
}

function statusTagType(status: string) {
  if (['已录用', '已发表', '已核验', '已立项', '在研'].includes(status)) {
    return 'success'
  }

  if (['投稿中', '待核验', '申报评审中'].includes(status)) {
    return 'warning'
  }

  return 'info'
}

function displayValue(value?: string | number) {
  return value === undefined || value === null || value === '' ? '—' : String(value)
}

function displayProjectName(paper: PaperOutcome) {
  return paper.projectName || '-'
}

function getPaperKey(paper: PaperOutcome) {
  return paper.recordKey || `${paper.id}-${paper.projectId}`
}

function canUsePrototypeStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function getStorageUserSuffix() {
  return props.currentUser?.id || 'anonymous'
}

function getDeletedPaperStorageKey() {
  return `${PAPER_DELETE_STORAGE_PREFIX}:${getStorageUserSuffix()}`
}

function getDeleteReviewStorageKey() {
  return `${PAPER_DELETE_REVIEW_STORAGE_PREFIX}:${getStorageUserSuffix()}`
}

function readPaperKeyList(storageKey: string) {
  if (!canUsePrototypeStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function writePaperKeyList(storageKey: string, paperKeys: string[]) {
  if (!canUsePrototypeStorage()) {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(paperKeys))))
}

function loadPrototypePaperDeleteState() {
  deletedPaperKeys.value = readPaperKeyList(getDeletedPaperStorageKey())
  deleteReviewPaperKeys.value = readPaperKeyList(getDeleteReviewStorageKey())
}

function isPaperVerified(paper: PaperOutcome) {
  return paper.verificationStatus === '已核验' || verifiedPaperKeys.value.includes(getPaperKey(paper))
}

function getVerificationStatus(paper: PaperOutcome) {
  return isPaperVerified(paper) ? '已核验' : displayValue(paper.verificationStatus)
}

function hasProjectBinding(paper: PaperOutcome) {
  return Boolean(String(paper.projectId || '').trim() || String(paper.projectName || '').trim())
}

function isPaperDeleteReviewPending(paper: PaperOutcome) {
  return deleteReviewPaperKeys.value.includes(getPaperKey(paper))
}

function openDeletePaperDialog(paper: PaperOutcome) {
  selectedDeletePaper.value = paper
  deleteDialogMode.value = hasProjectBinding(paper) ? 'review' : 'direct'
  deleteDialogOpen.value = true
}

function confirmDeletePaper() {
  if (!selectedDeletePaper.value) {
    return
  }

  const paperKey = getPaperKey(selectedDeletePaper.value)

  if (deleteDialogMode.value === 'direct') {
    deletedPaperKeys.value = Array.from(new Set([...deletedPaperKeys.value, paperKey]))
    writePaperKeyList(getDeletedPaperStorageKey(), deletedPaperKeys.value)
    deleteDialogOpen.value = false
    selectedDeletePaper.value = null
    ElMessage.success('论文记录已删除')
    return
  }

  deleteReviewPaperKeys.value = Array.from(new Set([...deleteReviewPaperKeys.value, paperKey]))
  writePaperKeyList(getDeleteReviewStorageKey(), deleteReviewPaperKeys.value)
  deleteDialogOpen.value = false
  selectedDeletePaper.value = null
  ElMessage.success('删除申请已提交，等待项目负责人/学生负责人审核')
}

function openPaperDetail(paper: PaperOutcome) {
  selectedPaper.value = paper
  paperDetailOpen.value = true
}

function openVerifyDialog(paper: PaperOutcome) {
  selectedVerifyPaper.value = paper
  verifyDialogOpen.value = true
}

function confirmVerifyPaper() {
  if (!selectedVerifyPaper.value) {
    return
  }

  const paperKey = getPaperKey(selectedVerifyPaper.value)

  if (!verifiedPaperKeys.value.includes(paperKey)) {
    verifiedPaperKeys.value = [...verifiedPaperKeys.value, paperKey]
  }

  verifyDialogOpen.value = false
  ElMessage.success('论文核验已确认')
}

function openPaperUrl(paper: PaperOutcome) {
  const url = paper.paperUrl || paper.preprintUrl

  if (!url) {
    ElMessage.info('当前论文暂无可访问链接')
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

function openCreatePaperPage() {
  router.push(`${route.path.replace(/\/$/, '')}/new`)
}
</script>

<template>
  <section class="member-paper-page" aria-label="项目负责人我的论文">
    <section class="outcomes-panel filter-panel">
      <div class="paper-filter-grid">
        <el-input
          v-model="filters.keyword"
          clearable
          :prefix-icon="Search"
          placeholder="搜索项目名称、项目编号、论文题名、作者或期刊会议"
          @keyup.enter="queryPapers"
        />
        <el-select v-model="filters.projectStatus" placeholder="项目状态">
          <el-option label="全部项目状态" value="all" />
          <el-option v-for="item in projectStatusOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="filters.paperStatus" placeholder="论文状态">
          <el-option label="全部论文状态" value="all" />
          <el-option v-for="item in paperStatusOptions" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button type="primary" @click="queryPapers">查询</el-button>
        <el-button @click="resetPapers">重置</el-button>
      </div>
    </section>

    <section class="outcomes-panel table-panel" aria-label="论文列表">
      <div class="outcomes-panel-toolbar compact">
        <div>
          <h2>论文列表</h2>
        </div>
        <el-button type="primary" :icon="Plus" @click="openCreatePaperPage">新增论文</el-button>
      </div>

      <el-tabs v-model="activePaperView" class="paper-view-tabs">
        <el-tab-pane label="项目论文" name="project">
          <el-table
            class="outcomes-table project-paper-table"
            :data="pagedGroups"
            row-key="projectId"
            :expand-row-keys="expandedProjectKeys"
            stripe
          >
            <el-table-column type="expand" width="48">
              <template #default="{ row }">
                <section class="project-paper-expand">
                  <el-table
                    class="outcomes-table inner-paper-table"
                    :data="getVisiblePapers(row)"
                    row-key="recordKey"
                    empty-text="该项目暂无论文成果"
                  >
                    <el-table-column label="论文题名" min-width="280" show-overflow-tooltip>
                      <template #default="{ row: paper }">
                        <div class="paper-title-cell">
                          <strong>{{ paper.title }}</strong>
                          <span>{{ paper.authors }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="类型" width="100">
                      <template #default="{ row: paper }">{{ displayValue(paper.resultType) }}</template>
                    </el-table-column>
                    <el-table-column label="期刊/会议" min-width="180" show-overflow-tooltip>
                      <template #default="{ row: paper }">
                        {{ displayValue(paper.venueShortName || paper.venueName) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="年度" width="88">
                      <template #default="{ row: paper }">{{ displayValue(paper.year) }}</template>
                    </el-table-column>
                    <el-table-column label="状态" width="104" align="center">
                      <template #default="{ row: paper }">
                        <el-tag size="small" effect="light" :type="statusTagType(paper.paperStatus)">
                          {{ displayValue(paper.paperStatus) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="核验状态" width="112" align="center">
                      <template #default="{ row: paper }">
                        <el-tag size="small" effect="light" :type="statusTagType(getVerificationStatus(paper))">
                          {{ getVerificationStatus(paper) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220" fixed="right">
                      <template #default="{ row: paper }">
                        <div class="paper-action-bar">
                          <el-button type="primary" link @click="openPaperDetail(paper)">详情</el-button>
                          <el-button
                            v-if="!isPaperVerified(paper)"
                            type="success"
                            link
                            @click="openVerifyDialog(paper)"
                          >
                            确认核验
                          </el-button>
                          <el-button type="primary" link @click="openPaperUrl(paper)">链接</el-button>
                        </div>
                      </template>
                    </el-table-column>
                  </el-table>
                </section>
              </template>
            </el-table-column>

            <el-table-column label="项目编号" width="132">
              <template #default="{ row }">{{ row.projectCode }}</template>
            </el-table-column>
            <el-table-column label="项目名称" min-width="280" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="project-cell">
                  <strong>{{ row.projectName }}</strong>
                  <span>{{ row.departmentName }} / {{ row.leaderName }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="项目状态" width="118" align="center">
              <template #default="{ row }">
                <el-tag effect="light" :type="statusTagType(row.projectStatus)" round>
                  {{ row.projectStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="论文数量" width="110" align="center">
              <template #default="{ row }">
                <strong class="paper-count">{{ getVisiblePapers(row).length }}</strong>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="暂无符合条件的项目论文" />
            </template>
          </el-table>

          <section class="pagination-panel" aria-label="项目论文分页">
            <span>第 {{ projectPage }} 页，每页 {{ projectPageSize }} 个项目，共 {{ filteredGroups.length }} 个项目</span>
            <el-pagination
              v-model:current-page="projectPage"
              v-model:page-size="projectPageSize"
              background
              layout="sizes, prev, pager, next"
              :page-sizes="[6, 8, 12, 20]"
              :total="filteredGroups.length"
            />
          </section>
        </el-tab-pane>

        <el-tab-pane label="所有论文" name="all">
          <el-table
            class="outcomes-table all-paper-table"
            :data="pagedAllPapers"
            :row-key="getPaperKey"
            stripe
          >
            <el-table-column label="序号" width="70" align="center">
              <template #default="{ $index }">
                {{ (allPaperPage - 1) * allPaperPageSize + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="论文题名" min-width="300" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="paper-title-cell">
                  <strong>{{ row.title }}</strong>
                  <span>{{ row.authors }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关联项目" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">{{ displayProjectName(row) }}</template>
            </el-table-column>
            <el-table-column label="类型" width="104">
              <template #default="{ row }">{{ displayValue(row.resultType) }}</template>
            </el-table-column>
            <el-table-column label="期刊/会议" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">{{ displayValue(row.venueShortName || row.venueName) }}</template>
            </el-table-column>
            <el-table-column label="年度" width="86" align="center">
              <template #default="{ row }">{{ displayValue(row.year) }}</template>
            </el-table-column>
            <el-table-column label="核验状态" width="112" align="center">
              <template #default="{ row }">
                <el-tag size="small" effect="light" :type="statusTagType(getVerificationStatus(row))">
                  {{ getVerificationStatus(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="290" fixed="right">
              <template #default="{ row }">
                <div class="paper-action-bar all-paper-action-bar">
                  <span class="all-paper-action-main">
                    <el-button type="primary" link @click="openPaperDetail(row)">详情</el-button>
                    <el-button
                      v-if="!isPaperVerified(row)"
                      type="success"
                      link
                      @click="openVerifyDialog(row)"
                    >
                      确认核验
                    </el-button>
                    <el-button type="primary" link @click="openPaperUrl(row)">链接</el-button>
                  </span>
                  <el-button
                    v-if="isProjectStudentView"
                    class="all-paper-delete-action"
                    :type="isPaperDeleteReviewPending(row) ? 'info' : 'danger'"
                    link
                    :icon="Delete"
                    :disabled="isPaperDeleteReviewPending(row)"
                    @click="openDeletePaperDialog(row)"
                  >
                    {{ isPaperDeleteReviewPending(row) ? '审核中' : '删除' }}
                  </el-button>
                </div>
              </template>
            </el-table-column>

            <template #empty>
              <el-empty description="暂无符合条件的论文" />
            </template>
          </el-table>

          <section class="pagination-panel" aria-label="所有论文分页">
            <span>第 {{ allPaperPage }} 页，每页 {{ allPaperPageSize }} 篇论文，共 {{ filteredAllPapers.length }} 篇论文</span>
            <el-pagination
              v-model:current-page="allPaperPage"
              v-model:page-size="allPaperPageSize"
              background
              layout="sizes, prev, pager, next"
              :page-sizes="[10, 20, 50]"
              :total="filteredAllPapers.length"
            />
          </section>
        </el-tab-pane>
      </el-tabs>
    </section>

    <el-dialog v-model="paperDetailOpen" class="paper-detail-dialog" title="论文详情" width="860px" destroy-on-close>
      <template v-if="selectedPaper">
        <div class="dialog-paper-heading">
          <span><el-icon><Document /></el-icon>{{ displayValue(selectedPaper.resultType) }}</span>
          <h3>{{ selectedPaper.title }}</h3>
          <p>{{ displayValue(selectedPaper.venueName) }} / {{ displayValue(selectedPaper.venueShortName) }}</p>
        </div>

        <el-descriptions class="paper-detail-descriptions" :column="2" border size="small">
          <el-descriptions-item label="论文ID">{{ displayValue(selectedPaper.id) }}</el-descriptions-item>
          <el-descriptions-item label="发表年度">{{ displayValue(selectedPaper.year) }}</el-descriptions-item>
          <el-descriptions-item label="论文状态">{{ displayValue(selectedPaper.paperStatus) }}</el-descriptions-item>
          <el-descriptions-item label="核验状态">{{ getVerificationStatus(selectedPaper) }}</el-descriptions-item>
          <el-descriptions-item label="关联项目" :span="2">
            {{ displayProjectName(selectedPaper) }}
          </el-descriptions-item>
          <el-descriptions-item label="作者" :span="2">{{ displayValue(selectedPaper.authors) }}</el-descriptions-item>
          <el-descriptions-item label="院内作者" :span="2">
            {{ displayValue(selectedPaper.collegeAuthors) }}
          </el-descriptions-item>
          <el-descriptions-item label="DOI" :span="2">{{ displayValue(selectedPaper.doi) }}</el-descriptions-item>
          <el-descriptions-item label="论文链接" :span="2">{{ displayValue(selectedPaper.paperUrl) }}</el-descriptions-item>
          <el-descriptions-item label="预印本链接" :span="2">
            {{ displayValue(selectedPaper.preprintUrl) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ displayValue(selectedPaper.remark) }}</el-descriptions-item>
        </el-descriptions>
      </template>

      <template #footer>
        <el-button round @click="paperDetailOpen = false">关闭</el-button>
        <el-button v-if="selectedPaper" type="primary" round :icon="View" @click="openPaperUrl(selectedPaper)">
          打开链接
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyDialogOpen" class="paper-verify-dialog" title="确认核验" width="480px" append-to-body>
      <template v-if="selectedVerifyPaper">
        <section class="verify-dialog-body">
          <span class="verify-icon">✓</span>
          <div>
            <h3>确认论文核验无误</h3>
            <p>{{ selectedVerifyPaper.title }}</p>
          </div>
        </section>
      </template>

      <template #footer>
        <el-button @click="verifyDialogOpen = false">取消</el-button>
        <el-button type="primary" @click="confirmVerifyPaper">确认核验</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="deleteDialogOpen"
      class="paper-delete-dialog"
      :title="deleteDialogTitle"
      width="520px"
      append-to-body
    >
      <template v-if="selectedDeletePaper">
        <section class="delete-dialog-body">
          <span :class="['delete-dialog-icon', deleteDialogMode]">
            {{ deleteDialogMode === 'direct' ? '删' : '审' }}
          </span>
          <div>
            <h3>{{ deleteDialogMode === 'direct' ? '确认删除该论文？' : '该论文删除需要审核' }}</h3>
            <p class="delete-paper-title">{{ selectedDeletePaper.title }}</p>
            <p v-if="deleteDialogMode === 'direct'">
              该论文当前未绑定项目，确认后将从“所有论文”列表移除。
            </p>
            <p v-else>
              该论文已关联项目“{{ displayProjectName(selectedDeletePaper) }}”，删除会影响项目成果归属，需要项目负责人/学生负责人审核后生效。
            </p>
          </div>
        </section>
      </template>

      <template #footer>
        <el-button @click="deleteDialogOpen = false">取消</el-button>
        <el-button :type="deleteDialogMode === 'direct' ? 'danger' : 'primary'" @click="confirmDeletePaper">
          {{ deleteDialogMode === 'direct' ? '确认删除' : '提交审核' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.member-paper-page {
  --outcomes-blue: #3478e5;
  --outcomes-green: #23a574;
  display: grid;
  gap: 16px;
  min-width: 0;
}

.outcomes-panel {
  border: 1px solid #e2eaf6;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 34px rgba(36, 69, 116, 0.055);
}

.outcomes-panel {
  overflow: hidden;
}

.outcomes-panel-toolbar {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid #edf2f8;
}

.outcomes-panel-toolbar.compact {
  min-height: 58px;
}

.outcomes-panel-toolbar h2 {
  margin: 4px 0 0;
  color: #172b49;
  font-size: 22px;
  font-weight: 780;
}

.outcomes-panel-toolbar p {
  margin: 6px 0 0;
  color: #7b8aa0;
  font-size: 13px;
}

.paper-filter-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) minmax(150px, 0.65fr) minmax(150px, 0.65fr) auto auto;
  gap: 12px;
  padding: 16px 18px;
}

.paper-view-tabs {
  padding: 0 18px 16px;
}

.paper-view-tabs :deep(.el-tabs__header) {
  margin: 0 0 14px;
  padding-top: 12px;
}

.paper-view-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: #edf2f8;
}

.paper-view-tabs :deep(.el-tabs__item) {
  color: #697b93;
  font-weight: 700;
}

.paper-view-tabs :deep(.el-tabs__item.is-active) {
  color: var(--outcomes-blue);
}

.outcomes-table {
  --el-table-header-bg-color: #f8fafd;
  --el-table-header-text-color: #60718a;
  --el-table-row-hover-bg-color: #f9fbff;
}

.all-paper-table,
.project-paper-table {
  border: 1px solid #e2eaf6;
  border-radius: 12px;
  overflow: hidden;
}

.project-paper-table :deep(.el-table__expanded-cell) {
  padding: 0;
  background: #f7faff;
}

.project-paper-expand {
  padding: 14px 18px 16px 66px;
}

.inner-paper-table {
  border: 1px solid #e0e8f3;
  border-radius: 12px;
  overflow: hidden;
}

.project-cell,
.paper-title-cell {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.project-cell strong,
.paper-title-cell strong {
  overflow: hidden;
  color: #203655;
  font-weight: 740;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-cell span,
.paper-title-cell span {
  overflow: hidden;
  color: #8a98ad;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-count {
  color: #3478e5;
  font-size: 18px;
}

.paper-action-bar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.paper-action-bar :deep(.el-button + .el-button) {
  margin-left: 0;
}

.all-paper-action-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.all-paper-action-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  white-space: nowrap;
}

.all-paper-delete-action {
  min-width: 58px;
  margin-left: 0 !important;
  justify-content: flex-end;
  justify-self: end;
}

.pagination-panel {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 18px;
  color: #8996aa;
  font-size: 12px;
}

.paper-view-tabs .pagination-panel {
  padding: 12px 0 0;
}

:deep(.paper-detail-dialog) {
  border-radius: 16px;
}

:deep(.paper-verify-dialog) {
  border-radius: 16px;
}

:deep(.paper-delete-dialog) {
  border-radius: 16px;
}

:deep(.paper-detail-dialog .el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #edf2f8;
}

:deep(.paper-verify-dialog .el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #edf2f8;
}

:deep(.paper-delete-dialog .el-dialog__header) {
  padding: 20px 24px 12px;
  border-bottom: 1px solid #edf2f8;
}

:deep(.paper-detail-dialog .el-dialog__body) {
  padding: 18px 24px;
}

:deep(.paper-verify-dialog .el-dialog__body) {
  padding: 22px 24px;
}

:deep(.paper-delete-dialog .el-dialog__body) {
  padding: 22px 24px;
}

:deep(.paper-detail-dialog .el-dialog__footer) {
  padding: 14px 24px 20px;
  border-top: 1px solid #edf2f8;
}

:deep(.paper-verify-dialog .el-dialog__footer) {
  padding: 14px 24px 20px;
  border-top: 1px solid #edf2f8;
}

:deep(.paper-delete-dialog .el-dialog__footer) {
  padding: 14px 24px 20px;
  border-top: 1px solid #edf2f8;
}

.dialog-paper-heading {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.dialog-paper-heading span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  color: var(--outcomes-blue);
  font-size: 12px;
  font-weight: 760;
}

.dialog-paper-heading h3 {
  margin: 0;
  color: #152845;
  font-size: 20px;
  line-height: 1.45;
}

.dialog-paper-heading p {
  margin: 0;
  color: #7b8aa0;
}

.paper-detail-descriptions {
  margin-top: 10px;
}

.verify-dialog-body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.delete-dialog-body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.verify-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  color: #1f9d6b;
  background: #e9f8f2;
  font-size: 20px;
  font-weight: 800;
}

.delete-dialog-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  font-size: 16px;
  font-weight: 800;
}

.delete-dialog-icon.direct {
  color: #d84b4b;
  background: #fff0f0;
}

.delete-dialog-icon.review {
  color: #3478e5;
  background: #edf5ff;
}

.verify-dialog-body h3 {
  margin: 0;
  color: #152845;
  font-size: 18px;
}

.delete-dialog-body h3 {
  margin: 0;
  color: #152845;
  font-size: 18px;
}

.verify-dialog-body p {
  margin: 8px 0 0;
  color: #66758c;
  line-height: 1.7;
}

.delete-dialog-body p {
  margin: 8px 0 0;
  color: #66758c;
  line-height: 1.7;
}

.delete-paper-title {
  color: #203655;
  font-weight: 740;
}

@media (max-width: 1180px) {
  .paper-filter-grid {
    grid-template-columns: 1fr;
  }

  .outcomes-panel-toolbar,
  .pagination-panel {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
