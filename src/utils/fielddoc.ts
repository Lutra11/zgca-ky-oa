/**
 * 字段说明工具（DEV-only，App.vue 动态挂载，生产构建不包含）
 *
 * 用途：给原型里的字段（表单 label / 表头 / 控件）写"这个字段是什么意思"的说明。
 * 与标注工具（annotate.ts，F9）的区别：标注=提修改需求；本工具=写字段文档。
 *
 * 快捷键：F8 开关编辑模式（点字段写说明，再点已有说明的字段=编辑）
 * 常态：已写字段挂蓝色 ⓘ 角标，鼠标悬停直接显示说明内容（评审时可直接看）
 * 工具条（右下角、标注条上方）：
 *   [ℹ 说明·N（✓M）] [👁 显示] [📋 复制] [✓ 已处理] [🗑]
 *
 * 数据存 localStorage（key: zgci.fielddocs.v1），复制导出 JSON 交给助手，
 * 助手把说明固化进源码（el-tooltip / title）后写 fielddoc-done.json，点 ✓ 同步去重。
 */

import { attachBarDrag } from './toolbarDrag'

export interface FieldDoc {
  id: string
  route: string
  timestamp: string
  label: string
  text: string
  selector: string
  tag: string
  classes: string[]
  rect: { x: number; y: number; w: number; h: number }
  done?: boolean
  doneAt?: string
}

const STORE_KEY = 'zgci.fielddocs.v1'
const BAR_ID = 'zgci-fd-bar'
const BADGE_CLS = 'zgci-fd-badge'
const TIP_ID = 'zgci-fd-tip'
const CARD_ID = 'zgci-fd-card'

let editing = false          // F8 编辑模式
let showBadges = true        // 👁 角标可见性
let docs: FieldDoc[] = []
let cardCtx: { el: Element; doc: FieldDoc } | null = null
let renderTimer = 0
let destroyed = false

/* ---------------- 存储 ---------------- */
function load(): void {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    docs = raw ? (JSON.parse(raw) as FieldDoc[]) : []
  } catch { docs = [] }
}
function save(): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(docs)) } catch { /* ignore */ }
}

/* ---------------- 定位辅助（与 annotate.ts 同思路） ---------------- */
function buildSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const ref = el.getAttribute('data-ref') || el.getAttribute('data-testid')
  if (ref) return `[data-ref="${CSS.escape(ref)}"]`
  const cls = Array.from(el.classList).filter(c => !c.startsWith('zgci'))
  if (cls.length) {
    const s = `${el.tagName.toLowerCase()}.${cls.map(c => CSS.escape(c)).join('.')}`
    try { if (document.querySelectorAll(s).length === 1) return s } catch { /* fallthrough */ }
  }
  const path: string[] = []
  let cur: Element | null = el
  for (let i = 0; i < 5 && cur && cur !== document.body; i++) {
    const parent: Element | null = cur.parentElement
    if (!parent) break
    const idx = Array.from(parent.children).indexOf(cur) + 1
    path.unshift(`${cur.tagName.toLowerCase()}:nth-child(${idx})`)
    cur = parent
  }
  return path.join(' > ') || el.tagName.toLowerCase()
}

function readableLabel(el: Element): string {
  const txt = (el.textContent || '').trim().replace(/\s+/g, ' ')
  if (txt && txt.length <= 60) return txt
  const ph = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    ? (el.placeholder || '') : ''
  if (ph) return `输入:${ph}`
  const aria = el.getAttribute('aria-label') || el.getAttribute('title') || ''
  if (aria) return aria
  const cls = Array.from(el.classList).filter(c => !c.startsWith('zgci')).join('.')
  return cls ? `${el.tagName}.${cls}` : el.tagName
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c] as string)
}

/* ---------------- 样式 ---------------- */
function injectStyles(): void {
  if (document.getElementById('zgci-fd-style')) return
  const st = document.createElement('style')
  st.id = 'zgci-fd-style'
  st.textContent = `
  body.zgci-fd-editing, body.zgci-fd-editing * { cursor: crosshair !important; }
  body.zgci-fd-editing *:hover { outline: 2px dashed #409eff !important; outline-offset: -2px; }
  #${BAR_ID} { position: fixed; right: 12px; bottom: 64px; z-index: 2147483000;
    display: flex; gap: 6px; padding: 6px 8px; border-radius: 8px;
    background: rgba(50, 60, 80, 0.92); color: #fff; font: 12px/1.4 -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,.25); user-select: none; }
  #${BAR_ID} button { border: 0; border-radius: 5px; padding: 4px 9px; background: transparent; color: #d8e4ff; cursor: pointer; font-size: 12px; }
  #${BAR_ID} button:hover { background: rgba(255,255,255,.16); color: #fff; }
  #${BAR_ID} button.zgci-fd-on { background: #409eff; color: #fff; }
  #${BAR_ID} button.zgci-fd-edit-on { background: #67c23a; color: #fff; }
  .${BADGE_CLS} { position: fixed; z-index: 2147482900; width: 16px; height: 16px; margin-left: 2px;
    border-radius: 50%; background: #409eff; color: #fff; font: bold 10px/16px -apple-system, sans-serif;
    text-align: center; cursor: help; box-shadow: 0 1px 4px rgba(64,158,255,.5); }
  .${BADGE_CLS}.zgci-fd-done { background: #a8abb2; box-shadow: none; text-decoration: line-through; }
  #${TIP_ID} { position: fixed; z-index: 2147483100; max-width: 340px; padding: 8px 10px; border-radius: 6px;
    background: #303133; color: #fff; font: 12px/1.6 -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    box-shadow: 0 4px 14px rgba(0,0,0,.35); pointer-events: none; white-space: normal; }
  #${TIP_ID} .zgci-fd-tip-label { color: #8cc5ff; margin-bottom: 2px; }
  #${CARD_ID} { position: fixed; z-index: 2147483200; width: 320px; padding: 12px; border-radius: 10px;
    background: #fff; color: #303133; font: 13px/1.5 -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    box-shadow: 0 8px 30px rgba(0,0,0,.25); }
  #${CARD_ID} h4 { margin: 0 0 2px; font-size: 13px; color: #409eff; word-break: break-all; }
  #${CARD_ID} .zgci-fd-card-hint { font-size: 11px; color: #909399; margin: 0 0 8px; }
  #${CARD_ID} textarea { width: 100%; height: 96px; box-sizing: border-box; padding: 6px 8px; border: 1px solid #dcdfe6;
    border-radius: 6px; font: 13px/1.5 inherit; resize: vertical; outline: none; }
  #${CARD_ID} textarea:focus { border-color: #409eff; }
  #${CARD_ID} .zgci-fd-card-btns { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  #${CARD_ID} button { padding: 5px 14px; border-radius: 6px; border: 1px solid #dcdfe6; background: #fff; cursor: pointer; font-size: 12px; }
  #${CARD_ID} button.zgci-fd-primary { background: #409eff; border-color: #409eff; color: #fff; }
  .zgci-fd-flash { position: fixed; left: 50%; bottom: 110px; transform: translateX(-50%); z-index: 2147483300;
    padding: 8px 18px; border-radius: 18px; background: rgba(103,194,58,.95); color: #fff;
    font: 13px -apple-system, "PingFang SC", sans-serif; box-shadow: 0 4px 14px rgba(0,0,0,.2); }
  `
  document.head.appendChild(st)
}

/* ---------------- 工具条 ---------------- */
function updateBar(): void {
  const bar = document.getElementById(BAR_ID)
  if (!bar) return
  const pending = docs.filter(d => !d.done).length
  const done = docs.length - pending
  const b1 = bar.querySelector<HTMLButtonElement>('[data-act="edit"]')
  if (b1) {
    b1.textContent = `ℹ 说明·${pending}（✓${done}）`
    b1.className = editing ? 'zgci-fd-edit-on' : ''
    b1.title = 'F8 开关编辑模式：点击字段写/改说明'
  }
  const b2 = bar.querySelector<HTMLButtonElement>('[data-act="eye"]')
  if (b2) {
    b2.textContent = showBadges ? '👁 隐藏' : '👁 显示'
    b2.title = '显示/隐藏字段说明角标'
  }
}

function renderBar(): void {
  if (document.getElementById(BAR_ID)) { updateBar(); return }
  const bar = document.createElement('div')
  bar.id = BAR_ID
  bar.addEventListener('mousedown', e => e.stopPropagation())
  const mk = (act: string, txt: string, title: string): HTMLButtonElement => {
    const b = document.createElement('button')
    b.dataset.act = act
    b.textContent = txt
    b.title = title
    return b
  }
  bar.appendChild(mk('edit', 'ℹ', 'F8 开关编辑模式'))
  bar.appendChild(mk('eye', '👁', '显示/隐藏说明角标'))
  bar.appendChild(mk('copy', '📋', '复制待固化的字段说明 JSON（发给助手）'))
  bar.appendChild(mk('done', '✓', '同步助手已固化进源码的说明'))
  bar.appendChild(mk('clear', '🗑', '连点两次清空全部字段说明'))
  bar.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest('button')
    if (!btn) return
    const act = btn.dataset.act
    if (act === 'edit') toggleEdit()
    else if (act === 'eye') { showBadges = !showBadges; renderBadges(); updateBar() }
    else if (act === 'copy') void copyAll()
    else if (act === 'done') void syncDone()
    else if (act === 'clear') {
      if ((btn as HTMLButtonElement).dataset.confirm === '1') {
        docs = []; save(); renderBadges(); updateBar(); flash('已清空全部字段说明')
      } else {
        (btn as HTMLButtonElement).dataset.confirm = '1'
        btn.textContent = '🗑 确认清空？'
        window.setTimeout(() => { delete (btn as HTMLButtonElement).dataset.confirm; updateBar() }, 2500)
      }
    }
  })
  document.body.appendChild(bar)
  attachBarDrag(bar, 'zgci.fdbar.pos')
  updateBar()
}

/* ---------------- 角标 + 悬停说明 ---------------- */
function renderBadges(): void {
  document.querySelectorAll(`.${BADGE_CLS}`).forEach(b => b.remove())
  hideTip()
  if (!showBadges || editing) return
  for (const d of docs) {
    let el: Element | null = null
    try { el = document.querySelector(d.selector) } catch { el = null }
    if (!el || !el.isConnected) continue
    const r = el.getBoundingClientRect()
    if (!r.width && !r.height) continue
    const badge = document.createElement('div')
    badge.className = BADGE_CLS + (d.done ? ' zgci-fd-done' : '')
    badge.textContent = 'i'
    badge.style.left = `${Math.min(window.scrollX + r.right + 2, window.innerWidth - 20)}px`
    badge.style.top = `${window.scrollY + r.top - 2}px`
    badge.addEventListener('mouseenter', () => showTip(d, badge))
    badge.addEventListener('mouseleave', hideTip)
    badge.addEventListener('click', e => {
      e.stopPropagation()
      if (cardCtx) closeCard()
      openCard(el as Element, d)
    })
    document.body.appendChild(badge)
  }
}

let tipEl: HTMLDivElement | null = null
function showTip(d: FieldDoc, anchor: HTMLElement): void {
  hideTip()
  tipEl = document.createElement('div')
  tipEl.id = TIP_ID
  tipEl.innerHTML = `<div class="zgci-fd-tip-label">${escapeHtml(d.label)}${d.done ? '（已固化 ✓）' : ''}</div>${escapeHtml(d.text)}`
  document.body.appendChild(tipEl)
  const ar = anchor.getBoundingClientRect()
  const tr = tipEl.getBoundingClientRect()
  let x = ar.left + ar.width / 2 - tr.width / 2
  x = Math.max(6, Math.min(x, window.innerWidth - tr.width - 6))
  let y = ar.bottom + 6
  if (y + tr.height > window.innerHeight - 6) y = ar.top - tr.height - 6
  tipEl.style.left = `${window.scrollX + x}px`
  tipEl.style.top = `${window.scrollY + y}px`
}
function hideTip(): void {
  if (tipEl) { tipEl.remove(); tipEl = null }
}

/* ---------------- 编辑模式：捕获点击 → 卡片 ---------------- */
function toggleEdit(): void {
  editing = !editing
  document.body.classList.toggle('zgci-fd-editing', editing)
  if (editing) { closeCard(); renderBadges(); flash('字段说明模式：点击字段写说明（再点已写的=编辑），F8 退出') }
  else { renderBadges() }
  updateBar()
}

function onCaptureClick(e: MouseEvent): void {
  if (!editing) return
  const t = e.target as HTMLElement
  if (t.closest(`#${BAR_ID}`) || t.closest(`#${CARD_ID}`) || t.closest(`.${BADGE_CLS}`)) return
  const el = t.closest('label,th,td,.el-form-item__label,.el-descriptions__label,.el-radio,.el-checkbox,button,input,select,textarea,[class]') || t
  e.preventDefault()
  e.stopPropagation()
  const rect = el.getBoundingClientRect()
  const selector = buildSelector(el)
  const route = location.pathname
  const existing = docs.find(d => d.selector === selector && d.route === route)
  if (cardCtx) closeCard()
  if (existing) openCard(el, existing)
  else {
    const doc: FieldDoc = {
      id: 'FD-' + Date.now().toString(36).toUpperCase(),
      route,
      timestamp: formatTime(new Date()),
      label: readableLabel(el),
      text: '',
      selector,
      tag: el.tagName,
      classes: Array.from(el.classList).filter(c => !c.startsWith('zgci')).slice(0, 6),
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
    }
    openCard(el, doc)
  }
}

function formatTime(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function openCard(el: Element, doc: FieldDoc): void {
  closeCard()
  cardCtx = { el, doc }
  const isNew = !docs.includes(doc)
  const card = document.createElement('div')
  card.id = CARD_ID
  card.innerHTML = `
    <h4>${escapeHtml(doc.label)}</h4>
    <p class="zgci-fd-card-hint">${isNew ? '新字段说明' : '编辑字段说明'} · Ctrl+Enter 保存 · Esc 取消</p>
    <textarea placeholder="这个字段是什么意思？填写要求？示例？"></textarea>
    <div class="zgci-fd-card-btns">
      <button data-act="cancel">取消</button>
      <button data-act="save" class="zgci-fd-primary">保存</button>
    </div>`
  const ta = card.querySelector('textarea') as HTMLTextAreaElement
  ta.value = doc.text
  const r = el.getBoundingClientRect()
  let x = window.scrollX + r.left
  let y = window.scrollY + r.bottom + 8
  if (y + 210 > window.scrollY + window.innerHeight) y = window.scrollY + Math.max(8, r.top - 210)
  if (x + 330 > window.scrollX + window.innerWidth) x = window.scrollX + Math.max(8, window.innerWidth - 340)
  card.style.left = `${x}px`
  card.style.top = `${y}px`
  card.addEventListener('mousedown', ev => ev.stopPropagation())
  card.addEventListener('click', ev => {
    const btn = (ev.target as HTMLElement).closest('button')
    if (!btn) return
    if (btn.dataset.act === 'save') saveCard()
    else closeCard()
  })
  ta.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); saveCard() }
    if (ev.key === 'Escape') { ev.stopPropagation(); closeCard() }
  })
  document.body.appendChild(card)
  ta.focus()
}

function saveCard(): void {
  if (!cardCtx) return
  const { doc } = cardCtx
  const ta = document.querySelector(`#${CARD_ID} textarea`) as HTMLTextAreaElement | null
  const text = (ta ? ta.value : '').trim()
  closeCard()
  if (!text) { flash('内容为空，未保存'); return }
  doc.text = text
  if (!docs.includes(doc)) docs.push(doc)
  save()
  renderBadges()
  updateBar()
  flash(`已保存：${doc.label}`)
}

function closeCard(): void {
  document.getElementById(CARD_ID)?.remove()
  cardCtx = null
}

/* ---------------- 复制 / 同步 ---------------- */
async function copyAll(): Promise<void> {
  const pending = docs.filter(d => !d.done)
  if (!docs.length) { flash('还没有任何字段说明'); return }
  if (!pending.length) { flash('全部说明已固化 ✓，没有新的'); return }
  const s = JSON.stringify(pending, null, 2)
  try {
    await navigator.clipboard.writeText(s)
    flash(`已复制 ${pending.length} 条字段说明，粘贴给助手即可`)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = s
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy'); flash(`已复制 ${pending.length} 条字段说明`) } catch { flash('复制失败，请手动复制') }
    ta.remove()
  }
}

async function syncDone(): Promise<void> {
  try {
    const res = await fetch(`/src/utils/fielddoc-done.json?t=${Date.now()}`)
    if (!res.ok) throw new Error(String(res.status))
    const data = JSON.parse(await res.text()) as { done?: string[] }
    const ids = new Set(data.done || [])
    let n = 0
    const now = formatTime(new Date())
    for (const d of docs) {
      if (ids.has(d.id) && !d.done) { d.done = true; d.doneAt = now; n++ }
    }
    save()
    renderBadges()
    updateBar()
    flash(n ? `同步完成：${n} 条说明已标记固化 ✓` : '没有新的已固化说明')
  } catch {
    flash('同步失败：助手还没创建 fielddoc-done.json')
  }
}

/* ---------------- 杂项 ---------------- */
function flash(msg: string): void {
  const f = document.createElement('div')
  f.className = 'zgci-fd-flash'
  f.textContent = msg
  document.body.appendChild(f)
  window.setTimeout(() => f.remove(), 2200)
}

function scheduleRender(): void {
  window.clearTimeout(renderTimer)
  renderTimer = window.setTimeout(() => { if (!destroyed) renderBadges() }, 250)
}

/* ---------------- 入口 ---------------- */
export function init(): () => void {
  load()
  injectStyles()
  renderBar()
  renderBadges()

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'F8') { e.preventDefault(); toggleEdit() }
    else if (e.key === 'Escape' && cardCtx) closeCard()
  }
  const onClickCapture = (e: MouseEvent): void => { if (editing) onCaptureClick(e) }
  const onDocClick = (): void => { if (!editing && !cardCtx) scheduleRender() }

  document.addEventListener('keydown', onKey, true)
  document.addEventListener('click', onClickCapture, true)
  document.addEventListener('click', onDocClick)

  const origPush = history.pushState
  history.pushState = function (this: History, ...args: unknown[]): void {
    ;(origPush as (...a: unknown[]) => void).apply(this, args)
    closeCard()
    scheduleRender()
  }
  const onPop = (): void => { closeCard(); scheduleRender() }
  window.addEventListener('popstate', onPop)

  // 控制台备用入口
  ;(window as any).__zgciFd = {
    exportAll: (): string => JSON.stringify(docs, null, 2),
    listAll: (): FieldDoc[] => docs,
    clearAll: (): void => { docs = []; save(); renderBadges(); updateBar() },
  }

  return () => {
    destroyed = true
    window.clearTimeout(renderTimer)
    document.removeEventListener('keydown', onKey, true)
    document.removeEventListener('click', onClickCapture, true)
    document.removeEventListener('click', onDocClick)
    window.removeEventListener('popstate', onPop)
    history.pushState = origPush
    closeCard()
    hideTip()
    document.getElementById(BAR_ID)?.remove()
    document.querySelectorAll(`.${BADGE_CLS}`).forEach(b => b.remove())
    document.getElementById('zgci-fd-style')?.remove()
    document.body.classList.remove('zgci-fd-editing')
  }
}
