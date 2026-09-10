<template>
  <el-drawer
    v-model="taskStore.isFloatingDrawerOpen"
    title="后台异步任务队列与进度"
    direction="rtl"
    size="420px"
  >
    <div class="task-drawer-content">
      <div v-if="taskStore.jobs.length === 0" class="empty-jobs">
        暂无运行中的异步任务
      </div>

      <div
        v-for="job in taskStore.jobs"
        :key="job.jobId"
        class="job-card"
      >
        <div class="job-header">
          <strong>{{ job.title }}</strong>
          <StatusTag :code="job.status" />
        </div>

        <div class="job-meta">
          <span class="mono">{{ job.jobId }}</span>
          <span>开始: {{ job.startedAt }}</span>
        </div>

        <div class="progress-bar-wrapper">
          <el-progress
            :percentage="job.progressPercent"
            :status="job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'exception' : ''"
            :stroke-width="8"
          />
        </div>

        <div class="job-footer" v-if="job.routeRedirect">
          <el-button
            size="small"
            type="primary"
            link
            @click="jumpToPage(job.routeRedirect)"
          >
            跳转到任务视图 →
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/taskStore';
import StatusTag from '@/components/common/StatusTag.vue';

const router = useRouter();
const taskStore = useTaskStore();

const jumpToPage = (routePath: string) => {
  taskStore.isFloatingDrawerOpen = false;
  router.push(routePath);
};
</script>

<style scoped>
.task-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-jobs {
  color: var(--color-muted);
  text-align: center;
  padding: 40px 0;
}

.job-card {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 12px;
  background: var(--color-surface);
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 14px;
  margin-bottom: 6px;
}

.job-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 8px;
}

.progress-bar-wrapper {
  margin: 8px 0;
}

.job-footer {
  text-align: right;
  margin-top: 6px;
}
</style>
