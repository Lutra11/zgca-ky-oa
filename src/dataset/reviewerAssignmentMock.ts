// 指定子方向与评委 — 演示 mock 数据(原型移植)
export interface ReviewerItem {
  userId: number
  username: string
  reviewerName: string
}

export interface ProjectItem {
  id: string
  projectCode: string
  projectName: string
  projectBatch: string
  projectType?: string
  status: string
  faculty: string
  subDirection: string
  projectLeader: string
  materialStatus: string
  deadline: string
  is_submmited_materials?: number | boolean | null
  reviewerUserId?: string | number | null
  reviewerName?: string | null
  reviewerUsername?: string | null
  assignedReviewerName?: string | null
  assignedReviewerUsername?: string | null
  reviewer?: ReviewerItem | null
  reviewers?: Array<{
    userId: string | number
    username?: string | null
    name?: string | null
    reviewerName?: string | null
  }>
}

const subDirections = [
  '人工智能-机器学习-基础理论-大模型与推理',
  '人工智能-机器学习-基础理论-智能体与规划',
  '人工智能-计算机视觉-应用技术-多模态感知',
  '人工智能-计算机视觉-应用技术-工业质检',
  '人工智能-自然语言处理-应用技术-知识图谱',
  '人工智能-自然语言处理-应用技术-对话系统',
]

export const mockReviewerRows: ReviewerItem[] = [
  { userId: 101, username: '闵耀森', reviewerName: '闵耀森' },
  { userId: 102, username: '杨耀东', reviewerName: '杨耀东' },
  { userId: 103, username: '陈宇轩', reviewerName: '陈宇轩' },
  { userId: 104, username: '李雨桐', reviewerName: '李雨桐' },
  { userId: 105, username: '赵文博', reviewerName: '赵文博' },
  { userId: 106, username: '周建国', reviewerName: '周建国' },
  { userId: 107, username: '顾一凡', reviewerName: '顾一凡' },
  { userId: 108, username: '王赫', reviewerName: '王赫' },
  { userId: 109, username: '孙浩然', reviewerName: '孙浩然' },
  { userId: 110, username: '吴沛霖', reviewerName: '吴沛霖' },
  { userId: 111, username: '郑一鸣', reviewerName: '郑一鸣' },
  { userId: 112, username: '刘慧敏', reviewerName: '刘慧敏' },
  { userId: 113, username: '张启铭', reviewerName: '张启铭' },
  { userId: 114, username: '林可昕', reviewerName: '林可昕' },
  { userId: 115, username: '何思远', reviewerName: '何思远' },
  { userId: 116, username: '唐雨薇', reviewerName: '唐雨薇' },
  { userId: 117, username: '冯凯文', reviewerName: '冯凯文' },
  { userId: 118, username: '苏婉晴', reviewerName: '苏婉晴' },
]

const projectSeeds: Array<{
  code: string
  name: string
  batch: string
  leader: string
  faculty: string
  sub: string
  status: string
  submitted: boolean
  reviewers: number[]
}> = [
  { code: 'AP-2026-B1-001', name: '面向具身智能的可信对齐关键技术研究', batch: '2026年第一批基础培育类', leader: '王赫', faculty: 'AI核心学部', sub: subDirections[0], status: '评审中', submitted: true, reviewers: [101, 104] },
  { code: 'AP-2026-B1-002', name: '大规模图神经网络的分布式训练框架研究', batch: '2026年第一批基础培育类', leader: '孙浩然', faculty: 'AI核心学部', sub: subDirections[1], status: '评审中', submitted: true, reviewers: [] },
  { code: 'AP-2026-B1-003', name: '面向科学计算的高性能稀疏内核优化', batch: '2026年第一批基础培育类', leader: '吴沛霖', faculty: 'AI核心学部', sub: subDirections[2], status: '待形式审查', submitted: false, reviewers: [] },
  { code: 'AP-2026-B1-004', name: '机器人操作技能的模仿学习泛化', batch: '2026年第一批基础培育类', leader: '闵耀森', faculty: 'AI核心学部', sub: subDirections[1], status: '评审中', submitted: true, reviewers: [102] },
  { code: 'AP-2026-B1-005', name: '面向工业质检的视觉大模型微调平台', batch: '2026年第一批基础培育类', leader: '周建国', faculty: 'AI核心学部', sub: subDirections[3], status: '评审中', submitted: true, reviewers: [103, 108] },
  { code: 'AP-2026-B1-006', name: '基于知识图谱的教育资源语义检索研究', batch: '2026年第一批基础培育类', leader: '郑一鸣', faculty: 'AI核心学部', sub: subDirections[4], status: '待形式审查', submitted: false, reviewers: [] },
  { code: 'AP-2026-B1-007', name: '大模型推理加速与显存优化', batch: '2026年第一批基础培育类', leader: '陈宇轩', faculty: 'AI核心学部', sub: subDirections[0], status: '评审中', submitted: true, reviewers: [105] },
  { code: 'AP-2026-B1-008', name: '多智能体协同决策与安全验证', batch: '2026年第一批基础培育类', leader: '杨耀东', faculty: 'AI核心学部', sub: subDirections[1], status: '评审中', submitted: true, reviewers: [] },
  { code: 'AP-2026-B1-009', name: '跨模态检索与推荐系统联合优化', batch: '2026年第一批基础培育类', leader: '刘慧敏', faculty: 'AI核心学部', sub: subDirections[5], status: '待形式审查', submitted: false, reviewers: [] },
  { code: 'AP-2026-B1-010', name: '面向边缘设备的轻量化模型压缩', batch: '2026年第一批基础培育类', leader: '赵文博', faculty: 'AI核心学部', sub: subDirections[2], status: '评审中', submitted: true, reviewers: [107] },
  { code: 'AP-2026-B1-011', name: '联邦学习隐私保护关键技术研究', batch: '2026年第一批基础培育类', leader: '闵耀森', faculty: 'AI核心学部', sub: subDirections[4], status: '评审中', submitted: true, reviewers: [] },
  { code: 'AP-2026-B1-012', name: '开源大模型推理服务优化实践', batch: '2026年第一批基础培育类', leader: '顾一凡', faculty: 'AI核心学部', sub: subDirections[0], status: '评审中', submitted: true, reviewers: [109, 112] },
  { code: 'AP-2026-B1-013', name: '世界模型与具身导航基础研究', batch: '2026年第一批基础培育类', leader: '李雨桐', faculty: 'AI核心学部', sub: subDirections[1], status: '评审中', submitted: true, reviewers: [] },
  { code: 'AP-2026-B1-014', name: '面向医疗对话的情感计算方法研究', batch: '2026年第一批基础培育类', leader: '张启铭', faculty: 'AI核心学部', sub: subDirections[5], status: '待形式审查', submitted: false, reviewers: [] },
  { code: 'AP-2026-B1-015', name: '面向教育场景的知识追踪算法研究', batch: '2026年第一批基础培育类', leader: '林可昕', faculty: 'AI核心学部', sub: subDirections[4], status: '评审中', submitted: true, reviewers: [110] },
]

function buildProjectRows(): ProjectItem[] {
  return projectSeeds.map((seed) => ({
    id: seed.code,
    projectCode: seed.code,
    projectName: seed.name,
    projectBatch: seed.batch,
    projectType: '基础培育',
    status: seed.status,
    faculty: seed.faculty,
    subDirection: seed.sub,
    projectLeader: seed.leader,
    materialStatus: seed.submitted ? '已提交' : '未提交',
    deadline: '2026-12-20',
    is_submmited_materials: seed.submitted ? 1 : 0,
    reviewers: seed.reviewers.map((userId) => {
      const reviewer = mockReviewerRows.find((item) => item.userId === userId)
      return {
        userId,
        username: reviewer?.username ?? '',
        name: reviewer?.reviewerName ?? '',
      }
    }),
  }))
}

export const mockProjectRows: ProjectItem[] = buildProjectRows()

export function getMockProjects(): ProjectItem[] {
  return mockProjectRows.map((project) => ({ ...project }))
}

export function getMockReviewers(): ReviewerItem[] {
  return mockReviewerRows.map((reviewer) => ({ ...reviewer }))
}
