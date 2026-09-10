import { defineStore } from 'pinia';
import type { AsyncJob } from '@/types';

export const useTaskStore = defineStore('task', {
  state: () => ({
    jobs: [
      {
        jobId: 'JOB-20260808-8801',
        title: 'WMS-KM-01 映射规则批量验证与计算',
        progressPercent: 72,
        status: 'RUNNING',
        startedAt: '16:15:00',
        nextPollAt: 3000,
        routeRedirect: '/governance/mappings'
      },
      {
        jobId: 'JOB-20260808-8802',
        title: '上海饮片互认追溯数据集 (PRJ-0068) 投影生成',
        progressPercent: 45,
        status: 'RUNNING',
        startedAt: '16:18:30',
        nextPollAt: 5000,
        routeRedirect: '/exchange/projections'
      }
    ] as AsyncJob[],
    isFloatingDrawerOpen: false
  }),
  actions: {
    addJob(job: AsyncJob) {
      this.jobs.unshift(job);
    },
    updateJobProgress(jobId: string, percent: number, status?: 'RUNNING' | 'COMPLETED' | 'FAILED') {
      const target = this.jobs.find((j) => j.jobId === jobId);
      if (target) {
        target.progressPercent = percent;
        if (status) target.status = status;
      }
    },
    toggleFloatingDrawer() {
      this.isFloatingDrawerOpen = !this.isFloatingDrawerOpen;
    }
  }
});
