<script setup lang="ts">
import { RouterView } from 'vue-router'
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
