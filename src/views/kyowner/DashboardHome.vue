<script setup lang="ts">
defineProps<{
  roleName?: string
}>()
</script>

<template>
  <section class="kyowner-placeholder" aria-label="管理办负责人首页">
    <div class="placeholder-card">
      <span class="placeholder-kicker">{{ roleName ?? '管理办负责人' }}</span>
      <h3>这里是管理办负责人首页</h3>
    </div>
  </section>
</template>

<style scoped>
.kyowner-placeholder {
  min-height: 360px;
  display: grid;
  place-items: center;
}

.placeholder-card {
  width: min(560px, 100%);
  border: 1px solid rgba(0, 113, 227, 0.1);
  border-radius: 12px;
  padding: 34px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 38px rgba(26, 39, 68, 0.08);
  text-align: center;
}

.placeholder-kicker {
  color: #0a84ff;
  font-size: 13px;
  font-weight: 820;
}

.placeholder-card h3 {
  margin: 10px 0 0;
  color: #1d1d1f;
  font-size: 24px;
  font-weight: 860;
}
</style>
