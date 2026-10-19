<template>
  <div>
    <PageHeader title="对接助手" />
    <el-form label-position="top" :disabled="busy" class="selection-grid">
      <el-form-item label="租户" required><ApiOptionSelect v-model="selection.tenantId" :loader="loadTenants" value-key="tenantId" :label="tenantLabel" /></el-form-item>
      <el-form-item label="项目空间" required><ApiOptionSelect v-model="selection.projectSpaceId" :loader="loadProjects" value-key="projectSpaceId" :label="projectLabel" /></el-form-item>
      <el-form-item label="来源系统" required><ApiOptionSelect v-model="selection.sourceSystemId" :loader="loadSources" value-key="sourceSystemId" :label="sourceLabel" :disabled="!selection.tenantId" :scope="selection.tenantId" /></el-form-item>
      <el-form-item label="来源密钥" required><ApiOptionSelect v-model="selection.sourceSystemKeyId" :loader="loadKeys" value-key="id" :label="keyLabel" :disabled="!selection.sourceSystemId" :scope="selection.sourceSystemId" @select="selectedKey = $event || null" /></el-form-item>
      <el-form-item label="授权事件" required><ApiOptionSelect v-model="selection.eventType" :loader="loadEvents" value-key="eventType" :label="eventLabel" :disabled="!selection.tenantId || !selection.projectSpaceId" :scope="eventScope" /></el-form-item>
      <el-form-item label="Schema 版本" required><ApiOptionSelect v-model="selection.schemaVersion" :loader="loadSchemas" value-key="schemaVersion" :label="schemaLabel" :disabled="!selection.eventType" :scope="schemaScope" @select="selectSchema" /></el-form-item>
      <el-form-item label="幂等键"><el-input v-model="idempotencyKey" :maxlength="128" clearable /></el-form-item>
    </el-form>
    <el-descriptions v-if="selectedKey" :column="2" border class="section">
      <el-descriptions-item label="密钥算法">{{ selectedKey.keyAlgorithm }}</el-descriptions-item><el-descriptions-item label="数据算法">{{ selectedKey.dataAlgorithm }}</el-descriptions-item>
      <el-descriptions-item label="平台公钥" :span="2"><el-input :model-value="selectedKey.publicKey" type="textarea" :rows="3" readonly /></el-descriptions-item>
      <el-descriptions-item label="对接方公钥" :span="2"><el-input :model-value="selectedKey.clientPublicKey" type="textarea" :rows="3" readonly /></el-descriptions-item>
    </el-descriptions>
    <template v-if="schema">
      <div class="section-heading"><h2>已发布 Schema</h2><el-button link @click="schemaVisible = true">完整定义</el-button></div>
      <div class="digest">{{ schema.contentDigest }}</div>
      <el-table :data="schema.fields" empty-text="暂无字段">
        <el-table-column prop="fieldName" label="字段代码" min-width="150" /><el-table-column prop="displayName" label="名称" min-width="140" />
        <el-table-column prop="dataType" label="类型" width="110" /><el-table-column label="必填" width="80"><template #default="{ row }">{{ row.required ? '是' : '否' }}</template></el-table-column>
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="valueSetCode" label="值域" min-width="140" /><el-table-column prop="codeSchemeCode" label="编码体系" min-width="140" />
      </el-table>
    </template>
    <div class="section-heading"><h2>标准事件样例</h2><el-button :icon="Refresh" :disabled="!schema || busy" @click="resetSample">重置样例</el-button></div>
    <fieldset :disabled="busy"><JsonEditor v-model="sampleEventJson" :rows="15" label="标准事件 JSON" /></fieldset>
    <div class="actions"><el-button type="primary" :icon="Document" :loading="generating" :disabled="!ready || busy" @click="generate">生成明文模板</el-button></div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <template v-if="example">
      <div class="section-heading"><h2>SDK 明文输入</h2><div class="actions"><el-button :icon="Download" @click="download('plaintext-request.json', plaintext)">下载明文</el-button><el-button type="primary" :loading="validating" :disabled="busy || !plaintext.trim()" @click="validate">校验明文</el-button></div></div>
      <el-descriptions :column="1" border><el-descriptions-item label="上报端点">{{ example.method }} {{ example.endpoint }}</el-descriptions-item><el-descriptions-item label="Schema 摘要">{{ example.schemaDigest }}</el-descriptions-item></el-descriptions>
      <fieldset :disabled="busy"><JsonEditor v-model="plaintext" :rows="17" label="SDK 明文输入 JSON" /></fieldset>
      <div class="section-heading"><h2>SDK 配置</h2><el-button :icon="Download" @click="download('sdk-config.json', pretty(example.sdkConfig))">下载配置</el-button></div>
      <pre class="json-output">{{ pretty(example.sdkConfig) }}</pre>
    </template>
    <section v-if="validation" class="section">
      <div class="section-heading"><h2>校验结果</h2><el-tag :type="validation.valid ? 'success' : 'danger'">{{ validation.valid ? '通过' : '未通过' }}</el-tag></div>
      <p v-if="validation.scope">{{ validation.scope }}</p>
      <h3>错误</h3><el-table :data="validation.errors || []" empty-text="无错误"><el-table-column prop="path" label="字段路径" min-width="200" /><el-table-column prop="code" label="代码" min-width="160" /><el-table-column prop="message" label="说明" min-width="280" /></el-table>
      <h3>待确认业务字段</h3><el-table :data="validation.requiredInputs || []" empty-text="无待确认字段"><el-table-column prop="path" label="字段路径" min-width="200" /><el-table-column prop="code" label="代码" min-width="160" /><el-table-column prop="message" label="说明" min-width="280" /></el-table>
    </section>
    <el-dialog v-model="schemaVisible" title="Schema 完整定义" width="min(920px, 94vw)"><pre class="json-output">{{ pretty(schema) }}</pre></el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Document, Download, Refresh } from '@element-plus/icons-vue';
import PageHeader from '@/components/common/PageHeader.vue';
import ApiOptionSelect from '@/components/common/ApiOptionSelect.vue';
import JsonEditor from '@/components/common/JsonEditor.vue';
import { apiErrorMessage } from '@/api/client';
import { integrationApi, type IntegrationSelection, type IntegrationSchema, type IntegrationExample, type IntegrationValidation, type SourceSystemKey, type TenantOption, type ProjectOption, type EventAuthorization } from '@/api/integration';
import type { SourceSystemManagement } from '@/api/governance';
import type { EventSchemaField } from '@/api/events';

const selection = reactive<IntegrationSelection>({ tenantId: '', projectSpaceId: '', sourceSystemId: '', sourceSystemKeyId: '', eventType: '', schemaVersion: '' });
const schema = ref<IntegrationSchema | null>(null), selectedKey = ref<SourceSystemKey | null>(null);
const example = ref<IntegrationExample | null>(null), validation = ref<IntegrationValidation | null>(null);
const sampleEventJson = ref(''), plaintext = ref(''), idempotencyKey = ref(''), error = ref('');
const generating = ref(false), validating = ref(false), schemaVisible = ref(false);
const busy = computed(() => generating.value || validating.value);
const ready = computed(() => Object.values(selection).every(Boolean));
const eventScope = computed(() => `${selection.tenantId}|${selection.projectSpaceId}`);
const schemaScope = computed(() => `${eventScope.value}|${selection.eventType}`);
const pretty = (value: unknown) => JSON.stringify(value, null, 2);
const loadTenants = (keyword: string, page: number) => integrationApi.tenants({ tenantName: keyword || undefined, page, size: 20 });
const loadProjects = (keyword: string, page: number) => integrationApi.projects({ projectName: keyword || undefined, page, size: 20 });
const loadSources = (keyword: string, page: number) => integrationApi.sources({ tenantId: selection.tenantId, keyword: keyword || undefined, page, size: 20 });
const loadKeys = (keyword: string, page: number) => integrationApi.keys({ sourceSystemId: selection.sourceSystemId, keyword: keyword || undefined, page, size: 20 });
const loadEvents = (keyword: string, page: number) => integrationApi.events({ tenantId: selection.tenantId, projectSpaceId: selection.projectSpaceId, keyword: keyword || undefined, page, size: 20 });
const loadSchemas = (keyword: string, page: number) => integrationApi.schemas({ tenantId: selection.tenantId, projectSpaceId: selection.projectSpaceId, eventType: selection.eventType, schemaVersion: keyword || undefined, page, size: 20 });
const tenantLabel = (item: TenantOption) => `${item.tenantName} (${item.tenantId})`;
const projectLabel = (item: ProjectOption) => `${item.projectName} (${item.projectCode}) · ${item.status}`;
const sourceLabel = (item: SourceSystemManagement) => `${item.sourceSystemName} (${item.sourceSystemCode})`;
const keyLabel = (item: SourceSystemKey) => `${item.id} · ${item.keyAlgorithm}/${item.dataAlgorithm}`;
const eventLabel = (item: EventAuthorization) => `${item.eventName} (${item.eventType})`;
const schemaLabel = (item: IntegrationSchema) => item.schemaVersion;
function clearOutput() { example.value = null; plaintext.value = ''; validation.value = null; error.value = ''; }
watch(() => selection.tenantId, () => { selection.sourceSystemId = ''; selection.sourceSystemKeyId = ''; selectedKey.value = null; selection.eventType = ''; selection.schemaVersion = ''; }, { flush: 'sync' });
watch(() => selection.projectSpaceId, () => { selection.eventType = ''; selection.schemaVersion = ''; }, { flush: 'sync' });
watch(() => selection.sourceSystemId, () => { selection.sourceSystemKeyId = ''; selectedKey.value = null; }, { flush: 'sync' });
watch(() => selection.eventType, () => { selection.schemaVersion = ''; }, { flush: 'sync' });
watch(() => selection.schemaVersion, () => { schema.value = null; sampleEventJson.value = ''; }, { flush: 'sync' });
watch(() => ({ ...selection }), clearOutput, { flush: 'sync' });
watch([sampleEventJson, idempotencyKey], clearOutput, { flush: 'sync' });
watch(plaintext, () => { validation.value = null; }, { flush: 'sync' });
function selectSchema(value?: IntegrationSchema) {
  schema.value = value || null;
  if (value) resetSample();
}
function sampleValue(field: EventSchemaField): unknown {
  switch (field.dataType) {
    case 'INTEGER': case 'DECIMAL': return null;
    case 'BOOLEAN': return false;
    case 'OBJECT': return {};
    case 'ARRAY': return [];
    default: return '';
  }
}
function resetSample() {
  if (!schema.value) return;
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const occurredAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  sampleEventJson.value = pretty({ eventType: selection.eventType, schemaVersion: selection.schemaVersion, sourceBusinessKey: '', occurredAt,
    payload: Object.fromEntries((schema.value.fields || []).map(field => [field.fieldName, sampleValue(field)])) });
}
function requireJsonObject(text: string) {
  if (new TextEncoder().encode(text).length > 2097152) throw new Error('JSON 不得超过 2 MiB');
  const data = JSON.parse(text);
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error('请输入 JSON 对象');
  return data;
}
async function generate() {
  if (!ready.value || busy.value) return;
  try {
    if (idempotencyKey.value && !/^[A-Za-z0-9._:-]{1,128}$/.test(idempotencyKey.value)) throw new Error('幂等键仅支持字母、数字及 . _ : -');
    if (sampleEventJson.value.trim()) {
      const sample = requireJsonObject(sampleEventJson.value);
      if (sample.eventType !== selection.eventType || sample.schemaVersion !== selection.schemaVersion) throw new Error('样例事件类型和版本必须与当前选择一致');
    }
  } catch (cause) { ElMessage.warning(cause instanceof Error ? cause.message : '样例 JSON 格式错误'); return; }
  generating.value = true; clearOutput();
  try {
    const result = await integrationApi.example({ ...selection, ...(sampleEventJson.value.trim() ? { sampleEventJson: sampleEventJson.value } : {}), ...(idempotencyKey.value ? { idempotencyKey: idempotencyKey.value } : {}) });
    example.value = result; plaintext.value = pretty(result.plaintextRequest); validation.value = result.validation;
  } catch (cause) { error.value = apiErrorMessage(cause, '生成明文模板失败'); }
  finally { generating.value = false; }
}
async function validate() {
  if (busy.value) return;
  try { requireJsonObject(plaintext.value); }
  catch (cause) { ElMessage.warning(cause instanceof Error ? cause.message : '明文 JSON 格式错误'); return; }
  validating.value = true; validation.value = null; error.value = '';
  try { validation.value = await integrationApi.validate(plaintext.value); }
  catch (cause) { error.value = apiErrorMessage(cause, '明文校验失败'); }
  finally { validating.value = false; }
}
function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<style scoped>
.selection-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0 18px; }
.section { margin-top: 20px; }
.section-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 22px 0 12px; }
h2 { margin: 0; font-size: 16px; }
h3 { font-size: 14px; margin: 18px 0 8px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.actions .el-button + .el-button { margin-left: 0; }
.digest { overflow-wrap: anywhere; font-family: monospace; margin-bottom: 12px; }
fieldset { min-width: 0; border: 0; margin: 12px 0 0; padding: 0; }
.json-output { max-height: 560px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; padding: 14px; border: 1px solid var(--color-border); background: var(--color-surface); font-size: 12px; line-height: 1.6; }
@media (max-width: 1100px) { .selection-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 700px) { .selection-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
