<template>
  <div><PageHeader title="项目方案授权绑定" />
    <el-tabs v-model="tab"><el-tab-pane name="project" label="按项目查询" /><el-tab-pane name="version" label="按方案版本查询" /></el-tabs>
    <ResourceWorkbench v-if="tab === 'project'" key="project" list-path="/openapi/v1/exchange-query/projects/{projectSpaceId}/bindings" save-path="/openapi/v1/exchange-query/bindings" :required-filters="['projectSpaceId']" :filters="filters" :columns="columns" :fields="fields" :paginated="false" editable create-label="新增授权绑定" />
    <ResourceWorkbench v-else key="version" list-path="/openapi/v1/exchange-query/profile-versions/{profileVersionId}/bindings" save-path="/openapi/v1/exchange-query/bindings" :required-filters="['profileVersionId']" :filters="versionFilters" :columns="versionColumns" :fields="fields" editable create-label="新增授权绑定" />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ResourceWorkbench from '@/components/common/ResourceWorkbench.vue';
const tab = ref('project');
const filters = [{ key: 'projectSpaceId', label: '项目空间 ID' }, { key: 'tenantId', label: '目标租户 ID' }];
const versionFilters = [{ key: 'profileVersionId', label: '方案版本 ID' }, { key: 'tenantId', label: '目标租户 ID' }, { key: 'projectSpaceId', label: '项目空间 ID' }, { key: 'targetSourceSystemId', label: '接收系统 ID' }, { key: 'status', label: '状态', options: ['ACTIVE', 'INACTIVE'] }];
const columns = [{ key: 'id', label: '绑定 ID' }, { key: 'tenantId', label: '租户 ID' }, { key: 'projectSpaceId', label: '项目空间 ID' }, { key: 'profileVersionId', label: '方案版本 ID' }, { key: 'targetSourceSystemId', label: '接收系统 ID' }, { key: 'deliveryConfigJson', label: '交付配置' }, { key: 'status', label: '状态' }];
const versionColumns = [...columns, { key: 'projectSpaceName', label: '项目名称' }, { key: 'targetSourceSystemCode', label: '接收系统代码' }, { key: 'targetSourceSystemName', label: '接收系统名称' }, { key: 'createdAt', label: '创建时间', width: 180 }, { key: 'updatedAt', label: '更新时间', width: 180 }];
const fields = [{ key: 'projectSpaceId', label: '项目空间 ID', required: true }, { key: 'profileVersionId', label: '方案版本 ID', required: true }, { key: 'targetSourceSystemId', label: '接收系统 ID', required: true }, { key: 'deliveryConfigJson', label: '交付配置 JSON', type: 'json', required: true, initial: '{}' }, { key: 'status', label: '状态', required: true, options: ['ACTIVE', 'INACTIVE'], initial: 'ACTIVE' }];
</script>
