<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { LoggedInUser } from '../../../types/auth'
import {
  buildRecruitmentFromForm,
  getRecruitmentLeaderProjects,
  upsertRecruitment,
  type ProjectRecruitment,
  type ProjectRecruitmentForm,
  type ProjectRecruitmentState,
  type RecruitmentLeaderProject,
} from '../../../dataset/projectRecruitmentMock'

const props = defineProps<{
  modelValue: boolean
  state: ProjectRecruitmentState
  currentUser: LoggedInUser | null
  recruitment?: ProjectRecruitment | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const formRef = shallowRef<FormInstance>()
const submitting = shallowRef(false)

const today = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
})

const leaderProjects = computed(() => getRecruitmentLeaderProjects(props.currentUser))
const selectedProject = computed<RecruitmentLeaderProject | undefined>(() =>
  leaderProjects.value.find((project) => project.project_id === form.project_id),
)
const isChangeMode = computed(() => Boolean(props.recruitment && props.recruitment.status === 'PUBLISHED'))
const dialogTitle = computed(() => {
  if (isChangeMode.value) {
    return '变更招募信息'
  }

  return props.recruitment ? '编辑项目招募' : '发布项目招募'
})
const primaryButtonText = computed(() => (isChangeMode.value ? '确认变更' : '发布招募'))
const alertTitle = computed(() =>
  isChangeMode.value
    ? '可变更已发布招募的负责人介绍、项目简介、招募人数和招募方向及要求；确认后立即更新当前招募信息。'
    : '项目名称从当前项目负责人负责的在研项目中选择；项目负责人姓名由系统自动带入。',
)

const form = reactive<ProjectRecruitmentForm>({
  project_id: '',
  project_code: '',
  project_name: '',
  leader_introduction: '',
  project_description: '',
  position_name: '项目学生招募',
  planned_count: 1,
  target_grade: '不限年级',
  application_deadline: today.value,
  requirements: '',
  work_content: '参与项目研究、阶段材料整理与成果产出等相关工作。',
  status: 'DRAFT',
})

const rules: FormRules<ProjectRecruitmentForm> = {
  project_id: [{ required: true, message: '请选择招募项目', trigger: 'change' }],
  leader_introduction: [{ required: true, message: '请填写项目负责人介绍', trigger: 'blur' }],
  planned_count: [
    {
      validator: (_rule, value, callback) => {
        if (!Number(value) || Number(value) <= 0) {
          callback(new Error('计划招募人数必须大于 0'))
          return
        }

        callback()
      },
      trigger: 'change',
    },
  ],
  requirements: [{ required: true, message: '请填写招募方向及要求', trigger: 'blur' }],
}

function resetForm() {
  const firstProject = leaderProjects.value[0]

  form.project_id = props.recruitment?.project_id ?? firstProject?.project_id ?? ''
  form.project_code = props.recruitment?.project_code ?? firstProject?.project_code ?? ''
  form.project_name = props.recruitment?.project_name ?? firstProject?.project_name ?? ''
  form.leader_introduction = props.recruitment?.leader_introduction ?? ''
  form.project_description = props.recruitment?.project_description ?? firstProject?.project_description ?? ''
  form.position_name = props.recruitment?.position_name ?? '项目学生招募'
  form.planned_count = props.recruitment?.planned_count ?? 1
  form.target_grade = props.recruitment?.target_grade ?? '不限年级'
  form.application_deadline = props.recruitment?.application_deadline ?? today.value
  form.requirements = props.recruitment?.requirements ?? ''
  form.work_content = props.recruitment?.work_content ?? '参与项目研究、阶段材料整理与成果产出等相关工作。'
  form.status = props.recruitment?.status ?? 'DRAFT'
}

function handleProjectChange(projectId: string) {
  const project = leaderProjects.value.find((item) => item.project_id === projectId)

  if (!project) {
    return
  }

  form.project_code = project.project_code
  form.project_name = project.project_name
  form.project_description = project.project_description
}

async function submit(nextStatus: 'DRAFT' | 'PUBLISHED') {
  if (submitting.value) {
    return
  }

  if (!selectedProject.value) {
    ElMessage.warning('当前没有可发布招募的在研项目')
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  submitting.value = true
  form.status = nextStatus

  window.setTimeout(() => {
    const recruitment = buildRecruitmentFromForm(form, selectedProject.value as RecruitmentLeaderProject, props.currentUser, props.recruitment ?? undefined)

    upsertRecruitment(props.state, recruitment)
    submitting.value = false
    ElMessage.success(nextStatus === 'PUBLISHED' ? (isChangeMode.value ? '招募信息已变更' : '招募信息已发布') : '招募草稿已保存')
    emit('saved')
    emit('update:modelValue', false)
  }, 240)
}

watch(
  () => [props.modelValue, props.recruitment?.id, leaderProjects.value.length],
  () => {
    if (props.modelValue) {
      resetForm()
      formRef.value?.clearValidate()
    }
  },
  { immediate: true },
)
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="720px"
    append-to-body
    class="recruitment-form-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-alert
      class="recruitment-form-alert"
      type="info"
      show-icon
      :closable="false"
      :title="alertTitle"
    />

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <div class="recruitment-form-grid">
        <el-form-item class="full" label="01 项目名称" prop="project_id">
          <p class="field-tip">从下拉菜单中选择</p>
          <el-select v-model="form.project_id" placeholder="请选择在研项目" @change="handleProjectChange">
            <el-option
              v-for="project in leaderProjects"
              :key="project.project_id"
              :label="`${project.project_code} · ${project.project_name}`"
              :value="project.project_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item class="full" label="02 项目负责人姓名">
          <el-input :model-value="currentUser?.displayName ?? selectedProject?.leader_name ?? '当前项目负责人'" readonly />
        </el-form-item>

        <el-form-item class="full" label="03 项目负责人介绍" prop="leader_introduction">
          <p class="field-tip">简要介绍您的研究方向、学术背景及代表性成果等，以便学生更好地了解您。</p>
          <el-input
            v-model.trim="form.leader_introduction"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入内容"
          />
        </el-form-item>

        <el-form-item class="full" label="04 项目简介">
          <p class="field-tip">简要介绍当前项目组的研究方向、主要研究内容及阶段性进展，如已取得的成果、当前推进的重点等。</p>
          <el-input
            v-model.trim="form.project_description"
            type="textarea"
            :rows="4"
            maxlength="600"
            show-word-limit
            placeholder="请输入内容"
          />
        </el-form-item>

        <el-form-item class="full" label="05 招募人数" prop="planned_count">
          <el-input-number v-model="form.planned_count" :min="1" :max="99" controls-position="right" />
        </el-form-item>

        <el-form-item class="full" label="06 招募方向及要求" prop="requirements">
          <p class="field-tip">简要说明项目招募学生的方向及要求，包括专业背景、技能要求等，便于学生了解项目并进行匹配。</p>
          <el-input
            v-model.trim="form.requirements"
            type="textarea"
            :rows="5"
            maxlength="600"
            show-word-limit
            placeholder="请输入内容"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button v-if="!isChangeMode" :loading="submitting" @click="submit('DRAFT')">保存草稿</el-button>
      <el-button type="primary" :loading="submitting" @click="submit('PUBLISHED')">{{ primaryButtonText }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.recruitment-form-alert {
  margin-bottom: 16px;
}

.field-tip {
  margin: -2px 0 8px;
  color: #8a98ad;
  font-size: 12px;
  line-height: 1.6;
}

.recruitment-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px 24px;
}

.recruitment-form-grid .full {
  grid-column: 1 / -1;
}

.recruitment-form-grid :deep(.el-input-number),
.recruitment-form-grid :deep(.el-select),
.recruitment-form-grid :deep(.el-date-editor) {
  width: 100%;
}

@media (max-width: 720px) {
  .recruitment-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
