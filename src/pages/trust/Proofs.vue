<template>
  <div class="trust-page">
    <PageHeader
      title="存证状态与链记录"
      subtitle="按主体查询存证处理状态、链记录、交易哈希与对账结果"
    >
      <template #actions>
        <el-button @click="loadProofs">刷新存证状态</el-button>
        <el-button type="primary" :disabled="!proofs.length" @click="batchVerify">
          批量验真
        </el-button>
      </template>
    </PageHeader>

    <!-- Top KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="label">存证单总数</span>
        <div class="value">
          <strong class="mono">{{ proofs.length }}</strong>
          <span class="unit">单</span>
        </div>
        <span class="sub">包含主链与联盟侧链存证</span>
      </div>

      <div class="kpi-card">
        <span class="label">已确认链记录</span>
        <div class="value">
          <strong class="mono">{{ confirmedCount }}</strong>
          <span class="unit">条</span>
        </div>
        <span class="sub">以链记录状态为准</span>
      </div>

      <div class="kpi-card">
        <span class="label">失败链记录</span>
        <div class="value">
          <strong class="mono">{{ failedCount }}</strong>
          <span class="unit">条</span>
        </div>
        <span class="sub">包含 FAILED 与 PARTIAL_FAILURE</span>
      </div>

      <div class="kpi-card">
        <span class="label">最新确认区块高度</span>
        <div class="value">
          <strong class="mono">{{ latestBlockHeight || '-' }}</strong>
          <span class="unit">区块</span>
        </div>
        <span class="sub">来自本次查询链记录</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-select v-model="subjectType" placeholder="主体类型" style="width: 140px">
        <el-option label="EVENT" value="EVENT" />
        <el-option label="OBJECT" value="OBJECT" />
        <el-option label="BATCH" value="BATCH" />
        <el-option label="FILE" value="FILE" />
        <el-option label="PROJECTION" value="PROJECTION" />
      </el-select>
      <el-input-number v-model="subjectId" :min="1" placeholder="主体 ID" style="width: 180px" />
      <el-input v-model="chainType" placeholder="链类型（可选）" style="width: 180px" clearable />
      <el-switch v-model="includeReceipts" active-text="包含回执" />
    </FilterBar>

    <!-- Proofs Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>存证与链记录 ({{ filteredProofs.length }})</h2>
        <span class="sub-text">查询条件与 CHN-010 存证状态接口一致</span>
      </div>
      <div class="panel-body">
        <el-table :data="filteredProofs" v-loading="loading" style="width: 100%" empty-text="未检索到匹配的存证记录">
          <el-table-column prop="proofNo" label="存证记录 ID" min-width="130" class-name="mono">
            <template #default="{ row }">
              <span class="proof-no-cell">{{ row.proofNo }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="subjectType" label="主体类型" width="110" />
          <el-table-column prop="subjectId" label="主体 ID" width="110" class-name="mono" />
          <el-table-column prop="chainRecordId" label="链记录 ID" width="120" class-name="mono" />
          <el-table-column prop="chainType" label="链类型" width="120" />
          <el-table-column prop="networkCode" label="网络代码" width="130" />
          <el-table-column prop="blockHeight" label="区块高度" width="120">
            <template #default="{ row }">
              <span class="mono">{{ row.blockHeight || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="链上交易 TX" min-width="180">
            <template #default="{ row }">
              <div class="hash-cell mono" :title="row.txHash">
                <span>{{ row.txHash ? row.txHash.slice(0, 10) + '...' + row.txHash.slice(-8) : '-' }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="confirmedAt" label="确认时间" width="170" />
          <el-table-column prop="reconcileStatus" label="对账状态" width="120" />
          <el-table-column prop="receiptPayload" label="回执原文" min-width="180" show-overflow-tooltip />
          <el-table-column prop="chainStatus" label="链记录状态" width="120" />
          <el-table-column label="存证状态" width="120">
            <template #default="{ row }">
              <StatusTag :code="row.status || 'ANCHORED'" />
            </template>
          </el-table-column>
          <el-table-column label="操作 / 验真" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link :disabled="!canVerify(row)" @click="verifyProof(row)">
                密码校验
              </el-button>
              <el-button size="small" link @click="viewRecord(row)">
                链记录
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Merkle Verification Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="'链记录详情: ' + (activeProof?.chainRecordId || activeProof?.proofNo || '')"
      size="540px"
    >
      <div v-if="activeProof" class="merkle-drawer-content">
        <h3 class="section-title">存证基础元数据</h3>
        <div class="meta-table">
          <div class="meta-row">
            <span class="meta-label">存证记录 ID:</span>
            <span class="meta-val mono">{{ activeProof.proofNo }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">主体:</span>
            <span class="meta-val mono">{{ activeProof.subjectType }} / {{ activeProof.subjectId }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">链类型 / 网络:</span>
            <span class="meta-val">{{ activeProof.chainType || '-' }} / {{ activeProof.networkCode || '-' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">区块高度:</span>
            <span class="meta-val mono">#{{ activeProof.blockHeight }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">链上交易哈希:</span>
            <span class="meta-val mono ellipsis" :title="activeProof.txHash">{{ activeProof.txHash }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">链记录状态:</span>
            <span class="meta-val">{{ activeProof.chainStatus || '-' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">确认时间:</span>
            <span class="meta-val">{{ activeProof.confirmedAt || '-' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">对账状态:</span>
            <span class="meta-val">{{ activeProof.reconcileStatus || '-' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">回执原文:</span>
            <span class="meta-val mono receipt">{{ activeProof.receiptPayload || '-' }}</span>
          </div>
        </div>

        <div class="drawer-actions">
          <el-button type="primary" style="width: 100%" @click="drawerVisible = false">
            完成核验
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { trustApi, type ProofMerkleItem } from '@/api/trust';
import { apiErrorMessage } from '@/api/client';

const proofs = ref<ProofMerkleItem[]>([]);
const loading = ref(false);
const subjectType = ref('EVENT');
const subjectId = ref<number | undefined>();
const chainType = ref('');
const includeReceipts = ref(false);

const drawerVisible = ref(false);
const activeProof = ref<ProofMerkleItem | null>(null);

const confirmedCount = computed(() => proofs.value.filter(item => item.chainStatus === 'CONFIRMED').length);
const failedCount = computed(() => proofs.value.filter(item => /FAILED/.test(item.chainStatus || item.status)).length);
const latestBlockHeight = computed(() => proofs.value.map(item => Number(item.blockHeight)).filter(Number.isFinite).sort((a, b) => b - a)[0]);

const filteredProofs = computed(() => proofs.value);

const loadProofs = async () => {
  if (!subjectId.value) {
    proofs.value = [];
    return;
  }
  loading.value = true;
  try {
    proofs.value = await trustApi.getMerkleProofs({
      subjectType: subjectId.value ? subjectType.value : undefined,
      subjectId: subjectId.value,
      chainType: chainType.value || undefined,
      includeReceipts: includeReceipts.value
    });
  } catch (err) {
    console.error('Failed to load proofs', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadProofs();
};

const handleReset = () => {
  subjectType.value = 'EVENT';
  subjectId.value = undefined;
  chainType.value = '';
  includeReceipts.value = false;
  loadProofs();
};

const verifyProof = async (row: ProofMerkleItem) => {
  try {
    const result = await trustApi.verifyProof(row);
    if (result?.matched || result?.verified) ElMessage.success(`存证记录 [${row.proofNo}] 验真通过`);
    else ElMessage.warning(`验真结果: ${result?.result || '未匹配'}`);
  } catch (err) {
    ElMessage.error(apiErrorMessage(err, '验真请求失败'));
  }
};

const canVerify = (row: ProofMerkleItem) => {
  return ['EVENT', 'OBJECT', 'FILE', 'PROJECTION'].includes(row.subjectType || '') && Boolean(row.subjectId);
};

const viewRecord = (row: ProofMerkleItem) => {
  activeProof.value = row;
  drawerVisible.value = true;
};

const batchVerify = async () => {
  const verifiable = proofs.value.filter(canVerify);
  const results = await Promise.allSettled(verifiable.map(item => trustApi.verifyProof(item)));
  const passed = results.reduce((count, item) => {
    if (item.status !== 'fulfilled') return count;
    return count + (item.value?.matched || item.value?.verified ? 1 : 0);
  }, 0);
  ElMessage.info(`批量验真完成：${passed}/${verifiable.length} 条通过`);
};
</script>

<style scoped>
.trust-page {
  padding-bottom: 24px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
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

.proof-no-cell {
  font-weight: 600;
  color: var(--color-brand);
}

.hash-cell {
  font-size: 12px;
  color: var(--color-ink);
}

.merkle-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-ink);
  margin: 6px 0;
}

.meta-table {
  background: #f8faf9;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 7px 0;
  border-bottom: 1px solid #edf0ee;
  font-size: 12.5px;
}

.meta-row:last-child {
  border-bottom: none;
}

.meta-label {
  color: var(--color-muted);
}

.meta-val {
  font-weight: 600;
  color: var(--color-ink);
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-actions {
  margin-top: 16px;
}

.receipt {
  max-width: 65%;
  overflow-wrap: anywhere;
  text-align: right;
}
</style>
