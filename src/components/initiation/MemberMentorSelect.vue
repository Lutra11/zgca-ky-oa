<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PersonOption } from '../../dataset/projectApplicationMock'

const props = defineProps<{
  memberIds: string[]
  mentorId: string
  memberOptions: PersonOption[]
  mentorOptions: PersonOption[]
}>()

const emit = defineEmits<{
  'update:memberIds': [value: string[]]
  'update:mentorId': [value: string]
}>()

const memberRemoteOptions = ref<PersonOption[]>(props.memberOptions)
const mentorRemoteOptions = ref<PersonOption[]>(props.mentorOptions)
const memberLoading = ref(false)
const mentorLoading = ref(false)

watch(
  () => props.memberOptions,
  (options) => {
    memberRemoteOptions.value = options
  },
)

watch(
  () => props.mentorOptions,
  (options) => {
    mentorRemoteOptions.value = options
  },
)

function filterOptions(options: PersonOption[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return options
  }

  return options.filter(
    (option) =>
      option.name.toLowerCase().includes(normalizedQuery) ||
      option.department.toLowerCase().includes(normalizedQuery) ||
      option.user_id.toLowerCase().includes(normalizedQuery),
  )
}

function remoteSearchMembers(query: string) {
  memberLoading.value = true
  window.setTimeout(() => {
    memberRemoteOptions.value = filterOptions(props.memberOptions, query)
    memberLoading.value = false
  }, 180)
}

function remoteSearchMentors(query: string) {
  mentorLoading.value = true
  window.setTimeout(() => {
    mentorRemoteOptions.value = filterOptions(props.mentorOptions, query)
    mentorLoading.value = false
  }, 180)
}

function updateMemberIds(value: unknown) {
  emit('update:memberIds', Array.isArray(value) ? value.map(String) : [])
}

function updateMentorId(value: unknown) {
  emit('update:mentorId', value ? String(value) : '')
}
</script>

<template>
  <div class="member-mentor-grid">
    <el-form-item label="项目成员" prop="project_members">
      <el-select
        class="member-select"
        :model-value="memberIds"
        multiple
        filterable
        remote
        reserve-keyword
        collapse-tags
        collapse-tags-tooltip
        :loading="memberLoading"
        placeholder="搜索并选择项目成员"
        :remote-method="remoteSearchMembers"
        @update:model-value="updateMemberIds"
      >
        <el-option
          v-for="person in memberRemoteOptions"
          :key="person.user_id"
          :label="person.name"
          :value="person.user_id"
          :disabled="person.user_id === mentorId"
        >
          <div class="person-option">
            <strong>{{ person.name }}</strong>
            <span>{{ person.department }}</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="导师" prop="mentor_id">
      <el-select
        class="mentor-select"
        :model-value="mentorId"
        filterable
        remote
        clearable
        reserve-keyword
        :loading="mentorLoading"
        placeholder="搜索并选择导师"
        :remote-method="remoteSearchMentors"
        @update:model-value="updateMentorId"
      >
        <el-option
          v-for="person in mentorRemoteOptions"
          :key="person.user_id"
          :label="person.name"
          :value="person.user_id"
        >
          <div class="person-option">
            <strong>{{ person.name }}</strong>
            <span>{{ person.department }}</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>
  </div>
</template>

<style scoped>
.member-mentor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 210px;
  gap: 20px;
}

.member-select,
.mentor-select {
  width: 100%;
}

.person-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.person-option strong {
  min-width: 0;
  overflow: hidden;
  color: #26344d;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-option span {
  flex: 0 0 auto;
  color: #8a95a7;
  font-size: 12px;
}

@media (max-width: 980px) {
  .member-mentor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
