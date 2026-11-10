import { Tools, OfficeBuilding, Filter, Connection, Share, Goods } from '@element-plus/icons-vue';

export interface NavigationItem { title: string; path: string }
export interface NavigationGroup { title: string; index: string; icon: typeof Tools; order: number; items: NavigationItem[] }

// Group documented pages by APP number; retain independent routes for each page.
export const documentMenuGroups: NavigationGroup[] = [
  { title: 'APP-01 平台租户与访问控制', index: 'app-01', icon: Tools, order: 1, items: [
    { title: '租户与访问控制', path: '/settings/tenants' },
    { title: '用户与角色', path: '/settings/users' },
    { title: '角色管理', path: '/settings/roles' },
    { title: '权限管理', path: '/settings/permissions' },
    { title: '通用字典', path: '/settings/dictionaries' },
    { title: '项目空间', path: '/settings/tenant-project' },
    { title: '部署实例', path: '/settings/deployments-edge' },
    { title: '上传文件', path: '/settings/uploaded-files' }
  ] },
  { title: 'APP-02 主体对象与监管编码', index: 'app-02', icon: OfficeBuilding, order: 2, items: [
    { title: '主体管理', path: '/master-data/parties' },
    { title: '业务对象管理', path: '/master-data/objects' },
    { title: '饮片品种管理', path: '/master-data/decoction-pieces' },
    { title: '监管编码体系管理', path: '/master-data/code-schemes' },
    { title: '标识命名空间', path: '/master-data/identifier-namespaces' },
    { title: '外部标识绑定', path: '/master-data/identifier-bindings' },
    { title: '追溯码管理', path: '/master-data/trace-codes' }
  ] },
  { title: 'APP-03 来源接入与数据治理', index: 'app-03', icon: Filter, order: 3, items: [
    { title: '来源系统管理', path: '/governance/sources' },
    { title: '来源系统密钥管理', path: '/governance/source-keys' },
    { title: '事件对接助手', path: '/governance/integration-assistant' },
    { title: '数据元管理', path: '/governance/data-elements' },
    { title: '值域管理', path: '/governance/value-sets' },
    { title: '系统值域映射', path: '/governance/value-set-mappings' },
    { title: '原始接入记录与重放', path: '/governance/raw-records' },
    { title: '加密标准事件接入', path: '/governance/encrypted-ingestion' }
  ] },
  { title: 'APP-04 事件配置与事实引擎', index: 'app-04', icon: Connection, order: 4, items: [
    { title: '事件类型配置', path: '/governance/event-types' },
    { title: '事件 Schema 管理', path: '/governance/schemas' },
    { title: '事件类型授权', path: '/governance/event-authorizations' },
    { title: '事件查询', path: '/trust/events' }
  ] },
  { title: 'APP-06 查询互通方案与输出', index: 'app-06', icon: Share, order: 6, items: [
    { title: '查询方案管理', path: '/exchange/profiles' },
    { title: '方案版本与字段配置', path: '/exchange/profile-config' },
    { title: '查询方案授权绑定管理', path: '/exchange/profile-bindings' },
    { title: '查询方案对接助手', path: '/exchange/integration-assistant' },
    { title: '加密方案查询', path: '/exchange/encrypted-query' }
  ] }
].sort((a, b) => a.order - b.order);

export const legacyMenuGroups: NavigationGroup[] = [
  { title: '业务协同场景', index: 'business', icon: Goods, order: 100, items: [
    { title: '田间种植', path: '/business/field' }, { title: '加工与质量', path: '/business/process-quality' },
    { title: '饮片赋码', path: '/business/coding' }, { title: '供销交割', path: '/business/supply' },
    { title: '处方代煎', path: '/business/decoction' }, { title: '通用事件录入', path: '/business/events/new' }
  ] },
  { title: '接入与治理', index: 'governance', icon: Filter, order: 101, items: [
    { title: '接入批次', path: '/governance/batches' }, { title: '字段映射预检', path: '/governance/mappings' }, { title: '治理异常案卷', path: '/governance/cases' }
  ] },
  { title: '可信数据引擎', index: 'trust', icon: Connection, order: 102, items: [
    { title: '血缘分析图谱', path: '/trust/lineage' }, { title: '证据文件', path: '/trust/evidence' },
    { title: '文件上传与凭证', path: '/trust/files-credentials' }, { title: '存证单与 Merkle', path: '/trust/proofs' }
  ] },
  { title: '数据交换与物化', index: 'exchange', icon: Share, order: 103, items: [
    { title: '交换数据查询', path: '/exchange/queries' }, { title: '互通投影与交付', path: '/exchange/projections' }, { title: '互通其他配置', path: '/exchange/legacy-config' }
  ] },
  { title: '平台配置与组织权限', index: 'platform', icon: Tools, order: 104, items: [
    { title: '订阅与异步任务', path: '/operations/subscriptions-jobs' }, { title: '审计与告警', path: '/operations/audit-alerts' }
  ] }
];

export const menuGroups = [...documentMenuGroups, ...legacyMenuGroups];
export const mobilePages = [{ title: '工作台', path: '/workspace' }, ...menuGroups.flatMap(group => group.items.map(item => ({ ...item, title: `${group.title} / ${item.title}` })))];
