/**
 * DEV 浮动工具条通用拖拽（肉肉反馈：右下角两条工具条有时挡视线，需手动移动位置）。
 * 给工具条头部加 ✥ 把手：按住拖动改 left/top（视口内 clamp），位置存 localStorage 跨页面/刷新保持。
 * 仅被 annotate.ts / fielddoc.ts（DEV-only 动态加载）引用，生产构建不包含。
 */

const DRAG_STYLE_ID = 'zgci-bar-drag-style'
export const BAR_DRAG_HANDLE_CLS = 'zgci-bar-drag'

interface BarPos {
  left: number
  top: number
}

function ensureDragStyle() {
  if (document.getElementById(DRAG_STYLE_ID)) return
  const el = document.createElement('style')
  el.id = DRAG_STYLE_ID
  el.textContent = `
.${BAR_DRAG_HANDLE_CLS} { cursor: grab !important; opacity: .6 !important; padding: 5px 6px !important; }
.${BAR_DRAG_HANDLE_CLS}:hover { opacity: 1 !important; }
.${BAR_DRAG_HANDLE_CLS}:active { cursor: grabbing !important; }
body.zgci-bar-dragging, body.zgci-bar-dragging * { cursor: grabbing !important; user-select: none !important; }`
  document.head.appendChild(el)
}

/** 给浮动工具条挂拖拽把手。storageKey 每条工具条独立（如 zgci.annotbar.pos）。 */
export function attachBarDrag(bar: HTMLElement, storageKey: string) {
  if (bar.dataset.dragReady === '1') return
  bar.dataset.dragReady = '1'
  ensureDragStyle()

  const handle = document.createElement('button')
  handle.type = 'button'
  handle.className = BAR_DRAG_HANDLE_CLS
  handle.textContent = '✥'
  handle.title = '按住可拖动工具条位置'
  bar.insertBefore(handle, bar.firstChild)

  function applyPos(left: number, top: number) {
    const width = bar.offsetWidth
    const height = bar.offsetHeight
    const x = Math.min(Math.max(4, left), Math.max(4, window.innerWidth - width - 4))
    const y = Math.min(Math.max(4, top), Math.max(4, window.innerHeight - height - 4))
    bar.style.left = `${x}px`
    bar.style.top = `${y}px`
    bar.style.right = 'auto'
    bar.style.bottom = 'auto'
  }

  // 恢复上次位置
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as BarPos | null
    if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
      applyPos(saved.left, saved.top)
    }
  } catch {
    /* 忽略坏数据 */
  }

  let dragging = false
  let startLeft = 0
  let startTop = 0
  let startX = 0
  let startY = 0

  handle.addEventListener('mousedown', (e) => {
    dragging = true
    const rect = bar.getBoundingClientRect()
    startLeft = rect.left
    startTop = rect.top
    startX = e.clientX
    startY = e.clientY
    document.body.classList.add('zgci-bar-dragging')
    e.preventDefault()
  })

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return
    applyPos(startLeft + e.clientX - startX, startTop + e.clientY - startY)
  })

  document.addEventListener('mouseup', () => {
    if (!dragging) return
    dragging = false
    document.body.classList.remove('zgci-bar-dragging')
    const rect = bar.getBoundingClientRect()
    try {
      localStorage.setItem(storageKey, JSON.stringify({ left: rect.left, top: rect.top }))
    } catch {
      /* 存储失败忽略 */
    }
  })

  // 窗口尺寸变化时收回到视口内
  window.addEventListener('resize', () => {
    const rect = bar.getBoundingClientRect()
    if (rect.left || rect.top) applyPos(rect.left, rect.top)
  })
}
