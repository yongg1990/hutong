import { request } from './client';
import type { EventSchemaField, EventSchemaReferenceRule } from './events';
import type { SourceSystemManagement } from './governance';

export interface PageResult<T> { records: T[]; total: string; page: string; size: string }
export interface SourceSystemKey {
  id: string; tenantId: string; sourceSystemId: string;
  keyAlgorithm: 'RSA' | 'SM2'; dataAlgorithm: 'SM4' | 'AES';
  publicKey: string; clientPublicKey: string; status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string; updatedAt?: string;
}
export interface KeyCreateRequest {
  keyAlgorithm: 'RSA' | 'SM2'; dataAlgorithm: 'SM4' | 'AES'; clientPublicKey: string;
}
export interface EventAuthorization {
  tenantId: string; projectSpaceId: string; projectStatus: string;
  eventType: string; eventName: string; eventTypeStatus: string;
  authorized: boolean; authorizationStatus?: 'ACTIVE' | 'INACTIVE';
  validFrom?: string; validTo?: string; lockVersion?: number;
}
export interface AuthorizationItem { eventType: string; validFrom?: string; validTo?: string }
export interface IntegrationSelection {
  tenantId: string; projectSpaceId: string; sourceSystemId: string;
  sourceSystemKeyId: string; eventType: string; schemaVersion: string;
}
export interface IntegrationIssue { path?: string; code?: string; message?: string }
export interface IntegrationValidation {
  valid: boolean; errors: IntegrationIssue[]; requiredInputs: IntegrationIssue[]; scope?: string;
}
export interface IntegrationSchema {
  id: string; eventType: string; schemaVersion: string; status: string; contentDigest?: string;
  fields: EventSchemaField[]; referenceRules: EventSchemaReferenceRule[];
}
export interface IntegrationExample {
  endpoint: string; method: string; plaintextRequest: Record<string, unknown>;
  sdkConfig: Record<string, unknown>; fields: EventSchemaField[];
  referenceRules: EventSchemaReferenceRule[]; schemaDigest: string;
  validation: IntegrationValidation;
}
export interface TenantOption { tenantId: string; tenantName: string; tenantCode: string }
export interface ProjectOption { projectSpaceId: string; projectName: string; projectCode: string; status: string }
export type OptionQuery = Record<string, string | number | undefined>;
const assistant = '/ingestion-governance/integration-assistant';
const keyPath = (id: string) => `/ingestion-governance/source-systems/${encodeURIComponent(id)}/keys`;
const authorizationPath = (tenantId: string, projectSpaceId: string) =>
  `/openapi/v1/event-fact/event-type-authorizations/tenants/${encodeURIComponent(tenantId)}/project-spaces/${encodeURIComponent(projectSpaceId)}/event-types`;

export const sourceKeysApi = {
  list(sourceSystemId: string): Promise<SourceSystemKey[]> { return request.get(keyPath(sourceSystemId)); },
  create(sourceSystemId: string, data: KeyCreateRequest): Promise<{ key: SourceSystemKey }> {
    return request.post(keyPath(sourceSystemId), data);
  },
  createForTenant(tenantId: string, sourceSystemId: string, data: KeyCreateRequest): Promise<{ key: SourceSystemKey }> {
    return request.post(`/ingestion-governance/admin/tenants/${encodeURIComponent(tenantId)}/source-systems/${encodeURIComponent(sourceSystemId)}/keys`, data);
  },
  changeStatus(sourceSystemId: string, keyId: string, status: SourceSystemKey['status']): Promise<SourceSystemKey> {
    return request.post(`${keyPath(sourceSystemId)}/${encodeURIComponent(keyId)}/status`, { status });
  }
};
export const eventAuthorizationsApi = {
  list(tenantId: string, projectSpaceId: string): Promise<EventAuthorization[]> {
    return request.get(authorizationPath(tenantId, projectSpaceId));
  },
  save(tenantId: string, projectSpaceId: string, eventTypes: AuthorizationItem[]): Promise<EventAuthorization[]> {
    return request.post(authorizationPath(tenantId, projectSpaceId), { eventTypes });
  }
};
export const integrationApi = {
  tenants(params: OptionQuery): Promise<PageResult<TenantOption>> { return request.get(`${assistant}/tenants`, { params }); },
  projects(params: OptionQuery): Promise<PageResult<ProjectOption>> { return request.get(`${assistant}/project-spaces`, { params }); },
  sources(params: OptionQuery): Promise<PageResult<SourceSystemManagement>> { return request.get(`${assistant}/source-systems`, { params }); },
  keys(params: OptionQuery): Promise<PageResult<SourceSystemKey>> { return request.get(`${assistant}/source-system-keys`, { params }); },
  events(params: OptionQuery): Promise<PageResult<EventAuthorization>> { return request.get(`${assistant}/event-types`, { params }); },
  schemas(params: OptionQuery): Promise<PageResult<IntegrationSchema>> { return request.get(`${assistant}/schemas`, { params }); },
  example(data: IntegrationSelection & { sampleEventJson?: string; idempotencyKey?: string }): Promise<IntegrationExample> {
    return request.post(`${assistant}/request-examples`, data);
  },
  validate(plaintextRequest: string): Promise<IntegrationValidation> {
    return request.post(`${assistant}/validate`, { plaintextRequest });
  }
};
