import { request } from './client';
import { mockGovernanceCases } from './mockData';
import type { GovernanceCase } from '@/types';

export interface IngestBatch {
  batchId: string;
  sourceSystem: string;
  totalCount: number;
  successCount: number;
  failCount: number;
  startTime: string;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  errorLogs?: string[];
  mappingProfileVersion?: string;
  targetSchemaVersions?: Record<string, string>;
  processedAt?: string;
  failedRecordDetails?: any[];
}

export interface SourceSystemRequest {
  sourceSystemCode: string;
  sourceSystemName: string;
  sourceSystemType: string;
  ownerPartyId: number | string;
  endpointType: 'API' | 'FILE' | 'MESSAGE' | 'DATABASE' | string;
  baseUrl?: string;
  signaturePublicKey: string;
  signatureAlgorithm: string;
  trustLevel: string;
  defaultPurposeCodes: string[];
  status: 'ACTIVE' | 'INACTIVE';
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
  batchId?: number | string;
  sourceSystemId: number | string;
  sourceBusinessKey: string;
  contentType: string;
  contentDigest?: string;
  rawPayload?: string;
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

export interface MappingPreview {
  passed: boolean;
  mappedEventType: string;
  mappingProfileVersion: string;
  targetSchemaVersion: string;
  mappedPayload: Record<string, any>;
  issues: MappingIssue[];
  governanceTickets?: number[];
}

export interface BatchRequest {
  batchCode: string;
  sourceSystemId: number | string;
  mappingProfileCode: string;
  mappingProfileVersion: string;
  inputFormat: string;
  fileId: number | string;
  expectedRecordCount?: number;
  sourceBatchKey?: string;
  businessPurpose: string;
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
  status: 'ONLINE' | 'OFFLINE' | 'ACTIVE' | 'INACTIVE';
  lastHeartbeat: string;
  ownerPartyId?: number | string;
  version?: number | string;
  registeredAt?: string;
}

/**
 * 接入治理接口 (Swagger: /openapi/v1/*)
 */
export const governanceApi = {
  // ================= 1. 注册来源系统 POST /openapi/v1/source-systems =================
  async registerSourceSystem(data: SourceSystemRequest): Promise<SourceSystemResponse> {
    return request.post<SourceSystemResponse, SourceSystemResponse>('/openapi/v1/source-systems', data);
  },

  // ================= 2. 原始记录留存 POST /openapi/v1/raw-records =================
  async preserveRawRecord(command: PreserveRawCommand): Promise<RawRecordAccepted> {
    return request.post<RawRecordAccepted, RawRecordAccepted>('/openapi/v1/raw-records', command);
  },

  // ================= 3. 原始记录重放 POST /openapi/v1/raw-records/{rawRecordId}/replays =================
  async replayRawRecord(
    rawRecordId: number | string,
    mappingVersion: string = '1.4.0',
    reason: string = '异常规则已修正，手动触发重放'
  ): Promise<ReplayAccepted> {
    const query = new URLSearchParams({
      mappingVersion,
      reason
    });

    return request.post<ReplayAccepted, ReplayAccepted>(`/openapi/v1/raw-records/${rawRecordId}/replays?${query.toString()}`);
  },

  // ================= 4. 字段映射预检与试算 POST /openapi/v1/mappings/test =================
  async testMappingProfile(requestData: MappingPrecheckRequest): Promise<MappingPreview> {
    return request.post<MappingPreview, MappingPreview>('/openapi/v1/mappings/test', { ...requestData, dryRun: true });
  },

  // ================= 5. 接入批次创建 POST /openapi/v1/batches =================
  async createBatch(batchData: BatchRequest): Promise<BatchResponse> {
    return request.post<BatchResponse, BatchResponse>('/openapi/v1/batches', batchData);
  },

  async getBatches(params?: { batchId?: string; includeFailures?: boolean; pageNo?: number; pageSize?: number }): Promise<IngestBatch[]> {
    if (params?.batchId) {
      return request.get<any, any>(`/openapi/v1/batches/${encodeURIComponent(params.batchId)}`, {
          params: {
            includeFailures: params.includeFailures ?? true,
            pageNo: params.pageNo || 1,
            pageSize: params.pageSize || 20
          }
        }).then((item: any) => [{
          batchId: item.batchId,
          sourceSystem: '',
          totalCount: Number(item.totalRecords || 0),
          successCount: Number(item.successRecords || 0),
          failCount: Number(item.failedRecords || 0),
          startTime: '',
          status: item.batchStatus,
          mappingProfileVersion: item.mappingProfileVersion,
          targetSchemaVersions: item.targetSchemaVersions,
          processedAt: item.processedAt,
          failedRecordDetails: item.failedRecordDetails
        }]));
    }
    return [];
  },

  async getCases(params?: { status?: string; ruleCode?: string }): Promise<GovernanceCase[]> {
    return mockGovernanceCases.filter(c => {
        if (params?.status && c.status !== params.status) return false;
        if (params?.ruleCode && !(c.ruleCode || '').includes(params.ruleCode)) return false;
        return true;
      });
  },

  async getStandards(): Promise<any[]> {
    return [
        { code: 'CS-NHSA-TCM-PIECE', name: '国家医疗保障局中药饮片分类与代码', version: '2024.12', mandatoryLength: 16 },
        { code: 'ChP-2025-VOL1', name: '中华人民共和国药典 (一部中药材与饮片)', version: '2025年版', mandatoryLength: 0 },
        { code: 'NMPA-TCM-TRACE', name: '国家药监局中药饮片追溯与编码规则', version: '1.2.0', mandatoryLength: 20 }
      ];
  }
};
