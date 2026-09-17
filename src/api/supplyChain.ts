import { request } from './client';

export interface SupplyChainEventPayload {
  schemaVersion?: string;
  sourceBusinessKey: string;
  occurredAt?: string;
  payload: Record<string, any>;
}

export interface SupplyChainEventResponse {
  eventId: number | string;
  eventType: string;
  schemaVersion: string;
  status: string;
  payloadDigest: string;
  occurredAt: string;
}

export function submitSupplyChainEvent(
  endpoint: string,
  data: SupplyChainEventPayload
): Promise<SupplyChainEventResponse> {
  return request.post(`/supply-chain/${endpoint}`, {
    schemaVersion: data.schemaVersion || '1.0.0',
    sourceBusinessKey: data.sourceBusinessKey,
    occurredAt: data.occurredAt || new Date().toISOString(),
    payload: data.payload
  }, {
    headers: { 'X-Idempotency-Key': data.sourceBusinessKey }
  }).then((response: any) => response as SupplyChainEventResponse);
}
