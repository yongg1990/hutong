<template>
  <div>
    <PageHeader title="方案版本与字段配置" />
    <el-tabs v-model="tab"><el-tab-pane label="方案版本" name="versions" /><el-tab-pane label="字段映射" name="fields" /><el-tab-pane label="业务入参" name="params" /></el-tabs>
    <ResourceWorkbench v-if="tab === 'versions'" key="versions" ref="workbench" list-path="/openapi/v1/exchange-query/profiles/{profileId}/versions" save-path="/openapi/v1/exchange-query/profile-versions" detail-path="/openapi/v1/exchange-query/profile-versions/{id}" :required-filters="['profileId']" :filters="[{ key: 'profileId', label: '方案 ID' }]" :columns="versionColumns" :fields="versionFields" :paginated="false" :edit-statuses="['DRAFT', 'TESTED']" :normalize-payload="normalizeVersion" editable create-label="新建版本草稿"><template #row-actions="{ row }"><el-button link @click="openCopy(row)">复制版本</el-button></template></ResourceWorkbench>
    <ResourceWorkbench v-else-if="tab === 'fields'" key="fields" ref="workbench" list-path="/openapi/v1/exchange-query/profile-versions/{profileVersionId}/fields" save-path="/openapi/v1/exchange-query/profile-fields" detail-path="/openapi/v1/exchange-query/profile-fields/{id}" delete-path="/openapi/v1/exchange-query/profile-fields/{id}/delete" :required-filters="['profileVersionId']" :filters="[{ key: 'profileVersionId', label: '方案版本 ID' }]" :columns="fieldColumns" :fields="fieldFields" :paginated="false" :normalize-payload="normalizeField" editable create-label="新建字段映射" />
    <ResourceWorkbench v-else key="params" ref="workbench" list-path="/openapi/v1/exchange-query/profile-versions/{versionId}/params" detail-path="/openapi/v1/exchange-query/profile-versions/{versionId}/params/{id}" delete-path="/openapi/v1/exchange-query/profile-versions/{versionId}/params/{id}/delete" :required-filters="['versionId']" :filters="[{ key: 'versionId', label: '方案版本 ID' }]" :columns="parameterColumns" :fields="parameterFields" :paginated="false" :normalize-payload="normalizeParameter" update-method="PUT" editable create-label="新增业务入参" />
    <div class="actions">
      <el-input v-model="versionId" placeholder="方案版本 ID" style="max-width:240px" />
      <el-button :loading="busy" @click="versionAction('test')">测试版本</el-button><el-button type="primary" :loading="busy" @click="versionAction('publish')">发布版本</el-button>
      <el-button :loading="busy" @click="versionAction('retire')">退役版本</el-button><el-button :loading="busy" @click="loadSourceFields">来源字段与批量导入</el-button>
    </div>
    <el-dialog v-model="copyVisible" title="复制新草稿版本" width="min(520px,94vw)" :close-on-click-modal="false"><el-form label-position="top"><el-form-item label="来源版本 ID"><el-input :model-value="copySourceId" disabled /></el-form-item><el-form-item label="新版本号" required><el-input v-model="copyVersion" /></el-form-item></el-form><template #footer><el-button @click="copyVisible = false">取消</el-button><el-button type="primary" :loading="busy" @click="copy">复制</el-button></template>
    </el-dialog>
    <el-dialog v-model="sourceVisible" title="可选来源字段" width="min(1000px,94vw)" :close-on-click-modal="false">
      <LocalPaginatedTable :data="sourceFields" v-loading="busy" row-key="sourceSchemaFieldId" @selection-change="selectSources"><el-table-column type="selection" :reserve-selection="true" width="50" /><el-table-column prop="sourceSchemaFieldId" label="字段 ID" min-width="190" /><el-table-column prop="fieldName" label="字段代码" min-width="160" /><el-table-column prop="displayName" label="显示名称" min-width="150" /><el-table-column prop="dataType" label="类型" width="110" /><el-table-column prop="parentFieldId" label="父字段 ID" min-width="190" /></LocalPaginatedTable>
      <template #footer><el-button @click="sourceVisible = false">关闭</el-button><el-button type="primary" :loading="busy" :disabled="!selectedSourceIds.length" @click="importFields">导入选中字段</el-button></template>
    </el-dialog>
    <el-drawer v-model="resultVisible" title="操作结果" size="min(760px, 94vw)"><pre>{{ result }}</pre></el-drawer>
  </div>
</template>
<script setup lang="ts">
import LocalPaginatedTable from '@/components/common/LocalPaginatedTable.vue';
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PageHeader from '@/components/common/PageHeader.vue';
import ResourceWorkbench from '@/components/common/ResourceWorkbench.vue';
import { request, apiErrorMessage } from '@/api/client';
const tab = ref('versions'), versionId = ref(''), resultVisible = ref(false), result = ref(''), busy = ref(false);
const workbench = ref<InstanceType<typeof ResourceWorkbench>>(), copyVisible = ref(false), copySourceId = ref(''), copyVersion = ref(''), copySource = ref<any>(null);
const sourceVisible = ref(false), sourceFields = ref<any[]>([]), selectedSourceIds = ref<string[]>([]), sourceVersionId = ref('');
const base = '/openapi/v1/exchange-query/profile-versions';
function selectSources(rows: any[]) { selectedSourceIds.value = rows.map(row => row.sourceSchemaFieldId); }
const versionColumns = [{ key: 'id', label: '版本 ID', width: 200 }, { key: 'profileId', label: '方案 ID' }, { key: 'version', label: '版本号' }, { key: 'sourceSchemaId', label: '来源 Schema ID' }, { key: 'responseMode', label: '返回方式' }, { key: 'pagination', label: '启用分页' }, { key: 'status', label: '状态' }];
const versionFields = [{ key: 'profileId', label: '方案 ID', required: true, immutable: true }, { key: 'version', label: '版本号', required: true, initial: '1.0.0' }, { key: 'sourceSchemaId', label: '已发布来源 Schema ID', required: true, immutable: true }, { key: 'responseMode', label: '返回方式', options: ['SYNC', 'ASYNC'], initial: 'SYNC' }, { key: 'pagination', label: '启用分页', type: 'boolean', initial: false }, { key: 'paginationConfig', label: '分页配置 JSON', type: 'json', initial: 'null' }];
const fieldColumns = [{ key: 'id', label: '字段 ID', width: 200 }, { key: 'fieldCode', label: '字段代码' }, { key: 'targetPath', label: '输出路径' }, { key: 'nodeType', label: '节点类型' }, { key: 'sourceSchemaFieldId', label: '来源字段 ID' }, { key: 'transformType', label: '转换操作' }, { key: 'maskType', label: '脱敏操作' }];
const fieldFields = [{ key: 'profileVersionId', label: '方案版本 ID', required: true }, { key: 'parentFieldId', label: '父字段 ID' }, { key: 'nodeType', label: '节点类型', required: true, options: ['OBJECT', 'ARRAY', 'VALUE'], initial: 'VALUE' }, { key: 'fieldCode', label: '字段代码', required: true }, { key: 'targetPath', label: '输出路径', required: true }, { key: 'sourceSchemaFieldId', label: '来源标准字段 ID' }, { key: 'transformType', label: '转换操作', options: ['IDENTITY', 'CODE_MAP', 'UNIT_SCALE', 'REQUIRES_ADAPTER'], initial: 'IDENTITY' }, { key: 'transformConfig', label: '转换参数 JSON', type: 'json', initial: '{}' }, { key: 'maskType', label: '脱敏操作', options: ['NONE', 'REDACT', 'KEEP_LAST'], initial: 'NONE' }, { key: 'maskConfig', label: '脱敏参数 JSON', type: 'json', initial: '{}' }, { key: 'ordinal', label: '输出顺序', type: 'number', required: true, initial: '0' }];
const parameterColumns = [{ key: 'id', label: '入参 ID', width: 200 }, { key: 'parameterCode', label: '入参代码' }, { key: 'parameterName', label: '入参名称' }, { key: 'dataType', label: '类型' }, { key: 'targetType', label: '查询目标' }, { key: 'comparisonOperator', label: '比较方式' }, { key: 'valueSource', label: '取值来源' }];
const parameterFields = [
  { key: 'parameterCode', label: '入参代码', required: true }, { key: 'parameterName', label: '入参名称', required: true }, { key: 'description', label: '说明' },
  { key: 'dataType', label: '数据类型', required: true, options: ['STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME'], initial: 'STRING' },
  { key: 'required', label: '必填', type: 'boolean', required: true, initial: false },
  { key: 'targetType', label: '查询目标', required: true, options: ['EVENT_PROPERTY', 'SCHEMA_FIELD'], initial: 'EVENT_PROPERTY' },
  { key: 'eventProperty', label: '事件基础属性', options: ['EVENT_ID', 'SOURCE_BUSINESS_KEY', 'OCCURRED_AT', 'RECEIVED_AT', 'SOURCE_SYSTEM_ID'], initial: 'SOURCE_BUSINESS_KEY' },
  { key: 'sourceSchemaFieldId', label: '来源 Schema 字段 ID' }, { key: 'comparisonOperator', label: '比较方式', required: true, options: ['EQ', 'IN', 'GE', 'GT', 'LE', 'LT'], initial: 'EQ' },
  { key: 'valueSource', label: '取值来源', options: ['REQUEST', 'FIXED'], initial: 'REQUEST' }, { key: 'ordinal', label: '展示顺序', type: 'number', required: true, initial: 0 },
  { key: 'minLength', label: '字符串最小长度', type: 'number', min: 0 }, { key: 'maxLength', label: '字符串最大长度', type: 'number', min: 1 },
  { key: 'minimum', label: '数值最小值', type: 'decimal' }, { key: 'maximum', label: '数值最大值', type: 'decimal' }, { key: 'maxItems', label: 'IN 最多元素数', type: 'number', min: 1 },
  ...[{ key: 'enumValues', label: '允许值数组 JSON' }, { key: 'defaultValue', label: '默认值或固定值 JSON' }, { key: 'exampleValue', label: '示例值 JSON' }].map(field => ({ ...field, type: 'json', initial: 'null' }))
];
function normalizeVersion(body: Record<string, any>) { if (body.responseMode === 'ASYNC' && body.pagination) throw new Error('异步返回不支持分页'); if (!body.pagination) body.paginationConfig = null; return body; }
function normalizeField(body: Record<string, any>) { if (body.nodeType !== 'OBJECT' && !/^\d+$/.test(body.sourceSchemaFieldId || '')) throw new Error('VALUE 和 ARRAY 节点须填写来源标准字段 ID'); return body; }
function normalizeParameter(body: Record<string, any>) {
  if (body.targetType === 'SCHEMA_FIELD') { if (!/^\d+$/.test(body.sourceSchemaFieldId || '')) throw new Error('请填写来源 Schema 字段 ID'); delete body.eventProperty; } else { delete body.sourceSchemaFieldId; }
  if (body.dataType !== 'STRING') { delete body.minLength; delete body.maxLength; }
  if (!['INTEGER','DECIMAL'].includes(body.dataType)) { delete body.minimum; delete body.maximum; }
  if (['STRING','BOOLEAN'].includes(body.dataType) && !['EQ','IN'].includes(body.comparisonOperator)) throw new Error('字符串和布尔类型仅支持 EQ / IN');
  if (body.comparisonOperator !== 'IN') delete body.maxItems;
  if (body.valueSource === 'FIXED' && body.defaultValue == null) throw new Error('固定来源须配置固定值');
  return body;
}
function show(value: unknown) { result.value = JSON.stringify(value, null, 2); resultVisible.value = true; }
async function versionAction(action: 'test' | 'publish' | 'retire') {
  if (busy.value) return;
  if (!/^\d+$/.test(versionId.value.trim())) { ElMessage.warning('请输入方案版本 ID'); return; }
  if (action !== 'test') { try { await ElMessageBox.confirm(action === 'publish' ? '确认发布该方案版本？' : '确认退役该方案版本？', '版本状态变更', { type: 'warning' }); } catch { return; } }
  busy.value = true; try { show(await request.post(`${base}/${versionId.value.trim()}/${action}`)); await workbench.value?.load(); } catch (error) { ElMessage.error(apiErrorMessage(error, '操作失败')); } finally { busy.value = false; }
}
async function openCopy(row: any) { if (busy.value) return; busy.value = true; try { copySource.value = await request.get(`${base}/${row.id}`); copySourceId.value = row.id; copyVersion.value = ''; copyVisible.value = true; } catch (e) { ElMessage.error(apiErrorMessage(e, '加载版本失败')); } finally { busy.value = false; } }
async function copy() { if (busy.value || !copyVersion.value.trim()) return; busy.value = true; try { const source = copySource.value; show(await request.post(`${base}/${copySourceId.value}/copy`, { profileId: source.profileId, sourceSchemaId: source.sourceSchemaId, version: copyVersion.value.trim() })); copyVisible.value = false; await workbench.value?.load(); } catch (e) { ElMessage.error(apiErrorMessage(e, '复制失败')); } finally { busy.value = false; } }
async function loadSourceFields() { if (busy.value) return; if (!/^\d+$/.test(versionId.value.trim())) return ElMessage.warning('请输入方案版本 ID'); busy.value = true; sourceFields.value = []; selectedSourceIds.value = []; sourceVisible.value = true; try { sourceVersionId.value = versionId.value.trim(); sourceFields.value = await request.get(`${base}/${sourceVersionId.value}/source-fields`); } catch (e) { ElMessage.error(apiErrorMessage(e, '加载来源字段失败')); } finally { busy.value = false; } }
async function importFields() {
  if (busy.value || !selectedSourceIds.value.length) return;
  busy.value = true; try { show(await request.post(`${base}/${sourceVersionId.value}/fields/import`, { sourceSchemaFieldIds: selectedSourceIds.value })); sourceVisible.value = false; await workbench.value?.load(); } catch (e) { ElMessage.error(apiErrorMessage(e, '导入失败')); } finally { busy.value = false; }
}
</script>
<style scoped>.actions{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style>
