<template>
  <section class="subdirection-dashboard" aria-label="子方向负责人首页">
    <article class="placeholder-card">
      <h1>我的首页</h1>
      <p>子方向负责人首页功能建设中</p>
    </article>
  </section>
</template>

<style scoped>
.subdirection-dashboard {
  min-height: 420px;
  display: grid;
  place-items: center;
}

.placeholder-card {
  width: min(620px, 100%);
  border: 1px solid rgba(10, 132, 255, 0.12);
  border-radius: 12px;
  padding: 42px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 42px rgba(26, 39, 68, 0.08);
  text-align: center;
}

.placeholder-card h1,
.placeholder-card p {
  margin: 0;
}

.placeholder-card h1 {
  color: #1d1d1f;
  font-size: 30px;
  font-weight: 860;
}

.placeholder-card p {
  margin-top: 10px;
  color: #6e6e73;
  font-size: 15px;
}
</style>
