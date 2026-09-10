import { request, apiCall } from './client';
import { mockPrimaryProcessingBatches } from './mockData';
import type { PrimaryProcessingBatch } from '@/types';

export interface QualityInspection {
  id: string;
  reportNo: string;
  batchNo: string;
  inspectType: string;
  conclusion: 'QUALIFIED' | 'UNQUALIFIED';
  operator: string;
  inspectDate: string;
  indicators: Array<{
    name: string;
    result: string;
    limit: string;
    status: 'PASS' | 'FAIL';
  }>;
}

const mockInspections: QualityInspection[] = [
  {
    id: 'INSP-01',
    reportNo: 'QJ-240808-01',
    batchNo: 'SQ-260731-08',
    inspectType: '全项全检 (中国药典2025版)',
    conclusion: 'QUALIFIED',
    operator: '李华 (主任检验师)',
    inspectDate: '2026-08-08 14:10',
    indicators: [
      { name: '性状与鉴别', result: '符合规定', limit: '横切面灰黄色，放射状纹理', status: 'PASS' },
      { name: '水分', result: '10.8%', limit: '≤ 14.0%', status: 'PASS' },
      { name: '总灰分', result: '4.2%', limit: '≤ 6.0%', status: 'PASS' },
      { name: '醇溶性浸出物', result: '32.4%', limit: '≥ 28.0%', status: 'PASS' },
      { name: '人参皂苷Rg1+Rb1', result: '6.8%', limit: '≥ 5.0%', status: 'PASS' },
      { name: '重金属铅(Pb)', result: '0.2 mg/kg', limit: '≤ 5.0 mg/kg', status: 'PASS' },
      { name: '33种禁用农药残留', result: '未检出', limit: '符合药典限量', status: 'PASS' }
    ]
  },
  {
    id: 'INSP-02',
    reportNo: 'QJ-240802-03',
    batchNo: 'DG-260728-03',
    inspectType: '产地趁鲜切制入库检',
    conclusion: 'QUALIFIED',
    operator: '张伟 (质检员)',
    inspectDate: '2026-08-02 10:30',
    indicators: [
      { name: '阿魏酸含量', result: '0.082%', limit: '≥ 0.050%', status: 'PASS' },
      { name: '水分', result: '11.5%', limit: '≤ 13.0%', status: 'PASS' },
      { name: '二氧化硫残留', result: '12 mg/kg', limit: '≤ 150 mg/kg', status: 'PASS' }
    ]
  }
];

/**
 * 初加工与质量检验接口 (Swagger: /api/tcmirp/process-quality/*)
 */
export const processQualityApi = {
  // 获取初加工/趁鲜切制批次列表 GET /api/tcmirp/process-quality/batches
  async getPrimaryBatches(params?: {
    keyword?: string;
    status?: string;
  }): Promise<PrimaryProcessingBatch[]> {
    return apiCall(
      request.get('/process-quality/batches', { params }),
      mockPrimaryProcessingBatches.filter(b => {
        if (params?.status && b.status !== params.status) return false;
        if (params?.keyword) {
          const kw = params.keyword.toLowerCase();
          const match = (b.primaryBatchNo || '').toLowerCase().includes(kw) ||
            (b.harvestBatchNo || '').toLowerCase().includes(kw) ||
            (b.herbName || '').toLowerCase().includes(kw) ||
            (b.facilityName || '').toLowerCase().includes(kw);
          if (!match) return false;
        }
        return true;
      }),
      '获取初加工批次列表'
    );
  },

  // 获取初加工详情 GET /api/tcmirp/process-quality/batches/{id}
  async getPrimaryBatchDetail(id: string): Promise<PrimaryProcessingBatch | null> {
    return apiCall(
      request.get(`/process-quality/batches/${id}`),
      mockPrimaryProcessingBatches.find(b => b.id === id || b.primaryBatchNo === id) || mockPrimaryProcessingBatches[0],
      '获取初加工批次详情'
    );
  },

  // 登记初加工批次 POST /api/tcmirp/process-quality/batches
  async createPrimaryBatch(payload: Partial<PrimaryProcessingBatch>): Promise<PrimaryProcessingBatch> {
    const newRecord: PrimaryProcessingBatch = {
      id: `PRI-${Date.now()}`,
      primaryBatchNo: payload.primaryBatchNo || `PRIMARY-SQ-${Date.now().toString().slice(-6)}`,
      harvestBatchNo: payload.harvestBatchNo || 'HARVEST-0808',
      herbName: payload.herbName || '三七',
      processMethod: payload.processMethod || '产地趁鲜切制 + 低温热泵烘干',
      facilityName: payload.facilityName || '文山三七产地初加工示范基地',
      freshWeight: payload.freshWeight || 1000,
      driedWeight: payload.driedWeight || 320,
      yieldRate: payload.yieldRate || '32.0%',
      moistureContent: payload.moistureContent || '11.0%',
      impurityContent: payload.impurityContent || '0.1%',
      operator: payload.operator || '操作员',
      processedAt: payload.processedAt || new Date().toLocaleString(),
      status: payload.status || 'PROCESSING'
    };
    return apiCall(
      request.post('/process-quality/batches', payload),
      newRecord,
      '登记初加工批次'
    );
  },

  // 获取质检报告列表 GET /api/tcmirp/process-quality/inspections
  async getQualityInspections(params?: { batchNo?: string }): Promise<QualityInspection[]> {
    return apiCall(
      request.get('/process-quality/inspections', { params }),
      mockInspections.filter(i => {
        if (params?.batchNo && !(i.batchNo || '').includes(params.batchNo)) return false;
        return true;
      }),
      '获取质检报告列表'
    );
  },

  // 提交/登记质检报告 POST /api/tcmirp/process-quality/inspections
  async submitQualityInspection(payload: Partial<QualityInspection>): Promise<QualityInspection> {
    const newInsp: QualityInspection = {
      id: `INSP-${Date.now()}`,
      reportNo: payload.reportNo || `QJ-${Date.now().toString().slice(-8)}`,
      batchNo: payload.batchNo || 'SQ-260731-08',
      inspectType: payload.inspectType || '常规标准检验',
      conclusion: payload.conclusion || 'QUALIFIED',
      operator: payload.operator || '检验员',
      inspectDate: payload.inspectDate || new Date().toLocaleString(),
      indicators: payload.indicators || []
    };
    return apiCall(
      request.post('/process-quality/inspections', payload),
      newInsp,
      '提交质检报告'
    );
  }
};
