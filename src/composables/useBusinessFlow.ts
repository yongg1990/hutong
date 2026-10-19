import { useRoute, useRouter } from 'vue-router';
import { findBatch } from '@/stores/demoStore';

export function useBusinessFlow(currentBatch: () => string | undefined, currentPrescription?: () => string | undefined) {
  const route = useRoute(), router = useRouter();
  const incomingBatch = () => String(route.query.batchNo || route.query.sourceBatchNo || '');
  const openEvent = (eventType: string, batchNo?: string) => router.push({ path: `/business/events/new/${eventType}`, query: { batchNo: batchNo || currentBatch() || incomingBatch() || findBatch(), ...(currentPrescription?.() ? { prescriptionId: currentPrescription() } : {}) } });
  return { route, incomingBatch, openEvent };
}
