import { defineStore } from 'pinia';
import type { ContextState } from '@/types';

export const useContextStore = defineStore('context', {
  state: (): ContextState => ({
    tenantId: 'TENANT-YN-DEMO',
    tenantName: '云南中药全产业链示范租户',
    projectId: 'PRJ-YN-TCM-2026',
    projectName: '云南中药全产业链追溯示范项目',
    appId: 'TCMIRP-WEB-CONSOLE',
    purposeCode: 'BUSINESS_OPERATION',
    userName: '张主管',
    userRole: '质量合规审计员',
    deploymentCapabilities: ['STANDALONE', 'EDGE_NODE', 'BLOCKCHAIN_PROOFS', 'EXCHANGE_PROJECTION']
  }),
  actions: {
    switchProject(projId: string, projName: string) {
      this.projectId = projId;
      this.projectName = projName;
      localStorage.setItem('tcmirp_project_id', projId);
    },
    setProject(projId: string, projName: string) {
      this.switchProject(projId, projName);
    },
    setTenant(tenantId: string, tenantName: string) {
      this.tenantId = tenantId;
      this.tenantName = tenantName;
      localStorage.setItem('tcmirp_tenant_id', tenantId);
    }
  }
});
