<template>
  <div class="trust-page">
    <PageHeader title="事件查询" />
    <ResourceWorkbench list-path="/openapi/v1/event-fact/events" detail-path="/openapi/v1/event-fact/events/{id}" :filters="filters" :columns="columns" />

  </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue';
import ResourceWorkbench from '@/components/common/ResourceWorkbench.vue';
const filters = [{ key: 'tenantId', label: '租户 ID' }, { key: 'projectSpaceId', label: '项目空间 ID' }, { key: 'sourceSystemId', label: '来源系统 ID' }, { key: 'eventType', label: '事件类型' }, { key: 'schemaVersion', label: 'Schema 版本' }, { key: 'sourceBusinessKey', label: '来源业务键' }, { key: 'processingStatus', label: '处理状态' }, { key: 'occurredFrom', label: '发生开始时间', type: 'date' }, { key: 'occurredTo', label: '发生结束时间', type: 'date' }];
const columns = [{ key: 'id', label: '事件 ID', width: 200 }, { key: 'tenantId', label: '租户 ID' }, { key: 'projectSpaceId', label: '项目空间 ID' }, { key: 'sourceSystemId', label: '来源系统 ID' }, { key: 'eventType', label: '事件类型', width: 180 }, { key: 'schemaVersion', label: 'Schema 版本' }, { key: 'sourceBusinessKey', label: '来源业务键', width: 180 }, { key: 'processingStatus', label: '处理状态' }, { key: 'occurredAt', label: '发生时间', width: 180 }, { key: 'receivedAt', label: '接收时间', width: 180 }, { key: 'payloadDigest', label: '载荷摘要', width: 220 }];
columns.push({ key: 'reportedPayloadDigest', label: '原始上报载荷摘要', width: 220 }, { key: 'rawRecordId', label: '原始记录 ID', width: 200 });
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
