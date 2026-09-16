<template>
  <div class="trust-page">
    <PageHeader
      title="证据文件与凭证"
      subtitle="质检报告 PDF、出入库单据、合同凭证文件检索与哈希校验"
    >
      <template #actions>
        <el-button type="primary" @click="createDialogVisible = true">登记证据</el-button>
      </template>
    </PageHeader>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input-number v-model="evidenceId" :min="1" placeholder="证据 ID" style="width: 220px" />
    </FilterBar>

    <div class="panel">
      <el-table :data="evidences" v-loading="loading">
        <el-table-column prop="evidenceId" label="证据编号" width="160" class-name="mono" />
        <el-table-column prop="name" label="证据文件名 *" min-width="200" />
        <el-table-column prop="type" label="证据类型" width="140" />
        <el-table-column prop="subjectType" label="主体类型" width="120" />
        <el-table-column prop="subjectId" label="主体 ID" width="120" class-name="mono" />
        <el-table-column prop="fileId" label="文件 ID" width="120" class-name="mono" />
        <el-table-column prop="fileHash" label="内容摘要" min-width="200" class-name="mono" />
        <el-table-column prop="status" label="状态" width="110" />
        <el-table-column prop="uploadTime" label="存证时间 *" width="160" />
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="verifyHash(row)">校验</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="createDialogVisible" title="登记证据" width="600px">
      <el-form :model="createForm" label-position="top">
        <div class="form-grid">
          <el-form-item label="证据类型" required><el-input v-model="createForm.evidenceType" /></el-form-item>
          <el-form-item label="主体类型" required>
            <el-select v-model="createForm.subjectType" style="width: 100%">
              <el-option label="EVENT" value="EVENT" /><el-option label="OBJECT" value="OBJECT" />
              <el-option label="FILE" value="FILE" /><el-option label="PROJECTION" value="PROJECTION" />
            </el-select>
          </el-form-item>
          <el-form-item label="主体 ID" required><el-input-number v-model="createForm.subjectId" :min="1" style="width: 100%" /></el-form-item>
          <el-form-item label="文件 ID"><el-input-number v-model="createForm.fileId" :min="1" style="width: 100%" /></el-form-item>
          <el-form-item label="签发方 ID"><el-input-number v-model="createForm.issuerPartyId" :min="1" style="width: 100%" /></el-form-item>
        </div>
        <el-form-item label="外部 URI 引用"><el-input v-model="createForm.externalUriRef" /></el-form-item>
        <el-form-item label="内容摘要"><el-input v-model="createForm.contentDigest" placeholder="sha256:..." /></el-form-item>
        <div class="form-grid">
          <el-form-item label="生效时间"><el-date-picker v-model="createForm.validFrom" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
          <el-form-item label="失效时间"><el-date-picker v-model="createForm.validTo" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createEvidence">登记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import { trustApi, type EvidenceBindRequest, type EvidenceItem } from '@/api/trust';

const evidenceId = ref<number | undefined>();
const loading = ref(false);
const creating = ref(false);
const createDialogVisible = ref(false);
const createForm = ref<EvidenceBindRequest>({ evidenceType: '', subjectType: 'EVENT', subjectId: 1 });

const evidences = ref<EvidenceItem[]>([]);

const loadEvidences = async () => {
  loading.value = true;
  try {
    evidences.value = await trustApi.getEvidenceList({ evidenceId: evidenceId.value });
  } catch (err) {
    console.error('Failed to load evidence', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  await loadEvidences();
};

const handleReset = async () => {
  evidenceId.value = undefined;
  evidences.value = [];
};

const createEvidence = async () => {
  if (!createForm.value.evidenceType || !createForm.value.subjectType || !createForm.value.subjectId) {
    ElMessage.warning('请填写证据类型、主体类型和主体 ID');
    return;
  }
  creating.value = true;
  try {
    const created = await trustApi.createEvidence(createForm.value);
    evidences.value = [created];
    evidenceId.value = Number(created.evidenceId) || undefined;
    createDialogVisible.value = false;
    ElMessage.success('证据登记成功');
  } catch {
    ElMessage.error('证据登记失败');
  } finally {
    creating.value = false;
  }
};

const verifyHash = async (row: any) => {
  try {
    const res = await trustApi.verifyEvidenceHash(row.evidenceId, {
      fileId: row.fileId, subjectType: row.subjectType, subjectId: row.subjectId, digest: row.fileHash
    });
    if (res.hashMatched) {
      ElMessage.success(`证据 [${row.evidenceId}] SHA-256 哈希与链上存证一致，验证成功！`);
    } else {
      ElMessage.error(`证据 [${row.evidenceId}] 哈希比对不一致！`);
    }
  } catch (err) {
    ElMessage.error(`证据 [${row.evidenceId}] 验真请求失败`);
  }
};
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}
</style>
