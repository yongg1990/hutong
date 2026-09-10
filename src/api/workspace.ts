import { request, apiCall } from './client';
import { mockWorkItems, mockActivityLogs } from './mockData';
import type { WorkItem, ActivityLog } from '@/types';

export interface WorkspaceStats {
  pendingGovernanceCases: number;
  processingIngestBatches: number;
  pendingProofs: number;
  todayAcceptedEvents: number;
  todaySuccessRate: string;
}

const defaultStats: WorkspaceStats = {
  pendingGovernanceCases: 12,
  processingIngestBatches: 4,
  pendingProofs: 3,
  todayAcceptedEvents: 1286,
  todaySuccessRate: '99.2%'
};

/**
 * 工作台接口 (Swagger 对应路径: /api/tcmirp/workspace/*)
 */
export const workspaceApi = {
  // 获取待办事项列表 GET /api/tcmirp/workspace/work-items
  async getWorkItems(params?: { status?: string; type?: string }): Promise<WorkItem[]> {
    return apiCall(
      request.get('/workspace/work-items', { params }),
      mockWorkItems.filter(item => {
        if (params?.status && item.status !== params.status) return false;
        if (params?.type && item.type !== params.type) return false;
        return true;
      }),
      '获取待办事项'
    );
  },

  // 处理/办结待办事项 POST /api/tcmirp/workspace/work-items/{id}/resolve
  async resolveWorkItem(id: string, payload?: { resolutionNote?: string; status?: string }): Promise<{ success: boolean; id: string }> {
    return apiCall(
      request.post(`/workspace/work-items/${id}/resolve`, payload),
      { success: true, id },
      '处理待办事项'
    );
  },

  // 获取动态与日志 GET /api/tcmirp/workspace/activities
  async getActivityLogs(): Promise<ActivityLog[]> {
    return apiCall(
      request.get('/workspace/activities'),
      mockActivityLogs,
      '获取最新活动动态'
    );
  },

  // 获取工作台统计指标 GET /api/tcmirp/workspace/stats
  async getStats(): Promise<WorkspaceStats> {
    return apiCall(
      request.get('/workspace/stats'),
      defaultStats,
      '获取工作台概览统计'
    );
  }
};
