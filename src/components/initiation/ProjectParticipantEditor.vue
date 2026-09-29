<script setup lang="ts">
import { computed } from 'vue'
import type {
  ProjectApplicationMember,
  ProjectApplicationMentor,
} from '../../dataset/projectApplicationMock'

type MemberEditableField = 'name' | 'student_no' | 'school' | 'college'
type MentorEditableField = 'name' | 'mentor_no' | 'school' | 'college'

const props = withDefaults(
  defineProps<{
    members: ProjectApplicationMember[]
    mentors: ProjectApplicationMentor[]
    disabled?: boolean
    saving?: boolean
  }>(),
  {
    disabled: false,
    saving: false,
  },
)

const emit = defineEmits<{
  'update:members': [members: ProjectApplicationMember[]]
  'update:mentors': [mentors: ProjectApplicationMentor[]]
  save: []
}>()

const memberRows = computed(() => props.members ?? [])
const mentorRows = computed(() => props.mentors ?? [])

function createMemberRow(): ProjectApplicationMember {
  return {
    user_id: `student-manual-${Date.now()}-${memberRows.value.length + 1}`,
    name: '',
    student_no: '',
    school: '北京中关村学院',
    college: '',
  }
}

function createMentorRow(): ProjectApplicationMentor {
  return {
    mentor_id: `mentor-manual-${Date.now()}-${mentorRows.value.length + 1}`,
    name: '',
    mentor_no: '',
    school: '北京中关村学院',
    college: '',
  }
}

function updateMemberField(index: number, field: MemberEditableField, value: string) {
  const nextMembers = memberRows.value.map((member, rowIndex) =>
    rowIndex === index ? { ...member, [field]: value } : { ...member },
  )

  emit('update:members', nextMembers)
}

function updateMentorField(index: number, field: MentorEditableField, value: string) {
  const nextMentors = mentorRows.value.map((mentor, rowIndex) =>
    rowIndex === index ? { ...mentor, [field]: value } : { ...mentor },
  )

  emit('update:mentors', nextMentors)
}

function addMemberRow() {
  emit('update:members', [...memberRows.value.map((member) => ({ ...member })), createMemberRow()])
}

function addMentorRow() {
  emit('update:mentors', [...mentorRows.value.map((mentor) => ({ ...mentor })), createMentorRow()])
}

function removeMemberRow(index: number) {
  emit(
    'update:members',
    memberRows.value.filter((_, rowIndex) => rowIndex !== index).map((member) => ({ ...member })),
  )
}

function removeMentorRow(index: number) {
  emit(
    'update:mentors',
    mentorRows.value.filter((_, rowIndex) => rowIndex !== index).map((mentor) => ({ ...mentor })),
  )
}
</script>

<template>
  <section class="participant-editor" aria-label="项目成员与导师手动录入">
    <div class="participant-block">
      <header class="participant-block-header">
        <div>
          <h3>项目成员</h3>
          <p>手动填写学生姓名、学号、学校和学院</p>
        </div>
        <el-button type="primary" plain :disabled="disabled" @click="addMemberRow">
          新增成员
        </el-button>
      </header>

      <el-table
        class="participant-table"
        :data="memberRows"
        border
        row-key="user_id"
        empty-text="暂无项目成员，请点击新增成员"
      >
        <el-table-column type="index" label="序号" width="58" align="center" />
        <el-table-column label="学生姓名" min-width="150">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.name"
              :disabled="disabled"
              placeholder="请输入姓名"
              @update:model-value="updateMemberField($index, 'name', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="学号" min-width="150">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.student_no"
              :disabled="disabled"
              placeholder="请输入学号"
              @update:model-value="updateMemberField($index, 'student_no', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="学校" min-width="170">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.school"
              :disabled="disabled"
              placeholder="请输入学校"
              @update:model-value="updateMemberField($index, 'school', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="学院" min-width="170">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.college"
              :disabled="disabled"
              placeholder="请输入学院"
              @update:model-value="updateMemberField($index, 'college', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="88" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" :disabled="disabled" @click="removeMemberRow($index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="participant-block">
      <header class="participant-block-header">
        <div>
          <h3>导师</h3>
          <p>手动填写导师姓名、导师编号、学校和学院</p>
        </div>
        <el-button type="primary" plain :disabled="disabled" @click="addMentorRow">
          新增导师
        </el-button>
      </header>

      <el-table
        class="participant-table"
        :data="mentorRows"
        border
        row-key="mentor_id"
        empty-text="暂无导师，请点击新增导师"
      >
        <el-table-column type="index" label="序号" width="58" align="center" />
        <el-table-column label="导师姓名" min-width="150">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.name"
              :disabled="disabled"
              placeholder="请输入姓名"
              @update:model-value="updateMentorField($index, 'name', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="导师编号" min-width="150">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.mentor_no"
              :disabled="disabled"
              placeholder="请输入编号"
              @update:model-value="updateMentorField($index, 'mentor_no', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="学校" min-width="170">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.school"
              :disabled="disabled"
              placeholder="请输入学校"
              @update:model-value="updateMentorField($index, 'school', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="学院" min-width="170">
          <template #default="{ row, $index }">
            <el-input
              :model-value="row.college"
              :disabled="disabled"
              placeholder="请输入学院"
              @update:model-value="updateMentorField($index, 'college', String($event))"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="88" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" :disabled="disabled" @click="removeMentorRow($index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <footer class="participant-editor-footer">
      <span>成员和导师信息将随申报草稿一起保存</span>
      <el-button type="primary" :loading="saving" :disabled="disabled" @click="emit('save')">
        保存
      </el-button>
    </footer>
  </section>
</template>

<style scoped>
.participant-editor {
  display: grid;
  gap: 18px;
  min-width: 0;
  width: 100%;
}

.participant-block {
  min-width: 0;
  display: grid;
  gap: 12px;
}

.participant-block-header,
.participant-editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.participant-block-header h3 {
  margin: 0;
  color: #263855;
  font-size: 14px;
  font-weight: 760;
}

.participant-block-header p,
.participant-editor-footer span {
  margin: 5px 0 0;
  color: #8a95a7;
  font-size: 12px;
}

.participant-editor-footer {
  justify-content: flex-end;
  padding-top: 2px;
}

.participant-editor-footer span {
  margin: 0;
}

.participant-table {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
}

.participant-table :deep(.el-table__header th) {
  height: 40px;
  color: #53627a;
  background: #f7faff;
  font-size: 12px;
  font-weight: 700;
}

.participant-table :deep(.el-table__cell) {
  padding: 8px 0;
}

.participant-table :deep(.el-input__wrapper) {
  min-height: 34px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px #dce5f1 inset;
}

.participant-table :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3478ee inset;
}

.participant-table :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 980px) {
  .participant-block-header,
  .participant-editor-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
