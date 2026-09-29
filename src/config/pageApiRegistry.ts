/**
 * 页面接口对接清单与元数据配置
 * 严格按照用户上传的 OpenAPI 3.1.0 规范（OpenAPI definition v0 /api/tcmirp）进行精准匹配
 * 只有该文档中已定义的接口对应页面才标记为 hasApi: true
 */

export interface EndpointMeta {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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
    specDoc: 'OpenAPI 3.1.0 / APP-02 主体、对象与监管编码、APP-05 业务协同',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/trace-codes', desc: '追溯码登记 (registerTraceCode)' },
      { method: 'POST', path: '/supply-chain/trace-code-assignments', desc: '追溯赋码业务事件' }
    ]
  },

  '/business/field': {
    hasApi: true, moduleName: '田间种植业务事件', apiPath: '/supply-chain/plantings',
    specDoc: 'OpenAPI 3.1.0 / APP-05 中药全产业链业务协同', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/supply-chain/plantings', desc: '种植开始' },
      { method: 'POST', path: '/supply-chain/farming-operations', desc: '农事作业' },
      { method: 'POST', path: '/supply-chain/input-applications', desc: '投入品施用' },
      { method: 'POST', path: '/supply-chain/harvests', desc: '采收' }
    ]
  },

  '/business/process-quality': {
    hasApi: true, moduleName: '初加工与质量检测', apiPath: '/supply-chain/primary-processes, /supply-chain/quality-inspections',
    specDoc: 'OpenAPI 3.1.0 / APP-05 中药全产业链业务协同', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/supply-chain/primary-processes', desc: '初加工' },
      { method: 'POST', path: '/supply-chain/quality-inspections', desc: '质量检测' }
    ]
  },

  '/business/supply': {
    hasApi: true, moduleName: '供销仓储与交割', apiPath: '/supply-chain/*',
    specDoc: 'OpenAPI 3.1.0 / APP-05 中药全产业链业务协同', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/supply-chain/supply-orders', desc: '供销订单确认' },
      { method: 'POST', path: '/supply-chain/warehouse-receipts', desc: '入仓' },
      { method: 'POST', path: '/supply-chain/warehouse-issues', desc: '出库' },
      { method: 'POST', path: '/supply-chain/supply-deliveries', desc: '供销交割' },
      { method: 'POST', path: '/supply-chain/pledges', desc: '质押确认' }
    ]
  },

  '/business/decoction': {
    hasApi: true, moduleName: '处方代煎与配送', apiPath: '/supply-chain/prescriptions',
    specDoc: 'OpenAPI 3.1.0 / APP-05 中药全产业链业务协同', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/supply-chain/prescriptions', desc: '处方接收' },
      { method: 'POST', path: '/supply-chain/decoction-processes', desc: '代煎过程' },
      { method: 'POST', path: '/supply-chain/decoction-deliveries', desc: '煎剂配送' }
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
      { method: 'GET', path: '/openapi/v1/source-systems', desc: '分页查询来源系统' },
      { method: 'POST', path: '/openapi/v1/source-systems', desc: '注册来源系统' },
      { method: 'GET', path: '/openapi/v1/source-systems/{id}', desc: '查询来源系统详情' },
      { method: 'POST', path: '/openapi/v1/source-systems/{id}', desc: '更新来源系统' }
    ]
  },

  // 3. 接入与治理 - 接入批次 (APP-03 来源接入与数据治理)
  '/governance/batches': {
    hasApi: true,
    moduleName: '数据接入批次与原始记录治理',
    apiPath: '/openapi/v1/batches, /openapi/v1/raw-records',
    specDoc: 'OpenAPI 3.1.0 / APP-03 来源接入与数据治理、APP-08 批次查询',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/batches', desc: '创建批量接入任务 (createBatch)' },
      { method: 'GET', path: '/openapi/v1/batches/{batchId}', desc: '按 ID 查询批量任务 (APP-08)' },
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

  '/governance/standards': {
    hasApi: true, moduleName: '数据元与值域标准', apiPath: '/openapi/v1/data-elements, /openapi/v1/value-sets',
    specDoc: 'OpenAPI 3.1.0 / APP-03 数据元与值域管理', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/openapi/v1/data-elements', desc: '分页查询数据元' },
      { method: 'POST', path: '/openapi/v1/data-elements', desc: '新增数据元' },
      { method: 'POST', path: '/openapi/v1/data-elements/{id}', desc: '编辑数据元' },
      { method: 'POST', path: '/openapi/v1/data-elements/{id}/status', desc: '启停数据元' },
      { method: 'GET', path: '/openapi/v1/value-sets', desc: '分页查询值域' },
      { method: 'POST', path: '/openapi/v1/value-sets', desc: '新增值域' },
      { method: 'POST', path: '/openapi/v1/value-sets/{valueSetId}', desc: '编辑值域' },
      { method: 'POST', path: '/openapi/v1/value-sets/{valueSetId}/status', desc: '启停值域' },
      { method: 'GET', path: '/openapi/v1/value-sets/{valueSetId}/items', desc: '分页查询代码项' },
      { method: 'POST', path: '/openapi/v1/value-sets/{valueSetId}/items', desc: '新增代码项' },
      { method: 'POST', path: '/openapi/v1/value-sets/{valueSetId}/items/{itemId}', desc: '编辑代码项' },
      { method: 'POST', path: '/openapi/v1/value-sets/{valueSetId}/items/{itemId}/status', desc: '启停代码项' }
    ]
  },
  // 5. 接入治理 - 事件与 Schema 配置 (APP-04 事件配置与事实引擎)
  '/governance/events': {
    hasApi: true,
    moduleName: '事件类型与 Schema 配置',
    apiPath: '/openapi/v1/event-fact/event-types, /openapi/v1/event-fact/schemas/definitions',
    specDoc: 'OpenAPI 3.1.0 / APP-04 事件配置与事实引擎',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/openapi/v1/event-fact/event-types', desc: '查询事件类型' },
      { method: 'POST', path: '/openapi/v1/event-fact/event-types', desc: '创建事件类型' },
      { method: 'GET', path: '/openapi/v1/event-fact/schemas/definitions', desc: '查询 Schema 定义' },
      { method: 'GET', path: '/openapi/v1/event-fact/schemas/definitions/{id}', desc: '查询 Schema 详情' },
      { method: 'POST', path: '/openapi/v1/event-fact/schemas/definitions', desc: '创建 Schema 草稿' },
      { method: 'POST', path: '/openapi/v1/event-fact/schemas/definitions/{id}/test', desc: '测试 Schema 配置' },
      { method: 'POST', path: '/openapi/v1/event-fact/schemas/definitions/{id}/publish', desc: '发布 Schema' }
    ]
  },

  // 5. 主数据中心 - 主体登记 (APP-02 主体、对象与监管编码)
  '/master-data/parties': {
    hasApi: true,
    moduleName: '主体登记',
    apiPath: '/openapi/v1/parties',
    specDoc: 'OpenAPI 3.1.0 / APP-02 主体、对象与监管编码',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/parties', desc: '主体登记 (registerParty)' }
      ,{ method: 'GET', path: '/openapi/v1/parties', desc: '分页查询主体' }
      ,{ method: 'GET', path: '/openapi/v1/parties/{id}', desc: '主体详情' }
      ,{ method: 'POST', path: '/openapi/v1/parties/{id}', desc: '更新主体' }
    ]
  },

  // 6. 主数据中心 - 标识命名空间 (APP-02 标识命名空间)
  '/master-data/identifier-namespaces': {
    hasApi: true,
    moduleName: '标识命名空间',
    apiPath: '/openapi/v1/identifiers/namespaces',
    specDoc: 'OpenAPI 3.1.0 / APP-02 标识管理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/openapi/v1/identifiers/namespaces', desc: '分页查询标识命名空间' },
      { method: 'POST', path: '/openapi/v1/identifiers/namespaces', desc: '创建标识命名空间' },
      { method: 'GET', path: '/openapi/v1/identifiers/namespaces/{id}', desc: '查询命名空间详情' },
      { method: 'POST', path: '/openapi/v1/identifiers/namespaces/{id}', desc: '更新标识命名空间' }
    ]
  },

  // 7. 主数据中心 - 业务对象登记 (APP-02 业务对象管理)
  '/master-data/objects': {
    hasApi: true,
    moduleName: '业务对象登记',
    apiPath: '/openapi/v1/business-objects',
    specDoc: 'OpenAPI 3.1.0 / APP-02 业务对象管理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/openapi/v1/business-objects', desc: '分页查询业务对象' },
      { method: 'POST', path: '/openapi/v1/business-objects', desc: '创建业务对象' },
      { method: 'GET', path: '/openapi/v1/business-objects/{id}', desc: '查询业务对象详情' },
      { method: 'POST', path: '/openapi/v1/business-objects/{id}', desc: '更新业务对象并创建属性版本' }
    ]
  },

  // 8. 主数据中心 - 标识绑定 (APP-02 主体、对象与监管编码)
  '/master-data/identifier-bindings': {
    hasApi: true,
    moduleName: '标识解析与绑定',
    apiPath: '/openapi/v1/identifiers/resolve, /openapi/v1/identifiers/bindings',
    specDoc: 'OpenAPI 3.1.0 / APP-02 标识管理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/identifiers/resolve', desc: '外部标识解析 (resolve)' },
      { method: 'GET', path: '/openapi/v1/identifiers/bindings', desc: '分页查询外部标识绑定' },
      { method: 'POST', path: '/openapi/v1/identifiers/bindings', desc: '外部标识绑定 (bind)' },
      { method: 'GET', path: '/openapi/v1/identifiers/bindings/{id}', desc: '绑定详情' },
      { method: 'POST', path: '/openapi/v1/identifiers/bindings/{id}', desc: '更新绑定' }
    ]
  },

  // 9. 主数据中心 - 饮片品种管理 (APP-02 饮片品种管理)
  '/master-data/decoction-pieces': {
    hasApi: true,
    moduleName: '饮片品种管理',
    apiPath: '/openapi/v1/decoction-piece-products',
    specDoc: 'OpenAPI 3.1.0 / APP-02 饮片品种管理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/openapi/v1/decoction-piece-products', desc: '分页查询饮片品种' },
      { method: 'POST', path: '/openapi/v1/decoction-piece-products', desc: '饮片品种登记' },
      { method: 'GET', path: '/openapi/v1/decoction-piece-products/{id}', desc: '查询饮片品种详情' },
      { method: 'POST', path: '/openapi/v1/decoction-piece-products/{id}', desc: '更新饮片品种' },
      { method: 'POST', path: '/openapi/v1/decoction-piece-products/{id}/delete', desc: '停用饮片品种' }
    ]
  },

  // 10. 主数据中心 - 监管编码主数据 (APP-02 监管编码体系管理)
  '/master-data/code-schemes': {
    hasApi: true,
    moduleName: '监管编码主数据',
    apiPath: '/openapi/v1/code-schemes',
    specDoc: 'OpenAPI 3.1.0 / APP-02 监管编码体系管理',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/openapi/v1/code-schemes', desc: '分页查询监管编码体系' },
      { method: 'POST', path: '/openapi/v1/code-schemes', desc: '创建监管编码体系' },
      { method: 'GET', path: '/openapi/v1/code-schemes/{id}', desc: '查询监管编码体系详情' },
      { method: 'POST', path: '/openapi/v1/code-schemes/{id}', desc: '更新监管编码体系' },
      { method: 'POST', path: '/openapi/v1/code-schemes/{id}/delete', desc: '停用监管编码体系' },
      { method: 'GET', path: '/openapi/v1/code-schemes/{schemeId}/segments', desc: '查询监管编码段' },
      { method: 'POST', path: '/openapi/v1/code-schemes/{schemeId}/segments', desc: '创建监管编码段' },
      { method: 'GET', path: '/openapi/v1/code-schemes/{schemeId}/segments/{segmentId}', desc: '查询监管编码段详情' },
      { method: 'POST', path: '/openapi/v1/code-schemes/{schemeId}/segments/{segmentId}', desc: '更新监管编码段' },
      { method: 'POST', path: '/openapi/v1/code-schemes/{schemeId}/segments/{segmentId}/delete', desc: '删除监管编码段' },
      { method: 'POST', path: '/openapi/v1/code-schemes/validate', desc: '试校验并解析监管编码' }
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
    apiPath: '/tenant-access/users/page',
    specDoc: 'OpenAPI 3.1.0 / APP-01 用户与角色',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/tenant-access/users/page', desc: '分页查询用户列表' },
      { method: 'POST', path: '/tenant-access/users', desc: '创建用户 (create)' },
      { method: 'POST', path: '/tenant-access/users/{userId}/roles', desc: '批量绑定用户角色 (bind)' },
      { method: 'GET', path: '/tenant-access/users/{userId}/roles', desc: '查询用户已绑定角色' },
      { method: 'POST', path: '/tenant-access/users/{userId}/roles/delete', desc: '批量解除用户角色 (removeBatch)' }
    ]
  },

  // 10. 平台配置与组织权限 - 角色与权限 (APP-01 角色 & APP-01 权限)
  '/settings/roles': {
    hasApi: true,
    moduleName: '角色与权限矩阵',
    apiPath: '/tenant-access/roles/page, /tenant-access/permissions',
    specDoc: 'OpenAPI 3.1.0 / APP-01 角色与权限',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/tenant-access/roles/page', desc: '分页查询角色列表' },
      { method: 'POST', path: '/tenant-access/roles/tenant', desc: '创建角色 (create)' },
      { method: 'GET', path: '/tenant-access/roles/{roleId}/permissions', desc: '查询角色权限赋权状态 (find)' },
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
    apiPath: '/openapi/v1/project-spaces',
    specDoc: 'OpenAPI 3.1.0 / APP-01 项目空间',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/openapi/v1/project-spaces', desc: '分页查询项目空间 (query)' },
      { method: 'POST', path: '/openapi/v1/project-spaces', desc: '创建项目空间 (create)' },
      { method: 'GET', path: '/openapi/v1/project-spaces/{id}', desc: '查询项目空间 (find)' },
      { method: 'PATCH', path: '/openapi/v1/project-spaces/{id}', desc: '更新项目空间 (update)' }
    ]
  },

  // 12. 平台配置与组织权限 - 前置节点部署 (APP-01 部署实例)
  '/settings/deployments-edge': {
    hasApi: true,
    moduleName: '前置节点与部署实例',
    apiPath: '/openapi/v1/deployment-instances',
    specDoc: 'OpenAPI 3.1.0 / APP-01 部署实例',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/openapi/v1/deployment-instances', desc: '登记部署实例 (register)' },
      { method: 'GET', path: '/openapi/v1/deployment-instances/{id}', desc: '查询部署实例 (find)' }
    ]
  },

  '/settings/dictionaries': {
    hasApi: true,
    moduleName: '通用字典管理',
    apiPath: '/tenant-access/dictionaries',
    specDoc: 'OpenAPI 3.1.0 / APP-01 通用字典',
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/tenant-access/dictionaries', desc: '分页查询字典类型' },
      { method: 'POST', path: '/tenant-access/dictionaries', desc: '创建租户字典类型' },
      { method: 'POST', path: '/tenant-access/dictionaries/{typeId}', desc: '更新租户字典类型' },
      { method: 'GET', path: '/tenant-access/dictionaries/{dictionaryCode}/items', desc: '分页查询字典项' },
      { method: 'GET', path: '/tenant-access/dictionaries/{dictionaryCode}/items/active', desc: '查询全部有效字典项' },
      { method: 'POST', path: '/tenant-access/dictionaries/{dictionaryCode}/items', desc: '创建租户字典项' },
      { method: 'POST', path: '/tenant-access/dictionaries/{dictionaryCode}/items/{itemId}', desc: '更新租户字典项' }
    ]
  },

  '/exchange/profiles': {
    hasApi: true, moduleName: '互通规范包与字段规则', apiPath: '/exchange-query/profiles',
    specDoc: 'OpenAPI 3.1.0 / APP-06 互通查询', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method: 'GET', path: '/exchange-query/profiles', desc: '查询启用规范包' },
      { method: 'POST', path: '/exchange-query/profiles', desc: '创建规范包' },
      { method: 'POST', path: '/exchange-query/profiles/{id}', desc: '更新规范包' },
      { method: 'GET', path: '/exchange-query/profiles/{id}/versions', desc: '查询规范版本' },
      { method: 'GET', path: '/exchange-query/profile-versions/{id}/datasets', desc: '查询数据集' },
      { method: 'GET', path: '/exchange-query/datasets/{id}/field-rules', desc: '查询字段规则' }
    ]
  },

  '/exchange/projections': {
    hasApi: true, moduleName: '互通投影', apiPath: '/exchange-query/projections',
    specDoc: 'OpenAPI 3.1.0 / APP-06 互通查询', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method: 'POST', path: '/exchange-query/projections', desc: '冻结输入并受理异步投影' },
      { method: 'GET', path: '/exchange-query/projections/{id}', desc: '查询互通投影结果' },
      { method: 'POST', path: '/exchange-query/projects/{projectSpaceId}/projections/{id}/process', desc: '幂等投影补偿处理' }
    ]
  },

  '/trust/lineage': {
    hasApi: true, moduleName: '有界血缘查询', apiPath: '/exchange-query/lineage/{rootType}/{rootId}',
    specDoc: 'OpenAPI 3.1.0 / APP-06 互通查询', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [{ method: 'GET', path: '/exchange-query/lineage/{rootType}/{rootId}', desc: '有界血缘查询' }]
  },
  '/trust/files-credentials': {
    hasApi: true, moduleName: '文件上传与凭证', apiPath: '/openapi/v1/files/upload-sessions',
    specDoc: 'OpenAPI 3.1.0 / APP-07、APP-08', protocol: 'RESTful JSON / Axios', status: 'CONNECTED',
    endpoints: [
      { method:'POST', path:'/openapi/v1/files/upload-sessions', desc:'创建上传会话' },
      { method:'GET', path:'/openapi/v1/files/upload-sessions/{id}', desc:'查询上传会话' },
      { method:'POST', path:'/openapi/v1/files/upload-sessions/{id}/complete', desc:'确认完成' },
      { method:'GET', path:'/openapi/v1/files/{id}', desc:'文件元数据' },
      { method:'POST', path:'/openapi/v1/credentials', desc:'登记凭证' },
      { method:'GET', path:'/openapi/v1/credentials/{id}', desc:'查询凭证' }
    ]
  },
  '/exchange/profile-config': {
    hasApi:true, moduleName:'互通规范配置', apiPath:'/exchange-query/profile-versions',
    specDoc:'OpenAPI 3.1.0 / APP-06', protocol:'RESTful JSON / Axios', status:'CONNECTED',
    endpoints:[
      {method:'POST',path:'/exchange-query/profile-versions',desc:'创建版本草稿'},
      {method:'POST',path:'/exchange-query/profile-versions/{id}/test',desc:'测试版本'},
      {method:'POST',path:'/exchange-query/profile-versions/{id}/publish',desc:'发布版本'},
      ...['datasets','field-rules','conformance-cases','bindings'].flatMap(path=>[
        {method:'POST' as const,path:`/exchange-query/${path}`,desc:'创建配置'},
        {method:'POST' as const,path:`/exchange-query/${path}/{id}`,desc:'修改配置'}
      ]),
      {method:'GET',path:'/exchange-query/profiles/{id}/versions',desc:'查询版本'},
      {method:'GET',path:'/exchange-query/profile-versions/{id}/datasets',desc:'查询数据集'},
      {method:'GET',path:'/exchange-query/datasets/{id}/field-rules',desc:'查询字段规则'},
      {method:'GET',path:'/exchange-query/profile-versions/{id}/conformance-cases',desc:'查询用例'},
      {method:'GET',path:'/exchange-query/projects/{id}/bindings',desc:'查询项目绑定'}
    ]
  },
  '/exchange/queries': {
    hasApi:true,moduleName:'交换数据查询',apiPath:'/exchange-query/objects',
    specDoc:'OpenAPI 3.1.0 / APP-06',protocol:'RESTful JSON / Axios',status:'CONNECTED',
    endpoints:[
      {method:'GET',path:'/exchange-query/objects/{id}',desc:'查询对象'},
      {method:'GET',path:'/exchange-query/events/{id}',desc:'查询事件'},
      {method:'GET',path:'/exchange-query/events/{id}/status',desc:'处理状态'},
      {method:'GET',path:'/exchange-query/metadata/profiles/{profileCode}',desc:'已发布元数据'}
    ]
  },
  '/operations/subscriptions-jobs': {
    hasApi:true,moduleName:'订阅与回调',apiPath:'/admin/v1/subscriptions',
    specDoc:'OpenAPI 3.1.0 / APP-08',protocol:'RESTful JSON / Axios',status:'CONNECTED',
    endpoints:[
      {method:'POST',path:'/admin/v1/subscriptions',desc:'创建订阅'},
      {method:'GET',path:'/openapi/v1/callback-deliveries/{messageId}',desc:'查询回调'},
      {method:'POST',path:'/openapi/v1/callback-deliveries/{messageId}/replay',desc:'人工重放'}
    ]
  },
  '/operations/audit-alerts': {
    hasApi:true,moduleName:'告警处置',apiPath:'/openapi/v1/alerts/{alertId}/actions',
    specDoc:'OpenAPI 3.1.0 / APP-08',protocol:'RESTful JSON / Axios',status:'CONNECTED',
    endpoints:[{method:'POST',path:'/openapi/v1/alerts/{alertId}/actions',desc:'确认或关闭告警'}]
  },
  '/trust/proofs': {
    hasApi:true,moduleName:'存证与补偿',apiPath:'/openapi/v1/proofs',
    specDoc:'OpenAPI 3.1.0 / APP-07',protocol:'RESTful JSON / Axios',status:'CONNECTED',
    endpoints:[
      {method:'POST',path:'/openapi/v1/proofs',desc:'创建存证任务'},
      {method:'GET',path:'/openapi/v1/proofs/{subjectType}/{subjectId}',desc:'查询存证状态'},
      {method:'POST',path:'/openapi/v1/proofs/verify',desc:'验真'},
      ...['process','retry','reconcile'].map(action=>({method:'POST' as const,path:`/openapi/v1/proofs/{id}/${action}`,desc:'存证运维操作'}))
    ]
  },
  '/trust/evidence': {
    hasApi:true,moduleName:'证据登记与查询',apiPath:'/openapi/v1/evidence',
    specDoc:'OpenAPI 3.1.0 / APP-07',protocol:'RESTful JSON / Axios',status:'CONNECTED',
    endpoints:[{method:'POST',path:'/openapi/v1/evidence',desc:'登记证据'},{method:'GET',path:'/openapi/v1/evidence/{id}',desc:'查询证据'}]
  },
  '/business/events/new': {
    hasApi:true,moduleName:'事件录入',apiPath:'/openapi/v1/event-fact/events',
    specDoc:'OpenAPI 3.1.0 / APP-04、APP-05',protocol:'RESTful JSON / Axios',status:'CONNECTED',
    endpoints:[{method:'POST',path:'/openapi/v1/event-fact/events',desc:'提交规范事件'},{method:'GET',path:'/openapi/v1/event-fact/schemas/definitions',desc:'查询已发布 Schema'}]
  },
  '/trust/events': {
    hasApi:true,moduleName:'事件查询',apiPath:'/openapi/v1/event-fact/events/{id}',
    specDoc:'OpenAPI 3.1.0 / APP-04、APP-06',protocol:'RESTful JSON / Axios',status:'CONNECTED',
    endpoints:[{method:'GET',path:'/openapi/v1/event-fact/events/{id}',desc:'查询事件'},{method:'GET',path:'/exchange-query/events/{id}/status',desc:'查询处理状态'}]
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
