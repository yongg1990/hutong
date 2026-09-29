<template>
  <div class="trust-page">
    <PageHeader
      title="存证状态与链记录"
      subtitle="按主体查询存证处理状态、链记录、交易哈希与对账结果"
    >
      <template #actions>
        <el-button type="primary" @click="createVisible=true">创建存证任务</el-button>
        <el-button @click="operationVisible=true">运维补偿</el-button>
        <el-button @click="loadProofs">刷新存证状态</el-button>
        <el-button type="primary" :disabled="!proofs.length" @click="batchVerify">
          批量验真
        </el-button>
      </template>
    </PageHeader>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-select v-model="subjectType" placeholder="主体类型" style="width: 140px">
        <el-option label="EVENT" value="EVENT" />
        <el-option label="OBJECT" value="OBJECT" />
        <el-option label="BATCH" value="BATCH" />
        <el-option label="FILE" value="FILE" />
        <el-option label="PROJECTION" value="PROJECTION" />
      </el-select>
      <el-input v-model="subjectId" placeholder="主体 ID" style="width: 220px" />
      <el-input v-model="chainType" placeholder="链类型（可选）" style="width: 180px" clearable />
      <el-switch v-model="includeReceipts" active-text="包含回执" />
    </FilterBar>

    <!-- Proofs Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>存证与链记录 ({{ filteredProofs.length }})</h2>
        <span v-if="failedCount" class="sub-text">失败链记录 {{ failedCount }} 条</span>
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
    <el-dialog v-model="createVisible" title="创建存证任务" width="min(600px,94vw)"><el-form label-position="top"><el-form-item label="项目空间 ID" required><el-input v-model="proofForm.projectSpaceId" /></el-form-item><el-form-item label="存证策略 ID" required><el-input v-model="proofForm.proofPolicyId" /></el-form-item><el-form-item label="主体类型" required><el-select v-model="proofForm.subjectType"><el-option v-for="v in ['EVENT','OBJECT','FILE','PROJECTION','BATCH']" :key="v" :value="v" :label="v" /></el-select></el-form-item><el-form-item label="主体 ID" required><el-input v-model="proofForm.subjectId" /></el-form-item><el-form-item label="目标链"><div v-for="(target,index) in targets" :key="index" class="target-row"><el-select v-model="target.chainType"><el-option label="CHANGAN_CHAIN" value="CHANGAN_CHAIN" /><el-option label="FISCO_BCOS" value="FISCO_BCOS" /></el-select><el-input v-model="target.networkCode" placeholder="网络代码" /><el-button :icon="Delete" :disabled="targets.length===1" title="删除目标链" @click="targets.splice(index,1)" /></div><el-button :icon="Plus" @click="targets.push({chainType:'FISCO_BCOS',networkCode:''})">添加目标链</el-button></el-form-item></el-form><template #footer><el-button @click="createVisible=false">取消</el-button><el-button type="primary" :loading="operating" @click="createProof">提交</el-button></template></el-dialog>
    <el-dialog v-model="operationVisible" title="存证运维补偿" width="min(520px,94vw)"><el-form label-position="top"><el-form-item label="操作"><el-select v-model="operation"><el-option label="处理独立链任务" value="process" /><el-option label="创建补偿重试" value="retry" /><el-option label="链记录对账" value="reconcile" /></el-select></el-form-item><el-form-item :label="operation==='process'?'链任务 ID':'链记录 ID'" required><el-input v-model="operationId" /></el-form-item></el-form><template #footer><el-button @click="operationVisible=false">取消</el-button><el-button type="primary" :loading="operating" @click="runOperation">提交</el-button></template></el-dialog>
    <el-drawer v-model="operationResultVisible" title="存证操作结果" size="min(600px,94vw)"><pre style="white-space:pre-wrap;overflow-wrap:anywhere">{{ JSON.stringify(operationResult,null,2) }}</pre></el-drawer>
    <el-drawer
      v-model="drawerVisible"
      :title="'链记录详情: ' + (activeProof?.chainRecordId || activeProof?.proofNo || '')"
      size="540px"
      :close-on-click-modal="false"
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Plus } from '@element-plus/icons-vue';
import { extendedServices } from '@/api/extendedServices';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { trustApi, type ProofMerkleItem } from '@/api/trust';
import { apiErrorMessage } from '@/api/client';

const proofs = ref<ProofMerkleItem[]>([]);
const loading = ref(false);
const subjectType = ref('EVENT');
const subjectId = ref('');
const createVisible=ref(false), operationVisible=ref(false), operationResultVisible=ref(false), operating=ref(false);
const proofForm=ref({projectSpaceId:localStorage.getItem('tcmirp_project_space_id')||'',proofPolicyId:'',subjectType:'EVENT',subjectId:''});
const targets=ref([{chainType:'CHANGAN_CHAIN',networkCode:''}]);
const operation=ref<'process'|'retry'|'reconcile'>('process'), operationId=ref(''), operationResult=ref<Record<string,unknown>>({});
async function createProof(){if(![proofForm.value.projectSpaceId,proofForm.value.proofPolicyId,proofForm.value.subjectId].every(v=>/^\d+$/.test(v))||targets.value.some(v=>!v.networkCode.trim())){ElMessage.warning('请填写有效 ID 和目标网络代码');return;}operating.value=true;try{operationResult.value=await extendedServices.createProof({...proofForm.value,targets:targets.value});createVisible.value=false;operationResultVisible.value=true;ElMessage.success('存证任务已受理');}catch(e){ElMessage.error(apiErrorMessage(e,'创建失败'));}finally{operating.value=false;}}
async function runOperation(){if(!/^\d+$/.test(operationId.value.trim())){ElMessage.warning('请输入有效 ID');return;}try{await ElMessageBox.confirm('确认对当前项目中的指定任务或链记录执行操作？','确认操作',{type:'warning'});}catch{return;}operating.value=true;try{const actions={process:extendedServices.processProof,retry:extendedServices.retryProof,reconcile:extendedServices.reconcileProof};operationResult.value=await actions[operation.value](operationId.value.trim());operationVisible.value=false;operationResultVisible.value=true;ElMessage.success('操作已提交');}catch(e){ElMessage.error(apiErrorMessage(e,'存证操作失败'));}finally{operating.value=false;}}
const chainType = ref('');
const includeReceipts = ref(false);

const drawerVisible = ref(false);
const activeProof = ref<ProofMerkleItem | null>(null);

const failedCount = computed(() => proofs.value.filter(item => /FAILED/.test(item.chainStatus || item.status)).length);

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
  subjectId.value = '';
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
.target-row { display:flex; gap:8px; width:100%; margin-bottom:8px; flex-wrap:wrap; }
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
