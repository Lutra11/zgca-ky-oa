import {
  readWorkflowDraft,
  type WorkflowMeta,
  type WorkflowTemplateKey,
} from './initiationWorkflowMock'

export type WorkflowConfigStatus = '已发布' | '草稿' | '未配置'

export interface WorkflowConfigMockRow {
  id: string
  name: string
  code: string
  scope: string
  description: string
  remark: string
  ownerModule: string
  status: WorkflowConfigStatus
  template: WorkflowTemplateKey
  updatedAt: string
}

const WORKFLOW_CONFIG_STORAGE_KEY = 'zgca_ky_oa_common_workflow_configs'

export const workflowConfigMockRows: WorkflowConfigMockRow[] = [
  {
    id: 'quarterly-review-workflow',
    name: '季度推进会审批流',
    code: 'WF-QUARTERLY-REVIEW',
    scope: '季度推进会',
    description: '用于季度推进会材料提交、学部确认、科研部审批等环节的流转配置。',
    remark: '后续接入季度推进会模块时作为公共流程模板调用。',
    ownerModule: '季度推进会',
    status: '未配置',
    template: 'serial',
    updatedAt: '2026-08-20 10:30',
  },
  {
    id: 'initiation-approval-workflow',
    name: '立项审批流',
    code: 'WF-INITIATION-APPROVAL',
    scope: '项目申报与立项',
    description: '用于立项批次下项目申报、形式审查、并行评审和立项确认的公共审批流程。',
    remark: '当前已在项目申报与立项批次中使用，可作为默认立项审批流模板。',
    ownerModule: '项目申报与立项',
    status: '已发布',
    template: 'parallel',
    updatedAt: '2026-08-22 16:00',
  },
  {
    id: 'project-change-workflow',
    name: '项目变更审批流',
    code: 'WF-PROJECT-CHANGE',
    scope: '项目管理',
    description: '用于项目延期、成员调整、预算调整等变更事项的公共审批流程。',
    remark: '原型占位，后续由项目管理模块调用。',
    ownerModule: '项目管理',
    status: '草稿',
    template: 'serial',
    updatedAt: '2026-08-24 09:15',
  },
]

export function createWorkflowConfigRow(): WorkflowConfigMockRow {
  const timestamp = Date.now()

  return {
    id: `custom-workflow-${timestamp}`,
    name: '新建审批流',
    code: `WF-CUSTOM-${String(timestamp).slice(-6)}`,
    scope: '',
    description: '新建公共审批流程，请补充适用业务与流程备注。',
    remark: '',
    ownerModule: '未指定',
    status: '未配置',
    template: 'serial',
    updatedAt: formatWorkflowUpdatedAt(new Date()),
  }
}

export function loadWorkflowConfigRows() {
  const mergedRows = new Map<string, WorkflowConfigMockRow>()

  workflowConfigMockRows.forEach((row) => mergedRows.set(row.id, row))
  readCustomWorkflowConfigRows().forEach((row) => mergedRows.set(row.id, row))

  return [...mergedRows.values()].map(resolveWorkflowConfigRuntimeRow)
}

export function getWorkflowConfigRow(workflowId: string) {
  return loadWorkflowConfigRows().find((row) => row.id === workflowId) ?? null
}

export function upsertWorkflowConfigRow(row: WorkflowConfigMockRow) {
  const customRows = readCustomWorkflowConfigRows()
  const nextRows = customRows.filter((item) => item.id !== row.id)

  nextRows.push(row)
  writeCustomWorkflowConfigRows(nextRows)
}

export function toWorkflowMeta(row: WorkflowConfigMockRow): WorkflowMeta {
  return {
    name: row.name,
    code: row.code,
    scope: row.scope,
    remark: row.remark,
  }
}

export function updateWorkflowConfigRowFromMeta(
  row: WorkflowConfigMockRow,
  meta: WorkflowMeta,
  status: WorkflowConfigStatus,
) {
  return {
    ...row,
    name: meta.name || row.name,
    code: meta.code || row.code,
    scope: meta.scope,
    remark: meta.remark,
    ownerModule: meta.scope || row.ownerModule,
    description: meta.remark || row.description,
    status,
    updatedAt: formatWorkflowUpdatedAt(new Date()),
  }
}

function resolveWorkflowConfigRuntimeRow(row: WorkflowConfigMockRow): WorkflowConfigMockRow {
  const draft = readWorkflowDraft(row.id)

  if (!draft) {
    return row
  }

  return {
    ...row,
    name: draft.meta?.name || row.name,
    code: draft.meta?.code || row.code,
    scope: draft.meta?.scope ?? row.scope,
    remark: draft.meta?.remark ?? row.remark,
    ownerModule: draft.meta?.scope || row.ownerModule,
    status: draft.published ? '已发布' : '草稿',
    updatedAt: formatWorkflowUpdatedAt(new Date(draft.updatedAt)),
  }
}

function readCustomWorkflowConfigRows(): WorkflowConfigMockRow[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawRows = window.sessionStorage.getItem(WORKFLOW_CONFIG_STORAGE_KEY)

  if (!rawRows) {
    return []
  }

  try {
    const parsedRows = JSON.parse(rawRows) as WorkflowConfigMockRow[]

    return Array.isArray(parsedRows)
      ? parsedRows.filter((row) => row && typeof row.id === 'string')
      : []
  } catch {
    return []
  }
}

function writeCustomWorkflowConfigRows(rows: WorkflowConfigMockRow[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(WORKFLOW_CONFIG_STORAGE_KEY, JSON.stringify(rows))
}

function formatWorkflowUpdatedAt(date: Date) {
  if (Number.isNaN(date.getTime())) {
    return '暂未保存'
  }

  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
