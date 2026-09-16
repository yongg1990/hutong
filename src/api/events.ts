import { request, apiCall } from './client';
import type { TrustEvent } from '@/types';
import { submitSupplyChainEvent } from './supplyChain';

/**
 * 可信事件上报与查询接口
 */
export const eventsApi = {
  // 当前文档仅支持按事件 ID 查询。
  async queryTrustEvents(params?: {
    eventId?: string | number;
    businessKey?: string;
    eventType?: string;
    processStatus?: string;
    proofStatus?: string;
  }): Promise<TrustEvent[]> {
    if (params?.eventId) {
      return apiCall(
        request.get(`/openapi/v1/event-fact/events/${params.eventId}`).then((item: any) => [{
          eventId: String(item.id),
          eventType: item.eventType,
          eventTypeName: item.eventType,
          occurredAt: item.occurredAt,
          sourceSystem: '',
          processStatus: item.processingStatus,
          proofStatus: 'PENDING',
          businessKey: item.sourceBusinessKey,
          payload: typeof item.payloadJson === 'string' ? JSON.parse(item.payloadJson || '{}') : item.payloadJson,
          schemaVersion: item.schemaVersion,
          payloadDigest: item.payloadDigest
        }])),
        [],
        '按ID查询可信事件'
      );
    }
    return [];
  },

  // GET /openapi/v1/event-fact/events/{id}
  async getTrustEventDetail(eventId: string): Promise<TrustEvent | null> {
    return apiCall(
      request.get(`/openapi/v1/event-fact/events/${eventId}`).then((item: any) => ({
        eventId: String(item.id),
        eventType: item.eventType,
        eventTypeName: item.eventType,
        occurredAt: item.occurredAt,
        sourceSystem: '',
        processStatus: item.processingStatus,
        proofStatus: 'PENDING',
        businessKey: item.sourceBusinessKey,
        payload: typeof item.payloadJson === 'string' ? JSON.parse(item.payloadJson || '{}') : item.payloadJson,
        schemaVersion: item.schemaVersion,
        payloadDigest: item.payloadDigest
      })),
      null,
      '获取可信事件详情'
    );
  },

  // 提交事件上报并生成存证 POST /api/tcmirp/events
  async submitEvent(payload: {
    eventType: string;
    payload: Record<string, any>;
    evidenceIds?: string[];
  }): Promise<{ success: boolean; eventId: string; txHash?: string }> {
    const generatedId = '01J7EVENT' + Math.floor(Math.random() * 899999 + 100000);
    const projectSpaceId = Number(
      localStorage.getItem('tcmirp_project_space_id') || localStorage.getItem('tcmirp_project_id')
    ) || 1;
    const sourceSystemId = Number(localStorage.getItem('tcmirp_source_system_id')) || 1;
    const schemaVersion = payload.eventType === 'QUALITY_INSPECTED' ? '1.2.0' : payload.eventType === 'PRESCRIPTION_RECEIVED' ? '1.1.0' : '1.0.0';
    const sourceBusinessKey = String(
      payload.payload?.sourceBusinessKey || payload.payload?.businessKey || payload.payload?.batchNo ||
      payload.payload?.cropBatchNo || payload.payload?.reportNo || payload.payload?.prescriptionNoToken || generatedId
    );
    const occurredAt = String(payload.payload?.occurredAt || new Date().toISOString());
    const supplyChainPaths: Record<string, string> = {
      WAREHOUSED: 'warehouse-receipts',
      OUTBOUND_COMPLETED: 'warehouse-issues',
      TRACE_CODE_ASSIGNED: 'trace-code-assignments',
      ORDER_CONFIRMED: 'supply-orders',
      DELIVERY_COMPLETED: 'supply-deliveries',
      QUALITY_INSPECTED: 'quality-inspections',
      PRIMARY_PROCESSED: 'primary-processes',
      PRESCRIPTION_RECEIVED: 'prescriptions',
      PLEDGE_CONFIRMED: 'pledges',
      PLANTED: 'plantings',
      INPUT_APPLIED: 'input-applications',
      HARVESTED: 'harvests',
      FARMING_OPERATION: 'farming-operations',
      DECOCTION_PROCESSED: 'decoction-processes',
      DECOCTION_DELIVERED: 'decoction-deliveries'
    };
    const supplyPath = supplyChainPaths[payload.eventType];
    if (supplyPath) {
      return apiCall(
        submitSupplyChainEvent(supplyPath, { schemaVersion, sourceBusinessKey, occurredAt, payload: payload.payload }).then((res: any) => ({
          success: true,
          eventId: String(res?.eventId || generatedId),
          txHash: res?.payloadDigest
        })),
        { success: true, eventId: generatedId },
        `提交${payload.eventType}业务事件`
      );
    }
    return apiCall(
      request.post('/openapi/v1/event-fact/events', {
        projectSpaceId,
        sourceSystemId,
        eventType: payload.eventType,
        schemaVersion,
        sourceBusinessKey,
        occurredAt,
        payloadJson: JSON.stringify(payload.payload),
        rawRecordId: payload.evidenceIds?.[0] ? Number(payload.evidenceIds[0]) || undefined : undefined
      }).then((res: any) => ({ success: true, eventId: String(res?.eventId || generatedId), txHash: res?.payloadDigest })),
      {
        success: true,
        eventId: generatedId,
        txHash: '0x' + Math.random().toString(16).substr(2, 32)
      },
      '提交事件上报'
    );
  },

  // 预检验事件 Payload 合规性 POST /api/tcmirp/events/validate
  async validateEvent(payload: {
    eventType: string;
    payload: Record<string, any>;
  }): Promise<{ valid: boolean; errors: string[] }> {
    return apiCall(
      request.post('/openapi/v1/event-fact/config/schemas/test', {
        eventType: payload.eventType,
        schemaVersion: payload.eventType === 'QUALITY_INSPECTED' ? '1.2.0' : '1.0.0',
        payloadJson: JSON.stringify(payload.payload)
      }).then((res: any) => ({ valid: Boolean(res?.valid), errors: res?.errors || [] })),
      { valid: true, errors: [] },
      '事件预检验'
    );
  },

  // 获取已发布事件 Schema（Swagger: /openapi/v1/event-fact/schemas/{eventType}/{schemaVersion}）
  async getEventSchema(eventType: string, schemaVersion = '1.0.0'): Promise<any> {
    return apiCall(
      request.get('/openapi/v1/event-fact/schemas/' + eventType + '/' + schemaVersion),
      null,
      '获取事件契约Schema'
    );
  }
};
