<template>
  <div><PageHeader title="原始接入记录与重放" />
    <ResourceWorkbench list-path="/openapi/v1/raw-records" detail-path="/openapi/v1/raw-records/{id}" replay-path="/openapi/v1/raw-records/{id}/replays" id-key="rawRecordId" :filters="filters" :columns="columns" />
  </div>
</template>
<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue';
import ResourceWorkbench from '@/components/common/ResourceWorkbench.vue';
const filters = [{ key: 'tenantId', label: '租户 ID' }, { key: 'projectSpaceId', label: '项目空间 ID' }, { key: 'sourceSystemId', label: '来源系统 ID' }, { key: 'sourceBusinessKey', label: '来源业务键' }, { key: 'status', label: '处理状态' }, { key: 'receivedFrom', label: '接收开始时间', type: 'date' }, { key: 'receivedTo', label: '接收结束时间', type: 'date' }];
const columns = [{ key: 'rawRecordId', label: '原始记录 ID', width: 200 }, { key: 'tenantId', label: '租户 ID' }, { key: 'projectSpaceId', label: '项目空间 ID' }, { key: 'sourceSystemId', label: '来源系统 ID' }, { key: 'sourceBusinessKey', label: '来源业务键' }, { key: 'contentType', label: '内容类型' }, { key: 'contentDigest', label: '内容摘要', width: 220 }, { key: 'status', label: '处理状态' }, { key: 'receivedAt', label: '接收时间', width: 180 }];
columns.push({ key: 'batchId', label: '接入批次 ID', width: 200 }, { key: 'fileFragmentRef', label: '文件片段引用', width: 200 }, { key: 'lockVersion', label: '锁版本', width: 100 }, { key: 'updatedAt', label: '更新时间', width: 180 });
</script>
