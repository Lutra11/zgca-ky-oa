<script setup lang="ts">
import { computed, nextTick, shallowRef } from 'vue'
import { ArrowDown, ArrowRight, Delete, Plus, ScaleToOriginal } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { EvaluationRule } from './types'

const rules = defineModel<EvaluationRule[]>({ required: true })
const errorRuleId = shallowRef('')

const primaryTotal = computed(() => sumPercentages(rules.value.map((rule) => rule.percentage)))

function addPrimaryRule() {
  rules.value.push({
    id: createId('rule'),
    name: '新一级规则',
    percentage: 0,
    description: '描述',
    expanded: true,
    children: [
      {
        id: createId('sub-rule'),
        name: '新二级规则',
        percentage: 100,
        description: '描述',
      },
    ],
  })
}

function addSubRule(rule: EvaluationRule) {
  rule.children.push({
    id: createId('sub-rule'),
    name: '',
    percentage: 0,
    description: '',
  })
  rule.expanded = true
}

async function removePrimaryRule(ruleId: string) {
  try {
    await ElMessageBox.confirm('删除一级细则后，其下二级细则也会被删除，是否继续？', '删除一级细则', {
      type: 'warning',
      confirmButtonText: '继续删除',
      cancelButtonText: '取消',
      autofocus: false,
    })
    rules.value = rules.value.filter((rule) => rule.id !== ruleId)
  } catch {
    // 用户取消删除时不需要额外处理。
  }
}

function removeSubRule(rule: EvaluationRule, subRuleId: string) {
  rule.children = rule.children.filter((child) => child.id !== subRuleId)
}

async function validateAndSave(showMessage = true) {
  const error = validateRules()

  if (error) {
    ElMessage.error(error.message)
    errorRuleId.value = error.id
    await nextTick()
    document.querySelector('.rule-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return false
  }

  errorRuleId.value = ''
  if (showMessage) {
    ElMessage.success('评审标准细则已保存')
  }
  return true
}

function validateRules() {
  if (!rules.value.length) {
    return { id: '', message: '请至少配置一条一级细则' }
  }

  if (primaryTotal.value !== 100) {
    return { id: rules.value[0]?.id ?? '', message: '一级细则占比总和必须等于 100%' }
  }

  const primaryNames = new Set<string>()

  for (const rule of rules.value) {
    const ruleName = rule.name.trim()

    if (!ruleName) {
      return { id: rule.id, message: '一级细则名称不能为空' }
    }

    if (primaryNames.has(ruleName)) {
      return { id: rule.id, message: `一级细则名称不能重复：${ruleName}` }
    }

    primaryNames.add(ruleName)

    if (!rule.children.length) {
      return { id: rule.id, message: `${ruleName} 下至少需要一条二级细则` }
    }

    if (getSubRuleTotal(rule) !== 100) {
      return { id: rule.id, message: `${ruleName} 的二级细则占比总和必须等于 100%` }
    }

    const subNames = new Set<string>()

    for (const subRule of rule.children) {
      const subName = subRule.name.trim()

      if (!subName) {
        return { id: rule.id, message: `${ruleName} 下存在空的二级细则名称` }
      }

      if (subNames.has(subName)) {
        return { id: rule.id, message: `${ruleName} 下二级细则名称不能重复：${subName}` }
      }

      subNames.add(subName)
    }
  }

  return null
}

function getSubRuleTotal(rule: EvaluationRule) {
  return sumPercentages(rule.children.map((child) => child.percentage))
}

function getTotalClass(total: number) {
  return {
    'total-success': total === 100,
    'total-warning': total < 100,
    'total-danger': total > 100,
  }
}

function sumPercentages(values: number[]) {
  return Number(values.reduce((sum, value) => sum + Number(value || 0), 0).toFixed(1))
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`
}

defineExpose({ validateAndSave })
</script>

<template>
  <article class="config-card">
    <header class="card-header">
      <div class="title-row">
        <span class="title-icon">
          <el-icon><ScaleToOriginal /></el-icon>
        </span>
        <h3>评审标准细则</h3>
      </div>

      <div class="header-actions">
        <el-button :icon="Plus" plain @click="addPrimaryRule">添加一级规则</el-button>
        <el-button type="success" @click="validateAndSave">保存规则</el-button>
      </div>
    </header>

    <div class="rule-list">
      <section
        v-for="rule in rules"
        :key="rule.id"
        class="rule-card"
        :class="{ 'rule-error': errorRuleId === rule.id }"
      >
        <div class="primary-rule">
          <button class="collapse-button" type="button" @click="rule.expanded = !rule.expanded">
            <el-icon>
              <ArrowDown v-if="rule.expanded" />
              <ArrowRight v-else />
            </el-icon>
          </button>

          <el-input v-model="rule.name" class="rule-name" placeholder="细则名称" />

          <label class="percentage-field">
            <span>占比</span>
            <el-input-number v-model="rule.percentage" :min="0" :max="100" :precision="1" />
            <em>%</em>
          </label>

          <label class="description-field">
            <span>描述</span>
            <el-input v-model="rule.description" placeholder="请输入描述" />
          </label>

          <el-button :icon="Plus" plain @click="addSubRule(rule)">添加二级</el-button>
          <el-button class="danger-icon-button" :icon="Delete" plain @click="removePrimaryRule(rule.id)" />
        </div>

        <Transition name="rule-collapse">
          <div v-if="rule.expanded" class="sub-rule-list">
            <div v-for="subRule in rule.children" :key="subRule.id" class="sub-rule">
              <el-input v-model="subRule.name" placeholder="二级细则名称" />

              <label class="percentage-field">
                <span>占比</span>
                <el-input-number
                  v-model="subRule.percentage"
                  :min="0"
                  :max="100"
                  :precision="1"
                />
                <em>%</em>
              </label>

              <label class="description-field">
                <span>描述</span>
                <el-input v-model="subRule.description" placeholder="请输入描述" />
              </label>

              <el-button
                class="danger-icon-button"
                :icon="Delete"
                plain
                @click="removeSubRule(rule, subRule.id)"
              />
            </div>

            <p class="rule-total" :class="getTotalClass(getSubRuleTotal(rule))">
              二级细则总计：{{ getSubRuleTotal(rule) }}% / 100%
            </p>
          </div>
        </Transition>
      </section>
    </div>

    <p class="rule-total primary-total" :class="getTotalClass(primaryTotal)">
      一级细则总计：{{ primaryTotal }}% / 100%
    </p>
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
.header-actions,
.primary-rule,
.sub-rule,
.percentage-field {
  display: flex;
  align-items: center;
}

.card-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.title-row,
.header-actions {
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

.rule-list {
  display: grid;
  gap: 10px;
}

.rule-card {
  overflow: hidden;
  border: 1px solid rgba(0, 113, 227, 0.14);
  border-radius: 10px;
  background: #fbfdff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.rule-card:hover {
  box-shadow: 0 12px 26px rgba(26, 39, 68, 0.06);
}

.rule-error {
  border-color: rgba(255, 59, 48, 0.5);
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.08);
}

.primary-rule {
  display: grid;
  grid-template-columns: 28px minmax(130px, 0.8fr) minmax(140px, 0.45fr) minmax(220px, 1.5fr) 102px 42px;
  gap: 12px;
  padding: 12px;
}

.sub-rule-list {
  display: grid;
  gap: 10px;
  padding: 0 12px 12px 58px;
}

.sub-rule {
  display: grid;
  grid-template-columns: minmax(140px, 0.8fr) minmax(140px, 0.45fr) minmax(240px, 1.5fr) 42px;
  gap: 12px;
}

.collapse-button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  color: #424245;
  background: transparent;
  cursor: pointer;
}

.percentage-field,
.description-field {
  gap: 8px;
  min-width: 0;
}

.description-field {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}

.percentage-field span,
.description-field span {
  color: #6e6e73;
  font-size: 12px;
  font-weight: 760;
}

.percentage-field :deep(.el-input-number) {
  width: 92px;
}

.percentage-field em {
  color: #6e6e73;
  font-style: normal;
}

.danger-icon-button {
  width: 38px;
  border-color: rgba(255, 59, 48, 0.42);
  color: #ff3b30;
}

.rule-total {
  margin: 0;
  width: fit-content;
  border-radius: 7px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 820;
}

.primary-total {
  margin-top: 12px;
}

.total-success {
  color: #1a9c55;
  background: #e7f8ef;
}

.total-warning {
  color: #b56a00;
  background: #fff4df;
}

.total-danger {
  color: #ff3b30;
  background: #fff0ee;
}

.rule-collapse-enter-active,
.rule-collapse-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.rule-collapse-enter-from,
.rule-collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 1180px) {
  .primary-rule,
  .sub-rule {
    grid-template-columns: 1fr 1fr;
  }

  .collapse-button {
    display: none;
  }
}
</style>
