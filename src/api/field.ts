import { request, apiCall } from './client';
import { mockFieldBatches } from './mockData';
import type { FieldCropBatch } from '@/types';

/**
 * 田间种植协同接口 (Swagger: /api/tcmirp/field/*)
 */
export const fieldApi = {
  // 获取作物批次列表 GET /api/tcmirp/field/batches
  async getFieldBatches(params?: {
    keyword?: string;
    baseName?: string;
    stage?: string;
    status?: string;
  }): Promise<FieldCropBatch[]> {
    return apiCall(
      request.get('/field/batches', { params }),
      mockFieldBatches.filter(b => {
        if (params?.stage && params.stage !== 'ALL' && b.stage !== params.stage) return false;
        if (params?.status && b.status !== params.status) return false;
        if (params?.baseName && !(b.baseName || '').includes(params.baseName)) return false;
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          const match = (b.batchNo || '').toLowerCase().includes(kw) ||
            (b.herbName || '').toLowerCase().includes(kw) ||
            (b.plotName || '').toLowerCase().includes(kw);
          if (!match) return false;
        }
        return true;
      }),
      '获取作物批次列表'
    );
  },

  // 获取单个作物批次档案详情 GET /api/tcmirp/field/batches/{id}
  async getFieldBatchDetail(id: string): Promise<FieldCropBatch | null> {
    return apiCall(
      request.get(`/field/batches/${id}`),
      mockFieldBatches.find(b => b.id === id || b.batchNo === id) || mockFieldBatches[0],
      '获取作物批次详情'
    );
  },

  // 记录种植建档 POST /api/tcmirp/field/batches
  async createFieldBatch(payload: Partial<FieldCropBatch>): Promise<FieldCropBatch> {
    const newRecord: FieldCropBatch = {
      id: `CB-${Date.now()}`,
      batchNo: payload.batchNo || `CB-YN-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      baseName: payload.baseName || '文山三七示范基地',
      plotName: payload.plotName || '新地块-01',
      herbName: payload.herbName || '三七',
      plantDate: payload.plantDate || new Date().toISOString().split('T')[0],
      lastEvent: payload.lastEvent || '种植建档完成',
      status: payload.status || 'GROWING',
      stage: payload.stage || 'PLANTING'
    };
    return apiCall(
      request.post('/field/batches', payload),
      newRecord,
      '创建种植建档批次'
    );
  },

  // 记录农事/投入品作业事件 POST /api/tcmirp/field/events
  async recordFieldEvent(payload: {
    batchId: string;
    eventType: string;
    eventDetail: string;
    operator?: string;
  }): Promise<{ success: boolean; eventId: string }> {
    return apiCall(
      request.post('/field/events', payload),
      { success: true, eventId: `EVT-FIELD-${Date.now()}` },
      '记录田间作业事件'
    );
  }
};
