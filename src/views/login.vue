<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User } from '@element-plus/icons-vue'
import { getDefaultDashboardPath, loginByCredentials, setCurrentUser } from '../utils/auth'

const REMEMBERED_USERNAME_KEY = 'zgca_ky_oa_remembered_username'

const form = reactive({
  username: '',
  password: '',
  remember: true,
})

const errorMessage = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const router = useRouter()

const canSubmit = computed(() => form.username.trim().length > 0 && form.password.length > 0)

onMounted(() => {
  form.username = window.localStorage.getItem(REMEMBERED_USERNAME_KEY) ?? ''
})

async function submitLogin() {
  if (!canSubmit.value || isSubmitting.value) return

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const matchedUser = loginByCredentials(form.username, form.password)

    if (!matchedUser) {
      errorMessage.value = '账号或密码不正确，请检查后重试。'
      return
    }

    if (form.remember) {
      window.localStorage.setItem(REMEMBERED_USERNAME_KEY, form.username.trim())
    } else {
      window.localStorage.removeItem(REMEMBERED_USERNAME_KEY)
    }

    setCurrentUser(matchedUser)
    await router.push(getDefaultDashboardPath(matchedUser))
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="visual-panel" aria-label="科研 OA 介绍">
      <div class="visual-overlay"></div>

      <div class="visual-content">
        <div class="product-lockup">
          <div>
            <img class="logo" src="../dataset/img/logo.png" alt="中关村人工智能研究院" />
          </div>
        </div>

        <div class="hero-copy">
          <h1 class="hero-title"><strong>科研管理系统</strong></h1>
          <span class="hero-divider" aria-hidden="true"></span>
          <p class="hero-subtitle">RESEARCH MANAGEMENT SYSTEM</p>
        </div>
      </div>
    </section>

    <section class="auth-panel" aria-label="登录">
      <form class="auth-card" novalidate @submit.prevent="submitLogin">
        <div class="auth-heading">
          <p class="auth-kicker">欢迎回来</p>
          <h2 class="auth-title">登录系统</h2>
          <p class="auth-subtitle">请输入您的账号</p>
        </div>

        <label class="field-group" for="username">
          <span class="field-label">用户名</span>
          <span class="input-shell">
            <span class="input-icon" aria-hidden="true">
              <el-icon><User /></el-icon>
            </span>
            <input
              id="username"
              v-model="form.username"
              class="field-input"
              name="username"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
              @input="errorMessage = ''"
            />
          </span>
        </label>

        <label class="field-group" for="password">
          <span class="field-label">密码</span>
          <span class="input-shell">
            <span class="input-icon" aria-hidden="true">
              <el-icon><Lock /></el-icon>
            </span>
            <input
              id="password"
              v-model="form.password"
              class="field-input"
              name="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="请输入密码"
              @input="errorMessage = ''"
            />
            <button class="input-button" type="button" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </span>
        </label>

        <div class="form-row">
          <label class="remember-option">
            <input v-model="form.remember" type="checkbox" />
            <span>记住我</span>
          </label>
          <button class="link-button" type="button">忘记密码？</button>
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <button class="submit-button" type="submit" :disabled="!canSubmit || isSubmitting">
          <span v-if="isSubmitting" class="loading-spinner" aria-hidden="true"></span>
          {{ isSubmitting ? '正在登录…' : '登录系统' }}
        </button>

        <p class="auth-footer">没有账号？请联系科研部管理办公室 <strong style="color: #172033;"> 田亚如老师 </strong>开通</p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(520px, 0.85fr);
  color: #172033;
  background: #f6f8fc;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
}

.visual-panel {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  background: url("../dataset/img/background.jpg") center / cover no-repeat;
}

.visual-panel::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: "";
  background:
    linear-gradient(90deg, rgba(0, 42, 88, 0.96) 0%, rgba(0, 55, 110, 0.84) 28%, rgba(0, 63, 123, 0.38) 62%, rgba(0, 63, 123, 0.04) 100%),
    linear-gradient(180deg, rgba(0, 33, 74, 0.3) 0%, rgba(0, 41, 86, 0.1) 45%, rgba(0, 38, 81, 0.68) 100%);
}

.visual-panel::after {
  position: absolute;
  inset: 0;
  z-index: 0;
  content: "";
  background:
    radial-gradient(circle at 0% 50%, rgba(0, 34, 78, 0.78), transparent 42%),
    linear-gradient(110deg, rgba(4, 47, 96, 0.44) 0 19%, transparent 19.2% 100%);
  pointer-events: none;
}

.visual-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 35%),
    linear-gradient(90deg, rgba(0, 28, 69, 0.42), transparent 54%);
  pointer-events: none;
}

.visual-content {
  position: relative;
  z-index: 1;
  width: min(760px, calc(100% - 112px));
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: clamp(40px, 4.6vw, 72px);
  color: #ffffff;
}

.product-lockup {
  position: absolute;
  top: 54px;
  left: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  display: block;
  width: min(440px, 54vw);
  filter: brightness(0) invert(1);
}

.hero-copy {
  max-width: 720px;
  animation: fade-up 0.6s ease both;
}

.hero-title,
.hero-subtitle {
  margin: 0;
}

.hero-title {
  display: grid;
  gap: 18px;
  color: #ffffff;
  text-shadow: 0 10px 32px rgba(0, 24, 56, 0.24);
}

.hero-title strong {
  font-size: clamp(58px, 5.7vw, 92px);
  line-height: 0.98;
  font-weight: 860;
  letter-spacing: 0;
}

.hero-divider {
  display: block;
  width: 90px;
  height: 4px;
  margin-top: 38px;
  background: #ffb454;
  box-shadow: 28px 0 0 rgba(255, 180, 84, 0.48);
}

.hero-subtitle {
  margin-top: 24px;
  color: #ffb454;
  font-size: 17px;
  font-weight: 500;
}

.auth-panel {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px;
  background: #f5f5f7;
}

.auth-card {
  width: min(470px, 100%);
  display: grid;
  gap: 20px;
  padding: 42px;
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 70px rgba(26, 39, 68, 0.12);
  animation: fade-up 0.62s 0.08s ease both;
}

.auth-heading {
  margin-bottom: 4px;
  text-align: left;
}

.auth-kicker,
.auth-title,
.auth-subtitle,
.auth-footer,
.error-message {
  margin: 0;
}

.auth-kicker {
  color: #0071e3;
  font-size: 15px;
  font-weight: 750;
}

.auth-title {
  margin-top: 8px;
  color: #1d1d1f;
  font-size: 32px;
  line-height: 1.2;
  font-weight: 820;
  letter-spacing: 0;
}

.auth-subtitle {
  margin-top: 8px;
  color: #86868b;
  font-size: 14px;
}

.field-group {
  display: grid;
  gap: 8px;
}

.field-label {
  color: #515154;
  font-size: 14px;
  font-weight: 650;
}

.field-label::before {
  content: "* ";
  color: #e35d5d;
}

.input-shell {
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid #d8d8dc;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.input-shell:focus-within {
  border-color: #0071e3;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.12);
}

.input-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  color: #a1a1a6;
  font-size: 20px;
}

.input-icon :deep(.el-icon) {
  width: 20px;
  height: 20px;
}

.field-input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  color: #1d1d1f;
  background: transparent;
  font-size: 16px;
}

.field-input::placeholder {
  color: #a1a1a6;
}

.input-button,
.link-button {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.input-button {
  padding: 6px 0;
  color: #0071e3;
  font-size: 13px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.remember-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6e6e73;
  font-size: 13px;
  white-space: nowrap;
}

.remember-option input {
  width: 16px;
  height: 16px;
  accent-color: #0071e3;
}

.link-button {
  color: #0071e3;
  font-size: 13px;
  font-weight: 650;
}

.error-message {
  padding: 10px 12px;
  border-radius: 10px;
  color: #c9362b;
  background: #fff2f1;
  font-size: 13px;
}

.submit-button {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 0;
  border-radius: 14px;
  color: #fff;
  background: #0071e3;
  box-shadow: 0 12px 26px rgba(0, 113, 227, 0.22);
  font-size: 16px;
  font-weight: 750;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #0077ed;
  box-shadow: 0 16px 30px rgba(0, 113, 227, 0.28);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
  box-shadow: none;
}

.loading-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.auth-footer {
  color: #9f9fa1;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1100px) {
  .login-page { grid-template-columns: 1fr; }
  .visual-panel { min-height: 420px; }
  .visual-content { width: min(760px, calc(100% - 96px)); min-height: 420px; }
  .auth-panel { min-height: auto; padding: 52px 24px; }
}

@media (max-width: 620px) {
  .visual-panel { min-height: 390px; }
  .visual-content { width: calc(100% - 48px); min-height: 390px; margin-left: 24px; }
  .product-lockup { top: 28px; }
  .logo { width: min(330px, 80vw); }
  .hero-title strong { font-size: 44px; }
  .hero-divider { margin-top: 28px; }
  .hero-subtitle { margin-top: 18px; font-size: 13px; }
  .auth-panel { padding: 28px 16px; }
  .auth-card { padding: 30px 22px 22px; border-radius: 18px; }
  .auth-title { font-size: 30px; }
}
</style>
