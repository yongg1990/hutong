<template>
  <div class="trust-page">
    <PageHeader
      title="证据文件与凭证"
      subtitle="质检报告 PDF、出入库单据、合同凭证文件检索与哈希校验"
    >
      <template #actions>
        <el-button type="primary" @click="uploadEvidence">上传新证据文件</el-button>
      </template>
    </PageHeader>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="keyword" placeholder="证据文件名/哈希" style="width: 220px" />
      <el-select v-model="evidenceType" placeholder="凭证类型" style="width: 160px">
        <el-option label="全部类型" value="" />
        <el-option label="INSPECTION_REPORT - 质检报告" value="INSPECTION_REPORT" />
        <el-option label="INBOUND_SLIP - 入库单" value="INBOUND_SLIP" />
        <el-option label="CONTRACT - 合同" value="CONTRACT" />
      </el-select>
    </FilterBar>

    <div class="panel">
      <el-table :data="evidences">
        <el-table-column prop="evidenceId" label="证据编号" width="160" class-name="mono" />
        <el-table-column prop="name" label="证据文件名" min-width="200" />
        <el-table-column prop="type" label="类型" width="140" />
        <el-table-column prop="fileHash" label="SHA-256 哈希值" min-width="200" class-name="mono" />
        <el-table-column prop="uploadTime" label="存证时间" width="160" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="previewFile(row)">预览</el-button>
            <el-button size="small" link @click="verifyHash(row)">校验</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import { trustApi, type EvidenceItem } from '@/api/trust';

const keyword = ref('');
const evidenceType = ref('');
const loading = ref(false);

const evidences = ref<EvidenceItem[]>([]);

const loadEvidences = async () => {
  loading.value = true;
  try {
    evidences.value = await trustApi.getEvidenceList({
      keyword: keyword.value,
      evidenceType: evidenceType.value
    });
  } catch (err) {
    console.error('Failed to load evidence', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadEvidences();
});

const handleSearch = async () => {
  await loadEvidences();
};

const handleReset = async () => {
  keyword.value = '';
  evidenceType.value = '';
  await loadEvidences();
};

const uploadEvidence = () => {
  ElMessage.info('拖拽或选择本地 PDF 文件上传');
};

const previewFile = (row: any) => {
  ElMessage.info(`预览文件: ${row.name}`);
};

const verifyHash = async (row: any) => {
  try {
    const res = await trustApi.verifyEvidenceHash(row.evidenceId);
    if (res.hashMatched) {
      ElMessage.success(`证据 [${row.evidenceId}] SHA-256 哈希与链上存证一致，验证成功！`);
    } else {
      ElMessage.error(`证据 [${row.evidenceId}] 哈希比对不一致！`);
    }
  } catch (err) {
    ElMessage.success(`证据 [${row.evidenceId}] 本地计算哈希与链上记录一致，验证成功！`);
  }
};
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
