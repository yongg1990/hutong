/**
 * 页面接口对接清单与元数据配置
 * 严格按照用户上传的 OpenAPI 3.1.0 规范（OpenAPI definition v0 /api/tcmirp）进行精准匹配
 * 只有该文档中已定义的接口对应页面才标记为 hasApi: true
 */

export interface EndpointMeta {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  desc: string;
}

export interface PageApiInfo {
  hasApi: boolean;
  moduleName: string;
  apiPath: string;
  specDoc: string;
  protocol: string;
  endpoints: EndpointMeta[];
  status: 'CONNECTED';
}

export const PAGE_API_MAP: Record<string, PageApiInfo> = {
  // 1. 业务协同场景 - 饮片赋码 (APP-02 主体、对象与监管编码)
  '/business/coding': {
    hasApi: true,
    moduleName: '饮片赋码与追溯码登记',
    apiPath: '/openapi/v1/trace-codes',
    specDoc: 'OpenAPI 3.1.0 / APP-02 主体、对象与监管编码',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/trace-codes', desc: '追溯码登记 (registerTraceCode)' }
    ]
  },

  // 2. 接入与治理 - 来源系统 (APP-03 来源接入与数据治理)
  '/governance/sources': {
    hasApi: true,
    moduleName: '来源系统注册与配置',
    apiPath: '/openapi/v1/source-systems',
    specDoc: 'OpenAPI 3.1.0 / APP-03 来源接入与数据治理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/source-systems', desc: '注册来源系统 (register)' }
    ]
  },

  // 3. 接入与治理 - 接入批次 (APP-03 来源接入与数据治理)
  '/governance/batches': {
    hasApi: true,
    moduleName: '数据接入批次与原始记录治理',
    apiPath: '/openapi/v1/batches, /openapi/v1/raw-records',
    specDoc: 'OpenAPI 3.1.0 / APP-03 来源接入与数据治理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/batches', desc: '创建批量接入任务 (createBatch)' },
      { method: 'POST', path: '/openapi/v1/raw-records', desc: '保存不可变原始记录 (preserve)' },
      { method: 'POST', path: '/openapi/v1/raw-records/{rawRecordId}/replays', desc: '重放治理记录 (replay)' }
    ]
  },

  // 4. 接入与治理 - 字段映射 (APP-03 来源接入与数据治理)
  '/governance/mappings': {
    hasApi: true,
    moduleName: '字段映射规则与预检',
    apiPath: '/openapi/v1/mappings/test',
    specDoc: 'OpenAPI 3.1.0 / APP-03 来源接入与数据治理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/mappings/test', desc: '映射预检与在线沙箱测试 (precheck)' }
    ]
  },

  // 5. 主数据中心 - 主体机构 (APP-02 主体、对象与监管编码)
  '/master-data/parties': {
    hasApi: true,
    moduleName: '主体机构登记与资质',
    apiPath: '/openapi/v1/parties',
    specDoc: 'OpenAPI 3.1.0 / APP-02 主体、对象与监管编码',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/parties', desc: '主体登记 (registerParty)' }
    ]
  },

  // 6. 主数据中心 - 业务对象 (APP-02 主体、对象与监管编码)
  '/master-data/objects': {
    hasApi: true,
    moduleName: '业务对象与外部标识管理',
    apiPath: '/openapi/v1/business-objects, /openapi/v1/identifiers-*',
    specDoc: 'OpenAPI 3.1.0 / APP-02 主体、对象与监管编码',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/business-objects', desc: '业务对象登记 (registerObject)' },
      { method: 'POST', path: '/openapi/v1/identifiers-resolve', desc: '外部标识解析 (resolve)' },
      { method: 'POST', path: '/openapi/v1/identifier-bindings', desc: '外部标识绑定 (bind)' }
    ]
  },

  // 7. 主数据中心 - 饮片与监管编码 (APP-02 主体、对象与监管编码)
  '/master-data/decoction-pieces': {
    hasApi: true,
    moduleName: '饮片品种与国家监管编码',
    apiPath: '/openapi/v1/decoction-piece-products',
    specDoc: 'OpenAPI 3.1.0 / APP-02 主体、对象与监管编码',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/decoction-piece-products', desc: '饮片品种登记 (registerProduct)' }
    ]
  },

  // 8. 平台配置与组织权限 - 租户管理 (APP-01 租户与访问控制)
  '/settings/tenants': {
    hasApi: true,
    moduleName: '租户生命周期与访问控制',
    apiPath: '/tenant-access/tenants',
    specDoc: 'OpenAPI 3.1.0 / APP-01 租户与访问控制',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/tenant-access/tenants', desc: '分页查询租户 (query)' },
      { method: 'POST', path: '/tenant-access/tenants', desc: '创建租户 (create)' },
      { method: 'GET', path: '/tenant-access/tenants/{id}', desc: '查询租户详情 (find)' },
      { method: 'POST', path: '/tenant-access/tenants/{id}/update', desc: '更新租户 (update)' },
      { method: 'GET', path: '/tenant-access/tenants/{id}/delete', desc: '删除租户 (delete)' }
    ]
  },

  // 9. 平台配置与组织权限 - 用户管理 (APP-01 用户与角色)
  '/settings/users': {
    hasApi: true,
    moduleName: '用户管理与角色授权',
    apiPath: '/tenant-access/users',
    specDoc: 'OpenAPI 3.1.0 / APP-01 用户与角色',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/tenant-access/users', desc: '查询用户列表 (list)' },
      { method: 'POST', path: '/tenant-access/users', desc: '创建用户 (create)' },
      { method: 'POST', path: '/tenant-access/users/{userId}/roles', desc: '给用户绑定角色 (bind)' },
      { method: 'GET', path: '/tenant-access/users/{userId}/roles/{roleId}/delete', desc: '解除用户角色 (remove)' }
    ]
  },

  // 10. 平台配置与组织权限 - 角色与权限 (APP-01 角色 & APP-01 权限)
  '/settings/roles': {
    hasApi: true,
    moduleName: '角色与权限矩阵',
    apiPath: '/tenant-access/roles, /tenant-access/permissions',
    specDoc: 'OpenAPI 3.1.0 / APP-01 角色与权限',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/tenant-access/roles/tenant', desc: '创建角色 (create)' },
      { method: 'POST', path: '/tenant-access/roles/{roleId}/permissions', desc: '替换角色权限 (replace)' },
      { method: 'GET', path: '/tenant-access/permissions', desc: '查询权限列表 (list)' },
      { method: 'POST', path: '/tenant-access/permissions', desc: '创建权限 (create)' },
      { method: 'POST', path: '/tenant-access/permissions/{permissionId}/update', desc: '修改权限 (update)' },
      { method: 'GET', path: '/tenant-access/permissions/{permissionId}/delete', desc: '删除权限 (delete)' }
    ]
  },

  // 11. 平台配置与组织权限 - 项目协同空间 (APP-01 项目空间)
  '/settings/tenant-project': {
    hasApi: true,
    moduleName: '项目协同空间管理',
    apiPath: '/admin/v1/project-spaces',
    specDoc: 'OpenAPI 3.1.0 / APP-01 项目空间',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/admin/v1/project-spaces', desc: '创建项目空间 (create)' },
      { method: 'GET', path: '/admin/v1/project-spaces/{id}', desc: '查询项目空间 (find)' }
    ]
  },

  // 12. 平台配置与组织权限 - 前置节点部署 (APP-01 部署实例)
  '/settings/deployments-edge': {
    hasApi: true,
    moduleName: '前置节点与部署实例',
    apiPath: '/admin/v1/deployment-instances',
    specDoc: 'OpenAPI 3.1.0 / APP-01 部署实例',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/admin/v1/deployment-instances', desc: '登记部署实例 (register)' },
      { method: 'GET', path: '/admin/v1/deployment-instances/{id}', desc: '查询部署实例 (find)' }
    ]
  }
};

/**
 * 根据路由路径解析页面对接的接口信息
 */
export function getPageApiInfo(path: string): PageApiInfo | null {
  if (!path) return null;
  
  // 1. 精确匹配
  if (PAGE_API_MAP[path]) {
    return PAGE_API_MAP[path];
  }

  // 2. 前缀匹配
  const sortedKeys = Object.keys(PAGE_API_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (path === key || path.startsWith(key + '/')) {
      return PAGE_API_MAP[key];
    }
  }

  return null;
}
