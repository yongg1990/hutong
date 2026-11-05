import { defineStore } from 'pinia';
import type { ContextState } from '@/types';

const storedId = (key: string) => {
  const value = localStorage.getItem(key) || '';
  return /^\d+$/.test(value) ? value : '';
};

export const useContextStore = defineStore('context', {
  state: (): ContextState => ({
    tenantId: storedId('tcmirp_tenant_id'),
    tenantName: localStorage.getItem('tcmirp_tenant_name') || '',
    projectId: storedId('tcmirp_project_space_id') || storedId('tcmirp_project_id'),
    projectName: localStorage.getItem('tcmirp_project_name') || '',
    appId: 'TCMIRP-WEB-CONSOLE',
    purposeCode: 'BUSINESS_OPERATION',
    userName: '',
    userRole: '',
    deploymentCapabilities: ['STANDALONE', 'EDGE_NODE', 'BLOCKCHAIN_PROOFS', 'EXCHANGE_PROJECTION']
  }),
  actions: {
    switchProject(projId: string, projName: string) {
      this.projectId = projId;
      this.projectName = projName;
      localStorage.setItem('tcmirp_project_id', projId);
      localStorage.setItem('tcmirp_project_space_id', projId);
      localStorage.setItem('tcmirp_project_name', projName);
    },
    setProject(projId: string, projName: string) {
      this.switchProject(projId, projName);
    },
    setTenant(tenantId: string, tenantName: string) {
      this.tenantId = tenantId;
      this.tenantName = tenantName;
      localStorage.setItem('tcmirp_tenant_id', tenantId);
      localStorage.setItem('tcmirp_tenant_name', tenantName);
    }
  }
});
