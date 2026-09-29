<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { InitiationBatchMockRow } from '../../dataset/initiationProjectsMock'
import {
  cloneWorkflowDraft,
  createParallelWorkflowDraft,
  createSerialWorkflowDraft,
  getDefaultWorkflowDraft,
  readWorkflowDraft,
  workflowApprovers,
  workflowPaletteItems,
  writeWorkflowDraft,
  type WorkflowApprover,
  type WorkflowDraft,
  type WorkflowEdge,
  type WorkflowMeta,
  type WorkflowNode,
  type WorkflowNodeType,
  type WorkflowPaletteItem,
  type WorkflowTemplateKey,
} from '../../dataset/initiationWorkflowMock'

interface DragPayloadNode {
  kind: 'node'
  type: WorkflowNodeType
  label: string
}

interface DragPayloadPerson {
  kind: 'person'
  personId: string
}

type DragPayload = DragPayloadNode | DragPayloadPerson

interface DragState {
  nodeId: string
  offsetX: number
  offsetY: number
}

interface CanvasPoint {
  x: number
  y: number
}

export interface WorkflowDesignerContext {
  id: string
  name: string
  code: string
  scope?: string
  remark?: string
  template?: WorkflowTemplateKey
}

const props = defineProps<{
  batch?: InitiationBatchMockRow
  context?: WorkflowDesignerContext
  backLabel?: string
  showUsageRemark?: boolean
}>()

const emit = defineEmits<{
  back: []
  statusChange: [configured: boolean, meta?: WorkflowMeta]
}>()

const canvasRef = shallowRef<HTMLElement>()
const nodes = ref<WorkflowNode[]>([])
const edges = ref<WorkflowEdge[]>([])
const selectedNodeId = shallowRef('')
const selectedEdgeId = shallowRef('')
const pendingSourceNodeId = shallowRef('')
const personKeyword = shallowRef('')
const currentTemplate = shallowRef<WorkflowTemplateKey>('parallel')
const zoom = shallowRef(1)
const pan = reactive({
  x: 0,
  y: 0,
})
const workflowMeta = reactive<WorkflowMeta>({
  name: '',
  code: '',
  scope: '',
  remark: '',
})
const dragState = shallowRef<DragState | null>(null)

const canvasSize = {
  width: 1120,
  height: 690,
}

const nodeMetrics: Record<WorkflowNodeType, { width: number; height: number }> = {
  start: {
    width: 140,
    height: 48,
  },
  end: {
    width: 140,
    height: 48,
  },
  approval: {
    width: 190,
    height: 66,
  },
  'parallel-gateway': {
    width: 86,
    height: 82,
  },
  'merge-gateway': {
    width: 86,
    height: 82,
  },
}

const nodeTypeSet = new Set<WorkflowNodeType>([
  'start',
  'end',
  'approval',
  'parallel-gateway',
  'merge-gateway',
])

const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) ?? null)

const selectedEdge = computed(() => edges.value.find((edge) => edge.id === selectedEdgeId.value) ?? null)

const workflowContext = computed<WorkflowDesignerContext>(() => {
  if (props.context) {
    return props.context
  }

  return {
    id: props.batch?.id ?? 'workflow-draft',
    name: props.batch?.batch_name ?? props.batch?.batchName ?? '审批流',
    code: props.batch?.batch_code ?? props.batch?.batchCode ?? 'WORKFLOW-DRAFT',
    scope: '项目申报与立项',
    remark: '',
  }
})

const workflowContextId = computed(() => workflowContext.value.id)

const selectedEdgeSourceLabel = computed(() => getNodeLabelById(selectedEdge.value?.source ?? ''))

const selectedEdgeTargetLabel = computed(() => getNodeLabelById(selectedEdge.value?.target ?? ''))

const filteredApprovers = computed(() => {
  const keyword = personKeyword.value.trim().toLowerCase()

  if (!keyword) {
    return workflowApprovers
  }

  return workflowApprovers.filter((person) =>
    [person.name, person.department, person.role].some((field) => field.toLowerCase().includes(keyword)),
  )
})

const structureLabel = computed(() => {
  const hasParallel = nodes.value.some((node) => node.type === 'parallel-gateway')

  return hasParallel ? '1 → 3 → 1' : '1 → 1 → 1'
})

const canvasTransformStyle = computed(() => ({
  width: `${canvasSize.width}px`,
  height: `${canvasSize.height}px`,
  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom.value})`,
}))

const parallelBranchCount = computed(() => {
  if (!selectedNode.value || selectedNode.value.type !== 'parallel-gateway') {
    return 0
  }

  return edges.value.filter((edge) => edge.source === selectedNode.value?.id).length
})

watch(
  () => workflowContextId.value,
  () => {
    loadWorkflowDraft()
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  stopNodeDrag()
})

function loadWorkflowDraft() {
  const storedDraft = readWorkflowDraft(workflowContextId.value)
  const defaultDraft = storedDraft ?? getContextDefaultWorkflowDraft()
  const draft = cloneWorkflowDraft(defaultDraft)

  hydrateWorkflowMeta(draft.meta)
  nodes.value = draft.nodes
  edges.value = draft.edges
  selectedNodeId.value =
    nodes.value.find((node) => node.type === 'approval' && node.id !== 'node-submit')?.id ??
    nodes.value.find((node) => node.type === 'approval')?.id ??
    nodes.value[0]?.id ??
    ''
  selectedEdgeId.value = ''
  pendingSourceNodeId.value = ''
  currentTemplate.value = nodes.value.some((node) => node.type === 'parallel-gateway') ? 'parallel' : 'serial'
  zoom.value = 1
  pan.x = 0
  pan.y = 0
}

function getContextDefaultWorkflowDraft() {
  if (workflowContext.value.template === 'parallel') {
    return createParallelWorkflowDraft(workflowContextId.value)
  }

  if (workflowContext.value.template === 'serial') {
    return createSerialWorkflowDraft(workflowContextId.value)
  }

  return getDefaultWorkflowDraft(workflowContextId.value)
}

function hydrateWorkflowMeta(storedMeta?: WorkflowMeta) {
  const context = workflowContext.value

  workflowMeta.name = storedMeta?.name || context.name
  workflowMeta.code = storedMeta?.code || context.code
  workflowMeta.scope = storedMeta?.scope ?? context.scope ?? ''
  workflowMeta.remark = storedMeta?.remark ?? context.remark ?? ''
}

function getBatchDisplayName() {
  return workflowMeta.name || workflowContext.value.name
}

function getBatchDisplayCode() {
  return workflowMeta.code || workflowContext.value.code
}

function getNodeLabelById(nodeId: string) {
  return nodes.value.find((node) => node.id === nodeId)?.label ?? '未选择节点'
}

function getNodeClass(node: WorkflowNode) {
  return [
    'workflow-node',
    `workflow-node-${node.type}`,
    {
      selected: selectedNodeId.value === node.id,
      connecting: pendingSourceNodeId.value === node.id,
    },
  ]
}

function getNodeStyle(node: WorkflowNode) {
  const metric = nodeMetrics[node.type]

  return {
    width: `${metric.width}px`,
    minHeight: `${metric.height}px`,
    left: `${node.position.x}px`,
    top: `${node.position.y}px`,
  }
}

function getNodeIconText(node: WorkflowNode | WorkflowPaletteItem) {
  const iconTextMap: Record<WorkflowNodeType, string> = {
    start: '始',
    end: '终',
    approval: '审',
    'parallel-gateway': '并',
    'merge-gateway': '汇',
  }

  return iconTextMap[node.type]
}

function getNodeSubText(node: WorkflowNode) {
  if (node.type === 'approval') {
    return node.data.assigneeName
      ? `${node.data.assigneeName} / ${node.data.department ?? '未设置部门'}`
      : '未指定审批人员'
  }

  if (node.type === 'parallel-gateway') {
    const count = edges.value.filter((edge) => edge.source === node.id).length

    return count > 0 ? `${count} 条并行分支` : '拖入或连线形成分支'
  }

  if (node.type === 'merge-gateway') {
    return '所有并行节点全部通过'
  }

  return node.data.description ?? '线性节点'
}

function setDragPayload(event: DragEvent, payload: DragPayload) {
  event.dataTransfer?.setData('application/x-initiation-workflow', JSON.stringify(payload))

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

function handlePaletteDragStart(event: DragEvent, item: WorkflowPaletteItem) {
  setDragPayload(event, {
    kind: 'node',
    type: item.type,
    label: item.label,
  })
}

function handlePersonDragStart(event: DragEvent, person: WorkflowApprover) {
  setDragPayload(event, {
    kind: 'person',
    personId: person.id,
  })
}

function parseDragPayload(event: DragEvent): DragPayload | null {
  const rawPayload = event.dataTransfer?.getData('application/x-initiation-workflow')

  if (!rawPayload) {
    return null
  }

  try {
    const payload = JSON.parse(rawPayload) as DragPayload

    if (payload.kind === 'node' && nodeTypeSet.has(payload.type)) {
      return payload
    }

    if (payload.kind === 'person' && workflowApprovers.some((person) => person.id === payload.personId)) {
      return payload
    }

    return null
  } catch {
    return null
  }
}

function getCanvasPoint(event: DragEvent | PointerEvent | MouseEvent): CanvasPoint {
  const rect = canvasRef.value?.getBoundingClientRect()

  if (!rect) {
    return {
      x: 0,
      y: 0,
    }
  }

  return {
    x: (event.clientX - rect.left - pan.x) / zoom.value,
    y: (event.clientY - rect.top - pan.y) / zoom.value,
  }
}

function normalizeDropPosition(point: CanvasPoint, type: WorkflowNodeType) {
  const metric = nodeMetrics[type]

  return {
    x: Math.max(20, Math.min(canvasSize.width - metric.width - 20, point.x - metric.width / 2)),
    y: Math.max(20, Math.min(canvasSize.height - metric.height - 20, point.y - metric.height / 2)),
  }
}

function handleCanvasDrop(event: DragEvent) {
  event.preventDefault()

  const payload = parseDragPayload(event)

  if (!payload) {
    return
  }

  const point = getCanvasPoint(event)

  if (payload.kind === 'person') {
    const person = workflowApprovers.find((item) => item.id === payload.personId)

    if (!person) {
      return
    }

    addApprovalNodeFromPerson(person, point)
    return
  }

  addNodeFromPalette(payload.type, payload.label, point)
}

function addNodeFromPalette(type: WorkflowNodeType, label: string, point: CanvasPoint) {
  if ((type === 'start' || type === 'end') && nodes.value.some((node) => node.type === type)) {
    ElMessage.warning(type === 'start' ? '开始节点只能保留一个' : '结束节点只能保留一个')
    return
  }

  const position = normalizeDropPosition(point, type)
  const id = createNodeId(type)
  const defaultLabelMap: Record<WorkflowNodeType, string> = {
    start: '开始',
    end: '结束',
    approval: '审批节点',
    'parallel-gateway': '并行分支',
    'merge-gateway': '全部通过',
  }

  nodes.value.push({
    id,
    type,
    label: type === 'approval' ? defaultLabelMap.approval : label || defaultLabelMap[type],
    position,
    data: {
      rejectTo: 'initiator',
      allowComment: true,
      description: type === 'merge-gateway' ? '所有并行节点全部通过' : undefined,
    },
  })
  selectNode(id)
}

function addApprovalNodeFromPerson(person: WorkflowApprover, point: CanvasPoint) {
  const position = normalizeDropPosition(point, 'approval')
  const id = createNodeId('approval')

  nodes.value.push({
    id,
    type: 'approval',
    label: person.role,
    position,
    data: {
      assigneeId: person.id,
      assigneeName: person.name,
      department: person.department,
      rejectTo: 'initiator',
      allowComment: true,
      description: '由人员拖入自动生成',
    },
  })
  selectNode(id)
}

function createNodeId(type: WorkflowNodeType) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function startNodeDrag(event: PointerEvent, node: WorkflowNode) {
  const target = event.target as HTMLElement

  if (target.closest('.workflow-port') || target.closest('button')) {
    return
  }

  event.preventDefault()
  selectNode(node.id)

  const point = getCanvasPoint(event)
  dragState.value = {
    nodeId: node.id,
    offsetX: point.x - node.position.x,
    offsetY: point.y - node.position.y,
  }

  window.addEventListener('pointermove', handleNodePointerMove)
  window.addEventListener('pointerup', stopNodeDrag)
}

function handleNodePointerMove(event: PointerEvent) {
  if (!dragState.value) {
    return
  }

  const point = getCanvasPoint(event)
  const targetNode = nodes.value.find((node) => node.id === dragState.value?.nodeId)

  if (!targetNode) {
    return
  }

  const metric = nodeMetrics[targetNode.type]

  targetNode.position = {
    x: Math.max(16, Math.min(canvasSize.width - metric.width - 16, point.x - dragState.value.offsetX)),
    y: Math.max(16, Math.min(canvasSize.height - metric.height - 16, point.y - dragState.value.offsetY)),
  }
}

function stopNodeDrag() {
  dragState.value = null
  window.removeEventListener('pointermove', handleNodePointerMove)
  window.removeEventListener('pointerup', stopNodeDrag)
}

function selectNode(nodeId: string) {
  selectedNodeId.value = nodeId
  selectedEdgeId.value = ''
}

function selectEdge(edgeId: string) {
  selectedEdgeId.value = edgeId
  selectedNodeId.value = ''
  pendingSourceNodeId.value = ''
}

function handleNodeClick(node: WorkflowNode) {
  if (
    pendingSourceNodeId.value &&
    pendingSourceNodeId.value !== node.id &&
    node.type !== 'start'
  ) {
    finishConnection(node)
    return
  }

  selectNode(node.id)
}

function startConnection(node: WorkflowNode) {
  if (node.type === 'end') {
    ElMessage.warning('结束节点不能作为连线起点')
    return
  }

  pendingSourceNodeId.value = pendingSourceNodeId.value === node.id ? '' : node.id
  selectedEdgeId.value = ''
  selectedNodeId.value = node.id
}

function finishConnection(node: WorkflowNode) {
  if (!pendingSourceNodeId.value) {
    ElMessage.info('请先点击上游节点右侧的连线点')
    return
  }

  if (node.type === 'start') {
    ElMessage.warning('开始节点不能作为连线终点')
    return
  }

  if (pendingSourceNodeId.value === node.id) {
    ElMessage.warning('不能连接到当前节点自身')
    return
  }

  const edgeExists = edges.value.some(
    (edge) => edge.source === pendingSourceNodeId.value && edge.target === node.id,
  )

  if (edgeExists) {
    ElMessage.warning('该连线已经存在')
    return
  }

  edges.value.push({
    id: `edge-${pendingSourceNodeId.value}-${node.id}-${Date.now()}`,
    source: pendingSourceNodeId.value,
    target: node.id,
  })
  pendingSourceNodeId.value = ''
  selectNode(node.id)
}

function getNodePoint(nodeId: string, port: 'source' | 'target'): CanvasPoint {
  const node = nodes.value.find((item) => item.id === nodeId)

  if (!node) {
    return {
      x: 0,
      y: 0,
    }
  }

  const metric = nodeMetrics[node.type]

  if (node.type === 'approval') {
    return {
      x: port === 'source' ? node.position.x + metric.width : node.position.x,
      y: node.position.y + metric.height / 2,
    }
  }

  if (node.type === 'start') {
    return {
      x: node.position.x + metric.width / 2,
      y: node.position.y + metric.height,
    }
  }

  if (node.type === 'end') {
    return {
      x: node.position.x + metric.width / 2,
      y: node.position.y,
    }
  }

  if (node.type === 'parallel-gateway') {
    return {
      x: node.position.x + metric.width / 2,
      y: port === 'source' ? node.position.y + metric.height : node.position.y,
    }
  }

  return {
    x: node.position.x + metric.width / 2,
    y: port === 'source' ? node.position.y + metric.height : node.position.y,
  }
}

function getEdgePath(edge: WorkflowEdge) {
  const sourcePoint = getNodePoint(edge.source, 'source')
  const targetPoint = getNodePoint(edge.target, 'target')
  const horizontalDistance = targetPoint.x - sourcePoint.x
  const verticalDistance = targetPoint.y - sourcePoint.y

  if (Math.abs(horizontalDistance) > Math.abs(verticalDistance)) {
    const controlDistance = Math.max(48, Math.abs(horizontalDistance) / 2)
    const sourceControlX = sourcePoint.x + (horizontalDistance >= 0 ? controlDistance : -controlDistance)
    const targetControlX = targetPoint.x - (horizontalDistance >= 0 ? controlDistance : -controlDistance)

    return `M ${sourcePoint.x} ${sourcePoint.y} C ${sourceControlX} ${sourcePoint.y}, ${targetControlX} ${targetPoint.y}, ${targetPoint.x} ${targetPoint.y}`
  }

  const controlDistance = Math.max(42, Math.abs(verticalDistance) / 2)
  const sourceControlY = sourcePoint.y + (verticalDistance >= 0 ? controlDistance : -controlDistance)
  const targetControlY = targetPoint.y - (verticalDistance >= 0 ? controlDistance : -controlDistance)

  return `M ${sourcePoint.x} ${sourcePoint.y} C ${sourcePoint.x} ${sourceControlY}, ${targetPoint.x} ${targetControlY}, ${targetPoint.x} ${targetPoint.y}`
}

function updateSelectedNodeLabel(value: string) {
  if (!selectedNode.value) {
    return
  }

  selectedNode.value.label = value
}

function updateSelectedAssignee(assigneeId: string) {
  if (!selectedNode.value || selectedNode.value.type !== 'approval') {
    return
  }

  const assignee = workflowApprovers.find((person) => person.id === assigneeId)

  selectedNode.value.data.assigneeId = assignee?.id
  selectedNode.value.data.assigneeName = assignee?.name
  selectedNode.value.data.department = assignee?.department
}

function updateSelectedRejectTo(value: string | number | boolean | undefined) {
  if (!selectedNode.value || selectedNode.value.type !== 'approval') {
    return
  }

  selectedNode.value.data.rejectTo = value === 'previous' ? 'previous' : 'initiator'
}

function updateSelectedAllowComment(value: string | number | boolean) {
  if (!selectedNode.value || selectedNode.value.type !== 'approval') {
    return
  }

  selectedNode.value.data.allowComment = Boolean(value)
}

function applyTemplate(template: WorkflowTemplateKey) {
  const draft =
    template === 'parallel'
      ? createParallelWorkflowDraft(workflowContextId.value)
      : createSerialWorkflowDraft(workflowContextId.value)

  currentTemplate.value = template
  nodes.value = cloneWorkflowDraft(draft).nodes
  edges.value = cloneWorkflowDraft(draft).edges
  selectedNodeId.value =
    nodes.value.find((node) => node.type === 'approval' && node.id !== 'node-submit')?.id ??
    nodes.value.find((node) => node.type === 'approval')?.id ??
    ''
  selectedEdgeId.value = ''
  pendingSourceNodeId.value = ''
  zoom.value = 1
  pan.x = 0
  pan.y = 0
  ElMessage.success(template === 'parallel' ? '已切换为并行 1-3-1 示例' : '已切换为串行 1-1-1 示例')
}

function setZoom(nextZoom: number) {
  zoom.value = Math.min(1.35, Math.max(0.7, Number(nextZoom.toFixed(2))))
}

function zoomIn() {
  setZoom(zoom.value + 0.1)
}

function zoomOut() {
  setZoom(zoom.value - 0.1)
}

function centerCanvas() {
  zoom.value = 1
  pan.x = 0
  pan.y = 0
}

function fitCanvas() {
  const rect = canvasRef.value?.getBoundingClientRect()
  const bounds = getWorkflowBounds()

  if (!rect || !bounds) {
    centerCanvas()
    return
  }

  const nextZoom = Math.min(1, Math.max(0.7, Math.min(rect.width / bounds.width, rect.height / bounds.height) * 0.78))

  setZoom(nextZoom)
  pan.x = rect.width / 2 - (bounds.x + bounds.width / 2) * zoom.value
  pan.y = rect.height / 2 - (bounds.y + bounds.height / 2) * zoom.value
}

function autoLayout() {
  const hasParallel = nodes.value.some((node) => node.type === 'parallel-gateway')
  const draft = hasParallel
    ? createParallelWorkflowDraft(workflowContextId.value)
    : createSerialWorkflowDraft(workflowContextId.value)
  const layoutMap = new Map(draft.nodes.map((node) => [node.id, node.position]))

  nodes.value.forEach((node) => {
    const nextPosition = layoutMap.get(node.id)

    if (nextPosition) {
      node.position = {
        ...nextPosition,
      }
    }
  })
  centerCanvas()
  ElMessage.success('已按当前结构重新布局')
}

function getWorkflowBounds() {
  if (nodes.value.length === 0) {
    return null
  }

  const boxes = nodes.value.map((node) => {
    const metric = nodeMetrics[node.type]

    return {
      x1: node.position.x,
      y1: node.position.y,
      x2: node.position.x + metric.width,
      y2: node.position.y + metric.height,
    }
  })
  const x1 = Math.min(...boxes.map((box) => box.x1))
  const y1 = Math.min(...boxes.map((box) => box.y1))
  const x2 = Math.max(...boxes.map((box) => box.x2))
  const y2 = Math.max(...boxes.map((box) => box.y2))

  return {
    x: x1,
    y: y1,
    width: Math.max(1, x2 - x1),
    height: Math.max(1, y2 - y1),
  }
}

function deleteSelected() {
  if (selectedEdge.value) {
    deleteSelectedEdge()
    return
  }

  if (!selectedNode.value) {
    ElMessage.info('请先选中节点或连线')
    return
  }

  deleteSelectedNode()
}

function deleteSelectedEdge() {
  if (!selectedEdge.value) {
    return
  }

  edges.value = edges.value.filter((edge) => edge.id !== selectedEdge.value?.id)
  selectedEdgeId.value = ''
  ElMessage.success('已删除连线')
}

function deleteSelectedNode() {
  const node = selectedNode.value

  if (!node) {
    return
  }

  if (node.type === 'start' || node.type === 'end') {
    ElMessage.warning('开始和结束节点不能删除')
    return
  }

  nodes.value = nodes.value.filter((item) => item.id !== node.id)
  edges.value = edges.value.filter((edge) => edge.source !== node.id && edge.target !== node.id)
  selectedNodeId.value =
    nodes.value.find((item) => item.type === 'approval' && item.id !== 'node-submit')?.id ??
    nodes.value.find((item) => item.type === 'approval')?.id ??
    nodes.value[0]?.id ??
    ''
  ElMessage.success('已删除节点')
}

function createDraft(published: boolean): WorkflowDraft {
  return {
    batchId: workflowContextId.value,
    meta: {
      ...workflowMeta,
    },
    nodes: nodes.value.map((node) => ({
      ...node,
      position: {
        ...node.position,
      },
      data: {
        ...node.data,
      },
    })),
    edges: edges.value.map((edge) => ({ ...edge })),
    published,
    updatedAt: new Date().toISOString(),
  }
}

function handleSaveDraft() {
  writeWorkflowDraft(createDraft(false))
  emit('statusChange', true, { ...workflowMeta })
  ElMessage.success('审批流草稿已保存')
}

function handlePublishWorkflow() {
  const validationMessage = validateWorkflow()

  if (validationMessage) {
    ElMessage.error(validationMessage)
    return
  }

  writeWorkflowDraft(createDraft(true))
  emit('statusChange', true, { ...workflowMeta })
  ElMessage.success('审批流已发布，本地原型状态已更新')
}

function validateWorkflow() {
  if (props.showUsageRemark) {
    if (!workflowMeta.name.trim()) {
      return '请填写审批流名称'
    }

    if (!workflowMeta.code.trim()) {
      return '请填写审批流编码'
    }

    if (!workflowMeta.scope.trim()) {
      return '请填写适用业务'
    }
  }

  const startNodes = nodes.value.filter((node) => node.type === 'start')
  const endNodes = nodes.value.filter((node) => node.type === 'end')

  if (startNodes.length !== 1) {
    return '只能存在一个开始节点'
  }

  if (endNodes.length !== 1) {
    return '只能存在一个结束节点'
  }

  const unassignedApproval = nodes.value.find((node) => node.type === 'approval' && !node.data.assigneeId)

  if (unassignedApproval) {
    return `审批节点“${unassignedApproval.label}”未指定审批人`
  }

  const nodeIdSet = new Set(nodes.value.map((node) => node.id))
  const invalidEdge = edges.value.find((edge) => !nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target))

  if (invalidEdge) {
    return '存在无效连线，请删除后重新连接'
  }

  const startNode = startNodes[0]
  const endNode = endNodes[0]

  if (!edges.value.some((edge) => edge.source === startNode.id)) {
    return '开始节点必须连接到后续节点'
  }

  if (!edges.value.some((edge) => edge.target === endNode.id)) {
    return '结束节点必须存在上游节点'
  }

  const disconnectedNode = nodes.value.find((node) => {
    if (node.type === 'start') {
      return !edges.value.some((edge) => edge.source === node.id)
    }

    if (node.type === 'end') {
      return !edges.value.some((edge) => edge.target === node.id)
    }

    return !edges.value.some((edge) => edge.target === node.id) || !edges.value.some((edge) => edge.source === node.id)
  })

  if (disconnectedNode) {
    return `节点“${disconnectedNode.label}”未正确连接`
  }

  const reachableFromStart = collectReachableNodeIds(startNode.id, edges.value)

  if (!reachableFromStart.has(endNode.id)) {
    return '流程无法从开始节点到达结束节点'
  }

  const reachableToEnd = collectReachableNodeIds(endNode.id, reverseEdges(edges.value))
  const isolatedNode = nodes.value.find(
    (node) => !reachableFromStart.has(node.id) || !reachableToEnd.has(node.id),
  )

  if (isolatedNode) {
    return `节点“${isolatedNode.label}”所在分支无法完整流转到结束节点`
  }

  const parallelGateway = nodes.value.find((node) => node.type === 'parallel-gateway')

  if (parallelGateway) {
    const mergeNodes = nodes.value.filter((node) => node.type === 'merge-gateway')
    const branchEdges = edges.value.filter((edge) => edge.source === parallelGateway.id)

    if (branchEdges.length < 2) {
      return '并行分支节点至少需要连接两个分支'
    }

    if (mergeNodes.length === 0) {
      return '并行分支节点必须存在对应的汇聚节点'
    }

    const mergeIdSet = new Set(mergeNodes.map((node) => node.id))
    const invalidBranch = branchEdges.find((edge) => !canReachAnyMerge(edge.target, mergeIdSet))

    if (invalidBranch) {
      return '每条并行分支都必须汇聚到汇聚节点'
    }
  }

  const mergeNode = nodes.value.find((node) => node.type === 'merge-gateway')

  if (mergeNode) {
    const incomingMergeEdges = edges.value.filter((edge) => edge.target === mergeNode.id)

    if (incomingMergeEdges.length < 2) {
      return '汇聚节点至少需要接收两个并行分支'
    }
  }

  return ''
}

function collectReachableNodeIds(startNodeId: string, edgeList: WorkflowEdge[]) {
  const reachable = new Set<string>()
  const stack = [startNodeId]

  while (stack.length > 0) {
    const currentNodeId = stack.pop()

    if (!currentNodeId || reachable.has(currentNodeId)) {
      continue
    }

    reachable.add(currentNodeId)
    edgeList
      .filter((edge) => edge.source === currentNodeId)
      .forEach((edge) => {
        stack.push(edge.target)
      })
  }

  return reachable
}

function reverseEdges(edgeList: WorkflowEdge[]) {
  return edgeList.map((edge) => ({
    id: edge.id,
    source: edge.target,
    target: edge.source,
  }))
}

function canReachAnyMerge(startNodeId: string, mergeIdSet: Set<string>) {
  const reachable = collectReachableNodeIds(startNodeId, edges.value)

  return [...mergeIdSet].some((mergeId) => reachable.has(mergeId))
}
</script>

<template>
  <section class="workflow-settings-page" aria-label="批次审批流设置">
    <header class="workflow-toolbar-card">
      <div class="workflow-title-area">
        <el-button class="workflow-back-button" @click="emit('back')">{{ props.backLabel ?? '返回批次' }}</el-button>
        <div>
          <h1>审批流设置</h1>
          <p>{{ getBatchDisplayName() }}，{{ getBatchDisplayCode() }}</p>
        </div>
      </div>

      <div class="workflow-toolbar-actions">
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handlePublishWorkflow">发布流程</el-button>
      </div>
    </header>

    <section v-if="props.showUsageRemark" class="workflow-meta-card" aria-label="审批流基础信息">
      <div class="workflow-meta-title">
        <h2>审批流基础信息</h2>
        <p>说明该审批流用于哪个业务场景，方便后续各模块复用。</p>
      </div>

      <div class="workflow-meta-grid">
        <label class="workflow-field">
          <span>审批流名称</span>
          <el-input v-model.trim="workflowMeta.name" maxlength="60" placeholder="请输入审批流名称" />
        </label>
        <label class="workflow-field">
          <span>审批流编码</span>
          <el-input v-model.trim="workflowMeta.code" maxlength="40" placeholder="请输入审批流编码" />
        </label>
        <label class="workflow-field">
          <span>适用业务</span>
          <el-input v-model.trim="workflowMeta.scope" maxlength="60" placeholder="例如：季度推进会、项目申报与立项" />
        </label>
        <label class="workflow-field workflow-meta-remark">
          <span>用途备注</span>
          <el-input
            v-model="workflowMeta.remark"
            type="textarea"
            maxlength="300"
            show-word-limit
            :rows="3"
            placeholder="备注该审批流用于哪个方面，以及后续由哪些业务模块调用"
          />
        </label>
      </div>
    </section>

    <section class="workflow-designer-shell">
      <aside class="workflow-left-panel">
        <section class="workflow-side-section">
          <h2>节点组件</h2>
          <p>拖拽到画布中使用</p>
          <div class="workflow-palette-grid">
            <article
              v-for="item in workflowPaletteItems"
              :key="item.type"
              class="workflow-palette-card"
              draggable="true"
              @dragstart="handlePaletteDragStart($event, item)"
            >
              <span :class="['workflow-palette-icon', `is-${item.type}`]">{{ getNodeIconText(item) }}</span>
              <div>
                <strong>{{ item.label }}</strong>
                <small>{{ item.hint }}</small>
              </div>
            </article>
          </div>
        </section>

        <section class="workflow-side-section workflow-approver-section">
          <h2>审批人员</h2>
          <el-input
            v-model="personKeyword"
            clearable
            placeholder="搜索姓名或部门"
            aria-label="搜索审批人员"
          />

          <div class="workflow-people-list">
            <article
              v-for="person in filteredApprovers"
              :key="person.id"
              class="workflow-person-card"
              draggable="true"
              @dragstart="handlePersonDragStart($event, person)"
            >
              <span class="workflow-person-avatar">{{ person.name.slice(0, 1) }}</span>
              <div>
                <strong>{{ person.name }}</strong>
                <small>{{ person.role }}</small>
              </div>
              <span class="workflow-person-dept">{{ person.department }}</span>
            </article>
          </div>

          <el-alert
            class="workflow-drag-tip"
            title="人员可直接拖入画布"
            description="系统会自动生成一个审批节点。"
            type="info"
            :closable="false"
            show-icon
          />
        </section>
      </aside>

      <main class="workflow-canvas-panel">
        <header class="workflow-canvas-toolbar">
          <div class="workflow-example-switch">
            <span>流程画布</span>
            <el-button
              :type="currentTemplate === 'serial' ? 'primary' : 'default'"
              @click="applyTemplate('serial')"
            >
              串行 1-1-1
            </el-button>
            <el-button
              :type="currentTemplate === 'parallel' ? 'primary' : 'default'"
              @click="applyTemplate('parallel')"
            >
              并行 1-3-1
            </el-button>
          </div>

          <div class="workflow-view-actions">
            <el-button @click="autoLayout">自动布局</el-button>
            <el-button @click="fitCanvas">适应画布</el-button>
            <el-button @click="zoomOut">-</el-button>
            <span>{{ Math.round(zoom * 100) }}%</span>
            <el-button @click="zoomIn">+</el-button>
            <el-button @click="centerCanvas">居中</el-button>
            <el-button type="danger" plain @click="deleteSelected">删除选中</el-button>
          </div>
        </header>

        <div
          ref="canvasRef"
          class="workflow-canvas-viewport"
          @dragover.prevent
          @drop="handleCanvasDrop"
          @click="pendingSourceNodeId = ''"
        >
          <div class="workflow-canvas-content" :style="canvasTransformStyle">
            <svg
              class="workflow-edges-layer"
              :width="canvasSize.width"
              :height="canvasSize.height"
              aria-label="审批流连线"
            >
              <defs>
                <marker
                  id="workflow-arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
              </defs>
              <path
                v-for="edge in edges"
                :key="edge.id"
                :class="['workflow-edge-path', { selected: selectedEdgeId === edge.id }]"
                :d="getEdgePath(edge)"
                marker-end="url(#workflow-arrow)"
                @click.stop="selectEdge(edge.id)"
              />
            </svg>

            <article
              v-for="node in nodes"
              :key="node.id"
              :class="getNodeClass(node)"
              :style="getNodeStyle(node)"
              @click.stop="handleNodeClick(node)"
              @pointerdown="startNodeDrag($event, node)"
            >
              <button
                v-if="node.type !== 'start'"
                class="workflow-port workflow-port-target"
                type="button"
                aria-label="作为连线终点"
                @click.stop="finishConnection(node)"
              ></button>
              <button
                v-if="node.type !== 'end'"
                class="workflow-port workflow-port-source"
                type="button"
                aria-label="作为连线起点"
                @click.stop="startConnection(node)"
              ></button>

              <template v-if="node.type === 'parallel-gateway' || node.type === 'merge-gateway'">
                <span :class="['workflow-gateway-mark', `is-${node.type}`]">
                  {{ node.type === 'parallel-gateway' ? '+' : '✓' }}
                </span>
                <strong>{{ node.label }}</strong>
              </template>

              <template v-else>
                <span :class="['workflow-node-icon', `is-${node.type}`]">{{ getNodeIconText(node) }}</span>
                <div class="workflow-node-copy">
                  <strong>{{ node.label }}</strong>
                  <small>{{ getNodeSubText(node) }}</small>
                </div>
              </template>
            </article>
          </div>

          <div v-if="pendingSourceNodeId" class="workflow-connect-tip">
            已选择“{{ getNodeLabelById(pendingSourceNodeId) }}”，点击下游节点本体或左侧连接点完成连线
          </div>
          <div class="workflow-structure-pill">当前结构：{{ structureLabel }}</div>
        </div>
      </main>

      <aside class="workflow-config-panel">
        <template v-if="selectedNode">
          <header class="workflow-config-header">
            <div>
              <h2>节点配置</h2>
              <p>{{ selectedNode.label }}</p>
            </div>
            <el-tag v-if="selectedNode.type === 'approval'" effect="plain">审批节点</el-tag>
            <el-tag v-else effect="plain" type="info">流程节点</el-tag>
          </header>

          <section v-if="selectedNode.type === 'approval'" class="workflow-config-form">
            <label class="workflow-field">
              <span>节点名称</span>
              <el-input :model-value="selectedNode.label" @update:model-value="updateSelectedNodeLabel" />
            </label>

            <label class="workflow-field">
              <span>审批类型</span>
              <el-input model-value="单人审批" readonly />
            </label>

            <label class="workflow-field">
              <span>审批人员</span>
              <el-select
                :model-value="selectedNode.data.assigneeId"
                placeholder="请选择审批人员"
                @change="updateSelectedAssignee"
              >
                <el-option
                  v-if="selectedNode.data.assigneeId === 'initiator'"
                  label="项目负责人 / 发起人"
                  value="initiator"
                  disabled
                />
                <el-option
                  v-for="person in workflowApprovers"
                  :key="person.id"
                  :label="`${person.name} / ${person.role}`"
                  :value="person.id"
                />
              </el-select>
            </label>

            <label class="workflow-field">
              <span>所属部门</span>
              <el-input :model-value="selectedNode.data.department || '未选择人员'" readonly />
            </label>

            <div class="workflow-field">
              <span>驳回后返回</span>
              <el-radio-group
                :model-value="selectedNode.data.rejectTo || 'initiator'"
                @update:model-value="updateSelectedRejectTo"
              >
                <el-radio value="initiator">退回发起人</el-radio>
                <el-radio value="previous">退回上一节点</el-radio>
              </el-radio-group>
            </div>

            <div class="workflow-switch-row">
              <span>允许填写审批意见</span>
              <el-switch
                :model-value="selectedNode.data.allowComment ?? true"
                @update:model-value="updateSelectedAllowComment"
              />
            </div>

            <el-button class="workflow-delete-node-button" type="danger" plain @click="deleteSelectedNode">
              删除节点
            </el-button>
          </section>

          <section v-else-if="selectedNode.type === 'parallel-gateway'" class="workflow-config-form">
            <div class="workflow-info-block">
              <span>分支数量</span>
              <strong>{{ parallelBranchCount }}</strong>
              <p>该节点会把流程拆分为多个独立审批分支，各分支同步执行。</p>
            </div>
            <el-alert
              title="并行审批说明"
              description="三名审批人需要配置为三个独立审批节点，不合并为一个会签节点。"
              type="info"
              :closable="false"
              show-icon
            />
            <el-button class="workflow-delete-node-button" type="danger" plain @click="deleteSelectedNode">
              删除节点
            </el-button>
          </section>

          <section v-else-if="selectedNode.type === 'merge-gateway'" class="workflow-config-form">
            <div class="workflow-info-block">
              <span>汇聚规则</span>
              <strong>所有并行节点全部通过</strong>
              <p>只有全部并行分支通过后，流程才会继续进入后续节点。</p>
            </div>
            <el-button class="workflow-delete-node-button" type="danger" plain @click="deleteSelectedNode">
              删除节点
            </el-button>
          </section>

          <section v-else class="workflow-config-form">
            <div class="workflow-info-block">
              <span>节点说明</span>
              <strong>{{ selectedNode.type === 'start' ? '流程起点' : '流程终点' }}</strong>
              <p>
                {{
                  selectedNode.type === 'start'
                    ? '开始节点用于标识批次审批流程的发起位置。'
                    : '结束节点用于标识批次审批流程全部完成。'
                }}
              </p>
            </div>
          </section>
        </template>

        <template v-else-if="selectedEdge">
          <header class="workflow-config-header">
            <div>
              <h2>连线配置</h2>
              <p>{{ selectedEdgeSourceLabel }} → {{ selectedEdgeTargetLabel }}</p>
            </div>
            <el-tag effect="plain" type="info">连线</el-tag>
          </header>
          <section class="workflow-config-form">
            <div class="workflow-info-block">
              <span>流转方向</span>
              <strong>{{ selectedEdgeSourceLabel }} → {{ selectedEdgeTargetLabel }}</strong>
              <p>该连线表示上游节点办理完成后流转到下游节点。</p>
            </div>
            <el-button type="danger" plain @click="deleteSelectedEdge">删除连线</el-button>
          </section>
        </template>

        <el-empty v-else description="请选择画布中的节点或连线" />

        <p class="workflow-prototype-note">原型展示模式：数据仅保存到当前浏览器会话</p>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.workflow-settings-page {
  display: grid;
  gap: 16px;
}

.workflow-toolbar-card {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 26px;
  border: 1px solid var(--line, #e8edf5);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow, 0 8px 28px rgba(25, 45, 80, 0.07));
}

.workflow-title-area {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.workflow-back-button {
  flex: 0 0 auto;
}

.workflow-title-area h1 {
  margin: 0;
  color: var(--text, #172033);
  font-size: 24px;
  font-weight: 780;
}

.workflow-title-area p {
  margin: 6px 0 0;
  color: #758299;
  font-size: 13px;
}

.workflow-meta-card {
  min-width: 0;
  display: grid;
  gap: 18px;
  padding: 20px 24px;
  border: 1px solid var(--line, #e8edf5);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow, 0 8px 28px rgba(25, 45, 80, 0.07));
}

.workflow-meta-title h2 {
  margin: 0;
  color: var(--text, #172033);
  font-size: 18px;
  font-weight: 760;
}

.workflow-meta-title p {
  margin: 6px 0 0;
  color: #7d899d;
  font-size: 12px;
}

.workflow-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 18px;
}

.workflow-meta-remark {
  grid-column: 1 / -1;
}

.workflow-toolbar-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.workflow-toolbar-actions :deep(.el-button) {
  min-width: 104px;
  margin-left: 0;
}

.workflow-designer-shell {
  min-height: 696px;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 320px;
  gap: 0;
  overflow: hidden;
  border: 1px solid var(--line, #e8edf5);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow, 0 8px 28px rgba(25, 45, 80, 0.07));
}

.workflow-left-panel,
.workflow-config-panel {
  min-width: 0;
  padding: 22px 20px;
  background: #fbfdff;
}

.workflow-left-panel {
  border-right: 1px solid #e8edf5;
}

.workflow-config-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e8edf5;
}

.workflow-side-section {
  display: grid;
  gap: 12px;
}

.workflow-side-section + .workflow-side-section {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px solid #e7edf6;
}

.workflow-side-section h2,
.workflow-config-header h2 {
  margin: 0;
  color: #172033;
  font-size: 17px;
  font-weight: 760;
}

.workflow-side-section p,
.workflow-config-header p {
  margin: 0;
  color: #8793a8;
  font-size: 12px;
}

.workflow-palette-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.workflow-palette-card {
  min-width: 0;
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #dde6f2;
  border-radius: 10px;
  background: #fff;
  cursor: grab;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.workflow-palette-card:hover {
  border-color: #b8d0f7;
  box-shadow: 0 10px 22px rgba(40, 92, 160, 0.08);
  transform: translateY(-1px);
}

.workflow-palette-card:active,
.workflow-person-card:active {
  cursor: grabbing;
}

.workflow-palette-icon,
.workflow-node-icon {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #2563eb;
  background: #eef5ff;
  font-size: 12px;
  font-weight: 760;
}

.workflow-palette-icon {
  width: 26px;
  height: 26px;
}

.workflow-node-icon {
  width: 34px;
  height: 34px;
}

.workflow-palette-icon.is-start,
.workflow-node-icon.is-start {
  color: #0f8f67;
  background: #e8f8f1;
}

.workflow-palette-icon.is-end,
.workflow-node-icon.is-end {
  color: #64748b;
  background: #eef2f6;
}

.workflow-palette-icon.is-parallel-gateway,
.workflow-palette-icon.is-merge-gateway {
  color: #7c5cf0;
  background: #f1edff;
}

.workflow-palette-card strong,
.workflow-person-card strong {
  display: block;
  color: #22324d;
  font-size: 13px;
  font-weight: 720;
}

.workflow-palette-card small,
.workflow-person-card small {
  display: block;
  margin-top: 2px;
  color: #8a96aa;
  font-size: 11px;
  line-height: 1.35;
}

.workflow-people-list {
  display: grid;
  gap: 10px;
}

.workflow-person-card {
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #dfe7f2;
  border-radius: 10px;
  background: #fff;
  cursor: grab;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.workflow-person-card:hover {
  border-color: #b8d0f7;
  box-shadow: 0 10px 22px rgba(40, 92, 160, 0.08);
  transform: translateY(-1px);
}

.workflow-person-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: #3177ec;
  background: #edf4ff;
  font-size: 13px;
  font-weight: 760;
}

.workflow-person-dept {
  color: #97a2b4;
  font-size: 11px;
}

.workflow-drag-tip {
  margin-top: 4px;
  border-radius: 10px;
}

.workflow-canvas-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.workflow-canvas-toolbar {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid #e8edf5;
  background: rgba(255, 255, 255, 0.92);
}

.workflow-example-switch,
.workflow-view-actions {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.workflow-example-switch > span {
  margin-right: 8px;
  color: #243550;
  font-size: 14px;
  font-weight: 730;
}

.workflow-view-actions > span {
  min-width: 48px;
  color: #6f7e96;
  font-size: 12px;
  text-align: center;
}

.workflow-view-actions :deep(.el-button),
.workflow-example-switch :deep(.el-button) {
  margin-left: 0;
}

.workflow-canvas-viewport {
  position: relative;
  flex: 1;
  min-height: 630px;
  overflow: hidden;
  background:
    radial-gradient(circle, rgba(65, 128, 238, 0.12) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(180deg, #fbfdff 0%, #f8fbff 100%);
}

.workflow-canvas-content {
  position: absolute;
  inset: 0 auto auto 0;
  transform-origin: 0 0;
}

.workflow-edges-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
}

.workflow-edges-layer marker path {
  fill: #9fb1ca;
}

.workflow-edge-path {
  fill: none;
  stroke: #a8bad1;
  stroke-width: 2;
  pointer-events: stroke;
  cursor: pointer;
}

.workflow-edge-path:hover,
.workflow-edge-path.selected {
  stroke: #3478ee;
  stroke-width: 3;
}

.workflow-node {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #dbe5f2;
  border-radius: 12px;
  color: #1c2d4a;
  background: #fff;
  box-shadow: 0 10px 24px rgba(23, 45, 78, 0.06);
  cursor: grab;
  user-select: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.workflow-node.selected {
  border-color: #3478ee;
  box-shadow:
    0 0 0 3px rgba(52, 120, 238, 0.12),
    0 14px 28px rgba(35, 92, 166, 0.12);
}

.workflow-node.connecting {
  border-color: #7b5cf5;
  box-shadow:
    0 0 0 3px rgba(123, 92, 245, 0.12),
    0 14px 28px rgba(58, 44, 130, 0.1);
}

.workflow-node:active {
  cursor: grabbing;
}

.workflow-node-start {
  justify-content: center;
  border-color: #99dec7;
  border-radius: 999px;
  background: #ebfbf5;
}

.workflow-node-end {
  justify-content: center;
  border-color: #d5dce6;
  border-radius: 999px;
  background: #f7f9fc;
}

.workflow-node-approval {
  border-left: 4px solid #3478ee;
}

.workflow-node-copy {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.workflow-node strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 760;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-node small {
  overflow: hidden;
  color: #8390a5;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-node-parallel-gateway,
.workflow-node-merge-gateway {
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.workflow-gateway-mark {
  position: relative;
  isolation: isolate;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  color: #7b5cf5;
  font-size: 20px;
  font-weight: 760;
}

.workflow-gateway-mark::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border: 2px solid #7b5cf5;
  background: #fff;
  box-shadow: 0 10px 22px rgba(62, 44, 124, 0.08);
  transform: rotate(45deg);
}

.workflow-gateway-mark.is-merge-gateway::before {
  border-color: #f2a45f;
  background: #fff8f2;
}

.workflow-gateway-mark.is-merge-gateway {
  color: #d87922;
}

.workflow-gateway-mark + strong {
  max-width: 86px;
  padding: 5px 10px;
  border-radius: 999px;
  color: #6f52e8;
  background: #f1edff;
  font-size: 12px;
  text-align: center;
}

.workflow-gateway-mark.is-merge-gateway + strong {
  color: #d06d16;
  background: #fff0e4;
}

.workflow-port {
  position: absolute;
  z-index: 4;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 2px solid #91a6c2;
  border-radius: 999px;
  background: #fff;
  cursor: crosshair;
}

.workflow-port:hover {
  border-color: #3478ee;
  box-shadow: 0 0 0 4px rgba(52, 120, 238, 0.12);
}

.workflow-port-target {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
}

.workflow-port-source {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
}

.workflow-node-start .workflow-port-source,
.workflow-node-parallel-gateway .workflow-port-source,
.workflow-node-merge-gateway .workflow-port-source {
  top: auto;
  right: auto;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.workflow-node-end .workflow-port-target,
.workflow-node-parallel-gateway .workflow-port-target,
.workflow-node-merge-gateway .workflow-port-target {
  top: -6px;
  right: auto;
  left: 50%;
  transform: translateX(-50%);
}

.workflow-connect-tip,
.workflow-structure-pill {
  position: absolute;
  z-index: 5;
  left: 20px;
  border: 1px solid #d7e5fb;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #4e6381;
  box-shadow: 0 10px 24px rgba(25, 45, 80, 0.08);
  backdrop-filter: blur(12px);
  font-size: 12px;
}

.workflow-connect-tip {
  bottom: 58px;
  padding: 9px 14px;
}

.workflow-structure-pill {
  bottom: 20px;
  padding: 9px 16px;
}

.workflow-structure-pill::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 999px;
  background: #3478ee;
}

.workflow-config-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e6edf6;
}

.workflow-config-form {
  display: grid;
  gap: 18px;
  padding-top: 20px;
}

.workflow-field {
  display: grid;
  gap: 8px;
}

.workflow-field > span,
.workflow-switch-row > span {
  color: #33445f;
  font-size: 13px;
  font-weight: 700;
}

.workflow-field :deep(.el-select),
.workflow-field :deep(.el-input) {
  width: 100%;
}

.workflow-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.workflow-info-block {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid #dde7f4;
  border-radius: 12px;
  background: #fff;
}

.workflow-info-block span {
  color: #8390a5;
  font-size: 12px;
}

.workflow-info-block strong {
  color: #172033;
  font-size: 16px;
  font-weight: 760;
}

.workflow-info-block p {
  margin: 0;
  color: #768399;
  font-size: 12px;
  line-height: 1.7;
}

.workflow-delete-node-button {
  justify-self: start;
  margin-top: 6px;
}

.workflow-prototype-note {
  margin: auto 0 0;
  padding-top: 20px;
  color: #9aa5b6;
  font-size: 12px;
}

@media (max-width: 1280px) {
  .workflow-designer-shell {
    grid-template-columns: 220px minmax(0, 1fr) 280px;
  }

  .workflow-palette-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1040px) {
  .workflow-toolbar-card,
  .workflow-canvas-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .workflow-toolbar-actions,
  .workflow-view-actions {
    width: 100%;
  }

  .workflow-meta-grid {
    grid-template-columns: 1fr;
  }

  .workflow-designer-shell {
    grid-template-columns: 1fr;
  }

  .workflow-left-panel,
  .workflow-config-panel {
    border: 0;
  }

  .workflow-left-panel {
    border-bottom: 1px solid #e8edf5;
  }

  .workflow-config-panel {
    border-top: 1px solid #e8edf5;
  }

  .workflow-palette-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .workflow-toolbar-card,
  .workflow-meta-card,
  .workflow-left-panel,
  .workflow-config-panel {
    padding: 18px;
  }

  .workflow-title-area {
    align-items: flex-start;
    flex-direction: column;
  }

  .workflow-toolbar-actions :deep(.el-button),
  .workflow-back-button {
    width: 100%;
  }

  .workflow-palette-grid {
    grid-template-columns: 1fr;
  }

  .workflow-person-card {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .workflow-person-dept {
    grid-column: 2;
  }
}
</style>
