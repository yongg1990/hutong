import { request, apiCall } from './client';
import { mockHerbPieces } from './mockData';
import type { HerbPiece } from '@/types';

export interface TraceCodeRequest {
  schemeCode: string;
  code: string;
  batchId: number | string;
  packageUnitId: number | string;
  packageLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | string;
  parentCode?: string;
}

export interface TraceCodeResponse {
  traceCodeRecordId: number | string;
}

export interface TraceCodeHierarchy {
  parentCode: string;
  parentType: 'BOX' | 'CASE' | 'PALLET';
  childCodes: string[];
  boundAt?: string;
}

/**
 * 赋码与追溯码接口 (Swagger: /openapi/v1/trace-codes & /coding/*)
 */
export const codingApi = {
  // 登记追溯码 POST /openapi/v1/trace-codes
  async registerTraceCode(payload: TraceCodeRequest): Promise<TraceCodeResponse> {
    return apiCall(
      request.post('/openapi/v1/trace-codes', {
        schemeCode: payload.schemeCode || 'GS1_128',
        code: payload.code,
        batchId: Number(payload.batchId) || 101,
        packageUnitId: Number(payload.packageUnitId) || 1,
        packageLevel: payload.packageLevel || 'LEVEL_1',
        parentCode: payload.parentCode || undefined
      }),
      {
        traceCodeRecordId: Date.now()
      },
      '登记赋码与追溯码'
    );
  },

  // 获取赋码清单列表 GET /coding/pieces
  async getCodingPieces(params?: { keyword?: string }): Promise<HerbPiece[]> {
    return apiCall(
      request.get('/coding/pieces', { params }),
      mockHerbPieces.filter(p => {
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          return (p.speciesName || '').toLowerCase().includes(kw) ||
            (p.batchNo || '').toLowerCase().includes(kw) ||
            (p.medicalInsuranceCode || '').includes(kw);
        }
        return true;
      }),
      '获取赋码清单'
    );
  },

  // 绑定多级追溯码层次 POST /coding/hierarchy/bind
  async bindHierarchy(payload: TraceCodeHierarchy): Promise<{ success: boolean; boundCount: number }> {
    return apiCall(
      request.post('/coding/hierarchy/bind', payload),
      { success: true, boundCount: payload.childCodes.length },
      '绑定追溯码层次'
    );
  },

  // 查询追溯码流向与关联 GET /coding/trace-codes/{code}
  async getTraceCodeDetail(code: string): Promise<any> {
    return apiCall(
      request.get(`/coding/trace-codes/${code}`),
      {
        traceCode: code,
        spec: '1kg/袋',
        batchNo: 'SQ-260731-08',
        parentCode: 'PALLET-YN-0091',
        status: 'ACTIVE',
        chainTimestamp: '2026-08-08 15:42:20'
      },
      '查询追溯码详情'
    );
  }
};
