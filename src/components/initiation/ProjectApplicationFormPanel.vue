<script setup lang="ts">
import { shallowRef } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import ApplicationWordUpload from './ApplicationWordUpload.vue'
import HandwrittenSignaturePad from './HandwrittenSignaturePad.vue'
import ProjectParticipantEditor from './ProjectParticipantEditor.vue'
import type {
  ApplicationWordFileState,
  ProjectApplicationForm,
  ProjectApplicationMember,
  ProjectApplicationMentor,
} from '../../dataset/projectApplicationMock'

const props = withDefaults(
  defineProps<{
    modelValue: ProjectApplicationForm
    wordFile?: ApplicationWordFileState | null
    signatureDataUrl: string
    saving?: boolean
  }>(),
  {
    wordFile: null,
    saving: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: ProjectApplicationForm]
  'update:signatureDataUrl': [value: string]
  uploadWord: [file: File]
  previewWord: []
  saveSignature: [blob: Blob, dataUrl: string]
  clearSignature: []
  saveParticipants: []
}>()

const formRef = shallowRef<FormInstance>()
const requiredParticipantFields = ['name', 'school', 'college'] as const

function hasText(value: string | undefined) {
  return Boolean(value?.trim())
}

function isCompleteMember(member: ProjectApplicationMember) {
  return requiredParticipantFields.every((field) => hasText(member[field])) && hasText(member.student_no)
}

function isCompleteMentor(mentor: ProjectApplicationMentor) {
  return requiredParticipantFields.every((field) => hasText(mentor[field])) && hasText(mentor.mentor_no)
}

function validateParticipants(_: unknown, value: unknown, callback: (error?: Error) => void) {
  const members = Array.isArray(value) ? (value as ProjectApplicationMember[]) : []
  const mentors = props.modelValue.project_mentors ?? []

  if (members.length === 0) {
    callback(new Error('请至少添加一名项目成员'))
    return
  }

  if (!members.every(isCompleteMember)) {
    callback(new Error('请完整填写项目成员的姓名、学号、学校和学院'))
    return
  }

  if (mentors.length === 0) {
    callback(new Error('请至少添加一名导师'))
    return
  }

  if (!mentors.every(isCompleteMentor)) {
    callback(new Error('请完整填写导师的姓名、编号、学校和学院'))
    return
  }

  callback()
}

const formRules: FormRules<ProjectApplicationForm> = {
  project_type: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  project_name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { max: 100, message: '项目名称最多 100 字', trigger: 'blur' },
  ],
  project_description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' },
    { max: 500, message: '项目描述最多 500 字', trigger: 'blur' },
  ],
  fill_date: [{ required: true, message: '请选择填报时间', trigger: 'change' }],
  project_members: [{ validator: validateParticipants, trigger: 'change' }],
}

function updateField<K extends keyof ProjectApplicationForm>(key: K, value: ProjectApplicationForm[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function updateProjectType(value: unknown) {
  if (value === 'BASIC_CULTIVATION' || value === 'FREE_EXPLORATION') {
    updateField('project_type', value)
  }
}

function updateProjectMembers(members: ProjectApplicationMember[]) {
  updateField('project_members', members)
}

function updateProjectMentors(mentors: ProjectApplicationMentor[]) {
  const firstMentor = mentors[0]

  emit('update:modelValue', {
    ...props.modelValue,
    project_mentors: mentors,
    mentor_id: firstMentor?.mentor_id ?? '',
    mentor_name: firstMentor?.name ?? '',
  })
}

function handleSignatureSaved(blob: Blob, dataUrl: string) {
  emit('saveSignature', blob, dataUrl)
}

async function validate() {
  if (!formRef.value) {
    return false
  }

  await formRef.value.validate()
  return true
}

function clearValidate() {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  clearValidate,
})
</script>

<template>
  <el-form
    ref="formRef"
    class="project-application-form-card"
    :model="modelValue"
    :rules="formRules"
    label-position="top"
    status-icon
  >
    <section class="application-form-section">
      <div class="application-section-title">
        <span class="section-index">01</span>
        <div>
          <h2>项目基本信息</h2>
          <p>将部分基础信息同步写入申报书</p>
        </div>
      </div>

      <el-form-item label="项目类型" prop="project_type">
        <el-radio-group
          class="project-type-radio"
          :model-value="modelValue.project_type"
          @update:model-value="updateProjectType"
        >
          <el-radio-button label="BASIC_CULTIVATION">基础培育</el-radio-button>
          <el-radio-button label="FREE_EXPLORATION">自由探索</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="项目名称" prop="project_name">
        <el-input
          :model-value="modelValue.project_name"
          maxlength="100"
          show-word-limit
          placeholder="请输入项目名称"
          @update:model-value="updateField('project_name', String($event))"
        />
      </el-form-item>

      <div class="application-form-grid">
        <el-form-item label="项目负责人">
          <el-input :model-value="modelValue.project_leader_name" disabled>
            <template #prefix>
              <span class="leader-avatar">{{ modelValue.project_leader_name.slice(0, 1) || '项' }}</span>
            </template>
            <template #suffix>
              <span class="system-fill-tag">系统带入</span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="填报时间" prop="fill_date">
          <el-date-picker
            class="application-date-picker"
            :model-value="modelValue.fill_date"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            placeholder="请选择填报时间"
            @update:model-value="updateField('fill_date', String($event || ''))"
          />
        </el-form-item>
      </div>

      <el-form-item label="项目描述" prop="project_description">
        <el-input
          :model-value="modelValue.project_description"
          type="textarea"
          maxlength="500"
          show-word-limit
          :rows="4"
          placeholder="请输入项目描述"
          @update:model-value="updateField('project_description', String($event))"
        />
      </el-form-item>
    </section>

    <div class="application-form-divider"></div>

    <section class="application-form-section">
      <div class="application-section-title">
        <span class="section-index success">02</span>
        <div>
          <h2>项目成员与导师</h2>
          <p>手动维护学生和导师信息，保存后进入草稿</p>
        </div>
      </div>

      <el-form-item prop="project_members" class="participant-form-item">
        <ProjectParticipantEditor
          :members="modelValue.project_members"
          :mentors="modelValue.project_mentors"
          :saving="saving"
          @update:members="updateProjectMembers"
          @update:mentors="updateProjectMentors"
          @save="emit('saveParticipants')"
        />
      </el-form-item>
    </section>

    <div class="application-form-divider"></div>

    <section class="application-form-section">
      <div class="application-section-title">
        <span class="section-index violet">03</span>
        <div>
          <h2>上传申报书</h2>
          <p>后端保存原始 Word，并生成写入表单数据后的 PDF</p>
        </div>
      </div>

      <ApplicationWordUpload
        :word-file="wordFile"
        @upload="emit('uploadWord', $event)"
        @preview="emit('previewWord')"
      />
    </section>

    <div class="application-form-divider"></div>

    <section class="application-form-section signature-form-section">
      <div class="application-section-title">
        <span class="section-index orange">04</span>
        <div>
          <h2>签名确认</h2>
          <p>签名将以透明 PNG 形式写入承诺书签名栏</p>
        </div>
      </div>

      <HandwrittenSignaturePad
        :model-value="signatureDataUrl"
        @update:model-value="emit('update:signatureDataUrl', $event)"
        @saved="handleSignatureSaved"
        @clear="emit('clearSignature')"
      />
    </section>
  </el-form>
</template>

<style scoped>
.project-application-form-card {
  min-width: 0;
  overflow: hidden;
  padding: 22px 28px 20px;
  border: 1px solid var(--line);
  border-radius: 15px;
  background: #fff;
  box-shadow: var(--shadow);
}

.project-application-form-card :deep(.el-form-item) {
  margin-bottom: 16px;
}

.project-application-form-card :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.project-application-form-card :deep(.el-form-item__label) {
  color: #35445d;
  font-size: 13px;
  font-weight: 700;
}

.project-application-form-card :deep(.el-input__wrapper),
.project-application-form-card :deep(.el-select__wrapper),
.project-application-form-card :deep(.el-textarea__inner) {
  border-radius: 8px;
}

.project-application-form-card :deep(.el-input__wrapper),
.project-application-form-card :deep(.el-select__wrapper) {
  min-height: 40px;
}

.application-form-section {
  min-width: 0;
}

.application-section-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.application-section-title h2 {
  margin: 0;
  color: #1f304a;
  font-size: 18px;
  line-height: 1.35;
  font-weight: 760;
}

.application-section-title p {
  margin: 5px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.section-index {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  color: #246de2;
  background: #eef5ff;
  font-size: 12px;
  font-weight: 760;
}

.section-index.success {
  color: #16835d;
  background: #e8f7f1;
}

.section-index.violet {
  color: #7a55d8;
  background: #f3edff;
}

.section-index.orange {
  color: #cf6a28;
  background: #fff0e4;
}

.project-type-radio {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.project-type-radio :deep(.el-radio-button__inner) {
  min-width: 132px;
  border: 1px solid #dbe5f2;
  border-radius: 8px;
  box-shadow: none;
}

.project-type-radio :deep(.el-radio-button:first-child .el-radio-button__inner),
.project-type-radio :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 8px;
}

.application-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}

.application-date-picker {
  width: 100%;
}

.leader-avatar {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  color: #246de2;
  background: #eaf2ff;
  font-size: 12px;
  font-weight: 760;
}

.system-fill-tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 8px;
  border-radius: 999px;
  color: #7b8799;
  background: #eef2f7;
  font-size: 11px;
}

.application-form-divider {
  height: 1px;
  margin: 18px 0;
  background: #edf1f7;
}

.participant-form-item {
  margin-bottom: 0 !important;
}

.participant-form-item :deep(.el-form-item__content) {
  display: block;
  width: 100%;
}

.signature-form-section {
  padding-bottom: 0;
}

@media (max-width: 980px) {
  .application-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
