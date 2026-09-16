<template>
  <div class="trust-page">
    <PageHeader
      title="可信事件查询"
      subtitle="针对已接受事件的综合过滤与检索 (支持准确业务键与属性过滤)"
    />

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input-number v-model="eventId" :min="1" placeholder="事件 ID" style="width: 220px" />
    </FilterBar>

    <div class="panel">
      <el-table :data="events" v-loading="loading" @row-click="viewDetail" style="cursor: pointer">
        <el-table-column prop="eventId" label="事件 ID" width="150" class-name="mono" />
        <el-table-column prop="eventType" label="事件类型" width="180" />
        <el-table-column prop="schemaVersion" label="Schema 版本" width="120" class-name="mono" />
        <el-table-column prop="businessKey" label="业务键" width="160" class-name="mono" />
        <el-table-column prop="occurredAt" label="发生时间" width="160" />
        <el-table-column prop="payloadDigest" label="Payload 摘要" min-width="210" class-name="mono" show-overflow-tooltip />
        <el-table-column label="Payload JSON" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ JSON.stringify(row.payload || {}) }}</template>
        </el-table-column>
        <el-table-column prop="sourceSystem" label="来源系统 *" width="130" />
        <el-table-column label="处理状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.processStatus" /></template>
        </el-table-column>
        <el-table-column label="存证状态 *" width="110">
          <template #default="{ row }"><StatusTag :code="row.proofStatus" /></template>
        </el-table-column>
        <el-table-column label="操作 / 追溯" width="160">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click.stop="viewDetail(row)">详情</el-button>
            <el-button size="small" link @click.stop="router.push('/trust/lineage?eventId=' + row.eventId)">血缘链图 ➔</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { eventsApi } from '@/api/events';
import type { TrustEvent } from '@/types';

const router = useRouter();
const eventId = ref<number | undefined>();
const events = ref<TrustEvent[]>([]);
const loading = ref(false);

const loadEvents = async () => {
  loading.value = true;
  try {
    events.value = await eventsApi.queryTrustEvents({
      eventId: eventId.value
    });
  } catch (err) {
    console.error('Failed to load trust events', err);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  await loadEvents();
};

const handleReset = async () => {
  eventId.value = undefined;
  events.value = [];
};

const viewDetail = (row: any) => {
  router.push(`/trust/events/${row.eventId}`);
};
</script>

<style scoped>
.trust-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 24px;
}

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
</style>
