import { defineStore } from 'pinia';
import type { UserSession } from '@/types';

export const useSessionStore = defineStore('session', {
  state: (): UserSession => ({
    userId: 'USR-20260808-01',
    displayName: '徐敏（业务主理官）',
    roleName: '质量兼审计主理',
    permissionCodes: [
      'FIELD_EVENT_WRITE',
      'PROCESS_EVENT_WRITE',
      'QUALITY_EVENT_WRITE',
      'CODING_EVENT_WRITE',
      'SUPPLY_EVENT_WRITE',
      'PLEDGE_EVENT_WRITE',
      'PRESCRIPTION_EVENT_WRITE',
      'DECOCTION_EVENT_WRITE',
      'EVENT_READ',
      'SOURCE_SYSTEM_REGISTER',
      'BATCH_INGEST',
      'MAPPING_MANAGE',
      'MAPPING_PRECHECK',
      'GOVERNANCE_CASE_HANDLE',
      'DATA_ELEMENT_MANAGE',
      'VALUE_SET_MANAGE',
      'EVENT_CONFIG_MANAGE',
      'CONFIG_TEST',
      'CONFIG_PUBLISH',
      'PARTY_READ',
      'PARTY_WRITE',
      'OBJECT_READ',
      'OBJECT_WRITE',
      'PIECE_MASTER_WRITE',
      'TRACE_CODE_WRITE',
      'LINEAGE_READ',
      'EVIDENCE_READ',
      'FILE_READ',
      'PROOF_STATUS_READ',
      'PROOF_VERIFY',
      'EXCHANGE_PROFILE_READ',
      'EXCHANGE_PROFILE_MANAGE',
      'EXCHANGE_PROJECT',
      'OUTPUT_READ',
      'DEPLOYMENT_MANAGE',
      'EDGE_DIAGNOSE',
      'SUBSCRIPTION_MANAGE',
      'JOB_READ',
      'AUDIT_READ',
      'ALERT_HANDLE'
    ],
    dataScope: 'ALL_PROJECTS',
    tokenExpiry: '2026-08-08 23:59:59'
  }),
  getters: {
    hasPermission: (state) => (perm: string) => {
      if (!perm) return true;
      return Array.isArray(state.permissionCodes) && state.permissionCodes.includes(perm);
    },
    hasAnyPermission: (state) => (perms: string[]) => {
      if (!perms || perms.length === 0) return true;
      return Array.isArray(state.permissionCodes) && perms.some((p) => state.permissionCodes.includes(p));
    }
  }
});
