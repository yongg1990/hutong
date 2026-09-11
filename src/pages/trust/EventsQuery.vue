<template>
  <div class="trust-page">
    <PageHeader
      title="可信事件查询"
      subtitle="针对已接受事件的综合过滤与检索 (支持准确业务键与属性过滤)"
    />

    <FilterBar @search="handleSearch" @reset="handleReset">
      <el-input v-model="businessKey" placeholder="业务键/单号/批次号" style="width: 200px" />
      <el-select v-model="eventType" placeholder="事件类型" style="width: 180px">
        <el-option label="全部事件类型" value="" />
        <el-option label="WAREHOUSED - 入仓完成" value="WAREHOUSED" />
        <el-option label="QUALITY_INSPECTED - 质检完成" value="QUALITY_INSPECTED" />
        <el-option label="PRESCRIPTION_RECEIVED - 处方接收" value="PRESCRIPTION_RECEIVED" />
      </el-select>
    </FilterBar>

    <div class="panel">
      <el-table :data="events" @row-click="viewDetail" style="cursor: pointer">
        <el-table-column prop="eventId" label="事件 ID (ULID)" width="220" class-name="mono" />
        <el-table-column prop="eventTypeName" label="事件类型名称" width="150" />
        <el-table-column prop="businessKey" label="业务键" width="160" class-name="mono" />
        <el-table-column prop="occurredAt" label="发生时间" width="160" />
        <el-table-column prop="sourceSystem" label="来源系统" width="130" />
        <el-table-column label="处理状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.processStatus" /></template>
        </el-table-column>
        <el-table-column label="存证状态" width="110">
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { eventsApi } from '@/api/events';
import type { TrustEvent } from '@/types';

const router = useRouter();
const businessKey = ref('');
const eventType = ref('');
const events = ref<TrustEvent[]>([]);
const loading = ref(false);

const loadEvents = async () => {
  loading.value = true;
  try {
    events.value = await eventsApi.queryTrustEvents({
      businessKey: businessKey.value,
      eventType: eventType.value
    });
  } catch (err) {
    console.error('Failed to load trust events', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadEvents();
});

const handleSearch = async () => {
  await loadEvents();
};

const handleReset = async () => {
  businessKey.value = '';
  eventType.value = '';
  await loadEvents();
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
