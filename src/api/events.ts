import { request, apiCall } from './client';
import { mockTrustEvents } from './mockData';
import type { TrustEvent } from '@/types';

/**
 * 可信事件上报与查询接口 (Swagger: /api/tcmirp/events/* & /api/tcmirp/trust/events/*)
 */
export const eventsApi = {
  // 查询可信事件列表 GET /api/tcmirp/trust/events
  async queryTrustEvents(params?: {
    businessKey?: string;
    eventType?: string;
    processStatus?: string;
    proofStatus?: string;
  }): Promise<TrustEvent[]> {
    return apiCall(
      request.get('/trust/events', { params }),
      mockTrustEvents.filter(e => {
        if (params?.eventType && e.eventType !== params.eventType) return false;
        if (params?.processStatus && e.processStatus !== params.processStatus) return false;
        if (params?.proofStatus && e.proofStatus !== params.proofStatus) return false;
        if (params?.businessKey) {
          const kw = params.businessKey.toLowerCase();
          return (e.businessKey || '').toLowerCase().includes(kw) ||
            (e.eventId || '').toLowerCase().includes(kw) ||
            (e.eventTypeName || '').toLowerCase().includes(kw);
        }
        return true;
      }),
      '查询可信事件列表'
    );
  },

  // 获取单个事件详情 (含敏感脱敏字段与存证凭据) GET /api/tcmirp/trust/events/{eventId}
  async getTrustEventDetail(eventId: string): Promise<TrustEvent | null> {
    return apiCall(
      request.get(`/trust/events/${eventId}`),
      mockTrustEvents.find(e => e.eventId === eventId) || mockTrustEvents[0],
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
    const projectSpaceId = Number(localStorage.getItem('tcmirp_project_id')) || 1;
    const sourceSystemId = Number(localStorage.getItem('tcmirp_source_system_id')) || 1;
    const schemaVersion = payload.eventType === 'QUALITY_INSPECTED' ? '1.2.0' : payload.eventType === 'PRESCRIPTION_RECEIVED' ? '1.1.0' : '1.0.0';
    return apiCall(
      request.post('/openapi/v1/event-fact/events', {
        projectSpaceId,
        sourceSystemId,
        eventType: payload.eventType,
        schemaVersion,
        sourceBusinessKey: String(payload.payload?.businessKey || payload.payload?.batchNo || generatedId),
        occurredAt: String(payload.payload?.occurredAt || new Date().toISOString().slice(0, 19).replace('T', ' ')),
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
