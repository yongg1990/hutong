import { request, apiCall } from './client';

export interface ProjectSpaceCreateRequest {
  projectCode: string;
  projectName: string;
  regionCode: string;
  businessScope?: {
    scenarioCodes?: string[];
    regionCodes?: string[];
    partyIds?: number[];
    objectTypes?: string[];
  };
}

export interface ProjectSpaceResponse {
  projectSpaceId: number | string;
  tenantId?: number | string;
  projectCode: string;
  projectName: string;
  regionCode: string;
  businessScope?: any;
  status: 'ACTIVE' | 'ARCHIVED' | string;
  lockVersion?: number;
  createdAt: string;
}

export interface DeploymentInstanceCreateRequest {
  instanceCode: string;
  deploymentMode: 'SAAS' | 'DEDICATED' | 'HYBRID' | 'EDGE_ONLY';
  environment: string;
  regionCode: string;
  capabilities?: Record<string, any>;
}

export interface DeploymentInstanceResponse {
  deploymentInstanceId: number | string;
  tenantId?: number | string;
  instanceCode: string;
  deploymentMode: string;
  environment: string;
  regionCode: string;
  capabilities?: Record<string, any>;
  status: 'ACTIVE' | 'SUSPENDED' | 'OFFLINE' | string;
  version?: string;
  createdAt: string;
}

export interface EdgeNode {
  nodeCode: string;
  name: string;
  ip: string;
  ruleVersion: string;
  lastHeartbeat: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'OFFLINE';
  deploymentMode?: string;
  environment?: string;
  regionCode?: string;
}

const mockEdgeNodes: EdgeNode[] = [
  { nodeCode: 'EDGE-KM-01', name: '昆明中心仓前置代理节点', ip: '192.168.10.45', ruleVersion: '1.4.0', lastHeartbeat: '2026-08-08 15:44:12', status: 'ACTIVE', deploymentMode: 'HYBRID', environment: 'PROD', regionCode: '530100' },
  { nodeCode: 'EDGE-WS-02', name: '文山三七基地数据前置机', ip: '10.8.0.12', ruleVersion: '1.4.0', lastHeartbeat: '2026-08-08 15:43:50', status: 'ACTIVE', deploymentMode: 'EDGE_ONLY', environment: 'PROD', regionCode: '532600' },
  { nodeCode: 'EDGE-YX-03', name: '玉溪代煎中心接入前置', ip: '172.16.2.8', ruleVersion: '1.3.9', lastHeartbeat: '2026-08-08 11:20:00', status: 'SUSPENDED', deploymentMode: 'DEDICATED', environment: 'STAGE', regionCode: '530400' }
];

export interface SubscriptionJob {
  jobId: string;
  name: string;
  sourceSystem: string;
  cronExpr: string;
  lastRunTime: string;
  nextRunTime: string;
  status: 'RUNNING' | 'PAUSED' | 'FAILED';
}

const mockJobs: SubscriptionJob[] = [
  { jobId: 'JOB-SYNC-WMS', name: 'WMS入仓数据定时增量订阅', sourceSystem: 'WMS-KM-01', cronExpr: '0 */5 * * * ?', lastRunTime: '2026-08-08 15:40', nextRunTime: '2026-08-08 15:45', status: 'RUNNING' },
  { jobId: 'JOB-LIMS-PULL', name: 'LIMS质检报告全量拉取与存证', sourceSystem: 'LIMS-KM-02', cronExpr: '0 0 */1 * * ?', lastRunTime: '2026-08-08 15:00', nextRunTime: '2026-08-08 16:00', status: 'RUNNING' },
  { jobId: 'JOB-PROJ-GEN', name: '上海互认数据日结投影打包', sourceSystem: 'TCMIRP-CORE', cronExpr: '0 0 23 * * ?', lastRunTime: '2026-08-07 23:00', nextRunTime: '2026-08-08 23:00', status: 'RUNNING' }
];

export interface AuditAlert {
  alertId: string;
  type: string;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  content: string;
  occurredAt: string;
  isResolved: boolean;
}

const mockAlerts: AuditAlert[] = [
  { alertId: 'ALT-202608-01', type: 'SCHEMA_VIOLATION', level: 'HIGH', content: 'WMS传入无效单位代码 "公斤"，触发字段映射熔断', occurredAt: '15:42', isResolved: false },
  { alertId: 'ALT-202608-02', type: 'NODE_HEARTBEAT_TIMEOUT', level: 'MEDIUM', content: 'EDGE-YX-03 前置节点心跳超时超过 15 分钟', occurredAt: '15:20', isResolved: false },
  { alertId: 'ALT-202608-03', type: 'PROOF_CONSENSUS_DELAY', level: 'LOW', content: '长安链存证共识延时达 3.8s，高于预警阈值 2s', occurredAt: '14:50', isResolved: true }
];

const mockProjectSpaces: ProjectSpaceResponse[] = [
  {
    projectSpaceId: 1,
    tenantId: 1,
    projectCode: 'PRJ-YN-TCM-2026',
    projectName: '云南中药全产业链追溯示范项目',
    regionCode: '530000',
    businessScope: {
      scenarioCodes: ['FIELD', 'PROCESS', 'QUALITY', 'SUPPLY'],
      regionCodes: ['530000', '532600'],
      partyIds: [1, 2, 3],
      objectTypes: ['CROP_BATCH', 'PROCESS_BATCH', 'HERB_PACKAGE']
    },
    status: 'ACTIVE',
    lockVersion: 1,
    createdAt: '2026-01-10 08:30:00'
  },
  {
    projectSpaceId: 2,
    tenantId: 2,
    projectCode: 'PRJ-WS-SANQI-01',
    projectName: '文山三七专线合规追溯项目',
    regionCode: '532600',
    businessScope: {
      scenarioCodes: ['FIELD', 'PROCESS'],
      regionCodes: ['532600'],
      partyIds: [2],
      objectTypes: ['CROP_BATCH', 'PROCESS_BATCH']
    },
    status: 'ACTIVE',
    lockVersion: 1,
    createdAt: '2026-02-15 10:00:00'
  }
];

/**
 * 设置与运维管理接口 (Swagger: /admin/v1/*, /settings/*, /operations/*)
 */
export const settingsApi = {
  // ================= 1. 项目空间 (POST /admin/v1/project-spaces, GET /admin/v1/project-spaces/{id}) =================
  async getProjectSpaces(): Promise<ProjectSpaceResponse[]> {
    return apiCall(
      request.get('/admin/v1/project-spaces').then((res: any) => {
        if (Array.isArray(res)) return res;
        return mockProjectSpaces;
      }),
      mockProjectSpaces,
      '获取项目空间列表'
    );
  },

  async createProjectSpace(data: ProjectSpaceCreateRequest): Promise<ProjectSpaceResponse> {
    const newPrj: ProjectSpaceResponse = {
      projectSpaceId: Date.now(),
      tenantId: 1,
      projectCode: data.projectCode,
      projectName: data.projectName,
      regionCode: data.regionCode,
      businessScope: data.businessScope || {},
      status: 'ACTIVE',
      lockVersion: 1,
      createdAt: new Date().toLocaleString()
    };

    return apiCall(
      request.post('/admin/v1/project-spaces', data),
      newPrj,
      '创建项目空间'
    );
  },

  async getProjectSpaceById(id: number | string): Promise<ProjectSpaceResponse> {
    const fallback = mockProjectSpaces.find(p => String(p.projectSpaceId) === String(id)) || mockProjectSpaces[0];
    return apiCall(
      request.get(`/admin/v1/project-spaces/${id}`),
      fallback,
      '获取项目空间详情'
    );
  },

  // ================= 2. 部署实例 (POST /admin/v1/deployment-instances, GET /admin/v1/deployment-instances/{id}) =================
  async createDeploymentInstance(data: DeploymentInstanceCreateRequest): Promise<DeploymentInstanceResponse> {
    const newInst: DeploymentInstanceResponse = {
      deploymentInstanceId: Date.now(),
      tenantId: 1,
      instanceCode: data.instanceCode,
      deploymentMode: data.deploymentMode,
      environment: data.environment,
      regionCode: data.regionCode,
      capabilities: data.capabilities || {},
      status: 'ACTIVE',
      version: '1.4.0',
      createdAt: new Date().toLocaleString()
    };

    return apiCall(
      request.post('/admin/v1/deployment-instances', data),
      newInst,
      '创建部署实例'
    );
  },

  async getDeploymentInstanceById(id: number | string): Promise<DeploymentInstanceResponse> {
    const fallback: DeploymentInstanceResponse = {
      deploymentInstanceId: id,
      tenantId: 1,
      instanceCode: 'INST-KM-01',
      deploymentMode: 'HYBRID',
      environment: 'PROD',
      regionCode: '530100',
      capabilities: {
        offlineCache: true,
        edgeRuleValidation: true,
        cryptoKeyStorage: 'HSM'
      },
      status: 'ACTIVE',
      version: '1.4.0',
      createdAt: '2026-01-15 12:00:00'
    };

    return apiCall(
      request.get(`/admin/v1/deployment-instances/${id}`),
      fallback,
      '获取部署实例详情'
    );
  },

  // ================= 3. 租户项目当前空间与节点 =================
  async getTenantProject(): Promise<any> {
    return apiCall(
      request.get('/settings/tenant-project'),
      {
        tenantId: 'TENANT-YN-DEMO',
        tenantName: '云南示范项目',
        projectId: 'PRJ-YN-TCM-2026',
        projectName: '云南中药全产业链追溯示范项目',
        appId: 'TCMIRP-WEB-CONSOLE',
        mode: 'PROD',
        swaggerUrl: 'http://192.168.1.39:8900/api/tcmirp/swagger-ui/index.html#/'
      },
      '获取租户空间配置'
    );
  },

  // 获取前置边缘节点列表 GET /api/tcmirp/settings/deployments
  async getEdgeNodes(): Promise<EdgeNode[]> {
    return apiCall(
      request.get('/settings/deployments'),
      mockEdgeNodes,
      '获取前置边缘节点'
    );
  },

  async getEdgeDeployments(): Promise<EdgeNode[]> {
    return this.getEdgeNodes();
  },

  // 广播/推送最新 Schema 规则包 POST /api/tcmirp/settings/deployments/broadcast-rules
  async broadcastRules(): Promise<{ success: boolean; pushedCount: number }> {
    return apiCall(
      request.post('/settings/deployments/broadcast-rules'),
      { success: true, pushedCount: mockEdgeNodes.length },
      '推送Schema规则包'
    );
  },

  async pushRulePackage(version?: string): Promise<{ success: boolean; pushedCount: number }> {
    return apiCall(
      request.post('/settings/deployments/broadcast-rules', { version }),
      { success: true, pushedCount: mockEdgeNodes.length },
      '推送Schema规则包'
    );
  },

  // 同步指定前置节点 POST /api/tcmirp/settings/deployments/{nodeCode}/sync
  async syncNode(nodeCode: string): Promise<{ success: boolean; nodeCode: string }> {
    return apiCall(
      request.post(`/settings/deployments/${nodeCode}/sync`),
      { success: true, nodeCode },
      '同步前置节点'
    );
  },

  // 获取异步作业与订阅列表 GET /api/tcmirp/operations/jobs
  async getJobs(): Promise<SubscriptionJob[]> {
    return apiCall(
      request.get('/operations/jobs'),
      mockJobs,
      '获取订阅作业列表'
    );
  },

  // 手动触发作业 POST /api/tcmirp/operations/jobs/{jobId}/trigger
  async triggerJob(jobId: string): Promise<{ success: boolean; jobId: string }> {
    return apiCall(
      request.post(`/operations/jobs/${jobId}/trigger`),
      { success: true, jobId },
      '触发作业'
    );
  },

  // 获取审计告警日志 GET /api/tcmirp/operations/audit-alerts
  async getAlerts(): Promise<AuditAlert[]> {
    return apiCall(
      request.get('/operations/audit-alerts'),
      mockAlerts,
      '获取审计告警日志'
    );
  }
};
