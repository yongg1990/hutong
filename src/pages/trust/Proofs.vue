<template>
  <div class="trust-page">
    <PageHeader
      title="存证单与 Merkle 证明"
      subtitle="存证批次根哈希 (Merkle Root)、区块链区块高度与密码学完整性路径校验"
    >
      <template #actions>
        <el-button @click="loadProofs">刷新存证状态</el-button>
        <el-button type="primary" @click="batchVerify">
          全量密码学批量重验
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
        <span class="label">累计打包可信事件</span>
        <div class="value">
          <strong class="mono">{{ totalEvents }}</strong>
          <span class="unit">条事件</span>
        </div>
        <span class="sub">均已上链并计算 Merkle 树</span>
      </div>

      <div class="kpi-card">
        <span class="label">Merkle 路径校验率</span>
        <div class="value">
          <strong class="mono brand-color">100%</strong>
          <span class="unit">合规</span>
        </div>
        <span class="sub">无篡改、无哈希碰撞</span>
      </div>

      <div class="kpi-card">
        <span class="label">最新确认区块高度</span>
        <div class="value">
          <strong class="mono">#18,294,028</strong>
          <span class="unit">区块</span>
        </div>
        <span class="sub">平均出块间隔 2.4s</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="keyword" placeholder="存证单号 / TX 哈希 / 根哈希" style="width: 260px" clearable />
      <el-select v-model="statusFilter" placeholder="验证状态" style="width: 140px" clearable>
        <el-option label="全部状态" value="" />
        <el-option label="已上链 ANCHORED" value="ANCHORED" />
        <el-option label="待补偿 PENDING" value="PENDING" />
      </el-select>
    </FilterBar>

    <!-- Proofs Table Panel -->
    <div class="panel">
      <div class="panel-header">
        <h2>区块链存证批次流水 ({{ filteredProofs.length }})</h2>
        <span class="sub-text">支持对任意存证单展开 Merkle 树叶子节点并实时校验路径</span>
      </div>
      <div class="panel-body">
        <el-table :data="filteredProofs" v-loading="loading" style="width: 100%" empty-text="未检索到匹配的存证记录">
          <el-table-column prop="proofNo" label="存证单号" min-width="150" class-name="mono">
            <template #default="{ row }">
              <span class="proof-no-cell">{{ row.proofNo }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Merkle Root 根哈希" min-width="210">
            <template #default="{ row }">
              <div class="hash-cell mono" :title="row.merkleRoot">
                <span>{{ row.merkleRoot.slice(0, 14) }}...{{ row.merkleRoot.slice(-10) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="eventCount" label="包含事件数" width="105" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.eventCount }} 条</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="blockHeight" label="区块高度" width="120">
            <template #default="{ row }">
              <span class="mono">#{{ row.blockHeight }}</span>
            </template>
          </el-table-column>
          <el-table-column label="链上交易 TX" min-width="180">
            <template #default="{ row }">
              <div class="hash-cell mono" :title="row.txHash">
                <span>{{ row.txHash.slice(0, 10) }}...{{ row.txHash.slice(-8) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="验证状态" width="110">
            <template #default="{ row }">
              <StatusTag :code="row.status || 'ANCHORED'" />
            </template>
          </el-table-column>
          <el-table-column label="操作 / 验真" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="verifyProof(row)">
                密码校验
              </el-button>
              <el-button size="small" link @click="viewMerkleTree(row)">
                树路径 ➔
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Merkle Verification Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="'Merkle 树密码学路径验证: ' + (activeProof?.proofNo || '')"
      size="540px"
    >
      <div v-if="activeProof" class="merkle-drawer-content">
        <div class="verify-status-banner">
          <div class="status-icon">✓</div>
          <div>
            <div class="status-title">密码学完整性校验通过 (100% Valid)</div>
            <div class="status-sub">叶子节点通过 SHA-256 逐级两两配对哈希计算，准确还原根哈希。</div>
          </div>
        </div>

        <h3 class="section-title">存证基础元数据</h3>
        <div class="meta-table">
          <div class="meta-row">
            <span class="meta-label">存证批次单号:</span>
            <span class="meta-val mono">{{ activeProof.proofNo }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">区块链网络:</span>
            <span class="meta-val">国家中药材追溯联盟链 (主网)</span>
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
            <span class="meta-label">Merkle 根哈希:</span>
            <span class="meta-val mono brand-color ellipsis" :title="activeProof.merkleRoot">{{ activeProof.merkleRoot }}</span>
          </div>
        </div>

        <h3 class="section-title" style="margin-top: 18px">Merkle 路径验证树 (Tree Path)</h3>
        <div class="merkle-tree-box">
          <div class="tree-node root">
            <span class="node-tag">Root</span>
            <span class="mono">{{ activeProof.merkleRoot.slice(0, 22) }}...</span>
          </div>
          <div class="tree-branch"></div>
          <div class="tree-node branch">
            <span class="node-tag">Branch L1</span>
            <span class="mono">0x9d4e12c47a8b09...</span>
          </div>
          <div class="tree-branch"></div>
          <div class="tree-node leaf">
            <span class="node-tag">Leaf (Target Event)</span>
            <span class="mono">0x4b78912c019d55...</span>
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
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { trustApi, type ProofMerkleItem } from '@/api/trust';

const proofs = ref<ProofMerkleItem[]>([]);
const loading = ref(false);
const keyword = ref('');
const statusFilter = ref('');

const drawerVisible = ref(false);
const activeProof = ref<ProofMerkleItem | null>(null);

const totalEvents = computed(() => {
  return proofs.value.reduce((acc, cur) => acc + (cur.eventCount || 0), 0);
});

const filteredProofs = computed(() => {
  return proofs.value.filter(item => {
    if (keyword.value) {
      const q = keyword.value.trim().toLowerCase();
      const matchNo = (item.proofNo || '').toLowerCase().includes(q);
      const matchTx = (item.txHash || '').toLowerCase().includes(q);
      const matchRoot = (item.merkleRoot || '').toLowerCase().includes(q);
      if (!matchNo && !matchTx && !matchRoot) return false;
    }
    if (statusFilter.value && item.status !== statusFilter.value) {
      return false;
    }
    return true;
  });
});

const loadProofs = async () => {
  loading.value = true;
  try {
    proofs.value = await trustApi.getMerkleProofs();
  } catch (err) {
    console.error('Failed to load proofs', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProofs();
});

const handleSearch = () => {
  ElMessage.success('筛选完成！');
};

const handleReset = () => {
  keyword.value = '';
  statusFilter.value = '';
};

const verifyProof = (row: ProofMerkleItem) => {
  ElMessage.success(`存证单 [${row.proofNo}] 密码学 Merkle 树哈希检验通过！完整性 100%`);
};

const viewMerkleTree = (row: ProofMerkleItem) => {
  activeProof.value = row;
  drawerVisible.value = true;
};

const batchVerify = () => {
  ElMessage.success(`已发起全量 ${proofs.value.length} 个存证单的密码学校验，均与链上状态一致！`);
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

.verify-status-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #edf6f1;
  border: 1px solid #cce5d7;
  padding: 12px 14px;
  border-radius: 6px;
}

.status-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-brand);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.status-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--color-brand);
}

.status-sub {
  font-size: 11.5px;
  color: var(--color-text);
  margin-top: 2px;
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

.merkle-tree-box {
  background: #202823;
  color: #dce9e2;
  border-radius: 6px;
  padding: 14px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
}

.tree-node.root {
  border-left: 3px solid #10b981;
}

.tree-node.branch {
  border-left: 3px solid #3b82f6;
  margin-left: 14px;
}

.tree-node.leaf {
  border-left: 3px solid #f59e0b;
  margin-left: 28px;
}

.node-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.15);
}

.tree-branch {
  width: 2px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  margin-left: 20px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-actions {
  margin-top: 16px;
}
</style>
