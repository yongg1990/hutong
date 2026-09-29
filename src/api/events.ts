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
  fields: EventSchemaField[];
  referenceRules: EventSchemaReferenceRule[];
}

export interface SchemaSnapshot {
  id: string;
  eventType: string;
  schemaVersion: string;
  schemaJson: string;
  fields: EventSchemaField[];
  referenceRules: EventSchemaReferenceRule[];
  lockVersion: number;
  status: 'DRAFT' | 'PUBLISHED' | string;
  contentDigest?: string;
}

export interface SchemaTestResult {
  valid: boolean;
  errors: string[];
}
export interface EventSchemaField {
  id?: string; fieldName: string; displayName: string; dataType: string; required: boolean;
  dataElementCode?: string; valueSetCode?: string; valueSetVersion?: string;
}
export interface EventSchemaReferenceRule {
  id?: string; fieldName: string; targetType: string; namespace: string; required: boolean;
  onNotFound: string; onAmbiguous: string;
}
function snapshot(item: any): SchemaSnapshot {
  const fields: EventSchemaField[] = item.fields || [];
  const typeMap: Record<string, string> = { STRING: 'string', DATE: 'string', DATETIME: 'string', INTEGER: 'integer', DECIMAL: 'number', BOOLEAN: 'boolean', OBJECT: 'object', ARRAY: 'array' };
  const properties = Object.fromEntries(fields.map(field => [field.fieldName, { type: typeMap[field.dataType] || 'string', title: field.displayName }]));
  return { ...item, fields, referenceRules: item.referenceRules || [], schemaJson: JSON.stringify({ type: 'object', properties, required: fields.filter(field => field.required).map(field => field.fieldName) }) };
}

/**
 * 可信事件上报与查询接口
 */
export const eventsApi = {
  async createEventType(data: EventTypeRequest): Promise<EventTypeResponse> {
    return request.post<EventTypeResponse, EventTypeResponse>('/openapi/v1/event-fact/event-types', { ...data, description: data.description || '' });
  },

  async createSchemaDraft(data: EventSchemaRequest): Promise<SchemaSnapshot> {
    const result = await request.post<any, any>('/openapi/v1/event-fact/schemas/definitions', data);
    return snapshot(result);
  },

  async testSchemaDraft(data: EventSchemaRequest): Promise<SchemaTestResult> {
    return request.post('/openapi/v1/event-fact/schemas/test', data);
  },

  async publishEventSchema(id: string): Promise<SchemaSnapshot> {
    return snapshot(await request.post(`/openapi/v1/event-fact/schemas/definitions/${encodeURIComponent(id)}/publish`));
  },
  async listSchemaDefinitions(params: Record<string, string | number> = {}): Promise<{ records: SchemaSnapshot[]; total: string }> {
    const page: any = await request.get('/openapi/v1/event-fact/schemas/definitions', { params });
    return { ...page, records: (page.records || []).map(snapshot) };
  },
  async getSchemaDefinition(id: string): Promise<SchemaSnapshot> {
    return snapshot(await request.get(`/openapi/v1/event-fact/schemas/definitions/${encodeURIComponent(id)}`));
  },
  async testSchemaDefinition(id: string): Promise<SchemaTestResult> {
    return request.post(`/openapi/v1/event-fact/schemas/definitions/${encodeURIComponent(id)}/test`);
  },
  async listEventTypes(params: Record<string, string | number> = {}): Promise<{ records: any[]; total: string }> {
    return request.get('/openapi/v1/event-fact/event-types', { params });
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
    throw new Error('当前接口仅支持 Schema 配置测试，不支持 Payload 预检');
  },

  // 获取已发布事件 Schema（Swagger: /openapi/v1/event-fact/schemas/{eventType}/{schemaVersion}）
  async getEventSchema(eventType: string, schemaVersion = '1.0.0'): Promise<SchemaSnapshot> {
    const page = await this.listSchemaDefinitions({ eventType, schemaVersion, status: 'PUBLISHED', page: 1, size: 1 });
    if (!page.records.length) throw new Error('未找到已发布 Schema');
    return this.getSchemaDefinition(page.records[0].id);
  }
};
