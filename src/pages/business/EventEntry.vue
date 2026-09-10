<template>
  <div class="event-entry-page">
    <PageHeader
      :title="'事件录入 - ' + currentEventType"
      subtitle="通用 Schema 驱动事件录入表单 · 包含固定分组与右侧证据侧栏"
    >
      <template #actions>
        <el-select v-model="currentEventType" @change="handleTypeChange" style="width: 220px">
          <el-option label="WAREHOUSED - 入仓完成事件" value="WAREHOUSED" />
          <el-option label="PLANTED - 种植建档事件" value="PLANTED" />
          <el-option label="QUALITY_INSPECTED - 质量检验事件" value="QUALITY_INSPECTED" />
          <el-option label="PRESCRIPTION_RECEIVED - 处方接收事件" value="PRESCRIPTION_RECEIVED" />
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
