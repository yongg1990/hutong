// Swagger /v3/api-docs, 2026-10-19: only groups explicitly marked 可对接.
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface ContractEndpoint { method: ApiMethod; path: string; desc: string }
const endpoint = (method: ApiMethod, path: string, desc: string): ContractEndpoint => ({ method, path, desc });
const resource = (path: string, name: string, id = 'id'): ContractEndpoint[] => [
  endpoint('GET', path, `分页查询${name}`), endpoint('POST', path, `创建${name}`),
  endpoint('GET', `${path}/{${id}}`, `查询${name}详情`), endpoint('POST', `${path}/{${id}}`, `更新${name}`)
];
const assistant = '/ingestion-governance/integration-assistant';
const authorization = '/openapi/v1/event-fact/event-type-authorizations/tenants/{tenantId}/project-spaces/{projectSpaceId}/event-types';
export const CONNECTABLE_GROUPS: Record<string, ContractEndpoint[]> = {
  'APP-01 登录认证': [endpoint('POST', '/tenant-access/auth/login', '用户登录'), endpoint('POST', '/tenant-access/auth/logout', '退出登录')],
  'APP-01 租户与访问控制': [
    endpoint('GET', '/tenant-access/tenants', '分页查询租户'), endpoint('POST', '/tenant-access/tenants', '创建租户'),
    endpoint('GET', '/tenant-access/tenants/permitted', '查询当前用户可选租户'),
    endpoint('GET', '/tenant-access/tenants/{id}', '查询租户详情'), endpoint('POST', '/tenant-access/tenants/{id}/update', '更新租户'),
    endpoint('GET', '/tenant-access/tenants/{id}/delete', '删除租户')
  ],
  'APP-01 用户与角色': [
    endpoint('GET', '/tenant-access/users', '查询用户列表'), endpoint('GET', '/tenant-access/users/page', '分页查询用户'),
    endpoint('POST', '/tenant-access/users', '创建用户'), endpoint('GET', '/tenant-access/users/{userId}/roles', '查询已绑定角色'),
    endpoint('POST', '/tenant-access/users/{userId}/roles', '批量绑定角色'), endpoint('POST', '/tenant-access/users/{userId}/roles/delete', '批量解除角色')
  ],
  'APP-01 角色': [
    endpoint('GET', '/tenant-access/roles', '查询角色列表'), endpoint('GET', '/tenant-access/roles/page', '分页查询角色'),
    endpoint('POST', '/tenant-access/roles/tenant', '创建角色'), endpoint('GET', '/tenant-access/roles/{roleId}/permissions', '查询权限树及赋权状态'),
    endpoint('POST', '/tenant-access/roles/{roleId}/permissions', '保存最终权限集合')
  ],
  'APP-01 权限': [
    endpoint('GET', '/tenant-access/permissions', '查询权限'), endpoint('GET', '/tenant-access/permissions/tree', '查询权限树'),
    endpoint('POST', '/tenant-access/permissions', '创建权限'), endpoint('POST', '/tenant-access/permissions/{permissionId}/update', '修改权限'),
    endpoint('GET', '/tenant-access/permissions/{permissionId}/delete', '删除权限')
  ],
  'APP-01 通用字典': [
    endpoint('GET', '/tenant-access/dictionaries', '分页查询字典类型'), endpoint('POST', '/tenant-access/dictionaries', '创建租户字典类型'),
    endpoint('POST', '/tenant-access/dictionaries/{typeId}', '更新租户字典类型'),
    endpoint('GET', '/tenant-access/dictionaries/{dictionaryCode}/items', '分页查询字典项'),
    endpoint('GET', '/tenant-access/dictionaries/{dictionaryCode}/items/active', '查询全部有效字典项'),
    endpoint('POST', '/tenant-access/dictionaries/{dictionaryCode}/items', '创建字典项'),
    endpoint('POST', '/tenant-access/dictionaries/{dictionaryCode}/items/{itemId}', '更新字典项')
  ],
  'APP-01 项目空间': [
    endpoint('GET', '/openapi/v1/project-spaces', '分页查询项目空间'), endpoint('POST', '/openapi/v1/project-spaces', '创建项目空间'),
    endpoint('GET', '/openapi/v1/project-spaces/{id}', '查询项目空间'), endpoint('PATCH', '/openapi/v1/project-spaces/{id}', '更新项目空间')
  ],
  'APP-02 主体管理': resource('/openapi/v1/parties', '主体'),
  'APP-02 业务对象管理': resource('/openapi/v1/business-objects', '业务对象'),
  'APP-02 饮片品种管理': [...resource('/openapi/v1/decoction-piece-products', '饮片品种'), endpoint('POST', '/openapi/v1/decoction-piece-products/{id}/delete', '停用饮片品种')],
  'APP-02 监管编码体系管理': [
    ...resource('/openapi/v1/code-schemes', '监管编码体系'), endpoint('POST', '/openapi/v1/code-schemes/{id}/delete', '停用编码体系'),
    endpoint('GET', '/openapi/v1/code-schemes/{schemeId}/segments', '查询编码段'), endpoint('POST', '/openapi/v1/code-schemes/{schemeId}/segments', '创建编码段'),
    endpoint('GET', '/openapi/v1/code-schemes/{schemeId}/segments/{segmentId}', '查询编码段详情'),
    endpoint('POST', '/openapi/v1/code-schemes/{schemeId}/segments/{segmentId}', '更新编码段'),
    endpoint('POST', '/openapi/v1/code-schemes/{schemeId}/segments/{segmentId}/delete', '删除编码段'),
    endpoint('POST', '/openapi/v1/code-schemes/validate', '试校验监管编码')
  ],
  'APP-03 来源系统管理': [...resource('/openapi/v1/source-systems', '来源系统'), endpoint('GET', '/openapi/v1/source-systems/tenant', '按所选租户查询可选来源系统')],
  'APP-03 来源系统密钥管理': [
    endpoint('GET', '/openapi/v1/source-systems-keys', '按租户、来源系统和状态查询密钥列表'),
    endpoint('POST', '/ingestion-governance/source-systems/{sourceSystemId}/keys', '登记对接方公钥并生成密钥'),
    endpoint('POST', '/ingestion-governance/source-systems/{sourceSystemId}/keys/{keyId}/status', '启用或停用密钥'),
    endpoint('POST', '/ingestion-governance/admin/tenants/{tenantId}/source-systems/{sourceSystemId}/keys', '管理员为指定租户生成密钥')
  ],
  'APP-03 对接助手': [
    ...['tenants', 'project-spaces', 'source-systems', 'source-system-keys', 'event-types', 'schemas'].map(path => endpoint('GET', `${assistant}/${path}`, '分页查询级联配置')),
    endpoint('POST', `${assistant}/request-examples`, '生成明文模板与 SDK 配置'), endpoint('POST', `${assistant}/validate`, '只读校验 SDK 明文')
  ],
  'APP-03 数据元管理': [...resource('/openapi/v1/data-elements', '数据元'), endpoint('POST', '/openapi/v1/data-elements/{id}/status', '启用或停用数据元')],
  'APP-03 值域管理': [
    ...resource('/openapi/v1/value-sets', '值域', 'valueSetId'), endpoint('POST', '/openapi/v1/value-sets/{valueSetId}/status', '启用或停用值域'),
    ...resource('/openapi/v1/value-sets/{valueSetId}/items', '代码项', 'itemId'),
    endpoint('POST', '/openapi/v1/value-sets/{valueSetId}/items/{itemId}/status', '启用或停用代码项'),
    endpoint('GET', '/openapi/v1/value-sets/{valueSetId}/items/active', '查询全部有效代码项')
  ],
  'APP-04 事件类型配置': [
    endpoint('GET', '/openapi/v1/event-fact/event-types', '分页查询事件类型'), endpoint('POST', '/openapi/v1/event-fact/event-types', '创建事件类型'),
    endpoint('GET', '/openapi/v1/event-fact/event-types/{id}', '查询事件类型详情'), endpoint('PUT', '/openapi/v1/event-fact/event-types/{id}', '更新事件类型元数据'),
    endpoint('PATCH', '/openapi/v1/event-fact/event-types/{id}/status', '启用或停用事件类型')
  ],
  'APP-04 事件 Schema 管理': [
    ...resource('/openapi/v1/event-fact/schemas/definitions', 'Schema 草稿'),
    endpoint('POST', '/openapi/v1/event-fact/schemas/test', '测试未保存的 Schema'),
    endpoint('POST', '/openapi/v1/event-fact/schemas/definitions/{id}/test', '测试已保存的 Schema'),
    endpoint('POST', '/openapi/v1/event-fact/schemas/definitions/{id}/publish', '发布 Schema')
  ],
  'APP-04 事件类型授权': [endpoint('GET', authorization, '查询全部事件类型授权状态'), endpoint('POST', authorization, '保存授权目标集合及逐事件有效期')]
};
const endpointPatterns = Object.values(CONNECTABLE_GROUPS).flat().map(item => ({
  method: item.method,
  pattern: new RegExp('^' + item.path.split('/').map(part => /^\{.+\}$/.test(part)
    ? (part === '{dictionaryCode}' ? '[^/]+' : '-?\\d+')
    : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/') + '$')
}));
export function isConnectableEndpoint(method: string, path: string): boolean {
  return endpointPatterns.some(item => item.method === method.toUpperCase() && item.pattern.test(path.split('?')[0]));
}
