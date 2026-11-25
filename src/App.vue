<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'

/* ---- 标注模式（F9，修改需求）+ 字段说明（F8，写字段文档）：仅开发环境挂载，工具条见页面右下角 ---- */
let annotateCleanup: (() => void) | null = null
let fielddocCleanup: (() => void) | null = null
onMounted(async () => {
  if (import.meta.env.DEV) {
    const m = await import('./utils/annotate')
    annotateCleanup = m.init()
    // 控制台备用入口（正常流程不需要：右下角 📋 复制即可）
    ;(window as any).__zgci = {
      exportAnnots: () => { const s = m.exportAll(); console.log(s); try { void navigator.clipboard.writeText(s) } catch { /* ignore */ } return s },
      listAnnots: () => console.table(m.listAll()),
      clearAnnots: () => m.clearAll(),
    }
    const fd = await import('./utils/fielddoc')
    fielddocCleanup = fd.init()
    ;(window as any).__zgciFd = fd // fielddoc 自带 window.__zgciFd，这里保持引用便于排查
  }
})
onUnmounted(() => { annotateCleanup?.(); annotateCleanup = null; fielddocCleanup?.(); fielddocCleanup = null })
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page-slide" mode="out-in">
      <component
        :is="Component"
        :key="route.meta.roleKey ? `role-${String(route.meta.roleKey)}` : String(route.name ?? route.fullPath)"
      />
    </Transition>
  </RouterView>
</template>

<style scoped>
.page-slide-enter-active,
.page-slide-leave-active {
  transition:
    opacity 0.24s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
