<template>
  <div class="operations-page">
    <PageHeader
      title="审计与预警 Alert"
      subtitle="系统操作审计日志、数据篡改警报与合规风控通知"
    />

    <div class="panel">
      <el-table :data="alerts">
        <el-table-column prop="alertId" label="预警 ID" width="160" class-name="mono" />
        <el-table-column prop="level" label="严重级别" width="100">
          <template #default="{ row }">
            <StatusTag :code="row.level === 'HIGH' ? 'FAILED' : 'WARN'" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="预警标题" min-width="200" />
        <el-table-column prop="detail" label="详细描述" min-width="240" />
        <el-table-column prop="occurredAt" label="触发时间" width="160" />
        <el-table-column label="处理状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi } from '@/api/settings';

const alerts = ref<any[]>([]);
const loading = ref(false);

const loadAlerts = async () => {
  loading.value = true;
  try {
    const res = await settingsApi.getAlerts();
    alerts.value = res.map(a => ({
      alertId: a.alertId,
      level: a.level,
      title: a.type,
      detail: a.content,
      occurredAt: a.occurredAt,
      status: a.isResolved ? 'RESOLVED' : 'WARN'
    }));
  } catch (err) {
    console.error('Failed to load alerts', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAlerts();
});
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
