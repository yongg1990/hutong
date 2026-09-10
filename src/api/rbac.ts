import { request, apiCall } from './client';

export interface TenantItem {
  id: string | number;
  tenantCode: string;
  tenantName: string;
  tenantType?: string;
  creditCode?: string;
  contactName?: string;
  contactPhone?: string;
  adminAccount?: string;
  quotaUsers?: number;
  quotaStorageGb?: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | string;
  createdAt: string;
  updatedAt?: string;
  description?: string;
}

export interface UserItem {
  id: string | number;
  userId?: string | number;
  username: string;
  realName: string;
  displayName?: string;
  tenantId: string | number;
  tenantName?: string;
  roles: string[];
  roleIds?: (string | number)[];
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'DISABLED' | string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface RoleItem {
  id: string | number;
  roleId?: string | number;
  roleCode: string;
  roleName: string;
  tenantId: string | number;
  permissions: string[];
  userCount?: number;
  status: 'ACTIVE' | 'DISABLED' | string;
  description?: string;
  createdAt?: string;
}

export interface PermissionNode {
  id: string | number;
  permissionId?: string | number;
  label: string;
  permissionName?: string;
  code: string;
  permissionCode?: string;
  moduleCode?: string;
  apiMethod?: string;
  apiPath?: string;
  permissionType?: string;
  parentId?: number | string | null;
  status?: string;
  description?: string;
  children?: PermissionNode[];
}

export interface PermissionCreateRequest {
  permissionCode: string;
  permissionName: string;
  moduleCode: string;
  apiMethod?: string;
  apiPath?: string;
  parentId?: number;
  permissionType?: string;
}

export interface PermissionUpdateRequest {
  permissionName?: string;
  moduleCode?: string;
  apiMethod?: string;
  apiPath?: string;
  status?: string;
  parentId?: number;
  permissionType?: string;
}

// Initial Mock Seed Data
const initialTenants: TenantItem[] = [
  {
    id: 1,
    tenantCode: 'YN_TCM_COOP',
    tenantName: '云南省中药材全产业链协同示范联盟',
    tenantType: 'PLATFORM',
    creditCode: '91530100MA6K12345X',
    contactName: '张建国',
    contactPhone: '13888123456',
    adminAccount: 'admin_yn_tcm',
    quotaUsers: 200,
    quotaStorageGb: 1024,
    status: 'ACTIVE',
    createdAt: '2026-01-15 09:00:00',
    description: '涵盖种植示范基地、仓储中转中心、三七深加工厂及检验所多方协同。'
  },
  {
    id: 2,
    tenantCode: 'WS_SANQI_GROUP',
    tenantName: '文山三七现代中药农业发展有限公司',
    tenantType: 'PRODUCER',
    creditCode: '91532600MA6L98765Y',
    contactName: '李文山',
    contactPhone: '13987654321',
    adminAccount: 'ws_sanqi_master',
    quotaUsers: 50,
    quotaStorageGb: 500,
    status: 'ACTIVE',
    createdAt: '2026-02-20 14:30:00',
    description: '文山三七标准化GAP绿色种植与产地粗加工直连追溯租户。'
  },
  {
    id: 3,
    tenantCode: 'SH_TCM_TRADING',
    tenantName: '上海长三角中药饮片互认交割商行',
    tenantType: 'EXCHANGE',
    creditCode: '91310000MA1G55667Z',
    contactName: '王海川',
    contactPhone: '13701988899',
    adminAccount: 'sh_trading_audit',
    quotaUsers: 80,
    quotaStorageGb: 800,
    status: 'ACTIVE',
    createdAt: '2026-03-01 10:15:00',
    description: '跨省中药材采收等级与检验互通查验协同方。'
  }
];

const initialUsers: UserItem[] = [
  {
    id: 1001,
    userId: 1001,
    username: 'admin_yn_tcm',
    realName: '张工 (系统总管)',
    displayName: '张工 (系统总管)',
    tenantId: 1,
    tenantName: '云南省中药材全产业链协同示范联盟',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_GOVERNANCE_AUDITOR'],
    roleIds: [1, 2],
    phone: '13888123456',
    email: 'zhang.admin@tcmirp.yn.gov.cn',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-08 17:42:19',
    createdAt: '2026-01-15 09:30:00'
  },
  {
    id: 1002,
    userId: 1002,
    username: 'li_quality',
    realName: '李质检 (高级检验师)',
    displayName: '李质检 (高级检验师)',
    tenantId: 1,
    tenantName: '云南省中药材全产业链协同示范联盟',
    roles: ['ROLE_QUALITY_INSPECTOR'],
    roleIds: [2],
    phone: '13987112233',
    email: 'li.inspection@ynlims.cn',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-08 16:10:04',
    createdAt: '2026-02-01 11:20:00'
  },
  {
    id: 1003,
    userId: 1003,
    username: 'wang_warehouse',
    realName: '王仓管 (昆明中心仓)',
    displayName: '王仓管 (昆明中心仓)',
    tenantId: 1,
    tenantName: '云南省中药材全产业链协同示范联盟',
    roles: ['ROLE_WAREHOUSE_OPERATOR'],
    roleIds: [4],
    phone: '13612348877',
    email: 'wang.wms@yntcm-logistics.com',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-08 14:05:22',
    createdAt: '2026-02-10 16:40:00'
  },
  {
    id: 1004,
    userId: 1004,
    username: 'zhao_field',
    realName: '赵农艺 (GAP种植主管)',
    displayName: '赵农艺 (GAP种植主管)',
    tenantId: 2,
    tenantName: '文山三七现代中药农业发展有限公司',
    roles: ['ROLE_FIELD_OPERATOR'],
    roleIds: [3],
    phone: '13599887766',
    email: 'zhao.farm@wssanqi.com',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-07 09:12:30',
    createdAt: '2026-02-22 10:00:00'
  },
  {
    id: 1005,
    userId: 1005,
    username: 'chen_audit',
    realName: '陈审核 (上海交割复核员)',
    displayName: '陈审核 (上海交割复核员)',
    tenantId: 3,
    tenantName: '上海长三角中药饮片互认交割商行',
    roles: ['ROLE_EXCHANGE_AUDITOR'],
    roleIds: [5],
    phone: '13812349988',
    email: 'chen.audit@shtcm-exchange.cn',
    status: 'ACTIVE',
    lastLoginAt: '2026-09-08 11:35:10',
    createdAt: '2026-03-05 14:00:00'
  }
];

const initialRoles: RoleItem[] = [
  {
    id: 1,
    roleId: 1,
    roleCode: 'ROLE_SUPER_ADMIN',
    roleName: '平台系统管理员',
    tenantId: 1,
    permissions: [
      'workspace:view',
      'business:all',
      'governance:all',
      'masterdata:all',
      'trust:all',
      'exchange:all',
      'settings:all',
      'tenant:crud',
      'user:crud',
      'role:crud'
    ],
    userCount: 1,
    status: 'ACTIVE',
    description: '拥有中药互通互认平台的全域管理权限，可分配租户、用户与安全策略。',
    createdAt: '2026-01-01 00:00:00'
  },
  {
    id: 2,
    roleId: 2,
    roleCode: 'ROLE_QUALITY_INSPECTOR',
    roleName: '质检合规专员',
    tenantId: 1,
    permissions: [
      'workspace:view',
      'business:process-quality',
      'governance:standards',
      'trust:events',
      'trust:evidence',
      'trust:proofs'
    ],
    userCount: 3,
    status: 'ACTIVE',
    description: '负责中药材理化检测报告录入、质检标准符合性校验与区块链存证核真。',
    createdAt: '2026-01-10 10:00:00'
  },
  {
    id: 3,
    roleId: 3,
    roleCode: 'ROLE_FIELD_OPERATOR',
    roleName: '田间农事记录员',
    tenantId: 2,
    permissions: [
      'workspace:view',
      'business:field',
      'business:events-new',
      'masterdata:parties'
    ],
    userCount: 5,
    status: 'ACTIVE',
    description: '负责种植地块农事投入品、采收批次及初加工数据的采集与上报。',
    createdAt: '2026-01-12 11:30:00'
  },
  {
    id: 4,
    roleId: 4,
    roleCode: 'ROLE_WAREHOUSE_OPERATOR',
    roleName: '仓储物流调度员',
    tenantId: 1,
    permissions: [
      'workspace:view',
      'business:coding',
      'business:supply',
      'governance:batches',
      'trust:events'
    ],
    userCount: 2,
    status: 'ACTIVE',
    description: '负责饮片赋码关联、出入库温湿度打标、多码合一及溯源码流转。',
    createdAt: '2026-01-15 15:20:00'
  },
  {
    id: 5,
    roleId: 5,
    roleCode: 'ROLE_EXCHANGE_AUDITOR',
    roleName: '跨省数据交换审计员',
    tenantId: 3,
    permissions: [
      'workspace:view',
      'exchange:profiles',
      'exchange:projections',
      'trust:lineage',
      'trust:proofs'
    ],
    userCount: 2,
    status: 'ACTIVE',
    description: '负责跨区域长三角中药材互认投影包解析、跨链验证及电子凭据核销。',
    createdAt: '2026-02-01 09:00:00'
  }
];

export const standardPermissionTree: PermissionNode[] = [
  {
    id: 'p_workspace',
    label: '综合工作台 (Workspace)',
    code: 'workspace:view',
    description: '查看全链条流水线概览、全域监控指标与快速流转入口'
  },
  {
    id: 'p_business',
    label: '业务协同场景 (Business)',
    code: 'business:all',
    children: [
      { id: 'p_b_field', label: '田间种植 (农事/地块/采收)', code: 'business:field' },
      { id: 'p_b_process', label: '加工与质量 (切制/干燥/检验)', code: 'business:process-quality' },
      { id: 'p_b_coding', label: '饮片赋码 (包装/码关联)', code: 'business:coding' },
      { id: 'p_b_supply', label: '供销交割 (仓储/流转/交付)', code: 'business:supply' },
      { id: 'p_b_decoction', label: '处方代煎 (审方/调配/煎煮)', code: 'business:decoction' },
      { id: 'p_b_event_new', label: '通用事件录入 (Schema上报)', code: 'business:events-new' }
    ]
  },
  {
    id: 'p_governance',
    label: '数据接入与治理 (Governance)',
    code: 'governance:all',
    children: [
      { id: 'p_g_sources', label: '来源系统管理', code: 'governance:sources' },
      { id: 'p_g_batches', label: '接入批次监控与重放', code: 'governance:batches' },
      { id: 'p_g_mappings', label: '字段映射规则配置', code: 'governance:mappings' },
      { id: 'p_g_cases', label: '治理异常案卷处置', code: 'governance:cases' },
      { id: 'p_g_standards', label: '数据元与值域标准', code: 'governance:standards' },
      { id: 'p_g_schemas', label: '事件 Schema 管理', code: 'governance:schemas' }
    ]
  },
  {
    id: 'p_masterdata',
    label: '主数据中心 (Master Data)',
    code: 'masterdata:all',
    children: [
      { id: 'p_m_parties', label: '主体机构管理', code: 'masterdata:parties' },
      { id: 'p_m_objects', label: '业务对象管理', code: 'masterdata:objects' },
      { id: 'p_m_pieces', label: '饮片与监管编码', code: 'masterdata:decoction-pieces' }
    ]
  },
  {
    id: 'p_trust',
    label: '可信数据引擎 (Trust Engine)',
    code: 'trust:all',
    children: [
      { id: 'p_t_events', label: '可信事件流水查询', code: 'trust:events' },
      { id: 'p_t_lineage', label: 'DAG 全链条血缘分析', code: 'trust:lineage' },
      { id: 'p_t_evidence', label: '电子证据保全文件', code: 'trust:evidence' },
      { id: 'p_t_proofs', label: '存证单与 Merkle 树验证', code: 'trust:proofs' }
    ]
  },
  {
    id: 'p_exchange',
    label: '数据交换与物化 (Exchange)',
    code: 'exchange:all',
    children: [
      { id: 'p_e_profiles', label: '互通规范包配置', code: 'exchange:profiles' },
      { id: 'p_e_projections', label: '互通投影生成与交付', code: 'exchange:projections' }
    ]
  },
  {
    id: 'p_system',
    label: '平台配置与系统权限 (Platform & RBAC)',
    code: 'settings:all',
    children: [
      { id: 'p_s_tenant', label: '租户增删改查与配额管理', code: 'tenant:crud' },
      { id: 'p_s_user', label: '用户账号增删改查与角色分配', code: 'user:crud' },
      { id: 'p_s_role', label: '角色权限矩阵与权限定制', code: 'role:crud' },
      { id: 'p_s_edge', label: '前置边缘节点运维', code: 'settings:edge' },
      { id: 'p_s_jobs', label: '订阅与后台异步任务调度', code: 'settings:jobs' },
      { id: 'p_s_alerts', label: '安全审计与运行预警', code: 'settings:alerts' }
    ]
  }
];

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read from localStorage', e);
  }
  return fallback;
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Failed to write to localStorage', e);
  }
}

/**
 * 租户与权限体系 API 服务 (Swagger: /tenant-access/*)
 */
export const rbacApi = {
  // ================= 1. 租户管理 (GET /tenant-access/tenants) =================
  async getTenants(params?: {
    keyword?: string;
    tenantName?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<TenantItem[]> {
    const stored = getLocal<TenantItem[]>('tcmirp_tenants_store', initialTenants);
    const query = new URLSearchParams();
    if (params?.tenantName || params?.keyword) {
      query.append('tenantName', params?.tenantName || params?.keyword || '');
    }
    if (params?.page) query.append('page', String(params.page));
    if (params?.size) query.append('size', String(params.size));

    const fallbackFiltered = stored.filter(t => {
      const q = (params?.tenantName || params?.keyword || '').trim().toLowerCase();
      if (q) {
        const matchCode = t.tenantCode.toLowerCase().includes(q);
        const matchName = t.tenantName.toLowerCase().includes(q);
        const matchContact = (t.contactName || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchContact) return false;
      }
      if (params?.status && t.status !== params.status) return false;
      return true;
    });

    return apiCall(
      request.get(`/tenant-access/tenants?${query.toString()}`).then((res: any) => {
        // Backend returns PageResultTenantResponse { records, total, page, size }
        if (res && Array.isArray(res.records)) {
          return res.records.map((item: any) => ({
            id: item.tenantId || item.id,
            tenantCode: item.tenantCode,
            tenantName: item.tenantName,
            tenantType: item.tenantType || 'ENTERPRISE',
            status: item.status || 'ACTIVE',
            createdAt: item.createdAt || new Date().toLocaleString(),
            updatedAt: item.updatedAt
          }));
        }
        if (Array.isArray(res)) return res;
        return fallbackFiltered;
      }),
      fallbackFiltered,
      '获取租户列表'
    );
  },

  // GET /tenant-access/tenants/{id}
  async getTenantById(id: string | number): Promise<TenantItem> {
    const stored = getLocal<TenantItem[]>('tcmirp_tenants_store', initialTenants);
    const fallback = stored.find(t => String(t.id) === String(id)) || stored[0];

    return apiCall(
      request.get(`/tenant-access/tenants/${id}`).then((res: any) => {
        if (res && (res.tenantId || res.id)) {
          return {
            id: res.tenantId || res.id,
            tenantCode: res.tenantCode,
            tenantName: res.tenantName,
            tenantType: res.tenantType,
            status: res.status,
            createdAt: res.createdAt,
            updatedAt: res.updatedAt
          };
        }
        return fallback;
      }),
      fallback,
      '获取租户详情'
    );
  },

  // POST /tenant-access/tenants
  async createTenant(data: {
    tenantName: string;
    tenantType?: string;
    tenantCode?: string;
    contactName?: string;
    contactPhone?: string;
    description?: string;
  }): Promise<TenantItem> {
    const newTenant: TenantItem = {
      id: Date.now(),
      tenantCode: data.tenantCode || `TENANT_${Date.now().toString(36).toUpperCase()}`,
      tenantName: data.tenantName,
      tenantType: data.tenantType || 'ENTERPRISE',
      contactName: data.contactName || '管理员',
      contactPhone: data.contactPhone || '13800000000',
      status: 'ACTIVE',
      createdAt: new Date().toLocaleString(),
      description: data.description || ''
    };

    const stored = getLocal<TenantItem[]>('tcmirp_tenants_store', initialTenants);
    stored.unshift(newTenant);
    setLocal('tcmirp_tenants_store', stored);

    return apiCall(
      request.post('/tenant-access/tenants', {
        tenantName: data.tenantName,
        tenantType: data.tenantType || 'ENTERPRISE',
        tenantCode: data.tenantCode || newTenant.tenantCode
      }).then((res: any) => {
        return {
          ...newTenant,
          id: res?.tenantId || newTenant.id
        };
      }),
      newTenant,
      '创建新租户'
    );
  },

  // POST /tenant-access/tenants/{id}/update
  async updateTenant(
    id: string | number,
    data: {
      tenantName?: string;
      tenantType?: string;
      status?: string;
      description?: string;
    }
  ): Promise<TenantItem> {
    const stored = getLocal<TenantItem[]>('tcmirp_tenants_store', initialTenants);
    const idx = stored.findIndex(t => String(t.id) === String(id));
    if (idx !== -1) {
      stored[idx] = { ...stored[idx], ...data, updatedAt: new Date().toLocaleString() };
      setLocal('tcmirp_tenants_store', stored);
    }

    return apiCall(
      request.post(`/tenant-access/tenants/${id}/update`, {
        tenantName: data.tenantName,
        tenantType: data.tenantType,
        status: data.status
      }),
      stored[idx] || ({} as any),
      '更新租户信息'
    );
  },

  // GET /tenant-access/tenants/{id}/delete
  async deleteTenant(id: string | number): Promise<{ success: boolean }> {
    const stored = getLocal<TenantItem[]>('tcmirp_tenants_store', initialTenants);
    const next = stored.filter(t => String(t.id) !== String(id));
    setLocal('tcmirp_tenants_store', next);

    return apiCall(
      request.get(`/tenant-access/tenants/${id}/delete`),
      { success: true },
      '删除租户'
    );
  },

  // ================= 2. 用户管理 (Users) =================
  // GET /tenant-access/users?tenantId=...
  async getUsers(params?: {
    keyword?: string;
    tenantId?: string | number;
    role?: string;
    status?: string;
  }): Promise<UserItem[]> {
    const stored = getLocal<UserItem[]>('tcmirp_users_store', initialUsers);
    const query = new URLSearchParams();
    if (params?.tenantId && !isNaN(Number(params.tenantId))) {
      query.append('tenantId', String(params.tenantId));
    }

    const fallbackFiltered = stored.filter(u => {
      if (params?.keyword) {
        const kw = params.keyword.trim().toLowerCase();
        const matchUser = (u.username || '').toLowerCase().includes(kw);
        const matchReal = (u.realName || '').toLowerCase().includes(kw);
        const matchDisplay = (u.displayName || '').toLowerCase().includes(kw);
        if (!matchUser && !matchReal && !matchDisplay) return false;
      }
      if (params?.tenantId && String(u.tenantId) !== String(params.tenantId)) return false;
      if (params?.role && (!Array.isArray(u.roles) || !u.roles.includes(params.role))) return false;
      if (params?.status && u.status !== params.status) return false;
      return true;
    });

    return apiCall(
      request.get(`/tenant-access/users?${query.toString()}`).then((res: any) => {
        if (Array.isArray(res)) {
          return res.map((u: any) => ({
            id: u.userId || u.id,
            userId: u.userId || u.id,
            username: u.username,
            realName: u.displayName || u.realName || u.username,
            displayName: u.displayName || u.realName,
            tenantId: u.tenantId,
            roles: u.roles || ['ROLE_OPERATOR'],
            roleIds: u.roleIds || [],
            phone: u.phone || '13888888888',
            email: u.email || `${u.username}@tcmirp.cn`,
            status: u.status || 'ACTIVE',
            lastLoginAt: u.lastLoginAt || '2026-09-08 10:00:00',
            createdAt: u.createdAt || new Date().toLocaleString()
          }));
        }
        return fallbackFiltered;
      }),
      fallbackFiltered,
      '获取用户列表'
    );
  },

  // POST /tenant-access/users
  async createUser(data: {
    tenantId?: number | string;
    username: string;
    displayName: string;
    password?: string;
    roles?: string[];
  }): Promise<UserItem> {
    const newUser: UserItem = {
      id: Date.now(),
      userId: Date.now(),
      username: data.username,
      realName: data.displayName,
      displayName: data.displayName,
      tenantId: data.tenantId || 1,
      roles: data.roles || ['ROLE_OPERATOR'],
      status: 'ACTIVE',
      createdAt: new Date().toLocaleString()
    };

    const stored = getLocal<UserItem[]>('tcmirp_users_store', initialUsers);
    stored.unshift(newUser);
    setLocal('tcmirp_users_store', stored);

    return apiCall(
      request.post('/tenant-access/users', {
        tenantId: Number(data.tenantId) || 1,
        username: data.username,
        displayName: data.displayName,
        password: data.password || 'Tcm@2026!Admin'
      }).then((res: any) => {
        return {
          ...newUser,
          id: res?.userId || newUser.id,
          userId: res?.userId || newUser.userId
        };
      }),
      newUser,
      '创建新用户'
    );
  },

  // POST /tenant-access/users/{userId}/roles?tenantId=...
  async bindUserRole(
    userId: number | string,
    roleId: number | string,
    tenantId: number | string = 1
  ): Promise<{ success: boolean; message?: string }> {
    return apiCall(
      request.post(`/tenant-access/users/${userId}/roles?tenantId=${tenantId}`, {
        roleId: Number(roleId)
      }),
      { success: true, message: '绑定角色成功' },
      '用户绑定角色'
    );
  },

  // GET /tenant-access/users/{userId}/roles/{roleId}/delete?tenantId=...
  async unbindUserRole(
    userId: number | string,
    roleId: number | string,
    tenantId: number | string = 1
  ): Promise<{ success: boolean; message?: string }> {
    return apiCall(
      request.get(`/tenant-access/users/${userId}/roles/${roleId}/delete?tenantId=${tenantId}`),
      { success: true, message: '解除角色成功' },
      '用户解除角色'
    );
  },

  async updateUser(id: string | number, data: Partial<UserItem>): Promise<UserItem> {
    const stored = getLocal<UserItem[]>('tcmirp_users_store', initialUsers);
    const idx = stored.findIndex(u => String(u.id) === String(id));
    if (idx !== -1) {
      stored[idx] = { ...stored[idx], ...data };
      setLocal('tcmirp_users_store', stored);
      return apiCall(
        request.put(`/settings/users/${id}`, stored[idx]),
        stored[idx],
        '更新用户信息'
      );
    }
    throw new Error('用户不存在');
  },

  async deleteUser(id: string | number): Promise<{ success: boolean }> {
    const stored = getLocal<UserItem[]>('tcmirp_users_store', initialUsers);
    const next = stored.filter(u => String(u.id) !== String(id));
    setLocal('tcmirp_users_store', next);

    return apiCall(
      request.delete(`/settings/users/${id}`),
      { success: true },
      '删除用户'
    );
  },

  async resetPassword(id: string | number): Promise<{ success: boolean; tempPass: string }> {
    return apiCall(
      request.post(`/settings/users/${id}/reset-password`),
      { success: true, tempPass: 'Tcmirp@2026#' },
      '重置用户密码'
    );
  },

  // ================= 3. 角色与权限管理 (Roles & Permissions) =================
  async getRoles(params?: { keyword?: string; tenantId?: string | number }): Promise<RoleItem[]> {
    const stored = getLocal<RoleItem[]>('tcmirp_roles_store', initialRoles);
    return apiCall(
      request.get('/tenant-access/roles'),
      stored.filter(r => {
        if (params?.keyword) {
          const kw = params.keyword.trim().toLowerCase();
          const matchCode = r.roleCode.toLowerCase().includes(kw);
          const matchName = r.roleName.toLowerCase().includes(kw);
          if (!matchCode && !matchName) return false;
        }
        if (params?.tenantId && String(r.tenantId) !== String(params.tenantId)) return false;
        return true;
      }),
      '获取角色列表'
    );
  },

  // POST /tenant-access/roles/tenant?tenantId=...
  async createRole(
    data: { roleCode: string; roleName: string; description?: string; permissions?: string[] },
    tenantId: number | string = 1
  ): Promise<RoleItem> {
    const newRole: RoleItem = {
      id: Date.now(),
      roleId: Date.now(),
      roleCode: data.roleCode,
      roleName: data.roleName,
      tenantId,
      permissions: data.permissions || ['workspace:view'],
      userCount: 0,
      status: 'ACTIVE',
      description: data.description || '',
      createdAt: new Date().toLocaleString()
    };

    const stored = getLocal<RoleItem[]>('tcmirp_roles_store', initialRoles);
    stored.unshift(newRole);
    setLocal('tcmirp_roles_store', stored);

    return apiCall(
      request.post(`/tenant-access/roles/tenant?tenantId=${tenantId}`, {
        roleCode: data.roleCode,
        roleName: data.roleName,
        description: data.description || ''
      }).then((res: any) => {
        return {
          ...newRole,
          id: res?.roleId || newRole.id,
          roleId: res?.roleId || newRole.roleId
        };
      }),
      newRole,
      '创建新角色'
    );
  },

  // POST /tenant-access/roles/{roleId}/permissions
  async assignRolePermissions(
    roleId: number | string,
    permissionCodes: string[]
  ): Promise<{ success: boolean; message?: string }> {
    const stored = getLocal<RoleItem[]>('tcmirp_roles_store', initialRoles);
    const r = stored.find(item => String(item.id) === String(roleId) || String(item.roleId) === String(roleId));
    if (r) {
      r.permissions = permissionCodes;
      setLocal('tcmirp_roles_store', stored);
    }

    return apiCall(
      request.post(`/tenant-access/roles/${roleId}/permissions`, {
        permissionCodes
      }),
      { success: true, message: '授权成功' },
      '角色分配权限'
    );
  },

  async updateRole(id: string | number, data: Partial<RoleItem>): Promise<RoleItem> {
    const stored = getLocal<RoleItem[]>('tcmirp_roles_store', initialRoles);
    const idx = stored.findIndex(r => String(r.id) === String(id) || String(r.roleId) === String(id));
    if (idx !== -1) {
      stored[idx] = { ...stored[idx], ...data };
      setLocal('tcmirp_roles_store', stored);
    }

    // If permissions are updated, also call assignRolePermissions
    if (data.permissions && Array.isArray(data.permissions)) {
      await this.assignRolePermissions(id, data.permissions);
    }

    return stored[idx] || (data as any);
  },

  async deleteRole(id: string | number): Promise<{ success: boolean }> {
    const stored = getLocal<RoleItem[]>('tcmirp_roles_store', initialRoles);
    const next = stored.filter(r => String(r.id) !== String(id) && String(r.roleId) !== String(id));
    setLocal('tcmirp_roles_store', next);

    return apiCall(
      request.delete(`/tenant-access/roles/${id}`),
      { success: true },
      '删除角色'
    );
  },

  // ================= 4. 权限点定义管理 (Permissions) =================
  // GET /tenant-access/permissions
  async getPermissions(): Promise<PermissionNode[]> {
    return apiCall(
      request.get('/tenant-access/permissions').then((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          return res.map((p: any) => ({
            id: p.permissionId,
            permissionId: p.permissionId,
            label: p.permissionName,
            permissionName: p.permissionName,
            code: p.permissionCode,
            permissionCode: p.permissionCode,
            moduleCode: p.moduleCode,
            apiMethod: p.apiMethod,
            apiPath: p.apiPath,
            permissionType: p.permissionType,
            parentId: p.parentId,
            status: p.status
          }));
        }
        return standardPermissionTree;
      }),
      standardPermissionTree,
      '获取权限点列表'
    );
  },

  // POST /tenant-access/permissions
  async createPermission(data: PermissionCreateRequest): Promise<PermissionNode> {
    const newNode: PermissionNode = {
      id: Date.now(),
      permissionId: Date.now(),
      label: data.permissionName,
      permissionName: data.permissionName,
      code: data.permissionCode,
      permissionCode: data.permissionCode,
      moduleCode: data.moduleCode,
      apiMethod: data.apiMethod,
      apiPath: data.apiPath,
      parentId: data.parentId,
      permissionType: data.permissionType || 'MENU',
      status: 'ACTIVE'
    };

    return apiCall(
      request.post('/tenant-access/permissions', data),
      newNode,
      '创建权限节点'
    );
  },

  // POST /tenant-access/permissions/{permissionId}/update
  async updatePermission(
    permissionId: number | string,
    data: PermissionUpdateRequest
  ): Promise<any> {
    return apiCall(
      request.post(`/tenant-access/permissions/${permissionId}/update`, data),
      { success: true, permissionId, ...data },
      '更新权限节点'
    );
  },

  // GET /tenant-access/permissions/{permissionId}/delete
  async deletePermission(permissionId: number | string): Promise<boolean> {
    return apiCall(
      request.get(`/tenant-access/permissions/${permissionId}/delete`),
      true,
      '删除权限节点'
    );
  },

  async getPermissionTree(): Promise<PermissionNode[]> {
    return this.getPermissions();
  }
};
