import { request } from './client';

export type ConfigKind = 'version' | 'dataset' | 'rule' | 'case' | 'binding';
export type ConfigRecord = Record<string, any>;
export interface ConfigField {
  key: string;
  label: string;
  required?: boolean;
  type?: 'json' | 'date' | 'number';
  options?: string[];
  initial?: string | number;
}
export const configDefinitions: Record<ConfigKind, { title: string; path: string; fields: ConfigField[] }> = {
  version: { title: '版本草稿', path: 'profile-versions', fields: [
    { key: 'profileId', label: '规范包 ID', required: true },
    { key: 'version', label: '版本号', required: true, initial: '1.0.0' },
    { key: 'effectiveFrom', label: '生效开始', required: true, type: 'date' },
    { key: 'effectiveTo', label: '生效结束', type: 'date' }
  ] },
  dataset: { title: '数据集', path: 'datasets', fields: [
    { key: 'profileVersionId', label: '规范版本 ID', required: true },
    { key: 'datasetCode', label: '数据集代码', required: true },
    { key: 'datasetName', label: '数据集名称', required: true },
    { key: 'outputFormat', label: '输出格式', required: true, options: ['JSON'], initial: 'JSON' },
    { key: 'rootSelector', label: '根选择器', required: true },
    { key: 'status', label: '状态', required: true, options: ['ACTIVE', 'INACTIVE'], initial: 'ACTIVE' }
  ] },
  rule: { title: '字段规则', path: 'field-rules', fields: [
    { key: 'datasetId', label: '数据集 ID', required: true },
    { key: 'targetPath', label: '目标字段路径', required: true },
    { key: 'dataElementCode', label: '统一数据元代码', required: true },
    { key: 'sourceSelector', label: '源选择器', required: true },
    { key: 'transformJson', label: '转换规则 JSON', required: true, type: 'json', initial: '{}' },
    { key: 'requiredPolicy', label: '必选策略', required: true, options: ['REQUIRED', 'OPTIONAL', 'CONDITIONAL'], initial: 'REQUIRED' },
    { key: 'missingPolicy', label: '缺失策略', required: true, options: ['REJECT', 'OMIT'], initial: 'REJECT' },
    { key: 'valueSetCode', label: '值域代码' },
    { key: 'securityClass', label: '安全级别', required: true, options: ['PUBLIC', 'INTERNAL', 'SENSITIVE', 'STRICT_SENSITIVE'], initial: 'PUBLIC' },
    { key: 'ordinal', label: '输出顺序', required: true, type: 'number', initial: 0 }
  ] },
  case: { title: '一致性用例', path: 'conformance-cases', fields: [
    { key: 'profileVersionId', label: '规范版本 ID', required: true },
    { key: 'caseCode', label: '用例代码', required: true },
    { key: 'inputFixtureRef', label: '已审核输入样例引用', required: true },
    { key: 'expectedFixtureRef', label: '已审核期望样例引用' },
    { key: 'expectedResult', label: '期望结果', required: true, options: ['PASS', 'REJECT'], initial: 'PASS' }
  ] },
  binding: { title: '项目绑定', path: 'bindings', fields: [
    { key: 'projectSpaceId', label: '项目空间 ID', required: true },
    { key: 'profileVersionId', label: '规范版本 ID', required: true },
    { key: 'deliveryConfigJson', label: '交付配置 JSON', required: true, type: 'json', initial: '{}' },
    { key: 'status', label: '状态', required: true, options: ['ACTIVE', 'INACTIVE'], initial: 'ACTIVE' }
  ] }
};
const encode = encodeURIComponent;
export const exchangeConfigApi = {
  save: (kind: ConfigKind, data: ConfigRecord, id?: string): Promise<ConfigRecord> => request.post(`/exchange-query/${configDefinitions[kind].path}${id ? `/${encode(id)}` : ''}`, data),
  list: (kind: ConfigKind, parentId: string): Promise<ConfigRecord[]> => {
    const paths: Record<ConfigKind, string> = {
      version: `profiles/${encode(parentId)}/versions`,
      dataset: `profile-versions/${encode(parentId)}/datasets`,
      rule: `datasets/${encode(parentId)}/field-rules`,
      case: `profile-versions/${encode(parentId)}/conformance-cases`,
      binding: `projects/${encode(parentId)}/bindings`
    };
    return request.get(`/exchange-query/${paths[kind]}`);
  },
  versionAction: (id: string, action: 'test' | 'publish'): Promise<ConfigRecord> => request.post(`/exchange-query/profile-versions/${encode(id)}/${action}`),
  metadata: (code: string, version?: string): Promise<ConfigRecord> => request.get(`/exchange-query/metadata/profiles/${encode(code)}`, { params: { version: version || undefined } }),
  query: (kind: 'objects' | 'events' | 'status', id: string, params: ConfigRecord): Promise<ConfigRecord> => request.get(`/exchange-query/${kind === 'objects' ? 'objects' : 'events'}/${encode(id)}${kind === 'status' ? '/status' : ''}`, { params })
};
