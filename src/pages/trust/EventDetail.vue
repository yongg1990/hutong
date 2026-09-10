<template>
  <div class="trust-page" v-if="eventDetail">
    <PageHeader
      :title="'事件详情: ' + eventDetail.eventId"
      :subtitle="eventDetail.eventTypeName + ' · 发生时间: ' + eventDetail.occurredAt"
    >
      <template #actions>
        <el-button @click="router.push('/trust/proofs')">
          查看区块链存证单
        </el-button>
        <el-button @click="router.push('/trust/evidence')">
          合规证据库
        </el-button>
        <el-button type="primary" @click="router.push('/trust/lineage?eventId=' + eventDetail.eventId)">
          在血缘图谱中穿透 ➔
        </el-button>
      </template>
    </PageHeader>

    <!-- Top Key Metrics Cards -->
    <div class="grid-four">
      <div class="info-card">
        <span class="label">事件类型</span>
        <strong>{{ eventDetail.eventType }}</strong>
      </div>
      <div class="info-card">
        <span class="label">来源系统</span>
        <strong>{{ eventDetail.sourceSystem }}</strong>
      </div>
      <div class="info-card">
        <span class="label">存证类型</span>
        <StatusTag :code="eventDetail.proofStatus" />
      </div>
      <div class="info-card">
        <span class="label">Merkle Root</span>
        <span class="mono ellipsis">{{ eventDetail.merkleRoot }}</span>
      </div>
    </div>

    <!-- Payload JSON & Proof Split Panels -->
    <div class="grid-two">
      <div class="panel">
        <div class="panel-header">
          <h2>规范化 Payload 数据 (Canonical JSON)</h2>
        </div>
        <div class="panel-body">
          <pre class="json-code mono">{{ JSON.stringify(eventDetail.payload, null, 2) }}</pre>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>存证信息与区块链哈希证明</h2>
        </div>
        <div class="panel-body">
          <div class="kv-row"><span>存证单号:</span> <b class="mono">PF-202608-0912</b></div>
          <div class="kv-row"><span>区块高度:</span> <b>#18,294,021</b></div>
          <div class="kv-row"><span>存证哈希:</span> <b class="mono">0x7f8a...3b21</b></div>
          <div class="kv-row"><span>上链时间:</span> <b>2026-08-08 15:45:10</b></div>

          <el-divider style="margin: 12px 0" />

          <h3>关联证据文件附件</h3>
          <div v-for="att in attachments" :key="att.id" class="att-item">
            <span>📎 {{ att.name }} ({{ att.size }})</span>
            <el-button size="small" type="primary" link @click="openEvidence">查看存证凭证</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Processing Records and Traceability Split Panels -->
    <div class="grid-two mt-4">
      <div class="panel">
        <div class="panel-header">
          <h2>处理记录 (Processing Timeline)</h2>
        </div>
        <div class="panel-body">
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in processingRecords"
              :key="index"
              :type="activity.status"
              :timestamp="activity.time"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>来源追溯 (Traceability Info)</h2>
        </div>
        <div class="panel-body">
          <div class="kv-row" v-for="(info, idx) in traceabilityInfo" :key="idx">
            <span>{{ info.label }}:</span>
            <b>{{ info.value }}</b>
          </div>
          
          <div class="mt-6">
            <el-button type="default" style="width: 100%" @click="router.push('/trust/lineage?eventId=' + eventDetail.eventId)">
              在血缘图谱中展开节点
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="trust-page" style="padding: 40px; text-align: center;">
    <el-empty description="正在加载事件存证详情或未找到对应事件..." />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { eventsApi } from '@/api/events';

const route = useRoute();
const router = useRouter();

const eventDetail = ref<any>(null);
const attachments = ref([
  { id: '1', name: '昆明中心仓入库单据扫描件.pdf', size: '1.2 MB' },
  { id: '2', name: '环境温湿度连续采集日志.csv', size: '420 KB' }
]);

const processingRecords = ref([
  { time: '2026-08-08 15:45:10', content: '上链存证成功 (PF-202608-0912)', status: 'success' as const },
  { time: '2026-08-08 15:45:02', content: '规范化验证通过 (Schema V2)', status: 'success' as const },
  { time: '2026-08-08 15:45:00', content: '接收网关推送 payload (来源: WMS)', status: 'primary' as const },
]);

const traceabilityInfo = ref([
  { label: '原始报文ID', value: 'MSG-9812-7362' },
  { label: '采集设备/网关', value: 'Gateway-Kunming-01' },
  { label: '签名主体', value: '昆明中心仓操作员A (0x4a...c9)' },
  { label: '上游批次', value: 'BATCH-2026-0808-KM' },
]);

onMounted(async () => {
  const id = route.params.eventId as string;
  try {
    const data = await eventsApi.getTrustEventDetail(id);
    eventDetail.value = data;
  } catch (err) {
    console.error('Failed to load event detail', err);
  }
});

const openEvidence = () => {
  router.push('/trust/evidence');
};
</script>

<style scoped>
.trust-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 24px;
}

.grid-four {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

@media (max-width: 1024px) {
  .grid-four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 540px) {
  .grid-four {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px 14px;
  min-width: 0;
  box-sizing: border-box;
}

.info-card .label {
  color: var(--color-muted);
  font-size: 12px;
  display: block;
}

.info-card strong {
  font-size: 15px;
  display: block;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-two {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 14px;
}

@media (max-width: 1024px) {
  .grid-two {
    grid-template-columns: 1fr;
  }
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h2 {
  font-size: 15px;
  margin: 0;
  font-weight: 600;
}

.panel-body {
  padding: 16px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.json-code {
  background: #202823;
  color: #dce9e2;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-width: 100%;
  box-sizing: border-box;
  max-height: 400px;
  overflow-y: auto;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #edf0ee;
  font-size: 13px;
}

.kv-row span {
  color: var(--color-muted);
}

.att-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: #f7f9f8;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  margin-top: 8px;
  font-size: 13px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
