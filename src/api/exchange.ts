import { request, apiCall } from './client';
import { mockProjections } from './mockData';
import type { ExchangeProjection } from '@/types';

export interface ExchangeProfile {
  id: string;
  profileCode: string;
  name: string;
  version: string;
  dataset: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  rules?: any[];
}

const mockProfiles: ExchangeProfile[] = [
  {
    id: 'PROF-01',
    profileCode: 'SH-PIECE-TRACE',
    name: '上海中药饮片互认追溯规范包',
    version: '1.2.0',
    dataset: 'PIECE_TRACE_DATASET',
    status: 'ACTIVE',
    rules: [
      {
        targetPath: '$.payload.batchNo',
        dataElement: 'DE_BATCH_NO (饮片批次号)',
        sourceSelector: 'batchNo',
        transform: 'DIRECT_PASS',
        required: true,
        missingStrategy: 'REJECT',
        valueDomain: 'GB/T 31774 批号规范',
        securityLevel: 'L1 (公开)'
      },
      {
        targetPath: '$.payload.insuranceCode',
        dataElement: 'DE_NHSA_CODE (国家医保饮片码)',
        sourceSelector: 'medicalInsurancePieceCode',
        transform: 'FORMAT_16_DIGIT',
        required: true,
        missingStrategy: 'REJECT',
        valueDomain: '16位国家医保代码',
        securityLevel: 'L2 (受控共享)'
      },
      {
        targetPath: '$.payload.traceCode',
        dataElement: 'DE_TRACE_CODE (全链追溯码)',
        sourceSelector: 'traceCode',
        transform: 'PREFIX_TRIM',
        required: false,
        missingStrategy: 'FALLBACK_NULL',
        valueDomain: 'GS1-128 / 69码',
        securityLevel: 'L1 (公开)'
      }
    ]
  },
  {
    id: 'PROF-02',
    profileCode: 'NHSA-PIECE-CODE',
    name: '国家医保饮片编码对账规范包',
    version: '1.0.0',
    dataset: 'NHSA_PIECE_DATASET',
    status: 'ACTIVE',
    rules: [
      {
        targetPath: '$.items.code',
        dataElement: 'DE_NHSA_CODE (国家医保饮片码)',
        sourceSelector: 'medicalInsuranceCode',
        transform: '16_DIGIT_CHECK',
        required: true,
        missingStrategy: 'REJECT',
        valueDomain: '16位国家医保代码',
        securityLevel: 'L2 (受控共享)'
      },
      {
        targetPath: '$.items.amount',
        dataElement: 'DE_SETTLE_AMOUNT (医保结算金额)',
        sourceSelector: 'totalAmount',
        transform: 'DECIMAL_ROUND_2',
        required: true,
        missingStrategy: 'REJECT',
        valueDomain: '货币金额(元)',
        securityLevel: 'L3 (高危敏感)'
      }
    ]
  }
];

/**
 * 互通输出与投影接口 (Swagger: /api/tcmirp/exchange/*)
 */
export const exchangeApi = {
  // 获取互通规范包列表 GET /api/tcmirp/exchange/profiles
  async getProfiles(): Promise<ExchangeProfile[]> {
    return apiCall(
      request.get('/exchange/profiles'),
      mockProfiles,
      '获取互通规范包列表'
    );
  },

  // 获取投影生成记录列表 GET /api/tcmirp/exchange/projections
  async getProjections(params?: { query?: string; profileCode?: string }): Promise<ExchangeProjection[]> {
    return apiCall(
      request.get('/exchange/projections', { params }),
      mockProjections.filter(p => {
        if (params?.profileCode && p.profileCode !== params.profileCode) return false;
        if (params?.query) {
          const q = params.query.toLowerCase();
          return p.projectionNo.toLowerCase().includes(q) ||
            p.profileName.toLowerCase().includes(q) ||
            p.profileCode.toLowerCase().includes(q);
        }
        return true;
      }),
      '获取互通投影列表'
    );
  },

  // 新建/触发投影生成任务 POST /api/tcmirp/exchange/projections
  async generateProjection(payload: {
    profileCode: string;
    asOfTime?: string;
  }): Promise<ExchangeProjection> {
    const newProj: ExchangeProjection = {
      id: `PRJ-${Date.now().toString().slice(-4)}`,
      projectionNo: `PRJ-20260808-${Math.floor(Math.random() * 9000 + 1000)}`,
      profileCode: payload.profileCode || 'SH-PIECE-TRACE',
      profileName: payload.profileCode === 'NHSA-PIECE-CODE' ? '国家医保饮片编码对账数据集' : '上海中药饮片互认追溯数据集',
      version: '1.2.0',
      datasetName: 'PIECE_TRACE_DATASET',
      asOfTime: payload.asOfTime || new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'GENERATED',
      recordCount: 280,
      outputHash: 'sha256:' + Math.random().toString(16).substr(2, 32),
      errorCount: 0
    };
    return apiCall(
      request.post('/exchange/projections', payload),
      newProj,
      '创建互通投影任务'
    );
  },

  // 导出投影数据集 GET /api/tcmirp/exchange/projections/{id}/export
  async exportDataset(id: string): Promise<{ success: boolean; downloadUrl: string }> {
    return apiCall(
      request.get(`/exchange/projections/${id}/export`),
      { success: true, downloadUrl: `/api/tcmirp/exchange/projections/${id}/download.json` },
      '导出互通投影数据集'
    );
  }
};
