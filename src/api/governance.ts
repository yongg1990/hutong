import { request, apiCall } from './client';
import { mockGovernanceCases, mockMappingRules } from './mockData';
import type { GovernanceCase, MappingRule } from '@/types';

export interface IngestBatch {
  batchId: string;
  sourceSystem: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  startTime: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  errorLogs?: string[];
}

export interface SourceSystemRequest {
  sourceSystemCode: string;
  sourceSystemName: string;
  sourceSystemType: string;
  ownerPartyId: number | string;
  endpointType: 'API' | 'FILE' | 'MESSAGE' | 'DATABASE' | string;
  baseUrl?: string;
  signaturePublicKey?: string;
  signatureAlgorithm?: string;
  trustLevel?: string;
  defaultPurposeCodes?: string[];
  status?: string;
}

export interface SourceSystemResponse {
  sourceSystemId: number | string;
  sourceSystemCode: string;
  version?: number | string;
  status: string;
  registeredAt?: string;
}

export interface PreserveRawCommand {
  projectSpaceId: number | string;
  batchId: number | string;
  sourceSystemId: number | string;
  sourceBusinessKey: string;
  contentType: string;
  contentDigest?: string;
  rawPayload: any;
  fileFragmentRef?: string;
}

export interface RawRecordAccepted {
  rawRecordId: number | string;
  contentDigest: string;
  status: string;
  duplicate: boolean;
}

export interface ReplayAccepted {
  replayId: number | string;
  rawRecordId: number | string;
  mappingVersion: string;
  status: string;
  requestedAt: string;
}

export interface MappingPrecheckRequest {
  mappingProfileCode: string;
  mappingProfileVersion: string;
  sourceSystemId: number | string;
  targetEventType: string;
  targetSchemaVersion: string;
  sourceSample: Record<string, any>;
  dryRun?: boolean;
  failOnWarning?: boolean;
}

export interface MappingIssue {
  path: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  ruleCode: string;
}

export interface GovernanceTicket {
  ticketId: number | string;
  ruleCode: string;
  reason: string;
}

export interface MappingPreview {
  passed: boolean;
  mappedEventType: string;
  mappingProfileVersion: string;
  targetSchemaVersion: string;
  mappedPayload: Record<string, any>;
  issues: MappingIssue[];
  governanceTickets?: GovernanceTicket[];
}

export interface BatchRequest {
  batchCode: string;
  sourceSystemId: number | string;
  mappingProfileCode: string;
  mappingProfileVersion: string;
  inputFormat: string;
  fileId?: string;
  expectedRecordCount?: number;
  sourceBatchKey?: string;
  businessPurpose?: string;
  onError?: 'STOP_ON_ERROR' | 'CONTINUE_ON_ERROR' | string;
  submitMode?: 'ASYNC' | 'SYNC' | string;
}

export interface BatchResponse {
  batchId: number | string;
  batchCode: string;
  batchStatus: string;
  acceptedAt: string;
  statusQueryUrl?: string;
}

export interface SourceSystem {
  id: string;
  systemCode: string;
  systemName: string;
  protocol: string;
  endpointUrl: string;
  authType: string;
  status: 'ONLINE' | 'OFFLINE' | 'ACTIVE' | 'SUSPENDED';
  lastHeartbeat: string;
  ownerPartyId?: number | string;
}

const mockBatches: IngestBatch[] = [
  { batchId: 'BATCH-KM-04', sourceSystem: 'WMS-KM-01', totalCount: 2434, successCount: 2418, failCount: 16, startTime: '2026-08-08 15:30', status: 'PROCESSING' },
  { batchId: 'BATCH-KM-03', sourceSystem: 'LIMS-KM-02', totalCount: 520, successCount: 520, failCount: 0, startTime: '2026-08-08 14:00', status: 'COMPLETED' },
  { batchId: 'BATCH-WS-01', sourceSystem: 'ERP-WS-01', totalCount: 1280, successCount: 1275, failCount: 5, startTime: '2026-08-08 12:15', status: 'COMPLETED' }
];

const mockSources: SourceSystem[] = [
  { id: 'SRC-01', systemCode: 'WMS-KM-01', systemName: '昆明医药仓储管理系统', protocol: 'HTTP/REST', endpointUrl: 'https://wms-km.tcm.local/api', authType: 'HMAC-SHA256', status: 'ONLINE', lastHeartbeat: '10秒前', ownerPartyId: 1 },
  { id: 'SRC-02', systemCode: 'LIMS-KM-02', systemName: '昆明检测检验实验室LIMS', protocol: 'MQTT/Webhook', endpointUrl: 'https://lims.tcm.local/events', authType: 'OAuth2 / Bearer', status: 'ONLINE', lastHeartbeat: '1分钟前', ownerPartyId: 1 },
  { id: 'SRC-03', systemCode: 'ERP-WS-01', systemName: '文山三七产业ERP', protocol: 'DB-CDC', endpointUrl: 'jdbc:mysql://erp-ws.tcm.local:3306/erp', authType: 'Cert-Mutual-TLS', status: 'ONLINE', lastHeartbeat: '2分钟前', ownerPartyId: 2 }
];

/**
 * 接入治理接口 (Swagger: /openapi/v1/* & /governance/*)
 */
export const governanceApi = {
  // ================= 1. 注册来源系统 POST /openapi/v1/source-systems =================
  async registerSourceSystem(data: SourceSystemRequest): Promise<SourceSystemResponse> {
    const fallback: SourceSystemResponse = {
      sourceSystemId: Date.now(),
      sourceSystemCode: data.sourceSystemCode,
      version: 1,
      status: 'ACTIVE',
      registeredAt: new Date().toLocaleString()
    };

    return apiCall(
      request.post('/openapi/v1/source-systems', data),
      fallback,
      '注册来源系统'
    );
  },

  async createSource(payload: Partial<SourceSystem> & { ownerPartyId?: number | string }): Promise<SourceSystem> {
    const newSource: SourceSystem = {
      id: `SRC-${Date.now().toString().slice(-4)}`,
      systemCode: payload.systemCode || `SRC-${Date.now().toString().slice(-4)}`,
      systemName: payload.systemName || '新接入系统',
      protocol: payload.protocol || 'HTTP/REST',
      endpointUrl: payload.endpointUrl || 'https://api.tcm.local',
      authType: payload.authType || 'OAuth2 / Bearer',
      status: 'ONLINE',
      lastHeartbeat: '刚刚',
      ownerPartyId: payload.ownerPartyId || 1
    };

    return apiCall(
      request.post('/openapi/v1/source-systems', {
        sourceSystemCode: newSource.systemCode,
        sourceSystemName: newSource.systemName,
        sourceSystemType: newSource.systemCode.startsWith('WMS') ? 'WMS' : newSource.systemCode.startsWith('LIMS') ? 'LIMS' : 'ERP',
        ownerPartyId: Number(newSource.ownerPartyId) || 1,
        endpointType: 'API',
        baseUrl: newSource.endpointUrl,
        signaturePublicKey: 'MFkwEwYHKoZIzj0CAQYIKoEcz1UBgi0DQgAE...',
        signatureAlgorithm: 'SM2',
        trustLevel: 'HIGH',
        defaultPurposeCodes: ['TRACE', 'RECONCILIATION'],
        status: 'ACTIVE'
      }).then((res: any) => {
        return {
          ...newSource,
          id: String(res?.sourceSystemId || newSource.id)
        };
      }),
      newSource,
      '注册新来源系统'
    );
  },

  async getSources(): Promise<SourceSystem[]> {
    return apiCall(
      request.get('/governance/sources'),
      mockSources,
      '获取数据源列表'
    );
  },

  // ================= 2. 原始记录留存 POST /openapi/v1/raw-records =================
  async preserveRawRecord(command: PreserveRawCommand): Promise<RawRecordAccepted> {
    const fallback: RawRecordAccepted = {
      rawRecordId: Date.now(),
      contentDigest: command.contentDigest || `sha256_${Date.now()}`,
      status: 'ACCEPTED',
      duplicate: false
    };

    return apiCall(
      request.post('/openapi/v1/raw-records', command),
      fallback,
      '保全原始接入记录'
    );
  },

  // ================= 3. 原始记录重放 POST /openapi/v1/raw-records/{rawRecordId}/replays =================
  async replayRawRecord(
    rawRecordId: number | string,
    mappingVersion: string = '1.4.0',
    reason: string = '异常规则已修正，手动触发重放'
  ): Promise<ReplayAccepted> {
    const fallback: ReplayAccepted = {
      replayId: Date.now(),
      rawRecordId: Number(rawRecordId) || 101,
      mappingVersion,
      status: 'PROCESSING',
      requestedAt: new Date().toLocaleString()
    };

    const query = new URLSearchParams({
      mappingVersion,
      reason
    });

    return apiCall(
      request.post(`/openapi/v1/raw-records/${rawRecordId}/replays?${query.toString()}`),
      fallback,
      '重放原始记录'
    );
  },

  // ================= 4. 字段映射预检与试算 POST /openapi/v1/mappings/test =================
  async testMappingProfile(requestData: MappingPrecheckRequest): Promise<MappingPreview> {
    const fallback: MappingPreview = {
      passed: true,
      mappedEventType: requestData.targetEventType || 'WAREHOUSED',
      mappingProfileVersion: requestData.mappingProfileVersion || '1.4.0',
      targetSchemaVersion: requestData.targetSchemaVersion || '1.0.0',
      mappedPayload: {
        warehouseCode: 'WH-KM-001',
        inboundNo: 'IN-20260808-0021',
        batchNo: 'SQ-260731-08',
        quantity: 1200.0,
        unitCode: 'kg'
      },
      issues: [
        {
          path: '$.insurance_code',
          severity: 'INFO',
          message: '检测到16位国家医保编码已通过标准校验',
          ruleCode: 'CS-NHSA-TCM-PIECE'
        }
      ]
    };

    return apiCall(
      request.post('/openapi/v1/mappings/test', requestData),
      fallback,
      '预检映射规则'
    );
  },

  // ================= 5. 接入批次创建 POST /openapi/v1/batches =================
  async createBatch(batchData: BatchRequest): Promise<BatchResponse> {
    const fallback: BatchResponse = {
      batchId: Date.now(),
      batchCode: batchData.batchCode,
      batchStatus: 'SUBMITTED',
      acceptedAt: new Date().toLocaleString(),
      statusQueryUrl: `/openapi/v1/batches/${Date.now()}`
    };

    return apiCall(
      request.post('/openapi/v1/batches', batchData),
      fallback,
      '创建接入批次'
    );
  },

  async getBatches(params?: { batchNo?: string; sourceSystem?: string }): Promise<IngestBatch[]> {
    return apiCall(
      request.get('/governance/batches', { params }),
      mockBatches.filter(b => {
        if (params?.batchNo && !(b.batchId || '').includes(params.batchNo)) return false;
        if (params?.sourceSystem && b.sourceSystem !== params.sourceSystem) return false;
        return true;
      }),
      '获取接入批次列表'
    );
  },

  async replayBatch(batchId: string): Promise<{ success: boolean; jobId: string }> {
    return this.replayRawRecord(101, '1.4.0', `重试批次 ${batchId}`).then(res => ({
      success: true,
      jobId: String(res.replayId)
    }));
  },

  async getMappings(params?: { sourceSystem?: string; eventType?: string }): Promise<MappingRule[]> {
    return apiCall(
      request.get('/governance/mappings', { params }),
      mockMappingRules,
      '获取字段映射规则'
    );
  },

  async getMappingRules(): Promise<MappingRule[]> {
    return this.getMappings();
  },

  async saveMappingRules(rules: MappingRule[]): Promise<{ success: boolean }> {
    return apiCall(
      request.post('/governance/mappings/save', { rules }),
      { success: true },
      '保存字段映射'
    );
  },

  async testMapping(payload: { rawJson: string; rules: MappingRule[] }): Promise<{ success: boolean; transformed: any; errorCount: number }> {
    let parsedSample: any = {};
    try {
      parsedSample = JSON.parse(payload.rawJson);
    } catch (e) {
      parsedSample = { raw: payload.rawJson };
    }

    return this.testMappingProfile({
      mappingProfileCode: 'MP_WMS_TO_WAREHOUSED',
      mappingProfileVersion: '1.4.0',
      sourceSystemId: 1,
      targetEventType: 'WAREHOUSED',
      targetSchemaVersion: '1.0.0',
      sourceSample: parsedSample,
      dryRun: true,
      failOnWarning: false
    }).then(preview => ({
      success: preview.passed,
      transformed: preview.mappedPayload,
      errorCount: preview.issues.filter(i => i.severity === 'ERROR').length
    }));
  },

  async getCases(params?: { status?: string; ruleCode?: string }): Promise<GovernanceCase[]> {
    return apiCall(
      request.get('/governance/cases', { params }),
      mockGovernanceCases.filter(c => {
        if (params?.status && c.status !== params.status) return false;
        if (params?.ruleCode && !(c.ruleCode || '').includes(params.ruleCode)) return false;
        return true;
      }),
      '获取治理异常案卷'
    );
  },

  async resolveCase(id: string, payload: { resolution: string; replayNow?: boolean }): Promise<{ success: boolean; id: string }> {
    return apiCall(
      request.post(`/governance/cases/${id}/resolve`, payload),
      { success: true, id },
      '解决治理异常案卷'
    );
  },

  async getStandards(): Promise<any[]> {
    return apiCall(
      request.get('/governance/standards'),
      [
        { code: 'CS-NHSA-TCM-PIECE', name: '国家医疗保障局中药饮片分类与代码', version: '2024.12', mandatoryLength: 16 },
        { code: 'ChP-2025-VOL1', name: '中华人民共和国药典 (一部中药材与饮片)', version: '2025年版', mandatoryLength: 0 },
        { code: 'NMPA-TCM-TRACE', name: '国家药监局中药饮片追溯与编码规则', version: '1.2.0', mandatoryLength: 20 }
      ],
      '获取治理标准集'
    );
  }
};
