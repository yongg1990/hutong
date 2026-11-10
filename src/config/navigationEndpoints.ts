import type { ContractEndpoint } from './apiContract';

// Operations used by the pages extracted from the 2026-11-09 Swagger groups.
export const navigationEndpoints: Record<string, ContractEndpoint[]> = {
  'APP-01 上传文件': [
    { method: 'GET', path: '/tenant-access/files', desc: '分页查询租户上传文件' },
    { method: 'POST', path: '/tenant-access/files', desc: '上传文件并保存记录' },
    { method: 'GET', path: '/tenant-access/files/{id}', desc: '查询文件元数据' },
    { method: 'GET', path: '/tenant-access/files/{id}/content', desc: '下载上传文件' }
  ],
  'APP-01 部署实例': [
    { method: 'POST', path: '/openapi/v1/deployment-instances', desc: '登记部署实例' },
    { method: 'GET', path: '/openapi/v1/deployment-instances/{id}', desc: '查询部署实例' }
  ],
  'APP-02 标识管理': [
    ...['namespaces', 'bindings'].flatMap(resource => [
      { method: 'GET' as const, path: `/openapi/v1/identifiers/${resource}`, desc: '分页查询' },
      { method: 'POST' as const, path: `/openapi/v1/identifiers/${resource}`, desc: '创建' },
      { method: 'GET' as const, path: `/openapi/v1/identifiers/${resource}/{id}`, desc: '查询详情' },
      { method: 'POST' as const, path: `/openapi/v1/identifiers/${resource}/{id}`, desc: '更新' }
    ]),
    { method: 'POST', path: '/openapi/v1/identifiers/resolve', desc: '标识解析' }
  ],
  'APP-02 追溯码管理': [{ method: 'POST', path: '/openapi/v1/trace-codes', desc: '追溯码登记' }],
  'APP-03 数据元导入': [
    { method: 'POST', path: '/openapi/v1/data-elements/imports', desc: '从已上传文件导入数据元' },
    { method: 'GET', path: '/openapi/v1/data-elements/import-template', desc: '下载数据元导入模板' }
  ],
  'APP-03 系统值域映射': [
    { method: 'GET', path: '/openapi/v1/source-systems/{sourceSystemId}/value-set-mappings', desc: '分页查询系统自有码值映射' },
    { method: 'POST', path: '/openapi/v1/source-systems/{sourceSystemId}/value-set-mappings', desc: '创建系统自有码值映射' },
    { method: 'POST', path: '/openapi/v1/source-systems/{sourceSystemId}/value-set-mappings/{id}', desc: '修改或停用映射' },
    { method: 'GET', path: '/openapi/v1/source-systems/{sourceSystemId}/value-set-mappings/{valueSetId}/items', desc: '查询标准项及当前系统映射' },
    { method: 'POST', path: '/openapi/v1/source-systems/{sourceSystemId}/value-set-mappings/{valueSetId}/save', desc: '整体保存全部映射' }
  ],
  'APP-03 来源接入与数据治理': [
    { method: 'GET', path: '/openapi/v1/raw-records', desc: '分页查询原始接入记录' },
    { method: 'GET', path: '/openapi/v1/raw-records/{rawRecordId}', desc: '查看原始接入记录详情' },
    { method: 'POST', path: '/openapi/v1/raw-records/{rawRecordId}/replays', desc: '重放治理记录' }
  ],
  'APP-03 加密标准事件接入': [{ method: 'POST', path: '/openapi/v1/raw-records', desc: '验签、解密并保存标准事件原始记录' }],
  'APP-04 事件配置与事实引擎': [
    { method: 'GET', path: '/openapi/v1/event-fact/events', desc: '分页查询事件' },
    { method: 'GET', path: '/openapi/v1/event-fact/events/{id}', desc: '查看事件详情' }
  ],
  'APP-06 查询方案授权绑定管理': [
    // Binding mutations stay in the independent authorization page.
    { method: 'GET', path: '/openapi/v1/exchange-query/projects/{id}/bindings', desc: '查询项目绑定' },
    { method: 'GET', path: '/openapi/v1/exchange-query/profile-versions/{versionId}/bindings', desc: '按方案版本查询授权绑定' },
    { method: 'POST', path: '/openapi/v1/exchange-query/bindings', desc: '创建项目规范绑定' },
    { method: 'POST', path: '/openapi/v1/exchange-query/bindings/{id}', desc: '修改项目规范绑定' }
  ],
  'APP-06 查询方案对接助手': [
    ...['tenants', 'project-spaces', 'source-systems', 'source-system-keys', 'profiles', 'profile-versions', 'profile-definition'].map(resource => ({ method: 'GET' as const, path: `/exchange-query/integration-assistant/${resource}`, desc: '查询方案级联配置' })),
    { method: 'POST', path: '/exchange-query/integration-assistant/request-examples', desc: '生成查询明文请求信封' },
    { method: 'POST', path: '/exchange-query/integration-assistant/request-examples/encrypt', desc: '模拟加密查询请求' }
  ],
  'APP-06 加密方案查询': [{ method: 'POST', path: '/openapi/v1/exchange-query', desc: '来源系统加密同步查询' }]
};
navigationEndpoints['APP-06 查询方案管理'] = [
  { method: 'POST', path: '/openapi/v1/exchange-query/profiles/copy', desc: '复制独立方案' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-versions/{id}/copy', desc: '复制新草稿版本' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-versions/{id}/retire', desc: '退役已发布版本' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-versions/{id}/source-fields', desc: '查询可选来源字段' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-versions/{id}/fields/import', desc: '批量导入来源字段' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-fields/{id}/delete', desc: '删除字段' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-versions/{versionId}/params/{id}', desc: '查询业务入参详情' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-versions/{versionId}/params/{id}/delete', desc: '删除业务入参' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profiles', desc: '查询方案目录' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profiles', desc: '创建查询方案' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profiles/{id}', desc: '查询方案详情' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profiles/{id}', desc: '修改查询方案' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profiles/{id}/versions', desc: '查询方案版本' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-versions', desc: '创建版本草稿' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-versions/{id}', desc: '查询版本详情' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-versions/{id}', desc: '修改版本草稿' },
  ...['test', 'publish'].map(action => ({ method: 'POST' as const, path: `/openapi/v1/exchange-query/profile-versions/{id}/${action}`, desc: action === 'test' ? '测试版本' : '发布版本' })),
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-versions/{id}/fields', desc: '查询字段映射' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-fields', desc: '创建字段映射' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-fields/{id}', desc: '查询字段详情' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-fields/{id}', desc: '修改字段映射' },
  { method: 'GET', path: '/openapi/v1/exchange-query/profile-versions/{versionId}/params', desc: '查询业务入参' },
  { method: 'POST', path: '/openapi/v1/exchange-query/profile-versions/{versionId}/params', desc: '创建业务入参' },
  { method: 'PUT', path: '/openapi/v1/exchange-query/profile-versions/{versionId}/params/{id}', desc: '修改业务入参' }
];
