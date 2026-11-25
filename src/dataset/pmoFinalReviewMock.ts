// AN-MWUG2PQ5 / AN-MWUG3BER：PMO 流转线「初审阶段」「复审阶段」mock
// 三学部对本批次申报项目的初审评审结果 + 复审过程监控数据（示例数据）
import type { FinalReviewSummaryRow } from './finalReviewReportMock'

export interface PMOFacultyFinalSummary {
  /** 学部名称 */
  academy: string
  /** 申报数 */
  declaredCount: number
  /** 拟推荐进入复审数 */
  recommendedCount: number
  /** 平均分（展示用） */
  averageScore: string
  /** 各项目初审结果 */
  rows: FinalReviewSummaryRow[]
}

const aiCoreRows: FinalReviewSummaryRow[] = [
  { seq: 1, originalSeq: 1, projectName: '基础模型持续学习与在线适应研究', leader: '张骁庆', subDirection: 'AI 模型', score: '86.00', zScore: '1.13', strategicStar: false, rankChange: '-', majorProject: '拟申请腾讯大模型基座与强化学习合作项目', reviewComment: '选题贴切，直面持续学习与遗忘难题，方案成熟。', recommended: true },
  { seq: 2, originalSeq: 2, projectName: '主动交互与自进化物理 AI 关键技术研究', leader: '唐郁钰', subDirection: '具身智能', score: '86.00', zScore: '1.13', strategicStar: true, rankChange: 'up', majorProject: '对接 CYY 大模型后训练与 AI for 空天项目', reviewComment: '面向物理 AI 前沿方向，与学部战略高度关联。', recommended: true },
  { seq: 3, originalSeq: 3, projectName: '面向具身智能的精密感知与仿生操作策略研究', leader: '胡耀清', subDirection: '具身智能', score: '85.33', zScore: '0.95', strategicStar: true, rankChange: '-', majorProject: '学部具身智能与物理世界 AGI 战略布局', reviewComment: '聚焦精密感知与操作，研究基础扎实。', recommended: true },
  { seq: 4, originalSeq: 4, projectName: '人类知识与自主进化协同的 AI4A 机制研究', leader: '付靖文', subDirection: '理论与算法', score: '84.00', zScore: '0.71', strategicStar: false, rankChange: 'down', majorProject: '新路径探索·大模型与科研智能体方向基础研究', reviewComment: '面向 AI4A 国际前沿，人机知识协同角度新颖。', recommended: true },
  { seq: 5, originalSeq: 5, projectName: '机器人形态-技能协同自进化理论与方法研究', leader: '丁加涛', subDirection: '具身智能', score: '83.67', zScore: '0.58', strategicStar: false, rankChange: '-', majorProject: '支撑学部具身智能方向整体布局', reviewComment: '形态控制与技能打通融合，方案完整。', recommended: true },
  { seq: 6, originalSeq: 6, projectName: '持续学习与无上限上下文大模型', leader: '王培栋', subDirection: 'AI 模型', score: '82.00', zScore: '0.21', strategicStar: false, rankChange: 'up', majorProject: 'AI 全栈关键技术攻关·持续学习方向', reviewComment: '主线清晰，直接对接 AI Core 布局。', recommended: true },
  { seq: 7, originalSeq: 7, projectName: '未来预测驱动的大模型自进化', leader: '段易通', subDirection: 'AI 模型', score: '78.33', zScore: '-0.72', strategicStar: false, rankChange: '-', majorProject: '拓展数据谱系、推进训练范式前沿布局', reviewComment: '抓住生成式预训练后的自进化反馈方向。', recommended: true },
  { seq: 8, originalSeq: 8, projectName: '模型不可信条件下智能体安全防御研究', leader: '徐枭云', subDirection: 'AI 安全', score: '72.00', zScore: '-1.65', strategicStar: false, rankChange: 'down', majorProject: '可学习可交互可持续进化的完整智能体环', reviewComment: '选题有价值，但算力与数据保障论证不足，暂缓推荐。', recommended: false },
]

const roboticsRows: FinalReviewSummaryRow[] = [
  { seq: 1, originalSeq: 1, projectName: '工业级双臂协同装配系统关键技术研究', leader: '刘子航', subDirection: '工业机器人', score: '84.67', zScore: '0.88', strategicStar: true, rankChange: '-', majorProject: '对接高端装备智能制造国家重大专项预研', reviewComment: '面向产线真实需求，双臂协同方案完整可行。', recommended: true },
  { seq: 2, originalSeq: 2, projectName: '柔性作业场景下的机器人技能学习方法研究', leader: '陈昱霖', subDirection: '工业机器人', score: '83.33', zScore: '0.62', strategicStar: false, rankChange: 'up', majorProject: '校企合作智能制造联合攻关项目', reviewComment: '技能学习与柔性作业结合紧密，评价体系清晰。', recommended: true },
  { seq: 3, originalSeq: 3, projectName: '面向多机型混线的视觉引导定位与质检系统', leader: '吴桐', subDirection: '机器视觉', score: '82.00', zScore: '0.35', strategicStar: false, rankChange: '-', majorProject: '拟申请工信部产业基础再造专项相关课题', reviewComment: '工程价值突出，建议补充复杂光照下的鲁棒性论证。', recommended: true },
  { seq: 4, originalSeq: 4, projectName: '移动操作机器人在立体仓储中的调度与规划', leader: '郑予安', subDirection: '工业机器人', score: '80.33', zScore: '0.08', strategicStar: false, rankChange: 'down', majorProject: '智慧物流园区联合实验室项目', reviewComment: '调度算法有创新，实机验证覆盖不足。', recommended: true },
  { seq: 5, originalSeq: 5, projectName: '人形机器人整机关节驱动一体化设计', leader: '何朗', subDirection: '核心部件', score: '79.67', zScore: '-0.12', strategicStar: true, rankChange: '-', majorProject: '人形机器人整机研制重大工程储备课题', reviewComment: '关节一体化设计与学部战略契合，样机进度合理。', recommended: true },
  { seq: 6, originalSeq: 6, projectName: '面向小批量产线的机器人快速编程系统', leader: '孙梦遥', subDirection: '机器视觉', score: '71.67', zScore: '-1.38', strategicStar: false, rankChange: '-', majorProject: '——', reviewComment: '技术路线偏工程整合，创新性论证不足，暂缓推荐。', recommended: false },
]

const biomedRows: FinalReviewSummaryRow[] = [
  { seq: 1, originalSeq: 1, projectName: '面向多模态医学影像的可信融合诊断方法研究', leader: '林清越', subDirection: '医学影像', score: '85.00', zScore: '0.91', strategicStar: true, rankChange: '-', majorProject: '对接国家重点研发计划生物与信息融合专项', reviewComment: '可信融合框架完整，临床数据合规，推荐进入复审。', recommended: true },
  { seq: 2, originalSeq: 2, projectName: '医学大模型的临床决策支持与安全对齐研究', leader: '沈嘉', subDirection: '医学 NLP', score: '83.00', zScore: '0.55', strategicStar: true, rankChange: 'up', majorProject: '学部医学智能体战略牵引·头部医院联合课题', reviewComment: '安全对齐设计系统，落地路径清晰。', recommended: true },
  { seq: 3, originalSeq: 3, projectName: '手术导航中的实时形变配准与可视化算法', leader: '顾亦帆', subDirection: '手术导航', score: '81.00', zScore: '0.19', strategicStar: false, rankChange: '-', majorProject: '拟申请医疗机器人旗舰专项子课题', reviewComment: '形变配准算法有突破，实时性验证充分。', recommended: true },
  { seq: 4, originalSeq: 4, projectName: '面向慢病管理的可解释风险预测与分层干预', leader: '贺望舒', subDirection: '健康数据', score: '80.00', zScore: '-0.05', strategicStar: false, rankChange: 'down', majorProject: '区域健康医疗大数据平台联合项目', reviewComment: '可解释性设计到位，干预方案需进一步细化。', recommended: true },
  { seq: 5, originalSeq: 5, projectName: '医学知识图谱辅助的罕见病辅助诊断系统', leader: '梁叙', subDirection: '医学 NLP', score: '73.33', zScore: '-1.42', strategicStar: false, rankChange: '-', majorProject: '——', reviewComment: '数据来源分散、标注成本论证不足，暂缓推荐。', recommended: false },
]

/** AN-MWUG2PQ5：三个学部对本批次申报项目的初审结果汇总 */
export const pmoFinalFacultySummaries: PMOFacultyFinalSummary[] = [
  { academy: '人工智能核心学部', declaredCount: 8, recommendedCount: 7, averageScore: '82.1', rows: aiCoreRows },
  { academy: '智能制造与机器人学部', declaredCount: 6, recommendedCount: 5, averageScore: '80.3', rows: roboticsRows },
  { academy: '生物医学信息学部', declaredCount: 5, recommendedCount: 4, averageScore: '80.5', rows: biomedRows },
]

export interface PMORecheckMonitorRow {
  projectName: string
  academy: string
  leader: string
  /** 初审得分 */
  finalScore: string
  /** 复审评委 */
  recheckReviewers: string[]
  /** 已提交评分人数 */
  submittedCount: number
  /** 复审评委人数 */
  totalCount: number
  status: '待启动' | '进行中' | '已完成'
  latestUpdate: string
}

/** AN-MWUG3BER：PMO 复审阶段过程监控（基于初审通过项目指派复审评委） */
export const pmoRecheckMonitorRows: PMORecheckMonitorRow[] = [
  { projectName: '主动交互与自进化物理 AI 关键技术研究', academy: '人工智能核心学部', leader: '唐郁钰', finalScore: '86.00', recheckReviewers: ['陈立群', '周天华', '吴敏'], submittedCount: 3, totalCount: 3, status: '已完成', latestUpdate: '2026-11-23 17:20' },
  { projectName: '基础模型持续学习与在线适应研究', academy: '人工智能核心学部', leader: '张骁庆', finalScore: '86.00', recheckReviewers: ['陈立群', '周天华', '吴敏'], submittedCount: 2, totalCount: 3, status: '进行中', latestUpdate: '2026-11-23 16:45' },
  { projectName: '面向具身智能的精密感知与仿生操作策略研究', academy: '人工智能核心学部', leader: '胡耀清', finalScore: '85.33', recheckReviewers: ['陈立群', '刘屹'], submittedCount: 1, totalCount: 2, status: '进行中', latestUpdate: '2026-11-23 15:10' },
  { projectName: '人类知识与自主进化协同的 AI4A 机制研究', academy: '人工智能核心学部', leader: '付靖文', finalScore: '84.00', recheckReviewers: ['周天华', '刘屹', '苏雯'], submittedCount: 0, totalCount: 3, status: '待启动', latestUpdate: '——' },
  { projectName: '机器人形态-技能协同自进化理论与方法研究', academy: '人工智能核心学部', leader: '丁加涛', finalScore: '83.67', recheckReviewers: ['陈立群', '苏雯'], submittedCount: 2, totalCount: 2, status: '已完成', latestUpdate: '2026-11-22 19:05' },
  { projectName: '持续学习与无上限上下文大模型', academy: '人工智能核心学部', leader: '王培栋', finalScore: '82.00', recheckReviewers: ['刘屹', '苏雯'], submittedCount: 1, totalCount: 2, status: '进行中', latestUpdate: '2026-11-23 11:30' },
  { projectName: '工业级双臂协同装配系统关键技术研究', academy: '智能制造与机器人学部', leader: '刘子航', finalScore: '84.67', recheckReviewers: ['黄志强', '马继业', '罗静'], submittedCount: 3, totalCount: 3, status: '已完成', latestUpdate: '2026-11-23 14:40' },
  { projectName: '柔性作业场景下的机器人技能学习方法研究', academy: '智能制造与机器人学部', leader: '陈昱霖', finalScore: '83.33', recheckReviewers: ['黄志强', '马继业'], submittedCount: 2, totalCount: 2, status: '已完成', latestUpdate: '2026-11-23 10:25' },
  { projectName: '面向多机型混线的视觉引导定位与质检系统', academy: '智能制造与机器人学部', leader: '吴桐', finalScore: '82.00', recheckReviewers: ['黄志强', '罗静'], submittedCount: 1, totalCount: 2, status: '进行中', latestUpdate: '2026-11-23 09:50' },
  { projectName: '移动操作机器人在立体仓储中的调度与规划', academy: '智能制造与机器人学部', leader: '郑予安', finalScore: '80.33', recheckReviewers: ['马继业', '罗静'], submittedCount: 0, totalCount: 2, status: '待启动', latestUpdate: '——' },
  { projectName: '面向多模态医学影像的可信融合诊断方法研究', academy: '生物医学信息学部', leader: '林清越', finalScore: '85.00', recheckReviewers: ['汪心怡', '程远'], submittedCount: 2, totalCount: 2, status: '已完成', latestUpdate: '2026-11-23 13:15' },
  { projectName: '医学大模型的临床决策支持与安全对齐研究', academy: '生物医学信息学部', leader: '沈嘉', finalScore: '83.00', recheckReviewers: ['汪心怡', '程远', '冯莉'], submittedCount: 1, totalCount: 3, status: '进行中', latestUpdate: '2026-11-23 17:35' },
  { projectName: '手术导航中的实时形变配准与可视化算法', academy: '生物医学信息学部', leader: '顾亦帆', finalScore: '81.00', recheckReviewers: ['程远', '冯莉'], submittedCount: 0, totalCount: 2, status: '待启动', latestUpdate: '——' },
  { projectName: '面向慢病管理的可解释风险预测与分层干预', academy: '生物医学信息学部', leader: '贺望舒', finalScore: '80.00', recheckReviewers: ['汪心怡', '冯莉'], submittedCount: 2, totalCount: 2, status: '已完成', latestUpdate: '2026-11-22 18:00' },
]
