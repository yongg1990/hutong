import { CONNECTABLE_GROUPS } from './apiContract';

/**
 * 页面接口对接清单与元数据配置
 * 以 2026-10-19 实时 Swagger 中标注“可对接”的分组为准。
 * 未纳入本次对接范围的页面不展示接口标记。
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

const previousPageApiMap: Record<string, Pick<PageApiInfo, 'moduleName' | 'protocol' | 'status'>> = {
  '/governance/source-keys': { moduleName: '来源系统密钥管理', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/governance/event-authorizations': { moduleName: '事件类型授权', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/governance/integration-assistant': { moduleName: '对接助手', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/governance/sources': { moduleName: '来源系统注册与配置', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/governance/standards': { moduleName: '数据元与值域标准', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/governance/events': { moduleName: '事件类型与 Schema 配置', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/master-data/parties': { moduleName: '主体登记', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/master-data/objects': { moduleName: '业务对象登记', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/master-data/decoction-pieces': { moduleName: '饮片品种管理', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/master-data/code-schemes': { moduleName: '监管编码主数据', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/settings/tenants': { moduleName: '租户生命周期与访问控制', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/settings/users': { moduleName: '用户管理与角色授权', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/settings/roles': { moduleName: '角色与权限矩阵', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/settings/tenant-project': { moduleName: '项目协同空间管理', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' },
  '/settings/dictionaries': { moduleName: '通用字典管理', protocol: 'RESTful JSON / Axios', status: 'CONNECTED' }
};

/**
 * 根据路由路径解析页面对接的接口信息
 */
const pageGroups: Record<string, string[]> = {
  '/settings/tenants': ['APP-01 租户与访问控制'],
  '/settings/users': ['APP-01 用户与角色'],
  '/settings/roles': ['APP-01 角色'],
  '/settings/permissions': ['APP-01 权限'],
  '/settings/uploaded-files': ['APP-01 上传文件'],
  '/settings/deployments-edge': ['APP-01 部署实例'],
  '/settings/dictionaries': ['APP-01 通用字典'],
  '/settings/tenant-project': ['APP-01 项目空间'],
  '/master-data/parties': ['APP-02 主体管理'],
  '/master-data/objects': ['APP-02 业务对象管理'],
  '/master-data/decoction-pieces': ['APP-02 饮片品种管理'],
  '/master-data/code-schemes': ['APP-02 监管编码体系管理'],
  '/master-data/identifier-namespaces': ['APP-02 标识管理'],
  '/master-data/identifier-bindings': ['APP-02 标识管理'],
  '/master-data/trace-codes': ['APP-02 追溯码管理'],
  '/governance/sources': ['APP-03 来源系统管理'],
  '/governance/source-keys': ['APP-03 来源系统密钥管理'],
  '/governance/integration-assistant': ['APP-03 事件对接助手'],
  '/governance/standards': ['APP-03 数据元管理', 'APP-03 值域管理'],
  '/governance/data-elements': ['APP-03 数据元管理', 'APP-03 数据元导入'],
  '/governance/value-sets': ['APP-03 值域管理'],
  '/governance/value-set-mappings': ['APP-03 系统值域映射'],
  '/governance/raw-records': ['APP-03 来源接入与数据治理'],
  '/governance/encrypted-ingestion': ['APP-03 加密标准事件接入'],
  '/governance/event-types': ['APP-04 事件类型配置'],
  '/governance/schemas': ['APP-04 事件 Schema 管理'],
  '/trust/events': ['APP-04 事件配置与事实引擎'],
  '/exchange/profiles': ['APP-06 查询方案管理'],
  '/exchange/profile-config': ['APP-06 查询方案管理'],
  '/exchange/profile-bindings': ['APP-06 查询方案授权绑定管理'],
  '/exchange/integration-assistant': ['APP-06 查询方案对接助手'],
  '/exchange/encrypted-query': ['APP-06 加密方案查询'],
  '/governance/events': ['APP-04 事件类型配置', 'APP-04 事件 Schema 管理'],
  '/governance/event-authorizations': ['APP-04 事件类型授权']
};
export const PAGE_API_MAP: Record<string, PageApiInfo> = Object.fromEntries(
  Object.entries(pageGroups).map(([path, groups]) => [path, {
    moduleName: previousPageApiMap[path]?.moduleName || groups[0].replace(/^APP-\d+\s+/, ''),
    protocol: 'RESTful JSON / Axios',
    status: 'CONNECTED',
    hasApi: true,
    apiPath: groups.map(group => CONNECTABLE_GROUPS[group][0].path).join(', '),
    specDoc: `OpenAPI 3.1.0 / ${groups.join('、')}`,
    endpoints: groups.flatMap(group => CONNECTABLE_GROUPS[group])
  }])
);

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
