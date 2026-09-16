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
        <span class="label">Schema 版本</span>
        <strong class="mono">{{ eventDetail.schemaVersion || '-' }}</strong>
      </div>
      <div class="info-card">
        <span class="label">来源业务键</span>
        <strong class="mono">{{ eventDetail.businessKey || '-' }}</strong>
      </div>
      <div class="info-card">
        <span class="label">处理状态</span>
        <StatusTag :code="eventDetail.processStatus" />
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
          <h2>事件快照信息</h2>
        </div>
        <div class="panel-body">
          <div class="kv-row"><span>事件 ID:</span> <b class="mono">{{ eventDetail.eventId }}</b></div>
          <div class="kv-row"><span>事件类型:</span> <b class="mono">{{ eventDetail.eventType }}</b></div>
          <div class="kv-row"><span>发生时间:</span> <b>{{ eventDetail.occurredAt }}</b></div>
          <div class="kv-row"><span>Payload 摘要:</span> <b class="mono digest">{{ eventDetail.payloadDigest || '-' }}</b></div>
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
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { eventsApi } from '@/api/events';

const route = useRoute();
const router = useRouter();

const eventDetail = ref<any>(null);

onMounted(async () => {
  const id = route.params.eventId as string;
  try {
    const data = await eventsApi.getTrustEventDetail(id);
    eventDetail.value = data;
  } catch (err) {
    console.error('Failed to load event detail', err);
  }
});

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

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.digest {
  max-width: 70%;
  overflow-wrap: anywhere;
  text-align: right;
}
</style>
