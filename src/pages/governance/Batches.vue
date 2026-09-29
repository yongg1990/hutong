<template>
  <div class="governance-page">
    <PageHeader
      title="接入批次与原始记录"
      subtitle="创建批量接入任务、留存不可变原始记录并按任务 ID 查询处理状态"
    >
      <template #actions>
        <el-button @click="loadBatches">刷新查询</el-button>
        <el-button @click="rawVisible = true">留存原始记录</el-button>
        <el-button @click="replayVisible = true">重放原始记录</el-button>
        <el-button type="primary" @click="openCreateBatchModal">
          + 创建接入批次作业
        </el-button>
      </template>
    </PageHeader>
    <el-alert type="info" :closable="false" title="接口不提供批次列表。请输入批量任务 ID 查询；原始记录重放需要单独的 rawRecordId。" style="margin-bottom: 12px" />

    <div v-if="lastOperation" class="operation-result panel">
      <div class="panel-header">
        <h2>{{ lastOperation.title }}</h2>
        <el-button text size="small" @click="lastOperation = null">关闭</el-button>
      </div>
      <div class="operation-grid">
        <div v-for="item in lastOperation.items" :key="item.label" class="operation-item">
          <span class="operation-label">{{ item.label }}</span>
          <span class="operation-value mono">{{ item.value || '-' }}</span>
        </div>
      </div>
    </div>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="batchId" placeholder="批量任务 ID（必填）" style="width: 220px" clearable />
      <el-switch v-model="includeFailures" active-text="包含失败明细" />
    </FilterBar>

    <div class="panel">
      <div class="panel-header">
        <h2>接入作业运行记录 ({{ batches.length }})</h2>
        <span v-if="totalFailed !== '0'" class="sub-text">失败记录 {{ totalFailed }} 条</span>
      </div>
      <div class="panel-body">
        <el-table :data="batches" v-loading="loading" style="width: 100%" empty-text="未找到匹配的接入批次">
          <el-table-column prop="batchId" label="批次号" min-width="160" class-name="mono">
            <template #default="{ row }">
              <span class="batch-id-text">{{ row.batchId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="mappingProfileVersion" label="映射配置版本" width="140" class-name="mono" />
          <el-table-column label="目标 Schema 版本" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ JSON.stringify(row.targetSchemaVersions || {}) }}</template>
          </el-table-column>
          <el-table-column prop="totalCount" label="记录总数" width="110" align="center" />
          <el-table-column label="处理成功 / 失败" min-width="160">
            <template #default="{ row }">
              <span class="text-success mono">{{ row.successCount }}</span>
              <span class="divider-slash">/</span>
              <span class="text-danger mono">{{ row.failCount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="processedAt" label="处理时间" min-width="170" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <StatusTag :code="row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作 / 排查" width="140" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openErrorDrawer(row)">
                失败明细
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Error Drawer -->
    <el-drawer v-model="drawerVisible" title="接入批次失败明细" size="520px" :close-on-click-modal="false">
      <div v-if="selectedBatch" class="drawer-inner">
        <div class="batch-meta-banner">
          <div class="meta-item">
            <span class="meta-label">批次号:</span>
            <span class="meta-val mono">{{ selectedBatch.batchId }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">失败记录:</span>
            <span class="meta-val text-danger">{{ selectedBatch.failCount }} 条</span>
          </div>
        </div>

        <el-table :data="selectedBatch.failedRecordDetails || []" empty-text="接口未返回失败明细">
          <el-table-column prop="lineNo" label="行号" width="70" />
          <el-table-column prop="code" label="错误码" width="110" />
          <el-table-column prop="fieldPath" label="字段路径" width="120" />
          <el-table-column prop="ruleCode" label="规则码" width="110" />
          <el-table-column prop="message" label="消息" min-width="180" />
        </el-table>

      </div>
    </el-drawer>
    <!-- Create Batch Modal (OpenAPI: POST /openapi/v1/batches) -->
    <el-dialog v-model="createBatchVisible" title="创建数据接入批次作业" width="560px" :close-on-click-modal="false">
      <el-form :model="batchForm" label-position="top">
        <el-form-item label="批次唯一编码 (batchCode)" required>
          <el-input v-model="batchForm.batchCode" placeholder="如: BATCH-KM-05" />
        </el-form-item>
        <el-form-item label="来源批次键 (sourceBatchKey)"><el-input v-model="batchForm.sourceBatchKey" /></el-form-item>
        <div style="display: flex; gap: 12px;">
          <el-form-item label="文件 ID (fileId)" style="flex: 1" required>
            <el-input v-model="batchForm.fileId" placeholder="数字 ID 字符串" />
          </el-form-item>
          <el-form-item label="业务用途 (businessPurpose)" style="flex: 1" required>
            <el-input v-model="batchForm.businessPurpose" placeholder="TRACE" />
          </el-form-item>
        </div>
        <div style="display: flex; gap: 12px;">
          <el-form-item label="来源系统 ID" style="flex: 1" required>
            <el-input v-model="batchForm.sourceSystemId" placeholder="数字 ID 字符串" />
          </el-form-item>
          <el-form-item label="输入数据格式 (inputFormat)" style="flex: 1" required>
            <el-select v-model="batchForm.inputFormat" style="width: 100%">
              <el-option label="JSON" value="JSON" />
              <el-option label="CSV" value="CSV" />
              <el-option label="XML" value="XML" />
            </el-select>
          </el-form-item>
        </div>
        <div style="display: flex; gap: 12px;">
          <el-form-item label="映射规则配置编码 (mappingProfileCode)" style="flex: 1" required>
            <el-input v-model="batchForm.mappingProfileCode" placeholder="MP_WMS_TO_WAREHOUSED" />
          </el-form-item>
          <el-form-item label="规则版本 (mappingProfileVersion)" style="flex: 1" required>
            <el-input v-model="batchForm.mappingProfileVersion" placeholder="1.4.0" />
          </el-form-item>
        </div>
        <div style="display: flex; gap: 12px;">
          <el-form-item label="预期记录总数 (expectedRecordCount)" style="flex: 1">
            <el-input v-model="batchForm.expectedRecordCount" placeholder="数字字符串" />
          </el-form-item>
          <el-form-item label="提交处理模式" style="flex: 1">
            <el-select v-model="batchForm.submitMode" style="width: 100%">
              <el-option label="ASYNC - 异步入队" value="ASYNC" />
              <el-option label="SYNC - 同步校验" value="SYNC" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="容错策略 (onError)">
          <el-radio-group v-model="batchForm.onError">
            <el-radio label="CONTINUE_ON_ERROR">遇到单条错误继续执行 (CONTINUE_ON_ERROR)</el-radio>
            <el-radio label="STOP_ON_ERROR">遇错即停 (STOP_ON_ERROR)</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createBatchVisible = false">取消</el-button>
        <el-button type="primary" :loading="creatingBatch" @click="confirmCreateBatch">确认提交</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="replayVisible" title="重放原始记录" width="480px" :close-on-click-modal="false">
      <el-form label-position="top">
        <el-form-item label="原始记录 ID" required><el-input v-model="replayRawId" /></el-form-item>
        <el-form-item label="映射版本" required><el-input v-model="replayVersion" /></el-form-item>
        <el-form-item label="重放原因" required><el-input v-model="replayReason" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="replayVisible = false">取消</el-button><el-button type="primary" :loading="replaying" @click="triggerReplay">提交重放</el-button></template>
    </el-dialog>
    <el-dialog v-model="rawVisible" title="留存原始记录" width="560px" :close-on-click-modal="false">
      <el-form :model="rawForm" label-position="top">
        <el-form-item label="项目空间 ID" required><el-input v-model="rawForm.projectSpaceId" placeholder="数字 ID 字符串" /></el-form-item>
        <el-form-item label="批量任务 ID"><el-input v-model="rawForm.batchId" placeholder="数字 ID 字符串" /></el-form-item>
        <el-form-item label="来源系统 ID" required><el-input v-model="rawForm.sourceSystemId" placeholder="数字 ID 字符串" /></el-form-item>
        <el-form-item label="来源业务键" required><el-input v-model="rawForm.sourceBusinessKey" /></el-form-item>
        <el-form-item label="内容类型" required><el-input v-model="rawForm.contentType" placeholder="application/json" /></el-form-item>
        <el-form-item label="内容摘要"><el-input v-model="rawForm.contentDigest" /></el-form-item>
        <el-form-item label="文件片段引用"><el-input v-model="rawForm.fileFragmentRef" /></el-form-item>
        <el-form-item label="原始内容"><el-input v-model="rawForm.rawPayload" type="textarea" :rows="6" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="rawVisible = false">取消</el-button><el-button type="primary" :loading="preserving" @click="preserveRaw">提交留存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi, type IngestBatch } from '@/api/governance';
import { apiErrorMessage } from '@/api/client';

const replayRawId = ref('');
const replayVersion = ref('');
const replayReason = ref('');
const replayVisible = ref(false);
const replaying = ref(false);
const rawVisible = ref(false);
const preserving = ref(false);
const rawForm = ref({ projectSpaceId: localStorage.getItem('tcmirp_project_space_id') || '', batchId: '', sourceSystemId: localStorage.getItem('tcmirp_source_system_id') || '', sourceBusinessKey: '', contentType: 'application/json', contentDigest: '', fileFragmentRef: '', rawPayload: '' });
const batchId = ref('');
const includeFailures = ref(true);
const drawerVisible = ref(false);
const createBatchVisible = ref(false);
const creatingBatch = ref(false);
const selectedBatch = ref<IngestBatch | null>(null);
const loading = ref(false);
const lastOperation = ref<{ title: string; items: Array<{ label: string; value: string }> } | null>(null);

const batchForm = ref({
  batchCode: '',
  sourceSystemId: localStorage.getItem('tcmirp_source_system_id') || '',
  mappingProfileCode: '',
  mappingProfileVersion: '',
  inputFormat: 'JSON',
  fileId: '',
  businessPurpose: '',
  sourceBatchKey: '',
  expectedRecordCount: '',
  submitMode: 'ASYNC',
  onError: 'CONTINUE_ON_ERROR'
});

const openCreateBatchModal = () => {
  batchForm.value = {
    batchCode: '',
    sourceSystemId: localStorage.getItem('tcmirp_source_system_id') || '',
    mappingProfileCode: '',
    mappingProfileVersion: '',
    inputFormat: 'JSON',
    fileId: '',
    businessPurpose: '',
    sourceBatchKey: '',
    expectedRecordCount: '',
    submitMode: 'ASYNC',
    onError: 'CONTINUE_ON_ERROR'
  };
  createBatchVisible.value = true;
};

const confirmCreateBatch = async () => {
  const numericFields = [batchForm.value.sourceSystemId, batchForm.value.fileId, batchForm.value.expectedRecordCount].filter(Boolean);
  if (numericFields.some(value => !/^-?\d+$/.test(value))) {
    ElMessage.warning('来源系统 ID、文件 ID 和预期记录数必须是数字字符串');
    return;
  }
  if (!batchForm.value.batchCode || !batchForm.value.sourceSystemId || !batchForm.value.fileId || !batchForm.value.mappingProfileCode || !batchForm.value.mappingProfileVersion || !batchForm.value.businessPurpose || !batchForm.value.inputFormat || !batchForm.value.onError || !batchForm.value.submitMode) {
    ElMessage.warning('请填写所有必填字段');
    return;
  }
  creatingBatch.value = true;
  try {
    const form = batchForm.value;
    const res = await governanceApi.createBatch({
      batchCode: form.batchCode,
      sourceSystemId: form.sourceSystemId,
      mappingProfileCode: form.mappingProfileCode,
      mappingProfileVersion: form.mappingProfileVersion,
      inputFormat: form.inputFormat,
      fileId: form.fileId,
      businessPurpose: form.businessPurpose,
      onError: form.onError,
      submitMode: form.submitMode,
      ...(form.sourceBatchKey.trim() ? { sourceBatchKey: form.sourceBatchKey.trim() } : {}),
      ...(form.expectedRecordCount.trim() ? { expectedRecordCount: form.expectedRecordCount.trim() } : {})
    });
    batchId.value = String(res.batchId);
    lastOperation.value = {
      title: '批次受理结果',
      items: [
        { label: '批次 ID', value: String(res.batchId || '') },
        { label: '业务编号', value: res.batchCode || '' },
        { label: '任务状态', value: res.batchStatus || '' },
        { label: '受理时间', value: res.acceptedAt || '' },
        { label: '状态查询地址', value: res.statusQueryUrl || '' }
      ]
    };
    createBatchVisible.value = false;
    ElMessage.success(`批次作业 [${res.batchCode}] 已受理`);
  } catch (e) {
    ElMessage.error(apiErrorMessage(e, '创建批次作业失败'));
    return;
  } finally {
    creatingBatch.value = false;
  }
  if (batchId.value) await loadBatches();
};

const batches = ref<IngestBatch[]>([]);

const sumCount = (field: 'totalCount' | 'successCount' | 'failCount') =>
  batches.value.reduce((acc, cur) => acc + BigInt(cur[field] || '0'), 0n);

const totalFailed = computed(() => sumCount('failCount').toString());

const loadBatches = async () => {
  if (!batchId.value.trim()) {
    batches.value = [];
    return;
  }
  if (!/^-?\d+$/.test(batchId.value.trim())) {
    batches.value = [];
    ElMessage.warning('批量任务 ID 必须是数字字符串');
    return;
  }
  loading.value = true;
  try {
    batches.value = await governanceApi.getBatches({
      batchId: batchId.value || undefined,
      includeFailures: includeFailures.value,
      pageNo: 1,
      pageSize: 100
    });
  } catch (err) {
    batches.value = [];
    console.error('Failed to load batches', err);
    ElMessage.error(apiErrorMessage(err, '批次查询失败'));
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  await loadBatches();
};

const handleReset = async () => {
  batchId.value = '';
  includeFailures.value = true;
  await loadBatches();
};

const openErrorDrawer = (row: IngestBatch) => {
  selectedBatch.value = row;
  drawerVisible.value = true;
};

const triggerReplay = async () => {
  if (!/^-?\d+$/.test(replayRawId.value) || !replayVersion.value.trim() || !replayReason.value.trim()) {
    ElMessage.warning('请输入原始记录 ID、映射版本和重放原因');
    return;
  }
  replaying.value = true;
  try {
    const res = await governanceApi.replayRawRecord(replayRawId.value, replayVersion.value, replayReason.value);
    lastOperation.value = {
      title: '原始记录重放结果',
      items: [
        { label: '重放 ID', value: String(res.replayId || '') },
        { label: '原始记录 ID', value: String(res.rawRecordId || '') },
        { label: '映射版本', value: res.mappingVersion || '' },
        { label: '处理状态', value: res.status || '' },
        { label: '请求时间', value: res.requestedAt || '' }
      ]
    };
    ElMessage.success(`原始记录重放已受理，任务 ID: ${res.replayId}`);
    replayVisible.value = false;
    if (batchId.value) await loadBatches();
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '重放请求失败'));
  } finally { replaying.value = false; }
};

const preserveRaw = async () => {
  const form = rawForm.value;
  const numericIds = [form.projectSpaceId, form.batchId, form.sourceSystemId].filter(Boolean);
  if (numericIds.some(value => !/^-?\d+$/.test(value))) {
    ElMessage.warning('项目空间 ID、批量任务 ID 和来源系统 ID 必须是数字字符串');
    return;
  }
  if (!form.projectSpaceId || !form.sourceSystemId || !form.sourceBusinessKey.trim() || !form.contentType.trim() || (!form.rawPayload && !form.fileFragmentRef)) {
    ElMessage.warning('请填写必填字段及原始内容或文件片段引用');
    return;
  }
  preserving.value = true;
  try {
    const result = await governanceApi.preserveRawRecord({
      projectSpaceId: form.projectSpaceId, sourceSystemId: form.sourceSystemId,
      ...(form.batchId ? { batchId: form.batchId } : {}), sourceBusinessKey: form.sourceBusinessKey,
      contentType: form.contentType, ...(form.contentDigest ? { contentDigest: form.contentDigest } : {}),
      ...(form.fileFragmentRef ? { fileFragmentRef: form.fileFragmentRef } : {}),
      ...(form.rawPayload ? { rawPayload: form.rawPayload } : {})
    });
    replayRawId.value = String(result.rawRecordId);
    lastOperation.value = {
      title: '原始记录留存结果',
      items: [
        { label: '原始记录 ID', value: String(result.rawRecordId || '') },
        { label: '内容摘要', value: result.contentDigest || '' },
        { label: '记录状态', value: result.status || '' },
        { label: '幂等命中', value: result.duplicate ? '是' : '否' }
      ]
    };
    rawVisible.value = false;
    ElMessage.success(`原始记录 ${result.rawRecordId} 已受理${result.duplicate ? '（幂等命中）' : ''}`);
  } catch (err) { ElMessage.error(apiErrorMessage(err, '原始记录留存失败')); }
  finally { preserving.value = false; }
};

</script>

<style scoped>
.governance-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: #fbfdfc;
}

.operation-result {
  margin-bottom: 14px;
  overflow: hidden;
}

.operation-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  padding: 14px 16px;
}

.operation-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.operation-label {
  color: var(--color-muted);
  font-size: 12px;
}

.operation-value {
  overflow-wrap: anywhere;
  color: var(--color-ink);
  font-size: 12px;
}

@media (max-width: 900px) {
  .operation-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.panel-header h2 {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
}

.sub-text {
  font-size: 12px;
  color: var(--color-muted);
}

.batch-id-text {
  font-weight: 600;
  color: var(--color-brand);
}

.divider-slash {
  margin: 0 4px;
  color: var(--color-border);
}

.text-success {
  color: var(--color-brand);
  font-weight: 600;
}

.text-danger {
  color: var(--color-danger);
  font-weight: 600;
}

.drawer-inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-meta-banner {
  background: #f8faf9;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.meta-label {
  color: var(--color-muted);
}

.meta-val {
  font-weight: 600;
}

.drawer-sec-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 0;
}

.error-log-box {
  background: #202823;
  color: #dce9e2;
  border-radius: 6px;
  padding: 14px;
  font-size: 12px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-line {
  border-left: 2px solid #e11d48;
  padding-left: 8px;
}

.action-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
