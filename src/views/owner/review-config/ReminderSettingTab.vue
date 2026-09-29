<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { ReminderConfig, ReminderConfigKey, ReminderSettings } from './types'

interface ReminderTabConfig {
  key: ReminderConfigKey
  label: string
  enableLabel: string
  options: string[]
}

const settings = defineModel<ReminderSettings>({ required: true })
const activeReminder = shallowRef<ReminderConfigKey>('materialSubmit')

const reminderTabs: ReminderTabConfig[] = [
  {
    key: 'materialSubmit',
    label: '材料提交截止提醒',
    enableLabel: '启用材料提交截止提醒',
    options: ['项目负责人', '项目其他老师', '项目学生', '子方向负责人', '学部负责人'],
  },
  {
    key: 'reviewResult',
    label: '评审结果提交提醒',
    enableLabel: '启用评审结果提交提醒',
    options: ['评委', '子方向负责人', '科研项目管理员', '科研部负责人'],
  },
  {
    key: 'studentPerformance',
    label: '学生绩效提醒',
    enableLabel: '启用学生绩效提醒',
    options: ['项目负责人', '项目成员', '学生', '子方向负责人', '学部负责人'],
  },
]

const currentTab = computed(
  () => reminderTabs.find((tab) => tab.key === activeReminder.value) ?? reminderTabs[0],
)

const currentConfig = computed(() => settings.value[activeReminder.value])

async function validateAndSave(showMessage = true) {
  const error = validateSettings()

  if (error) {
    ElMessage.error(error)
    return false
  }

  if (showMessage) {
    ElMessage.success('提醒频率设置已保存')
  }
  return true
}

function validateSettings() {
  for (const tab of reminderTabs) {
    const config = settings.value[tab.key]

    if (!config.enabled) {
      continue
    }

    if (!Number.isInteger(config.advanceDays) || config.advanceDays < 1) {
      activeReminder.value = tab.key
      return `${tab.label}的提前提醒天数必须为大于等于 1 的整数`
    }

    if (!Number.isInteger(config.frequencyDays) || config.frequencyDays < 1) {
      activeReminder.value = tab.key
      return `${tab.label}的提醒频率必须为大于等于 1 的整数`
    }

    if (!config.receiverGroups.length) {
      activeReminder.value = tab.key
      return `${tab.label}至少需要选择一个提醒群体`
    }
  }

  return ''
}

function getSelectedCount(config: ReminderConfig) {
  return config.receiverGroups.length
}

defineExpose({ validateAndSave })
</script>

<template>
  <article class="config-card">
    <header class="card-header">
      <div class="title-row">
        <span class="title-icon">
          <el-icon><Bell /></el-icon>
        </span>
        <h3>提醒频率设置</h3>
      </div>

      <el-button type="primary" @click="validateAndSave">保存</el-button>
    </header>

    <el-tabs v-model="activeReminder" class="reminder-tabs">
      <el-tab-pane
        v-for="tab in reminderTabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
      />
    </el-tabs>

    <section class="reminder-panel">
      <el-checkbox v-model="currentConfig.enabled" class="enable-check">
        {{ currentTab.enableLabel }}
      </el-checkbox>

      <div class="reminder-grid" :class="{ disabled: !currentConfig.enabled }">
        <div class="reminder-fields">
          <label class="number-field">
            <span>提前提醒天数</span>
            <div class="inline-number">
              <el-input-number
                v-model="currentConfig.advanceDays"
                :min="1"
                :precision="0"
                :disabled="!currentConfig.enabled"
              />
              <em>天</em>
            </div>
            <small>在截止日期前多少天开始提醒</small>
          </label>

          <label class="number-field">
            <span>提醒频率</span>
            <div class="inline-number">
              <el-input-number
                v-model="currentConfig.frequencyDays"
                :min="1"
                :precision="0"
                :disabled="!currentConfig.enabled"
              />
              <em>天提醒一次</em>
            </div>
            <small>提醒的间隔天数</small>
          </label>
        </div>

        <div class="receiver-card">
          <div class="receiver-title">
            <strong>提醒群体选择</strong>
            <span>已选{{ getSelectedCount(currentConfig) }}个群体</span>
          </div>
          <el-checkbox-group v-model="currentConfig.receiverGroups" :disabled="!currentConfig.enabled">
            <el-checkbox v-for="option in currentTab.options" :key="option" :label="option" :value="option" />
          </el-checkbox-group>
        </div>
      </div>

      <p class="integration-note">后续将与钉钉组织架构及消息通知能力打通，当前原型阶段不真实发送消息。</p>
    </section>
  </article>
</template>

<style scoped>
.config-card {
  border: 1px solid rgba(0, 113, 227, 0.1);
  border-radius: 12px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 36px rgba(26, 39, 68, 0.07);
}

.card-header,
.title-row,
.receiver-title,
.inline-number {
  display: flex;
  align-items: center;
}

.card-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.title-row {
  gap: 10px;
}

.title-row h3 {
  margin: 0;
  color: #1d1d1f;
  font-size: 20px;
  font-weight: 820;
}

.title-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  color: #0a84ff;
  background: #e8f2ff;
}

.reminder-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.reminder-tabs :deep(.el-tabs__item) {
  color: #6e6e73;
  font-weight: 780;
}

.reminder-tabs :deep(.el-tabs__item.is-active) {
  color: #0a84ff;
}

.reminder-panel {
  border: 1px solid rgba(10, 132, 255, 0.18);
  border-radius: 10px;
  padding: 18px;
  background: linear-gradient(180deg, #f4f9ff 0%, #fbfdff 100%);
}

.enable-check {
  margin-bottom: 16px;
  font-weight: 820;
}

.reminder-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(320px, 1.15fr);
  gap: 26px;
}

.reminder-grid.disabled {
  opacity: 0.58;
}

.reminder-fields {
  display: grid;
  gap: 18px;
}

.number-field {
  display: grid;
  gap: 8px;
  color: #1d1d1f;
  font-weight: 760;
}

.number-field small {
  color: #86868b;
  font-weight: 500;
}

.inline-number {
  gap: 10px;
}

.inline-number :deep(.el-input-number) {
  width: 180px;
}

.inline-number em {
  color: #424245;
  font-style: normal;
  font-weight: 680;
}

.receiver-card {
  border: 1px solid rgba(29, 29, 31, 0.08);
  border-radius: 10px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.88);
}

.receiver-title {
  justify-content: space-between;
  margin-bottom: 10px;
}

.receiver-title span {
  color: #0a84ff;
  font-size: 13px;
  font-weight: 760;
}

.receiver-card :deep(.el-checkbox-group) {
  display: grid;
  gap: 10px;
}

.integration-note {
  margin: 18px 0 0;
  color: #0a84ff;
  font-size: 13px;
  font-weight: 720;
}

@media (max-width: 1080px) {
  .reminder-grid {
    grid-template-columns: 1fr;
  }
}
</style>
