<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function closeDialog() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="经费数据口径"
    width="560px"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="metric-explanation">
      <p>科研平台只展示预算与用友回传的付款、应付未付和冻结占用结果，不在前端重复实现付款、报销、冻结或解冻。</p>
      <dl>
        <div>
          <dt>实际付款执行率</dt>
          <dd>已付款金额 ÷ 项目总预算</dd>
        </div>
        <div>
          <dt>预算占用金额</dt>
          <dd>已付款金额 + 应付未付金额</dd>
        </div>
        <div>
          <dt>预算占用率</dt>
          <dd>预算占用金额 ÷ 项目总预算</dd>
        </div>
        <div>
          <dt>可用余额</dt>
          <dd>项目总预算 - 已付款金额 - 应付未付金额</dd>
        </div>
        <div>
          <dt>可用余额比例</dt>
          <dd>可用余额 ÷ 项目总预算</dd>
        </div>
      </dl>
      <el-alert
        type="info"
        show-icon
        :closable="false"
        title="注意：应付未付只计入预算占用，不统计为已付款。"
      />
    </div>

    <template #footer>
      <el-button type="primary" @click="closeDialog">我知道了</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.metric-explanation {
  display: grid;
  gap: 16px;
  color: #526177;
  line-height: 1.7;
}

.metric-explanation p {
  margin: 0;
}

.metric-explanation dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.metric-explanation dl div {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid #e4ebf5;
  border-radius: 10px;
  background: #f8fbff;
}

.metric-explanation dt {
  font-weight: 700;
  color: #152b4f;
}

.metric-explanation dd {
  margin: 0;
}
</style>
