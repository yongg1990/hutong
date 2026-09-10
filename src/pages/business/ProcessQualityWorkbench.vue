<template>
  <div class="business-page">
    <PageHeader
      title="加工与质量工作台"
      subtitle="产地初加工(趁鲜切制)、精深加工、饮片炮制与质量检验综合协同工作台"
    >
      <template #actions>
        <el-button @click="router.push('/business/events/new/PRIMARY_PROCESSED')">
          记录初加工事件
        </el-button>
        <el-button type="primary" @click="router.push('/business/events/new/QUALITY_INSPECTED')">
          录入质检报告
        </el-button>
      </template>
    </PageHeader>

    <!-- Top KPI Stats for Primary Processing & Quality -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="label">初加工批次总数</span>
        <div class="value">
          <strong>{{ primaryBatches.length }}</strong> <span class="unit">批次</span>
        </div>
        <span class="sub">产地趁鲜切制率 92.5%</span>
      </div>

      <div class="kpi-card">
        <span class="label">平均折干率 (出干率)</span>
        <div class="value">
          <strong class="brand-color">31.66%</strong> <span class="unit">均值</span>
        </div>
        <span class="sub">损耗率控制在 2.1% 以内</span>
      </div>

      <div class="kpi-card">
        <span class="label">质检检验报告数</span>
        <div class="value">
          <strong>{{ inspectEvents.length }}</strong> <span class="unit">份</span>
        </div>
        <span class="sub">全检合格率 100%</span>
      </div>

      <div class="kpi-card">
        <span class="label">水分与杂质控标</span>
        <div class="value">
          <strong class="success-color">合规</strong> <span class="unit">符合ChP2025</span>
        </div>
        <span class="sub">云南28种趁鲜切制目录覆盖</span>
      </div>
    </div>

    <!-- Active Tab Selector -->
    <div class="tab-bar">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'PRIMARY' }"
        @click="activeTab = 'PRIMARY'"
      >
        <strong>1. 产地初加工与趁鲜切制批次 (Primary Processing)</strong>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'QUALITY' }"
        @click="activeTab = 'QUALITY'"
      >
        <strong>2. 精深加工与质检报告记录 (Quality Inspection)</strong>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'SPEC' }"
        @click="activeTab = 'SPEC'"
      >
        <strong>3. 质检参数表结构预览 (Inspection Indicators)</strong>
      </div>
    </div>

    <!-- TAB 1: Primary Processing Section -->
    <div v-if="activeTab === 'PRIMARY'" class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <div class="header-title">
            <h2>初加工与产地趁鲜切制批次列表</h2>
            <el-tag size="small" type="success">产地趁鲜切制</el-tag>
          </div>
          <span class="count-text">共 {{ primaryBatches.length }} 批</span>
        </div>

        <el-table
          :data="primaryBatches"
          @row-click="selectPrimaryBatch"
          highlight-current-row
        >
          <el-table-column prop="primaryBatchNo" label="初加工批次号" width="160" class-name="mono" />
          <el-table-column prop="herbName" label="药材" width="80" />
          <el-table-column prop="processMethod" label="初加工工艺" min-width="170" />
          <el-table-column label="投料/产出(折干率)" width="170">
            <template #default="{ row }">
              {{ row.freshWeight }}kg 鲜 ➔ {{ row.driedWeight }}kg 干
              <br/>
              <span class="sub-text mono">折干率: {{ row.yieldRate }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="facilityName" label="初加工车间/主体" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.status === 'INSPECTED' ? 'ACCEPTED' : (row.status === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING')" />
            </template>
          </el-table-column>
          <el-table-column label="操作 / 协同" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click.stop="router.push('/trust/lineage?batchNo=' + row.primaryBatchNo)">
                血缘图谱
              </el-button>
              <el-button size="small" link @click.stop="router.push('/business/coding?batchNo=' + row.primaryBatchNo)">
                转赋码 ➔
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Right Side Selected Primary Batch Details Card -->
      <div class="panel" v-if="selectedPrimaryRow">
        <div class="panel-header">
          <h2>初加工档案: {{ selectedPrimaryRow.primaryBatchNo }}</h2>
          <el-button size="small" link type="primary" @click="router.push('/trust/events')">
            查看溯源事件
          </el-button>
        </div>
        <div class="panel-body">
          <div class="kv-row"><span>关联采收批次:</span> <b class="mono">{{ selectedPrimaryRow.harvestBatchNo }}</b></div>
          <div class="kv-row"><span>药材基原:</span> <b>{{ selectedPrimaryRow.herbName }}</b></div>
          <div class="kv-row"><span>初加工工艺:</span> <b>{{ selectedPrimaryRow.processMethod }}</b></div>
          <div class="kv-row"><span>初加工主体:</span> <b>{{ selectedPrimaryRow.facilityName }}</b></div>
          <div class="kv-row"><span>投料鲜重:</span> <b>{{ selectedPrimaryRow.freshWeight.toLocaleString() }} kg</b></div>
          <div class="kv-row"><span>烘干出重:</span> <b>{{ selectedPrimaryRow.driedWeight.toLocaleString() }} kg</b></div>
          <div class="kv-row"><span>计算折干率:</span> <b class="brand-color">{{ selectedPrimaryRow.yieldRate }}</b></div>
          <div class="kv-row"><span>水分实测:</span> <b>{{ selectedPrimaryRow.moistureContent }}</b></div>
          <div class="kv-row"><span>杂质实测:</span> <b>{{ selectedPrimaryRow.impurityContent }}</b></div>
          <div class="kv-row"><span>责任操作人:</span> <b>{{ selectedPrimaryRow.operator }}</b></div>
          <div class="kv-row"><span>加工完成时间:</span> <b>{{ selectedPrimaryRow.processedAt }}</b></div>

          <div class="card-actions">
            <el-button type="primary" size="small" @click="router.push('/business/events/new/PRIMARY_PROCESSED')">
              录入趁鲜切制事件
            </el-button>
            <el-button size="small" @click="router.push('/business/events/new/QUALITY_INSPECTED')">
              发起初加工检验
            </el-button>
          </div>

          <el-divider style="margin: 14px 0 10px;" />
          <div class="cross-actions-title">全链协同与追溯穿透：</div>
          <div class="card-actions-vertical">
            <el-button size="small" type="success" plain @click="router.push('/business/coding?batchNo=' + selectedPrimaryRow.primaryBatchNo)">
              流转至饮片赋码与包装树 ➔
            </el-button>
            <el-button size="small" type="info" plain @click="router.push('/trust/lineage?batchNo=' + selectedPrimaryRow.primaryBatchNo)">
              查看此批次溯源血缘图谱
            </el-button>
            <el-button size="small" plain @click="router.push('/trust/evidence')">
              查看质检报告凭据库
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: Quality Inspection Section -->
    <div v-else-if="activeTab === 'QUALITY'" class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <h2>质检事件与批次检验记录</h2>
          <span class="count-text">共 {{ inspectEvents.length }} 份检验报告</span>
        </div>
        <el-table :data="inspectEvents">
          <el-table-column prop="businessKey" label="报告单号" width="140" class-name="mono" />
          <el-table-column label="关联批次" width="140" class-name="mono">
            <template #default="{ row }">{{ row.payload?.batchNo || 'SQ-260731-08' }}</template>
          </el-table-column>
          <el-table-column prop="occurredAt" label="检验时间" width="160" />
          <el-table-column prop="sourceSystem" label="来源 LIMS" width="120" />
          <el-table-column label="结论" width="100">
            <template #default="{ row }">
              <StatusTag :code="row.payload?.conclusion || 'QUALIFIED'" />
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="router.push('/trust/events/' + row.eventId)">
                查看溯源报告
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>质检报告详情及关键检测指标</h2>
        </div>
        <div class="panel-body" v-if="inspectEvents.length > 0">
          <div class="kv-row"><span>质检报告单号:</span> <b class="mono">{{ inspectEvents[0].businessKey }}</b></div>
          <div class="kv-row"><span>关联饮片批次:</span> <b class="mono">{{ inspectEvents[0].payload?.batchNo }}</b></div>
          <div class="kv-row"><span>检验类型:</span> <b>中国药典全检 (ChP 2025)</b></div>
          <div class="kv-row"><span>检验结论:</span> <b><el-tag type="success">合格 (QUALIFIED)</el-tag></b></div>

          <el-divider style="margin: 12px 0;" />
          <h4 style="font-size: 13px; margin-bottom: 8px;">包含实测指标项:</h4>
          <el-table :data="inspectEvents[0].payload?.indicators || []" size="small">
            <el-table-column prop="name" label="指标名称" min-width="120" />
            <el-table-column prop="result" label="实测值" width="100" class-name="mono" />
            <el-table-column prop="limit" label="标准限值" width="110" class-name="mono" />
            <el-table-column label="判定" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'PASS' ? 'success' : 'danger'">
                  {{ row.status === 'PASS' ? '符合' : '超标' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- TAB 3: Spec Indicator Grid -->
    <div v-else class="panel">
      <div class="panel-header">
        <h2>质检参数标准表与录入结构预览</h2>
      </div>
      <div class="panel-body">
        <InspectionIndicatorGrid />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import InspectionIndicatorGrid from '@/components/specialized/InspectionIndicatorGrid.vue';
import { processQualityApi } from '@/api/processQuality';
import { eventsApi } from '@/api/events';
import type { PrimaryProcessingBatch, TrustEvent } from '@/types';

const router = useRouter();
const activeTab = ref<'PRIMARY' | 'QUALITY' | 'SPEC'>('PRIMARY');
const loading = ref(false);

const primaryBatches = ref<PrimaryProcessingBatch[]>([]);
const selectedPrimaryRow = ref<PrimaryProcessingBatch | null>(null);
const inspectEvents = ref<TrustEvent[]>([]);

const loadData = async () => {
  loading.value = true;
  try {
    const [batches, allEvts] = await Promise.all([
      processQualityApi.getPrimaryBatches(),
      eventsApi.queryTrustEvents({ eventType: 'QUALITY_INSPECTED' })
    ]);
    primaryBatches.value = batches;
    if (batches.length > 0) {
      selectedPrimaryRow.value = batches[0];
    }
    inspectEvents.value = allEvts;
  } catch (err) {
    console.error('Failed to load process quality data', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});

const selectPrimaryBatch = (row: PrimaryProcessingBatch) => {
  selectedPrimaryRow.value = row;
};
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kpi-card .label {
  font-size: 12px;
  color: var(--color-muted);
}

.kpi-card .value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.kpi-card .value strong {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-ink);
}

.kpi-card .value .unit {
  font-size: 11px;
  color: var(--color-muted);
}

.brand-color {
  color: var(--color-brand) !important;
}

.success-color {
  color: #176b4d !important;
}

.kpi-card .sub {
  font-size: 11px;
  color: var(--color-muted);
  margin-top: 2px;
}

.tab-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  margin-bottom: 14px;
}

.tab-item {
  padding: 12px 16px;
  border-right: 1px solid var(--color-border);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  user-select: none;
}

.tab-item:last-child {
  border-right: 0;
}

.tab-item:hover {
  background: #f4f8f6;
}

.tab-item.active {
  box-shadow: inset 0 3px var(--color-brand);
  background: #ebf4f0;
}

.tab-item strong {
  font-size: 13px;
  color: var(--color-ink);
}

.tab-item.active strong {
  color: var(--color-brand);
  font-weight: 700;
}

.grid-two {
  display: grid;
  grid-template-columns: 1.35fr 0.85fr;
  gap: 14px;
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

.panel-body {
  padding: 16px;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #edf0ee;
  font-size: 13px;
}

.kv-row span {
  color: var(--color-muted);
}

.sub-text {
  font-size: 11px;
  color: var(--color-muted);
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.cross-actions-title {
  font-size: 12px;
  font-weight: 600;
  color: #435b50;
  margin-bottom: 8px;
}

.card-actions-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-actions-vertical .el-button {
  width: 100%;
  justify-content: center;
}
</style>
