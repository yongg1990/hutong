import { request } from './client';
import type { TrustEvent } from '@/types';
import { submitSupplyChainEvent } from './supplyChain';

export interface EventTypeRequest {
  eventType: string;
  eventName: string;
  scenarioCode: string;
  description?: string;
}

export interface EventTypeResponse {
  id: string;
  eventType: string;
  status: string;
}

export interface EventSchemaRequest {
  eventType: string;
  schemaVersion: string;
  schemaJson: string;
  referenceRulesJson?: string;
  valueSetRefsJson?: string;
}

export interface SchemaSnapshot {
  eventType: string;
  schemaVersion: string;
  schemaJson: string;
  status: 'DRAFT' | 'PUBLISHED' | string;
  contentDigest?: string;
}

export interface SchemaTestResult {
  valid: boolean;
  errors: string[];
}

/**
 * 可信事件上报与查询接口
 */
export const eventsApi = {
  async createEventType(data: EventTypeRequest): Promise<EventTypeResponse> {
    return request.post<EventTypeResponse, EventTypeResponse>('/openapi/v1/event-fact/config/event-types', data);
  },

  async createSchemaDraft(data: EventSchemaRequest): Promise<SchemaSnapshot> {
    return request.post<SchemaSnapshot, SchemaSnapshot>('/openapi/v1/event-fact/config/schemas', data);
  },

  async testEventSchema(eventType: string, schemaVersion: string, payloadJson: string): Promise<SchemaTestResult> {
    return request.post<SchemaTestResult, SchemaTestResult>('/openapi/v1/event-fact/config/schemas/test', {
      eventType,
      schemaVersion,
      payloadJson
    });
  },

  async publishEventSchema(eventType: string, schemaVersion: string): Promise<SchemaSnapshot> {
    return request.post<SchemaSnapshot, SchemaSnapshot>(
      `/openapi/v1/event-fact/config/schemas/${encodeURIComponent(eventType)}/${encodeURIComponent(schemaVersion)}/publish`
    );
  },
  // 当前文档仅支持按事件 ID 查询。
  async queryTrustEvents(params?: {
    eventId?: string | number;
    businessKey?: string;
    eventType?: string;
    processStatus?: string;
    proofStatus?: string;
  }): Promise<TrustEvent[]> {
    if (params?.eventId) {
      return request.get(`/openapi/v1/event-fact/events/${params.eventId}`).then((item: any) => [{
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
        }]);
    }
    return [];
  },

  // GET /openapi/v1/event-fact/events/{id}
  async getTrustEventDetail(eventId: string): Promise<TrustEvent | null> {
    return request.get(`/openapi/v1/event-fact/events/${eventId}`).then((item: any) => ({
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
      }));
  },

  // 提交事件上报并生成存证 POST /api/tcmirp/events
  async submitEvent(payload: {
    eventType: string; payload: Record<string, any>; schemaVersion?: string; sourceBusinessKey?: string; occurredAt?: string; rawRecordId?: string; useFactEngine?: boolean;
  }): Promise<{ success: boolean; eventId: string; payloadDigest?: string; status?: string }> {
    const projectSpaceId = localStorage.getItem('tcmirp_project_space_id') || localStorage.getItem('tcmirp_project_id') || '1';
    const sourceSystemId = localStorage.getItem('tcmirp_source_system_id') || '1';
    const schemaVersion = payload.schemaVersion || '1.0.0';
    const sourceBusinessKey = String(payload.sourceBusinessKey || payload.payload?.sourceBusinessKey || payload.payload?.businessKey || '');
    if (!sourceBusinessKey.trim()) throw new Error('请填写本次动作唯一的来源业务键');
    const occurredAt = payload.occurredAt || new Date().toISOString().slice(0,19).replace('T',' ');
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
    const supplyPath = payload.useFactEngine ? undefined : supplyChainPaths[payload.eventType];
    const res: any = supplyPath
      ? await submitSupplyChainEvent(supplyPath, { schemaVersion, sourceBusinessKey, occurredAt, payload: payload.payload })
      : await request.post('/openapi/v1/event-fact/events', { projectSpaceId, sourceSystemId, eventType:payload.eventType, schemaVersion, sourceBusinessKey, occurredAt, payloadJson:JSON.stringify(payload.payload),rawRecordId:payload.rawRecordId||undefined },{headers:{'X-Idempotency-Key':sourceBusinessKey}});
    if (!res?.eventId && !res?.id) throw new Error('接口未返回事件 ID');
    return { success:true,eventId:String(res.eventId||res.id),payloadDigest:res.payloadDigest,status:res.status||res.processingStatus };
  },

  // 预检验事件 Payload 合规性 POST /api/tcmirp/events/validate
  async validateEvent(payload: {
    eventType: string;
    payload: Record<string, any>;
  }): Promise<{ valid: boolean; errors: string[] }> {
    return this.testEventSchema(payload.eventType,'1.0.0',JSON.stringify(payload.payload));
  },

  // 获取已发布事件 Schema（Swagger: /openapi/v1/event-fact/schemas/{eventType}/{schemaVersion}）
  async getEventSchema(eventType: string, schemaVersion = '1.0.0'): Promise<SchemaSnapshot> {
    return request.get<SchemaSnapshot, SchemaSnapshot>(
      `/openapi/v1/event-fact/schemas/${encodeURIComponent(eventType)}/${encodeURIComponent(schemaVersion)}`
    );
  }
};
