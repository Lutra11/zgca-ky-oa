<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  type FormInstance,
  type FormRules,
  type UploadFile,
  type UploadUserFile,
} from 'element-plus'
import { DocumentAdd, UploadFilled } from '@element-plus/icons-vue'
import {
  saveProjectMemberPaperRecord,
  type UserPaperProjectLink,
} from '../../dataset/projectMemberPaperOutcomesMock'
import { getProjectMemberProjects } from '../../dataset/projectMemberProjectsMock'
import type { LoggedInUser } from '../../types/auth'

const props = defineProps<{
  currentUser: LoggedInUser | null
}>()

type RelationMode = 'yes' | 'no'

const route = useRoute()
const router = useRouter()
const formRef = shallowRef<FormInstance>()
const pdfFileList = shallowRef<UploadUserFile[]>([])
const submitting = shallowRef(false)

const projectOptions = computed(() => getProjectMemberProjects(props.currentUser))

const form = reactive({
  title: '',
  resultType: '期刊论文',
  venueName: '',
  venueShortName: '',
  year: '2026',
  publishDate: '',
  paperStatus: '投稿中',
  doi: '',
  paperUrl: '',
  preprintUrl: '',
  authors: props.currentUser?.displayName ?? '',
  collegeAuthors: props.currentUser?.displayName ?? '',
  relationMode: 'yes' as RelationMode,
  projectCodes: [] as string[],
  remark: '',
  pdfFileName: '',
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入论文题名', trigger: 'blur' }],
  resultType: [{ required: true, message: '请选择论文类型', trigger: 'change' }],
  venueName: [{ required: true, message: '请输入期刊或会议名称', trigger: 'blur' }],
  year: [{ required: true, message: '请选择年度', trigger: 'change' }],
  authors: [{ required: true, message: '请输入作者信息', trigger: 'blur' }],
  projectCodes: [
    {
      validator: (_rule, value, callback) => {
        if (form.relationMode === 'yes' && (!Array.isArray(value) || value.length === 0)) {
          callback(new Error('请选择至少一个关联项目'))
          return
        }

        callback()
      },
      trigger: 'change',
    },
  ],
}

const selectedProjectLinks = computed<UserPaperProjectLink[]>(() => {
  const selectedSet = new Set(form.projectCodes)

  return projectOptions.value
    .filter((project) => selectedSet.has(project.projectCode))
    .map((project) => ({
      projectId: project.projectId,
      projectCode: project.projectCode,
      projectName: project.projectName,
      departmentName: project.departmentName,
      leaderName: project.leaderName,
    }))
})

function returnToPaperList() {
  const fallbackPath = route.path.replace(/\/new\/?$/, '')
  router.push(fallbackPath || '/project-member/my-papers')
}

function handleRelationModeChange(value: RelationMode) {
  if (value === 'no') {
    form.projectCodes = []
  }
}

function handlePdfChange(file: UploadFile) {
  const rawFile = file.raw

  if (!rawFile) {
    return
  }

  const isPdf = rawFile.type === 'application/pdf' || rawFile.name.toLowerCase().endsWith('.pdf')
  const isUnderLimit = rawFile.size / 1024 / 1024 <= 20

  if (!isPdf) {
    pdfFileList.value = []
    form.pdfFileName = ''
    ElMessage.error('仅支持上传 PDF 文件')
    return
  }

  if (!isUnderLimit) {
    pdfFileList.value = []
    form.pdfFileName = ''
    ElMessage.error('PDF 文件不能超过 20MB')
    return
  }

  form.pdfFileName = rawFile.name
  pdfFileList.value = [{ name: rawFile.name }]
}

function handlePdfRemove() {
  form.pdfFileName = ''
  pdfFileList.value = []
}

async function submitPaper() {
  if (submitting.value) {
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)

  if (!valid) {
    return
  }

  if (!form.pdfFileName) {
    ElMessage.warning('请上传论文 PDF')
    return
  }

  submitting.value = true

  saveProjectMemberPaperRecord(props.currentUser, {
    title: form.title,
    resultType: form.resultType,
    venueName: form.venueName,
    venueShortName: form.venueShortName,
    year: form.year,
    publishDate: form.publishDate,
    paperStatus: form.paperStatus,
    doi: form.doi,
    paperUrl: form.paperUrl,
    preprintUrl: form.preprintUrl,
    authors: form.authors,
    collegeAuthors: form.collegeAuthors,
    remark: form.remark,
    pdfFileName: form.pdfFileName,
    projectLinks: form.relationMode === 'yes' ? selectedProjectLinks.value : [],
  })

  ElMessage.success('论文已新增到本地原型数据')
  submitting.value = false
  returnToPaperList()
}
</script>

<template>
  <section class="paper-create-page" aria-label="新增论文">
    <section class="paper-create-card">
      <header class="paper-create-head">
        <div>
          <span class="head-kicker">
            <el-icon><DocumentAdd /></el-icon>
            新增论文
          </span>
          <h1>填写论文基本信息</h1>
        </div>
        <el-button @click="returnToPaperList">返回我的论文</el-button>
      </header>

      <el-form
        ref="formRef"
        class="paper-create-form"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <section class="form-section">
          <div class="section-title">
            <span>01</span>
            <strong>论文基本信息</strong>
          </div>

          <div class="form-grid">
            <el-form-item label="论文题名" prop="title" class="full">
              <el-input v-model="form.title" maxlength="160" show-word-limit placeholder="请输入论文题名" />
            </el-form-item>

            <el-form-item label="论文类型" prop="resultType">
              <el-select v-model="form.resultType" placeholder="请选择论文类型">
                <el-option label="期刊论文" value="期刊论文" />
                <el-option label="会议论文" value="会议论文" />
                <el-option label="预印本" value="预印本" />
              </el-select>
            </el-form-item>

            <el-form-item label="发表年度" prop="year">
              <el-select v-model="form.year" placeholder="请选择年度">
                <el-option label="2026" value="2026" />
                <el-option label="2025" value="2025" />
                <el-option label="2024" value="2024" />
              </el-select>
            </el-form-item>

            <el-form-item label="期刊 / 会议名称" prop="venueName">
              <el-input v-model="form.venueName" placeholder="请输入完整期刊或会议名称" />
            </el-form-item>

            <el-form-item label="期刊 / 会议简称">
              <el-input v-model="form.venueShortName" placeholder="例如 AAAI、NeurIPS、IEEE TAI" />
            </el-form-item>

            <el-form-item label="论文状态">
              <el-select v-model="form.paperStatus" placeholder="请选择论文状态">
                <el-option label="投稿中" value="投稿中" />
                <el-option label="已录用" value="已录用" />
                <el-option label="已发表" value="已发表" />
              </el-select>
            </el-form-item>

            <el-form-item label="发表日期">
              <el-date-picker
                v-model="form.publishDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择发表日期"
              />
            </el-form-item>

            <el-form-item label="作者" prop="authors" class="full">
              <el-input v-model="form.authors" placeholder="请输入作者，多个作者用逗号分隔" />
            </el-form-item>

            <el-form-item label="院内作者" class="full">
              <el-input v-model="form.collegeAuthors" placeholder="请输入院内作者与身份说明" />
            </el-form-item>

            <el-form-item label="DOI">
              <el-input v-model="form.doi" placeholder="请输入 DOI，没有可留空" />
            </el-form-item>

            <el-form-item label="论文链接">
              <el-input v-model="form.paperUrl" placeholder="请输入论文链接，没有可留空" />
            </el-form-item>

            <el-form-item label="预印本链接" class="full">
              <el-input v-model="form.preprintUrl" placeholder="请输入 arXiv 或其他预印本链接" />
            </el-form-item>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">
            <span>02</span>
            <strong>项目关联</strong>
          </div>

          <div class="form-grid">
            <el-form-item label="是否关联项目" class="full">
              <el-radio-group v-model="form.relationMode" @change="handleRelationModeChange">
                <el-radio-button label="yes">关联项目</el-radio-button>
                <el-radio-button label="no">不关联项目</el-radio-button>
              </el-radio-group>
            </el-form-item>

            <el-form-item v-if="form.relationMode === 'yes'" label="关联哪些项目" prop="projectCodes" class="full">
              <el-select
                v-model="form.projectCodes"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择一个或多个关联项目"
              >
                <el-option
                  v-for="project in projectOptions"
                  :key="project.projectCode"
                  :label="`${project.projectName}（${project.projectCode}）`"
                  :value="project.projectCode"
                />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="form-section">
          <div class="section-title">
            <span>03</span>
            <strong>论文 PDF</strong>
          </div>

          <div class="form-grid">
            <el-form-item label="上传 PDF" class="full" required>
              <el-upload
                v-model:file-list="pdfFileList"
                class="paper-upload"
                drag
                action="#"
                accept=".pdf,application/pdf"
                :auto-upload="false"
                :limit="1"
                :on-change="handlePdfChange"
                :on-remove="handlePdfRemove"
              >
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="el-upload__text">拖拽 PDF 到此处，或点击上传</div>
                <template #tip>
                  <div class="el-upload__tip">仅允许上传单个 PDF 文件，大小不超过 20MB。</div>
                </template>
              </el-upload>
            </el-form-item>

            <el-form-item label="备注" class="full">
              <el-input
                v-model="form.remark"
                type="textarea"
                maxlength="300"
                show-word-limit
                :rows="4"
                placeholder="可填写论文补充说明、成果归属说明或核验备注"
              />
            </el-form-item>
          </div>
        </section>
      </el-form>
    </section>

    <footer class="paper-create-actions">
      <el-button @click="returnToPaperList">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitPaper">保存论文</el-button>
    </footer>
  </section>
</template>

<style scoped>
.paper-create-page {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding-bottom: 74px;
}

.paper-create-card,
.paper-create-actions {
  border: 1px solid #e1e9f5;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 12px 34px rgba(36, 69, 116, 0.055);
}

.paper-create-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 26px;
  border-bottom: 1px solid #edf2f8;
}

.head-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3478e5;
  font-size: 13px;
  font-weight: 760;
}

.paper-create-head h1 {
  margin: 8px 0 0;
  color: #172b49;
  font-size: 24px;
  font-weight: 800;
}

.paper-create-form {
  padding: 22px 26px 28px;
}

.form-section + .form-section {
  margin-top: 24px;
  padding-top: 22px;
  border-top: 1px solid #edf2f8;
}

.section-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.section-title span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 10px;
  color: #3478e5;
  background: #edf5ff;
  font-size: 12px;
  font-weight: 800;
}

.section-title strong {
  color: #1d304d;
  font-size: 17px;
  font-weight: 780;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 22px;
}

.form-grid .full {
  grid-column: 1 / -1;
}

.paper-upload {
  width: 100%;
}

.paper-upload :deep(.el-upload),
.paper-upload :deep(.el-upload-dragger) {
  width: 100%;
}

.upload-icon {
  color: #3478e5;
  font-size: 34px;
}

.paper-create-actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 22px;
}

@media (max-width: 1180px) {
  .paper-create-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
