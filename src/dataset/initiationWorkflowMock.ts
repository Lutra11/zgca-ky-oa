export type WorkflowNodeType =
  | 'start'
  | 'end'
  | 'approval'
  | 'parallel-gateway'
  | 'merge-gateway'

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  label: string
  position: {
    x: number
    y: number
  }
  data: {
    assigneeId?: string
    assigneeName?: string
    department?: string
    rejectTo?: 'initiator' | 'previous'
    allowComment?: boolean
    description?: string
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

export interface WorkflowMeta {
  name: string
  code: string
  scope: string
  remark: string
}

export interface WorkflowDraft {
  batchId: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  published: boolean
  updatedAt: string
  meta?: WorkflowMeta
}

export interface WorkflowPaletteItem {
  type: WorkflowNodeType
  label: string
  hint: string
}

export interface WorkflowApprover {
  id: string
  name: string
  department: string
  role: string
}

export type WorkflowTemplateKey = 'serial' | 'parallel'

export const workflowPaletteItems: WorkflowPaletteItem[] = [
  {
    type: 'start',
    label: '开始',
    hint: '流程起点',
  },
  {
    type: 'end',
    label: '结束',
    hint: '流程终点',
  },
  {
    type: 'approval',
    label: '审批人',
    hint: '单人审批节点',
  },
  {
    type: 'parallel-gateway',
    label: '并行分支',
    hint: '拆分为多个并行节点',
  },
  {
    type: 'merge-gateway',
    label: '汇聚节点',
    hint: '等待全部分支通过',
  },
]

export const workflowApprovers: WorkflowApprover[] = [
  {
    id: 'research-admin',
    name: '科研部管理员',
    department: '科研部',
    role: '科研部',
  },
  {
    id: 'shao-bin',
    name: '邵斌',
    department: '技术办公室',
    role: '技术办公室负责人',
  },
  {
    id: 'zhang-jinmao',
    name: '张锦懋',
    department: '产业研究中心',
    role: '产业研究中心负责人',
  },
]

const DEFAULT_CONFIGURED_BATCH_IDS = new Set(['batch-2026-q3'])
const WORKFLOW_STORAGE_PREFIX = 'zgca_ky_oa_initiation_workflow'

function createEdge(source: string, target: string): WorkflowEdge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
  }
}

function createApprovalNode(
  id: string,
  label: string,
  x: number,
  y: number,
  assignee?: WorkflowApprover,
  description?: string,
): WorkflowNode {
  return {
    id,
    type: 'approval',
    label,
    position: {
      x,
      y,
    },
    data: {
      assigneeId: assignee?.id,
      assigneeName: assignee?.name,
      department: assignee?.department,
      rejectTo: 'initiator',
      allowComment: true,
      description,
    },
  }
}

export function createSerialWorkflowDraft(batchId: string): WorkflowDraft {
  const researchAdmin = workflowApprovers[0]
  const projectSubmitter: WorkflowApprover = {
    id: 'initiator',
    name: '项目负责人',
    department: '发起人',
    role: '项目负责人',
  }

  return {
    batchId,
    published: false,
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'node-start',
        type: 'start',
        label: '开始',
        position: {
          x: 470,
          y: 42,
        },
        data: {
          description: '批次审批流开始',
        },
      },
      createApprovalNode('node-submit', '项目负责人提交', 420, 136, projectSubmitter, '提交申报材料'),
      createApprovalNode('node-research-admin', '科研部管理员审批', 420, 244, researchAdmin, '形式审查'),
      {
        id: 'node-end',
        type: 'end',
        label: '结束',
        position: {
          x: 470,
          y: 360,
        },
        data: {
          description: '审批流程结束',
        },
      },
    ],
    edges: [
      createEdge('node-start', 'node-submit'),
      createEdge('node-submit', 'node-research-admin'),
      createEdge('node-research-admin', 'node-end'),
    ],
  }
}

export function createParallelWorkflowDraft(batchId: string): WorkflowDraft {
  const [researchAdmin, shaoBin, zhangJinmao] = workflowApprovers
  const projectSubmitter: WorkflowApprover = {
    id: 'initiator',
    name: '项目负责人',
    department: '发起人',
    role: '项目负责人',
  }

  return {
    batchId,
    published: DEFAULT_CONFIGURED_BATCH_IDS.has(batchId),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'node-start',
        type: 'start',
        label: '开始',
        position: {
          x: 470,
          y: 36,
        },
        data: {
          description: '批次审批流开始',
        },
      },
      createApprovalNode('node-submit', '项目负责人提交', 420, 126, projectSubmitter, '提交申报材料'),
      {
        id: 'node-parallel',
        type: 'parallel-gateway',
        label: '并行分支',
        position: {
          x: 506,
          y: 220,
        },
        data: {
          description: '三条分支同时办理',
        },
      },
      createApprovalNode('node-research-admin', '科研部管理员', 210, 314, researchAdmin, '形式审查'),
      createApprovalNode('node-tech-office', '技术办公室负责人', 420, 314, shaoBin, '业务审批'),
      createApprovalNode('node-industry-center', '产业研究中心负责人', 632, 314, zhangJinmao, '部门审批'),
      {
        id: 'node-merge',
        type: 'merge-gateway',
        label: '全部通过',
        position: {
          x: 506,
          y: 432,
        },
        data: {
          description: '所有并行节点全部通过',
        },
      },
      {
        id: 'node-end',
        type: 'end',
        label: '结束',
        position: {
          x: 470,
          y: 542,
        },
        data: {
          description: '审批流程结束',
        },
      },
    ],
    edges: [
      createEdge('node-start', 'node-submit'),
      createEdge('node-submit', 'node-parallel'),
      createEdge('node-parallel', 'node-research-admin'),
      createEdge('node-parallel', 'node-tech-office'),
      createEdge('node-parallel', 'node-industry-center'),
      createEdge('node-research-admin', 'node-merge'),
      createEdge('node-tech-office', 'node-merge'),
      createEdge('node-industry-center', 'node-merge'),
      createEdge('node-merge', 'node-end'),
    ],
  }
}

export function getDefaultWorkflowDraft(batchId: string): WorkflowDraft {
  return DEFAULT_CONFIGURED_BATCH_IDS.has(batchId)
    ? createParallelWorkflowDraft(batchId)
    : createSerialWorkflowDraft(batchId)
}

export function getWorkflowStorageKey(batchId: string) {
  return `${WORKFLOW_STORAGE_PREFIX}_${batchId}`
}

export function cloneWorkflowDraft(draft: WorkflowDraft): WorkflowDraft {
  return {
    ...draft,
    meta: draft.meta
      ? {
          ...draft.meta,
        }
      : undefined,
    nodes: draft.nodes.map((node) => ({
      ...node,
      position: {
        ...node.position,
      },
      data: {
        ...node.data,
      },
    })),
    edges: draft.edges.map((edge) => ({ ...edge })),
  }
}

export function readWorkflowDraft(batchId: string): WorkflowDraft | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawDraft = window.sessionStorage.getItem(getWorkflowStorageKey(batchId))

  if (!rawDraft) {
    return null
  }

  try {
    const parsed = JSON.parse(rawDraft) as WorkflowDraft

    if (!parsed || parsed.batchId !== batchId || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null
    }

    return cloneWorkflowDraft(parsed)
  } catch {
    return null
  }
}

export function writeWorkflowDraft(draft: WorkflowDraft) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(getWorkflowStorageKey(draft.batchId), JSON.stringify(draft))
}

export function isWorkflowBatchConfigured(batchId: string) {
  const storedDraft = readWorkflowDraft(batchId)

  return Boolean(storedDraft?.nodes.length) || DEFAULT_CONFIGURED_BATCH_IDS.has(batchId)
}
