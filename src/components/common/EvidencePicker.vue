<template>
  <div class="evidence-picker-container">
    <div class="evidence-list" v-if="selectedEvidences.length > 0">
      <div
        v-for="(item, idx) in selectedEvidences"
        :key="item.evidenceId"
        class="evidence-card"
      >
        <div class="card-header">
          <strong>{{ item.title }}</strong>
          <el-button type="danger" link size="small" @click="removeEvidence(idx)">
            移除
          </el-button>
        </div>
        <div class="card-meta">
          <span class="mono">sha256:{{ item.sha256.slice(0, 16) }}...</span>
          <StatusTag :code="item.status" />
        </div>
      </div>
    </div>

    <div class="picker-actions">
      <el-button size="small" @click="openModal">
        <el-icon><Plus /></el-icon> 选择已有证据文件
      </el-button>
    </div>

    <!-- Evidence Selection Modal -->
    <el-dialog
      v-model="dialogVisible"
      title="关联追溯证据凭证"
      width="600px"
      append-to-body
    >
      <el-table :data="availableList" @selection-change="handleSelectionChange" height="280">
        <el-table-column type="selection" width="45" />
        <el-table-column property="title" label="凭证名称" min-width="160" />
        <el-table-column property="type" label="类型" width="100" />
        <el-table-column label="校验摘要" width="160">
          <template #default="{ row }">
            <span class="mono">{{ row.sha256.slice(0, 12) }}...</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :code="row.status" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确认关联</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import StatusTag from '@/components/common/StatusTag.vue';

interface EvidenceItem {
  evidenceId: string;
  title: string;
  type: string;
  sha256: string;
  status: string;
}

const selectedEvidences = ref<EvidenceItem[]>([
  {
    evidenceId: 'EVI-20260808-01',
    title: '入仓验收单凭证.pdf',
    type: 'PDF单据',
    sha256: 'a38c91ef882310294821903847291048',
    status: 'ACCEPTED'
  },
  {
    evidenceId: 'EVI-20260808-02',
    title: '质检报告 QJ-240808-01.pdf',
    type: '质检凭证',
    sha256: '71c2a908123847aef9210823901428fa',
    status: 'CONFIRMED'
  }
]);

const dialogVisible = ref(false);
const availableList = ref<EvidenceItem[]>([
  { evidenceId: 'EVI-20260808-03', title: '基地产地证明文件.pdf', type: '产地凭证', sha256: '9923847291a823f00123984120938471', status: 'CONFIRMED' },
  { evidenceId: 'EVI-20260808-04', title: '有机肥施用签购单.png', type: '投入品凭证', sha256: '00129384729102938471209384729102', status: 'ACCEPTED' }
]);

const tempSelected = ref<EvidenceItem[]>([]);

const openModal = () => {
  dialogVisible.value = true;
};

const handleSelectionChange = (val: EvidenceItem[]) => {
  tempSelected.value = val;
};

const confirmSelection = () => {
  tempSelected.value.forEach((item) => {
    if (!selectedEvidences.value.find((e) => e.evidenceId === item.evidenceId)) {
      selectedEvidences.value.push(item);
    }
  });
  dialogVisible.value = false;
};

const removeEvidence = (index: number) => {
  selectedEvidences.value.splice(index, 1);
};
</script>

<style scoped>
.evidence-card {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
  background: var(--color-surface);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-muted);
}

.picker-actions {
  margin-top: 8px;
}
</style>
