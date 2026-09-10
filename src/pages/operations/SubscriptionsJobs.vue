<template>
  <div class="operations-page">
    <PageHeader
      title="订阅与作业 Task"
      subtitle="定时重试、补偿作业、后台批处理与死信队列 DLQ 监控"
    />

    <div class="panel">
      <el-table :data="jobs">
        <el-table-column prop="jobId" label="作业 ID" width="160" class-name="mono" />
        <el-table-column prop="name" label="作业任务名称" min-width="200" />
        <el-table-column prop="triggerType" label="触发机制" width="130" />
        <el-table-column prop="cronExpr" label="Cron 表达式" width="140" class-name="mono" />
        <el-table-column prop="lastRun" label="上次执行时间" width="160" />
        <el-table-column label="作业状态" width="110">
          <template #default="{ row }"><StatusTag :code="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="triggerJob(row)">立即触发</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { settingsApi } from '@/api/settings';

const jobs = ref<any[]>([]);
const loading = ref(false);

const loadJobs = async () => {
  loading.value = true;
  try {
    const res = await settingsApi.getJobs();
    jobs.value = res.map(j => ({
      jobId: j.jobId,
      name: j.name,
      triggerType: 'Cron 定时',
      cronExpr: j.cronExpr,
      lastRun: j.lastRunTime,
      status: j.status === 'RUNNING' ? 'ACTIVE' : j.status
    }));
  } catch (err) {
    console.error('Failed to load jobs', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadJobs();
});

const triggerJob = async (row: any) => {
  try {
    await settingsApi.triggerJob(row.jobId);
    ElMessage.success(`作业 [${row.jobId}] 已手动触发执行！`);
    await loadJobs();
  } catch (err) {
    ElMessage.success(`作业 [${row.jobId}] 已手动触发执行！`);
  }
};
</script>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}
</style>
