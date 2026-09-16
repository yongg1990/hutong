import { request, apiCall } from './client';
import { mockProjections } from './mockData';
import type { ExchangeProjection } from '@/types';

export interface ExchangeFieldRule {
  id: string | number;
  datasetId: string | number;
  targetPath: string;
  dataElement: string;
  sourceSelector: string;
  transform: string;
  required: boolean;
  requiredPolicy?: string;
  missingStrategy: string;
  valueDomain: string;
  securityLevel: string;
  ordinal?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExchangeProfile {
  id: string | number;
  profileCode: string;
  name: string;
  profileOwner: string;
  scenarioCode: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt?: string;
  updatedAt?: string;
  version: string;
  dataset: string;
  rules: ExchangeFieldRule[];
  datasets: any[];
}

const mockProfiles: ExchangeProfile[] = [{
  id: 'PROF-01', profileCode: 'SH-PIECE-TRACE', name: '上海中药饮片互认追溯规范包',
  profileOwner: '上海长三角中药饮片互认联盟', scenarioCode: 'PIECE_TRACE', version: '1.2.0',
  dataset: 'PIECE_TRACE_DATASET', datasets: [], status: 'ACTIVE', createdAt: '2026-03-01 09:00:00', updatedAt: '2026-08-01 10:30:00',
  rules: [
    { id: 1, datasetId: 1, targetPath: '$.payload.batchNo', dataElement: 'DE_BATCH_NO', sourceSelector: 'batchNo', transform: 'DIRECT_PASS', required: true, missingStrategy: 'REJECT', valueDomain: 'GB/T 31774', securityLevel: 'PUBLIC' },
    { id: 2, datasetId: 1, targetPath: '$.payload.insuranceCode', dataElement: 'DE_NHSA_CODE', sourceSelector: 'medicalInsurancePieceCode', transform: 'FORMAT_16_DIGIT', required: true, missingStrategy: 'REJECT', valueDomain: '16位国家医保代码', securityLevel: 'SENSITIVE' }
  ]
}];

function mapRule(item: any): ExchangeFieldRule {
  return {
    id: item.id, datasetId: item.datasetId, targetPath: item.targetPath, dataElement: item.dataElementCode,
    sourceSelector: item.sourceSelector,
    transform: typeof item.transformJson === 'string' ? item.transformJson : JSON.stringify(item.transformJson || {}),
    required: item.requiredPolicy === 'REQUIRED', requiredPolicy: item.requiredPolicy, missingStrategy: item.missingPolicy, valueDomain: item.valueSetCode,
    securityLevel: item.securityClass, ordinal: item.ordinal, createdAt: item.createdAt, updatedAt: item.updatedAt
  };
}

async function hydrateProfile(item: any): Promise<ExchangeProfile> {
  const versionsResponse: any = await request.get(`/exchange-query/profiles/${item.id}/versions`);
  const versions = Array.isArray(versionsResponse) ? versionsResponse : [];
  const version = versions.find(v => v.status === 'PUBLISHED') || versions[0];
  const datasetsResponse: any = version ? await request.get(`/exchange-query/profile-versions/${version.id}/datasets`) : [];
  const datasets = Array.isArray(datasetsResponse) ? datasetsResponse : [];
  const rulesByDataset = await Promise.all(datasets.map(async dataset => {
    const response: any = await request.get(`/exchange-query/datasets/${dataset.id}/field-rules`);
    return Array.isArray(response) ? response : [];
  }));
  const rules = rulesByDataset.flat();
  return {
    id: item.id, profileCode: item.profileCode, name: item.profileName, profileOwner: item.profileOwner,
    scenarioCode: item.scenarioCode, status: item.status, createdAt: item.createdAt, updatedAt: item.updatedAt,
    version: version?.version || '', dataset: datasets.map(item => item.datasetName || item.datasetCode).join(', '),
    datasets, rules: Array.isArray(rules) ? rules.map(mapRule) : []
  };
}

export const exchangeApi = {
  async getProfiles(params?: { profileCode?: string; limit?: number }): Promise<ExchangeProfile[]> {
    const fallback = mockProfiles.filter(item => !params?.profileCode || item.profileCode.includes(params.profileCode));
    return apiCall(
      request.get('/exchange-query/profiles', { params: { profileCode: params?.profileCode || undefined, limit: params?.limit || 20 } })
        .then(async (res: any) => Array.isArray(res) ? Promise.all(res.map(hydrateProfile)) : fallback),
      fallback,
      '查询启用规范包'
    );
  },

  async createProfile(data: { profileCode: string; profileName: string; profileOwner: string; scenarioCode: string; status: string }): Promise<any> {
    return request.post('/exchange-query/profiles', data);
  },

  async updateProfile(id: string | number, data: { profileCode: string; profileName: string; profileOwner: string; scenarioCode: string; status: string }): Promise<any> {
    return request.post(`/exchange-query/profiles/${id}`, data);
  },

  async getProfileVersions(id: string | number): Promise<any[]> {
    return request.get(`/exchange-query/profiles/${id}/versions`).then((response: any) => response as any[]);
  },

  async getProjections(params?: { query?: string; profileCode?: string }): Promise<ExchangeProjection[]> {
    return mockProjections.filter(p => {
      if (params?.profileCode && p.profileCode !== params.profileCode) return false;
      if (!params?.query) return true;
      const q = params.query.toLowerCase();
      return p.projectionNo.toLowerCase().includes(q) || p.profileName.toLowerCase().includes(q) || p.profileCode.toLowerCase().includes(q);
    });
  },

  async createProjection(payload: {
    projectSpaceId?: number;
    profileCode: string; profileVersion?: string; subjectType?: string; subjectIds?: Array<number | string>;
    datasetCodes?: string[]; asOfTime?: string; deliveryMode?: string;
  }): Promise<any> {
    const projectSpaceId = payload.projectSpaceId || Number(localStorage.getItem('tcmirp_project_space_id') || localStorage.getItem('tcmirp_project_id')) || 1;
    return request.post('/exchange-query/projections', {
      projectSpaceId, profileCode: payload.profileCode, profileVersion: payload.profileVersion || '1.0.0',
      subjectType: payload.subjectType || 'BATCH', subjectIds: (payload.subjectIds || [1]).map(Number),
      datasetCodes: payload.datasetCodes || [], asOfTime: payload.asOfTime || undefined,
      deliveryMode: payload.deliveryMode || 'QUERY_ONLY'
    }, { headers: {
      'X-Idempotency-Key': `PROJECTION-${Date.now()}`,
      'X-Purpose-Code': 'EXCHANGE_OUTPUT'
    } });
  },

  async getProjection(id: string | number, params: {
    projectSpaceId?: number; purposeCode?: string; includeOutput?: boolean; includeValidationDetails?: boolean;
  } = {}): Promise<any> {
    return request.get(`/exchange-query/projections/${id}`, { params: {
      projectSpaceId: params.projectSpaceId || Number(localStorage.getItem('tcmirp_project_space_id')) || 1,
      purposeCode: params.purposeCode || localStorage.getItem('tcmirp_purpose_code') || 'TRACE',
      includeOutput: params.includeOutput ?? true, includeValidationDetails: params.includeValidationDetails ?? true
    } });
  }
};
