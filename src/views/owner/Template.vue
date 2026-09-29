<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import templateDataset from '../../dataset/template.json'
import TemplateCreateDialog from './TemplateCreateDialog.vue'

type TemplateCategory = '评审标准模板' | '通知模板'
type TemplateStatus = '启用' | '停用' | '草稿'

interface TemplateItem {
  id: string
  name: string
  templateNo: string
  category: TemplateCategory
  applicableDepartment: string
  creator: string
  createdAt: string
  updatedAt: string
  status: TemplateStatus
  usageCount: number
  description: string
  workflowNodes: string[]
  fields: string[]
}

interface TemplateFilters {
  name: string
  category: '' | TemplateCategory
  status: '' | TemplateStatus
  creator: string
}

interface TemplateCreatePayload {
  name: string
  description: string
  category: TemplateCategory
  scopes: string[]
}

const TEMPLATE_SEED_KEY = 'zgca_ky_oa_template_create_seed'

const templates = templateDataset as TemplateItem[]
const route = useRoute()
const router = useRouter()

const templateFilters = reactive<TemplateFilters>({
  name: '',
  category: '',
  status: '',
  creator: '',
})

const appliedTemplateFilters = reactive<TemplateFilters>({
  name: '',
  category: '',
  status: '',
  creator: '',
})

const selectedTemplateId = shallowRef(templates[0]?.id ?? '')
const isCreateDialogVisible = shallowRef(false)

const templateCategories: TemplateCategory[] = ['评审标准模板', '通知模板']
const templateStatuses: TemplateStatus[] = ['启用', '停用', '草稿']

const filteredTemplates = computed(() => filterTemplates(appliedTemplateFilters))

const selectedTemplate = computed(
  () =>
    filteredTemplates.value.find((template) => template.id === selectedTemplateId.value) ??
    filteredTemplates.value[0],
)

function selectTemplate(template: TemplateItem) {
  selectedTemplateId.value = template.id
}

function openCreateDialog() {
  isCreateDialogVisible.value = true
}

function enterTemplateBuilder(payload: TemplateCreatePayload) {
  window.sessionStorage.setItem(TEMPLATE_SEED_KEY, JSON.stringify(payload))

  const routeName = typeof route.name === 'string'
    ? route.name.replace(/-template-create$/, '-template-new')
    : ''

  if (routeName) {
    router.push({ name: routeName })
    return
  }

  router.push(`${route.path.replace(/\/[^/]+$/, '')}/template-new`)
}

function applyTemplateFilters() {
  appliedTemplateFilters.name = templateFilters.name
  appliedTemplateFilters.category = templateFilters.category
  appliedTemplateFilters.status = templateFilters.status
  appliedTemplateFilters.creator = templateFilters.creator
  selectedTemplateId.value = filterTemplates(appliedTemplateFilters)[0]?.id ?? ''
}

function resetTemplateFilters() {
  templateFilters.name = ''
  templateFilters.category = ''
  templateFilters.status = ''
  templateFilters.creator = ''
  appliedTemplateFilters.name = ''
  appliedTemplateFilters.category = ''
  appliedTemplateFilters.status = ''
  appliedTemplateFilters.creator = ''
  selectedTemplateId.value = templates[0]?.id ?? ''
}

function filterTemplates(filters: TemplateFilters) {
  return templates.filter((template) => {
    const matchesName = template.name.includes(filters.name.trim())
    const matchesCategory = filters.category ? template.category === filters.category : true
    const matchesStatus = filters.status ? template.status === filters.status : true
    const matchesCreator = template.creator.includes(filters.creator.trim())

    return matchesName && matchesCategory && matchesStatus && matchesCreator
  })
}

function getTemplateStatusClass(status: TemplateStatus) {
  return {
    'template-status-enabled': status === '启用',
    'template-status-disabled': status === '停用',
    'template-status-draft': status === '草稿',
  }
}
</script>

<template>
  <section class="template-management" aria-label="模板搭建">
    <div class="template-workbench">
      <div class="template-heading">
        <div>
          <!-- <p class="overview-kicker">模板搭建</p> -->
          <h3 class="template-title">模板列表</h3>
          <!-- <p class="template-description">
            管理科研评审中的标准模板与通知模板，支持创建、编辑、启停和复用。
          </p> -->
        </div>
        <div class="template-actions">
          <el-button type="primary" @click="openCreateDialog">新建模板</el-button>
          <el-button>导入模板</el-button>
          <el-button>批量操作</el-button>
        </div>
      </div>

      <div class="template-filter-panel">
        <label class="template-filter-field">
          <span>模板名称</span>
          <el-input v-model="templateFilters.name" placeholder="请输入模板名称" clearable />
        </label>
        <label class="template-filter-field">
          <span>模板分类</span>
          <el-select v-model="templateFilters.category" placeholder="请选择分类" clearable>
            <el-option
              v-for="category in templateCategories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </label>
        <label class="template-filter-field">
          <span>使用状态</span>
          <el-select v-model="templateFilters.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="status in templateStatuses"
              :key="status"
              :label="status"
              :value="status"
            />
          </el-select>
        </label>
        <label class="template-filter-field">
          <span>创建人</span>
          <el-input v-model="templateFilters.creator" placeholder="请输入创建人" clearable />
        </label>
        <div class="template-filter-actions">
          <el-button type="primary" @click="applyTemplateFilters">查询</el-button>
          <el-button @click="resetTemplateFilters">重置</el-button>
        </div>
      </div>

      <div class="template-table-panel">
        <div class="template-table-toolbar">
          <span>已选择 {{ selectedTemplate ? 1 : 0 }} 项</span>
          <div class="template-toolbar-actions">
            <button type="button">启用</button>
            <button type="button">停用</button>
            <button type="button">删除</button>
            <button type="button">导出</button>
          </div>
        </div>

        <div class="template-table-wrap">
          <table class="template-table">
            <thead>
              <tr>
                <th></th>
                <th>模板名称</th>
                <th>模板编号</th>
                <th>分类</th>
                <th>适用范围</th>
                <th>创建人</th>
                <th>更新时间</th>
                <th>状态</th>
                <th>使用次数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="template in filteredTemplates"
                :key="template.id"
                class="template-row"
                :class="{ 'template-row-active': selectedTemplate?.id === template.id }"
                @click="selectTemplate(template)"
              >
                <td>
                  <span
                    class="template-check"
                    :class="{ 'template-check-active': selectedTemplate?.id === template.id }"
                  ></span>
                </td>
                <td class="template-name-cell">{{ template.name }}</td>
                <td>{{ template.templateNo }}</td>
                <td>{{ template.category }}</td>
                <td>{{ template.applicableDepartment }}</td>
                <td>{{ template.creator }}</td>
                <td>{{ template.updatedAt }}</td>
                <td>
                  <span class="template-status" :class="getTemplateStatusClass(template.status)">
                    {{ template.status }}
                  </span>
                </td>
                <td>{{ template.usageCount.toLocaleString() }}</td>
                <td>
                  <div class="template-row-actions">
                    <button type="button" @click.stop>编辑</button>
                    <button type="button" @click.stop>复制</button>
                    <button type="button" @click.stop>预览</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="filteredTemplates.length === 0" class="template-empty">暂无符合条件的模板。</p>

        <div class="template-pagination">
          <span>共 {{ filteredTemplates.length }} 条</span>
          <span>10条/页</span>
          <div class="template-page-buttons">
            <button type="button">‹</button>
            <button type="button" class="template-page-current">1</button>
            <button type="button">2</button>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </div>

    <aside v-if="selectedTemplate" class="template-preview">
      <div class="template-preview-header">
        <h3 class="panel-title">模板预览</h3>
        <button type="button">收起</button>
      </div>

      <div class="template-preview-identity">
        <div class="template-document-icon">
          <img style="width: 100%;" src="../../dataset/img/word_icon.webp" alt="">
        </div>
        <div>
          <div class="template-preview-title-row">
            <strong>{{ selectedTemplate.name }}</strong>
            <span class="template-status" :class="getTemplateStatusClass(selectedTemplate.status)">
              {{ selectedTemplate.status }}
            </span>
          </div>
          <p>模板编号：{{ selectedTemplate.templateNo }}</p>
          <p>最后更新：{{ selectedTemplate.updatedAt }}</p>
        </div>
      </div>

      <div class="template-preview-section">
        <h4>模板信息</h4>
        <dl class="template-info-list">
          <div>
            <dt>分类</dt>
            <dd>{{ selectedTemplate.category }}</dd>
          </div>
          <div>
            <dt>适用范围</dt>
            <dd>{{ selectedTemplate.applicableDepartment }}</dd>
          </div>
          <div>
            <dt>创建人</dt>
            <dd>{{ selectedTemplate.creator }}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{{ selectedTemplate.createdAt }}</dd>
          </div>
          <div>
            <dt>使用次数</dt>
            <dd>{{ selectedTemplate.usageCount.toLocaleString() }}</dd>
          </div>
        </dl>
      </div>

      <div class="template-preview-section">
        <h4>模板说明</h4>
        <p class="template-preview-text">{{ selectedTemplate.description }}</p>
      </div>

      <div class="template-preview-section">
        <h4>字段内容</h4>
        <div class="template-field-tags">
          <span v-for="field in selectedTemplate.fields" :key="field">{{ field }}</span>
        </div>
      </div>

      <!-- <div class="template-preview-section">
        <h4>流程节点（{{ selectedTemplate.workflowNodes.length }}）</h4>
        <ol class="template-flow-list">
          <li v-for="node in selectedTemplate.workflowNodes" :key="node">{{ node }}</li>
        </ol>
      </div> -->

      <el-button class="preview-action" type="primary" plain>预览模板</el-button>
    </aside>

    <TemplateCreateDialog v-model="isCreateDialogVisible" @enter-builder="enterTemplateBuilder" />
  </section>
</template>

<style scoped>
.template-management {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;
}

.template-workbench {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.template-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.overview-kicker,
.template-title,
.template-description,
.template-preview p,
.template-preview h4,
.template-info-list,
.template-info-list dd {
  margin: 0;
}

.overview-kicker {
  color: #0071e3;
  font-size: 13px;
  font-weight: 760;
}

.template-title {
  margin-top: 5px;
  font-size: 28px;
  line-height: 1.2;
}

.template-description {
  margin-top: 8px;
  color: #6e6e73;
}

.template-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.template-filter-panel,
.template-table-panel,
.template-preview {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.06);
  backdrop-filter: blur(18px);
}

.template-filter-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr)) auto;
  gap: 14px;
  align-items: end;
  padding: 18px;
}

.template-filter-field {
  display: grid;
  gap: 8px;
}

.template-filter-field span {
  color: #424245;
  font-size: 13px;
  font-weight: 750;
}

.template-filter-field :deep(.el-select),
.template-filter-field :deep(.el-input) {
  width: 100%;
}

.template-filter-actions {
  display: flex;
  gap: 10px;
}

.template-table-panel {
  overflow: hidden;
}

.template-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  color: #424245;
  font-size: 14px;
  font-weight: 750;
}

.template-toolbar-actions,
.template-row-actions,
.template-page-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.template-toolbar-actions button,
.template-row-actions button,
.template-preview-header button,
.template-page-buttons button {
  border: 0;
  color: #0071e3;
  background: transparent;
  font-weight: 750;
  cursor: pointer;
}

.template-table-wrap {
  overflow-x: auto;
}

.template-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.template-table th,
.template-table td {
  padding: 13px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  color: #424245;
  text-align: left;
  white-space: nowrap;
  font-size: 14px;
}

.template-table th {
  color: #1d1d1f;
  background: #f7faff;
  font-weight: 760;
}

.template-row {
  cursor: pointer;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.template-row:hover,
.template-row-active {
  background: #f2f8ff;
}

.template-name-cell {
  color: #1d1d1f;
  font-weight: 760;
}

.template-check {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  border: 1px solid #d8dce3;
  border-radius: 6px;
  background: #fff;
}

.template-check-active {
  border-color: #0071e3;
  background: #0071e3;
}

.template-check-active::after {
  width: 6px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  content: "";
  transform: rotate(45deg) translateY(-1px);
}

.template-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 760;
}

.template-status-enabled {
  color: #137333;
  background: #e4f7eb;
}

.template-status-disabled {
  color: #c2410c;
  background: #fff0e8;
}

.template-status-draft {
  color: #475569;
  background: #eef2f7;
}

.template-empty {
  margin: 0;
  padding: 24px 16px;
  color: #6e6e73;
  text-align: center;
}

.template-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  color: #6e6e73;
  font-size: 13px;
}

.template-page-buttons button {
  min-width: 32px;
  height: 32px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fff;
}

.template-page-buttons .template-page-current {
  color: #fff;
  border-color: #0071e3;
  background: #0071e3;
}

.template-preview {
  position: sticky;
  top: 32px;
  display: grid;
  gap: 20px;
  padding: 20px;
}

.template-preview-header,
.template-preview-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
}

.template-preview-identity {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.template-document-icon {
  width: 54px;
  height: 64px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 8px;
  /* color: #fff; */
  /* background: linear-gradient(145deg, #0071e3, #67b7ff); */
  /* box-shadow: 0 14px 26px rgba(0, 113, 227, 0.22); */
  font-weight: 800;
}

.template-preview-identity p,
.template-preview-text {
  margin-top: 6px;
  color: #6e6e73;
  font-size: 13px;
  line-height: 1.6;
}

.template-preview-section {
  display: grid;
  gap: 10px;
}

.template-preview-section h4 {
  font-size: 16px;
}

.template-info-list {
  display: grid;
  gap: 9px;
}

.template-info-list div {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 12px;
}

.template-info-list dt {
  color: #86868b;
  font-size: 13px;
}

.template-info-list dd {
  color: #1d1d1f;
  font-size: 13px;
  font-weight: 650;
}

.template-field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-field-tags span {
  padding: 5px 8px;
  border-radius: 8px;
  color: #0066cc;
  background: #eef6ff;
  font-size: 12px;
  font-weight: 750;
}

.template-flow-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
  counter-reset: flow;
}

.template-flow-list li {
  position: relative;
  padding-left: 34px;
  color: #424245;
  font-size: 14px;
  counter-increment: flow;
}

.template-flow-list li::before {
  position: absolute;
  left: 0;
  top: 0;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  background: #0071e3;
  content: counter(flow);
  font-size: 12px;
  font-weight: 800;
}

.preview-action {
  width: 100%;
  height: 42px;
  border-radius: 8px;
  font-weight: 760;
}

@media (max-width: 1040px) {
  .template-management {
    grid-template-columns: 1fr;
  }

  .template-preview {
    position: static;
  }

  .template-filter-panel {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 760px) {
  .template-heading,
  .template-table-toolbar,
  .template-pagination {
    align-items: stretch;
    flex-direction: column;
  }

  .template-actions,
  .template-filter-actions,
  .template-toolbar-actions {
    justify-content: flex-start;
  }

  .template-filter-panel {
    grid-template-columns: 1fr;
  }

  .template-info-list div {
    grid-template-columns: 1fr;
    gap: 3px;
  }
}
</style>
