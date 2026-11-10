import { computed, ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import FilterBar from '@/components/common/FilterBar.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import { apiErrorMessage } from '@/api/client';
import { eventsApi, type SchemaSnapshot, type SchemaTestResult, type EventSchemaField, type EventSchemaReferenceRule, type EventTypeDetail } from '@/api/events';

export function useEventConfiguration() {
type EventTypeRow = EventTypeDetail;
const emptySchemaFilters = () => ({ eventType: '', schemaVersion: '', status: '' });
const emptyEventFilters = () => ({ eventType: '', scenarioCode: '', status: '' });
const queryForm = ref(emptySchemaFilters()), appliedSchemaFilters = ref(emptySchemaFilters());
const eventFilters = ref(emptyEventFilters()), appliedEventFilters = ref(emptyEventFilters());
const schemaPage = ref(1), schemaTotal = ref(0), eventPage = ref(1), eventTotal = ref(0);
const paramsFor = (values: Record<string, string>) => Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
const searchSchemas = () => { appliedSchemaFilters.value = { ...queryForm.value }; schemaPage.value = 1; void querySchema(); };
const searchEventTypes = () => { appliedEventFilters.value = { ...eventFilters.value }; eventPage.value = 1; void loadEventTypes(); };
const resetEventTypes = () => { eventFilters.value = emptyEventFilters(); appliedEventFilters.value = emptyEventFilters(); eventPage.value = 1; void loadEventTypes(); };
const schemas = ref<SchemaSnapshot[]>([]);
const eventTypes = ref<EventTypeRow[]>([]);
const querying = ref(false);
const eventTypesLoading = ref(false);
let eventTypeRequests = 0;
const publishingKey = ref('');
const eventTypeVisible = ref(false);
const editingEventTypeId = ref(''), eventTypeLockVersion = ref(0);
const eventTypeDetail = ref<EventTypeDetail | null>(null);
const creatingEventType = ref(false);
const eventTypeForm = ref({ eventType: '', eventName: '', scenarioCode: '', description: '' });
const schemaVisible = ref(false);
const creatingSchema = ref(false);
const testingDraft = ref(false);
const draftTestResult = ref<SchemaTestResult | null>(null);
const dataTypes = ['STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME', 'OBJECT', 'ARRAY'];
const emptyField = (): EventSchemaField => ({ fieldName: '', displayName: '', dataType: 'STRING', required: false, valueSource: 'EXTERNAL' });
const emptyRule = (): EventSchemaReferenceRule => ({ fieldName: '', targetType: '', namespace: '', required: false, onNotFound: '', onAmbiguous: '' });
const schemaForm = ref({ eventType: '', schemaVersion: '', fields: [emptyField()], referenceRules: [] as EventSchemaReferenceRule[] });
const editingSchemaId = ref('');
const editingLockVersion = ref<number | null>(null);
const fieldKeys = ref([0]);
const ruleKeys = ref<number[]>([]);
let nextRowKey = 1;
const addField = () => { schemaForm.value.fields.push(emptyField()); fieldKeys.value.push(nextRowKey++); };
const addRule = () => { schemaForm.value.referenceRules.push(emptyRule()); ruleKeys.value.push(nextRowKey++); };
const generators = ref<any[]>([]);
const invalidGeneratorFields = new WeakSet<object>();
const updateGenerator = (field: EventSchemaField, text: string) => {
  try { const value = JSON.parse(text); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); field.generatorConfig = value; invalidGeneratorFields.delete(field); }
  catch { invalidGeneratorFields.add(field); ElMessage.warning('生成器参数必须为 JSON 对象'); }
};
const removeField = async (index: number) => {
  if (creatingSchema.value) return;
  const field = schemaForm.value.fields[index];
  if (field.id && editingSchemaId.value) {
    creatingSchema.value = true;
    try { await ElMessageBox.confirm(`确认删除字段 ${field.fieldName}？`, '删除字段', { type: 'warning' }); const result = await eventsApi.deleteSchemaField(editingSchemaId.value, field.id, editingLockVersion.value!); editingLockVersion.value = result.lockVersion; upsertSchema(result); }
    catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(apiErrorMessage(error, '删除失败')); return; }
    finally { creatingSchema.value = false; }
  }
  schemaForm.value.fields.splice(index, 1); fieldKeys.value.splice(index, 1);
};
const saveField = async (index: number) => {
  if (!editingSchemaId.value || creatingSchema.value) return;
  creatingSchema.value = true;
  try {
    const field = normalizeField(schemaForm.value.fields[index]); validateSchema([field], []);
    if (field.valueSource === 'PLATFORM' && invalidGeneratorFields.has(schemaForm.value.fields[index])) throw new Error('请修正生成器参数 JSON 后保存');
    if (field.valueSource === 'PLATFORM' && !field.generatorCode) throw new Error('请选择平台生成器');
    const result = await eventsApi.saveSchemaField(editingSchemaId.value, field, editingLockVersion.value!);
    editingLockVersion.value = result.lockVersion; upsertSchema(result);
    const saved = result.fields.find(item => field.id ? item.id === field.id : item.fieldName === field.fieldName && (item.parentFieldId || '') === (field.parentFieldId || ''));
    if (saved) schemaForm.value.fields[index] = { ...saved };
    ElMessage.success('字段已保存');
  } catch (error) { ElMessage.error(apiErrorMessage(error, '保存字段失败')); } finally { creatingSchema.value = false; }
};
const copySchema = async (row: SchemaSnapshot) => {
  try { const { value } = await ElMessageBox.prompt('请输入新版本号', '复制已发布 Schema', { inputPattern: /^\d+\.\d+\.\d+$/, inputErrorMessage: '请输入语义版本，如 1.1.0' }); const result = await eventsApi.copySchema(row.id, value); await querySchema(); await openEditSchema(result); }
  catch (error) { if (error !== 'cancel' && error !== 'close') ElMessage.error(apiErrorMessage(error, '复制失败')); }
};
const removeRule = (index: number) => { schemaForm.value.referenceRules.splice(index, 1); ruleKeys.value.splice(index, 1); };
const testVisible = ref(false);
const testing = ref(false);
const testForm = ref({ id: '', eventType: '', schemaVersion: '' });
const testResult = ref<SchemaTestResult | null>(null);
const drawerVisible = ref(false);
const selectedSchema = ref<SchemaSnapshot | null>(null);
const formattedSchema = computed(() => {
  if (!selectedSchema.value) return '{}';
  const { schemaJson, ...detail } = selectedSchema.value;
  return JSON.stringify(detail, null, 2);
});
const schemaKey = (row: Pick<SchemaSnapshot, 'eventType' | 'schemaVersion'>) => row.eventType + '@' + row.schemaVersion;
function openCreateEventType() {
  editingEventTypeId.value = ''; eventTypeLockVersion.value = 0;
  eventTypeForm.value = { eventType: '', eventName: '', scenarioCode: '', description: '' }; eventTypeVisible.value = true;
}
async function viewEventType(row: EventTypeRow) {
  try { eventTypeDetail.value = await eventsApi.getEventType(row.id); }
  catch (error) { ElMessage.error(apiErrorMessage(error, '查询事件类型失败')); }
}
async function editEventType(row: EventTypeRow) {
  try {
    const detail = await eventsApi.getEventType(row.id);
    editingEventTypeId.value = detail.id; eventTypeLockVersion.value = detail.lockVersion;
    eventTypeForm.value = { eventType: detail.eventType, eventName: detail.eventName, scenarioCode: detail.scenarioCode, description: detail.description || '' }; eventTypeVisible.value = true;
  } catch (error) { ElMessage.error(apiErrorMessage(error, '加载事件类型失败')); }
}
async function toggleEventType(row: EventTypeRow) {
  try {
    const detail = await eventsApi.getEventType(row.id);
    await eventsApi.setEventTypeStatus(detail.id, detail.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE', detail.lockVersion);
    await loadEventTypes(); ElMessage.success('事件类型状态已更新');
  } catch (error) { ElMessage.error(apiErrorMessage(error, '更新事件类型状态失败')); }
}
const upsertSchema = (schema: SchemaSnapshot) => {
  const index = schemas.value.findIndex(item => schemaKey(item) === schemaKey(schema));
  if (index >= 0) schemas.value.splice(index, 1, schema);
  else schemas.value.unshift(schema);
};
const optionalText = (value?: string) => value?.trim() || undefined;
const numeric = (value?: number) => value == null ? undefined : value;
const normalizeField = (field: EventSchemaField): EventSchemaField => ({
  ...(field.id ? { id: field.id } : {}),
  parentFieldId: optionalText(field.parentFieldId), valueSource: field.valueSource || 'EXTERNAL',
  ...(field.dataType === 'ARRAY' ? { itemDataType: optionalText(field.itemDataType), minItems: numeric(field.minItems), maxItems: numeric(field.maxItems) } : {}),
  ...(field.valueSource === 'PLATFORM' ? { generatorCode: optionalText(field.generatorCode), generatorConfig: field.generatorConfig } : {}),
  fieldName: field.fieldName.trim(), displayName: field.displayName.trim(), dataType: field.dataType, required: field.required,
  ...(field.dataType === 'STRING' ? { minLength: numeric(field.minLength), maxLength: numeric(field.maxLength), pattern: optionalText(field.pattern) } : {}),
  ...(['INTEGER', 'DECIMAL'].includes(field.dataType) ? { minimum: numeric(field.minimum), maximum: numeric(field.maximum), exclusiveMinimum: field.exclusiveMinimum, exclusiveMaximum: field.exclusiveMaximum, multipleOf: numeric(field.multipleOf) } : {}),
  description: optionalText(field.description), dataElementCode: optionalText(field.dataElementCode),
  valueSetCode: optionalText(field.valueSetCode), valueSetVersion: optionalText(field.valueSetVersion),
  codeSchemeCode: optionalText(field.codeSchemeCode), codeSchemeVersion: optionalText(field.codeSchemeVersion)
});
const normalizeRule = (rule: EventSchemaReferenceRule): EventSchemaReferenceRule => ({
  ...(rule.id ? { id: rule.id } : {}), fieldName: rule.fieldName.trim(), targetType: rule.targetType.trim(),
  namespace: rule.namespace.trim(), required: rule.required, onNotFound: rule.onNotFound.trim(), onAmbiguous: rule.onAmbiguous.trim()
});
const validateSchema = (fields: EventSchemaField[], rules: EventSchemaReferenceRule[]) => {
  if (!fields.length || fields.some(field => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(field.fieldName) || !field.displayName || !dataTypes.includes(field.dataType))) throw new Error('请填写有效的字段代码、显示名称和数据类型');
  if (new Set(fields.map(field => field.fieldName)).size !== fields.length) throw new Error('字段代码不能重复');
  for (const field of fields) {
    if (field.minLength != null && field.maxLength != null && field.minLength > field.maxLength) throw new Error(`${field.fieldName} 的最小长度不能大于最大长度`);
    if (field.minimum != null && field.maximum != null && field.minimum > field.maximum) throw new Error(`${field.fieldName} 的最小值不能大于最大值`);
    if (field.multipleOf != null && field.multipleOf <= 0) throw new Error(`${field.fieldName} 的数值步长必须大于 0`);
    if (field.minItems != null && field.maxItems != null && field.minItems > field.maxItems) throw new Error('数组最少元素数不能大于最多元素数');
    if (field.parentFieldId && !/^\d+$/.test(field.parentFieldId)) throw new Error('父字段 ID 须为数字字符串');
  }
  if (rules.some(rule => !fields.some(field => field.fieldName === rule.fieldName) || !rule.targetType || !rule.namespace || !rule.onNotFound || !rule.onAmbiguous)) throw new Error('引用规则须选择已有字段并填写目标类型、命名空间和处理策略');
};
const querySchema = async () => {
  querying.value = true;
  try {
    const result = await eventsApi.listSchemaDefinitions({ ...paramsFor(appliedSchemaFilters.value), page: schemaPage.value, size: 10 });
    schemas.value = result.records;
    schemaTotal.value = Number(result.total || 0);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '查询 Schema 失败'));
  } finally {
    querying.value = false;
  }
};
const resetQuery = () => { queryForm.value = emptySchemaFilters(); appliedSchemaFilters.value = emptySchemaFilters(); schemaPage.value = 1; void querySchema(); };
const loadEventTypes = async () => {
  ++eventTypeRequests;
  eventTypesLoading.value = true;
  try {
    const result = await eventsApi.listEventTypes({ ...paramsFor(appliedEventFilters.value), page: eventPage.value, size: 10 });
    eventTypes.value = result.records || [];
    eventTotal.value = Number(result.total || 0);
  } catch (error) { ElMessage.error(apiErrorMessage(error, '查询事件类型失败')); } finally { eventTypesLoading.value = --eventTypeRequests > 0; }
};
const createEventType = async () => {
  if (creatingEventType.value) return;
  if (!/^[A-Z][A-Z0-9_]*$/.test(eventTypeForm.value.eventType.trim())) return ElMessage.warning('事件类型代码须为大写字母、数字及下划线');
  const form = eventTypeForm.value;
  if (!form.eventType.trim() || !form.eventName.trim() || !form.scenarioCode.trim()) {
    ElMessage.warning('请填写事件类型、名称和场景代码');
    return;
  }
  creatingEventType.value = true;
  try {
    const data = {
      eventType: form.eventType.trim(),
      eventName: form.eventName.trim(),
      scenarioCode: form.scenarioCode.trim(),
      description: form.description.trim()
    };
    const result = editingEventTypeId.value
      ? await eventsApi.updateEventType(editingEventTypeId.value, { eventName: data.eventName, scenarioCode: data.scenarioCode, description: data.description, lockVersion: eventTypeLockVersion.value })
      : await eventsApi.createEventType(data);
    await loadEventTypes();
    eventTypeVisible.value = false;
    schemaForm.value.eventType = result.eventType;
    ElMessage.success(editingEventTypeId.value ? '事件类型更新成功' : '事件类型创建成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '创建事件类型失败'));
  } finally {
    creatingEventType.value = false;
  }
};
const openSchemaDialog = () => {
  draftTestResult.value = null;
  editingSchemaId.value = '';
  editingLockVersion.value = null;
  schemaForm.value = {
    eventType: queryForm.value.eventType || schemaForm.value.eventType,
    schemaVersion: queryForm.value.schemaVersion,
    fields: [], referenceRules: []
  };
  fieldKeys.value = [nextRowKey++];
  ruleKeys.value = [];
  schemaVisible.value = true;
};
const openEditSchema = async (row: SchemaSnapshot) => {
  try {
    if (!generators.value.length) { try { generators.value = await eventsApi.generators(); } catch (error) { ElMessage.error(apiErrorMessage(error, '加载生成器失败')); } }
    const detail = await eventsApi.getSchemaDefinition(row.id);
    if (detail.status === 'PUBLISHED') throw new Error('已发布版本不可编辑，请复制新草稿');
    draftTestResult.value = null;
    editingSchemaId.value = detail.id;
    editingLockVersion.value = detail.lockVersion;
    schemaForm.value = { eventType: detail.eventType, schemaVersion: detail.schemaVersion, fields: detail.fields.map(field => ({ ...field })), referenceRules: detail.referenceRules.map(rule => ({ ...rule })) };
    fieldKeys.value = detail.fields.map(() => nextRowKey++);
    ruleKeys.value = detail.referenceRules.map(() => nextRowKey++);
    schemaVisible.value = true;
  } catch (error) { ElMessage.error(apiErrorMessage(error, '加载 Schema 草稿失败')); }
};
const saveSchemaDraft = async () => {
  if (creatingSchema.value) return;
  const form = schemaForm.value;
  if (!form.eventType.trim() || !form.schemaVersion.trim()) {
    ElMessage.warning('请输入事件类型和 Schema 版本');
    return;
  }
  const fields: EventSchemaField[] = [], rules: EventSchemaReferenceRule[] = [];
  try {
    if (!/^\d+\.\d+\.\d+$/.test(form.schemaVersion.trim())) throw new Error('请输入语义版本，如 1.0.0');
    if (editingSchemaId.value && editingLockVersion.value == null) throw new Error('草稿缺少乐观锁版本，请重新打开编辑');
  } catch (error) {
    ElMessage.warning((error as Error).message);
    return;
  }
  creatingSchema.value = true;
  try {
    const result = editingSchemaId.value
      ? await eventsApi.updateSchemaDraft(editingSchemaId.value, { eventType: form.eventType.trim(), schemaVersion: form.schemaVersion.trim(), fields, referenceRules: rules, lockVersion: editingLockVersion.value! })
      : await eventsApi.createSchemaDraft({ eventType: form.eventType.trim(), schemaVersion: form.schemaVersion.trim(), fields, referenceRules: rules });
    upsertSchema(result);
    editingSchemaId.value = result.id; editingLockVersion.value = result.lockVersion;
    if (!generators.value.length) { try { generators.value = await eventsApi.generators(); } catch (error) { ElMessage.error(apiErrorMessage(error, '加载生成器失败')); } }
    ElMessage.success('草稿基本信息已保存');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '保存 Schema 草稿失败'));
  } finally {
    creatingSchema.value = false;
  }
};
const openTestDialog = (row: SchemaSnapshot) => {
  testResult.value = null;
  testForm.value = { id: row.id, eventType: row.eventType, schemaVersion: row.schemaVersion };
  testVisible.value = true;
};
const testSchema = async () => {
  if (testing.value) return;
  testing.value = true;
  try {
    testResult.value = await eventsApi.testSchemaDefinition(testForm.value.id);
    if (editingSchemaId.value === testForm.value.id) { const current = await eventsApi.getSchemaDefinition(editingSchemaId.value); editingLockVersion.value = current.lockVersion; }
    await querySchema();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '测试 Schema 失败'));
  } finally {
    testing.value = false;
  }
};
const publishSchema = async (row: SchemaSnapshot) => {
  if (publishingKey.value) return;
  publishingKey.value = schemaKey(row);
  try {
    const result = await eventsApi.publishEventSchema(row.id);
    upsertSchema(result);
    ElMessage.success('Schema 发布成功');
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '发布 Schema 失败'));
  } finally {
    publishingKey.value = '';
  }
};
const viewSchema = async (row: SchemaSnapshot) => {
  try { selectedSchema.value = await eventsApi.getSchemaDefinition(row.id); drawerVisible.value = true; }
  catch (error) { ElMessage.error(apiErrorMessage(error, '查询 Schema 失败')); }
};
const testUnsavedSchema = async () => {
  if (!editingSchemaId.value) return ElMessage.warning('请先创建空草稿并保存字段');
  openTestDialog({ id: editingSchemaId.value, eventType: schemaForm.value.eventType, schemaVersion: schemaForm.value.schemaVersion } as SchemaSnapshot);
};
return { eventTypesLoading, updateGenerator, generators, saveField, copySchema, emptySchemaFilters, emptyEventFilters, queryForm, appliedSchemaFilters, eventFilters, appliedEventFilters, schemaPage, schemaTotal, eventPage, eventTotal, paramsFor, searchSchemas, searchEventTypes, resetEventTypes, schemas, eventTypes, querying, publishingKey, eventTypeVisible, editingEventTypeId, eventTypeLockVersion, eventTypeDetail, creatingEventType, eventTypeForm, schemaVisible, creatingSchema, testingDraft, draftTestResult, dataTypes, emptyField, emptyRule, schemaForm, editingSchemaId, editingLockVersion, fieldKeys, ruleKeys, nextRowKey, addField, addRule, removeField, removeRule, testVisible, testing, testForm, testResult, drawerVisible, selectedSchema, formattedSchema, schemaKey, openCreateEventType, viewEventType, editEventType, toggleEventType, upsertSchema, optionalText, numeric, normalizeField, normalizeRule, validateSchema, querySchema, resetQuery, loadEventTypes, createEventType, openSchemaDialog, openEditSchema, saveSchemaDraft, openTestDialog, testSchema, publishSchema, viewSchema, testUnsavedSchema };
}
