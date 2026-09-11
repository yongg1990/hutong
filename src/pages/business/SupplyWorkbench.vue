<template>
  <div class="business-page">
    <PageHeader
      title="供销仓储交割工作台"
      subtitle="订单确认、仓储入库、出库、交割与质押统一业务履约视图"
    >
      <template #actions>
        <el-button type="primary" @click="router.push('/business/events/new/WAREHOUSED')">
          记录入仓事件
        </el-button>
      </template>
    </PageHeader>

    <!-- Stage Progress Indicator Bar (Interactive Stage Switching) -->
    <div class="stages-bar">
      <div
        v-for="stage in stages"
        :key="stage.code"
        class="stage-item"
        :class="{ active: currentStage === stage.code }"
        @click="selectStage(stage.code)"
      >
        <div class="stage-header">
          <strong>{{ stage.title }}</strong>
          <span class="stage-badge">{{ getStageCount(stage.code) }}</span>
        </div>
        <span class="stage-sub">{{ stage.subtitle }}</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input
        v-model="orderNoKey"
        placeholder="订单号/饮片/批次号"
        clearable
        style="width: 200px"
      />
      <el-select v-model="selectedWh" placeholder="全部仓库" clearable style="width: 170px">
        <el-option label="全部仓库" value="" />
        <option label="昆明中心仓 (WH-KM-001)" value="KM" />
        <el-option label="玉溪协同仓 (WH-YX-002)" value="YX" />
        <el-option label="文山协同仓 (WH-WS-003)" value="WS" />
        <el-option label="楚雄仓 (WH-CX-001)" value="CX" />
      </el-select>

      <template v-if="currentStage !== 'ALL'">
        <el-tag closable type="success" @close="currentStage = 'ALL'">
          履约环节: {{ currentStageName }}
        </el-tag>
      </template>
    </FilterBar>

    <!-- Main Content Grid -->
    <div class="panel">
      <div class="panel-header">
        <div class="header-title">
          <h2>供销与仓储交割订单列表</h2>
          <el-tag v-if="currentStage !== 'ALL'" size="small" type="info">
            环节: {{ currentStageName }}
          </el-tag>
        </div>
        <span class="count-text">筛选共 {{ filteredOrders.length }} / {{ allOrders.length }} 笔订单</span>
      </div>

      <el-table
        :data="filteredOrders"
        @row-click="selectOrder"
        highlight-current-row
        empty-text="暂无该环节对应的交割订单"
      >
        <el-table-column prop="orderNo" label="订单号" width="140" class-name="mono" />
        <el-table-column label="饮片 / 批次" min-width="200">
          <template #default="{ row }">
            <b>{{ row.pieceName }}</b> / <span class="mono">{{ row.batchNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="交易数量" width="120">
          <template #default="{ row }"><b>{{ row.quantity.toLocaleString() }}</b> {{ row.unit }}</template>
        </el-table-column>
        <el-table-column prop="warehouse" label="存放仓库" min-width="170" />
        <el-table-column label="库存状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.stockStatus" /></template>
        </el-table-column>
        <el-table-column label="履约环节" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="getStageTagType(row.stage)">
              {{ getStageTitle(row.stage) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="国家医保码" width="160" class-name="mono">
          <template #default="{ row }">
            <span style="font-size: 12px; color: #3f4e48;">{{ row.insuranceCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="下一步协同 / 操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.fulfillmentStatus === 'PENDING_OUT'"
              size="small"
              type="primary"
              @click.stop="router.push('/business/events/new/WAREHOUSED')"
            >
              出库
            </el-button>
            <el-button
              size="small"
              type="primary"
              link
              @click.stop="router.push('/trust/lineage?batchNo=' + row.batchNo)"
            >
              血缘图谱
            </el-button>
            <el-button
              size="small"
              link
              @click.stop="router.push('/business/decoction?batchNo=' + row.batchNo)"
            >
              转代煎 ➔
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Bottom 3 Dynamic Info Cards -->
    <div class="grid-three">
      <div class="info-card">
        <strong>当前选中订单 {{ selectedOrder?.orderNo || 'XS-202608-018' }} 履约链路</strong>
        <p class="sub-text">国家医保码: {{ selectedOrder?.insuranceCode || '8691234567890123' }}</p>
        <el-progress :percentage="getFulfillmentProgress(selectedOrder?.stage)" :stroke-width="8" color="#176B4D" />
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span class="sub-text">环节: {{ getStageTitle(selectedOrder?.stage || 'WAREHOUSED') }}</span>
          <el-button size="small" type="primary" link @click="router.push('/trust/lineage?batchNo=' + (selectedOrder?.batchNo || 'SQ-260808-01'))">
            穿透血缘图谱 ➔
          </el-button>
        </div>
      </div>

      <div class="info-card">
        <strong>库存可用性与质押冻结额度</strong>
        <p>
          <StatusTag code="ACCEPTED" :label="`在库可用 ${totalAvailableStock} kg`" />
          <StatusTag code="PLEDGED" :label="`质押冻结 ${totalPledgedAmount} 元`" />
        </p>
        <el-button size="small" @click="router.push('/master-data/objects')">查看物化库存单元</el-button>
      </div>

      <div class="info-card">
        <strong>仓储交割证据与区块链存证</strong>
        <p>电子合同、检验报告、入出仓单据 3 / 3 齐全核验</p>
        <div style="display: flex; gap: 8px;">
          <el-button size="small" @click="router.push('/trust/evidence')">关联证据库</el-button>
          <el-button size="small" type="primary" plain @click="router.push('/trust/proofs')">区块存证单</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { supplyApi } from '@/api/supply';
import type { SupplyOrder } from '@/types';

const router = useRouter();
const orderNoKey = ref('');
const selectedWh = ref('');
const currentStage = ref<string>('ALL');
const loading = ref(false);

const allOrders = ref<SupplyOrder[]>([]);
const selectedOrder = ref<SupplyOrder | null>(null);

const loadOrders = async () => {
  loading.value = true;
  try {
    const res = await supplyApi.getSupplyOrders({
      keyword: orderNoKey.value,
      warehouse: selectedWh.value,
      stage: currentStage.value
    });
    allOrders.value = res;
    if (res.length > 0 && !selectedOrder.value) {
      selectedOrder.value = res[0];
    }
  } catch (err) {
    console.error('Failed to load supply orders', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadOrders();
});

const stages = [
  { code: 'ALL', title: '全部订单', subtitle: '供销交割全景' },
  { code: 'CONFIRMED', title: '订单确认', subtitle: '契约拟定与待配货' },
  { code: 'WAREHOUSED', title: '已入仓', subtitle: '库存就位待提货' },
  { code: 'OUT_BOUND', title: '已出库', subtitle: '物流运输履约中' },
  { code: 'DELIVERED', title: '交割完成', subtitle: '签收验收与对账' },
  { code: 'PLEDGED', title: '质押中', subtitle: '供应链金融冻结' }
];

const getStageTitle = (code?: string) => {
  if (!code) return '未知';
  const matched = stages.find(s => s.code === code);
  return matched ? matched.title : code;
};

const getStageTagType = (code?: string) => {
  switch (code) {
    case 'CONFIRMED': return 'info';
    case 'WAREHOUSED': return 'success';
    case 'OUT_BOUND': return 'warning';
    case 'DELIVERED': return 'success';
    case 'PLEDGED': return 'danger';
    default: return 'info';
  }
};

const currentStageName = computed(() => getStageTitle(currentStage.value));

const getStageCount = (code: string) => {
  if (code === 'ALL') return allOrders.value.length;
  return allOrders.value.filter(o => o.stage === code).length;
};

const selectStage = (code: string) => {
  if (currentStage.value === code && code !== 'ALL') {
    currentStage.value = 'ALL';
  } else {
    currentStage.value = code;
  }
};

const filteredOrders = computed(() => {
  return allOrders.value.filter((o) => {
    const matchesStage = currentStage.value === 'ALL' || o.stage === currentStage.value;
    const kw = (orderNoKey.value || '').trim().toLowerCase();
    const matchesKw = !kw ||
      (o.orderNo || '').toLowerCase().includes(kw) ||
      (o.batchNo || '').toLowerCase().includes(kw) ||
      (o.pieceName || '').toLowerCase().includes(kw);
    const matchesWh = !selectedWh.value || (o.warehouse || '').includes(selectedWh.value);
    return matchesStage && matchesKw && matchesWh;
  });
});

const selectOrder = (row: SupplyOrder) => {
  selectedOrder.value = row;
};

const getFulfillmentProgress = (stage?: string) => {
  switch (stage) {
    case 'CONFIRMED': return 25;
    case 'WAREHOUSED': return 50;
    case 'OUT_BOUND': return 75;
    case 'DELIVERED': return 100;
    case 'PLEDGED': return 60;
    default: return 50;
  }
};

const totalAvailableStock = computed(() => {
  return allOrders.value
    .filter(o => o.stockStatus === 'WAREHOUSED')
    .reduce((acc, curr) => acc + curr.quantity, 0)
    .toLocaleString();
});

const totalPledgedAmount = computed(() => {
  return allOrders.value
    .filter(o => o.stockStatus === 'PLEDGED')
    .reduce((acc, curr) => acc + (curr.pledgeAmount || 0), 0)
    .toLocaleString();
});

const handleSearch = () => {
  // Query executed silently without toast popup
};

const handleReset = () => {
  orderNoKey.value = '';
  selectedWh.value = '';
  currentStage.value = 'ALL';
};
</script>

<style scoped>
.stages-bar {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 14px;
}

.stage-item {
  padding: 12px 14px;
  border-right: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.stage-item:last-child {
  border-right: 0;
}

.stage-item:hover {
  background: #f4f8f6;
}

.stage-item.active {
  box-shadow: inset 0 3px var(--color-brand);
  background: #ebf4f0;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.stage-item strong {
  font-size: 13px;
  color: var(--color-ink);
}

.stage-item.active strong {
  color: var(--color-brand);
  font-weight: 700;
}

.stage-badge {
  font-size: 11px;
  font-weight: 600;
  background: rgba(23, 107, 77, 0.12);
  color: var(--color-brand);
  padding: 1px 6px;
  border-radius: 10px;
}

.stage-sub {
  display: block;
  font-size: 11px;
  color: var(--color-muted);
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-header h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 600;
}

.count-text {
  font-size: 12px;
  color: var(--color-muted);
}

.grid-three {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 14px;
}

.info-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.info-card strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink);
}

.sub-text {
  font-size: 12px;
  color: var(--color-muted);
}
</style>
