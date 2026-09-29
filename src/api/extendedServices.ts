import { request } from './client';

export interface UploadSessionRequest {
  fileName: string;
  contentType: string;
  sizeBytes?: string;
  contentDigest?: string;
  businessPurpose: string;
  storageScope: string;
  relatedObjectType?: string;
  relatedObjectId?: string;
  securityClass?: string;
}

export interface UploadSession {
  [key: string]: unknown;
  uploadSessionId: string;
  fileId: string;
  uploadStatus: string;
  uploadUrl?: string;
  expiresAt?: string;
  bytesReceived?: string;
  checksumStatus?: string;
  lastError?: string;
  parts?: unknown[];
}

export interface CredentialRequest {
  credentialType: string;
  issuerPartyId: string;
  subjectPartyId: string;
  credentialNoHash: string;
  validFrom?: string;
  validTo?: string;
  attributes?: unknown;
}

export interface SubscriptionRequest {
  subscriptionCode: string;
  version: string;
  callbackUrl: string;
  httpMethod: 'POST';
  eventFilterJson: Record<string, unknown>;
  signatureRequired: boolean;
  signatureAlgorithm?: string;
  timeoutSeconds?: number;
  maxRetryCount?: number;
  retryBackoffSeconds: number[];
  status: string;
}

export const extendedServices = {
  createUploadSession: (data: UploadSessionRequest): Promise<UploadSession> => request.post('/openapi/v1/files/upload-sessions', data),
  getUploadSession: (id: string, includeParts = true): Promise<UploadSession> => request.get(`/openapi/v1/files/upload-sessions/${encodeURIComponent(id)}`, { params: { includeParts } }),
  completeUpload: (id: string, objectVersion: string): Promise<Record<string, unknown>> => request.post(`/openapi/v1/files/upload-sessions/${encodeURIComponent(id)}/complete`, { objectVersion }),
  getFile: (id: string): Promise<Record<string, unknown>> => request.get(`/openapi/v1/files/${encodeURIComponent(id)}`),
  createCredential: (data: CredentialRequest): Promise<Record<string, unknown>> => request.post('/openapi/v1/credentials', data),
  getCredential: (id: string): Promise<Record<string, unknown>> => request.get(`/openapi/v1/credentials/${encodeURIComponent(id)}`),
  createSubscription: (data: SubscriptionRequest): Promise<Record<string, unknown>> => request.post('/admin/v1/subscriptions', data),
  getDelivery: (id: string, includeAttempts = true): Promise<Record<string, unknown>> => request.get(`/openapi/v1/callback-deliveries/${encodeURIComponent(id)}`, { params: { includeAttempts } }),
  replayDelivery: (id: string, reason: string, lockVersion: number): Promise<Record<string, unknown>> => request.post(`/openapi/v1/callback-deliveries/${encodeURIComponent(id)}/replay`, { reason, lockVersion }),
  actOnAlert: (id: string, action: 'ACK' | 'CLOSE', lockVersion: number, resolutionNote?: string): Promise<Record<string, unknown>> => request.post(`/openapi/v1/alerts/${encodeURIComponent(id)}/actions`, { action, lockVersion, resolutionNote }),
  createProof: (data: { projectSpaceId: string; proofPolicyId: string; subjectType: string; subjectId: string; targets: unknown[] }): Promise<Record<string, unknown>> => request.post('/openapi/v1/proofs', data),
  processProof: (id: string): Promise<Record<string, unknown>> => request.post(`/openapi/v1/proofs/${encodeURIComponent(id)}/process`),
  retryProof: (id: string): Promise<Record<string, unknown>> => request.post(`/openapi/v1/proofs/${encodeURIComponent(id)}/retry`),
  reconcileProof: (id: string): Promise<Record<string, unknown>> => request.post(`/openapi/v1/proofs/${encodeURIComponent(id)}/reconcile`),
  processProjection: (projectId: string, id: string): Promise<Record<string, unknown>> => request.post(`/exchange-query/projects/${encodeURIComponent(projectId)}/projections/${encodeURIComponent(id)}/process`)
};
