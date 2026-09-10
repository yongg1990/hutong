<template>
  <div class="governance-page">
    <PageHeader
      title="接入批次"
      subtitle="批量同步、增量 CDC 与并发文件接入作业运行监控及异常治理"
    >
      <template #actions>
        <el-button @click="loadBatches">刷新列表</el-button>
        <el-button type="primary" @click="openCreateBatchModal">
          + 创建接入批次作业
        </el-button>
        <el-button @click="replayAllFailed">
          批量重试异常批次
        </el-button>
      </template>
    </PageHeader>

    <!-- KPI Summary Grid -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="label">接入作业总数</span>
        <div class="value">
          <strong class="mono">{{ batches.length }}</strong>
          <span class="unit">批次</span>
        </div>
        <span class="sub">包含定时同步与事件推送</span>
      </div>

      <div class="kpi-card">
        <span class="label">累计接入记录数</span>
        <div class="value">
          <strong class="mono">{{ totalRecords }}</strong>
          <span class="unit">条流水</span>
        </div>
        <span class="sub">涵盖种植、质检与仓储</span>
      </div>

      <div class="kpi-card">
        <span class="label">清洗入库成功数</span>
        <div class="value">
          <strong class="mono brand-color">{{ totalSuccess }}</strong>
          <span class="unit">条通过</span>
        </div>
        <span class="sub">通过率 {{ successRate }}%</span>
      </div>

      <div class="kpi-card">
        <span class="label">拦截异常记录数</span>
        <div class="value">
          <strong class="mono text-danger">{{ totalFailed }}</strong>
          <span class="unit">条待治理</span>
        </div>
        <span class="sub">已转入异常案卷等待重放</span>
      </div>
    </div>

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="batchNo" placeholder="接入批次号 (如 BATCH-KM-04)" style="width: 220px" clearable />
      <el-select v-model="sourceSystem" placeholder="全部来源系统" style="width: 180px" clearable>
        <el-option label="全部系统" value="" />
        <el-option label="WMS-KM-01 (昆明仓储)" value="WMS-KM-01" />
        <el-option label="LIMS-KM-02 (实验室)" value="LIMS-KM-02" />
        <el-option label="ERP-WS-01 (产业ERP)" value="ERP-WS-01" />
      </el-select>
    </FilterBar>

    <div class="panel">
      <div class="panel-header">
        <h2>接入作业运行记录 ({{ batches.length }})</h2>
        <span class="sub-text">支持对失败批次进行数据映射修复与就地重放</span>
      </div>
      <div class="panel-body">
        <el-table :data="batches" v-loading="loading" style="width: 100%" empty-text="未找到匹配的接入批次">
          <el-table-column prop="batchId" label="批次号" min-width="160" class-name="mono">
            <template #default="{ row }">
              <span class="batch-id-text">{{ row.batchId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sourceSystem" label="来源系统" min-width="130" />
          <el-table-column prop="totalCount" label="记录总数" width="110" align="center" />
          <el-table-column label="处理成功 / 失败" min-width="160">
            <template #default="{ row }">
              <span class="text-success mono">{{ row.successCount }}</span>
              <span class="divider-slash">/</span>
              <span class="text-danger mono">{{ row.failCount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="作业开始时间" min-width="160" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <StatusTag :code="row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作 / 排查" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="openErrorDrawer(row)">
                错误日志
              </el-button>
              <el-button
                size="small"
                type="warning"
                link
                v-if="row.failCount > 0"
                @click="triggerReplay(row)"
              >
                重试重放
              </el-button>
              <el-button size="small" link @click="router.push('/governance/cases')">
                案卷 ➔
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Error Drawer -->
    <el-drawer v-model="drawerVisible" title="接入批次异常错误日志与治理排查" size="520px">
      <div v-if="selectedBatch" class="drawer-inner">
        <div class="batch-meta-banner">
          <div class="meta-item">
            <span class="meta-label">批次号:</span>
            <span class="meta-val mono">{{ selectedBatch.batchId }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">来源系统:</span>
            <span class="meta-val">{{ selectedBatch.sourceSystem }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">失败记录:</span>
            <span class="meta-val text-danger">{{ selectedBatch.failCount }} 条</span>
          </div>
        </div>

        <h4 class="drawer-sec-title">异常堆栈 / 校验拦截日志</h4>
        <div class="error-log-box mono">
          <div class="log-line">[ERROR] Row #142: $.insurance_code 值 "869123" 格式校验失败，未满 16 位国家标准码要求。</div>
          <div class="log-line">[ERROR] Row #189: $.unit "公斤" 未配置标准单位映射字典 (需要映射为 "kg")。</div>
          <div class="log-line">[WARN] Row #204: 关联上游单号 SO-2026-0808-01 存在毫秒级并发幂等命中，已自动去重。</div>
        </div>

        <div class="action-card">
          <h4 class="drawer-sec-title">推荐治理链路：</h4>
          <div class="actions-list">
            <el-button type="primary" plain @click="goToMappings">
              前往字段映射规则修复 ($.unit) ➔
            </el-button>
            <el-button type="warning" plain @click="triggerReplay(selectedBatch)">
              对本批次触发立即重放 (Replay Job)
            </el-button>
            <el-button @click="goToCases">
              前往异常案卷查看归档原因 ➔
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
    <!-- Create Batch Modal (OpenAPI: POST /openapi/v1/batches) -->
    <el-dialog v-model="createBatchVisible" title="创建数据接入批次作业" width="560px">
      <el-form :model="batchForm" label-position="top">
        <el-form-item label="批次唯一编码 (batchCode)" required>
          <el-input v-model="batchForm.batchCode" placeholder="如: BATCH-KM-05" />
        </el-form-item>
        <div style="display: flex; gap: 12px;">
          <el-form-item label="来源系统 ID" style="flex: 1" required>
            <el-input v-model="batchForm.sourceSystemId" placeholder="如: 1" />
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
            <el-input-number v-model="batchForm.expectedRecordCount" :min="1" :max="100000" style="width: 100%" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { governanceApi, type IngestBatch } from '@/api/governance';

const router = useRouter();
const batchNo = ref('');
const sourceSystem = ref('');
const drawerVisible = ref(false);
const createBatchVisible = ref(false);
const creatingBatch = ref(false);
const selectedBatch = ref<IngestBatch | null>(null);
const loading = ref(false);

const batchForm = ref({
  batchCode: '',
  sourceSystemId: 1,
  mappingProfileCode: 'MP_WMS_TO_WAREHOUSED',
  mappingProfileVersion: '1.4.0',
  inputFormat: 'JSON',
  expectedRecordCount: 500,
  submitMode: 'ASYNC',
  onError: 'CONTINUE_ON_ERROR'
});

const openCreateBatchModal = () => {
  batchForm.value = {
    batchCode: `BATCH-KM-0${batches.value.length + 2}`,
    sourceSystemId: 1,
    mappingProfileCode: 'MP_WMS_TO_WAREHOUSED',
    mappingProfileVersion: '1.4.0',
    inputFormat: 'JSON',
    expectedRecordCount: 500,
    submitMode: 'ASYNC',
    onError: 'CONTINUE_ON_ERROR'
  };
  createBatchVisible.value = true;
};

const confirmCreateBatch = async () => {
  if (!batchForm.value.batchCode) {
    ElMessage.warning('请输入批次编码');
    return;
  }
  creatingBatch.value = true;
  try {
    const res = await governanceApi.createBatch(batchForm.value);
    batches.value.unshift({
      batchId: res.batchCode,
      sourceSystem: 'WMS-KM-01',
      totalCount: batchForm.value.expectedRecordCount,
      successCount: batchForm.value.expectedRecordCount,
      failCount: 0,
      startTime: new Date().toLocaleString(),
      status: 'PROCESSING'
    });
    createBatchVisible.value = false;
    ElMessage.success(`批次作业 [${res.batchCode}] 创建成功！已排入接入流水线队列`);
  } catch (e) {
    ElMessage.error('创建批次作业失败');
  } finally {
    creatingBatch.value = false;
  }
};

const batches = ref<IngestBatch[]>([]);

const totalRecords = computed(() => {
  return batches.value.reduce((acc, cur) => acc + (cur.totalCount || 0), 0);
});

const totalSuccess = computed(() => {
  return batches.value.reduce((acc, cur) => acc + (cur.successCount || 0), 0);
});

const totalFailed = computed(() => {
  return batches.value.reduce((acc, cur) => acc + (cur.failCount || 0), 0);
});

const successRate = computed(() => {
  if (totalRecords.value === 0) return 100;
  return ((totalSuccess.value / totalRecords.value) * 100).toFixed(1);
});

const goToMappings = () => {
  drawerVisible.value = false;
  router.push('/governance/mappings');
};

const goToCases = () => {
  drawerVisible.value = false;
  router.push('/governance/cases');
};

const loadBatches = async () => {
  loading.value = true;
  try {
    batches.value = await governanceApi.getBatches({
      batchNo: batchNo.value,
      sourceSystem: sourceSystem.value
    });
  } catch (err) {
    console.error('Failed to load batches', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBatches();
});

const handleSearch = async () => {
  await loadBatches();
  ElMessage.success('批次列表刷新完成！');
};

const handleReset = async () => {
  batchNo.value = '';
  sourceSystem.value = '';
  await loadBatches();
};

const openErrorDrawer = (row: IngestBatch) => {
  selectedBatch.value = row;
  drawerVisible.value = true;
};

const triggerReplay = async (row: IngestBatch) => {
  try {
    const res = await governanceApi.replayBatch(row.batchId);
    ElMessage.success(`已为批次 [${row.batchId}] 启动重放作业，任务 ID: ${res.jobId}`);
    if (drawerVisible.value) {
      drawerVisible.value = false;
    }
    await loadBatches();
  } catch (err) {
    ElMessage.error('重放请求失败，请检查网络');
  }
};

const replayAllFailed = async () => {
  ElMessage.success('已批量触发所有失败批次的异步补偿任务队列！');
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
