<template>
  <div class="event-entry-page">
    <PageHeader
      :title="'事件录入 - ' + currentEventType"
      subtitle="通用 Schema 驱动事件录入表单 · 包含固定分组与右侧证据侧栏"
    >
      <template #actions>
        <el-select v-model="currentEventType" @change="handleTypeChange" style="width: 220px">
          <el-option label="WAREHOUSED - 入仓完成事件" value="WAREHOUSED" />
          <el-option label="OUTBOUND_COMPLETED - 出库完成事件" value="OUTBOUND_COMPLETED" />
          <el-option label="TRACE_CODE_ASSIGNED - 追溯赋码事件" value="TRACE_CODE_ASSIGNED" />
          <el-option label="ORDER_CONFIRMED - 供销订单确认" value="ORDER_CONFIRMED" />
          <el-option label="DELIVERY_COMPLETED - 供销交割完成" value="DELIVERY_COMPLETED" />
          <el-option label="PLANTED - 种植建档事件" value="PLANTED" />
          <el-option label="FARMING_OPERATION - 农事作业事件" value="FARMING_OPERATION" />
          <el-option label="INPUT_APPLIED - 投入品施用事件" value="INPUT_APPLIED" />
          <el-option label="HARVESTED - 采收事件" value="HARVESTED" />
          <el-option label="PRIMARY_PROCESSED - 初加工事件" value="PRIMARY_PROCESSED" />
          <el-option label="QUALITY_INSPECTED - 质量检验事件" value="QUALITY_INSPECTED" />
          <el-option label="PRESCRIPTION_RECEIVED - 处方接收事件" value="PRESCRIPTION_RECEIVED" />
          <el-option label="DECOCTION_PROCESSED - 代煎过程事件" value="DECOCTION_PROCESSED" />
          <el-option label="DECOCTION_DELIVERED - 煎剂配送事件" value="DECOCTION_DELIVERED" />
          <el-option label="PLEDGE_CONFIRMED - 质押确认事件" value="PLEDGE_CONFIRMED" />
        </el-select>
      </template>
    </PageHeader>

    <SchemaEventForm :key="currentEventType" :eventType="currentEventType" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/common/PageHeader.vue';
import SchemaEventForm from '@/components/specialized/SchemaEventForm.vue';

const route = useRoute();
const router = useRouter();

const currentEventType = ref<string>((route.params.eventType as string) || 'WAREHOUSED');

watch(
  () => route.params.eventType,
  (newVal) => {
    if (newVal) {
      currentEventType.value = newVal as string;
    }
  }
);

const handleTypeChange = (typeVal: string) => {
  router.push(`/business/events/new/${typeVal}`);
};
</script>

<style scoped>
.event-entry-page {
  display: flex;
  flex-direction: column;
}
</style>
