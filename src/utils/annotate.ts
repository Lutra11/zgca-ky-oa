/* ============================================================
 * 标注模式（Annotate Mode）— 仅开发环境使用
 * ------------------------------------------------------------
 * 悬浮工具条（右下角）：[🏷 标注 · N] 开关 · [📋 复制] 一键复制全部
 *                       [🗑] 清空（点两次确认）
 * 快捷键：F9 开关（原 Ctrl+Shift+A 与用户截屏快捷键冲突）
 * 流程：开模式 → 点任意控件 → 小卡片里写意见 → 保存
 *       全部标完 → 点 📋 复制 → 去聊天框粘贴给 Hermes
 * 数据：localStorage（key: zgci.annotations.v1），含路由、
 *       控件文案、CSS 定位、class、坐标，Hermes 可照单改码。
 * ============================================================ */

const KEY = 'zgci.annotations.v1'

import { attachBarDrag } from './toolbarDrag'

export interface Annotation {
  id: string
  route: string
  timestamp: string
  text: string
  /** kind=element 时有效：单个控件的定位 */
  selector?: string
  tag?: string
  classes?: string[]
  label: string
  rect: { x: number; y: number; w: number; h: number }
  /** element=点选控件；area=圈选区域 */
  kind?: 'element' | 'area'
  /** kind=area 时有效：区域覆盖的元素摘要（标签+文案+class，最多 12 条） */
  covered?: { tag: string; label: string; classes: string[]; selector: string }[]
  /** 已处理状态：done=true 的批注不会出现在 📋 复制结果里 */
  done?: boolean
  doneAt?: string
}

let enabled = false
let styleEl: HTMLStyleElement | null = null
let bar: HTMLElement | null = null
let pop: HTMLElement | null = null
let flashEl: HTMLElement | null = null
let flashTimer: ReturnType<typeof setTimeout> | null = null
let clearArmed = false
let clearTimer: ReturnType<typeof setTimeout> | null = null
let hovered: HTMLElement | null = null
let pick: HTMLElement | null = null
let areaMode = false
let marquee: HTMLElement | null = null
let areaStart: { x: number; y: number } | null = null

/* ---------------- 存储 ---------------- */
function load(): Annotation[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function persist(list: Annotation[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

/* ---------------- 定位辅助 ---------------- */
function buildSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`
  for (const attr of ['data-ref', 'data-testid']) {
    const v = el.getAttribute(attr)
    if (v) return `${el.tagName.toLowerCase()}[${attr}="${v}"]`
  }
  const cls = [...el.classList].filter(c => !/^(v-|el-|is-)/.test(c)).slice(0, 3)
  if (cls.length) {
    const s = `${el.tagName.toLowerCase()}.${cls.join('.')}`
    try { if (document.querySelectorAll(s).length === 1) return s } catch { /* ignore */ }
  }
  const parts: string[] = []
  let cur: HTMLElement | null = el
  for (let i = 0; cur && i < 5; i++) {
    const idx = cur.parentElement ? [...cur.parentElement.children].indexOf(cur) + 1 : 1
    parts.unshift(`${cur.tagName.toLowerCase()}:nth-child(${idx})`)
    cur = cur.parentElement
  }
  return parts.join(' > ')
}

function readableLabel(el: HTMLElement): string {
  let t: HTMLElement | null = el
  for (let i = 0; t && i < 3; i++) {
    const txt = (t.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60)
    if (txt) return txt
    const ph = t.getAttribute && (t.getAttribute('placeholder') || t.getAttribute('aria-label'))
    if (ph) return `[${ph}]`
    t = t.parentElement
  }
  const cls = [...el.classList].slice(0, 3).join('.')
  return cls || el.tagName.toLowerCase()
}

function ownUi(t: Element | null): boolean {
  return !!t && !!t.closest && !!t.closest('.zgci-annot-ui')
}

/* ---------------- 样式 ---------------- */
function ensureStyle() {
  if (styleEl) return
  styleEl = document.createElement('style')
  styleEl.textContent = `
#zgci-annot-bar { position: fixed; right: 14px; bottom: 14px; z-index: 2147483000;
  display: flex; gap: 4px; padding: 5px; border-radius: 10px;
  background: rgba(28,30,36,.92); border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 4px 16px rgba(0,0,0,.35); font: 12px/1.4 system-ui, sans-serif; user-select: none; }
#zgci-annot-bar button { all: unset; cursor: pointer; padding: 5px 10px; border-radius: 6px; color: #e8eaf0; }
#zgci-annot-bar button:hover { background: rgba(255,255,255,.12); }
#zgci-annot-bar button.on { background: #409eff; color: #fff; }
#zgci-annot-bar button.dim { opacity: .35; pointer-events: none; }
body.__zgci_annotate_mode, body.__zgci_annotate_mode *:not(.zgci-annot-ui):not(.zgci-annot-ui *) { cursor: crosshair !important; }
#zgci-annot-bar, #zgci-annot-bar *, #zgci-annot-pop, #zgci-annot-pop * { cursor: auto !important; }
.zgci-annot-hover { outline: 2px dashed #f56c6c !important; outline-offset: 1px; }
.zgci-annot-pick { outline: 3px solid #f56c6c !important; outline-offset: 1px; }
.zgci-annot-badge { position: absolute; top: -10px; right: -4px; z-index: 2147483000;
  background: #f56c6c; color: #fff; font: 11px/1 monospace; padding: 3px 6px;
  border-radius: 4px; pointer-events: none; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
#zgci-annot-pop { position: fixed; z-index: 2147483000; width: 260px; padding: 10px;
  background: #1c1e24; color: #e8eaf0; border: 1px solid rgba(255,255,255,.16);
  border-radius: 10px; box-shadow: 0 6px 24px rgba(0,0,0,.4); font: 12px/1.5 system-ui, sans-serif; }
#zgci-annot-pop .zgci-tip { color: #9aa0ac; margin-bottom: 6px; max-height: 3.2em; overflow: hidden; }
#zgci-annot-pop textarea { width: 100%; box-sizing: border-box; height: 64px; resize: vertical;
  background: #12141a; color: #e8eaf0; border: 1px solid rgba(255,255,255,.2);
  border-radius: 6px; padding: 6px 8px; font: 12px/1.5 inherit; outline: none; }
#zgci-annot-pop textarea:focus { border-color: #409eff; }
#zgci-annot-pop .zgci-pop-row { display: flex; gap: 6px; justify-content: flex-end; margin-top: 8px; }
#zgci-annot-pop .zgci-pop-row button { cursor: pointer; padding: 4px 12px; border-radius: 6px; border: none; font: 12px inherit; }
#zgci-annot-pop .zgci-cancel { background: #2a2d35; color: #cfd3dc; }
#zgci-annot-pop .zgci-save { background: #409eff; color: #fff; }
.zgci-annot-flash { position: fixed; right: 14px; bottom: 56px; z-index: 2147483000;
  background: rgba(64,158,255,.92); color: #fff; font: 12px/1.4 system-ui, sans-serif;
  padding: 7px 12px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,.3);
  max-width: 300px; pointer-events: none; }
#zgci-annot-marquee { position: fixed; z-index: 2147482900; border: 2px dashed #409eff;
  background: rgba(64,158,255,.12); pointer-events: none; border-radius: 4px; }
#zgci-annot-bar button.area.on { background: #67c23a; color: #fff; }
.zgci-annot-badge.zgci-annot-done, .zgci-annot-area-mark > span.zgci-annot-done { background: #9aa0ac !important; text-decoration: line-through; }
.zgci-annot-area-mark.zgci-annot-done-mark { border-color: rgba(154,160,172,.6) !important; background: rgba(154,160,172,.08) !important; }
.zgci-annot-area-mark { position: fixed; z-index: 2147482900; border: 2px solid rgba(64,158,255,.7);
  background: rgba(64,158,255,.06); border-radius: 4px; pointer-events: none; }
  .zgci-annot-area-mark > span { position: absolute; top: -20px; left: -2px; background: #409eff;
  color: #fff; font: 11px/1 monospace; padding: 3px 6px; border-radius: 4px; }
`
  document.head.appendChild(styleEl)
}

/* ---------------- 提示条 ---------------- */
function flash(msg: string) {
  if (!flashEl) {
    flashEl = document.createElement('div')
    flashEl.className = 'zgci-annot-flash'
    document.body.appendChild(flashEl)
  }
  flashEl.textContent = msg
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashEl?.remove(); flashEl = null }, 2200)
}

/* ---------------- 工具条 ---------------- */
function ensureBar() {
  if (bar) return
  bar = document.createElement('div')
  bar.id = 'zgci-annot-bar'
  bar.className = 'zgci-annot-ui'
  const t = document.createElement('button')
  t.dataset.act = 'toggle'
  const a = document.createElement('button')
  a.dataset.act = 'area'
  a.className = 'area'
  a.textContent = '⬚ 圈选'
  a.title = '圈选模式：拖拽画一个区域（比如整块表格/卡片），用于“这里加字段”类需求'
  const c = document.createElement('button')
  c.dataset.act = 'copy'
  c.textContent = '📋 复制'
  const s = document.createElement('button')
  s.dataset.act = 'sync'
  s.textContent = '✓ 已处理'
  s.title = '同步 Hermes 已处理的批注（读取 /src/utils/annot-done.json）'
  const d = document.createElement('button')
  d.dataset.act = 'clear'
  d.textContent = '🗑'
  d.title = '清空全部标注'
  bar.append(t, a, c, s, d)
  bar.addEventListener('click', (e: Event) => {
    const b = (e.target as HTMLElement).closest?.('button') as HTMLElement | null
    if (!b) return
    const act = b.dataset.act
    if (act === 'toggle') toggle()
    else if (act === 'area') toggleArea()
    else if (act === 'copy') void copyAll()
    else if (act === 'sync') void syncDone()
    else if (act === 'clear') armClear()
  })
  document.body.appendChild(bar)
  attachBarDrag(bar, 'zgci.annotbar.pos')
  updateBar()
}

/** 读取 dev server 上的 annot-done.json（Hermes 改完代码后写入），把对应批注标记为已处理 */
async function syncDone() {
  const url = '/src/utils/annot-done.json?t=' + Date.now()
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json() as { done?: string[] }
    const ids = Array.isArray(data.done) ? data.done : []
    if (!ids.length) { flash('还没有已处理记录'); return }
    const n = markDone(ids)
    flash(n ? `已同步：${n} 条批注标记为已处理` : '这些批注之前已标记过')
  } catch {
    flash('读取失败：还没有已处理记录文件')
  }
}

function updateBar() {
  if (!bar) return
  const all = load()
  const n = all.filter(a => !a.done).length
  const doneN = all.length - n
  // 修复：工具条加了 ✥ 拖拽把手（第一个 button）后，按位置索引取按钮会错位，
  // 必须按 data-act 精确取——否则开关文字写进把手、真按钮永远空白，表现为"点了没反应"
  const t = bar.querySelector<HTMLButtonElement>('button[data-act="toggle"]')
  const a = bar.querySelector<HTMLButtonElement>('button[data-act="area"]')
  const c = bar.querySelector<HTMLButtonElement>('button[data-act="copy"]')
  if (!t || !a || !c) return
  t.textContent = `🏷 标注 · ${n}${doneN ? `（✓${doneN}）` : ''}`
  t.classList.toggle('on', enabled)
  a.classList.toggle('on', areaMode && enabled)
  c.classList.toggle('dim', n === 0)
  c.title = n ? `复制 ${n} 条待处理标注（JSON），粘贴给 Hermes` : '没有待处理的标注'
}

async function copyText(s: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(s); return true } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = s
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch { return false }
  }
}

async function copyAll() {
  const all = load()
  const pending = all.filter(a => !a.done)
  if (!pending.length) {
    flash(all.length ? '全部已处理完毕，没有新批注' : '还没有标注')
    return
  }
  const ok = await copyText(JSON.stringify(pending, null, 2))
  const doneN = all.length - pending.length
  flash(ok
    ? `已复制 ${pending.length} 条待处理${doneN ? `（${doneN} 条已处理不再复制）` : ''} · 去聊天框粘贴`
    : '复制失败：控制台运行 window.__zgci.exportAnnots()')
}

function armClear() {
  if (clearArmed) {
    clearArmed = false
    if (clearTimer) clearTimeout(clearTimer)
    clearAll()
    flash('已清空全部标注')
    return
  }
  clearArmed = true
  flash('再点一次 🗑 确认清空')
  clearTimer = setTimeout(() => { clearArmed = false }, 2500)
}

/* ---------------- 悬停高亮 ---------------- */
function onOver(e: Event) {
  const t = e.target as HTMLElement
  if (!t || !t.classList || ownUi(t) || t === document.body || t === document.documentElement) return
  if (hovered && hovered !== t) hovered.classList.remove('zgci-annot-hover')
  hovered = t
  t.classList.add('zgci-annot-hover')
}
function onOut(e: Event) {
  const t = e.target as HTMLElement
  if (t && t === hovered) { t.classList.remove('zgci-annot-hover'); hovered = null }
}
function clearHover() {
  hovered?.classList.remove('zgci-annot-hover')
  hovered = null
}

/* ---------------- 意见小卡片 ---------------- */
function closePop() {
  pop?.remove()
  pop = null
  pick?.classList.remove('zgci-annot-pick')
  pick = null
}

function openPop(t: HTMLElement, x: number, y: number) {
  closePop()
  pick = t
  t.classList.add('zgci-annot-pick')
  pop = document.createElement('div')
  pop.id = 'zgci-annot-pop'
  pop.className = 'zgci-annot-ui'

  const tip = document.createElement('div')
  tip.className = 'zgci-tip'
  tip.textContent = `选中：${readableLabel(t)}（${t.tagName}）`

  const ta = document.createElement('textarea')
  ta.placeholder = '写你的修改意见…（Ctrl+Enter 保存）'

  const row = document.createElement('div')
  row.className = 'zgci-pop-row'
  const cancel = document.createElement('button')
  cancel.className = 'zgci-cancel'
  cancel.textContent = '取消'
  cancel.onclick = closePop
  const save = document.createElement('button')
  save.className = 'zgci-save'
  save.textContent = '保存'
  const doSave = () => {
    const v = ta.value.trim()
    if (!v) { ta.focus(); return }
    savePending(t, v)
    closePop()
  }
  save.onclick = doSave
  ta.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave() }
  })
  row.append(cancel, save)
  pop.append(tip, ta, row)

  const left = Math.min(x + 12, window.innerWidth - 276)
  const top = Math.min(y + 12, window.innerHeight - 170)
  pop.style.left = Math.max(8, left) + 'px'
  pop.style.top = Math.max(8, top) + 'px'
  document.body.appendChild(pop)
  ta.focus()
}

function savePending(t: HTMLElement, text: string) {
  const r = t.getBoundingClientRect()
  const ann: Annotation = {
    id: 'AN-' + Date.now().toString(36).toUpperCase(),
    route: location.hash || location.pathname,
    timestamp: new Date().toLocaleString('zh-CN'),
    text,
    kind: 'element',
    selector: buildSelector(t),
    tag: t.tagName,
    classes: [...t.classList].filter(c => !/^(v-|el-|is-|zgci-)/.test(c)).slice(0, 5),
    label: readableLabel(t),
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
  }
  const list = load()
  list.push(ann)
  persist(list)
  const b = document.createElement('span')
  b.className = 'zgci-annot-badge'
  b.textContent = '#' + list.length
  if (getComputedStyle(t).position === 'static') t.style.position = 'relative'
  t.appendChild(b)
  updateBar()
  flash(`已记录 #${list.length}（继续点下一个，或 F9 关闭）`)
}

/* ---------------- 圈选模式 ---------------- */
function toggleArea(): boolean {
  if (!enabled) { flash('先开启标注模式（F9）再用圈选'); return false }
  areaMode = !areaMode
  if (areaMode) {
    bindArea()
    flash('圈选模式：按住拖一个框（比如整块表格）')
  } else {
    unbindArea()
    bindClick()
    flash('圈选模式关闭，恢复点选')
  }
  updateBar()
  return areaMode
}

function removeMarquee() {
  marquee?.remove()
  marquee = null
}

function areaMouseDown(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (ownUi(t)) return
  e.preventDefault()
  e.stopPropagation()
  clearHover()
  areaStart = { x: e.clientX, y: e.clientY }
  removeMarquee()
  marquee = document.createElement('div')
  marquee.id = 'zgci-annot-marquee'
  marquee.className = 'zgci-annot-ui'
  document.body.appendChild(marquee)
}

function areaMouseMove(e: MouseEvent) {
  if (!areaStart || !marquee) return
  const x = Math.min(areaStart.x, e.clientX)
  const y = Math.min(areaStart.y, e.clientY)
  const w = Math.abs(e.clientX - areaStart.x)
  const h = Math.abs(e.clientY - areaStart.y)
  marquee.style.left = x + 'px'
  marquee.style.top = y + 'px'
  marquee.style.width = w + 'px'
  marquee.style.height = h + 'px'
}

function areaMouseUp(e: MouseEvent) {
  if (!areaStart || !marquee) return
  const r = marquee.getBoundingClientRect()
  areaStart = null
  const small = r.width < 8 || r.height < 8
  removeMarquee()
  if (small) return // 误触，忽略
  collectArea(r, e.clientX, e.clientY)
}

/** 收集框住的元素摘要 */
function collectArea(r: DOMRect, cx: number, cy: number) {
  const seen = new Set<string>()
  const covered: { tag: string; label: string; classes: string[]; selector: string }[] = []
  const all = document.querySelectorAll('body *') as NodeListOf<HTMLElement>
  for (let i = 0; i < all.length; i++) {
    const el = all[i]
    if (!el.innerText && !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.children.length) continue // 只留叶子层
    if (ownUi(el)) continue
    const er = el.getBoundingClientRect()
    const cxm = er.x + er.width / 2
    const cym = er.y + er.height / 2
    if (cxm < r.x || cxm > r.x + r.width || cym < r.y || cym > r.y + r.height) continue
    if (er.width < 2 || er.height < 2) continue
    const label = readableLabel(el)
    if (!label || label === el.tagName.toLowerCase()) continue
    const key = el.tagName + '|' + label + '|' + buildSelector(el)
    if (seen.has(key)) continue
    seen.add(key)
    covered.push({
      tag: el.tagName,
      label,
      classes: [...el.classList].filter(c => !/^(v-|el-|is-|zgci-)/.test(c)).slice(0, 4),
      selector: buildSelector(el),
    })
    if (covered.length >= 12) break
  }
  openAreaPop(r, covered, cx, cy)
}

function openAreaPop(r: DOMRect, covered: { tag: string; label: string; classes: string[]; selector: string }[], cx: number, cy: number) {
  closePop()
  pop = document.createElement('div')
  pop.id = 'zgci-annot-pop'
  pop.className = 'zgci-annot-ui'

  const tip = document.createElement('div')
  tip.className = 'zgci-tip'
  tip.textContent = `圈选区域 ${Math.round(r.width)}×${Math.round(r.height)}，框住 ${covered.length} 个元素：${covered.slice(0, 5).map(c => c.label.slice(0, 8)).join('、')}${covered.length > 5 ? '…' : ''}`

  const ta = document.createElement('textarea')
  ta.placeholder = '写你的意见…（如：这个表格增加“经费执行率”和“负责人电话”两个字段）'

  const row = document.createElement('div')
  row.className = 'zgci-pop-row'
  const cancel = document.createElement('button')
  cancel.className = 'zgci-cancel'
  cancel.textContent = '取消'
  cancel.onclick = closePop
  const save = document.createElement('button')
  save.className = 'zgci-save'
  save.textContent = '保存'
  const doSave = () => {
    const v = ta.value.trim()
    if (!v) { ta.focus(); return }
    saveAreaPending(r, covered, v)
    closePop()
  }
  save.onclick = doSave
  ta.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave() }
  })
  row.append(cancel, save)
  pop.append(tip, ta, row)

  const left = Math.min(cx + 12, window.innerWidth - 276)
  const top = Math.min(cy + 12, window.innerHeight - 190)
  pop.style.left = Math.max(8, left) + 'px'
  pop.style.top = Math.max(8, top) + 'px'
  document.body.appendChild(pop)
  ta.focus()
}

function saveAreaPending(r: DOMRect, covered: { tag: string; label: string; classes: string[]; selector: string }[], text: string) {
  const ann: Annotation = {
    id: 'AN-' + Date.now().toString(36).toUpperCase(),
    route: location.hash || location.pathname,
    timestamp: new Date().toLocaleString('zh-CN'),
    text,
    label: `圈选区域（${covered.length} 个元素：${covered.slice(0, 3).map(c => c.label.slice(0, 10)).join('、')}${covered.length > 3 ? '…' : ''}）`,
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    kind: 'area',
    covered,
  }
  const list = load()
  list.push(ann)
  persist(list)
  // 持久可视标记（fixed 定位，不随滚动消失）
  const mark = document.createElement('div')
  mark.className = 'zgci-annot-area-mark'
  mark.style.left = r.x + 'px'
  mark.style.top = r.y + 'px'
  mark.style.width = r.width + 'px'
  mark.style.height = r.height + 'px'
  const tag = document.createElement('span')
  tag.textContent = '#' + list.length + ' 圈选'
  mark.appendChild(tag)
  document.body.appendChild(mark)
  updateBar()
  flash(`已记录圈选 #${list.length}（继续圈，或点 🏭 关闭圈选）`)
}

/* ---------------- 点击捕获 ---------------- */
function onCapture(e: MouseEvent) {
  const t = e.target as HTMLElement
  if (!t || !t.closest) return
  if (ownUi(t)) return
  e.preventDefault()
  e.stopPropagation()
  openPop(t, e.clientX, e.clientY)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'F9') { e.preventDefault(); toggle(); return }
  if (e.key === 'F10') { e.preventDefault(); toggleArea(); return }
  if (e.key === 'Escape' && pop) closePop()
}

/* ---------------- 开关 ---------------- */
export function toggle(): boolean {
  enabled = !enabled
  ensureBar()
  if (enabled) {
    document.body.classList.add('__zgci_annotate_mode')
    if (areaMode) bindArea()
    else bindClick()
    flash('标注模式开启：点控件写意见')
    console.log('[标注模式] 开启：点击控件写意见；F9 或工具条关闭')
  } else {
    document.body.classList.remove('__zgci_annotate_mode')
    unbindClick()
    unbindArea()
    closePop()
    clearHover()
    areaMode = false
    console.log('[标注模式] 关闭')
  }
  updateBar()
  return enabled
}

function bindClick() {
  window.addEventListener('click', onCapture, true)
  window.addEventListener('mouseover', onOver, true)
  window.addEventListener('mouseout', onOut, true)
}
function unbindClick() {
  window.removeEventListener('click', onCapture, true)
  window.removeEventListener('mouseover', onOver, true)
  window.removeEventListener('mouseout', onOut, true)
}
function bindArea() {
  unbindClick()
  window.addEventListener('mousedown', areaMouseDown, true)
  window.addEventListener('mousemove', areaMouseMove, true)
  window.addEventListener('mouseup', areaMouseUp, true)
}
function unbindArea() {
  window.removeEventListener('mousedown', areaMouseDown, true)
  window.removeEventListener('mousemove', areaMouseMove, true)
  window.removeEventListener('mouseup', areaMouseUp, true)
  removeMarquee()
  areaStart = null
}

/* ---------------- 生命周期 ---------------- */
export function init(): () => void {
  ensureStyle()
  ensureBar()
  window.addEventListener('keydown', onKey)
  return () => {
    window.removeEventListener('keydown', onKey)
    if (enabled) toggle()
    bar?.remove(); bar = null
    flashEl?.remove(); flashEl = null
    styleEl?.remove(); styleEl = null
  }
}

export function exportAll(): string {
  return JSON.stringify(load().filter(a => !a.done), null, 2)
}
export function listAll(): Annotation[] {
  return load()
}
export function clearAll() {
  persist([])
  document.querySelectorAll('.zgci-annot-badge, .zgci-annot-area-mark').forEach(b => b.remove())
  updateBar()
}

/** 按 id 批量标记为已处理（Hermes 改完后调用；不存在的 id 忽略） */
export function markDone(ids: string[]): number {
  const set = new Set(ids)
  const list = load()
  let n = 0
  for (const a of list) {
    if (set.has(a.id) && !a.done) {
      a.done = true
      a.doneAt = new Date().toLocaleString('zh-CN')
      n++
    }
  }
  if (n) {
    persist(list)
    renderDoneBadges(list)
    updateBar()
  }
  return n
}

/** 刷新页面上角标的已处理样式 */
function renderDoneBadges(list: Annotation[]) {
  const pending = new Set(list.filter(a => !a.done).map(a => a.id))
  document.querySelectorAll<HTMLElement>('.zgci-annot-badge, .zgci-annot-area-mark > span').forEach(el => {
    const num = el.textContent?.match(/#?(\d+)/)?.[1]
    if (!num) return
    const idx = Number(num) - 1
    const ann = list[idx]
    if (!ann) return
    el.classList.toggle('zgci-annot-done', !!ann.done)
  })
  void pending
}
