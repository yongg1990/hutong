import { defineStore } from 'pinia';
import type { ContextState } from '@/types';
import { isStaticMode } from './demoStore';

const staticMode = isStaticMode();

export const useContextStore = defineStore('context', {
  state: (): ContextState => ({
    tenantId: 'TENANT-YN-DEMO',
    tenantName: '云南中药全产业链示范租户',
    projectId: staticMode ? '1' : 'PRJ-YN-TCM-2026',
    projectName: staticMode ? '中药互认协同空间' : '云南中药全产业链追溯示范项目',
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
      localStorage.setItem('tcmirp_project_space_id', projId);
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
