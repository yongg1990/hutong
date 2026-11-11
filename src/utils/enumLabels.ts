const enumLabels: Record<string, string> = {
  ACTIVE: '启用', INACTIVE: '停用', DISABLED: '禁用', ENABLED: '启用',
  DRAFT: '草稿', TESTED: '已测试', PUBLISHED: '已发布', RETIRED: '已退役', SUSPENDED: '已暂停',
  RECEIVED: '已接收', MAPPING: '映射中', MAPPED: '已映射', EVENT_ACCEPTED: '事件已受理',
  GOVERNANCE_REQUIRED: '待治理', RETRY_PENDING: '等待重试', ACCEPTED: '已受理',
  PENDING: '待处理', PROCESSING: '处理中', COMPLETED: '已完成', FAILED: '失败',
  REJECTED: '已拒绝', CONFIRMED: '已确认', SUBMITTED: '已提交', CANCELLED: '已取消',
  ANCHORED: '已存证', RUNNING: '运行中', SUCCESS: '成功', SUCCEEDED: '已成功',
  EVENT: '事件', OBJECT: '对象', BATCH: '批次', FILE: '文件', PROJECTION: '投影',
  STRING: '字符串', INTEGER: '整数', DECIMAL: '小数', NUMBER: '数值', BOOLEAN: '布尔值',
  DATE: '日期', DATETIME: '日期时间', ARRAY: '数组', VALUE: '值节点',
  PUBLIC: '公开', INTERNAL: '内部', SENSITIVE: '敏感', STRICT_SENSITIVE: '高度敏感',
  SYNC: '同步', ASYNC: '异步', REQUIRED: '必填', OPTIONAL: '可选', CONDITIONAL: '条件必填',
  REJECT: '拒绝', OMIT: '忽略', PASS: '通过',
  IDENTITY: '原值输出', CODE_MAP: '码值映射', UNIT_SCALE: '单位换算', REQUIRES_ADAPTER: '适配器转换',
  NONE: '不处理', REDACT: '遮盖', KEEP_LAST: '保留末尾字符',
  EVENT_PROPERTY: '事件基础属性', SCHEMA_FIELD: '来源字段',
  EVENT_ID: '事件 ID', SOURCE_BUSINESS_KEY: '来源业务键', OCCURRED_AT: '发生时间',
  RECEIVED_AT: '接收时间', SOURCE_SYSTEM_ID: '来源系统',
  EQ: '等于', IN: '属于集合', GE: '大于或等于', GT: '大于', LE: '小于或等于', LT: '小于',
  REQUEST: '请求提供', FIXED: '固定值', EXTERNAL: '外部提供', PLATFORM: '平台生成',
  API: '接口', MESSAGE: '消息', DATABASE: '数据库',
  QUALITY_EVIDENCE: '质量证据', TRACE_EVIDENCE: '追溯证据', BATCH_INPUT: '批次输入',
  TENANT_PRIVATE: '租户私有', SHARED_EXCHANGE: '共享交换', DATA_ELEMENT: '数据元',
  SAAS: '软件即服务', DEDICATED: '独立部署', HYBRID: '混合部署', EDGE_ONLY: '仅边缘部署',
  GOVERNMENT: '政府部门', REGULATOR: '监管机构', INDUSTRY_ASSOCIATION: '行业协会', ENTERPRISE: '企业',
  CHANGAN_CHAIN: '长安链'
};

export function enumLabel(value: string): string {
  return enumLabels[value] || value;
}
