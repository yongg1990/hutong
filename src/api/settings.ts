import { request, apiCall } from './client';

export interface BusinessScope {
  scenarioCodes: string[];
  regionCodes: string[];
  partyIds: string[];
  objectTypes: string[];
}

export interface ProjectSpaceCreateRequest {
  projectCode: string;
  projectName: string;
  regionCode: string;
  businessScope: BusinessScope;
}

export interface ProjectSpaceResponse {
  projectSpaceId: string;
  tenantId?: string;
  projectCode: string;
  projectName: string;
  regionCode: string;
  businessScope?: BusinessScope;
  status: 'ACTIVE' | 'INACTIVE' | string;
  lockVersion?: number;
  createdAt: string;
}

export interface DeploymentInstanceCreateRequest {
  instanceCode: string;
  deploymentMode: 'SAAS' | 'DEDICATED' | 'HYBRID' | 'EDGE_ONLY';
  environment: string;
  regionCode: string;
  capabilities: Record<string, unknown>;
}

export interface DeploymentInstanceResponse {
  deploymentInstanceId: string;
  tenantId?: string;
  instanceCode: string;
  deploymentMode: string;
  environment: string;
  regionCode: string;
  capabilities?: Record<string, unknown>;
  status: 'ACTIVE' | 'INACTIVE' | string;
  version?: string;
  createdAt: string;
}

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

/**
 * 设置与运维管理接口 (Swagger: /admin/v1/*, /settings/*, /operations/*)
 */
export const settingsApi = {
  // ================= 1. 项目空间 (POST /admin/v1/project-spaces, GET /admin/v1/project-spaces/{id}) =================
  async createProjectSpace(data: ProjectSpaceCreateRequest): Promise<ProjectSpaceResponse> {
    return request.post('/admin/v1/project-spaces', data) as unknown as Promise<ProjectSpaceResponse>;
  },

  async getProjectSpaceById(id: string): Promise<ProjectSpaceResponse> {
    return request.get(`/admin/v1/project-spaces/${id}`) as unknown as Promise<ProjectSpaceResponse>;
  },

  // ================= 2. 部署实例 (POST /admin/v1/deployment-instances, GET /admin/v1/deployment-instances/{id}) =================
  async createDeploymentInstance(data: DeploymentInstanceCreateRequest): Promise<DeploymentInstanceResponse> {
    return request.post('/admin/v1/deployment-instances', data) as unknown as Promise<DeploymentInstanceResponse>;
  },

  async getDeploymentInstanceById(id: string): Promise<DeploymentInstanceResponse> {
    return request.get(`/admin/v1/deployment-instances/${id}`) as unknown as Promise<DeploymentInstanceResponse>;
  },

  // ================= 3. 本地运维演示数据 =================
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
